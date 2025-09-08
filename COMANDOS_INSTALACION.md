# === COMANDOS PARA INSTALACIÓN MANUAL ===

# 1. Actualizar sistema
sudo apt update && sudo apt upgrade -y

# 2. Instalar Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# 3. Instalar PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# 4. Configurar PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# 5. Crear usuario y base de datos
sudo -u postgres psql -c "CREATE USER sicaii_user WITH PASSWORD 'ilovebts10';"
sudo -u postgres psql -c "CREATE DATABASE sicaii_db OWNER sicaii_user;"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE sicaii_db TO sicaii_user;"

# 6. Instalar Nginx
sudo apt install -y nginx

# 7. Instalar PM2
sudo npm install -g pm2

# 8. Configurar firewall
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw allow 3000/tcp
sudo ufw --force enable

# 9. En el directorio del proyecto (/var/www/SICAII):
npm install
npm run build

# 10. Crear las tablas de la base de datos
psql -h localhost -U sicaii_user -d sicaii_db -f database/schema.sql
