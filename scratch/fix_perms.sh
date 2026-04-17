#!/bin/bash
set -e

sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE talentia_db TO talantia_user; ALTER DATABASE talentia_db OWNER TO talantia_user;"
sudo -u postgres psql -d talentia_db -c "GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO talantia_user; GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO talantia_user; GRANT ALL ON SCHEMA public TO talantia_user;"
sudo -u postgres psql -d talentia_db -c "ALTER TABLE alembic_version OWNER TO talantia_user;" || echo "No alembic table"
cd /var/www/talantia/backend
source venv/bin/activate
alembic upgrade head
systemctl restart talantia-backend
sleep 2
systemctl status talantia-backend --no-pager | head -n 20
