import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { query } from '@/lib/db'
import Layout from '@/components/Layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Package, 
  FileText, 
  Users, 
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react'

interface DashboardStats {
  totalInventory: number
  totalRequests: number
  pendingRequests: number
  totalUsers: number
  inventoryByStatus: Array<{ name: string; count: number }>
  recentRequests: Array<{
    id: number
    title: string
    status: string
    priority: string
    created_at: string
    user_name: string
  }>
}

async function getDashboardData(): Promise<DashboardStats> {
  try {
    // Total de inventario
    const inventoryResult = await query('SELECT COUNT(*) as total FROM inventory')
    const totalInventory = parseInt(inventoryResult.rows[0]?.total || '0')

    // Total de solicitudes
    const requestsResult = await query('SELECT COUNT(*) as total FROM requests')
    const totalRequests = parseInt(requestsResult.rows[0]?.total || '0')

    // Solicitudes pendientes
    const pendingResult = await query("SELECT COUNT(*) as total FROM requests WHERE status = 'Pendiente'")
    const pendingRequests = parseInt(pendingResult.rows[0]?.total || '0')

    // Total de usuarios
    const usersResult = await query('SELECT COUNT(*) as total FROM users WHERE is_active = true')
    const totalUsers = parseInt(usersResult.rows[0]?.total || '0')

    // Inventario por estado
    const inventoryByStatusResult = await query(`
      SELECT status, COUNT(*) as count 
      FROM inventory 
      GROUP BY status
    `)
    
    const inventoryByStatus = inventoryByStatusResult.rows.map(row => ({
      name: row.status,
      count: parseInt(row.count)
    }))

    // Solicitudes recientes
    const recentRequestsResult = await query(`
      SELECT 
        r.id, 
        r.title, 
        r.status, 
        r.priority,
        r.created_at,
        u.full_name as user_name
      FROM requests r
      JOIN users u ON r.user_id = u.id
      ORDER BY r.created_at DESC
      LIMIT 5
    `)

    const recentRequests = recentRequestsResult.rows.map(row => ({
      id: row.id,
      title: row.title,
      status: row.status,
      priority: row.priority,
      created_at: row.created_at,
      user_name: row.user_name
    }))

    return {
      totalInventory,
      totalRequests,
      pendingRequests,
      totalUsers,
      inventoryByStatus,
      recentRequests
    }
  } catch (error) {
    console.error('Error fetching dashboard data:', error)
    return {
      totalInventory: 0,
      totalRequests: 0,
      pendingRequests: 0,
      totalUsers: 0,
      inventoryByStatus: [],
      recentRequests: []
    }
  }
}

function getStatusIcon(status: string) {
  switch (status) {
    case 'Pendiente':
      return <Clock className="h-4 w-4 text-yellow-500" />
    case 'En proceso':
      return <Clock className="h-4 w-4 text-blue-500" />
    case 'Reparado':
      return <CheckCircle className="h-4 w-4 text-green-500" />
    case 'No reparado':
      return <XCircle className="h-4 w-4 text-red-500" />
    default:
      return <Clock className="h-4 w-4 text-gray-500" />
  }
}

function getPriorityColor(priority: string) {
  switch (priority) {
    case 'Urgente':
      return 'bg-red-100 text-red-800 border-red-200'
    case 'Alta':
      return 'bg-orange-100 text-orange-800 border-orange-200'
    case 'Media':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    case 'Baja':
      return 'bg-green-100 text-green-800 border-green-200'
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200'
  }
}

export default async function DashboardPage() {
  const session = await auth()
  
  if (!session?.user) {
    redirect('/login')
  }

  const stats = await getDashboardData()

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">
            Bienvenido, {session.user.name}
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Inventario</CardTitle>
              <Package className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalInventory}</div>
              <p className="text-xs text-gray-500">
                Elementos registrados
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Solicitudes</CardTitle>
              <FileText className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalRequests}</div>
              <p className="text-xs text-gray-500">
                Solicitudes registradas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Solicitudes Pendientes</CardTitle>
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingRequests}</div>
              <p className="text-xs text-gray-500">
                Requieren atención
              </p>
            </CardContent>
          </Card>

          {session.user.role === 'admin' && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Usuarios</CardTitle>
                <Users className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalUsers}</div>
                <p className="text-xs text-gray-500">
                  Usuarios activos
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Inventory Status Summary */}
        {stats.inventoryByStatus.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Resumen de Inventario por Estado</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {stats.inventoryByStatus.map((item, index) => (
                  <div key={index} className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-gray-900">{item.count}</div>
                    <div className="text-sm text-gray-600">{item.name}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Requests */}
        {stats.recentRequests.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Solicitudes Recientes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.recentRequests.map((request) => (
                  <div key={request.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      {getStatusIcon(request.status)}
                      <div>
                        <h4 className="font-medium">{request.title}</h4>
                        <p className="text-sm text-gray-500">Por: {request.user_name}</p>
                        <p className="text-xs text-gray-400">
                          {new Date(request.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 text-xs rounded-full border ${getPriorityColor(request.priority)}`}>
                        {request.priority}
                      </span>
                      <span className="text-sm text-gray-600">{request.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  )
}
