import { FileText } from 'lucide-react'

export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-white">
      <div className="flex flex-col items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center animate-pulse">
          <FileText className="w-6 h-6 text-indigo-400" />
        </div>
        <p className="text-sm text-gray-400">加载中...</p>
      </div>
    </div>
  )
}
