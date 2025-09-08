// Configuración temporal sin base de datos para pruebas
import { Pool } from 'pg'

let pool: Pool

// Mock pool para desarrollo sin base de datos
if (process.env.NODE_ENV === 'development' && !process.env.DATABASE_URL?.includes('sicaii_db')) {
  pool = {
    query: async () => ({ rows: [] }),
    connect: async () => ({ release: () => {}, query: async () => ({ rows: [] }) }),
    end: async () => {}
  } as any
} else {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  })
}

export const query = (text: string, params?: any[]) => pool.query(text, params)

export default pool
