# 🚀 Guía de Despliegue - SICAII

Esta guía te ayudará a desplegar SICAII en un servidor HP ProLiant ML115 con Debian 13.

## 📋 Prerrequisitos del Servidor

### 1. Actualizar sistema
```bash
sudo apt update && sudo apt upgrade -y
```

### 2. Instalar Node.js 18+
```bash
# Instalar Node.js via NodeSource
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verificar instalación
node --version
npm --version
```

### 3. Instalar PostgreSQL
```bash
# Instalar PostgreSQL
sudo apt install postgresql postgresql-contrib -y

# Iniciar servicio
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Configurar usuario y base de datos
sudo -u postgres psql -c "CREATE USER sicaii_user WITH PASSWORD 'secure_password_here';"
sudo -u postgres psql -c "CREATE DATABASE sicaii OWNER sicaii_user;"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE sicaii TO sicaii_user;"
```

### 4. Instalar PM2 globalmente
```bash
sudo npm install -g pm2
```

### 5. Instalar Nginx
```bash
sudo apt install nginx -y
sudo systemctl start nginx
sudo systemctl enable nginx
```

## 🔧 Despliegue de la Aplicación

### 1. Clonar repositorio
```bash
cd /var/www
sudo git clone https://github.com/OliverHuron/SICAII.git
sudo chown -R $USER:$USER /var/www/SICAII
cd /var/www/SICAII
```

### 2. Instalar dependencias
```bash
npm install --production
```

### 3. Configurar variables de entorno
```bash
# Copiar archivo de ejemplo
cp .env.example .env.local

# Editar configuración
nano .env.local
```

Configurar con tus valores:
```env
DATABASE_URL="postgresql://sicaii_user:secure_password_here@localhost:5432/sicaii"
NEXTAUTH_URL="https://tu-dominio.com"
NEXTAUTH_SECRET="tu-secret-key-super-seguro-de-produccion"
NODE_ENV="production"
```

### 4. Configurar base de datos
```bash
# Ejecutar esquema SQL
psql -h localhost -U sicaii_user -d sicaii -f database/schema.sql
```

### 5. Construir aplicación
```bash
npm run build
```

### 6. Configurar PM2

#### Opción A: Usando los scripts del package.json
```bash
# Iniciar aplicación
npm run pm2:start

# Ver logs
npm run pm2:logs

# Monitorear
npm run pm2:monitor
```

#### Opción B: Comandos PM2 directos
```bash
# Iniciar aplicación
pm2 start ecosystem.config.js --env production

# Configurar inicio automático
pm2 startup
pm2 save

# Ver estado
pm2 status
pm2 logs sicaii-inventory
```

## 🌐 Configuración de Nginx

### 1. Crear configuración del sitio
```bash
sudo nano /etc/nginx/sites-available/sicaii
```

Contenido del archivo:
```nginx
server {
    listen 80;
    server_name tu-dominio.com www.tu-dominio.com;

    # Redireccionar HTTP a HTTPS (opcional)
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name tu-dominio.com www.tu-dominio.com;

    # Configuración SSL (reemplaza con tus certificados)
    ssl_certificate /path/to/your/certificate.crt;
    ssl_certificate_key /path/to/your/private.key;
    
    # Configuración SSL moderna
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # Configuración del proxy
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Configuración de archivos estáticos
    location /_next/static {
        proxy_pass http://localhost:3000;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    # Logs
    access_log /var/log/nginx/sicaii_access.log;
    error_log /var/log/nginx/sicaii_error.log;
}
```

### 2. Habilitar sitio
```bash
# Crear enlace simbólico
sudo ln -s /etc/nginx/sites-available/sicaii /etc/nginx/sites-enabled/

# Probar configuración
sudo nginx -t

# Recargar Nginx
sudo systemctl reload nginx
```

## 🔒 Configuración de SSL (Let's Encrypt)

```bash
# Instalar Certbot
sudo apt install certbot python3-certbot-nginx -y

# Obtener certificado SSL
sudo certbot --nginx -d tu-dominio.com -d www.tu-dominio.com

# Configurar renovación automática
sudo crontab -e
# Agregar línea:
# 0 12 * * * /usr/bin/certbot renew --quiet
```

## 📊 Comandos de Monitoreo

### PM2
```bash
# Estado de aplicaciones
pm2 status

# Logs en tiempo real
pm2 logs sicaii-inventory --lines 100

# Monitoreo de recursos
pm2 monit

# Reiniciar aplicación
pm2 restart sicaii-inventory

# Recargar sin downtime
pm2 reload sicaii-inventory
```

### Sistema
```bash
# Uso de memoria y CPU
htop

# Espacio en disco
df -h

# Logs del sistema
sudo journalctl -u nginx -f
sudo journalctl -u postgresql -f
```

## 🔄 Actualizaciones

```bash
# Ir al directorio del proyecto
cd /var/www/SICAII

# Hacer backup de la base de datos
pg_dump -h localhost -U sicaii_user sicaii > backup_$(date +%Y%m%d).sql

# Actualizar código
git pull origin main

# Instalar nuevas dependencias
npm install --production

# Reconstruir aplicación
npm run build

# Recargar PM2 sin downtime
pm2 reload sicaii-inventory
```

## ⚠️ Troubleshooting

### Problema: PM2 no encuentra el comando
```bash
# Verificar que Node.js esté en PATH
which node
which npm

# Si no están disponibles, agregar al PATH
echo 'export PATH=$PATH:/usr/bin' >> ~/.bashrc
source ~/.bashrc
```

### Problema: Error de conexión a base de datos
```bash
# Verificar que PostgreSQL esté corriendo
sudo systemctl status postgresql

# Probar conexión
psql -h localhost -U sicaii_user -d sicaii -c "SELECT 1;"
```

### Problema: Aplicación no responde
```bash
# Ver logs de PM2
pm2 logs sicaii-inventory

# Ver logs de Nginx
sudo tail -f /var/log/nginx/sicaii_error.log

# Verificar puertos
sudo netstat -tulnp | grep :3000
```

## 🎯 Optimizaciones de Rendimiento

### 1. Configurar Swap (si es necesario)
```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

### 2. Optimizar PostgreSQL
```bash
sudo nano /etc/postgresql/15/main/postgresql.conf
```

Ajustes recomendados:
```
shared_buffers = 256MB
effective_cache_size = 1GB
maintenance_work_mem = 64MB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
```

### 3. Configurar firewall
```bash
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw --force enable
```

## ✅ Verificación Final

1. **Aplicación funcionando**: `curl -I http://localhost:3000`
2. **PM2 corriendo**: `pm2 status`
3. **Nginx sirviendo**: `curl -I http://tu-dominio.com`
4. **Base de datos conectada**: Intentar hacer login en la aplicación
5. **SSL funcionando**: `curl -I https://tu-dominio.com`

¡Tu aplicación SICAII ahora está desplegada y lista para usar en producción! 🎉
