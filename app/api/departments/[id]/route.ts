import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { query } from '@/lib/db'

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
    const result = await query(`
      SELECT id, name, description, created_at, updated_at
      FROM departments
      WHERE id = $1
    `, [id])

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Departamento no encontrado' }, { status: 404 })
    }

    return NextResponse.json(result.rows[0])

  } catch (error) {
    console.error('Department GET error:', error)
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
    const { name, description } = body

    // Verificar que el departamento existe
    const existingDepartment = await query('SELECT id FROM departments WHERE id = $1', [id])
    if (existingDepartment.rows.length === 0) {
      return NextResponse.json({ error: 'Departamento no encontrado' }, { status: 404 })
    }

    // Verificar que no exista otro departamento con el mismo nombre
    const duplicateName = await query('SELECT id FROM departments WHERE name = $1 AND id != $2', [name, id])
    if (duplicateName.rows.length > 0) {
      return NextResponse.json({ error: 'Ya existe un departamento con ese nombre' }, { status: 400 })
    }

    // Actualizar departamento
    const updateQuery = `
      UPDATE departments SET
        name = $1,
        description = $2,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
    `

    await query(updateQuery, [name, description || null, id])

    return NextResponse.json({ message: 'Departamento actualizado exitosamente' })

  } catch (error) {
    console.error('Department PUT error:', error)
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

    // Verificar que el departamento existe
    const existingDepartment = await query('SELECT id FROM departments WHERE id = $1', [id])
    if (existingDepartment.rows.length === 0) {
      return NextResponse.json({ error: 'Departamento no encontrado' }, { status: 404 })
    }

    // Verificar que no hay inventario relacionado
    const relatedInventory = await query('SELECT id FROM inventory WHERE department_id = $1', [id])
    if (relatedInventory.rows.length > 0) {
      return NextResponse.json({ 
        error: 'No se puede eliminar el departamento porque tiene elementos de inventario relacionados' 
      }, { status: 400 })
    }

    // Verificar que no hay solicitudes relacionadas
    const relatedRequests = await query('SELECT id FROM requests WHERE department_id = $1', [id])
    if (relatedRequests.rows.length > 0) {
      return NextResponse.json({ 
        error: 'No se puede eliminar el departamento porque tiene solicitudes relacionadas' 
      }, { status: 400 })
    }

    // Verificar que no hay usuarios relacionados
    const relatedUsers = await query('SELECT id FROM users WHERE department_id = $1', [id])
    if (relatedUsers.rows.length > 0) {
      return NextResponse.json({ 
        error: 'No se puede eliminar el departamento porque tiene usuarios relacionados' 
      }, { status: 400 })
    }

    // Eliminar departamento
    await query('DELETE FROM departments WHERE id = $1', [id])

    return NextResponse.json({ message: 'Departamento eliminado exitosamente' })

  } catch (error) {
    console.error('Department DELETE error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
