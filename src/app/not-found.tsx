import { FileQuestion } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-white p-4">
      <div className="text-center">
        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-indigo-50 flex items-center justify-center">
          <FileQuestion className="w-10 h-10 text-indigo-400" />
        </div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">页面不存在</h1>
        <p className="text-sm text-gray-500 mb-6">你访问的页面可能已被移除或地址有误</p>
        <div className="flex items-center justify-center gap-3">
          <a
            href="/"
            className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            返回首页
          </a>
          <a
            href="/templates"
            className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:border-gray-300 transition-colors"
          >
            浏览模板
          </a>
        </div>
      </div>
    </div>
  )
}
