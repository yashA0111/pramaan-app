"""
Model downloader for OpenCV YuNet (face detection) and SFace (face recognition) ONNX models.
Downloads from HuggingFace / OpenCV Zoo with Git LFS pointer validation and retry fallbacks.
"""

import os
import sys
import urllib.request

MODELS = {
    "face_detection_yunet_2023mar.onnx": {
        "min_size": 200_000, # ~232 KB
        "urls": [
            "https://huggingface.co/opencv/face_detection_yunet/resolve/main/face_detection_yunet_2023mar.onnx",
            "https://media.githubusercontent.com/media/opencv/opencv_zoo/main/models/face_detection_yunet/face_detection_yunet_2023mar.onnx",
            "https://github.com/opencv/opencv_zoo/raw/main/models/face_detection_yunet/face_detection_yunet_2023mar.onnx",
        ],
    },
    "face_recognition_sface_2021dec.onnx": {
        "min_size": 1_000_000, # ~38 MB
        "urls": [
            "https://huggingface.co/opencv/face_recognition_sface/resolve/main/face_recognition_sface_2021dec.onnx",
            "https://media.githubusercontent.com/media/opencv/opencv_zoo/main/models/face_recognition_sface/face_recognition_sface_2021dec.onnx",
            "https://github.com/opencv/opencv_zoo/raw/main/models/face_recognition_sface/face_recognition_sface_2021dec.onnx",
        ],
    },
}

def download_models(target_dir: str = "models") -> bool:
    os.makedirs(target_dir, exist_ok=True)
    headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}
    success = True

    for filename, config in MODELS.items():
        dest = os.path.join(target_dir, filename)
        min_size = config["min_size"]

        if os.path.exists(dest) and os.path.getsize(dest) >= min_size:
            print(f"[ModelDownloader] '{filename}' already exists and is valid ({os.path.getsize(dest)} bytes).")
            continue

        downloaded = False
        for url in config["urls"]:
            try:
                print(f"[ModelDownloader] Downloading {filename} from {url}...")
                req = urllib.request.Request(url, headers=headers)
                with urllib.request.urlopen(req, timeout=120) as response:
                    content = response.read()

                if len(content) < min_size or content.startswith(b"version https://git-lfs"):
                    print(f"[ModelDownloader] Skipping {url}: downloaded content too small or is Git LFS pointer ({len(content)} bytes).")
                    continue

                # Atomic write
                temp_dest = dest + ".tmp"
                with open(temp_dest, "wb") as f:
                    f.write(content)
                os.replace(temp_dest, dest)

                print(f"[ModelDownloader] Successfully saved {dest} ({len(content)} bytes).")
                downloaded = True
                break
            except Exception as e:
                print(f"[ModelDownloader] Failed from {url}: {e}")

        if not downloaded:
            print(f"[ModelDownloader] ERROR: Failed to download valid model file '{filename}'.")
            success = False

    return success

if __name__ == "__main__":
    out_dir = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(os.path.abspath(__file__)), "models")
    ok = download_models(out_dir)
    if not ok:
        sys.exit(1)
