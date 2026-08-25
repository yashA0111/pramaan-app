"""
FastAPI Biometric Service for Pramaan.
"""

from fastapi import FastAPI
from pydantic import BaseModel, Field
from typing import Optional
import datetime
from face_engine import FaceEngine

app = FastAPI(
    title="Pramaan Biometric Verification Service",
    version="1.1.0",
    description="ONNX YuNet/SFace face detection and identity matching microservice."
)

engine = FaceEngine()

class BiometricRequest(BaseModel):
    credential_reference: str = Field(..., example="PRM-DEMO-0001")
    observation: str = Field(default="single_face", example="single_face")
    quality: Optional[float] = Field(default=1.0, ge=0.0, le=1.0)
    captured_frame: Optional[str] = None
    reference_path: Optional[str] = None

class BiometricResponse(BaseModel):
    status: str
    match_result: str
    confidence: Optional[float]
    model_version: str
    timestamp: str
    reason: str

class IdentificationRequest(BaseModel):
    observation: str = Field(default="single_face", example="single_face")
    quality: Optional[float] = Field(default=1.0, ge=0.0, le=1.0)
    captured_frame: Optional[str] = None

class IdentificationResponse(BaseModel):
    status: str
    candidate: Optional[dict]
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
        quality=payload.quality or 1.0,
    )
    result["timestamp"] = datetime.datetime.utcnow().isoformat() + "Z"
    return result

@app.post("/identify-face", response_model=IdentificationResponse)
def identify_face(payload: IdentificationRequest):
    result = engine.identify_face(
        observation=payload.observation,
        quality=payload.quality or 1.0,
        captured_frame_bytes=payload.captured_frame,
    )
    result["timestamp"] = datetime.datetime.utcnow().isoformat() + "Z"
    return result

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
