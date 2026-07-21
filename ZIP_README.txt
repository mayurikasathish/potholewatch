🕳️ POTHOLEWATCH - Project Archive
================================

Created: July 21, 2026
By: Mayurika

📦 Two Versions Available:
--------------------------

1. potholewatch-clean.zip (108 KB)
   - Code only (no model file)
   - Good for code review
   - Fast to share/email

2. potholewatch-complete.zip (5.7 MB)
   - Includes YOLOv8 model (best.pt)
   - Ready to run locally
   - Use this to demo the project


🚀 Quick Start (from complete.zip):
------------------------------------

1. Extract the zip
2. Setup database:
   - Install PostgreSQL with PostGIS
   - Run: CREATE DATABASE pothole_db;
   - Run: CREATE EXTENSION postgis;

3. Backend:
   cd backend
   python -m venv venv
   venv\Scripts\activate
   pip install -r requirements.txt
   Copy .env.example to .env and configure
   uvicorn main:app --reload

4. Frontend:
   cd frontend
   npm install
   Copy .env.example to .env
   npm run dev

5. Visit: http://localhost:5173


📂 What's Excluded:
-------------------
- node_modules/ (reinstall with npm install)
- venv/ (recreate with python -m venv venv)
- .git/ (git history)
- uploads/ (user uploaded images)
- .env files (create from .env.example)
- dist/build folders


🎯 Project Highlights:
----------------------
✅ YOLOv8 AI model (mAP50: 0.897)
✅ FastAPI + PostgreSQL + PostGIS
✅ React frontend with Leaflet maps
✅ Duplicate detection (50m radius)
✅ Priority scoring algorithm
✅ Analytics dashboard
✅ CSV export for authorities
✅ Public tracking system


📚 Documentation:
-----------------
- README.md - Full project documentation
- SETUP_GUIDE.md - Step-by-step setup
- RENDER_DEPLOYMENT.md - Deployment guide
- DEPLOYMENT_CHECKLIST.md - Pre-deploy checklist


🔧 Tech Stack:
--------------
Backend: FastAPI, SQLAlchemy, GeoAlchemy2, Ultralytics (YOLOv8)
Frontend: React, React Router, Leaflet, Recharts
Database: PostgreSQL + PostGIS
ML: YOLOv8n, PyTorch, OpenCV


💡 Interview Tips:
------------------
- Demo it locally (works perfectly)
- Explain PostGIS spatial queries
- Show priority scoring algorithm
- Discuss duplicate detection logic
- Mention citizen-first UX design


🌟 Resume Line:
---------------
"Built AI-powered civic tech platform with YOLOv8 for pothole detection,
PostGIS spatial queries for duplicate prevention, and priority scoring
algorithm for municipal work queue optimization. Full-stack with
FastAPI + React + PostgreSQL."


📧 Questions?
-------------
Check documentation files in the zip or refer to GitHub repo.


Happy Learning! 🚀
