'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { GalleryImage } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { nanoid } from 'nanoid'

const BUCKET = 'gallery'

export function useGallery() {
  const [images, setImages] = useState<GalleryImage[]>([])
  const [loading, setLoading] = useState(false)

  const fetchImages = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.storage.from(BUCKET).list('', { limit: 200, sortBy: { column: 'created_at', order: 'desc' } })
    if (data) {
      const imgs: GalleryImage[] = data
        .filter(f => f.name !== '.emptyFolderPlaceholder')
        .map(f => ({
          id: f.id || f.name,
          name: f.name,
          size: f.metadata?.size || 0,
          url: supabase.storage.from(BUCKET).getPublicUrl(f.name).data.publicUrl,
          created_at: f.created_at || '',
        }))
      setImages(imgs)
    }
    setLoading(false)
  }, [])

  const uploadImage = async (file: File): Promise<string | null> => {
    const ext = file.name.split('.').pop()
    const filename = `${nanoid(10)}.${ext}`
    const { error } = await supabase.storage.from(BUCKET).upload(filename, file, { cacheControl: '31536000', upsert: false })
    if (error) {
      alert('上传失败: ' + error.message)
      return null
    }
    const url = supabase.storage.from(BUCKET).getPublicUrl(filename).data.publicUrl
    await fetchImages()
    return url
  }

  const deleteImage = async (name: string) => {
    await supabase.storage.from(BUCKET).remove([name])
    setImages(prev => prev.filter(img => img.name !== name))
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

  if (!open) return null

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      alert('文件大小不能超过 5MB')
      return
    }
    setUploading(true)
    const url = await uploadImage(file)
    setUploading(false)
    if (url) onSelect(url)
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h3 className="text-base font-semibold text-gray-800">图库管理</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Upload area */}
        <div className="px-5 py-3 border-b bg-gray-50">
          <label className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 transition-colors">
            <input type="file" accept="image/*" onChange={handleUpload} className="hidden" disabled={uploading} />
            {uploading ? (
              <span className="text-sm text-gray-500">上传中...</span>
            ) : (
              <>
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <span className="text-sm text-gray-500">点击上传图片（最大 5MB）</span>
              </>
            )}
          </label>
        </div>

        {/* Image grid */}
        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
            <div className="text-center py-8 text-gray-400">加载中...</div>
          ) : images.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <p className="mb-1">图库为空</p>
              <p className="text-sm">上传图片后可在此管理和使用</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              {images.map((img) => (
                <div key={img.id} className="group relative aspect-square rounded-lg overflow-hidden border border-gray-200 hover:border-indigo-400 transition-colors">
                  <img src={img.url} alt={img.name} className="w-full h-full object-cover" />
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                    <button
                      onClick={() => onSelect(img.url)}
                      className="px-3 py-1.5 bg-white rounded-md text-xs font-medium text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 shadow-sm"
                    >
                      使用
                    </button>
                    <button
                      onClick={() => { if (confirm('确定删除？')) deleteImage(img.name) }}
                      className="px-3 py-1.5 bg-white rounded-md text-xs font-medium text-red-500 hover:bg-red-50 shadow-sm"
                    >
                      删除
                    </button>
                  </div>
                  {/* Name */}
                  <div className="absolute bottom-0 left-0 right-0 px-2 py-1 bg-gradient-to-t from-black/60 to-transparent">
                    <p className="text-xs text-white truncate">{img.name}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
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
        <div className="relative group">
          <img src={value} alt="" className="w-full h-24 object-cover rounded-lg border" />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors rounded-lg flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
            <button onClick={() => setShowGallery(true)} className="px-2 py-1 bg-white rounded text-xs">更换</button>
            <button onClick={() => onChange(undefined)} className="px-2 py-1 bg-white rounded text-xs text-red-500">移除</button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowGallery(true)}
          className="w-full h-20 border-2 border-dashed border-gray-200 rounded-lg flex items-center justify-center gap-2 text-sm text-gray-400 hover:border-indigo-300 hover:text-indigo-500 transition-colors"
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
