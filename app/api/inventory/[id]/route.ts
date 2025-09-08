import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { query } from '@/lib/db'

export const runtime = 'nodejs'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const id = parseInt(params.id)
    const result = await query(`
      SELECT 
        i.*, 
        c.name as category_name,
        d.name as department_name
      FROM inventory i
      LEFT JOIN categories c ON i.category_id = c.id
      LEFT JOIN departments d ON i.department_id = d.id
      WHERE i.id = $1
    `, [id])

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Elemento no encontrado' }, { status: 404 })
    }

    return NextResponse.json(result.rows[0])

  } catch (error) {
    console.error('Inventory GET error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const id = parseInt(params.id)
    const body = await request.json()
    const {
      folio,
      brand,
      model,
      category_id,
      department_id,
      status,
      serial_number,
      purchase_date,
      warranty_expiry,
      notes
    } = body

    // Verificar que el elemento existe
    const existingItem = await query('SELECT id FROM inventory WHERE id = $1', [id])
    if (existingItem.rows.length === 0) {
      return NextResponse.json({ error: 'Elemento no encontrado' }, { status: 404 })
    }

    // Verificar que el folio no esté duplicado (excluyendo el elemento actual)
    const existingFolio = await query('SELECT id FROM inventory WHERE folio = $1 AND id != $2', [folio, id])
    if (existingFolio.rows.length > 0) {
      return NextResponse.json({ error: 'El folio ya existe' }, { status: 400 })
    }

    // Actualizar elemento
    const updateQuery = `
      UPDATE inventory SET
        folio = $1,
        brand = $2,
        model = $3,
        category_id = $4,
        department_id = $5,
        status = $6,
        serial_number = $7,
        purchase_date = $8,
        warranty_expiry = $9,
        notes = $10,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $11
    `

    await query(updateQuery, [
      folio,
      brand,
      model,
      category_id,
      department_id,
      status,
      serial_number || null,
      purchase_date || null,
      warranty_expiry || null,
      notes || null,
      id
    ])

    return NextResponse.json({ message: 'Elemento actualizado exitosamente' })

  } catch (error) {
    console.error('Inventory PUT error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const id = parseInt(params.id)

    // Verificar que el elemento existe
    const existingItem = await query('SELECT id FROM inventory WHERE id = $1', [id])
    if (existingItem.rows.length === 0) {
      return NextResponse.json({ error: 'Elemento no encontrado' }, { status: 404 })
    }

    // Verificar que no hay solicitudes relacionadas
    const relatedRequests = await query('SELECT id FROM requests WHERE inventory_id = $1', [id])
    if (relatedRequests.rows.length > 0) {
      return NextResponse.json({ 
        error: 'No se puede eliminar el elemento porque tiene solicitudes relacionadas' 
      }, { status: 400 })
    }

    // Eliminar elemento
    await query('DELETE FROM inventory WHERE id = $1', [id])

    return NextResponse.json({ message: 'Elemento eliminado exitosamente' })

  } catch (error) {
    console.error('Inventory DELETE error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
