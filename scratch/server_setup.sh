#!/bin/bash
set -e

echo "=== Talantia Server Setup ==="

# Helper to run psql commands as postgres user
run_psql() {
    su -s /bin/bash postgres -c "psql -tAc \"$1\""
}

run_psql_cmd() {
    su -s /bin/bash postgres -c "psql -c \"$1\""
}

# 1. Setup PostgreSQL database
echo "[1/6] Setting up PostgreSQL..."
DB_EXISTS=$(run_psql "SELECT 1 FROM pg_database WHERE datname='talentia_db'" 2>/dev/null || echo "")
if [ "$DB_EXISTS" != "1" ]; then
    run_psql_cmd "CREATE DATABASE talentia_db;"
    echo "Database created."
else
    echo "Database already exists, skipping."
fi

USER_EXISTS=$(run_psql "SELECT 1 FROM pg_roles WHERE rolname='talantia_user'" 2>/dev/null || echo "")
if [ "$USER_EXISTS" != "1" ]; then
    run_psql_cmd "CREATE USER talantia_user WITH PASSWORD 'Talantia@2024';"
    echo "User created."
else
    echo "User already exists, updating password."
    run_psql_cmd "ALTER USER talantia_user WITH PASSWORD 'Talantia@2024';"
fi

run_psql_cmd "GRANT ALL PRIVILEGES ON DATABASE talentia_db TO talantia_user;" || true
echo "[1/6] Database ready."

# 2. Create backend .env
echo "[2/6] Writing backend .env..."
cat > /var/www/talantia/backend/.env << 'ENVEOF'
SECRET_KEY=talantia_super_secret_key_2024_production
POSTGRES_SERVER=localhost
POSTGRES_USER=talantia_user
POSTGRES_PASSWORD=Talantia@2024
POSTGRES_DB=talentia_db
POSTGRES_PORT=5432
BACKEND_CORS_ORIGINS=["http://72.61.15.24","http://72.61.15.24:3000","http://72.61.15.24:8080","http://localhost:3000"]
ENVEOF
echo "[2/6] Backend .env created."

# 3. Run Alembic migrations
echo "[3/6] Running DB migrations..."
cd /var/www/talantia/backend
source venv/bin/activate
alembic upgrade head && echo "Migrations applied." || echo "Migrations skipped (tables may already exist)."
deactivate
echo "[3/6] Migrations done."

# 4. Setup systemd service for backend on port 8002
echo "[4/6] Setting up backend service..."
cat > /etc/systemd/system/talantia-backend.service << 'SVCEOF'
[Unit]
Description=Talantia HR FastAPI Backend
After=network.target postgresql.service

[Service]
User=root
WorkingDirectory=/var/www/talantia/backend
Environment=PATH=/var/www/talantia/backend/venv/bin:/usr/bin:/bin
ExecStart=/var/www/talantia/backend/venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8002 --workers 2
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
SVCEOF

systemctl daemon-reload
systemctl enable talantia-backend
systemctl restart talantia-backend
sleep 3
systemctl is-active talantia-backend && echo "[4/6] Backend running on port 8002." || (journalctl -u talantia-backend -n 30 --no-pager; echo "[4/6] Backend FAILED - see logs above.")

# 5. Frontend .env.local
echo "[5/6] Writing frontend env..."
cat > /var/www/talantia/frontend/.env.local << 'FENVEOF'
NEXT_PUBLIC_API_URL=http://72.61.15.24:8080/api/v1
FENVEOF
echo "[5/6] Frontend env written."

# 6. Configure Nginx
echo "[6/6] Configuring Nginx..."
cat > /etc/nginx/sites-available/talantia << 'NGINXEOF'
# Talantia HR Frontend - port 3000
server {
    listen 3000;
    server_name _;
    location / {
        proxy_pass http://127.0.0.1:3003;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
    location /uploads/ {
        alias /var/www/talantia/backend/uploads/;
        expires 30d;
    }
}

# Talantia HR Backend API - port 8080
server {
    listen 8080;
    server_name _;
    location / {
        proxy_pass http://127.0.0.1:8002;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 300;
        proxy_connect_timeout 300;
    }
}
NGINXEOF

ln -sf /etc/nginx/sites-available/talantia /etc/nginx/sites-enabled/talantia
nginx -t && systemctl reload nginx && echo "[6/6] Nginx configured." || echo "[6/6] Nginx config FAILED - check errors above."

echo ""
echo "=============================="
echo "=== BACKEND SETUP COMPLETE ==="
echo "=============================="
echo "Backend API: http://72.61.15.24:8080/api/v1/docs"
echo "Frontend:    http://72.61.15.24:3000  (after npm run build)"
echo ""
echo "=== Run next: npm install && npm run build in /var/www/talantia/frontend ==="
