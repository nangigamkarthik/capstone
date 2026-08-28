# 🧠 Cognitive Classroom Digital Twin Platform

A research-grade AI-powered digital twin platform to analyze student behaviors, teacher movement paths, classroom interaction dynamics, and overall learning engagement states.

## Architecture

The platform processes multiple camera streams, performing:
1. **Student Detection & Tracking** (YOLO26 + ByteTrack)
2. **Face & Pose Analysis** (InsightFace + MediaPipe)
3. **Multimodal Fusion** (Cross-attention Transformer)
4. **Predictive AI & Explainable AI** (SHAP explanation vectors)
5. **Real-time 3D Digital Twin** (React Three Fiber)

## Quick Start (Docker)

To run the local database, caching layers, and background workers:
```bash
make dev
```

To run the FastAPI backend server:
```bash
make dev-backend
```

To run the Vite-powered frontend React app:
```bash
make dev-frontend
```

## Tech Stack
- **Backend:** FastAPI, SQLAlchemy 2.0, PostgreSQL, Celery, Redis
- **Frontend:** React, TypeScript, Tailwind CSS, Zustand, react-chartjs-2
- **3D Engine:** Three.js, React Three Fiber, React Three Drei
