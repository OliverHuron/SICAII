import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { query } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Total de inventario
    const inventoryResult = await query('SELECT COUNT(*) as total FROM inventory')
    const totalInventory = parseInt(inventoryResult.rows[0].total)

    // Total de solicitudes
    const requestsResult = await query('SELECT COUNT(*) as total FROM requests')
    const totalRequests = parseInt(requestsResult.rows[0].total)

    // Solicitudes pendientes
    const pendingResult = await query("SELECT COUNT(*) as total FROM requests WHERE status = 'Pendiente'")
    const pendingRequests = parseInt(pendingResult.rows[0].total)

    // Total de usuarios (solo para admin)
    let totalUsers = 0
    if (session.user.role === 'admin') {
      const usersResult = await query('SELECT COUNT(*) as total FROM users WHERE is_active = true')
      totalUsers = parseInt(usersResult.rows[0].total)
    }

    // Inventario por estado
    const inventoryByStatusResult = await query(`
      SELECT status, COUNT(*) as count 
      FROM inventory 
      GROUP BY status
    `)
    
    const statusColors: { [key: string]: string } = {
      'Bueno': '#10b981',
      'Defectuoso': '#f59e0b',
      'Dañado': '#ef4444',
      'Piezas': '#8b5cf6',
      'Baja': '#6b7280'
    }

    const inventoryByStatus = inventoryByStatusResult.rows.map(row => ({
      name: row.status,
      value: parseInt(row.count),
      color: statusColors[row.status] || '#6b7280'
    }))

    // Solicitudes por mes (últimos 6 meses)
    const requestsByMonthResult = await query(`
      SELECT 
        TO_CHAR(created_at, 'MM-YYYY') as month,
        COUNT(*) as requests
      FROM requests 
      WHERE created_at >= NOW() - INTERVAL '6 months'
      GROUP BY TO_CHAR(created_at, 'MM-YYYY'), DATE_TRUNC('month', created_at)
      ORDER BY DATE_TRUNC('month', created_at)
    `)

    const requestsByMonth = requestsByMonthResult.rows.map(row => ({
      month: row.month,
      requests: parseInt(row.requests)
    }))

    // Solicitudes recientes
    const recentRequestsQuery = session.user.role === 'admin' 
      ? `SELECT r.id, r.title, r.status, r.priority, r.created_at, u.full_name as user_name
         FROM requests r
         JOIN users u ON r.user_id = u.id
         ORDER BY r.created_at DESC
         LIMIT 10`
      : `SELECT r.id, r.title, r.status, r.priority, r.created_at, u.full_name as user_name
         FROM requests r
         JOIN users u ON r.user_id = u.id
         WHERE r.user_id = $1
         ORDER BY r.created_at DESC
         LIMIT 10`

    const recentRequestsResult = session.user.role === 'admin'
      ? await query(recentRequestsQuery)
      : await query(recentRequestsQuery, [session.user.id])

    const recentRequests = recentRequestsResult.rows

    return NextResponse.json({
      totalInventory,
      totalRequests,
      pendingRequests,
      totalUsers,
      inventoryByStatus,
      requestsByMonth,
      recentRequests
    })

  } catch (error) {
    console.error('Dashboard API error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
