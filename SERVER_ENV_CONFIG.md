# Configuración .env para Servidor HP ProLiant ML115

## Archivo .env que debes crear en el servidor:

```bash
# === CONFIGURACIÓN DE BASE DE DATOS ===
# PostgreSQL en el servidor HP ProLiant
DATABASE_URL="postgresql://sicaii_user:ilovebts10@localhost:5432/sicaii_db"

# === CONFIGURACIÓN DEL SERVIDOR ===
# IP del servidor para acceso desde la red
NEXT_PUBLIC_API_URL="http://192.168.3.188:3000"
NEXTAUTH_URL="http://192.168.3.188:3000"

# === AUTENTICACIÓN ===
# Genera una clave secreta única (ejecuta: openssl rand -base64 32)
NEXTAUTH_SECRET="tu_clave_secreta_generada_aqui"

# === CONFIGURACIÓN DE AMBIENTE ===
NODE_ENV="production"
PORT=3000

# === CONFIGURACIÓN DE RED ===
# Permitir acceso desde subredes 192.168.3.x y 192.168.33.x
ALLOWED_ORIGINS="http://192.168.3.188:3000,http://localhost:3000"
```

## Pasos detallados para configurar:

### 1. Conectarse al servidor por SSH:
```bash
ssh usuario@192.168.3.188
```

### 2. Instalar dependencias del sistema:
```bash
sudo apt update
sudo apt install -y nodejs npm postgresql postgresql-contrib git
```

### 3. Configurar PostgreSQL:
```bash
# Cambiar a usuario postgres
sudo -u postgres psql

# Crear base de datos y usuario
CREATE DATABASE sicaii_db;
CREATE USER sicaii_user WITH PASSWORD 'ilovebts10';
GRANT ALL PRIVILEGES ON DATABASE sicaii_db TO sicaii_user;
\q
```

### 4. Clonar y configurar el proyecto:
```bash
# Clonar repositorio
git clone https://github.com/OliverHuron/SICAII.git
cd SICAII

# Crear archivo .env
cp .env.example .env
nano .env
```

### 5. Generar clave secreta para NextAuth:
```bash
# Generar clave secreta única
openssl rand -base64 32
```

### 6. Editar el archivo .env con nano:
- Pegar la configuración mostrada arriba
- Reemplazar "tu_clave_secreta_generada_aqui" con la clave generada
- Guardar con Ctrl+X, Y, Enter

### 7. Instalar dependencias y ejecutar migraciones:
```bash
# Instalar dependencias
npm install

# Ejecutar migraciones de base de datos
npm run db:migrate

# Construir para producción
npm run build
```

### 8. Configurar PM2 para producción:
```bash
# Instalar PM2 globalmente
sudo npm install -g pm2

# Iniciar aplicación con PM2
pm2 start ecosystem.config.js --env production

# Configurar PM2 para auto-inicio
pm2 startup
pm2 save
```

## Verificación:

### Probar conectividad:
```bash
# Verificar que PostgreSQL esté corriendo
sudo systemctl status postgresql

# Verificar que la aplicación esté corriendo
pm2 status

# Probar conexión a la base de datos
psql postgresql://sicaii_user:ilovebts10@localhost:5432/sicaii_db -c "SELECT 1;"
```

### Acceder desde tu PC:
- Abrir navegador en tu PC Windows
- Ir a: `http://192.168.3.188:3000`
- Login con: admin@sicaii.com / admin123

## Firewall (si es necesario):
```bash
# Abrir puerto 3000
sudo ufw allow 3000
sudo ufw reload
```
