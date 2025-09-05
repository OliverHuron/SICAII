import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { query } from '@/lib/db'

// GET /api/requests - Obtener solicitudes con filtros y paginación
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''
    const priority = searchParams.get('priority') || ''
    const department = searchParams.get('department') || ''
    const offset = (page - 1) * limit

    let whereClause = '1=1'
    let params: any[] = []
    let paramIndex = 1

    // Solo admin puede ver todas las solicitudes, los usuarios solo las suyas
    if (session.user.role !== 'admin') {
      whereClause += ` AND r.user_id = $${paramIndex}`
      params.push(parseInt(session.user.id))
      paramIndex++
    }

    // Filtro de búsqueda
    if (search) {
      whereClause += ` AND (r.description ILIKE $${paramIndex} OR i.folio ILIKE $${paramIndex} OR i.brand ILIKE $${paramIndex} OR i.model ILIKE $${paramIndex})`
      params.push(`%${search}%`)
      paramIndex++
    }

    // Filtro por estado
    if (status) {
      whereClause += ` AND r.status = $${paramIndex}`
      params.push(status)
      paramIndex++
    }

    // Filtro por prioridad
    if (priority) {
      whereClause += ` AND r.priority = $${paramIndex}`
      params.push(priority)
      paramIndex++
    }

    // Filtro por departamento
    if (department) {
      whereClause += ` AND d.id = $${paramIndex}`
      params.push(parseInt(department))
      paramIndex++
    }

    const queryStr = `
      SELECT 
        r.*,
        u.username as user_name,
        u.first_name as user_first_name,
        u.last_name as user_last_name,
        i.folio as inventory_folio,
        i.brand as inventory_brand,
        i.model as inventory_model,
        d.name as department_name
      FROM requests r
      LEFT JOIN users u ON r.user_id = u.id
      LEFT JOIN inventory i ON r.inventory_id = i.id
      LEFT JOIN departments d ON r.department_id = d.id
      WHERE ${whereClause}
      ORDER BY r.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `

    params.push(limit, offset)

    const result = await query(queryStr, params)

    // Contar total de registros
    const countQuery = `
      SELECT COUNT(*) as total
      FROM requests r
      LEFT JOIN users u ON r.user_id = u.id
      LEFT JOIN inventory i ON r.inventory_id = i.id
      LEFT JOIN departments d ON r.department_id = d.id
      WHERE ${whereClause}
    `
    const countResult = await query(countQuery, params.slice(0, -2))
    const total = parseInt(countResult.rows[0].total)
    const totalPages = Math.ceil(total / limit)

    return NextResponse.json({
      requests: result.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    })

  } catch (error) {
    console.error('Requests GET error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

// POST /api/requests - Crear nueva solicitud
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const {
      inventory_id,
      description,
      priority,
      department_id,
      admin_notes
    } = body

    // Validaciones básicas
    if (!description || !priority || !department_id) {
      return NextResponse.json({ 
        error: 'Descripción, prioridad y departamento son requeridos' 
      }, { status: 400 })
    }

    // Verificar que el elemento de inventario existe si se proporciona
    if (inventory_id) {
      const inventoryExists = await query('SELECT id FROM inventory WHERE id = $1', [inventory_id])
      if (inventoryExists.rows.length === 0) {
        return NextResponse.json({ error: 'Elemento de inventario no encontrado' }, { status: 400 })
      }
    }

    // Verificar que el departamento existe
    const departmentExists = await query('SELECT id FROM departments WHERE id = $1', [department_id])
    if (departmentExists.rows.length === 0) {
      return NextResponse.json({ error: 'Departamento no encontrado' }, { status: 400 })
    }

    // Solo admin puede agregar notas administrativas
    const finalAdminNotes = session.user.role === 'admin' ? admin_notes : null

    const insertQuery = `
      INSERT INTO requests (
        user_id,
        inventory_id,
        description,
        priority,
        department_id,
        status,
        admin_notes
      ) VALUES ($1, $2, $3, $4, $5, 'pending', $6)
      RETURNING id
    `

    const result = await query(insertQuery, [
      parseInt(session.user.id),
      inventory_id || null,
      description,
      priority,
      department_id,
      finalAdminNotes
    ])

    return NextResponse.json({ 
      message: 'Solicitud creada exitosamente',
      id: result.rows[0].id
    }, { status: 201 })

  } catch (error) {
    console.error('Requests POST error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
