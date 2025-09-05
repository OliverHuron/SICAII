-- ===========================================
-- SICAII - Sistema de Inventario Completo
-- Esquema de Base de Datos PostgreSQL
-- ===========================================

-- Configuración inicial
SET timezone = 'America/Mexico_City';

-- ===========================================
-- TABLA: departments (Departamentos)
-- ===========================================
CREATE TABLE departments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===========================================
-- TABLA: categories (Categorías)
-- ===========================================
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===========================================
-- TABLA: users (Usuarios)
-- ===========================================
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'user')),
    department_id INTEGER REFERENCES departments(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===========================================
-- TABLA: inventory (Inventario)
-- ===========================================
CREATE TABLE inventory (
    id SERIAL PRIMARY KEY,
    folio VARCHAR(50) NOT NULL UNIQUE,
    brand VARCHAR(255) NOT NULL,
    model VARCHAR(255) NOT NULL,
    category_id INTEGER REFERENCES categories(id),
    department_id INTEGER REFERENCES departments(id),
    status VARCHAR(20) NOT NULL CHECK (status IN ('available', 'in_use', 'maintenance', 'out_of_service')),
    serial_number VARCHAR(255),
    purchase_date DATE,
    warranty_expiry DATE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===========================================
-- TABLA: requests (Solicitudes)
-- ===========================================
CREATE TABLE requests (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    inventory_id INTEGER REFERENCES inventory(id),
    description TEXT NOT NULL,
    priority VARCHAR(10) NOT NULL CHECK (priority IN ('low', 'medium', 'high')),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
    department_id INTEGER NOT NULL REFERENCES departments(id),
    admin_notes TEXT,
    rejection_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===========================================
-- ÍNDICES PARA OPTIMIZACIÓN
-- ===========================================
CREATE INDEX idx_inventory_folio ON inventory(folio);
CREATE INDEX idx_inventory_status ON inventory(status);
CREATE INDEX idx_inventory_category ON inventory(category_id);
CREATE INDEX idx_inventory_department ON inventory(department_id);
CREATE INDEX idx_requests_user ON requests(user_id);
CREATE INDEX idx_requests_status ON requests(status);
CREATE INDEX idx_requests_priority ON requests(priority);
CREATE INDEX idx_requests_department ON requests(department_id);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_active ON users(is_active);

-- ===========================================
-- TRIGGERS PARA UPDATED_AT AUTOMÁTICO
-- ===========================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_departments_updated_at BEFORE UPDATE ON departments 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inventory_updated_at BEFORE UPDATE ON inventory 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_requests_updated_at BEFORE UPDATE ON requests 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===========================================
-- DATOS INICIALES (SEED DATA)
-- ===========================================

-- Departamentos por defecto
INSERT INTO departments (name, description) VALUES 
('Tecnología', 'Departamento de Tecnología e Informática'),
('Recursos Humanos', 'Departamento de Recursos Humanos'),
('Administración', 'Departamento Administrativo'),
('Ventas', 'Departamento de Ventas'),
('Contabilidad', 'Departamento de Contabilidad');

-- Categorías por defecto
INSERT INTO categories (name, description) VALUES 
('Computadoras', 'Equipos de cómputo desktop y laptop'),
('Impresoras', 'Impresoras y equipos de impresión'),
('Monitores', 'Monitores y pantallas'),
('Accesorios', 'Accesorios informáticos (mouse, teclado, etc.)'),
('Mobiliario', 'Mobiliario y muebles de oficina'),
('Electrónicos', 'Equipos electrónicos diversos');

-- Usuario administrador por defecto
-- Contraseña: admin123 (hash con bcrypt)
INSERT INTO users (username, first_name, last_name, email, password, role, department_id) VALUES 
('admin', 'Administrador', 'Sistema', 'admin@sicaii.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewaBnBdmCrLeikin', 'admin', 1);

-- Usuario de ejemplo
-- Contraseña: user123 (hash con bcrypt)
INSERT INTO users (username, first_name, last_name, email, password, role, department_id) VALUES 
('usuario', 'Juan', 'Pérez', 'usuario@sicaii.com', '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'user', 2);

-- Elementos de inventario de ejemplo
INSERT INTO inventory (folio, brand, model, category_id, department_id, status, serial_number, purchase_date, warranty_expiry, notes) VALUES 
('COMP-001', 'Dell', 'OptiPlex 7090', 1, 1, 'available', 'DL7090001', '2024-01-15', '2027-01-15', 'Computadora de escritorio para desarrollo'),
('COMP-002', 'HP', 'EliteBook 840', 1, 2, 'in_use', 'HP840002', '2024-02-10', '2027-02-10', 'Laptop para gerente de RH'),
('IMP-001', 'Canon', 'PIXMA G3110', 2, 3, 'available', 'CN3110001', '2024-01-20', '2025-01-20', 'Impresora multifuncional'),
('MON-001', 'Samsung', '24" Full HD', 3, 1, 'available', 'SM24001', '2024-01-25', '2027-01-25', 'Monitor para estación de trabajo');

-- Solicitudes de ejemplo
INSERT INTO requests (user_id, inventory_id, description, priority, status, department_id, admin_notes) VALUES 
(2, NULL, 'Solicitud de computadora nueva para el área de recursos humanos', 'medium', 'pending', 2, NULL),
(2, 1, 'Solicitar asignación de computadora Dell para nuevo empleado', 'high', 'approved', 2, 'Aprobado para asignación inmediata');

-- ===========================================
-- COMENTARIOS Y DOCUMENTACIÓN
-- ===========================================

COMMENT ON TABLE departments IS 'Departamentos de la organización';
COMMENT ON TABLE categories IS 'Categorías de elementos de inventario';
COMMENT ON TABLE users IS 'Usuarios del sistema con roles admin/user';
COMMENT ON TABLE inventory IS 'Elementos del inventario con estados y tracking';
COMMENT ON TABLE requests IS 'Solicitudes de equipos por parte de usuarios';

COMMENT ON COLUMN inventory.status IS 'Estados: available, in_use, maintenance, out_of_service';
COMMENT ON COLUMN requests.priority IS 'Prioridades: low, medium, high';
COMMENT ON COLUMN requests.status IS 'Estados: pending, approved, rejected, completed';
COMMENT ON COLUMN users.role IS 'Roles: admin, user';

-- ===========================================
-- CONSULTAS ÚTILES PARA VERIFICACIÓN
-- ===========================================

-- Verificar creación de tablas
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';

-- Verificar datos iniciales
-- SELECT 'departments' as tabla, count(*) as registros FROM departments
-- UNION ALL
-- SELECT 'categories', count(*) FROM categories  
-- UNION ALL
-- SELECT 'users', count(*) FROM users
-- UNION ALL
-- SELECT 'inventory', count(*) FROM inventory
-- UNION ALL
-- SELECT 'requests', count(*) FROM requests;
