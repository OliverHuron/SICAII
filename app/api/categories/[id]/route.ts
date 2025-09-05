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
      FROM categories
      WHERE id = $1
    `, [id])

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Categoría no encontrada' }, { status: 404 })
    }

    return NextResponse.json(result.rows[0])

  } catch (error) {
    console.error('Category GET error:', error)
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

    // Verificar que la categoría existe
    const existingCategory = await query('SELECT id FROM categories WHERE id = $1', [id])
    if (existingCategory.rows.length === 0) {
      return NextResponse.json({ error: 'Categoría no encontrada' }, { status: 404 })
    }

    // Verificar que no exista otra categoría con el mismo nombre
    const duplicateName = await query('SELECT id FROM categories WHERE name = $1 AND id != $2', [name, id])
    if (duplicateName.rows.length > 0) {
      return NextResponse.json({ error: 'Ya existe una categoría con ese nombre' }, { status: 400 })
    }

    // Actualizar categoría
    const updateQuery = `
      UPDATE categories SET
        name = $1,
        description = $2,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
    `

    await query(updateQuery, [name, description || null, id])

    return NextResponse.json({ message: 'Categoría actualizada exitosamente' })

  } catch (error) {
    console.error('Category PUT error:', error)
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

    // Verificar que la categoría existe
    const existingCategory = await query('SELECT id FROM categories WHERE id = $1', [id])
    if (existingCategory.rows.length === 0) {
      return NextResponse.json({ error: 'Categoría no encontrada' }, { status: 404 })
    }

    // Verificar que no hay inventario relacionado
    const relatedInventory = await query('SELECT id FROM inventory WHERE category_id = $1', [id])
    if (relatedInventory.rows.length > 0) {
      return NextResponse.json({ 
        error: 'No se puede eliminar la categoría porque tiene elementos de inventario relacionados' 
      }, { status: 400 })
    }

    // Eliminar categoría
    await query('DELETE FROM categories WHERE id = $1', [id])

    return NextResponse.json({ message: 'Categoría eliminada exitosamente' })

  } catch (error) {
    console.error('Category DELETE error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
