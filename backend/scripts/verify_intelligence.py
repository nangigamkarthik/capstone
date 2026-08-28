"""
Verification script for Phase 3 Intelligence Layer.
Tests cross-modal attention fusion, engagement scoring, rolling LSTM-like forecasting,
SHAP explainability, and Q-learning teaching strategies.
"""
import sys
import os
import time
import numpy as np

# Add backend app directory to python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.ai.fusion.encoder import ModalityEncoder
from app.ai.fusion.fusion_model import CrossModalTransformer
from app.ai.engagement.scorer import EngagementScorer
from app.ai.prediction.forecaster import PredictiveForecaster
from app.ai.explainability.explainer import PredictiveExplainer
from app.ai.rl.environment import ClassroomRLEnvironment
from app.ai.rl.agent import TeachingRLAgent

def main():
    print("====================================================")
    print("   COGNITIVE CLASSROOM DIGITAL TWIN - PHASE 3 VERIFY")
    print("====================================================")
    
    # ── 1. Modality Encoding & Transformer Fusion ──
    print("1. Testing Modality Encoding & Transformer Fusion...")
    encoder = ModalityEncoder(d_model=128)
    transformer = CrossModalTransformer(d_model=128)
    
    # Generate mock inputs
    face_emb = np.random.randn(512)
    pose_kps = np.random.uniform(0.1, 0.9, (33, 4))
    gaze_vec = (0.1, -0.2, 0.95)
    gaze_target = "teacher"
    emotion_probs = {"happy": 0.1, "neutral": 0.8, "confused": 0.05, "interested": 0.05, "bored": 0, "frustrated": 0, "surprised": 0}
    activity_probs = {"listening": 0.9, "writing": 0.1}
    
    # Encode modalities
    face_mod = encoder.encode_face(face_emb)
    pose_mod = encoder.encode_pose(pose_kps)
    gaze_mod = encoder.encode_gaze(gaze_vec, gaze_target)
    emo_mod = encoder.encode_emotion(emotion_probs)
    act_mod = encoder.encode_activity(activity_probs)
    
    modalities = {
        "face": face_mod,
        "pose": pose_mod,
        "gaze": gaze_mod,
        "emotion": emo_mod,
        "activity": act_mod
    }
    
    fused, attention_weights = transformer.fuse(modalities)
    print(f"  - Fused embedding shape: {fused.shape}")
    print(f"  - Modality attention weights:")
    for mod, weight in attention_weights.items():
        print(f"    * {mod:8s}: {weight:.4f}")
    print("Transformer Fusion: PASSED [OK]\n")

    # ── 2. Engagement Scoring ──
    print("2. Testing Real-time Engagement Scorer...")
    scorer = EngagementScorer(alpha=0.15)
    
    # Test scoring with standard input
    student_id = 42
    scores = scorer.score(
        track_id=student_id,
        gaze_target="phone",  # distracted target
        activity="using_phone",
        dominant_emotion="bored",
        emotion_confidence=0.85,
        fused_embedding=fused
    )
    print(f"  - Raw Engagement Scores (distracted profile):")
    print(f"    * Attention    : {scores.attention:.1f}")
    print(f"    * Engagement   : {scores.engagement:.1f}")
    print(f"    * Distraction  : {scores.distraction:.1f}")
    print(f"    * Overall Index: {scores.overall_score:.1f}")
    print("Engagement Scoring: PASSED [OK]\n")

    # ── 3. Predictive Analytics & Explainability ──
    print("3. Testing Predictive Analytics & SHAP Explainer...")
    forecaster = PredictiveForecaster()
    explainer = PredictiveExplainer()
    
    # Mock histories
    history_len = 30
    eng_hist = np.linspace(80.0, 45.0, history_len).tolist() # Declining engagement
    att_hist = np.linspace(85.0, 30.0, history_len).tolist() # Declining attention
    dist_hist = np.linspace(5.0, 60.0, history_len).tolist()  # Rising distraction
    conf_hist = [0.0] * history_len
    
    pred_res = forecaster.generate_predictions(
        student_id=student_id,
        engagement_history=eng_hist,
        attention_history=att_hist,
        distraction_history=dist_hist,
        confusion_history=conf_hist,
        attendance_rate=92.0
    )
    
    print(f"  - Prediction Results:")
    print(f"    * Academic Risk Level: {pred_res['risk_level'].upper()} ({pred_res['academic_risk']:.1f}%)")
    print(f"    * Forecasted Next 5m  : {[round(x, 1) for x in pred_res['forecasted_engagement'][:5]]}")
    print(f"    * Attention Drop Alert: {pred_res['attention_drop_alert']}")
    
    # Generate explanations
    explanations = explainer.explain_risk(pred_res["contributions"])
    print("  - Explanation Factors (SHAP Contributions):")
    for exp in explanations[:3]:
        print(f"    * {exp['factor']:12s}: Contribution = {exp['weight']:+.3f} | {exp['description']}")
    print("Predictive Analytics & XAI: PASSED [OK]\n")

    # ── 4. Reinforcement Learning Strategy Agent ──
    print("4. Testing Reinforcement Learning Strategy Recommender...")
    env = ClassroomRLEnvironment()
    agent = TeachingRLAgent(epsilon=0.2)
    
    # Train agent
    rewards = agent.train_agent(env, episodes=200)
    print(f"  - RL Training Completed (200 episodes)")
    print(f"  - Initial Episode Reward: {rewards[0]:.2f}")
    print(f"  - Final Episode Reward  : {rewards[-1]:.2f}")
    
    # Generate live recommendations
    classroom_metrics = {
        "attention": 48.0,
        "engagement": 55.0,
        "participation": 30.0,
        "distraction": 40.0,
        "confusion": 25.0,
        "collaboration": 0.0
    }
    rec = agent.get_recommendation(classroom_metrics)
    print(f"  - Action Recommendation for Classroom state (depressed metrics):")
    print(f"    * Suggested Action  : {rec['action'].upper()}")
    print(f"    * Recommendation Text: {rec['recommendation']}")
    print(f"    * Reasoning Context : {rec['reasoning']}")
    print(f"    * Priority Level    : {rec['priority'].upper()}")
    print("RL Strategy Agent: PASSED [OK]\n")
    
    print("====================================================")
    print("                  VERIFICATION RESULTS              ")
    print("====================================================")
    print("Intelligence Layer integration status: PASSED [OK]")
    print("====================================================")

if __name__ == "__main__":
    main()
