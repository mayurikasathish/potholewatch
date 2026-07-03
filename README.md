## ⚙️ Setup

### Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
pip install -r requirements.txt
uvicorn main:app --reload
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Database
```sql
CREATE DATABASE pothole_db;
\c pothole_db
CREATE EXTENSION IF NOT EXISTS postgis;
```

## 🧠 Model Training

- Dataset: Aegis Pothole Detection (Roboflow) — 1,482 base images → 3,552 after augmentation
- Architecture: YOLOv8n with transfer learning from COCO pretrained weights
- Training: 50 epochs, batch size 16, image size 640x640
- Results: **mAP50: 0.897 | mAP50-95: 0.565 | Inference: 2.4ms/image**

## 📸 Screenshots

_Add screenshots here_

## 🔑 Authority Dashboard

Access at `/authority` with password: `admin123`
