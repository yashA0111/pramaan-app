import os
import time
import base64
import traceback
import threading
import numpy as np
from typing import Dict, Any, Optional

try:
    import cv2
    cv2.setNumThreads(1)
    OPENCV_AVAILABLE = True
except ImportError:
    OPENCV_AVAILABLE = False


class FaceEngine:
    def __init__(self, models_dir: Optional[str] = None, default_threshold: float = 0.363):
        if models_dir is None:
            self.models_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "models")
        else:
            self.models_dir = os.path.abspath(models_dir)
        self.model_version = "pramaan-onnx-yunet-sface-1.0.0"
        self.threshold = default_threshold
        self.detector = None
        self.recognizer = None
        self._lock = threading.Lock()
        self._load_models()

    def _load_models(self):
        """Loads OpenCV YuNet and SFace ONNX models if present in models_dir."""
        if not OPENCV_AVAILABLE:
            print("[FaceEngine] OpenCV is not available in current python environment.")
            return

        yunet_path = os.path.join(self.models_dir, "face_detection_yunet_2023mar.onnx")
        sface_path = os.path.join(self.models_dir, "face_recognition_sface_2021dec.onnx")

        print(f"[FaceEngine] Loading models from directory: {self.models_dir}")
        print(f"[FaceEngine] YuNet path ({os.path.exists(yunet_path)}): {yunet_path}")
        print(f"[FaceEngine] SFace path ({os.path.exists(sface_path)}): {sface_path}")

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
                # Warmup inference graph on dummy input
                dummy = np.zeros((320, 320, 3), dtype=np.uint8)
                self.detector.setInputSize((320, 320))
                self.detector.detect(dummy)
                print("[FaceEngine] YuNet detector and SFace recognizer initialized & warmed up successfully.")
            except Exception as e:
                print(f"[FaceEngine] Failed to initialize OpenCV models: {e}")
                traceback.print_exc()
                self.detector = None
                self.recognizer = None
        else:
            print("[FaceEngine] Model files not found in models directory!")

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

        live_len = len(captured_frame_base64) if captured_frame_base64 else 0
        ref_len = len(reference_photo_base64) if reference_photo_base64 else 0
        print(f"[FaceEngine] Request for {clean_ref}: live_img bytes={live_len}, ref_img bytes={ref_len}, obs={observation}")

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

        if not OPENCV_AVAILABLE:
            return {
                "status": "requires_review",
                "match_result": "inconclusive",
                "confidence": None,
                "model_version": self.model_version,
                "reason": "OpenCV library is not available in the biometric runtime.",
            }

        if self.detector is None or self.recognizer is None:
            return {
                "status": "requires_review",
                "match_result": "inconclusive",
                "confidence": None,
                "model_version": self.model_version,
                "reason": f"Biometric models could not be loaded from {self.models_dir}.",
            }

        if not captured_frame_base64:
            return {
                "status": "no_face",
                "match_result": "not_performed",
                "confidence": None,
                "model_version": self.model_version,
                "reason": "No live camera frame was provided for face comparison.",
            }

        if not reference_photo_base64:
            return {
                "status": "requires_review",
                "match_result": "not_performed",
                "confidence": None,
                "model_version": self.model_version,
                "reason": f"No enrolled reference photo found in registry for credential {clean_ref}.",
            }

        # 2. Real ONNX / OpenCV inference
        try:
            live_img = self._decode_image(captured_frame_base64)
            ref_img = self._decode_image(reference_photo_base64)

            if live_img is None:
                print("[FaceEngine] Failed to decode live captured image!")
                return {
                    "status": "no_face",
                    "match_result": "not_performed",
                    "confidence": None,
                    "model_version": self.model_version,
                    "reason": "The captured camera frame could not be decoded as an image.",
                }

            if ref_img is None:
                print("[FaceEngine] Failed to decode reference photo image!")
                return {
                    "status": "requires_review",
                    "match_result": "not_performed",
                    "confidence": None,
                    "model_version": self.model_version,
                    "reason": "The credential reference photo could not be decoded as an image.",
                }

            # Resize images to standard inference dimension (max 480px) to ensure sub-200ms CPU inference
            live_img = self._resize_max_dim(live_img, max_dim=480)
            ref_img = self._resize_max_dim(ref_img, max_dim=480)

            with self._lock:
                # Detect live face
                h, w = live_img.shape[:2]
                self.detector.setInputSize((w, h))
                _, live_faces = self.detector.detect(live_img)
                num_live = len(live_faces) if live_faces is not None else 0
                print(f"[FaceEngine] Live frame shape=({w}x{h}), faces detected={num_live}")

                if live_faces is None or len(live_faces) == 0:
                    return {
                        "status": "no_face",
                        "match_result": "not_performed",
                        "confidence": None,
                        "model_version": self.model_version,
                        "reason": "YuNet face detector detected zero faces in the live camera frame.",
                    }

                if len(live_faces) > 1:
                    return {
                        "status": "multiple_faces",
                        "match_result": "not_performed",
                        "confidence": None,
                        "model_version": self.model_version,
                        "reason": f"YuNet detected {len(live_faces)} faces in live frame. Single face required.",
                    }

                # Detect reference face
                ref_h, ref_w = ref_img.shape[:2]
                self.detector.setInputSize((ref_w, ref_h))
                _, ref_faces = self.detector.detect(ref_img)
                num_ref = len(ref_faces) if ref_faces is not None else 0
                print(f"[FaceEngine] Reference image shape=({ref_w}x{ref_h}), faces detected={num_ref}")

                if ref_faces is None or len(ref_faces) == 0:
                    return {
                        "status": "requires_review",
                        "match_result": "inconclusive",
                        "confidence": None,
                        "model_version": self.model_version,
                        "reason": "YuNet face detector could not locate a face in the enrolled reference photograph.",
                    }

                # Extract SFace 128-d embeddings
                live_aligned = self.recognizer.alignCrop(live_img, live_faces[0])
                ref_aligned = self.recognizer.alignCrop(ref_img, ref_faces[0])

                live_feat = self.recognizer.feature(live_aligned)
                ref_feat = self.recognizer.feature(ref_aligned)

                # Cosine similarity score
                cosine_score = float(self.recognizer.match(live_feat, ref_feat, cv2.FaceRecognizerSF_FR_COSINE))
                print(f"[FaceEngine] Match cosine score: {cosine_score:.4f} (threshold={threshold})")

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
        except Exception as e:
            print(f"[FaceEngine] Exception during face comparison: {e}")
            traceback.print_exc()
            return {
                "status": "requires_review",
                "match_result": "inconclusive",
                "confidence": None,
                "model_version": self.model_version,
                "reason": f"Biometric inference error: {str(e)}",
            }

    def _decode_image(self, b64_str: str) -> Optional[np.ndarray]:
        """Decodes base64 string to OpenCV BGR image array."""
        try:
            if not b64_str or not isinstance(b64_str, str):
                return None
            if "," in b64_str:
                b64_str = b64_str.split(",", 1)[1]
            b64_str = b64_str.strip()
            img_bytes = base64.b64decode(b64_str)
            nparr = np.frombuffer(img_bytes, np.uint8)
            return cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        except Exception as e:
            print(f"[FaceEngine] Error decoding image base64: {e}")
            return None

    def _resize_max_dim(self, img: Optional[np.ndarray], max_dim: int = 480) -> Optional[np.ndarray]:
        """Rescales an image so its longest dimension is at most max_dim, preserving aspect ratio."""
        if img is None:
            return None
        if not OPENCV_AVAILABLE:
            return img
        h, w = img.shape[:2]
        if max(h, w) > max_dim:
            scale = max_dim / float(max(h, w))
            new_w = max(1, int(round(w * scale)))
            new_h = max(1, int(round(h * scale)))
            return cv2.resize(img, (new_w, new_h), interpolation=cv2.INTER_AREA)
        return img

