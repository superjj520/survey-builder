import { verifySession } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const isAdmin = await verifySession()
  if (!isAdmin) redirect('/admin/login')

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-3 flex items-center justify-between">
        <a href="/admin" className="text-lg font-bold">问卷管理</a>
        <form action="/api/auth/logout" method="POST">
          <button type="submit" className="text-sm text-gray-500 hover:text-gray-700">
            退出登录
          </button>
        </form>
      </header>
      <main>{children}</main>
    </div>
  )
}
