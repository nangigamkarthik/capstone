"""
Research Evaluation — Core Scientific Metrics

Computes standard research metrics for evaluation of student classification
models (YOLO detection, active engagement prediction accuracy, confusion detection).
Metrics: Precision, Recall, F1, Accuracy, Confusion Matrix, and mAP approximations.
"""
import numpy as np
from typing import Dict, List, Tuple

class ScienceMetricsEvaluator:
    """
    Computes scientific scoring benchmarks for computer vision models
    and behavioral predictors.
    """

    @staticmethod
    def calculate_classification_metrics(
        y_true: np.ndarray,
        y_pred: np.ndarray,
    ) -> Dict[str, float]:
        """
        Compute standard accuracy, precision, recall, and F1.
        """
        accuracy = float(np.mean(y_true == y_pred))
        
        # Calculate per-class metrics (assuming binary 0 or 1 for simplicity)
        tp = int(np.sum((y_true == 1) & (y_pred == 1)))
        fp = int(np.sum((y_true == 0) & (y_pred == 1)))
        fn = int(np.sum((y_true == 1) & (y_pred == 0)))
        tn = int(np.sum((y_true == 0) & (y_pred == 0)))
        
        precision = tp / (tp + fp) if (tp + fp) > 0 else 0.0
        recall = tp / (tp + fn) if (tp + fn) > 0 else 0.0
        f1_score = 2 * precision * recall / (precision + recall) if (precision + recall) > 0 else 0.0
        
        return {
            "accuracy": round(accuracy, 4),
            "precision": round(precision, 4),
            "recall": round(recall, 4),
            "f1_score": round(f1_score, 4),
            "confusion_matrix": {"TP": tp, "FP": fp, "FN": fn, "TN": tn}
        }

    @staticmethod
    def calculate_mae_rmse(
        y_true: np.ndarray,
        y_pred: np.ndarray,
    ) -> Dict[str, float]:
        """
        Compute Mean Absolute Error and Root Mean Squared Error for regression models
        (e.g., engagement prediction scores, forecast curves).
        """
        mae = float(np.mean(np.abs(y_true - y_pred)))
        rmse = float(np.sqrt(np.mean((y_true - y_pred) ** 2)))
        return {
            "mae": round(mae, 4),
            "rmse": round(rmse, 4)
        }

    @staticmethod
    def calculate_intersection_over_union(box_a: Tuple, box_b: Tuple) -> float:
        """Compute IoU between two (x1, y1, x2, y2) bounding boxes."""
        x1 = max(box_a[0], box_b[0])
        y1 = max(box_a[1], box_b[1])
        x2 = min(box_a[2], box_b[2])
        y2 = min(box_a[3], box_b[3])

        inter_area = max(0, x2 - x1) * max(0, y2 - y1)
        area_a = (box_a[2] - box_a[0]) * (box_a[3] - box_a[1])
        area_b = (box_b[2] - box_b[0]) * (box_b[3] - box_b[1])
        union_area = area_a + area_b - inter_area

        return inter_area / union_area if union_area > 0 else 0.0
