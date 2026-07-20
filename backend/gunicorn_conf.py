import os

# Gunicorn configuration for production (optimized for Render free tier)
workers = 1  # Free tier has 512MB RAM limit - use single worker
worker_class = "uvicorn.workers.UvicornWorker"
port = os.getenv("PORT", "8000")
bind = f"0.0.0.0:{port}"
keepalive = 120
errorlog = "-"
accesslog = "-"
loglevel = "info"
