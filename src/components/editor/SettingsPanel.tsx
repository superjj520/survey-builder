'use client'

import { useEditor } from './EditorContext'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ImagePicker } from './Gallery'
import { ThemeSettings } from '@/lib/types'

export function SettingsPanel() {
  const { state, dispatch } = useEditor()
  const { settings } = state

  const updateSettings = (updates: Partial<typeof settings>) => {
    dispatch({ type: 'UPDATE_SETTINGS', payload: updates })
  }

  const updateTheme = (updates: Partial<ThemeSettings>) => {
    dispatch({ type: 'UPDATE_SETTINGS', payload: { theme: { ...settings.theme, ...updates } } })
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-xl mx-auto p-6 space-y-8">
        {/* Display mode */}
        <section className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            显示模式
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => updateSettings({ displayMode: 'page' })}
              className={`p-4 rounded-xl border-2 text-center transition-all ${
                settings.displayMode === 'page'
                  ? 'border-indigo-500 bg-indigo-50'
                  : 'border-gray-100 hover:border-gray-200'
              }`}
            >
              <div className="w-10 h-10 mx-auto mb-2 rounded-lg bg-gray-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-sm font-medium text-gray-700">一页多题</p>
              <p className="text-xs text-gray-400 mt-0.5">所有题目在一页</p>
            </button>
            <button
              onClick={() => updateSettings({ displayMode: 'step' })}
              className={`p-4 rounded-xl border-2 text-center transition-all ${
                settings.displayMode === 'step'
                  ? 'border-indigo-500 bg-indigo-50'
                  : 'border-gray-100 hover:border-gray-200'
              }`}
            >
              <div className="w-10 h-10 mx-auto mb-2 rounded-lg bg-gray-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                </svg>
              </div>
              <p className="text-sm font-medium text-gray-700">一页一题</p>
              <p className="text-xs text-gray-400 mt-0.5">逐题展示</p>
            </button>
          </div>
        </section>

        {/* Password */}
        <section className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            访问控制
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm text-gray-600">需要密码访问</Label>
              <Switch
                checked={!!settings.password}
                onCheckedChange={(checked) => updateSettings({ password: checked ? '' : undefined })}
              />
            </div>
            {settings.password !== undefined && (
              <Input
                type="text"
                value={settings.password || ''}
                onChange={(e) => updateSettings({ password: e.target.value })}
                placeholder="设置访问密码"
                className="mt-2"
              />
            )}
          </div>
        </section>

        {/* Theme */}
        <section className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
            </svg>
            主题样式
          </h3>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm text-gray-600">主题色</Label>
              <div className="flex gap-2">
                {['#4F46E5', '#7C3AED', '#2563EB', '#059669', '#DC2626', '#EA580C', '#0891B2', '#BE185D'].map(color => (
                  <button
                    key={color}
                    onClick={() => updateTheme({ primaryColor: color })}
                    className={`w-8 h-8 rounded-full transition-all ${
                      settings.theme.primaryColor === color ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : 'hover:scale-105'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <Label className="text-xs text-gray-400">自定义:</Label>
                <input
                  type="color"
                  value={settings.theme.primaryColor}
                  onChange={(e) => updateTheme({ primaryColor: e.target.value })}
                  className="w-8 h-8 rounded cursor-pointer"
                />
                <span className="text-xs text-gray-400">{settings.theme.primaryColor}</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm text-gray-600">Logo</Label>
              <ImagePicker
                value={settings.theme.logo}
                onChange={(url) => updateTheme({ logo: url })}
                label="选择 Logo"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm text-gray-600">封面图片</Label>
              <ImagePicker
                value={settings.theme.coverImage}
                onChange={(url) => updateTheme({ coverImage: url })}
                label="选择封面图片"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm text-gray-600">字体风格</Label>
              <Select
                value={settings.theme.fontFamily}
                onValueChange={(val) => updateTheme({ fontFamily: val as ThemeSettings['fontFamily'] })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">默认</SelectItem>
                  <SelectItem value="serif">衬线体</SelectItem>
                  <SelectItem value="rounded">圆体</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm text-gray-600">提交成功消息</Label>
              <Textarea
                value={settings.theme.thankYouMessage}
                onChange={(e) => updateTheme({ thankYouMessage: e.target.value })}
                rows={2}
              />
            </div>
          </div>
        </section>

        {/* Description */}
        <section className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h8m-8 6h16" />
            </svg>
            问卷描述
          </h3>
          <Textarea
            value={state.description}
            onChange={(e) => dispatch({ type: 'SET_DESCRIPTION', payload: e.target.value })}
            placeholder="向答题者描述这份问卷的用途..."
            rows={4}
          />
        </section>
      </div>
    </div>
  )
}
