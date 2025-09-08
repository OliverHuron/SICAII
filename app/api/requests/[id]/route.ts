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
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const id = parseInt(params.id)
    
    let requestQuery = `
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
      WHERE r.id = $1
    `
    
    let queryParams = [id]

    // Si no es admin, solo puede ver sus propias solicitudes
    if (session.user.role !== 'admin') {
      requestQuery += ' AND r.user_id = $2'
      queryParams.push(parseInt(session.user.id))
    }

    const result = await query(requestQuery, queryParams)

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Solicitud no encontrada' }, { status: 404 })
    }

    return NextResponse.json(result.rows[0])

  } catch (error) {
    console.error('Request GET error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const id = parseInt(params.id)
    const body = await request.json()

    // Verificar que la solicitud existe
    const existingRequest = await query('SELECT * FROM requests WHERE id = $1', [id])
    if (existingRequest.rows.length === 0) {
      return NextResponse.json({ error: 'Solicitud no encontrada' }, { status: 404 })
    }

    const existingData = existingRequest.rows[0]

    // Solo el admin o el propietario pueden actualizar la solicitud
    if (session.user.role !== 'admin' && existingData.user_id !== parseInt(session.user.id)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Los usuarios normales solo pueden actualizar ciertas propiedades y solo si la solicitud está pendiente
    if (session.user.role !== 'admin') {
      if (existingData.status !== 'pending') {
        return NextResponse.json({ 
          error: 'Solo se pueden editar solicitudes pendientes' 
        }, { status: 400 })
      }

      // Usuarios normales pueden actualizar descripción, prioridad, departamento e inventario
      const { description, priority, department_id, inventory_id } = body

      const updateQuery = `
        UPDATE requests SET
          inventory_id = $1,
          description = $2,
          priority = $3,
          department_id = $4,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $5
      `

      await query(updateQuery, [
        inventory_id || null,
        description || existingData.description,
        priority || existingData.priority,
        department_id || existingData.department_id,
        id
      ])

    } else {
      // Admin puede actualizar todo
      const {
        inventory_id,
        description,
        priority,
        department_id,
        status,
        admin_notes,
        rejection_reason
      } = body

      const updateQuery = `
        UPDATE requests SET
          inventory_id = $1,
          description = $2,
          priority = $3,
          department_id = $4,
          status = $5,
          admin_notes = $6,
          rejection_reason = $7,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $8
      `

      await query(updateQuery, [
        inventory_id || existingData.inventory_id,
        description || existingData.description,
        priority || existingData.priority,
        department_id || existingData.department_id,
        status || existingData.status,
        admin_notes || existingData.admin_notes,
        rejection_reason || existingData.rejection_reason,
        id
      ])
    }

    return NextResponse.json({ message: 'Solicitud actualizada exitosamente' })

  } catch (error) {
    console.error('Request PUT error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const id = parseInt(params.id)

    // Verificar que la solicitud existe
    const existingRequest = await query('SELECT * FROM requests WHERE id = $1', [id])
    if (existingRequest.rows.length === 0) {
      return NextResponse.json({ error: 'Solicitud no encontrada' }, { status: 404 })
    }

    const existingData = existingRequest.rows[0]

    // Solo el admin o el propietario pueden eliminar la solicitud
    if (session.user.role !== 'admin' && existingData.user_id !== parseInt(session.user.id)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Los usuarios normales solo pueden eliminar solicitudes pendientes
    if (session.user.role !== 'admin' && existingData.status !== 'pending') {
      return NextResponse.json({ 
        error: 'Solo se pueden eliminar solicitudes pendientes' 
      }, { status: 400 })
    }

    // Eliminar solicitud
    await query('DELETE FROM requests WHERE id = $1', [id])

    return NextResponse.json({ message: 'Solicitud eliminada exitosamente' })

  } catch (error) {
    console.error('Request DELETE error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
