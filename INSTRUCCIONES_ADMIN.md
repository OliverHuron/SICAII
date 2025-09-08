# ================================================================
# COMANDOS QUE NECESITA EJECUTAR EL ADMINISTRADOR (ROOT)
# ================================================================

# 1. INSTALAR NODE.JS 18
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# 2. INSTALAR POSTGRESQL
apt update
apt install -y postgresql postgresql-contrib

# 3. CONFIGURAR POSTGRESQL
systemctl start postgresql
systemctl enable postgresql

# 4. CREAR USUARIO Y BASE DE DATOS DE SICAII
sudo -u postgres psql -c "CREATE USER sicaii_user WITH PASSWORD 'ilovebts10';"
sudo -u postgres psql -c "CREATE DATABASE sicaii_db OWNER sicaii_user;"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE sicaii_db TO sicaii_user;"

# 5. INSTALAR NGINX
apt install -y nginx
systemctl start nginx
systemctl enable nginx

# 6. CONFIGURAR FIREWALL
ufw allow ssh
ufw allow 'Nginx Full'
ufw allow 3000/tcp
ufw --force enable

# 7. INSTALAR PM2 (después de instalar Node.js)
npm install -g pm2

# ================================================================
# DESPUÉS DE QUE EL ADMIN EJECUTE LO ANTERIOR, TÚ PUEDES EJECUTAR:
# ================================================================

# 8. INSTALAR DEPENDENCIAS DEL PROYECTO
cd /var/www/SICAII
npm install

# 9. CREAR LAS TABLAS DE LA BASE DE DATOS
psql -h localhost -U sicaii_user -d sicaii_db -f database/schema.sql

# 10. CONSTRUIR EL PROYECTO
npm run build

# 11. CONFIGURAR NGINX PARA SICAII
# (El admin necesita crear el archivo de configuración)

# 12. INICIAR CON PM2
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup
