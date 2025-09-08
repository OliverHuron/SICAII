#!/bin/bash

echo "=== INSTALACIÓN COMPLETA DE SICAII ==="
echo "Este script instalará todos los componentes necesarios"

# Actualizar el sistema
echo "📦 Actualizando el sistema..."
apt update && apt upgrade -y

# Instalar Node.js y npm
echo "📦 Instalando Node.js 18..."
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# Verificar instalación de Node.js
echo "✅ Node.js version: $(node --version)"
echo "✅ NPM version: $(npm --version)"

# Instalar PostgreSQL
echo "📦 Instalando PostgreSQL..."
apt install -y postgresql postgresql-contrib

# Configurar PostgreSQL
echo "🔧 Configurando PostgreSQL..."
systemctl start postgresql
systemctl enable postgresql

# Crear usuario y base de datos
echo "🔧 Creando usuario y base de datos..."
sudo -u postgres psql -c "CREATE USER sicaii_user WITH PASSWORD 'ilovebts10';"
sudo -u postgres psql -c "CREATE DATABASE sicaii_db OWNER sicaii_user;"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE sicaii_db TO sicaii_user;"

# Instalar Nginx
echo "📦 Instalando Nginx..."
apt install -y nginx

# Instalar PM2 globalmente
echo "📦 Instalando PM2..."
npm install -g pm2

# Configurar firewall UFW
echo "🔧 Configurando firewall..."
ufw allow ssh
ufw allow 'Nginx Full'
ufw allow 3000/tcp
ufw --force enable

echo "✅ Instalación base completada!"
echo ""
echo "Siguientes pasos:"
echo "1. Instalar dependencias del proyecto: npm install"
echo "2. Crear las tablas de la base de datos"
echo "3. Construir el proyecto: npm run build"
echo "4. Configurar Nginx"
echo "5. Iniciar con PM2"
