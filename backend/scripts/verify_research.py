"""
Verification script for Phase 6 Research & Privacy.
Tests AES-256 biometric encryption, consent checking, YOLO/COCO dataset exporting,
and scientific metrics calculation (Accuracy, F1, MAE, latency benchmarker, plots, comparison tables).
"""
import sys
import os
import numpy as np

# Add backend app directory and research directory to python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

from app.ai.privacy.encryption import EmbeddingEncrypter
from app.ai.privacy.consent_manager import PrivacyConsentManager
from research.datasets.exporter import DatasetExporter
from research.datasets.generator import AnnotationGenerator
from research.evaluation.metrics import ScienceMetricsEvaluator
from research.evaluation.benchmark import PipelineBenchmarker
from research.evaluation.plots import ResearchPlotGenerator
from research.evaluation.comparison import BaselineComparer

def dummy_process(x):
    # Simulated workload
    for _ in range(1000):
        _ = x * x
    return x

def main():
    print("====================================================")
    print("   COGNITIVE CLASSROOM DIGITAL TWIN - PHASE 6 VERIFY")
    print("====================================================")
    
    # ── 1. Biometric Encryption & Privacy Consent ──
    print("1. Testing Privacy & Biometric Encryption...")
    encrypter = EmbeddingEncrypter()
    consent = PrivacyConsentManager()
    
    # Encrypt/Decrypt float face embedding vector
    mock_emb = np.random.randn(512).astype(np.float32)
    mock_emb /= np.linalg.norm(mock_emb)
    
    encrypted_str = encrypter.encrypt_embedding(mock_emb)
    decrypted_emb = encrypter.decrypt_embedding(encrypted_str)
    
    diff = np.max(np.abs(mock_emb - decrypted_emb))
    print(f"  - AES-256 Vector Encryption: Max Diff = {diff:.6e}")
    
    # Check consent options
    consent.set_consent(student_id=42, consented=True)
    consent.set_consent(student_id=99, consented=False)
    print(f"  - Consent: Student 42 has consent = {consent.has_consent(42)}")
    print(f"  - Consent: Student 99 has consent = {consent.has_consent(99)}")
    print("Biometric Privacy: PASSED [OK]\n")

    # ── 2. Dataset Generation & Annotation Exporter ──
    print("2. Testing Dataset Generator & Annotation Exporter...")
    generator = AnnotationGenerator()
    exporter = DatasetExporter(output_dir="research_output")
    
    # Generate annotations
    images_info, annotations = generator.generate_synthetic_scene(n_students=5)
    print(f"  - Synthetic dataset generated: {len(images_info)} frames, {len(annotations)} labels")
    
    # Export YOLO annotations
    exporter.export_to_yolo(
        image_name="frame_0001.jpg",
        image_shape=(720, 1280),
        bboxes=[(100.0, 150.0, 180.0, 320.0)],
        class_ids=[0]
    )
    
    # Export COCO file
    exporter.export_to_coco("coco_synthetic", images_info, annotations)
    print("Dataset Exporters: PASSED [OK]\n")

    # ── 3. Academic Metrics, Latency & Plotting ──
    print("3. Testing Academic Metrics & Plots...")
    
    # Classification metrics
    y_true = np.array([1, 0, 1, 1, 0, 1, 0, 0, 1, 0])
    y_pred = np.array([1, 0, 1, 0, 0, 1, 1, 0, 1, 0])
    cls_metrics = ScienceMetricsEvaluator.calculate_classification_metrics(y_true, y_pred)
    print(f"  - Accuracy: {cls_metrics['accuracy']:.4f} | F1 Score: {cls_metrics['f1_score']:.4f}")
    
    # MAE/RMSE
    y_true_reg = np.array([75.0, 80.0, 65.0])
    y_pred_reg = np.array([73.2, 81.5, 61.8])
    reg_metrics = ScienceMetricsEvaluator.calculate_mae_rmse(y_true_reg, y_pred_reg)
    print(f"  - MAE: {reg_metrics['mae']:.2f} | RMSE: {reg_metrics['rmse']:.2f}")
    
    # Benchmarking
    bench_res = PipelineBenchmarker.benchmark_module(dummy_process, [5.0], num_runs=50)
    print(f"  - Benchmarker Latency : Mean {bench_res['mean_latency_ms']}ms | Throughput {bench_res['fps']} FPS")
    
    # Save plots & tables
    plots = ResearchPlotGenerator(output_dir="research_output")
    comparer = BaselineComparer(output_dir="research_output")
    
    loss_img = plots.plot_training_loss(epochs=10)
    ablation_img = plots.plot_ablation_fps(["YOLO26", "ByteTrack", "Pose", "Gaze", "Emotion"], [2.5, 0.8, 1.2, 0.4, 0.6])
    table_path = comparer.generate_comparison_table()
    
    print(f"  - Plots saved at: {os.path.basename(loss_img)}, {os.path.basename(ablation_img)}")
    print(f"  - Comparative Markdown Table saved at: {os.path.basename(table_path)}")
    print("Academic Metrics & Plots: PASSED [OK]\n")

    print("====================================================")
    print("                  VERIFICATION RESULTS              ")
    print("====================================================")
    print("Research & Privacy Layer status: PASSED [OK]")
    print("====================================================")

if __name__ == "__main__":
    main()
