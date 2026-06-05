'use client'

import { useState } from 'react'
import { useEditor } from './EditorContext'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ImagePicker } from './Gallery'
import { SurveySettings, SurveyField } from '@/lib/types'
import { ChatPreviewModal } from './ChatPreviewModal'
import { MessageCircle, ChevronDown, ChevronRight, Play, X, SlidersHorizontal, Volume2, Palette, Drama, FileQuestion, Sparkles, Clapperboard, Link2, PenLine, Smile, MapPin, Gamepad2, BookOpen, Zap, Heart, Star, Puzzle, Vote, Mail } from 'lucide-react'

  const ROLE_TEMPLATES = [
    {
      name: '温柔咨询师',
      role: '小暖',
      personality: '温柔共情、耐心倾听、善于安慰',
      tone: '轻声细语，温暖亲切',
      habit: '经常说"嗯~"和"我理解你的感受"，喜欢用温暖的比喻',
      scene: '温馨的私密咨询室，柔和的灯光，舒适的沙发，让人放松的环境',
      background: '心理学硕士毕业，从业5年的心理咨询师，擅长倾听和共情，对每一个来访者都充满耐心',
      opening: '*轻轻推开门，微笑着示意你坐下*\n\n嗯~欢迎你来到这里。这里很安全，你可以放松下来。\n\n今天想聊些什么呢？不用着急，我们慢慢来~',
      avatarStyle: 'lorelei' as const,
    },
    {
      name: '侦探搭档',
      role: '福尔摩斯',
      personality: '敏锐理性、观察入微、偶尔傲慢但内心正义',
      tone: '简洁犀利，逻辑严密，偶尔反问',
      habit: '说话时喜欢加"显而易见"、用排除法推理、偶尔冷幽默',
      scene: '贝克街221B号公寓，壁炉旁的皮椅，桌上散落着案件资料和烟斗',
      background: '世界上最伟大的咨询侦探，拥有超凡的观察力和推理能力，正在调查一起复杂的案件',
      opening: '*从扶手椅上抬起头，锐利的目光打量着你*\n\n啊，你来了。从你进门的方式来看，你有重要的事要告诉我。\n\n坐吧。显而易见，你知道一些关键信息——说说看？',
      avatarStyle: 'adventurer' as const,
    },
    {
      name: '闺蜜好友',
      role: '小美',
      personality: '活泼开朗、热心八卦、真诚直率',
      tone: '口语化、语气词多、偶尔用网络用语',
      habit: '爱说"天呐"、"真的假的！"、句尾加感叹号和表情描述',
      scene: '阳光明媚的咖啡厅角落，两杯拿铁，闺蜜下午茶时光',
      background: '你最好的朋友，从大学就认识了，什么都聊什么都分享，是最懂你的人',
      opening: '*挥着手喊你过来，已经帮你点了杯拿铁*\n\n嘿！这边这边！天呐你今天气色好好！\n\n快坐快坐，最近怎么样呀？我可有好多想跟你聊的！',
      avatarStyle: 'avataaars' as const,
    },
    {
      name: '严肃教授',
      role: '张教授',
      personality: '严谨专业、学识渊博、外冷内热',
      tone: '学术化措辞，条理清晰，偶尔用数据和引用',
      habit: '喜欢说"根据我的研究"、"有意思"、停顿思考后说"嗯，让我想想"',
      scene: '大学办公室，书架林立，案头堆满了论文和书籍',
      background: '社会学系资深教授，研究方向是组织行为学，带过上百名研究生',
      opening: '*放下手中的论文，推了推眼镜*\n\n嗯，请坐。\n\n今天来找我，是有什么问题想讨论？根据我的经验，提前思考过的人回答会更有深度。',
      avatarStyle: 'notionists' as const,
    },
    {
      name: '猫咪助手',
      role: '喵喵',
      personality: '好奇慵懒、傲娇可爱、偶尔撒娇',
      tone: '短句为主，句尾加"喵~"，装作不在意实则很关心',
      habit: '经常"喵~"、用猫的视角看世界、偶尔打哈欠表示无聊',
      scene: '温馨的猫咖，阳光洒在地板上，喵喵在窗台上晒太阳',
      background: '一只会说话的智慧猫咪，平时看着慵懒，但其实很聪明，喜欢观察人类',
      opening: '*从窗台上跳下来，甩了甩尾巴走到你面前*\n\n喵~ 来了啊。\n\n*打了个小哈欠* 本喵今天心情不错，就陪你聊聊吧。有什么事快说喵~',
      avatarStyle: 'bottts' as const,
    },
    {
      name: '暖男管家',
      role: '塞巴斯',
      personality: '优雅绅士、体贴周到、温和有礼',
      tone: '优雅敬语，称呼用"您"，措辞考究',
      habit: '称呼对方"主人"或"您"，经常轻声询问"还有什么需要吗"，做事前先鞠躬',
      scene: '华丽的客厅，精致的茶具，管家正为您准备一切',
      background: '五星级酒店出身的专业管家，服务贵族家庭多年，举止优雅得体，对主人事事上心',
      opening: '*微微鞠躬，露出温和的微笑*\n\n欢迎回来。今天的红茶已为您准备好了。\n\n请问有什么需要我为您效劳的吗？我随时为您听候差遣。',
      avatarStyle: 'personas' as const,
    },
    {
      name: '树洞助手',
      role: '小树',
      personality: '温暖包容、不评判、善于引导表达、有文学素养',
      tone: '轻柔温暖，像老朋友一样倾听，偶尔用诗意的表达',
      habit: '经常说"谢谢你愿意分享"、"这个故事很有力量"，善于追问细节让故事更丰满',
      scene: '夜晚的树洞旁，月光温柔，周围是静谧的森林，只有你和树洞',
      background: '一个会倾听的树洞精灵，专门收集人间故事。它相信每个人的故事都值得被记录和传颂。它会帮助投稿者理清思路、丰富细节、保留真实情感。',
      opening: '*从树洞里探出头，眨了眨发光的小眼睛*\n\n嗨~ 今晚又有故事要说吗？\n\n不管是开心的、难过的、还是奇妙的经历，我都想听。说吧，这里只有月光和我~',
      avatarStyle: 'lorelei' as const,
      fields: [
        { id: 'story_title', type: 'text' as const, label: '给你的故事取个名字', required: true, placeholder: '一句话概括你的故事' },
        { id: 'story_content', type: 'text' as const, label: '你的故事', required: true, multiline: true, maxLength: 2000, placeholder: '尽情说吧...' },
        { id: 'story_emotion', type: 'radio' as const, label: '这个故事带给你什么情绪', required: true, options: ['温暖感动', '开心快乐', '遗憾释然', '勇气力量', '平静淡然', '其他'] },
        { id: 'story_real', type: 'radio' as const, label: '这是真实经历吗', required: true, options: ['完全真实', '基于真实改编', '虚构创作'] },
        { id: 'story_publish', type: 'radio' as const, label: '是否愿意公开发布', required: true, options: ['愿意实名发布', '愿意匿名发布', '仅投稿不公开'] },
        { id: 'story_voice', type: 'voice' as const, label: '用声音讲述你的故事（选填）', required: false, maxDuration: 120 },
        { id: 'contact', type: 'text' as const, label: '联系方式（选填，用于后续沟通）', required: false, placeholder: '微信/手机/邮箱均可' },
      ] as SurveyField[],
    },
    {
      name: '大赛助手',
      role: '赛事官',
      personality: '热情专业、激励人心、注重细节、善于发掘亮点',
      tone: '热情洋溢，像赛事解说一样充满感染力，同时专业细致',
      habit: '爱说"太精彩了！"、"让我们看看更多细节"，善于引导分享幕后故事和精彩瞬间',
      scene: '赛事投稿中心，大屏幕上滚动着往期精彩瞬间，氛围热烈而专业',
      background: '资深赛事运营官，组织过上百场大赛，深知每一个参赛故事背后都有触动人心的力量。专门帮助参赛者记录和呈现他们的比赛历程。',
      opening: '*站在投稿台前，热情地向你招手*\n\n欢迎来到投稿中心！🎉\n\n我是赛事官，专门帮你记录比赛中的精彩瞬间。不管是夺冠时刻还是幕后故事，都值得被看见！\n\n来聊聊你的参赛经历吧？',
      avatarStyle: 'adventurer' as const,
      fields: [
        { id: 'contest_name', type: 'text' as const, label: '参加的比赛名称', required: true, placeholder: '如：2024全国XX大赛' },
        { id: 'contest_category', type: 'radio' as const, label: '比赛类别', required: true, options: ['体育竞技', '才艺表演', '学术科研', '创业创新', '设计创意', '其他'] },
        { id: 'contest_result', type: 'text' as const, label: '取得的成绩', required: true, placeholder: '如：一等奖/第三名/最佳人气' },
        { id: 'contest_story', type: 'text' as const, label: '比赛中最难忘的瞬间', required: true, multiline: true, maxLength: 1500, placeholder: '描述你印象最深的时刻...' },
        { id: 'contest_photos', type: 'file' as const, label: '比赛照片/视频', required: true, acceptedTypes: 'image/*,video/*', maxFileSize: 50 },
        { id: 'contest_voice', type: 'voice' as const, label: '用声音讲述你的故事（选填）', required: false, maxDuration: 180 },
        { id: 'contest_behind', type: 'text' as const, label: '幕后故事（训练/准备过程）', required: false, multiline: true, placeholder: '分享备赛过程中的酸甜苦辣' },
        { id: 'contest_publish', type: 'radio' as const, label: '是否愿意公开展示', required: true, options: ['愿意公开', '仅提交不公开'] },
        { id: 'contact', type: 'text' as const, label: '联系方式', required: true, placeholder: '微信/手机/邮箱' },
      ] as SurveyField[],
    },
  ]

  const AVATAR_STYLES = [
    { key: 'avataaars', label: '卡通' },
    { key: 'adventurer', label: '冒险' },
    { key: 'lorelei', label: '手绘' },
    { key: 'notionists', label: '简约' },
    { key: 'personas', label: '抽象' },
    { key: 'bottts', label: '机器' },
  ]

export function ChatSettingsSection() {
  const { state, dispatch } = useEditor()
  const { settings } = state
  const [showPreview, setShowPreview] = useState(false)
  const [showFeatureInfo, setShowFeatureInfo] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)

  const updateSettings = (updates: Partial<typeof settings>) => {
    dispatch({ type: 'UPDATE_SETTINGS', payload: updates })
  }

  return (
        <section className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <MessageCircle className="w-4 h-4 text-pink-500" />
            AI 场景对话设定
          </h3>
          <div className="p-4 bg-indigo-50/50 rounded-xl space-y-4 border border-indigo-100">
              {/* Feature toggles */}
              <div className="rounded-lg border border-indigo-100 bg-white/80 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setShowFeatureInfo(!showFeatureInfo)}
                  className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-indigo-50/50 transition-colors"
                >
                  <span className="text-xs font-medium text-indigo-600 flex items-center gap-1.5"><SlidersHorizontal className="w-3 h-3" /> 互动模块开关</span>
                  <ChevronDown className={`w-3.5 h-3.5 text-indigo-400 transition-transform ${showFeatureInfo ? 'rotate-180' : ''}`} />
                </button>
                {showFeatureInfo && (
                  <div className="px-3 pb-3 space-y-2 border-t border-indigo-50 pt-2">
                    {([
                      { key: 'mood', icon: <Smile className="w-3.5 h-3.5 text-amber-500" />, label: '情绪系统', desc: 'AI 表达情绪状态' },
                      { key: 'scene', icon: <MapPin className="w-3.5 h-3.5 text-blue-500" />, label: '场景切换', desc: '背景随剧情变化' },
                      { key: 'suggest', icon: <MessageCircle className="w-3.5 h-3.5 text-green-500" />, label: '快捷回复', desc: '自动生成推荐选项' },
                      { key: 'game', icon: <Gamepad2 className="w-3.5 h-3.5 text-purple-500" />, label: '小游戏', desc: '真心话/猜谜/投票' },
                      { key: 'event', icon: <BookOpen className="w-3.5 h-3.5 text-indigo-500" />, label: '剧情事件', desc: '突发事件卡片' },
                      { key: 'choice', icon: <Zap className="w-3.5 h-3.5 text-yellow-500" />, label: '选择卡', desc: '有后果的关键选择' },
                      { key: 'bond', icon: <Heart className="w-3.5 h-3.5 text-pink-500" />, label: '亲密度', desc: '关系成长系统' },
                      { key: 'milestone', icon: <Star className="w-3.5 h-3.5 text-amber-500" />, label: '里程碑', desc: '成就解锁' },
                    ] as const).map(({ key, icon, label, desc }) => {
                      const features = settings.chatFeatures || {}
                      const enabled = features[key] !== false // default true
                      return (
                        <label key={key} className="flex items-center justify-between py-1 cursor-pointer group">
                          <div className="flex items-center gap-2">
                            <span className="text-sm">{icon}</span>
                            <div>
                              <span className="text-xs font-medium text-gray-700">{label}</span>
                              <span className="text-[10px] text-gray-400 ml-1.5">{desc}</span>
                            </div>
                          </div>
                          <input
                            type="checkbox"
                            checked={enabled}
                            onChange={(e) => {
                              const updated = { ...settings.chatFeatures, [key]: e.target.checked }
                              updateSettings({ chatFeatures: updated })
                            }}
                            className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                          />
                        </label>
                      )
                    })}
                    <p className="text-[10px] text-gray-400 pt-1">关闭的模块不会出现在 AI 对话中。默认全部开启。</p>
                  </div>
                )}
              </div>

              {/* Role templates */}
              <div>
                <Label className="text-xs text-gray-600 mb-2 block">快速模板</Label>
                <div className="grid grid-cols-2 gap-2">
                  {ROLE_TEMPLATES.map((tpl) => (
                    <button
                      key={tpl.name}
                      type="button"
                      onClick={() => {
                        updateSettings({
                          chatRole: tpl.role,
                          chatPersonality: tpl.personality,
                          chatTone: tpl.tone,
                          chatHabit: tpl.habit,
                          chatScene: tpl.scene,
                          chatBackground: tpl.background,
                          chatOpening: tpl.opening,
                          chatAvatarStyle: tpl.avatarStyle,
                        })
                        if ('fields' in tpl && tpl.fields) {
                          dispatch({ type: 'REORDER_FIELDS', payload: tpl.fields as SurveyField[] })
                        }
                      }}
                      className="p-2.5 rounded-lg border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/50 transition-all text-left group"
                    >
                      <div className="flex items-center gap-2">
                        <img
                          src={`https://api.dicebear.com/9.x/${tpl.avatarStyle}/svg?seed=${encodeURIComponent(tpl.role)}&size=32`}
                          alt={tpl.role}
                          className="w-7 h-7 rounded-full bg-gray-100"
                        />
                        <div>
                          <p className="text-xs font-medium text-gray-700 group-hover:text-indigo-700">{tpl.name}</p>
                          <p className="text-[10px] text-gray-400">{tpl.role}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="border-t border-indigo-100 pt-3">
                <p className="text-[10px] text-indigo-500 font-medium mb-3">自定义设置</p>
              </div>

              <div>
                <Label className="text-xs text-gray-600">角色名称</Label>
                <Input
                  value={settings.chatRole || ''}
                  onChange={(e) => updateSettings({ chatRole: e.target.value })}
                  placeholder="如：侦探福尔摩斯、心理咨询师小暖"
                  className="mt-1 text-sm"
                />
              </div>
              <div>
                <Label className="text-xs text-gray-600">性格特征</Label>
                <Input
                  value={settings.chatPersonality || ''}
                  onChange={(e) => updateSettings({ chatPersonality: e.target.value })}
                  placeholder="如：温柔细腻、耐心倾听、偶尔幽默"
                  className="mt-1 text-sm"
                />
              </div>
              <div>
                <Label className="text-xs text-gray-600">语气风格</Label>
                <Input
                  value={settings.chatTone || ''}
                  onChange={(e) => updateSettings({ chatTone: e.target.value })}
                  placeholder="如：轻声细语、简洁犀利、活泼口语化"
                  className="mt-1 text-sm"
                />
              </div>
              <div>
                <Label className="text-xs text-gray-600">口癖/说话习惯</Label>
                <Input
                  value={settings.chatHabit || ''}
                  onChange={(e) => updateSettings({ chatHabit: e.target.value })}
                  placeholder={'如：经常说"嗯~"、句尾加"喵~"、喜欢用比喻'}
                  className="mt-1 text-sm"
                />
              </div>
              <div>
                <Label className="text-xs text-gray-600">场景描述</Label>
                <Textarea
                  value={settings.chatScene || ''}
                  onChange={(e) => updateSettings({ chatScene: e.target.value })}
                  placeholder="如：你正在调查一起发生在深夜的神秘失窃案..."
                  className="mt-1 text-sm min-h-[70px]"
                />
                <p className="text-[10px] text-gray-400 mt-1">对话开始时将以此场景作为初始背景氛围</p>
              </div>
              <div>
                <Label className="text-xs text-gray-600">背景故事</Label>
                <Textarea
                  value={settings.chatBackground || ''}
                  onChange={(e) => updateSettings({ chatBackground: e.target.value })}
                  placeholder="角色的身世背景，让对话更有深度..."
                  className="mt-1 text-sm min-h-[60px]"
                />
              </div>
              <div>
                <Label className="text-xs text-gray-600">开场白（选填）</Label>
                <Textarea
                  value={settings.chatOpening || ''}
                  onChange={(e) => updateSettings({ chatOpening: e.target.value })}
                  placeholder="不填则由 AI 根据角色自动生成第一句话"
                  className="mt-1 text-sm min-h-[60px]"
                />
              </div>
              <div>
                <Label className="text-xs text-gray-600">头像风格</Label>
                <div className="grid grid-cols-6 gap-2 mt-1.5">
                  {AVATAR_STYLES.map(({ key, label }) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => updateSettings({ chatAvatarStyle: key as SurveySettings['chatAvatarStyle'] })}
                      className={`flex flex-col items-center gap-1 p-2 rounded-lg border transition-all ${
                        (settings.chatAvatarStyle || 'avataaars') === key ? 'border-indigo-400 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <img
                        src={`https://api.dicebear.com/9.x/${key}/svg?seed=${encodeURIComponent(settings.chatRole || '助手')}&size=32`}
                        alt={label}
                        className="w-8 h-8 rounded-full bg-gray-50"
                      />
                      <span className="text-[9px] text-gray-500">{label}</span>
                    </button>
                  ))}
                </div>
                <div className="mt-2">
                  <Label className="text-xs text-gray-600">自定义头像（可选，覆盖上方风格）</Label>
                  <div className="mt-1">
                    <ImagePicker
                      value={settings.chatAvatarUrl}
                      onChange={(url) => updateSettings({ chatAvatarUrl: url })}
                      label="从图库选择头像"
                    />
                  </div>
                </div>
                {settings.chatAvatarUrl && (
                  <div className="mt-2">
                    <Label className="text-xs text-gray-600">表情立绘（按情绪切换头像）</Label>
                    <p className="text-[10px] text-gray-400 mb-1">每种情绪可设置不同表情的立绘图，不填则用默认头像</p>
                    <div className="grid grid-cols-1 gap-2">
                      {['happy', 'thinking', 'sad', 'excited', 'shy', 'angry', 'neutral'].map(mood => (
                        <div key={mood} className="flex items-center gap-2">
                          <span className="text-sm w-6">{mood === 'happy' ? '😊' : mood === 'thinking' ? '🤔' : mood === 'sad' ? '😢' : mood === 'excited' ? '😆' : mood === 'shy' ? '😳' : mood === 'angry' ? '😤' : '😐'}</span>
                          <div className="flex-1">
                            <ImagePicker
                              value={(settings.chatAvatarMoodUrls || {})[mood]}
                              onChange={(url) => {
                                const current = { ...(settings.chatAvatarMoodUrls || {}) }
                                if (url) {
                                  current[mood] = url
                                } else {
                                  delete current[mood]
                                }
                                updateSettings({ chatAvatarMoodUrls: current })
                              }}
                              label={`${mood} 表情`}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Advanced settings */}
              <div className="border-t border-indigo-100 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="flex items-center gap-1.5 text-xs text-indigo-500 font-medium hover:text-indigo-700 transition-colors"
                >
                  <ChevronRight className={`w-3 h-3 transition-transform ${showAdvanced ? 'rotate-90' : ''}`} />
                  高级设置
                </button>
                {showAdvanced && (
                  <div className="mt-3 space-y-3">
                    <div>
                      <Label className="text-xs text-gray-600">初始亲密度（0-50）</Label>
                      <div className="flex items-center gap-3 mt-1">
                        <input
                          type="range"
                          min={0}
                          max={50}
                          value={settings.chatBondStart ?? 20}
                          onChange={(e) => updateSettings({ chatBondStart: Number(e.target.value) })}
                          className="flex-1 h-1.5 accent-indigo-500"
                        />
                        <span className="text-xs text-gray-500 w-6 text-right">{settings.chatBondStart ?? 20}</span>
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-600">亲密度阶段名称</Label>
                      <div className="grid grid-cols-3 gap-2 mt-1">
                        <Input
                          value={(settings.chatBondTierNames || ['初识', '渐熟', '知己'])[0]}
                          onChange={(e) => {
                            const names = settings.chatBondTierNames || ['初识', '渐熟', '知己']
                            updateSettings({ chatBondTierNames: [e.target.value, names[1], names[2]] })
                          }}
                          className="text-xs text-center"
                          placeholder="初识"
                        />
                        <Input
                          value={(settings.chatBondTierNames || ['初识', '渐熟', '知己'])[1]}
                          onChange={(e) => {
                            const names = settings.chatBondTierNames || ['初识', '渐熟', '知己']
                            updateSettings({ chatBondTierNames: [names[0], e.target.value, names[2]] })
                          }}
                          className="text-xs text-center"
                          placeholder="渐熟"
                        />
                        <Input
                          value={(settings.chatBondTierNames || ['初识', '渐熟', '知己'])[2]}
                          onChange={(e) => {
                            const names = settings.chatBondTierNames || ['初识', '渐熟', '知己']
                            updateSettings({ chatBondTierNames: [names[0], names[1], e.target.value] })
                          }}
                          className="text-xs text-center"
                          placeholder="知己"
                        />
                      </div>
                    </div>

                    {/* Bond speed */}
                    <div>
                      <Label className="text-xs text-gray-600">亲密度增长速率</Label>
                      <div className="grid grid-cols-3 gap-2 mt-1">
                        {([
                          { key: 'slow', label: '慢热', desc: '缓慢培养' },
                          { key: 'normal', label: '正常', desc: '自然节奏' },
                          { key: 'fast', label: '快速', desc: '迅速升温' },
                        ] as const).map(({ key, label, desc }) => (
                          <button
                            key={key}
                            type="button"
                            onClick={() => updateSettings({ chatBondSpeed: key })}
                            className={`p-2 rounded-lg border text-center transition-all ${
                              (settings.chatBondSpeed || 'normal') === key ? 'border-indigo-400 bg-indigo-50' : 'border-gray-200'
                            }`}
                          >
                            <p className="text-xs font-medium text-gray-700">{label}</p>
                            <p className="text-[9px] text-gray-400">{desc}</p>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Game unlock thresholds */}
                    {(settings.chatFeatures?.game !== false) && (
                      <div>
                        <Label className="text-xs text-gray-600">游戏解锁条件</Label>
                        <p className="text-[10px] text-gray-400 mb-2">亲密度达到指定值才会触发该游戏</p>
                        <div className="space-y-1.5">
                          {([
                            { key: 'truth_or_dare', label: '真心话大冒险' },
                            { key: 'guess', label: '猜谜' },
                            { key: 'vote', label: '投票' },
                            { key: 'word_chain', label: '词语接龙' },
                            { key: 'quiz', label: '知识问答' },
                            { key: 'fortune', label: '运势抽牌' },
                            { key: 'roleplay', label: '即兴表演' },
                            { key: 'confession', label: '心里话' },
                          ] as const).filter(({ key }) => (settings.chatGameTypes || ['truth_or_dare', 'guess', 'vote']).includes(key)).map(({ key, label }) => {
                            const unlock = settings.chatGameUnlock || {}
                            return (
                              <div key={key} className="flex items-center gap-2">
                                <span className="text-[11px] text-gray-600 w-28 flex-shrink-0">{label}</span>
                                <input
                                  type="range"
                                  min={0}
                                  max={100}
                                  step={10}
                                  value={unlock[key] ?? 0}
                                  onChange={(e) => updateSettings({ chatGameUnlock: { ...unlock, [key]: Number(e.target.value) } })}
                                  className="flex-1 h-1 accent-indigo-500"
                                />
                                <span className="text-[10px] text-gray-400 w-8 text-right">{unlock[key] ?? 0}</span>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    {/* Milestone thresholds */}
                    {(settings.chatFeatures?.milestone !== false) && (
                      <div>
                        <Label className="text-xs text-gray-600">里程碑触发阈值</Label>
                        <p className="text-[10px] text-gray-400 mb-2">亲密度达到阈值时自动触发对应里程碑</p>
                        <div className="space-y-1.5">
                          {(settings.chatMilestoneThresholds || []).map((mt, i) => (
                            <div key={i} className="flex items-center gap-2">
                              <input
                                value={mt.name}
                                onChange={(e) => {
                                  const list = [...(settings.chatMilestoneThresholds || [])]
                                  list[i] = { ...list[i], name: e.target.value }
                                  updateSettings({ chatMilestoneThresholds: list })
                                }}
                                className="flex-1 h-6 text-[11px] border rounded px-2"
                                placeholder="里程碑名称"
                              />
                              <input
                                type="number"
                                value={mt.threshold}
                                onChange={(e) => {
                                  const list = [...(settings.chatMilestoneThresholds || [])]
                                  list[i] = { ...list[i], threshold: Number(e.target.value) }
                                  updateSettings({ chatMilestoneThresholds: list })
                                }}
                                className="w-14 h-6 text-[11px] border rounded px-2 text-center"
                                placeholder="阈值"
                                min={0}
                                max={100}
                              />
                              <button type="button" onClick={() => {
                                const list = (settings.chatMilestoneThresholds || []).filter((_, idx) => idx !== i)
                                updateSettings({ chatMilestoneThresholds: list })
                              }} className="text-gray-300 hover:text-red-400 text-xs"><X className="w-3 h-3" /></button>
                            </div>
                          ))}
                          <button type="button" onClick={() => {
                            const list = [...(settings.chatMilestoneThresholds || []), { name: '', threshold: 50 }]
                            updateSettings({ chatMilestoneThresholds: list })
                          }} className="text-[10px] text-indigo-500">+ 添加触发规则</button>
                        </div>
                      </div>
                    )}

                    {/* Module deep customization */}
                    <div className="border-t border-indigo-100 pt-3 mt-3">
                      <p className="text-[10px] text-indigo-500 font-medium mb-3">模块细节配置</p>

                      {/* Mood customization */}
                      {(settings.chatFeatures?.mood !== false) && (
                        <div className="mb-3">
                          <Label className="text-xs text-gray-600">情绪列表</Label>
                          <p className="text-[10px] text-gray-400 mb-1">自定义 AI 可用的情绪（名称+emoji）</p>
                          <div className="space-y-1.5 mt-1">
                            {(settings.chatMoodList || [
                              { name: 'happy', emoji: '😊' },
                              { name: 'thinking', emoji: '🤔' },
                              { name: 'sad', emoji: '😢' },
                              { name: 'excited', emoji: '😆' },
                              { name: 'shy', emoji: '😳' },
                              { name: 'angry', emoji: '😤' },
                              { name: 'neutral', emoji: '😐' },
                            ]).map((mood, i) => (
                              <div key={i} className="flex items-center gap-2">
                                <input
                                  value={mood.emoji}
                                  onChange={(e) => {
                                    const list = [...(settings.chatMoodList || [
                                      { name: 'happy', emoji: '😊' }, { name: 'thinking', emoji: '🤔' },
                                      { name: 'sad', emoji: '😢' }, { name: 'excited', emoji: '😆' },
                                      { name: 'shy', emoji: '😳' }, { name: 'angry', emoji: '😤' },
                                      { name: 'neutral', emoji: '😐' },
                                    ])]
                                    list[i] = { ...list[i], emoji: e.target.value }
                                    updateSettings({ chatMoodList: list })
                                  }}
                                  className="w-10 h-7 text-center text-sm border rounded"
                                  maxLength={2}
                                />
                                <input
                                  value={mood.name}
                                  onChange={(e) => {
                                    const list = [...(settings.chatMoodList || [
                                      { name: 'happy', emoji: '😊' }, { name: 'thinking', emoji: '🤔' },
                                      { name: 'sad', emoji: '😢' }, { name: 'excited', emoji: '😆' },
                                      { name: 'shy', emoji: '😳' }, { name: 'angry', emoji: '😤' },
                                      { name: 'neutral', emoji: '😐' },
                                    ])]
                                    list[i] = { ...list[i], name: e.target.value }
                                    updateSettings({ chatMoodList: list })
                                  }}
                                  className="flex-1 h-7 text-xs border rounded px-2"
                                  placeholder="情绪名称"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const list = (settings.chatMoodList || [
                                      { name: 'happy', emoji: '😊' }, { name: 'thinking', emoji: '🤔' },
                                      { name: 'sad', emoji: '😢' }, { name: 'excited', emoji: '😆' },
                                      { name: 'shy', emoji: '😳' }, { name: 'angry', emoji: '😤' },
                                      { name: 'neutral', emoji: '😐' },
                                    ]).filter((_, idx) => idx !== i)
                                    updateSettings({ chatMoodList: list })
                                  }}
                                  className="text-gray-300 hover:text-red-400 text-xs"
                                ><X className="w-3 h-3" /></button>
                              </div>
                            ))}
                            <button
                              type="button"
                              onClick={() => {
                                const list = [...(settings.chatMoodList || [
                                  { name: 'happy', emoji: '😊' }, { name: 'thinking', emoji: '🤔' },
                                  { name: 'sad', emoji: '😢' }, { name: 'excited', emoji: '😆' },
                                  { name: 'shy', emoji: '😳' }, { name: 'angry', emoji: '😤' },
                                  { name: 'neutral', emoji: '😐' },
                                ]), { name: '', emoji: '🙂' }]
                                updateSettings({ chatMoodList: list })
                              }}
                              className="text-xs text-indigo-500 hover:text-indigo-600"
                            >+ 添加情绪</button>
                          </div>
                        </div>
                      )}

                      {/* Game types */}
                      {(settings.chatFeatures?.game !== false) && (
                        <div className="mb-3">
                          <Label className="text-xs text-gray-600">小游戏类型</Label>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {([
                              { key: 'truth_or_dare', label: '真心话大冒险' },
                              { key: 'guess', label: '猜谜' },
                              { key: 'vote', label: '投票' },
                              { key: 'word_chain', label: '词语接龙' },
                              { key: 'quiz', label: '知识问答' },
                              { key: 'fortune', label: '运势抽牌' },
                              { key: 'roleplay', label: '即兴表演' },
                              { key: 'confession', label: '心里话' },
                            ] as const).map(({ key, label }) => {
                              const types = settings.chatGameTypes || ['truth_or_dare', 'guess', 'vote']
                              const active = types.includes(key)
                              return (
                                <button
                                  key={key}
                                  type="button"
                                  onClick={() => {
                                    const updated = active ? types.filter(t => t !== key) : [...types, key]
                                    updateSettings({ chatGameTypes: updated as SurveySettings['chatGameTypes'] })
                                  }}
                                  className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                                    active ? 'border-indigo-400 bg-indigo-50 text-indigo-700' : 'border-gray-200 text-gray-400'
                                  }`}
                                >{label}</button>
                              )
                            })}
                          </div>

                          {/* Game content customization */}
                          {(settings.chatGameTypes || ['truth_or_dare', 'guess', 'vote']).includes('truth_or_dare') && (
                            <div className="mt-3 p-3 bg-white/60 rounded-lg border border-gray-100">
                              <p className="text-[10px] font-medium text-gray-600 mb-2 flex items-center gap-1"><Drama className="w-3 h-3" /> 真心话大冒险题库</p>
                              <div className="space-y-2">
                                <div>
                                  <p className="text-[10px] text-gray-400 mb-1">真心话题目</p>
                                  {(settings.chatGameConfig?.truth_or_dare?.truths || []).map((t, i) => (
                                    <div key={i} className="flex items-center gap-1.5 mb-1">
                                      <input value={t} onChange={(e) => {
                                        const cfg = { ...settings.chatGameConfig }
                                        const td = { truths: [...(cfg?.truth_or_dare?.truths || [])], dares: [...(cfg?.truth_or_dare?.dares || [])] }
                                        td.truths[i] = e.target.value
                                        updateSettings({ chatGameConfig: { ...cfg, truth_or_dare: td } })
                                      }} className="flex-1 h-6 text-[11px] border rounded px-2" placeholder="如：你最近一次心动是什么时候？" />
                                      <button type="button" onClick={() => {
                                        const cfg = { ...settings.chatGameConfig }
                                        const td = { truths: (cfg?.truth_or_dare?.truths || []).filter((_, idx) => idx !== i), dares: [...(cfg?.truth_or_dare?.dares || [])] }
                                        updateSettings({ chatGameConfig: { ...cfg, truth_or_dare: td } })
                                      }} className="text-gray-300 hover:text-red-400 text-[10px]"><X className="w-3 h-3" /></button>
                                    </div>
                                  ))}
                                  <button type="button" onClick={() => {
                                    const cfg = { ...settings.chatGameConfig }
                                    const td = { truths: [...(cfg?.truth_or_dare?.truths || []), ''], dares: [...(cfg?.truth_or_dare?.dares || [])] }
                                    updateSettings({ chatGameConfig: { ...cfg, truth_or_dare: td } })
                                  }} className="text-[10px] text-indigo-500">+ 添加真心话</button>
                                </div>
                                <div>
                                  <p className="text-[10px] text-gray-400 mb-1">大冒险任务</p>
                                  {(settings.chatGameConfig?.truth_or_dare?.dares || []).map((d, i) => (
                                    <div key={i} className="flex items-center gap-1.5 mb-1">
                                      <input value={d} onChange={(e) => {
                                        const cfg = { ...settings.chatGameConfig }
                                        const td = { truths: [...(cfg?.truth_or_dare?.truths || [])], dares: [...(cfg?.truth_or_dare?.dares || [])] }
                                        td.dares[i] = e.target.value
                                        updateSettings({ chatGameConfig: { ...cfg, truth_or_dare: td } })
                                      }} className="flex-1 h-6 text-[11px] border rounded px-2" placeholder="如：模仿一个动物叫声" />
                                      <button type="button" onClick={() => {
                                        const cfg = { ...settings.chatGameConfig }
                                        const td = { truths: [...(cfg?.truth_or_dare?.truths || [])], dares: (cfg?.truth_or_dare?.dares || []).filter((_, idx) => idx !== i) }
                                        updateSettings({ chatGameConfig: { ...cfg, truth_or_dare: td } })
                                      }} className="text-gray-300 hover:text-red-400 text-[10px]"><X className="w-3 h-3" /></button>
                                    </div>
                                  ))}
                                  <button type="button" onClick={() => {
                                    const cfg = { ...settings.chatGameConfig }
                                    const td = { truths: [...(cfg?.truth_or_dare?.truths || [])], dares: [...(cfg?.truth_or_dare?.dares || []), ''] }
                                    updateSettings({ chatGameConfig: { ...cfg, truth_or_dare: td } })
                                  }} className="text-[10px] text-indigo-500">+ 添加大冒险</button>
                                </div>
                              </div>
                            </div>
                          )}

                          {(settings.chatGameTypes || []).includes('quiz') && (
                            <div className="mt-3 p-3 bg-white/60 rounded-lg border border-gray-100">
                              <p className="text-[10px] font-medium text-gray-600 mb-2 flex items-center gap-1"><FileQuestion className="w-3 h-3" /> 知识问答题库</p>
                              {(settings.chatGameConfig?.quiz?.questions || []).map((q, i) => (
                                <div key={i} className="mb-2 p-2 bg-gray-50 rounded-lg">
                                  <div className="flex items-center gap-1.5 mb-1">
                                    <input value={q.q} onChange={(e) => {
                                      const cfg = { ...settings.chatGameConfig }
                                      const questions = [...(cfg?.quiz?.questions || [])]
                                      questions[i] = { ...questions[i], q: e.target.value }
                                      updateSettings({ chatGameConfig: { ...cfg, quiz: { questions } } })
                                    }} className="flex-1 h-6 text-[11px] border rounded px-2" placeholder="题目" />
                                    <button type="button" onClick={() => {
                                      const cfg = { ...settings.chatGameConfig }
                                      const questions = (cfg?.quiz?.questions || []).filter((_, idx) => idx !== i)
                                      updateSettings({ chatGameConfig: { ...cfg, quiz: { questions } } })
                                    }} className="text-gray-300 hover:text-red-400 text-[10px]"><X className="w-3 h-3" /></button>
                                  </div>
                                  <div className="flex gap-1 flex-wrap">
                                    {(q.options || []).map((opt, oi) => (
                                      <input key={oi} value={opt} onChange={(e) => {
                                        const cfg = { ...settings.chatGameConfig }
                                        const questions = [...(cfg?.quiz?.questions || [])]
                                        const options = [...(questions[i].options || [])]
                                        options[oi] = e.target.value
                                        questions[i] = { ...questions[i], options }
                                        updateSettings({ chatGameConfig: { ...cfg, quiz: { questions } } })
                                      }} className={`w-20 h-5 text-[10px] border rounded px-1.5 ${oi === q.answer ? 'border-green-400 bg-green-50' : ''}`} placeholder={`选项${oi + 1}`} />
                                    ))}
                                  </div>
                                  <p className="text-[9px] text-gray-400 mt-0.5">绿色边框 = 正确答案（第{(q.answer || 0) + 1}个）</p>
                                </div>
                              ))}
                              <button type="button" onClick={() => {
                                const cfg = { ...settings.chatGameConfig }
                                const questions = [...(cfg?.quiz?.questions || []), { q: '', options: ['', '', ''], answer: 0 }]
                                updateSettings({ chatGameConfig: { ...cfg, quiz: { questions } } })
                              }} className="text-[10px] text-indigo-500">+ 添加题目</button>
                            </div>
                          )}

                          {(settings.chatGameTypes || []).includes('fortune') && (
                            <div className="mt-3 p-3 bg-white/60 rounded-lg border border-gray-100">
                              <p className="text-[10px] font-medium text-gray-600 mb-2 flex items-center gap-1"><Sparkles className="w-3 h-3" /> 运势卡牌库</p>
                              {(settings.chatGameConfig?.fortune?.cards || []).map((card, i) => (
                                <div key={i} className="flex items-center gap-1.5 mb-1">
                                  <input value={card.name} onChange={(e) => {
                                    const cfg = { ...settings.chatGameConfig }
                                    const cards = [...(cfg?.fortune?.cards || [])]
                                    cards[i] = { ...cards[i], name: e.target.value }
                                    updateSettings({ chatGameConfig: { ...cfg, fortune: { cards } } })
                                  }} className="w-20 h-6 text-[11px] border rounded px-2" placeholder="牌名" />
                                  <input value={card.meaning} onChange={(e) => {
                                    const cfg = { ...settings.chatGameConfig }
                                    const cards = [...(cfg?.fortune?.cards || [])]
                                    cards[i] = { ...cards[i], meaning: e.target.value }
                                    updateSettings({ chatGameConfig: { ...cfg, fortune: { cards } } })
                                  }} className="flex-1 h-6 text-[11px] border rounded px-2" placeholder="含义" />
                                  <button type="button" onClick={() => {
                                    const cfg = { ...settings.chatGameConfig }
                                    const cards = (cfg?.fortune?.cards || []).filter((_, idx) => idx !== i)
                                    updateSettings({ chatGameConfig: { ...cfg, fortune: { cards } } })
                                  }} className="text-gray-300 hover:text-red-400 text-[10px]"><X className="w-3 h-3" /></button>
                                </div>
                              ))}
                              <button type="button" onClick={() => {
                                const cfg = { ...settings.chatGameConfig }
                                const cards = [...(cfg?.fortune?.cards || []), { name: '', meaning: '' }]
                                updateSettings({ chatGameConfig: { ...cfg, fortune: { cards } } })
                              }} className="text-[10px] text-indigo-500">+ 添加卡牌</button>
                            </div>
                          )}

                          {(settings.chatGameTypes || []).includes('roleplay') && (
                            <div className="mt-3 p-3 bg-white/60 rounded-lg border border-gray-100">
                              <p className="text-[10px] font-medium text-gray-600 mb-2 flex items-center gap-1"><Clapperboard className="w-3 h-3" /> 即兴表演情境库</p>
                              {(settings.chatGameConfig?.roleplay?.scenarios || []).map((s, i) => (
                                <div key={i} className="flex items-center gap-1.5 mb-1">
                                  <input value={s} onChange={(e) => {
                                    const cfg = { ...settings.chatGameConfig }
                                    const scenarios = [...(cfg?.roleplay?.scenarios || [])]
                                    scenarios[i] = e.target.value
                                    updateSettings({ chatGameConfig: { ...cfg, roleplay: { scenarios } } })
                                  }} className="flex-1 h-6 text-[11px] border rounded px-2" placeholder="如：你是迟到1小时的约会对象" />
                                  <button type="button" onClick={() => {
                                    const cfg = { ...settings.chatGameConfig }
                                    const scenarios = (cfg?.roleplay?.scenarios || []).filter((_, idx) => idx !== i)
                                    updateSettings({ chatGameConfig: { ...cfg, roleplay: { scenarios } } })
                                  }} className="text-gray-300 hover:text-red-400 text-[10px]"><X className="w-3 h-3" /></button>
                                </div>
                              ))}
                              <button type="button" onClick={() => {
                                const cfg = { ...settings.chatGameConfig }
                                const scenarios = [...(cfg?.roleplay?.scenarios || []), '']
                                updateSettings({ chatGameConfig: { ...cfg, roleplay: { scenarios } } })
                              }} className="text-[10px] text-indigo-500">+ 添加情境</button>
                            </div>
                          )}

                          {(settings.chatGameTypes || []).includes('word_chain') && (
                            <div className="mt-3 p-3 bg-white/60 rounded-lg border border-gray-100">
                              <p className="text-[10px] font-medium text-gray-600 mb-2 flex items-center gap-1"><Link2 className="w-3 h-3" /> 词语接龙设置</p>
                              <div className="mb-2">
                                <input
                                  value={settings.chatGameConfig?.word_chain?.theme || ''}
                                  onChange={(e) => {
                                    const cfg = { ...settings.chatGameConfig }
                                    const wc = { startWords: [...(cfg?.word_chain?.startWords || [])], theme: e.target.value }
                                    updateSettings({ chatGameConfig: { ...cfg, word_chain: wc } })
                                  }}
                                  className="w-full h-6 text-[11px] border rounded px-2"
                                  placeholder="限定主题（可选，如：食物、动物）"
                                />
                              </div>
                              <p className="text-[10px] text-gray-400 mb-1">起始词</p>
                              <div className="flex flex-wrap gap-1">
                                {(settings.chatGameConfig?.word_chain?.startWords || []).map((w, i) => (
                                  <div key={i} className="flex items-center gap-0.5">
                                    <input value={w} onChange={(e) => {
                                      const cfg = { ...settings.chatGameConfig }
                                      const startWords = [...(cfg?.word_chain?.startWords || [])]
                                      startWords[i] = e.target.value
                                      updateSettings({ chatGameConfig: { ...cfg, word_chain: { ...cfg?.word_chain, startWords } } })
                                    }} className="w-16 h-6 text-[11px] border rounded px-1.5" />
                                    <button type="button" onClick={() => {
                                      const cfg = { ...settings.chatGameConfig }
                                      const startWords = (cfg?.word_chain?.startWords || []).filter((_, idx) => idx !== i)
                                      updateSettings({ chatGameConfig: { ...cfg, word_chain: { ...cfg?.word_chain, startWords } } })
                                    }} className="text-gray-300 hover:text-red-400 text-[10px]"><X className="w-3 h-3" /></button>
                                  </div>
                                ))}
                                <button type="button" onClick={() => {
                                  const cfg = { ...settings.chatGameConfig }
                                  const startWords = [...(cfg?.word_chain?.startWords || []), '']
                                  updateSettings({ chatGameConfig: { ...cfg, word_chain: { ...cfg?.word_chain, startWords } } })
                                }} className="text-[10px] text-indigo-500 px-2 py-0.5 border border-dashed border-indigo-300 rounded">+</button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Suggest count */}
                      {(settings.chatFeatures?.suggest !== false) && (
                        <div className="mb-3">
                          <Label className="text-xs text-gray-600">快捷回复数量上限</Label>
                          <div className="flex items-center gap-3 mt-1">
                            <input
                              type="range"
                              min={2}
                              max={6}
                              value={settings.chatSuggestCount ?? 4}
                              onChange={(e) => updateSettings({ chatSuggestCount: Number(e.target.value) })}
                              className="flex-1 h-1.5 accent-indigo-500"
                            />
                            <span className="text-xs text-gray-500 w-4 text-right">{settings.chatSuggestCount ?? 4}</span>
                          </div>
                        </div>
                      )}

                      {/* Choice max options */}
                      {(settings.chatFeatures?.choice !== false) && (
                        <div className="mb-3">
                          <Label className="text-xs text-gray-600">选择卡最大选项数</Label>
                          <div className="flex items-center gap-3 mt-1">
                            <input
                              type="range"
                              min={2}
                              max={4}
                              value={settings.chatChoiceMax ?? 3}
                              onChange={(e) => updateSettings({ chatChoiceMax: Number(e.target.value) })}
                              className="flex-1 h-1.5 accent-indigo-500"
                            />
                            <span className="text-xs text-gray-500 w-4 text-right">{settings.chatChoiceMax ?? 3}</span>
                          </div>
                        </div>
                      )}

                      {/* Milestone presets */}
                      {(settings.chatFeatures?.milestone !== false) && (
                        <div className="mb-3">
                          <Label className="text-xs text-gray-600">预设里程碑</Label>
                          <p className="text-[10px] text-gray-400 mb-1">AI 会在适当时机触发这些成就</p>
                          <div className="space-y-1.5 mt-1">
                            {(settings.chatMilestoneList || ['第一次开玩笑', '第一次分享秘密', '第一次深入交流']).map((ms, i) => (
                              <div key={i} className="flex items-center gap-2">
                                <input
                                  value={ms}
                                  onChange={(e) => {
                                    const list = [...(settings.chatMilestoneList || ['第一次开玩笑', '第一次分享秘密', '第一次深入交流'])]
                                    list[i] = e.target.value
                                    updateSettings({ chatMilestoneList: list })
                                  }}
                                  className="flex-1 h-7 text-xs border rounded px-2"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const list = (settings.chatMilestoneList || ['第一次开玩笑', '第一次分享秘密', '第一次深入交流']).filter((_, idx) => idx !== i)
                                    updateSettings({ chatMilestoneList: list })
                                  }}
                                  className="text-gray-300 hover:text-red-400 text-xs"
                                ><X className="w-3 h-3" /></button>
                              </div>
                            ))}
                            <button
                              type="button"
                              onClick={() => {
                                const list = [...(settings.chatMilestoneList || ['第一次开玩笑', '第一次分享秘密', '第一次深入交流']), '']
                                updateSettings({ chatMilestoneList: list })
                              }}
                              className="text-xs text-indigo-500 hover:text-indigo-600"
                            >+ 添加里程碑</button>
                          </div>
                        </div>
                      )}

                      {/* Event hints */}
                      {(settings.chatFeatures?.event !== false) && (
                        <div className="mb-3">
                          <Label className="text-xs text-gray-600">剧情事件提示</Label>
                          <p className="text-[10px] text-gray-400 mb-1">提示 AI 可以触发哪些事件</p>
                          <div className="space-y-1.5 mt-1">
                            {(settings.chatEventHints || []).map((hint, i) => (
                              <div key={i} className="flex items-center gap-2">
                                <input
                                  value={hint}
                                  onChange={(e) => {
                                    const list = [...(settings.chatEventHints || [])]
                                    list[i] = e.target.value
                                    updateSettings({ chatEventHints: list })
                                  }}
                                  className="flex-1 h-7 text-xs border rounded px-2"
                                  placeholder="如：突然下起了雨"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const list = (settings.chatEventHints || []).filter((_, idx) => idx !== i)
                                    updateSettings({ chatEventHints: list })
                                  }}
                                  className="text-gray-300 hover:text-red-400 text-xs"
                                ><X className="w-3 h-3" /></button>
                              </div>
                            ))}
                            <button
                              type="button"
                              onClick={() => {
                                const list = [...(settings.chatEventHints || []), '']
                                updateSettings({ chatEventHints: list })
                              }}
                              className="text-xs text-indigo-500 hover:text-indigo-600"
                            >+ 添加事件</button>
                          </div>
                        </div>
                      )}

                      {/* TTS, Sticker, Typing settings */}
                      <div className="border-t border-gray-100 pt-3 mt-3">
                        <p className="text-[10px] text-indigo-500 font-medium mb-3">沉浸体验增强</p>

                        {/* TTS */}
                        <div className="mb-3">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={settings.chatTtsEnabled || false}
                              onChange={(e) => updateSettings({ chatTtsEnabled: e.target.checked })}
                              className="w-3.5 h-3.5 accent-indigo-500 rounded"
                            />
                            <span className="text-xs text-gray-700 flex items-center gap-1"><Volume2 className="w-3 h-3" /> 语音回复</span>
                            <span className="text-[10px] text-gray-400">AI 消息自动朗读</span>
                          </label>
                          {settings.chatTtsEnabled && (
                            <div className="mt-2 space-y-2 ml-5">
                              <div>
                                <Label className="text-[10px] text-gray-500">音色选择</Label>
                                <div className="grid grid-cols-3 gap-1.5 mt-1">
                                  {[
                                    { key: '', label: '晓晓', desc: '温柔女声' },
                                    { key: '云希', label: '云希', desc: '阳光男声' },
                                    { key: '晓伊', label: '晓伊', desc: '活泼女声' },
                                    { key: '云扬', label: '云扬', desc: '成熟男声' },
                                    { key: '晓墨', label: '晓墨', desc: '知性女声' },
                                    { key: '晓梦', label: '晓梦', desc: '甜美女声' },
                                    { key: '云枫', label: '云枫', desc: '沉稳男声' },
                                    { key: '晓柔', label: '晓柔', desc: '柔和女声' },
                                    { key: '云皓', label: '云皓', desc: '磁性男声' },
                                  ].map(v => (
                                    <button
                                      key={v.key}
                                      type="button"
                                      onClick={() => updateSettings({ chatTtsVoice: v.key || undefined })}
                                      className={`p-1.5 rounded-lg border text-center transition-all ${
                                        (settings.chatTtsVoice || '') === v.key ? 'border-indigo-400 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'
                                      }`}
                                    >
                                      <p className="text-[10px] font-medium text-gray-700">{v.label}</p>
                                      <p className="text-[9px] text-gray-400">{v.desc}</p>
                                    </button>
                                  ))}
                                </div>
                              </div>
                              <div>
                                <Label className="text-[10px] text-gray-500">语音内容模式</Label>
                                <div className="grid grid-cols-3 gap-1.5 mt-1">
                                  {[
                                    { key: 'auto', label: '自动朗读', desc: '读AI回复原文' },
                                    { key: 'custom', label: 'AI定制', desc: 'AI生成专门语音' },
                                    { key: 'keyword', label: '关键词触发', desc: '匹配关键词播语音' },
                                  ].map(v => (
                                    <button
                                      key={v.key}
                                      type="button"
                                      onClick={() => updateSettings({ chatTtsMode: v.key as 'auto' | 'custom' | 'keyword' })}
                                      className={`p-2 rounded-lg border text-center transition-all ${
                                        (settings.chatTtsMode || 'auto') === v.key ? 'border-indigo-400 bg-indigo-50' : 'border-gray-200'
                                      }`}
                                    >
                                      <p className="text-[10px] font-medium text-gray-700">{v.label}</p>
                                      <p className="text-[9px] text-gray-400">{v.desc}</p>
                                    </button>
                                  ))}
                                </div>
                                {(settings.chatTtsMode === 'custom') && (
                                  <p className="text-[10px] text-gray-400 mt-1.5">AI 会用 [VOICE:内容] 标记指定语音台词，与文字内容不同（更口语化/更有表现力）</p>
                                )}
                                {(settings.chatTtsMode === 'keyword') && (
                                  <div className="mt-2 space-y-2">
                                    <p className="text-[10px] text-gray-400">当 AI 回复中包含关键词时，自动用对应内容播语音：</p>
                                    {(settings.chatVoiceTriggers || []).map((trigger, idx) => (
                                      <div key={idx} className="flex items-center gap-1.5">
                                        <input
                                          type="text"
                                          value={trigger.keyword}
                                          onChange={(e) => {
                                            const triggers = [...(settings.chatVoiceTriggers || [])]
                                            triggers[idx] = { ...triggers[idx], keyword: e.target.value }
                                            updateSettings({ chatVoiceTriggers: triggers })
                                          }}
                                          placeholder="关键词"
                                          className="flex-1 h-7 px-2 text-[10px] rounded-md border border-gray-200 focus:border-indigo-300"
                                        />
                                        <span className="text-[9px] text-gray-300">→</span>
                                        <input
                                          type="text"
                                          value={trigger.reply}
                                          onChange={(e) => {
                                            const triggers = [...(settings.chatVoiceTriggers || [])]
                                            triggers[idx] = { ...triggers[idx], reply: e.target.value }
                                            updateSettings({ chatVoiceTriggers: triggers })
                                          }}
                                          placeholder="语音内容"
                                          className="flex-[2] h-7 px-2 text-[10px] rounded-md border border-gray-200 focus:border-indigo-300"
                                        />
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const triggers = (settings.chatVoiceTriggers || []).filter((_, i) => i !== idx)
                                            updateSettings({ chatVoiceTriggers: triggers })
                                          }}
                                          className="w-5 h-5 flex items-center justify-center text-red-400 hover:text-red-600 text-xs"
                                        >×</button>
                                      </div>
                                    ))}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const triggers = [...(settings.chatVoiceTriggers || []), { keyword: '', reply: '' }]
                                        updateSettings({ chatVoiceTriggers: triggers })
                                      }}
                                      className="text-[10px] text-indigo-500 hover:text-indigo-700"
                                    >+ 添加关键词规则</button>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Typing rhythm */}
                        <div className="mb-3">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={settings.chatTypingEnabled !== false}
                              onChange={(e) => updateSettings({ chatTypingEnabled: e.target.checked })}
                              className="w-3.5 h-3.5 accent-indigo-500 rounded"
                            />
                            <span className="text-xs text-gray-700">⌨️ 打字节奏</span>
                            <span className="text-[10px] text-gray-400">连发消息间有停顿</span>
                          </label>
                        </div>

                        {/* Retract */}
                        <div className="mb-3">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={settings.chatRetractEnabled || false}
                              onChange={(e) => updateSettings({ chatRetractEnabled: e.target.checked })}
                              className="w-3.5 h-3.5 accent-indigo-500 rounded"
                            />
                            <span className="text-xs text-gray-700">↩️ 撤回演出</span>
                            <span className="text-[10px] text-gray-400">AI 偶尔撤回重发</span>
                          </label>
                        </div>

                        {/* Sticker packs */}
                        <div className="mb-3">
                          <Label className="text-xs text-gray-600 flex items-center gap-1"><Palette className="w-3 h-3" /> 贴纸库</Label>
                          <p className="text-[10px] text-gray-400 mb-1">AI 可在情绪高涨时发送贴纸</p>
                          <div className="space-y-2 mt-1">
                            {(settings.chatStickerPacks || []).map((sticker, i) => (
                              <div key={i} className="border border-gray-100 rounded-lg p-2">
                                <div className="flex items-center gap-2 mb-1.5">
                                  <input
                                    value={sticker.name}
                                    onChange={(e) => {
                                      const list = [...(settings.chatStickerPacks || [])]
                                      list[i] = { ...list[i], name: e.target.value }
                                      updateSettings({ chatStickerPacks: list })
                                    }}
                                    className="flex-1 h-7 text-xs border rounded px-2"
                                    placeholder="贴纸名称（如：开心、害羞）"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const list = (settings.chatStickerPacks || []).filter((_, idx) => idx !== i)
                                      updateSettings({ chatStickerPacks: list })
                                    }}
                                    className="text-gray-300 hover:text-red-400 text-xs"
                                  ><X className="w-3 h-3" /></button>
                                </div>
                                <ImagePicker
                                  value={sticker.url}
                                  onChange={(url) => {
                                    const list = [...(settings.chatStickerPacks || [])]
                                    list[i] = { ...list[i], url: url || '' }
                                    updateSettings({ chatStickerPacks: list })
                                  }}
                                  label="选择贴纸图片"
                                />
                              </div>
                            ))}
                            <button
                              type="button"
                              onClick={() => {
                                const list = [...(settings.chatStickerPacks || []), { name: '', url: '' }]
                                updateSettings({ chatStickerPacks: list })
                              }}
                              className="text-xs text-indigo-500 hover:text-indigo-600"
                            >+ 添加贴纸</button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Preview button */}
              <button
                type="button"
                onClick={() => setShowPreview(true)}
                className="w-full mt-2 py-2.5 rounded-lg border-2 border-dashed border-indigo-300 text-indigo-600 text-sm font-medium hover:bg-indigo-50 hover:border-indigo-400 transition-all flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4" />
                预览对话效果
              </button>

              {/* Preview modal */}
              <ChatPreviewModal
                open={showPreview}
                onClose={() => setShowPreview(false)}
                config={{
                  roleName: settings.chatRole || '问卷助手',
                  scene: settings.chatScene || '',
                  personality: settings.chatPersonality || '',
                  avatarStyle: settings.chatAvatarStyle || 'avataaars',
                  tone: settings.chatTone || '',
                  habit: settings.chatHabit || '',
                  bondTierNames: settings.chatBondTierNames || ['初识', '渐熟', '知己'],
                  bondStart: settings.chatBondStart ?? 20,
                  theme: settings.theme,
                  features: settings.chatFeatures,
                  stickers: settings.chatStickerPacks,
                  retractEnabled: settings.chatRetractEnabled,
                  ttsEnabled: settings.chatTtsEnabled,
                }}
              />
            </div>
        </section>
  )
}
