import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { query } from '@/lib/db'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = 10
    const offset = (page - 1) * limit
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''
    const category = searchParams.get('category') || ''
    const department = searchParams.get('department') || ''

    let whereConditions = []
    let queryParams: any[] = []
    let paramIndex = 1

    if (search) {
      whereConditions.push(`(i.folio ILIKE $${paramIndex} OR i.brand ILIKE $${paramIndex} OR i.model ILIKE $${paramIndex})`)
      queryParams.push(`%${search}%`)
      paramIndex++
    }

    if (status) {
      whereConditions.push(`i.status = $${paramIndex}`)
      queryParams.push(status)
      paramIndex++
    }

    if (category) {
      whereConditions.push(`i.category_id = $${paramIndex}`)
      queryParams.push(parseInt(category))
      paramIndex++
    }

    if (department) {
      whereConditions.push(`i.department_id = $${paramIndex}`)
      queryParams.push(parseInt(department))
      paramIndex++
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : ''

    // Consulta principal con paginación
    const inventoryQuery = `
      SELECT 
        i.id, i.folio, i.brand, i.model, i.status, i.serial_number, 
        i.purchase_date, i.warranty_expiry, i.notes, i.created_at,
        c.name as category_name,
        d.name as department_name
      FROM inventory i
      LEFT JOIN categories c ON i.category_id = c.id
      LEFT JOIN departments d ON i.department_id = d.id
      ${whereClause}
      ORDER BY i.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `

    queryParams.push(limit, offset)
    const result = await query(inventoryQuery, queryParams)

    // Consulta para el total de elementos (sin paginación)
    const countQuery = `
      SELECT COUNT(*) as total
      FROM inventory i
      LEFT JOIN categories c ON i.category_id = c.id
      LEFT JOIN departments d ON i.department_id = d.id
      ${whereClause}
    `

    const countResult = await query(countQuery, queryParams.slice(0, -2)) // Remove limit and offset params
    const total = parseInt(countResult.rows[0].total)
    const totalPages = Math.ceil(total / limit)

    return NextResponse.json({
      items: result.rows,
      currentPage: page,
      totalPages,
      total
    })

  } catch (error) {
    console.error('Inventory API error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const {
      folio,
      brand,
      model,
      category_id,
      department_id,
      status = 'Bueno',
      serial_number,
      purchase_date,
      warranty_expiry,
      notes
    } = body

    // Validaciones básicas
    if (!folio || !brand || !model || !category_id || !department_id) {
      return NextResponse.json({ error: 'Campos requeridos faltantes' }, { status: 400 })
    }

    // Verificar que el folio no exista
    const existingFolio = await query('SELECT id FROM inventory WHERE folio = $1', [folio])
    if (existingFolio.rows.length > 0) {
      return NextResponse.json({ error: 'El folio ya existe' }, { status: 400 })
    }

    // Insertar nuevo elemento
    const insertQuery = `
      INSERT INTO inventory (
        folio, brand, model, category_id, department_id, status,
        serial_number, purchase_date, warranty_expiry, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING id
    `

    const result = await query(insertQuery, [
      folio,
      brand,
      model,
      category_id,
      department_id,
      status,
      serial_number || null,
      purchase_date || null,
      warranty_expiry || null,
      notes || null
    ])

    return NextResponse.json({ id: result.rows[0].id, message: 'Elemento creado exitosamente' })

  } catch (error) {
    console.error('Inventory POST error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
