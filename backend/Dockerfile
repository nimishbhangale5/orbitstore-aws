# ── BASE IMAGE ──
FROM python:3.11-slim

# ── SET WORKING DIRECTORY ──
WORKDIR /app

# ── COPY REQUIREMENTS FIRST (for caching) ──
COPY requirements.txt .

# ── INSTALL DEPENDENCIES ──
RUN pip install --no-cache-dir -r requirements.txt

# ── COPY APP CODE ──
COPY app.py .

# ── EXPOSE PORT ──
EXPOSE 8080

# ── RUN THE APP ──
CMD ["python", "app.py"]