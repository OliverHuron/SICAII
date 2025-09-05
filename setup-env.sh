#!/bin/bash

# ===========================================
# SICAII - Script de Configuración Automática
# ===========================================
# Este script ayuda a configurar el archivo .env para SICAII

echo "🚀 SICAII - Configuración Automática de Variables de Entorno"
echo "============================================================="

# Función para generar contraseña segura
generate_password() {
    openssl rand -base64 32 | tr -d "=+/" | cut -c1-25
}

# Función para generar secret de NextAuth
generate_nextauth_secret() {
    openssl rand -base64 32
}

# Detectar entorno
echo ""
echo "📋 Configuración del Entorno:"
echo "1) Desarrollo Local"
echo "2) Producción en Servidor Debian 13"
echo "3) Configuración Personalizada"
echo ""
read -p "Selecciona tu entorno (1-3): " env_choice

# Obtener IP del servidor
echo ""
read -p "🌐 Ingresa la IP de tu servidor (ejemplo: 192.168.3.188): " server_ip
if [ -z "$server_ip" ]; then
    server_ip="192.168.3.188"
fi

# Configurar base de datos
echo ""
echo "🗄️ Configuración de Base de Datos:"
read -p "Usuario de PostgreSQL (default: sicaii_user): " db_user
if [ -z "$db_user" ]; then
    db_user="sicaii_user"
fi

read -p "Nombre de la base de datos (default: sicaii_db): " db_name
if [ -z "$db_name" ]; then
    db_name="sicaii_db"
fi

# Configurar contraseña
echo ""
echo "🔐 Configuración de Contraseña:"
echo "1) Usar contraseña existente: ilovebts10"
echo "2) Generar contraseña segura automáticamente"
echo "3) Ingresaré una contraseña personalizada"
echo ""
read -p "Selecciona opción (1-3): " pwd_choice

case $pwd_choice in
    1)
        db_password="ilovebts10"
        echo "⚠️  ADVERTENCIA: Usando contraseña por defecto. Cámbiala en producción."
        ;;
    2)
        db_password=$(generate_password)
        echo "✅ Contraseña generada automáticamente: $db_password"
        ;;
    3)
        read -s -p "Ingresa tu contraseña: " db_password
        echo ""
        ;;
esac

# Generar NextAuth Secret
nextauth_secret=$(generate_nextauth_secret)

# Crear archivo .env
env_file=".env"
if [ "$env_choice" = "1" ]; then
    env_file=".env.local"
fi

echo ""
echo "📝 Creando archivo $env_file..."

cat > $env_file << EOF
# ===========================================
# SICAII - Variables de Entorno Configuradas
# Generado automáticamente el $(date)
# ===========================================

# ===========================================
# CONFIGURACIÓN DE BASE DE DATOS
# ===========================================
DATABASE_URL="postgresql://$db_user:$db_password@localhost:5432/$db_name"

# ===========================================
# CONFIGURACIÓN DE NEXTAUTH.JS
# ===========================================
EOF

if [ "$env_choice" = "1" ]; then
    cat >> $env_file << EOF
NEXTAUTH_URL="http://localhost:3000"
NEXT_PUBLIC_API_URL="http://localhost:3000"
NODE_ENV="development"
EOF
else
    cat >> $env_file << EOF
NEXTAUTH_URL="http://$server_ip"
NEXT_PUBLIC_API_URL="http://$server_ip"
NODE_ENV="production"
EOF
fi

cat >> $env_file << EOF

NEXTAUTH_SECRET="$nextauth_secret"

# ===========================================
# CONFIGURACIÓN DE LA APLICACIÓN
# ===========================================
PORT=3000

# ===========================================
# INFORMACIÓN DEL SERVIDOR
# ===========================================
SERVER_IP="$server_ip"

# ===========================================
# COMANDOS PARA CONFIGURAR POSTGRESQL
# ===========================================
# Ejecuta estos comandos en tu servidor:
#
# sudo -i -u postgres
# psql
# CREATE USER $db_user WITH PASSWORD '$db_password';
# CREATE DATABASE $db_name OWNER $db_user;
# GRANT ALL PRIVILEGES ON DATABASE $db_name TO $db_user;
# \q
# exit
#
# Verificar conexión:
# psql -h localhost -U $db_user -d $db_name -c "SELECT 1;"
EOF

echo "✅ Archivo $env_file creado exitosamente!"
echo ""
echo "📋 Resumen de la configuración:"
echo "  - Base de datos: postgresql://$db_user:***@localhost:5432/$db_name"
echo "  - Servidor: $server_ip"
echo "  - Entorno: $(if [ "$env_choice" = "1" ]; then echo "Desarrollo"; else echo "Producción"; fi)"
echo "  - NextAuth Secret: Generado automáticamente"
echo ""

if [ "$env_choice" = "2" ]; then
    echo "🔧 Próximos pasos para producción:"
    echo "1. Configura PostgreSQL con los comandos mostrados en el archivo .env"
    echo "2. Ejecuta: npm install"
    echo "3. Ejecuta: npm run build"
    echo "4. Ejecuta: npm run pm2:start"
    echo "5. Configura Nginx según la guía de despliegue"
    echo ""
fi

echo "⚠️  IMPORTANTE:"
echo "  - Este archivo contiene información sensible"
echo "  - NO lo subas al repositorio Git"
echo "  - Mantén una copia de respaldo segura"
echo ""
echo "🎉 ¡Configuración completada!"
EOF
