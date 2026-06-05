'use client'

import { useState } from 'react'
import { useEditor } from './EditorContext'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ImagePicker } from './Gallery'
import { ThemeSettings } from '@/lib/types'
import { ChatSettingsSection } from './ChatSettingsSection'
import { LayoutList, ChevronsRight, Lock, Palette, BarChart3, CheckCircle, AlignLeft, X } from 'lucide-react'

export function SettingsPanel() {
  const { state, dispatch } = useEditor()
  const { settings } = state

  const updateSettings = (updates: Partial<typeof settings>) => {
    dispatch({ type: 'UPDATE_SETTINGS', payload: updates })
  }

  const updateTheme = (updates: Partial<ThemeSettings>) => {
    dispatch({ type: 'UPDATE_SETTINGS', payload: { theme: { ...settings.theme, ...updates } } })
  }

  const THEME_PRESETS: { name: string; theme: Partial<ThemeSettings> }[] = [
    { name: '靛蓝', theme: { primaryColor: '#4F46E5', backgroundGradient: 'linear-gradient(135deg, #f0ebf8 0%, #e8e0f0 100%)' } },
    { name: '小红书粉', theme: { primaryColor: '#FF2442', backgroundGradient: 'linear-gradient(135deg, #fff5f7 0%, #ffe4e9 100%)' } },
    { name: '翠绿', theme: { primaryColor: '#059669', backgroundGradient: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)' } },
    { name: '活力橙', theme: { primaryColor: '#EA580C', backgroundGradient: 'linear-gradient(135deg, #fff7ed 0%, #fed7aa 100%)' } },
    { name: '玫红', theme: { primaryColor: '#BE185D', backgroundGradient: 'linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%)' } },
    { name: '海蓝', theme: { primaryColor: '#0891B2', backgroundGradient: 'linear-gradient(135deg, #ecfeff 0%, #cffafe 100%)' } },
    { name: '奶茶棕', theme: { primaryColor: '#92400E', backgroundGradient: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)' } },
    { name: '暗黑', theme: { primaryColor: '#818cf8', backgroundGradient: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)' } },
  ]

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-xl mx-auto p-6 space-y-8">
        {/* Display mode - only show for non-chat surveys */}
        {settings.displayMode !== 'chat' && (
        <section className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <LayoutList className="w-4 h-4 text-indigo-500" />
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
                <LayoutList className="w-5 h-5 text-gray-500" />
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
                <ChevronsRight className="w-5 h-5 text-gray-500" />
              </div>
              <p className="text-sm font-medium text-gray-700">一页一题</p>
              <p className="text-xs text-gray-400 mt-0.5">逐题展示</p>
            </button>
          </div>
        </section>
        )}

        {/* Chat mode settings */}
        {settings.displayMode === 'chat' && <ChatSettingsSection />}

        {/* Password */}
        <section className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Lock className="w-4 h-4 text-indigo-500" />
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

          {/* Deadline */}
          <div className="space-y-3 pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <Label className="text-sm text-gray-600">截止时间</Label>
              <Switch
                checked={!!settings.deadline}
                onCheckedChange={(checked) => updateSettings({ deadline: checked ? new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 16) : undefined })}
              />
            </div>
            {settings.deadline && (
              <Input
                type="datetime-local"
                value={settings.deadline.slice(0, 16)}
                onChange={(e) => updateSettings({ deadline: e.target.value ? new Date(e.target.value).toISOString() : undefined })}
                className="text-sm"
              />
            )}
            <p className="text-[11px] text-gray-400">超过截止时间后，问卷将自动停止收集</p>
          </div>

          {/* Max responses */}
          <div className="space-y-3 pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <Label className="text-sm text-gray-600">回复数上限</Label>
              <Switch
                checked={!!settings.maxResponses}
                onCheckedChange={(checked) => updateSettings({ maxResponses: checked ? 100 : undefined })}
              />
            </div>
            {settings.maxResponses && (
              <Input
                type="number"
                min={1}
                value={settings.maxResponses}
                onChange={(e) => updateSettings({ maxResponses: parseInt(e.target.value) || 100 })}
                className="text-sm w-28"
              />
            )}
            <p className="text-[11px] text-gray-400">达到上限后自动停止收集新回复</p>
          </div>
        </section>

        {/* Theme */}
        <section className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Palette className="w-4 h-4 text-indigo-500" />
            主题样式
          </h3>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm text-gray-600">快速换肤</Label>
              <div className="grid grid-cols-3 gap-2">
                {THEME_PRESETS.map(preset => (
                  <button
                    key={preset.name}
                    onClick={() => updateTheme(preset.theme)}
                    className={`p-2.5 rounded-xl border-2 text-center transition-all ${
                      settings.theme.primaryColor === preset.theme.primaryColor
                        ? 'border-gray-400 shadow-sm'
                        : 'border-gray-100 hover:border-gray-200'
                    }`}
                  >
                    <div className="w-full h-6 rounded-md mb-1.5" style={{ background: preset.theme.backgroundGradient }} />
                    <div className="flex items-center justify-center gap-1">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: preset.theme.primaryColor }} />
                      <span className="text-xs text-gray-600">{preset.name}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

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

            <div className="space-y-2">
              <Label className="text-sm text-gray-600">问卷背景</Label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: '淡紫', value: 'linear-gradient(135deg, #f0ebf8 0%, #e8e0f0 100%)' },
                  { label: '淡绿', value: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)' },
                  { label: '淡蓝', value: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)' },
                  { label: '暖白', value: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)' },
                  { label: '粉色', value: 'linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%)' },
                  { label: '青色', value: 'linear-gradient(135deg, #ecfeff 0%, #cffafe 100%)' },
                  { label: '深色', value: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)' },
                  { label: '纯白', value: undefined },
                ].map((bg, i) => (
                  <button
                    key={i}
                    onClick={() => updateTheme({ backgroundGradient: bg.value })}
                    className={`h-10 rounded-lg border-2 transition-all text-[10px] ${
                      (settings.theme.backgroundGradient || '') === (bg.value || '')
                        ? 'border-gray-400 shadow-sm'
                        : 'border-gray-100 hover:border-gray-200'
                    }`}
                    style={{ background: bg.value || '#ffffff' }}
                  >
                    <span className={bg.value?.includes('1e1b4b') ? 'text-white/70' : 'text-gray-500'}>{bg.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Scoring mode */}
        <section className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-indigo-500" />
            计分模式
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm text-gray-600">启用计分</Label>
                <p className="text-xs text-gray-400 mt-0.5">给选项设置分值，提交后显示总分</p>
              </div>
              <Switch
                checked={!!settings.scoringMode}
                onCheckedChange={(checked) => updateSettings({
                  scoringMode: checked,
                  scoreRanges: checked && !settings.scoreRanges ? [
                    { min: 0, max: 30, label: '初级', description: '继续加油！' },
                    { min: 31, max: 70, label: '中级', description: '表现不错！' },
                    { min: 71, max: 100, label: '优秀', description: '非常厉害！' },
                  ] : settings.scoreRanges
                })}
              />
            </div>

            {settings.scoringMode && (
              <div className="space-y-3 pt-3 border-t border-gray-100">
                <p className="text-xs text-gray-500">分数区间（在编辑器中为每个选项设置分值）</p>
                {(settings.scoreRanges || []).map((range, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      type="number"
                      value={range.min}
                      onChange={(e) => {
                        const ranges = [...(settings.scoreRanges || [])]
                        ranges[i] = { ...ranges[i], min: parseInt(e.target.value) || 0 }
                        updateSettings({ scoreRanges: ranges })
                      }}
                      className="w-14 h-8 text-xs border rounded-lg px-2 text-center"
                    />
                    <span className="text-xs text-gray-400">~</span>
                    <input
                      type="number"
                      value={range.max}
                      onChange={(e) => {
                        const ranges = [...(settings.scoreRanges || [])]
                        ranges[i] = { ...ranges[i], max: parseInt(e.target.value) || 0 }
                        updateSettings({ scoreRanges: ranges })
                      }}
                      className="w-14 h-8 text-xs border rounded-lg px-2 text-center"
                    />
                    <input
                      value={range.label}
                      onChange={(e) => {
                        const ranges = [...(settings.scoreRanges || [])]
                        ranges[i] = { ...ranges[i], label: e.target.value }
                        updateSettings({ scoreRanges: ranges })
                      }}
                      className="w-16 h-8 text-xs border rounded-lg px-2"
                      placeholder="等级"
                    />
                    <input
                      value={range.description}
                      onChange={(e) => {
                        const ranges = [...(settings.scoreRanges || [])]
                        ranges[i] = { ...ranges[i], description: e.target.value }
                        updateSettings({ scoreRanges: ranges })
                      }}
                      className="flex-1 h-8 text-xs border rounded-lg px-2"
                      placeholder="描述"
                    />
                    <button
                      onClick={() => {
                        const ranges = (settings.scoreRanges || []).filter((_, idx) => idx !== i)
                        updateSettings({ scoreRanges: ranges })
                      }}
                      className="text-gray-300 hover:text-red-400 text-xs"
                    ><X className="w-3 h-3" /></button>
                  </div>
                ))}
                <button
                  onClick={() => {
                    const ranges = [...(settings.scoreRanges || []), { min: 0, max: 100, label: '新等级', description: '' }]
                    updateSettings({ scoreRanges: ranges })
                  }}
                  className="text-xs text-indigo-500 hover:text-indigo-600"
                >+ 添加区间</button>
              </div>
            )}
          </div>
        </section>

        {/* Custom ending page */}
        <section className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-indigo-500" />
            结束页设置
          </h3>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm text-gray-600">按钮文字</Label>
              <Input
                value={settings.endingButtonText || ''}
                onChange={(e) => updateSettings({ endingButtonText: e.target.value || undefined })}
                placeholder="如：关注我的小红书"
              />
              <p className="text-[11px] text-gray-400">提交后显示的操作按钮文字，留空则不显示</p>
            </div>
            <div className="space-y-2">
              <Label className="text-sm text-gray-600">按钮跳转链接</Label>
              <Input
                value={settings.endingRedirectUrl || ''}
                onChange={(e) => updateSettings({ endingRedirectUrl: e.target.value || undefined })}
                placeholder="https://..."
              />
              <p className="text-[11px] text-gray-400">点击按钮后跳转的地址</p>
            </div>
            <div className="space-y-2">
              <Label className="text-sm text-gray-600">关注引导文案</Label>
              <Textarea
                value={settings.endingFollowGuide || ''}
                onChange={(e) => updateSettings({ endingFollowGuide: e.target.value || undefined })}
                placeholder="如：觉得好玩？关注我获取更多有趣测试~"
                rows={2}
              />
              <p className="text-[11px] text-gray-400">提交成功页底部的引导文字</p>
            </div>
          </div>
        </section>

        {/* Description */}
        <section className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <AlignLeft className="w-4 h-4 text-indigo-500" />
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
