"""
Research Tooling — Synthetic Frame & Bounding Box Annotation Generator

Generates large datasets of simulated classroom scenarios with ground-truth labels
(engagement, keypoint vectors, bounding boxes) for model profiling and training.
"""
import numpy as np
import os
from typing import Dict, List, Tuple
from loguru import logger

class AnnotationGenerator:
    """
    Generates synthetic annotation sets mimicking classroom layout grids.
    """

    def __init__(self, seed: int = 42):
        self.rng = np.random.RandomState(seed)

    def generate_synthetic_scene(
        self,
        image_shape: Tuple[int, int] = (720, 1280),
        n_students: int = 15,
    ) -> Tuple[List[Dict], List[Dict]]:
        """
        Generate a set of images and corresponding annotations.
        """
        h, w = image_shape
        images_info = []
        annotations = []
        
        # Grid layout for students
        cols = 5
        rows = (n_students + cols - 1) // cols
        
        ann_id = 1
        
        # Generate 10 mock frames
        for frame_idx in range(10):
            img_id = frame_idx + 1
            images_info.append({
                "id": img_id,
                "file_name": f"frame_{frame_idx:04d}.jpg",
                "width": w,
                "height": h
            })
            
            # Place students
            for i in range(n_students):
                r = i // cols
                c = i % cols
                
                # Base grid positions + minor randomized jitter
                cx = int((c + 0.5) * w / cols) + self.rng.randint(-15, 15)
                cy = 300 + r * 120 + self.rng.randint(-10, 10)
                
                bw = self.rng.randint(60, 90)
                bh = self.rng.randint(120, 180)
                
                x1 = float(max(0, cx - bw // 2))
                y1 = float(max(0, cy - bh // 2))
                x_w = float(min(w - x1, bw))
                y_h = float(min(h - y1, bh))
                
                annotations.append({
                    "id": ann_id,
                    "image_id": img_id,
                    "category_id": 0,  # 0 = student
                    "bbox": [x1, y1, x_w, y_h],
                    "area": float(x_w * y_h),
                    "iscrowd": 0,
                    "engagement": float(self.rng.uniform(40.0, 100.0))
                })
                ann_id += 1
                
        logger.info(f"Generated synthetic dataset containing {len(images_info)} frames and {len(annotations)} labels.")
        return images_info, annotations
