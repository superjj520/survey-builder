'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { GalleryImage } from '@/lib/types'
import { nanoid } from 'nanoid'

const BUCKET = 'gallery'

export function useGallery() {
  const [images, setImages] = useState<GalleryImage[]>([])
  const [loading, setLoading] = useState(false)

  const fetchImages = useCallback(async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase.storage.from(BUCKET).list('', { limit: 200, sortBy: { column: 'created_at', order: 'desc' } })
      if (error) {
        toast.error('加载图库失败: ' + error.message)
        setLoading(false)
        return
      }
      if (data) {
        const imgs: GalleryImage[] = data
          .filter(f => f.name !== '.emptyFolderPlaceholder' && !f.name.startsWith('.'))
          .map(f => ({
            id: f.id || f.name,
            name: f.name,
            size: f.metadata?.size || 0,
            url: `https://ybyputkhtrejnqyblvdc.supabase.co/storage/v1/object/public/${BUCKET}/${f.name}`,
            created_at: f.created_at || '',
          }))
        setImages(imgs)
      }
    } catch (e) {
      toast.error('图库请求出错')
    }
    setLoading(false)
  }, [])

  const uploadImage = async (file: File): Promise<string | null> => {
    const ext = file.name.split('.').pop()?.toLowerCase() || 'png'
    const filename = `${nanoid(10)}.${ext}`
    const { error } = await supabase.storage.from(BUCKET).upload(filename, file, {
      cacheControl: '31536000',
      upsert: false,
      contentType: file.type,
    })
    if (error) {
      if (error.message.includes('Bucket not found') || error.message.includes('not found')) {
        toast.error('图库存储桶未创建，请在 Supabase Dashboard 中创建名为 "gallery" 的公开 Storage Bucket')
      } else if (error.message.includes('security') || error.message.includes('policy')) {
        toast.error('存储权限不足，请检查 Supabase Storage 策略设置')
      } else {
        toast.error('上传失败: ' + error.message)
      }
      return null
    }
    const url = `https://ybyputkhtrejnqyblvdc.supabase.co/storage/v1/object/public/${BUCKET}/${filename}`
    await fetchImages()
    toast.success('上传成功')
    return url
  }

  const deleteImage = async (name: string) => {
    const { error } = await supabase.storage.from(BUCKET).remove([name])
    if (error) {
      toast.error('删除失败: ' + error.message)
      return
    }
    setImages(prev => prev.filter(img => img.name !== name))
    toast.success('已删除')
  }

  useEffect(() => { fetchImages() }, [fetchImages])

  return { images, loading, uploadImage, deleteImage, refetch: fetchImages }
}

// Gallery Modal Component
interface GalleryModalProps {
  open: boolean
  onClose: () => void
  onSelect: (url: string) => void
}

export function GalleryModal({ open, onClose, onSelect }: GalleryModalProps) {
  const { images, loading, uploadImage, deleteImage } = useGallery()
  const [uploading, setUploading] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)

  if (!open) return null

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    const file = files[0]
    if (file.size > 5 * 1024 * 1024) {
      toast.warning('文件大小不能超过 5MB')
      return
    }
    if (!file.type.startsWith('image/')) {
      toast.warning('请选择图片文件')
      return
    }
    setUploading(true)
    await uploadImage(file)
    setUploading(false)
    // Reset input
    e.target.value = ''
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b flex-shrink-0">
          <div>
            <h3 className="text-base font-semibold text-gray-800">图库管理</h3>
            <p className="text-xs text-gray-400 mt-0.5">{images.length} 张图片</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Upload area */}
        <div className="px-5 py-3 border-b bg-gray-50 flex-shrink-0">
          <label className="flex items-center justify-center gap-2 px-4 py-4 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/50 transition-all active:scale-[0.99]">
            <input type="file" accept="image/*" onChange={handleUpload} className="hidden" disabled={uploading} />
            {uploading ? (
              <span className="flex items-center gap-2 text-sm text-indigo-600">
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                上传中...
              </span>
            ) : (
              <>
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <span className="text-sm text-gray-500">点击或拖拽上传图片<span className="text-gray-300 ml-2">最大 5MB</span></span>
              </>
            )}
          </label>
        </div>

        {/* Image grid */}
        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="aspect-square rounded-xl bg-gray-100 animate-pulse" />
              ))}
            </div>
          ) : images.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-100 flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="font-medium mb-1">图库为空</p>
              <p className="text-sm text-gray-300">上传图片后可在问卷中使用</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {images.map((img) => (
                <div key={img.id} className="group relative aspect-square rounded-xl overflow-hidden border border-gray-200 hover:border-indigo-300 transition-all hover:shadow-md">
                  <img src={img.url} alt={img.name} className="w-full h-full object-cover" loading="lazy" />
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                    <button
                      onClick={() => { onSelect(img.url); onClose() }}
                      className="px-3 py-1.5 bg-white rounded-lg text-xs font-medium text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 shadow-sm transition-colors"
                    >
                      使用
                    </button>
                    <button
                      onClick={() => setDeleteTarget(img.name)}
                      className="px-3 py-1.5 bg-white rounded-lg text-xs font-medium text-red-500 hover:bg-red-50 shadow-sm transition-colors"
                    >
                      删除
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Delete confirmation inline */}
        {deleteTarget && (
          <div className="px-5 py-3 border-t bg-red-50 flex items-center justify-between flex-shrink-0">
            <span className="text-sm text-red-700">确定删除此图片？</span>
            <div className="flex gap-2">
              <button onClick={() => setDeleteTarget(null)} className="px-3 py-1.5 text-xs rounded-lg bg-white border border-gray-200 text-gray-600">取消</button>
              <button onClick={() => { deleteImage(deleteTarget); setDeleteTarget(null) }} className="px-3 py-1.5 text-xs rounded-lg bg-red-600 text-white">删除</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Simple image picker button that opens gallery
interface ImagePickerProps {
  value?: string
  onChange: (url: string | undefined) => void
  label?: string
}

export function ImagePicker({ value, onChange, label }: ImagePickerProps) {
  const [showGallery, setShowGallery] = useState(false)

  return (
    <div>
      {value ? (
        <div className="relative group rounded-xl overflow-hidden border border-gray-200">
          <img src={value} alt="" className="w-full h-24 object-cover" />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
            <button onClick={() => setShowGallery(true)} className="px-3 py-1.5 bg-white rounded-lg text-xs font-medium shadow-sm">更换</button>
            <button onClick={() => onChange(undefined)} className="px-3 py-1.5 bg-white rounded-lg text-xs font-medium text-red-500 shadow-sm">移除</button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowGallery(true)}
          className="w-full h-20 border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-center gap-2 text-sm text-gray-400 hover:border-indigo-300 hover:text-indigo-500 transition-all active:scale-[0.98]"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          {label || '选择图片'}
        </button>
      )}
      <GalleryModal
        open={showGallery}
        onClose={() => setShowGallery(false)}
        onSelect={(url) => { onChange(url); setShowGallery(false) }}
      />
    </div>
  )
}
