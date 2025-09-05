# ===========================================
# SICAII - Script de Configuración para Windows
# ===========================================
# PowerShell script para configurar variables de entorno en Windows

Write-Host "🚀 SICAII - Configuración Automática de Variables de Entorno" -ForegroundColor Cyan
Write-Host "=============================================================" -ForegroundColor Cyan

# Función para generar contraseña segura
function New-SecurePassword {
    $chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*"
    $password = ""
    for ($i = 0; $i -lt 25; $i++) {
        $password += $chars[(Get-Random -Maximum $chars.Length)]
    }
    return $password
}

# Función para generar NextAuth secret
function New-NextAuthSecret {
    $bytes = New-Object byte[] 32
    [System.Security.Cryptography.RNGCryptoServiceProvider]::Create().GetBytes($bytes)
    return [Convert]::ToBase64String($bytes)
}

# Detectar entorno
Write-Host ""
Write-Host "📋 Configuración del Entorno:" -ForegroundColor Yellow
Write-Host "1) Desarrollo Local"
Write-Host "2) Producción en Servidor Debian 13"
Write-Host "3) Configuración Personalizada"
Write-Host ""
$envChoice = Read-Host "Selecciona tu entorno (1-3)"

# Obtener IP del servidor
Write-Host ""
$serverIp = Read-Host "🌐 Ingresa la IP de tu servidor (ejemplo: 192.168.3.188)"
if ([string]::IsNullOrEmpty($serverIp)) {
    $serverIp = "192.168.3.188"
}

# Configurar base de datos
Write-Host ""
Write-Host "🗄️ Configuración de Base de Datos:" -ForegroundColor Yellow
$dbUser = Read-Host "Usuario de PostgreSQL (default: sicaii_user)"
if ([string]::IsNullOrEmpty($dbUser)) {
    $dbUser = "sicaii_user"
}

$dbName = Read-Host "Nombre de la base de datos (default: sicaii_db)"
if ([string]::IsNullOrEmpty($dbName)) {
    $dbName = "sicaii_db"
}

# Configurar contraseña
Write-Host ""
Write-Host "🔐 Configuración de Contraseña:" -ForegroundColor Yellow
Write-Host "1) Usar contraseña existente: ilovebts10"
Write-Host "2) Generar contraseña segura automáticamente"
Write-Host "3) Ingresaré una contraseña personalizada"
Write-Host ""
$pwdChoice = Read-Host "Selecciona opción (1-3)"

switch ($pwdChoice) {
    "1" {
        $dbPassword = "ilovebts10"
        Write-Host "⚠️  ADVERTENCIA: Usando contraseña por defecto. Cámbiala en producción." -ForegroundColor Red
    }
    "2" {
        $dbPassword = New-SecurePassword
        Write-Host "✅ Contraseña generada automáticamente: $dbPassword" -ForegroundColor Green
    }
    "3" {
        $dbPassword = Read-Host "Ingresa tu contraseña" -AsSecureString
        $dbPassword = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($dbPassword))
    }
}

# Generar NextAuth Secret
$nextauthSecret = New-NextAuthSecret

# Crear archivo .env
$envFile = ".env"
if ($envChoice -eq "1") {
    $envFile = ".env.local"
}

Write-Host ""
Write-Host "📝 Creando archivo $envFile..." -ForegroundColor Yellow

$currentDate = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

$envContent = @"
# ===========================================
# SICAII - Variables de Entorno Configuradas
# Generado automáticamente el $currentDate
# ===========================================

# ===========================================
# CONFIGURACIÓN DE BASE DE DATOS
# ===========================================
DATABASE_URL="postgresql://$dbUser`:$dbPassword@localhost:5432/$dbName"

# ===========================================
# CONFIGURACIÓN DE NEXTAUTH.JS
# ===========================================
"@

if ($envChoice -eq "1") {
    $envContent += @"

NEXTAUTH_URL="http://localhost:3000"
NEXT_PUBLIC_API_URL="http://localhost:3000"
NODE_ENV="development"
"@
} else {
    $envContent += @"

NEXTAUTH_URL="http://$serverIp"
NEXT_PUBLIC_API_URL="http://$serverIp"
NODE_ENV="production"
"@
}

$envContent += @"

NEXTAUTH_SECRET="$nextauthSecret"

# ===========================================
# CONFIGURACIÓN DE LA APLICACIÓN
# ===========================================
PORT=3000

# ===========================================
# INFORMACIÓN DEL SERVIDOR
# ===========================================
SERVER_IP="$serverIp"

# ===========================================
# COMANDOS PARA CONFIGURAR POSTGRESQL
# ===========================================
# Ejecuta estos comandos en tu servidor:
#
# sudo -i -u postgres
# psql
# CREATE USER $dbUser WITH PASSWORD '$dbPassword';
# CREATE DATABASE $dbName OWNER $dbUser;
# GRANT ALL PRIVILEGES ON DATABASE $dbName TO $dbUser;
# \q
# exit
#
# Verificar conexión:
# psql -h localhost -U $dbUser -d $dbName -c "SELECT 1;"
"@

$envContent | Out-File -FilePath $envFile -Encoding UTF8

Write-Host "✅ Archivo $envFile creado exitosamente!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Resumen de la configuración:" -ForegroundColor Cyan
Write-Host "  - Base de datos: postgresql://$dbUser`:***@localhost:5432/$dbName"
Write-Host "  - Servidor: $serverIp"
Write-Host "  - Entorno: $(if ($envChoice -eq '1') { 'Desarrollo' } else { 'Producción' })"
Write-Host "  - NextAuth Secret: Generado automáticamente"
Write-Host ""

if ($envChoice -eq "2") {
    Write-Host "🔧 Próximos pasos para producción:" -ForegroundColor Yellow
    Write-Host "1. Configura PostgreSQL con los comandos mostrados en el archivo .env"
    Write-Host "2. Ejecuta: npm install"
    Write-Host "3. Ejecuta: npm run build"
    Write-Host "4. Ejecuta: npm run pm2:start"
    Write-Host "5. Configura Nginx según la guía de despliegue"
    Write-Host ""
}

Write-Host "⚠️  IMPORTANTE:" -ForegroundColor Red
Write-Host "  - Este archivo contiene información sensible"
Write-Host "  - NO lo subas al repositorio Git"
Write-Host "  - Mantén una copia de respaldo segura"
Write-Host ""
Write-Host "🎉 ¡Configuración completada!" -ForegroundColor Green

# Pausa para que el usuario pueda leer los resultados
Read-Host "Presiona Enter para continuar..."
