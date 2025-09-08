-- Eliminar usuario admin anterior
DELETE FROM users WHERE email = 'admin@sicaii.com';

-- Crear usuario admin con contraseña 'admin123'
-- Hash generado: $2b$10$K9jWKqpGqrI5tOr3D2aFc.bOZ0n5oQG5lFbKkHkm8CfR3D9YoMoXS
INSERT INTO users (
    username, 
    first_name, 
    last_name, 
    email, 
    password, 
    role, 
    is_active, 
    created_at, 
    updated_at
) VALUES (
    'admin', 
    'Administrador', 
    'SICAII', 
    'admin@sicaii.com', 
    '$2b$10$K9jWKqpGqrI5tOr3D2aFc.bOZ0n5oQG5lFbKkHkm8CfR3D9YoMoXS', 
    'admin', 
    true, 
    NOW(), 
    NOW()
);

-- Verificar que se creó
SELECT username, email, role, is_active FROM users WHERE email = 'admin@sicaii.com';
