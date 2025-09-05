'use client'

import { SessionProvider } from 'next-auth/react'
import Sidebar from './Sidebar'
import { Toaster } from 'react-hot-toast'

interface LayoutProps {
  children: React.ReactNode
  session?: any
}

export default function Layout({ children, session }: LayoutProps) {
  return (
    <SessionProvider session={session}>
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <main className="flex-1 overflow-auto lg:ml-0">
          <div className="p-6 lg:p-8 pt-20 lg:pt-8">
            {children}
          </div>
        </main>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
          }}
        />
      </div>
    </SessionProvider>
  )
}
