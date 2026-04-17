#!/bin/bash
set -e

PG_HBA=$(find /etc/postgresql -name pg_hba.conf | head -1)
sed -i 's/local   all             postgres                                md5/local   all             postgres                                trust/' $PG_HBA
sed -i 's/local   all             all                                     md5/local   all             all                                     trust/' $PG_HBA
systemctl reload postgresql
sleep 1
sudo -u postgres psql -d talentia_db -c "GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO talantia_user; GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO talantia_user;"
sudo -u postgres psql -d talentia_db -c "ALTER TABLE alembic_version OWNER TO talantia_user;" || echo "No alembic table"
cd /var/www/talantia/backend
source venv/bin/activate
alembic upgrade head
systemctl restart talantia-backend
sleep 2

# Revert auth
sed -i 's/local   all             postgres                                trust/local   all             postgres                                md5/' $PG_HBA
sed -i 's/local   all             all                                     trust/local   all             all                                     md5/' $PG_HBA
systemctl reload postgresql

systemctl status talantia-backend --no-pager | head -n 20
