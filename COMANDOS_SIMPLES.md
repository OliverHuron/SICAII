# 🚀 Comandos Simples para Despliegue - SICAII

## 📥 Actualizar código desde GitHub:
```bash
cd /var/www/sicaii
git pull origin main
```

## 🔧 Opción 1: Intentar build de producción
```bash
# Limpiar build anterior
rm -rf .next

# Intentar build
npm run build

# Si funciona, iniciar:
npm run pm2:start
```

## 🔧 Opción 2: Usar modo desarrollo en producción (MÁS ESTABLE)
```bash
# Detener procesos previos
pm2 stop all
pm2 delete all

# Iniciar en modo desarrollo
npm run pm2:dev

# Verificar estado
pm2 status
pm2 logs sicaii-inventory
```

## 🔍 Verificar que funciona:
```bash
# Ver logs
pm2 logs sicaii-inventory

# Probar conexión
curl http://localhost:3000

# Ver procesos
pm2 status
```

## 🌐 Acceder a la aplicación:
- **URL**: http://192.168.101.110:3000
- **Usuario**: admin@sicaii.com
- **Contraseña**: admin123

## 🛠️ Comandos útiles:
```bash
# Reiniciar aplicación
pm2 restart sicaii-inventory

# Ver logs en tiempo real
pm2 logs sicaii-inventory --lines 50

# Detener aplicación
pm2 stop sicaii-inventory

# Eliminar aplicación de PM2
pm2 delete sicaii-inventory

# Ver estado de todos los procesos
pm2 status
```

## 🔥 Solución de problemas:
```bash
# Si hay problemas con puertos
sudo netstat -tlnp | grep :3000
sudo kill -9 $(sudo lsof -t -i:3000)

# Si hay problemas con permisos
sudo chown -R $USER:$USER /var/www/sicaii

# Si hay problemas con base de datos
psql -h localhost -U oliver -d sicaii -c "SELECT 1;"
```

## ⚠️ Recomendación:
**Usar Opción 2 (modo desarrollo en producción)** ya que es más estable para NextAuth con Next.js 15.
