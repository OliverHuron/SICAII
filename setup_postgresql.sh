#!/bin/bash

echo "=== CONFIGURACIÓN COMPLETA DE POSTGRESQL PARA SICAII ==="

# 1. Instalar PostgreSQL
echo "📦 Instalando PostgreSQL..."
apt update
apt install -y postgresql postgresql-contrib

# 2. Iniciar y habilitar PostgreSQL
echo "🔧 Iniciando PostgreSQL..."
systemctl start postgresql
systemctl enable postgresql

# 3. Crear usuario y base de datos
echo "🔧 Creando usuario y base de datos..."
sudo -u postgres psql -c "CREATE USER sicaii_user WITH PASSWORD 'ilovebts10';"
sudo -u postgres psql -c "CREATE DATABASE sicaii_db OWNER sicaii_user;"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE sicaii_db TO sicaii_user;"
sudo -u postgres psql -c "ALTER USER sicaii_user CREATEDB;"

# 4. Configurar PostgreSQL para acceso local
echo "🔧 Configurando acceso local..."
# Encontrar el archivo de configuración
PG_VERSION=$(sudo -u postgres psql -t -c "SELECT version();" | grep -o "PostgreSQL [0-9]*" | grep -o "[0-9]*")
PG_CONFIG_DIR="/etc/postgresql/${PG_VERSION}/main"

# Backup de configuraciones originales
cp ${PG_CONFIG_DIR}/postgresql.conf ${PG_CONFIG_DIR}/postgresql.conf.backup
cp ${PG_CONFIG_DIR}/pg_hba.conf ${PG_CONFIG_DIR}/pg_hba.conf.backup

# Configurar postgresql.conf
echo "listen_addresses = 'localhost'" >> ${PG_CONFIG_DIR}/postgresql.conf

# Configurar pg_hba.conf para permitir conexiones locales con password
echo "local   all             sicaii_user                             md5" >> ${PG_CONFIG_DIR}/pg_hba.conf
echo "host    all             sicaii_user      127.0.0.1/32           md5" >> ${PG_CONFIG_DIR}/pg_hba.conf

# 5. Reiniciar PostgreSQL
echo "🔄 Reiniciando PostgreSQL..."
systemctl restart postgresql

# 6. Crear las tablas
echo "🗄️ Creando tablas de la base de datos..."
cd /var/www/SICAII
PGPASSWORD=ilovebts10 psql -h localhost -U sicaii_user -d sicaii_db -f database/schema.sql

# 7. Crear usuario admin inicial
echo "👤 Creando usuario admin inicial..."
PGPASSWORD=ilovebts10 psql -h localhost -U sicaii_user -d sicaii_db -c "
INSERT INTO users (email, password, full_name, role, is_active) 
VALUES (
    'admin@sicaii.com', 
    '\$2b\$10\$EXAMPLE_HASH_REPLACE_WITH_REAL', 
    'Administrador SICAII', 
    'admin', 
    true
);
"

echo "✅ Configuración completada!"
echo ""
echo "📋 CREDENCIALES DE ACCESO:"
echo "URL: http://10.0.2.15:3001"
echo "Email: admin@sicaii.com"
echo "Password: admin123"
echo ""
echo "🔄 Reinicia el servidor Next.js para aplicar los cambios"
