"""
Real-Time Streamer — Bridges AI Pipeline, Database & WebSockets

Simulates a live lecture loop by pulling frames from the DemoSimulator,
processing them through the CVPipeline, saving results to the TimescaleDB database,
and broadcasting state updates over the WebSockets channels in real-time.
"""
import asyncio
import time
import json
import numpy as np
from datetime import datetime
from typing import Optional
from loguru import logger

from app.core.config import settings
from app.infrastructure.database.session import async_session_maker
from app.infrastructure.websocket.manager import manager
from app.ai.pipeline import CVPipeline
from app.ai.engagement.scorer import EngagementScorer
from app.ai.prediction.forecaster import PredictiveForecaster
from app.ai.explainability.explainer import PredictiveExplainer
from app.ai.speech.transcriber import WhisperTranscriber
from app.ai.speech.diarizer import SpeakerDiarizer
from app.ai.speech.analyzer import TranscriptAnalyzer
from app.ai.rag.engine import RAGEngine
from app.ai.knowledge_graph.graph import ClassroomKnowledgeGraph
from app.ai.copilot.engine import CopilotEngine

# Database Model Imports
from app.infrastructure.database.models.classroom_data import (
    StudentDetection, PoseSnapshot, HeadPoseSnapshot, GazeSnapshot, EmotionSnapshot, ActivityEvent
)
from app.infrastructure.database.models.analytics import (
    EngagementScore, EnvironmentMetrics
)
from app.infrastructure.database.models.speech_and_knowledge import Transcript

# Active lecture streams catalog (lecture_id -> task)
active_streams = {}

class LectureStreamer:
    """
    Manages the processing loop for a single active lecture session.
    """

    def __init__(self, lecture_id: int, room_id: int):
        self.lecture_id = lecture_id
        self.room_id = room_id
        self.running = False
        self.task: Optional[asyncio.Task] = None
        
        # Initialize full AI Pipeline
        self.pipeline = CVPipeline(
            detector_model_size="n",
            room_capacity=30,
            enable_face=True,
            enable_emotion=True,
            teacher_track_id=1,
        )
        self.engagement_scorer = EngagementScorer(alpha=0.15)
        self.forecaster = PredictiveForecaster()
        self.explainer = PredictiveExplainer()
        self.transcriber = WhisperTranscriber()
        self.diarizer = SpeakerDiarizer()
        self.transcript_analyzer = TranscriptAnalyzer()
        self.rag = RAGEngine()
        self.kg = ClassroomKnowledgeGraph()
        self.copilot = CopilotEngine(self.rag, self.kg)

    async def start(self):
        """Start the real-time processing loop in the background."""
        if self.running:
            return
        self.running = True
        self.task = asyncio.create_task(self._loop())
        logger.info(f"Started real-time streamer loop for lecture {self.lecture_id}")

    async def stop(self):
        """Stop the processing loop."""
        if not self.running:
            return
        self.running = False
        if self.task:
            self.task.cancel()
            try:
                await self.task
            except asyncio.CancelledError:
                pass
        logger.info(f"Stopped real-time streamer loop for lecture {self.lecture_id}")

    async def _loop(self):
        from app.ai.camera.manager import DemoSimulator
        
        # Initialize simulator
        simulator = DemoSimulator(resolution=(1280, 720), fps=5.0, n_students=8)
        frame_idx = 0
        
        # Maintain history lists for prediction inputs
        student_histories = {} # student_id -> dict of lists
        
        while self.running:
            t_frame_start = time.perf_counter()
            frame_idx += 1
            
            # 1. Grab simulated frame & audio
            frame = simulator.generate_frame()
            dummy_audio = np.random.uniform(-0.005, 0.005, 1600).astype(np.float32)
            
            # 2. Process CV pipeline
            cv_res = self.pipeline.process_frame(frame, dummy_audio)
            
            # 3. Transcribe speech segment (simulated text)
            transcript_text = self.transcriber.transcribe(dummy_audio)
            mock_audio_emb = np.random.randn(128)
            speaker_role = self.diarizer.diarize_segment(mock_audio_emb, speaker_face_talking=True)
            
            # 4. Ingest transcript to RAG database
            self.rag.ingest_transcript(self.lecture_id, transcript_text)
            
            # 5. Extract keywords/topics from text
            keywords = self.transcript_analyzer.extract_keywords(transcript_text)
            topics = self.transcript_analyzer.extract_topics(transcript_text)
            
            # 6. Database Session for writes
            async with async_session_maker() as db:
                try:
                    # Save environmental metrics
                    env_metric = EnvironmentMetrics(
                        lecture_id=self.lecture_id,
                        timestamp=datetime.utcnow(),
                        lighting_score=cv_res.environment["lighting"],
                        noise_level=cv_res.environment["noise"],
                        occupancy=cv_res.student_count,
                        capacity=self.pipeline.environment_analyzer.capacity,
                        seat_utilization=cv_res.environment["utilization"],
                        density_score=cv_res.environment["utilization"] * 100.0,
                        overall_score=cv_res.environment["quality_score"]
                    )
                    db.add(env_metric)
                    
                    # Save transcript chunk
                    db_transcript = Transcript(
                        lecture_id=self.lecture_id,
                        start_time=datetime.utcnow(),
                        end_time=datetime.utcnow(),
                        speaker_type=speaker_role,
                        text=transcript_text,
                        confidence=0.9,
                        keywords_json={"keywords": keywords},
                        language="en"
                    )
                    db.add(db_transcript)
                    
                    student_snapshots = []
                    
                    # Process and score each detected person
                    for person in cv_res.persons:
                        if person.is_teacher:
                            continue
                            
                        # Use track_id as temporary student_id for tracking
                        student_id = person.track_id
                        
                        # Score engagement
                        scores = self.engagement_scorer.score(
                            track_id=student_id,
                            gaze_target=person.gaze_target,
                            activity=person.activity,
                            dominant_emotion=person.dominant_emotion,
                            emotion_confidence=person.emotion_confidence
                        )
                        
                        # Update rolling history for forecasting
                        if student_id not in student_histories:
                            student_histories[student_id] = {
                                "eng": [], "att": [], "dist": [], "conf": []
                            }
                        sh = student_histories[student_id]
                        sh["eng"].append(scores.engagement)
                        sh["att"].append(scores.attention)
                        sh["dist"].append(scores.distraction)
                        sh["conf"].append(scores.confusion)
                        
                        # Keep window size at 30
                        for k in sh:
                            if len(sh[k]) > 30:
                                sh[k].pop(0)
                                
                        # Predict future dropouts and academic risk
                        pred = self.forecaster.generate_predictions(
                            student_id=student_id,
                            engagement_history=sh["eng"],
                            attention_history=sh["att"],
                            distraction_history=sh["dist"],
                            confusion_history=sh["conf"]
                        )
                        
                        # Add struggle to KG if confusion is high
                        if scores.confusion > 30.0 and topics:
                            self.kg.tag_student_struggle(student_id, topics[0], scores.confusion)
                            
                        # 3D position logic
                        px = (person.bbox[0] + person.bbox[2]) / 200.0 - 3.0
                        pz = (person.bbox[1] + person.bbox[3]) / 200.0
                        pos_3d = {"x": px, "y": 0.0, "z": pz}

                        db_det = StudentDetection(
                            student_id=student_id,
                            lecture_id=self.lecture_id,
                            timestamp=datetime.utcnow(),
                            bbox_json={"x1": person.bbox[0], "y1": person.bbox[1], "x2": person.bbox[2], "y2": person.bbox[3]},
                            position_3d_json=pos_3d,
                            seat_id=person.seat_id,
                            tracking_id=person.track_id,
                            confidence=0.9
                        )
                        db.add(db_det)
                        
                        db_score = EngagementScore(
                            student_id=student_id,
                            lecture_id=self.lecture_id,
                            timestamp=datetime.utcnow(),
                            attention=scores.attention,
                            engagement=scores.engagement,
                            participation=scores.participation,
                            distraction=scores.distraction,
                            confusion=scores.confusion,
                            collaboration=scores.collaboration,
                            overall_score=scores.overall_score
                        )
                        db.add(db_score)

                        # Write PoseSnapshot
                        db_pose = PoseSnapshot(
                            student_id=student_id,
                            lecture_id=self.lecture_id,
                            timestamp=datetime.utcnow(),
                            keypoints_json={"kps": []},
                            confidence=person.pose_confidence
                        )
                        db.add(db_pose)

                        # Write HeadPoseSnapshot
                        db_head = HeadPoseSnapshot(
                            student_id=student_id,
                            lecture_id=self.lecture_id,
                            timestamp=datetime.utcnow(),
                            yaw=person.head_yaw,
                            pitch=person.head_pitch,
                            roll=person.head_roll,
                            confidence=0.9
                        )
                        db.add(db_head)

                        # Write GazeSnapshot
                        db_gaze = GazeSnapshot(
                            student_id=student_id,
                            lecture_id=self.lecture_id,
                            timestamp=datetime.utcnow(),
                            gaze_vector_json={"x": 0.0, "y": 0.0, "z": 1.0},
                            gaze_target=person.gaze_target,
                            confidence=person.gaze_confidence
                        )
                        db.add(db_gaze)

                        # Write EmotionSnapshot
                        db_emotion = EmotionSnapshot(
                            student_id=student_id,
                            lecture_id=self.lecture_id,
                            timestamp=datetime.utcnow(),
                            emotions_json={"neutral": 1.0},
                            dominant_emotion=person.dominant_emotion,
                            confidence=person.emotion_confidence
                        )
                        db.add(db_emotion)

                        # Write ActivityEvent
                        db_activity = ActivityEvent(
                            student_id=student_id,
                            lecture_id=self.lecture_id,
                            timestamp=datetime.utcnow(),
                            activity_type=person.activity,
                            duration_seconds=1.0,
                            confidence=person.activity_confidence
                        )
                        db.add(db_activity)
                        
                        student_snapshots.append({
                            "id": student_id,
                            "name": person.identity_name or f"Student {student_id}",
                            "position": pos_3d,
                            "engagement": round(scores.overall_score, 1),
                            "emotion": person.dominant_emotion,
                            "activity": person.activity,
                            "gaze_target": person.gaze_target,
                            "risk": pred["risk_level"]
                        })
                        
                    await db.commit()
                    
                    # 7. Generate Copilot suggest based on current stats
                    avg_att = np.mean([s["engagement"] for s in student_snapshots]) if student_snapshots else 70.0
                    avg_conf = np.mean([student_histories[sid]["conf"][-1] for sid in student_histories if student_histories[sid]["conf"]]) if student_histories else 5.0
                    at_risk_list = [s for s in student_snapshots if s["risk"] == "high"]
                    
                    copilot_res = self.copilot.generate_suggestion(
                        avg_attention=avg_att,
                        avg_confusion=avg_conf,
                        at_risk_students=at_risk_list,
                        current_topic=topics[0] if topics else "gradients"
                    )
                    
                    # 8. Broadcast over WebSocket channels
                    lecture_ts = datetime.utcnow().isoformat()
                    
                    env_payload = {
                        "lighting": cv_res.environment["lighting"],
                        "noise": cv_res.environment["noise"],
                        "occupancy": cv_res.student_count,
                        "capacity": self.pipeline.environment_analyzer.capacity,
                        "utilization": cv_res.environment["utilization"],
                        "quality_score": cv_res.environment["quality_score"]
                    }

                    # Channel 1: ws/classroom/{id}
                    await manager.broadcast({
                        "type": "classroom_update",
                        "timestamp": lecture_ts,
                        "data": {
                            "students": student_snapshots,
                            "environment": env_payload
                        }
                    }, f"classroom_{self.lecture_id}")
                    
                    # Channel 2: ws/twin/{id}
                    await manager.broadcast({
                        "type": "twin_update",
                        "timestamp": lecture_ts,
                        "data": {
                            "students": [{
                                "id": s["id"],
                                "name": s["name"],
                                "position": s["position"],
                                "engagement": s["engagement"],
                                "emotion": s["emotion"],
                                "activity": s["activity"],
                                "gazeTarget": s["gaze_target"]
                            } for s in student_snapshots]
                        }
                    }, f"twin_{self.lecture_id}")
                    
                    # Channel 3: ws/copilot/{id}
                    await manager.broadcast({
                        "type": "copilot_suggestion",
                        "timestamp": lecture_ts,
                        "data": {
                            "suggestion": copilot_res["suggestion"],
                            "reasoning": copilot_res["reasoning"],
                            "priority": copilot_res["priority"],
                            "action_type": copilot_res["action_type"]
                        }
                    }, f"copilot_{self.lecture_id}")
                    
                    # Channel 4: ws/analytics/{id}
                    await manager.broadcast({
                        "type": "analytics_feed",
                        "timestamp": lecture_ts,
                        "data": {
                            "avg_attention": round(avg_att, 1),
                            "avg_confusion": round(avg_conf, 1),
                            "active_alerts": len(at_risk_list),
                            "transcript_segment": transcript_text
                        }
                    }, f"analytics_{self.lecture_id}")
                    
                except Exception as e:
                    logger.error(f"Error in streamer DB write loop: {e}")
                    await db.rollback()

            # Dynamic sleep to hit target 5.0 FPS loop speed
            elapsed = time.perf_counter() - t_frame_start
            sleep_time = max(0.01, (1.0 / 5.0) - elapsed)
            await asyncio.sleep(sleep_time)


async def start_lecture_stream(lecture_id: int, room_id: int):
    """API gateway wrapper to trigger background streams."""
    if lecture_id in active_streams:
        return
    streamer = LectureStreamer(lecture_id, room_id)
    active_streams[lecture_id] = streamer
    await streamer.start()

async def stop_lecture_stream(lecture_id: int):
    """API gateway wrapper to stop streams."""
    if lecture_id not in active_streams:
        return
    streamer = active_streams[lecture_id]
    await streamer.stop()
    del active_streams[lecture_id]
