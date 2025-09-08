#!/bin/bash

echo "=== DIAGNÓSTICO DE USUARIO ADMIN ==="

# Crear un archivo SQL temporal
cat > /tmp/check_user.sql << 'EOF'
SELECT username, email, first_name, last_name, role, is_active, 
       length(password) as password_length 
FROM users WHERE email = 'admin@sicaii.com';
EOF

# Ejecutar la consulta
PGPASSWORD=ilovebts10 psql -h localhost -U sicaii_user -d sicaii_db -f /tmp/check_user.sql

# Limpiar
rm /tmp/check_user.sql
