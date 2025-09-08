import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { query } from '@/lib/db'

export const runtime = 'nodejs'

// GET /api/departments - Obtener todos los departamentos
export async function GET() {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const result = await query(`
      SELECT id, name, description, created_at, updated_at
      FROM departments
      ORDER BY name ASC
    `)

    return NextResponse.json(result.rows)

  } catch (error) {
    console.error('Departments GET error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

// POST /api/departments - Crear nuevo departamento (solo admin)
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

    // Verificar que no exista un departamento con el mismo nombre
    const existingDepartment = await query('SELECT id FROM departments WHERE name = $1', [name])
    if (existingDepartment.rows.length > 0) {
      return NextResponse.json({ error: 'Ya existe un departamento con ese nombre' }, { status: 400 })
    }

    // Crear departamento
    const insertQuery = `
      INSERT INTO departments (name, description)
      VALUES ($1, $2)
      RETURNING id, name, description, created_at, updated_at
    `

    const result = await query(insertQuery, [name, description || null])

    return NextResponse.json({
      message: 'Departamento creado exitosamente',
      department: result.rows[0]
    }, { status: 201 })

  } catch (error) {
    console.error('Departments POST error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
