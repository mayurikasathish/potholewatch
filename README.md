# 🕳️ PotholeWatch

**AI-powered pothole detection and reporting platform for citizens and municipal authorities.**

Upload a road photo → YOLOv8 detects potholes → Auto geo-tagged → Added to live city map → Authorities prioritize repairs.

---

## 🌟 Features

### For Citizens
- **📸 AI Detection**: Upload photos, YOLOv8n instantly detects and counts potholes with bounding boxes
- **📍 Auto Geo-tagging**: GPS coordinates extracted from image EXIF or manually pinned on map
- **🔍 Duplicate Prevention**: PostGIS spatial queries prevent duplicate reports within 50-meter radius
- **🎫 Tracking System**: Unique reference IDs (PW-YYYY-####) to track pothole repair progress
- **📊 My Reports Dashboard**: Track all your submissions in one place (localStorage-based)
- **🗺️ Route Checker**: Plan trips by checking pothole density between two locations
- **📈 Public Analytics**: View city-wide statistics, trends, and high-severity areas

### For Authorities
- **🚨 Priority Queue**: Smart scoring algorithm ranks potholes by AI confidence (40%), citizen reports (30%), and age (30%)
- **📋 Authority Dashboard**: Manage all reports with status updates (Reported → Under Review → Resolved)
- **📥 CSV Export**: Download reports for legacy government systems or contractor handoffs
- **📊 Analytics Dashboard**: KPIs, charts, severity distribution, and repair time metrics
- **🗺️ Live Map View**: Interactive Leaflet map with clustering, filtering, and pothole aging indicators

---

## 🛠️ Tech Stack

### Backend
- **FastAPI** - Modern async Python web framework
- **PostgreSQL + PostGIS** - Spatial database for geo-queries
- **SQLAlchemy + GeoAlchemy2** - ORM with spatial extensions
- **YOLOv8n** - Real-time object detection (mAP50: 0.897)
- **Ultralytics** - YOLO implementation with PyTorch

### Frontend
- **React 19** - UI library
- **React Router** - Client-side routing
- **Leaflet + React-Leaflet** - Interactive maps
- **Recharts** - Analytics visualizations
- **React Hot Toast** - Notifications
- **Axios** - HTTP client
- **exifr** - GPS extraction from images

---

## 🚀 Quick Start

### Prerequisites
- Python 3.10+
- Node.js 18+
- PostgreSQL 14+ with PostGIS extension

### 1. Database Setup
```sql
CREATE DATABASE pothole_db;
\c pothole_db
CREATE EXTENSION IF NOT EXISTS postgis;
```

### 2. Backend Setup
```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
source venv/bin/activate     # Mac/Linux
pip install -r requirements.txt
```

Create `backend/.env` from `backend/.env.example`:
```env
DATABASE_URL=postgresql://username:password@localhost:5432/pothole_db
MODEL_PATH=model/best.pt
AUTHORITY_PASSWORD=admin123
```

Start backend:
```bash
uvicorn main:app --reload
```
Backend runs at: http://localhost:8000

### 3. Frontend Setup
```bash
cd frontend
npm install
```

Create `frontend/.env`:
```env
VITE_API_URL=http://localhost:8000
```

Start frontend:
```bash
npm run dev
```
Frontend runs at: http://localhost:5173

---

## 🧠 Model Training

- **Dataset**: Aegis Pothole Detection (Roboflow)
  - 1,482 base images → 3,552 after augmentation
  - Classes: Pothole (single class detection)
- **Architecture**: YOLOv8n with transfer learning from COCO pretrained weights
- **Training**: 50 epochs, batch size 16, image size 640×640
- **Performance**:
  - mAP50: **0.897** (89.7% detection accuracy)
  - mAP50-95: **0.565**
  - Inference: **2.4ms/image** on GPU

Model file: `backend/model/best.pt` (130 MB)

---

## 📡 API Endpoints

### Public Endpoints
- `POST /detect` - Upload image + GPS, returns pothole detections
- `GET /detections` - List all reported potholes
- `GET /detections/near-route` - Find potholes between two coordinates
- `GET /track/{reference_id}` - Track repair status by reference ID
- `GET /analytics/summary` - Public analytics (counts, trends, top locations)

### Authority Endpoints
- `GET /detections/priority` - Priority-ranked pothole queue
- `PATCH /detections/{id}/status` - Update repair status
- `GET /export/csv` - Download all reports as CSV

---

## 🎯 Key Algorithms

### 1. Duplicate Detection (PostGIS)
```python
ST_DWithin(Detection.location, new_point, 50)  # 50-meter radius
```
Prevents duplicate reports using spatial queries instead of simple lat/lng comparison.

### 2. Priority Scoring
```python
score = (confidence_avg × 40%) + (min(reports_count, 10) × 30%) + (min(days_open, 30) × 30%)
```
Balances AI confidence, citizen engagement, and aging to prioritize repairs.

### 3. Reference ID Generation
```python
PW-{year}-{id:04d}  # Example: PW-2026-0042
```
Human-readable, unique tracking IDs for public transparency.

---

## 📂 Project Structure

```
pothole-detection/
├── backend/
│   ├── main.py              # FastAPI app + all endpoints
│   ├── requirements.txt     # Python dependencies
│   ├── .env.example         # Environment template
│   ├── model/
│   │   └── best.pt          # YOLOv8n trained weights
│   └── uploads/             # Uploaded images
├── frontend/
│   ├── src/
│   │   ├── pages/           # React pages
│   │   │   ├── LandingPage.jsx
│   │   │   ├── ReportPage.jsx
│   │   │   ├── MapDashboard.jsx
│   │   │   ├── RouteChecker.jsx
│   │   │   ├── MyReportsPage.jsx
│   │   │   ├── TrackPage.jsx
│   │   │   ├── Analytics.jsx
│   │   │   └── AuthorityDashboard.jsx
│   │   ├── components/
│   │   │   └── Navbar.jsx
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── package.json
└── README.md
```

---

## 🎨 Screenshots

### Citizen Flow
1. **Landing Page** - Hero with live stats + feature showcase
2. **Report Page** - Upload image → AI detects → Get tracking ID
3. **My Reports** - Track all your submissions with status filters
4. **Track Page** - Status timeline (Reported → Under Review → Resolved)
5. **Map Dashboard** - Interactive map with clustering + density circles
6. **Route Checker** - A→B pothole finder with search autocomplete

### Authority Flow
1. **Authority Dashboard** - Password-protected admin panel
2. **Priority Queue** - AI-ranked repair list with color coding
3. **CSV Export** - Download reports for government systems
4. **Analytics** - KPIs, charts, severity distribution

---

## 🔐 Security Notes

- Authority password is configurable via environment variable
- No citizen authentication required (by design - reduces friction)
- `.env` files excluded from git via `.gitignore`
- Reference IDs are non-sequential UUIDs to prevent enumeration

---

## 🚧 Future Enhancements

- [ ] SMS/Email notifications on status updates
- [ ] Contractor assignment workflow
- [ ] Mobile app (React Native)
- [ ] Image compression before upload
- [ ] Rate limiting on detection endpoint
- [ ] Bulk status updates for authorities
- [ ] Monthly PDF report generation
- [ ] WebSocket for real-time map updates

---

## 🤝 Contributing

This is a portfolio project. Feel free to fork and adapt for your city!

---

## 📄 License

MIT License - Free to use for educational and municipal purposes.

---

## 👨‍💻 Built By

**[Your Name]**  
Portfolio project demonstrating full-stack development + ML integration for civic tech.

- AI/ML: Custom YOLOv8 training, inference optimization
- Backend: FastAPI, PostgreSQL, PostGIS spatial queries
- Frontend: React, Leaflet mapping, Recharts analytics
- DevOps: Git, environment management, CSV export for legacy systems

**Tech Highlights:**
- Real-time object detection (not just API calls)
- Spatial database queries (PostGIS ST_DWithin)
- Government workflow understanding (CSV export, priority queue)
- Citizen-first UX (reference IDs, tracking, no forced login)
