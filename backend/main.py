from fastapi import FastAPI, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from ultralytics import YOLO
from PIL import Image
from sqlalchemy import create_engine, Column, Integer, Float, String, Text, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime
import io
import os
from typing import List
from fastapi.staticfiles import StaticFiles

app = FastAPI()
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database setup
DATABASE_URL = "postgresql://postgres:Ruby123+@localhost:5432/pothole_db"
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)
Base = declarative_base()

# Detection model (maps to your detections table)
class Detection(Base):
    __tablename__ = "detections"
    id = Column(Integer, primary_key=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    pothole_count = Column(Integer, nullable=False)
    confidence_avg = Column(Float)
    image_path = Column(Text)
    status = Column(String(50), default="reported")
    created_at = Column(DateTime, default=datetime.utcnow)

class DetectionImage(Base):
    __tablename__ = "detection_images"
    id = Column(Integer, primary_key=True)
    detection_id = Column(Integer, nullable=False)
    image_path = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

# Load YOLO model once
model = YOLO("model/best.pt")

# Save uploads to a folder
os.makedirs("uploads", exist_ok=True)

@app.patch("/detections/{detection_id}/status")
def update_status(detection_id: int, status: str):
    db = SessionLocal()
    record = db.query(Detection).filter(Detection.id == detection_id).first()
    if not record:
        db.close()
        return {"error": "Detection not found"}
    record.status = status
    db.commit()
    db.refresh(record)
    db.close()
    return {"id": record.id, "status": record.status}

@app.get("/")
def root():
    return {"status": "Pothole Detection API is running"}

@app.post("/detect")
async def detect_potholes(
    file: UploadFile = File(...),
    supporting_images: List[UploadFile] = File(default=[]),
    latitude: float = Form(...),
    longitude: float = Form(...),
):
    # Read and save image
    image_bytes = await file.read()
    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    image_path = f"uploads/{file.filename}"
    image.save(image_path)

    # Run inference
    results = model.predict(image, conf=0.25)

    # Parse detections
    detections = []
    confidences = []
    for box in results[0].boxes:
        conf = float(box.conf[0])
        confidences.append(conf)
        detections.append({
            "confidence": round(conf, 3),
            "bbox": {
                "x1": round(float(box.xyxy[0][0]), 2),
                "y1": round(float(box.xyxy[0][1]), 2),
                "x2": round(float(box.xyxy[0][2]), 2),
                "y2": round(float(box.xyxy[0][3]), 2),
            }
        })

    avg_confidence = round(sum(confidences) / len(confidences), 3) if confidences else 0

    # Save to database
    db = SessionLocal()
    record = Detection(
        latitude=latitude,
        longitude=longitude,
        pothole_count=len(detections),
        confidence_avg=avg_confidence,
        image_path=image_path,
        status="reported"
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    # Save supporting images
    for sup_file in supporting_images:
        sup_bytes = await sup_file.read()
        sup_path = f"uploads/supporting_{record.id}_{sup_file.filename}"
        with open(sup_path, "wb") as f:
            f.write(sup_bytes)
        sup_record = DetectionImage(
            detection_id=record.id,
            image_path=sup_path,
        )
        db.add(sup_record)
    db.commit()

    # Extract values before closing session
    record_id = record.id
    record_status = record.status
    db.close()

    return {
        "id": record_id,
        "location": {"latitude": latitude, "longitude": longitude},
        "pothole_count": len(detections),
        "confidence_avg": avg_confidence,
        "status": record_status,
        "image_width": image.width,
        "image_height": image.height,
        "detections": detections,
    }

@app.get("/detections")
def get_all_detections():
    db = SessionLocal()
    records = db.query(Detection).order_by(Detection.created_at.desc()).all()
    db.close()
    return [
        {
            "id": r.id,
            "latitude": r.latitude,
            "longitude": r.longitude,
            "pothole_count": r.pothole_count,
            "confidence_avg": r.confidence_avg,
            "status": r.status,
            "created_at": r.created_at,
            "image_path": r.image_path
        }
        for r in records
    ]
@app.get("/detections/near-route")
def detections_near_route(
    lat1: float, lng1: float,
    lat2: float, lng2: float,
    radius_km: float = 1.0
):
    db = SessionLocal()
    records = db.query(Detection).all()
    db.close()

    def point_to_segment_distance(px, py, x1, y1, x2, y2):
        dx, dy = x2 - x1, y2 - y1
        if dx == 0 and dy == 0:
            return ((px - x1) ** 2 + (py - y1) ** 2) ** 0.5
        t = max(0, min(1, ((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy)))
        return ((px - x1 - t * dx) ** 2 + (py - y1 - t * dy) ** 2) ** 0.5

    import math
    def deg_to_km(deg):
        return deg * 111.0

    results = []
    for r in records:
        dist_deg = point_to_segment_distance(r.latitude, r.longitude, lat1, lng1, lat2, lng2)
        dist_km = deg_to_km(dist_deg)
        if dist_km <= radius_km:
            results.append({
                "id": r.id,
                "latitude": r.latitude,
                "longitude": r.longitude,
                "pothole_count": r.pothole_count,
                "confidence_avg": r.confidence_avg,
                "status": r.status,
                "distance_km": round(dist_km, 2),
                "created_at": r.created_at,
            })

    results.sort(key=lambda x: x["distance_km"])
    return {"route_potholes": results, "total": len(results)}
@app.get("/detections/{detection_id}/images")
def get_detection_images(detection_id: int):
    db = SessionLocal()
    images = db.query(DetectionImage).filter(DetectionImage.detection_id == detection_id).all()
    db.close()
    return [{"id": i.id, "image_path": i.image_path} for i in images]