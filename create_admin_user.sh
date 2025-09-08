#!/bin/bash

echo "=== CREANDO USUARIO ADMIN PARA SICAII ==="

# Generar hash de password para "admin123"
# Este es el hash de bcrypt para "admin123"
PASSWORD_HASH='$2b$10$rQZ8Y8qQYHuCqQYhHjrZje8YE.KjKfB8TwN2KzPtFqH8kQvL9YQdW'

echo "👤 Creando usuario administrador..."

# Crear usuario admin
PGPASSWORD=ilovebts10 psql -h localhost -U sicaii_user -d sicaii_db -c "
INSERT INTO users (email, password, full_name, role, is_active, created_at, updated_at) 
VALUES (
    'admin@sicaii.com', 
    '${PASSWORD_HASH}', 
    'Administrador SICAII', 
    'admin', 
    true,
    NOW(),
    NOW()
) 
ON CONFLICT (email) DO UPDATE SET
    password = EXCLUDED.password,
    updated_at = NOW();
"

if [ $? -eq 0 ]; then
    echo "✅ Usuario admin creado exitosamente!"
    echo ""
    echo "📋 CREDENCIALES DE ACCESO:"
    echo "URL: http://10.0.2.15:3001"
    echo "Email: admin@sicaii.com"
    echo "Password: admin123"
else
    echo "❌ Error al crear el usuario admin"
    echo "Verifica que PostgreSQL esté configurado correctamente"
fi
