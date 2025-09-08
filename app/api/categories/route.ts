import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { query } from '@/lib/db'

export const runtime = 'nodejs'

// GET /api/categories - Obtener todas las categorías
export async function GET() {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const result = await query(`
      SELECT id, name, description, created_at, updated_at
      FROM categories
      ORDER BY name ASC
    `)

    return NextResponse.json(result.rows)

  } catch (error) {
    console.error('Categories GET error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

// POST /api/categories - Crear nueva categoría (solo admin)
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { name, description } = body

    // Validación básica
    if (!name) {
      return NextResponse.json({ error: 'El nombre es requerido' }, { status: 400 })
    }

    // Verificar que no exista una categoría con el mismo nombre
    const existingCategory = await query('SELECT id FROM categories WHERE name = $1', [name])
    if (existingCategory.rows.length > 0) {
      return NextResponse.json({ error: 'Ya existe una categoría con ese nombre' }, { status: 400 })
    }

    // Crear categoría
    const insertQuery = `
      INSERT INTO categories (name, description)
      VALUES ($1, $2)
      RETURNING id, name, description, created_at, updated_at
    `

    const result = await query(insertQuery, [name, description || null])

    return NextResponse.json({
      message: 'Categoría creada exitosamente',
      category: result.rows[0]
    }, { status: 201 })

  } catch (error) {
    console.error('Categories POST error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
