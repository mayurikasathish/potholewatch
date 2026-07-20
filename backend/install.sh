#!/bin/bash
set -e

echo "📦 Installing dependencies..."
pip install -r requirements.txt

echo "🔧 Forcing opencv-python-headless..."
pip uninstall -y opencv-python opencv-contrib-python || true
pip install --force-reinstall opencv-python-headless==4.10.0.84

echo "✅ Dependencies installed successfully"
