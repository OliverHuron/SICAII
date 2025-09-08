#!/bin/bash

echo "=== VERIFICANDO Y RECREANDO USUARIO ADMIN ==="

# Conectar a PostgreSQL y verificar/crear usuario admin
PGPASSWORD=ilovebts10 psql -h localhost -U sicaii_user -d sicaii_db << 'EOF'

-- Eliminar usuario admin si existe
DELETE FROM users WHERE email = 'admin@sicaii.com';

-- Crear usuario admin con schema correcto
INSERT INTO users (username, first_name, last_name, email, password, role, is_active, created_at, updated_at) 
VALUES (
    'admin', 
    'Administrador', 
    'SICAII', 
    'admin@sicaii.com', 
    '$2b$10$rQZ8Y8qQYHuCqQYhHjrZje8YE.KjKfB8TwN2KzPtFqH8kQvL9YQdW', 
    'admin', 
    true, 
    NOW(), 
    NOW()
);

-- Verificar que se creó
SELECT username, email, first_name, last_name, role, is_active FROM users WHERE email = 'admin@sicaii.com';

EOF

echo ""
echo "✅ Usuario admin recreado correctamente!"
echo ""
echo "📋 CREDENCIALES DE ACCESO:"
echo "URL: http://10.0.2.15:3001"
echo "Email: admin@sicaii.com"
echo "Password: admin123"
