import multiprocessing
import os

# Gunicorn configuration for production
workers = multiprocessing.cpu_count() * 2 + 1
worker_class = "uvicorn.workers.UvicornWorker"
port = os.getenv("PORT", "8000")
bind = f"0.0.0.0:{port}"
keepalive = 120
errorlog = "-"
accesslog = "-"
loglevel = "info"
