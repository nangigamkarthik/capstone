"""
Research Tooling — YOLO & COCO Dataset Exporter

Converts database-stored classroom detections and tracking labels into standard
deep learning formats (YOLO text formats & MS COCO JSON annotation format)
for training downstream models.
"""
import os
import json
from typing import Dict, List, Tuple
from loguru import logger

class DatasetExporter:
    """
    Exports bounding box detections to COCO or YOLO format for research publication.
    """

    def __init__(self, output_dir: str):
        self.output_dir = output_dir
        os.makedirs(output_dir, exist_ok=True)

    def export_to_yolo(
        self,
        image_name: str,
        image_shape: Tuple[int, int],
        bboxes: List[Tuple[float, float, float, float]],
        class_ids: List[int],
    ):
        """
        Export a single image annotations in YOLO format:
        class_id center_x center_y width height (all normalized [0, 1])
        """
        h, w = image_shape
        yolo_lines = []
        
        for bbox, cid in zip(bboxes, class_ids):
            x1, y1, x2, y2 = bbox
            
            # Convert to normalized center_x, center_y, width, height
            bw = (x2 - x1) / w
            bh = (y2 - y1) / h
            cx = (x1 + x2) / (2 * w)
            cy = (y1 + y2) / (2 * h)
            
            yolo_lines.append(f"{cid} {cx:.6f} {cy:.6f} {bw:.6f} {bh:.6f}")
            
        txt_name = os.path.splitext(image_name)[0] + ".txt"
        txt_path = os.path.join(self.output_dir, txt_name)
        
        with open(txt_path, "w") as f:
            f.write("\n".join(yolo_lines))
            
        logger.debug(f"Exported YOLO annotations to {txt_path}")

    def export_to_coco(
        self,
        export_name: str,
        images_info: List[Dict],  # List of {"id": int, "file_name": str, "width": int, "height": int}
        annotations: List[Dict],  # List of {"id": int, "image_id": int, "category_id": int, "bbox": [x,y,w,h]}
    ):
        """
        Export full dataset to a single MS COCO JSON file.
        """
        coco_data = {
            "info": {
                "description": "Cognitive Classroom Digital Twin Dataset",
                "version": "1.0",
                "year": 2026,
                "date_created": "2026/07/11"
            },
            "licenses": [],
            "images": images_info,
            "annotations": annotations,
            "categories": [
                {"id": 0, "name": "student", "supercategory": "person"},
                {"id": 1, "name": "teacher", "supercategory": "person"}
            ]
        }
        
        json_path = os.path.join(self.output_dir, f"{export_name}.json")
        with open(json_path, "w") as f:
            json.dump(coco_data, f, indent=4)
            
        logger.info(f"Exported COCO dataset containing {len(images_info)} images to {json_path}")
