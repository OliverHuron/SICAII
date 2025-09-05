import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { query } from '@/lib/db'
import bcrypt from 'bcryptjs'

// GET /api/users - Obtener usuarios con filtros y paginación (solo admin)
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const role = searchParams.get('role') || ''
    const department = searchParams.get('department') || ''
    const status = searchParams.get('status') || ''
    const offset = (page - 1) * limit

    let whereClause = '1=1'
    let params: any[] = []
    let paramIndex = 1

    // Filtro de búsqueda
    if (search) {
      whereClause += ` AND (u.username ILIKE $${paramIndex} OR u.first_name ILIKE $${paramIndex} OR u.last_name ILIKE $${paramIndex} OR u.email ILIKE $${paramIndex})`
      params.push(`%${search}%`)
      paramIndex++
    }

    // Filtro por rol
    if (role) {
      whereClause += ` AND u.role = $${paramIndex}`
      params.push(role)
      paramIndex++
    }

    // Filtro por departamento
    if (department) {
      whereClause += ` AND u.department_id = $${paramIndex}`
      params.push(parseInt(department))
      paramIndex++
    }

    // Filtro por estado
    if (status) {
      whereClause += ` AND u.is_active = $${paramIndex}`
      params.push(status === 'active')
      paramIndex++
    }

    const queryStr = `
      SELECT 
        u.id,
        u.username,
        u.first_name,
        u.last_name,
        u.email,
        u.role,
        u.is_active,
        u.created_at,
        u.updated_at,
        d.name as department_name
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.id
      WHERE ${whereClause}
      ORDER BY u.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `

    params.push(limit, offset)

    const result = await query(queryStr, params)

    // Contar total de registros
    const countQuery = `
      SELECT COUNT(*) as total
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.id
      WHERE ${whereClause}
    `
    const countResult = await query(countQuery, params.slice(0, -2))
    const total = parseInt(countResult.rows[0].total)
    const totalPages = Math.ceil(total / limit)

    return NextResponse.json({
      users: result.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    })

  } catch (error) {
    console.error('Users GET error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

// POST /api/users - Crear nuevo usuario (solo admin)
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const {
      username,
      first_name,
      last_name,
      email,
      password,
      role,
      department_id,
      is_active = true
    } = body

    // Validaciones básicas
    if (!username || !first_name || !last_name || !email || !password || !role) {
      return NextResponse.json({ 
        error: 'Username, nombre, apellido, email, contraseña y rol son requeridos' 
      }, { status: 400 })
    }

    // Verificar que el username no exista
    const existingUsername = await query('SELECT id FROM users WHERE username = $1', [username])
    if (existingUsername.rows.length > 0) {
      return NextResponse.json({ error: 'El username ya existe' }, { status: 400 })
    }

    // Verificar que el email no exista
    const existingEmail = await query('SELECT id FROM users WHERE email = $1', [email])
    if (existingEmail.rows.length > 0) {
      return NextResponse.json({ error: 'El email ya existe' }, { status: 400 })
    }

    // Verificar que el departamento existe si se proporciona
    if (department_id) {
      const departmentExists = await query('SELECT id FROM departments WHERE id = $1', [department_id])
      if (departmentExists.rows.length === 0) {
        return NextResponse.json({ error: 'Departamento no encontrado' }, { status: 400 })
      }
    }

    // Hashear contraseña
    const hashedPassword = await bcrypt.hash(password, 12)

    const insertQuery = `
      INSERT INTO users (
        username,
        first_name,
        last_name,
        email,
        password,
        role,
        department_id,
        is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id
    `

    const result = await query(insertQuery, [
      username,
      first_name,
      last_name,
      email,
      hashedPassword,
      role,
      department_id || null,
      is_active
    ])

    return NextResponse.json({ 
      message: 'Usuario creado exitosamente',
      id: result.rows[0].id
    }, { status: 201 })

  } catch (error) {
    console.error('Users POST error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
