from dotenv import load_dotenv
import os
load_dotenv()
from fastapi import FastAPI, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from ultralytics import YOLO
from PIL import Image
from sqlalchemy import create_engine, Column, Integer, Float, String, Text, DateTime, func
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from geoalchemy2 import Geography
from geoalchemy2.functions import ST_DWithin, ST_MakePoint
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
DATABASE_URL = os.getenv("DATABASE_URL")
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
    reports_count = Column(Integer, default=1)
    location = Column(Geography(geometry_type='POINT', srid=4326))

class DetectionImage(Base):
    __tablename__ = "detection_images"
    id = Column(Integer, primary_key=True)
    detection_id = Column(Integer, nullable=False)
    image_path = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

# Load YOLO model once
model = YOLO(os.getenv("MODEL_PATH", "model/best.pt"))

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

    # Check for duplicate within 50 meters using PostGIS
    new_point = f"SRID=4326;POINT({longitude} {latitude})"
    existing = db.query(Detection).filter(
        ST_DWithin(
            Detection.location,
            new_point,
            50  # 50 meters
        )
    ).first()

    is_duplicate = False
    if existing:
        # Duplicate found — increment reports_count
        existing.reports_count += 1
        existing.pothole_count = max(existing.pothole_count, len(detections))
        existing.confidence_avg = max(existing.confidence_avg, avg_confidence)
        db.commit()
        db.refresh(existing)
        record = existing
        is_duplicate = True
    else:
        # New pothole — create fresh record
        record = Detection(
            latitude=latitude,
            longitude=longitude,
            pothole_count=len(detections),
            confidence_avg=avg_confidence,
            image_path=image_path,
            status="reported",
            reports_count=1,
            location=f"SRID=4326;POINT({longitude} {latitude})"
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
    record_reports_count = record.reports_count
    db.close()

    return {
        "id": record_id,
        "location": {"latitude": latitude, "longitude": longitude},
        "pothole_count": len(detections),
        "confidence_avg": avg_confidence,
        "status": record_status,
        "reports_count": record_reports_count,
        "is_duplicate": is_duplicate,
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
            "image_path": r.image_path,
            "reports_count": r.reports_count,
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

@app.get("/detections/priority")
def get_priority_detections():
    db = SessionLocal()
    records = db.query(Detection).filter(Detection.status != "resolved").all()
    db.close()

    from datetime import timezone
    now = datetime.now(timezone.utc)

    scored = []
    for r in records:
        created = r.created_at
        if created.tzinfo is None:
            created = created.replace(tzinfo=timezone.utc)
        days = (now - created).days

        score = (
            (r.confidence_avg * 40) +
            (min(r.reports_count, 10) * 30) +
            (min(days, 30) * 30 / 30)
        )
        scored.append({
            "id": r.id,
            "latitude": r.latitude,
            "longitude": r.longitude,
            "pothole_count": r.pothole_count,
            "confidence_avg": r.confidence_avg,
            "reports_count": r.reports_count,
            "status": r.status,
            "days_unresolved": days,
            "priority_score": round(score, 1),
            "created_at": r.created_at,
        })

    scored.sort(key=lambda x: x["priority_score"], reverse=True)
    return scored

@app.get("/analytics/summary")
def analytics_summary():
    db = SessionLocal()
    records = db.query(Detection).all()
    db.close()

    from datetime import timezone
    now = datetime.now(timezone.utc)

    total = len(records)
    resolved = len([r for r in records if r.status == "resolved"])
    unresolved = len([r for r in records if r.status != "resolved"])
    high_severity = len([r for r in records if r.confidence_avg > 0.6])

    # Average repair time (only resolved ones)
    resolved_records = [r for r in records if r.status == "resolved"]
    if resolved_records:
        repair_times = []
        for r in resolved_records:
            created = r.created_at.replace(tzinfo=timezone.utc) if r.created_at.tzinfo is None else r.created_at
            repair_times.append((now - created).days)
        avg_repair_days = round(sum(repair_times) / len(repair_times), 1)
    else:
        avg_repair_days = None

    # Most reported locations (top 5 by reports_count)
    top_reported = sorted(records, key=lambda r: r.reports_count or 1, reverse=True)[:5]

    # Potholes by day (last 30 days)
    from collections import defaultdict
    daily = defaultdict(int)
    for r in records:
        created = r.created_at.replace(tzinfo=timezone.utc) if r.created_at.tzinfo is None else r.created_at
        days_ago = (now - created).days
        if days_ago <= 30:
            date_str = r.created_at.strftime("%b %d")
            daily[date_str] += 1

    return {
        "total": total,
        "resolved": resolved,
        "unresolved": unresolved,
        "high_severity": high_severity,
        "avg_repair_days": avg_repair_days,
        "top_reported": [
            {
                "id": r.id,
                "latitude": r.latitude,
                "longitude": r.longitude,
                "reports_count": r.reports_count,
                "confidence_avg": r.confidence_avg,
            }
            for r in top_reported
        ],
        "daily_counts": [{"date": k, "count": v} for k, v in sorted(daily.items())],
    }