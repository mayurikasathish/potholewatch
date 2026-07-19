# 🚀 Quick Setup Guide

## First Time Setup (5 minutes)

### 1. Clone & Install Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate          # Windows
source venv/bin/activate       # Mac/Linux
pip install -r requirements.txt
```

### 2. Configure Environment
Copy `.env.example` to `.env` and update with your values:
```bash
cp .env.example .env
```

Edit `backend/.env`:
```env
DATABASE_URL=postgresql://your_username:your_password@localhost:5432/pothole_db
MODEL_PATH=model/best.pt
AUTHORITY_PASSWORD=your_secure_password
```

### 3. Setup Database
```sql
psql -U postgres
CREATE DATABASE pothole_db;
\c pothole_db
CREATE EXTENSION IF NOT EXISTS postgis;
\q
```

### 4. Start Backend
```bash
uvicorn main:app --reload
```
✅ Backend running at: http://localhost:8000

### 5. Install & Start Frontend
```bash
cd frontend
npm install
cp .env.example .env    # Copy environment template
npm run dev
```
✅ Frontend running at: http://localhost:5173

---

## Testing the App

1. **Report a Pothole**:
   - Go to http://localhost:5173/report
   - Upload an image (or use sample from dataset)
   - Click detect → Get tracking ID

2. **View on Map**:
   - Go to http://localhost:5173/map
   - See your detection on the map

3. **Access Authority Dashboard**:
   - Go to http://localhost:5173/authority
   - Login with password from `.env`
   - View priority queue & export CSV

---

## Common Issues

**"ImportError: No module named 'geoalchemy2'"**
→ Run `pip install -r requirements.txt` in activated venv

**"Connection to database failed"**
→ Check PostgreSQL is running and DATABASE_URL in `.env` is correct

**"Model file not found"**
→ Ensure `backend/model/best.pt` exists (130MB file)

**"Port 8000 already in use"**
→ Kill existing uvicorn process or use `--port 8001`

---

## Environment Variables Reference

### Backend (`backend/.env`)
- `DATABASE_URL` - PostgreSQL connection string with PostGIS
- `MODEL_PATH` - Path to YOLOv8 weights file
- `AUTHORITY_PASSWORD` - Password for admin dashboard

### Frontend (`frontend/.env`)
- `VITE_API_URL` - Backend API URL (default: http://localhost:8000)

---

## What's Next?

- Add your name to README.md (line 215)
- Test all features (report, map, route checker, tracking)
- Take screenshots for portfolio
- Deploy to cloud (optional)
