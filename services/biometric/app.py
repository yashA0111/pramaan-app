"""
FastAPI Biometric Verification Service for Pramaan.
Executes 1:1 face detection and identity comparison using OpenCV YuNet and SFace ONNX engine.
"""

from fastapi import FastAPI, HTTPException, Request
from pydantic import BaseModel, Field
from typing import Optional
import datetime
from face_engine import FaceEngine

app = FastAPI(
    title="Pramaan Biometric Verification Service",
    version="1.0.0",
    description="ONNX YuNet/SFace face detection and identity matching microservice."
)

engine = FaceEngine()

class BiometricRequest(BaseModel):
    credential_reference: str = Field(..., example="PRM-DEMO-0001")
    observation: str = Field(default="single_face", example="single_face")
    quality: Optional[float] = Field(default=1.0, ge=0.0, le=1.0)
    captured_frame: Optional[str] = None
    reference_photo: Optional[str] = None
    threshold: Optional[float] = Field(default=None, ge=0.0, le=1.0)

class BiometricResponse(BaseModel):
    status: str
    match_result: str
    confidence: Optional[float]
    model_version: str
    timestamp: str
    reason: str

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "pramaan-biometric-service",
        "timestamp": datetime.datetime.utcnow().isoformat() + "Z"
    }

@app.post("/verify-face", response_model=BiometricResponse)
def verify_face(payload: BiometricRequest):
    result = engine.compare_faces(
        credential_reference=payload.credential_reference,
        observation=payload.observation,
        quality=payload.quality if payload.quality is not None else 1.0,
        captured_frame_base64=payload.captured_frame,
        reference_photo_base64=payload.reference_photo,
        threshold_override=payload.threshold,
    )
    result["timestamp"] = datetime.datetime.utcnow().isoformat() + "Z"
    return result

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
