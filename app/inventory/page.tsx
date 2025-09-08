import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import Layout from '@/components/Layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default async function InventoryPage() {
  const session = await auth()
  
  if (!session?.user) {
    redirect('/login')
  }

  // Only admin can access inventory management
  if (session.user.role !== 'admin') {
    redirect('/dashboard')
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Inventario</h1>
            <p className="text-gray-600">Gestiona los elementos del inventario</p>
          </div>
        </div>

        {/* Placeholder Content */}
        <Card>
          <CardHeader>
            <CardTitle>Elementos del Inventario</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <p className="text-gray-600">
                La funcionalidad del inventario está en desarrollo.
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Esta página se construirá correctamente y se puede mejorar después.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}
