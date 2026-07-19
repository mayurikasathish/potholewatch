# 🚀 Render Deployment Guide

## Prerequisites
- Render account (free tier works)
- GitHub repository with your code pushed

---

## Step 1: Push Code to GitHub

```bash
cd /c/Users/vinib/OneDrive/Desktop/pothole-detection
git add .
git commit -m "Prepare for Render deployment"
git push origin main
```

**IMPORTANT**: Make sure `.env` is NOT committed (check `.gitignore`)

---

## Step 2: Create PostgreSQL Database on Render

1. Go to https://dashboard.render.com
2. Click **"New +"** → **"PostgreSQL"**
3. Settings:
   - **Name**: `pothole-db`
   - **Database**: `pothole_db`
   - **User**: `pothole_user`
   - **Region**: Oregon (US West) - fastest free tier
   - **Plan**: Free
4. Click **"Create Database"**
5. Wait 2-3 minutes for provisioning
6. Copy the **Internal Database URL** (starts with `postgresql://`)

### Enable PostGIS Extension

1. In your database dashboard, click **"Connect"** → **"PSQL Command"**
2. Run in terminal:
   ```bash
   psql <paste-your-external-database-url>
   ```
3. Run this command:
   ```sql
   CREATE EXTENSION IF NOT EXISTS postgis;
   \q
   ```

---

## Step 3: Deploy Backend (FastAPI)

1. Click **"New +"** → **"Web Service"**
2. Connect your GitHub repository
3. Settings:
   - **Name**: `pothole-backend`
   - **Region**: Oregon (same as database)
   - **Branch**: main
   - **Root Directory**: `backend`
   - **Runtime**: Python 3
   - **Build Command**: 
     ```bash
     pip install -r requirements.txt
     ```
   - **Start Command**: 
     ```bash
     gunicorn -c gunicorn_conf.py main:app
     ```
   - **Plan**: Free

4. **Environment Variables** (click "Add Environment Variable"):
   ```
   DATABASE_URL = <paste Internal Database URL from Step 2>
   MODEL_PATH = model/best.pt
   AUTHORITY_PASSWORD = admin123
   PYTHON_VERSION = 3.10.12
   ```

5. Click **"Create Web Service"**
6. Wait 5-10 minutes for deployment
7. Copy your backend URL (e.g., `https://pothole-backend.onrender.com`)

---

## Step 4: Deploy Frontend (React)

1. Click **"New +"** → **"Static Site"**
2. Connect your GitHub repository
3. Settings:
   - **Name**: `pothole-frontend`
   - **Region**: Oregon
   - **Branch**: main
   - **Root Directory**: `frontend`
   - **Build Command**: 
     ```bash
     npm install && npm run build
     ```
   - **Publish Directory**: `dist`
   - **Plan**: Free

4. **Environment Variables**:
   ```
   VITE_API_URL = <paste your backend URL from Step 3>
   ```
   Example: `VITE_API_URL = https://pothole-backend.onrender.com`

5. Click **"Create Static Site"**
6. Wait 3-5 minutes for deployment
7. Your app is live! Copy the frontend URL (e.g., `https://pothole-frontend.onrender.com`)

---

## Step 5: Test Your Deployment

1. Visit your frontend URL
2. Try reporting a pothole (upload test image)
3. Check the map dashboard
4. Test authority dashboard login

---

## ⚠️ Important Notes

### Free Tier Limitations
- **Backend auto-sleeps after 15 min of inactivity** → First request after sleep takes ~30 seconds
- **Database expires after 90 days** → Backup data before expiry
- **750 hours/month** → Enough for portfolio projects

### Model File Size Warning
If `backend/model/best.pt` is >100MB, you might need to:
1. Use Git LFS (Large File Storage)
2. Or upload model to cloud storage (AWS S3, Google Drive) and download during build

**Quick fix for large model**:
Add to `backend/requirements.txt`:
```
gdown==4.7.1
```

Create `backend/download_model.py`:
```python
import gdown
import os

if not os.path.exists("model/best.pt"):
    url = "YOUR_GOOGLE_DRIVE_LINK"  # Upload model to Google Drive, get shareable link
    gdown.download(url, "model/best.pt", quiet=False)
```

Update Build Command to:
```bash
pip install -r requirements.txt && python download_model.py && python init_db.py
```

---

## Troubleshooting

### "Application failed to respond"
- Check backend logs in Render dashboard
- Ensure `DATABASE_URL` is set correctly
- Verify `gunicorn` is in requirements.txt

### "CORS error" in frontend
- Backend CORS is set to `allow_origins=["*"]` so this shouldn't happen
- If it does, add your frontend URL to allowed origins

### "Model file not found"
- Check if `best.pt` is committed to git (or use download script above)
- Verify `MODEL_PATH=model/best.pt` in env variables

### Database connection fails
- Use **Internal Database URL** (not External) for backend
- Ensure PostGIS extension is enabled

### Frontend can't reach backend
- Check `VITE_API_URL` has the correct backend URL
- No trailing slash in URL

---

## After Deployment

### Update README with Live Links
Add to your README.md:
```markdown
## 🌐 Live Demo

- **App**: https://pothole-frontend.onrender.com
- **API**: https://pothole-backend.onrender.com
- **API Docs**: https://pothole-backend.onrender.com/docs
```

### Monitor Your App
- Render dashboard shows logs, metrics, and errors
- Set up Uptime Robot to ping your backend every 5 minutes (prevents sleep)

---

## Cost Optimization (Optional)

To keep backend awake 24/7 (avoid cold starts):
1. Sign up for free tier at https://uptimerobot.com
2. Create monitor:
   - Type: HTTP(s)
   - URL: `https://your-backend.onrender.com/`
   - Interval: 5 minutes
3. Backend stays warm, responds instantly

---

## 🎉 You're Done!

Your PotholeWatch app is now live and accessible worldwide!

**Share it on your resume:**
- Live Demo: [your-render-url]
- GitHub: [your-github-repo]
- Tech Stack: YOLOv8 + FastAPI + React + PostGIS deployed on Render
