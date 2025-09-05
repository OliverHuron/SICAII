import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { query } from '@/lib/db'
import bcrypt from 'bcryptjs'

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
        u.id,
        u.username,
        u.first_name,
        u.last_name,
        u.email,
        u.role,
        u.department_id,
        u.is_active,
        u.created_at,
        u.updated_at,
        d.name as department_name
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.id
      WHERE u.id = $1
    `, [id])

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    return NextResponse.json(result.rows[0])

  } catch (error) {
    console.error('User GET error:', error)
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
      username,
      first_name,
      last_name,
      email,
      password,
      role,
      department_id,
      is_active
    } = body

    // Verificar que el usuario existe
    const existingUser = await query('SELECT id FROM users WHERE id = $1', [id])
    if (existingUser.rows.length === 0) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    // Verificar que el username no esté duplicado (excluyendo el usuario actual)
    if (username) {
      const existingUsername = await query('SELECT id FROM users WHERE username = $1 AND id != $2', [username, id])
      if (existingUsername.rows.length > 0) {
        return NextResponse.json({ error: 'El username ya existe' }, { status: 400 })
      }
    }

    // Verificar que el email no esté duplicado (excluyendo el usuario actual)
    if (email) {
      const existingEmail = await query('SELECT id FROM users WHERE email = $1 AND id != $2', [email, id])
      if (existingEmail.rows.length > 0) {
        return NextResponse.json({ error: 'El email ya existe' }, { status: 400 })
      }
    }

    // Verificar que el departamento existe si se proporciona
    if (department_id) {
      const departmentExists = await query('SELECT id FROM departments WHERE id = $1', [department_id])
      if (departmentExists.rows.length === 0) {
        return NextResponse.json({ error: 'Departamento no encontrado' }, { status: 400 })
      }
    }

    // Construir query de actualización dinámicamente
    let updateFields = []
    let updateParams = []
    let paramIndex = 1

    if (username !== undefined) {
      updateFields.push(`username = $${paramIndex}`)
      updateParams.push(username)
      paramIndex++
    }

    if (first_name !== undefined) {
      updateFields.push(`first_name = $${paramIndex}`)
      updateParams.push(first_name)
      paramIndex++
    }

    if (last_name !== undefined) {
      updateFields.push(`last_name = $${paramIndex}`)
      updateParams.push(last_name)
      paramIndex++
    }

    if (email !== undefined) {
      updateFields.push(`email = $${paramIndex}`)
      updateParams.push(email)
      paramIndex++
    }

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 12)
      updateFields.push(`password = $${paramIndex}`)
      updateParams.push(hashedPassword)
      paramIndex++
    }

    if (role !== undefined) {
      updateFields.push(`role = $${paramIndex}`)
      updateParams.push(role)
      paramIndex++
    }

    if (department_id !== undefined) {
      updateFields.push(`department_id = $${paramIndex}`)
      updateParams.push(department_id)
      paramIndex++
    }

    if (is_active !== undefined) {
      updateFields.push(`is_active = $${paramIndex}`)
      updateParams.push(is_active)
      paramIndex++
    }

    if (updateFields.length === 0) {
      return NextResponse.json({ error: 'No hay campos para actualizar' }, { status: 400 })
    }

    updateFields.push('updated_at = CURRENT_TIMESTAMP')
    updateParams.push(id)

    const updateQuery = `
      UPDATE users SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
    `

    await query(updateQuery, updateParams)

    return NextResponse.json({ message: 'Usuario actualizado exitosamente' })

  } catch (error) {
    console.error('User PUT error:', error)
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

    // No permitir que el admin se elimine a sí mismo
    if (id === parseInt(session.user.id)) {
      return NextResponse.json({ 
        error: 'No puedes eliminar tu propio usuario' 
      }, { status: 400 })
    }

    // Verificar que el usuario existe
    const existingUser = await query('SELECT id FROM users WHERE id = $1', [id])
    if (existingUser.rows.length === 0) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    // Verificar que no hay solicitudes relacionadas
    const relatedRequests = await query('SELECT id FROM requests WHERE user_id = $1', [id])
    if (relatedRequests.rows.length > 0) {
      return NextResponse.json({ 
        error: 'No se puede eliminar el usuario porque tiene solicitudes relacionadas' 
      }, { status: 400 })
    }

    // Eliminar usuario
    await query('DELETE FROM users WHERE id = $1', [id])

    return NextResponse.json({ message: 'Usuario eliminado exitosamente' })

  } catch (error) {
    console.error('User DELETE error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
