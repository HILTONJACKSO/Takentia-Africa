# Talentia Africa HR & Operations System

Enterprise-grade HR Management and Office Operations System.

## Features
- **Authentication**: JWT-based Secure Login.
- **RBAC**: Multi-tiered role permission matrix (Super Admin, HR Manager, Finance Manager, etc.).
- **HR Module**: Complete Staff Directory, Department Management.
- **Operations Module**: Asset Tracking, Petty Cash Logs.
- **Dashboard**: High-level analytical overview with interactive charts.

## Deployment Guide (Production)

### 1. Prerequisites
- **PostgreSQL 14+** Database
- **Node.js 20+** (For Frontend)
- **Python 3.10+** (For Backend API)
- **PM2** (For process management) or Docker
- **Nginx** (Reverse Proxy)

### 2. Backend Deployment using Gunicorn/Uvicorn
1. Clone the repository and navigate to `backend/`.
2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Set `.env` configuration for Production Database.
5. Run Migrations & Seed Data:
   ```bash
   alembic upgrade head
   python scripts/seed.py
   ```
6. Start system daemon via systemd or supervisor, running:
   ```bash
   uvicorn app.main:app --host 0.0.0.0 --port 8000
   ```

### 3. Frontend Deployment (Next.js)
1. Navigate to `frontend/`.
2. Install dependencies:
   ```bash
   npm install --production
   ```
3. Build the Next.js optimized production bundle:
   ```bash
   npm run build
   ```
4. Start the application using PM2:
   ```bash
   pm2 start npm --name "talentia-frontend" -- start
   ```

### 4. Nginx Reverse Proxy Setup
Configure `nginx.conf` to root traffic correctly:
- Port 80/443 pointing to `http://localhost:3000` (Frontend)
- `/api` routing to `http://localhost:8000` (Backend)
