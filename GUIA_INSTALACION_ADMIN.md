# 🚀 GUÍA RÁPIDA PARA HACER VISIBLE SICAII

## ⚠️ PARA EL ADMINISTRADOR DEL SERVIDOR

**El usuario `oliver` ya tiene:**
- ✅ Código fuente de SICAII en `/var/www/SICAII`
- ✅ Archivo `.env` configurado 
- ✅ Permisos sobre el directorio SICAII
- ✅ Build del proyecto funcionando correctamente

**FALTA INSTALAR (requiere permisos root):**

### 1. Ejecutar como root:
```bash
# Instalar Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# Instalar PostgreSQL
apt install -y postgresql postgresql-contrib

# Instalar Nginx
apt install -y nginx

# Configurar servicios
systemctl start postgresql nginx
systemctl enable postgresql nginx

# Configurar firewall
ufw allow ssh
ufw allow 'Nginx Full'  
ufw allow 3000/tcp
ufw --force enable
```

### 2. Configurar PostgreSQL:
```bash
sudo -u postgres psql -c "CREATE USER sicaii_user WITH PASSWORD 'ilovebts10';"
sudo -u postgres psql -c "CREATE DATABASE sicaii_db OWNER sicaii_user;"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE sicaii_db TO sicaii_user;"
```

### 3. Configurar Nginx:
```bash
# Copiar configuración
cp /var/www/SICAII/nginx-sicaii.conf /etc/nginx/sites-available/sicaii
ln -s /etc/nginx/sites-available/sicaii /etc/nginx/sites-enabled/
rm /etc/nginx/sites-enabled/default
nginx -t
systemctl restart nginx
```

### 4. Instalar PM2:
```bash
npm install -g pm2
```

## 🔧 DESPUÉS EL USUARIO OLIVER PUEDE EJECUTAR:

```bash
cd /var/www/SICAII

# Instalar dependencias
npm install

# Crear tablas de la base de datos
psql -h localhost -U sicaii_user -d sicaii_db -f database/schema.sql

# Construir el proyecto
npm run build

# Iniciar con PM2
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup
```

## 📍 ACCESO AL SISTEMA:

- **Red local**: http://10.0.2.15
- **Internet**: http://187.191.8.1 (requiere port forwarding en router)

## 🛠️ PARA ACCESO DESDE INTERNET:

1. **Configurar port forwarding en router:**
   - Puerto externo: 80 → Puerto interno: 80 
   - IP destino: 10.0.2.15

2. **Actualizar .env para acceso público:**
   ```bash
   # Descomentar estas líneas en .env:
   NEXT_PUBLIC_API_URL="http://187.191.8.1:3000"
   NEXTAUTH_URL="http://187.191.8.1:3000"
   ```
