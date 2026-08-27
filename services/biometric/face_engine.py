"""
YuNet / SFace ONNX Face Engine for Pramaan.
Normalizes biometric outcomes into match, mismatch, no_face, multiple_faces, requires_review, quality_insufficient.
"""

import os
import time
import base64
import numpy as np
from typing import Dict, Any, Optional

try:
    import cv2
    OPENCV_AVAILABLE = True
except ImportError:
    OPENCV_AVAILABLE = False


class FaceEngine:
    def __init__(self, models_dir: str = "./models", default_threshold: float = 0.363):
        self.models_dir = models_dir
        self.model_version = "pramaan-onnx-yunet-sface-1.0.0"
        self.threshold = default_threshold
        self.detector = None
        self.recognizer = None
        self._load_models()

    def _load_models(self):
        """Loads OpenCV YuNet and SFace ONNX models if present in models_dir."""
        if not OPENCV_AVAILABLE:
            return

        yunet_path = os.path.join(self.models_dir, "face_detection_yunet_2023mar.onnx")
        sface_path = os.path.join(self.models_dir, "face_recognition_sface_2021dec.onnx")

        if os.path.exists(yunet_path) and os.path.exists(sface_path):
            try:
                self.detector = cv2.FaceDetectorYN.create(
                    model=yunet_path,
                    config="",
                    input_size=(320, 320),
                    score_threshold=0.6,
                    nms_threshold=0.3,
                    top_k=5000,
                )
                self.recognizer = cv2.FaceRecognizerSF.create(
                    model=sface_path,
                    config="",
                )
            except Exception:
                self.detector = None
                self.recognizer = None

    def compare_faces(
        self,
        credential_reference: str,
        observation: str = "single_face",
        quality: float = 1.0,
        captured_frame_base64: Optional[str] = None,
        reference_photo_base64: Optional[str] = None,
        threshold_override: Optional[float] = None,
    ) -> Dict[str, Any]:
        """
        Evaluates biometric similarity between captured frame and reference photo.
        Returns normalized status, match_result, confidence, model_version, reason.
        """
        clean_ref = (credential_reference or "").strip().upper()
        threshold = threshold_override if threshold_override is not None else self.threshold

        # 1. Observation-level guard rails
        if observation == "no_face":
            return {
                "status": "no_face",
                "match_result": "not_performed",
                "confidence": None,
                "model_version": self.model_version,
                "reason": "No face was detected in the captured frame.",
            }

        if observation == "multiple_faces":
            return {
                "status": "multiple_faces",
                "match_result": "not_performed",
                "confidence": None,
                "model_version": self.model_version,
                "reason": "More than one face was present — capture a single subject.",
            }

        if quality < 0.35:
            return {
                "status": "requires_review",
                "match_result": "inconclusive",
                "confidence": float(quality),
                "model_version": self.model_version,
                "reason": "Captured frame image quality is insufficient for automatic match.",
            }

        # 2. Real ONNX / OpenCV inference if image bytes are supplied and models loaded
        if (
            OPENCV_AVAILABLE
            and self.detector is not None
            and self.recognizer is not None
            and captured_frame_base64
            and reference_photo_base64
        ):
            try:
                live_img = self._decode_image(captured_frame_base64)
                ref_img = self._decode_image(reference_photo_base64)

                if live_img is not None and ref_img is not None:
                    # Detect live face
                    h, w = live_img.shape[:2]
                    self.detector.setInputSize((w, h))
                    _, live_faces = self.detector.detect(live_img)

                    if live_faces is None or len(live_faces) == 0:
                        return {
                            "status": "no_face",
                            "match_result": "not_performed",
                            "confidence": None,
                            "model_version": self.model_version,
                            "reason": "YuNet face detector detected zero faces in the live frame.",
                        }

                    if len(live_faces) > 1:
                        return {
                            "status": "multiple_faces",
                            "match_result": "not_performed",
                            "confidence": None,
                            "model_version": self.model_version,
                            "reason": f"YuNet face detector detected {len(live_faces)} faces in frame.",
                        }

                    # Detect reference face
                    ref_h, ref_w = ref_img.shape[:2]
                    self.detector.setInputSize((ref_w, ref_h))
                    _, ref_faces = self.detector.detect(ref_img)

                    if ref_faces is not None and len(ref_faces) > 0:
                        # Extract SFace 128-d embeddings
                        live_aligned = self.recognizer.alignCrop(live_img, live_faces[0])
                        ref_aligned = self.recognizer.alignCrop(ref_img, ref_faces[0])

                        live_feat = self.recognizer.feature(live_aligned)
                        ref_feat = self.recognizer.feature(ref_aligned)

                        # Cosine similarity score
                        cosine_score = float(self.recognizer.match(live_feat, ref_feat, cv2.FaceRecognizerSF_FR_COSINE))

                        if cosine_score >= threshold:
                            return {
                                "status": "match",
                                "match_result": "match",
                                "confidence": round(cosine_score, 4),
                                "model_version": self.model_version,
                                "reason": f"1:1 face embedding matched (cosine: {round(cosine_score, 3)} >= threshold: {threshold}).",
                            }
                        elif cosine_score >= (threshold - 0.08):
                            return {
                                "status": "requires_review",
                                "match_result": "inconclusive",
                                "confidence": round(cosine_score, 4),
                                "model_version": self.model_version,
                                "reason": f"1:1 face comparison borderline (cosine: {round(cosine_score, 3)}, threshold: {threshold}).",
                            }
                        else:
                            return {
                                "status": "mismatch",
                                "match_result": "mismatch",
                                "confidence": round(cosine_score, 4),
                                "model_version": self.model_version,
                                "reason": f"1:1 face comparison mismatch (cosine: {round(cosine_score, 3)} < threshold: {threshold}).",
                            }
            except Exception:
                pass

        return {
            "status": "requires_review",
            "match_result": "not_performed",
            "confidence": None,
            "model_version": self.model_version,
            "reason": "Both captured and reference face images are required for biometric comparison.",
        }

    def _decode_image(self, b64_str: str) -> Optional[np.ndarray]:
        """Decodes base64 string to OpenCV BGR image array."""
        try:
            if "," in b64_str:
                b64_str = b64_str.split(",")[1]
            img_bytes = base64.b64decode(b64_str)
            nparr = np.frombuffer(img_bytes, np.uint8)
            return cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        except Exception:
            return None
