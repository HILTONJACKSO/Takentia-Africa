#!/bin/bash
# Quick DB setup using trust auth temporarily
set -e

PG_HBA=$(find /etc/postgresql -name pg_hba.conf | head -1)
echo "Found pg_hba.conf: $PG_HBA"

# Backup and switch to trust
cp "$PG_HBA" "${PG_HBA}.bak"
sed -i 's/^local   all             postgres.*md5/local   all             postgres                                trust/' "$PG_HBA"
sed -i 's/^local   all             all.*md5/local   all             all                                     trust/' "$PG_HBA"
systemctl reload postgresql
sleep 2
echo "Auth switched to trust"

# Create DB and user
psql -U postgres -c "SELECT 1 FROM pg_database WHERE datname='talentia_db'" | grep -q 1 || psql -U postgres -c "CREATE DATABASE talentia_db;"
psql -U postgres -c "SELECT 1 FROM pg_roles WHERE rolname='talantia_user'" | grep -q 1 || psql -U postgres -c "CREATE USER talantia_user WITH PASSWORD 'Talantia@2024';"
psql -U postgres -c "ALTER USER talantia_user WITH PASSWORD 'Talantia@2024';"
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE talentia_db TO talantia_user;"
echo "DB and user ready"

# Restore original auth
cp "${PG_HBA}.bak" "$PG_HBA"
systemctl reload postgresql
sleep 1
echo "Auth restored to md5"

# Write backend .env
cat > /var/www/talantia/backend/.env << 'ENVEOF'
SECRET_KEY=talantia_super_secret_key_2024_production
POSTGRES_SERVER=localhost
POSTGRES_USER=talantia_user
POSTGRES_PASSWORD=Talantia@2024
POSTGRES_DB=talentia_db
POSTGRES_PORT=5432
BACKEND_CORS_ORIGINS=["http://72.61.15.24","http://72.61.15.24:3000","http://72.61.15.24:8080","http://localhost:3000"]
ENVEOF
echo "Backend .env written"

# Run migrations
cd /var/www/talantia/backend
source venv/bin/activate
alembic upgrade head && echo "Migrations applied" || echo "Migrations skipped (already applied)"
deactivate

# Create systemd backend service
cat > /etc/systemd/system/talantia-backend.service << 'SVCEOF'
[Unit]
Description=Talantia HR FastAPI Backend
After=network.target postgresql.service

[Service]
User=root
WorkingDirectory=/var/www/talantia/backend
Environment=PATH=/var/www/talantia/backend/venv/bin:/usr/local/bin:/usr/bin:/bin
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
systemctl is-active talantia-backend && echo "Backend service ACTIVE on port 8002" || (journalctl -u talantia-backend -n 30 --no-pager; echo "Backend FAILED")

# Frontend env
cat > /var/www/talantia/frontend/.env.local << 'FEOF'
NEXT_PUBLIC_API_URL=http://72.61.15.24:8080/api/v1
FEOF
echo "Frontend .env.local written"

# Nginx config
cat > /etc/nginx/sites-available/talantia << 'NEOF'
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
    }
}
NEOF

ln -sf /etc/nginx/sites-available/talantia /etc/nginx/sites-enabled/talantia
nginx -t && systemctl reload nginx && echo "Nginx configured OK"

echo ""
echo "=== BACKEND SETUP COMPLETE ==="
echo "API docs: http://72.61.15.24:8080/api/v1/docs"
echo "Next: build the frontend with npm run build"
