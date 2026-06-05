'use client'

import { useState, useEffect, useRef } from 'react'
import { FileText, ArrowDown, ArrowRight, Brain, Heart, Coffee, Drama, Palette, Zap, BarChart3, Smartphone, ClipboardList, Sparkles } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      <Navbar />
      <HeroSection />
      <FeaturesSection />
      <TemplatesSection />
      <DemoSection />
      <CTASection />
      <Footer />
    </div>
  )
}

// ===== Navbar =====
function Navbar() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/90 backdrop-blur-md shadow-sm' : 'bg-transparent'}`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <FileText className="w-4 h-4 text-white" />
          </div>
          <span className={`font-bold text-lg ${scrolled ? 'text-gray-800' : 'text-white'}`}>趣测小屋</span>
        </div>
        <div className="flex items-center gap-3">
          <a href="/templates" className={`text-sm px-3 py-1.5 rounded-lg transition-colors ${scrolled ? 'text-gray-600 hover:text-indigo-600' : 'text-white/80 hover:text-white'}`}>
            模板库
          </a>
          <a href="/admin" className="text-sm px-4 py-2 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30 text-white hover:bg-white hover:text-indigo-600 transition-all font-medium">
            开始创建
          </a>
        </div>
      </div>
    </nav>
  )
}

// ===== Hero =====
function HeroSection() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 animate-gradientShift" />

      {/* Floating orbs */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute w-96 h-96 bg-white/10 rounded-full blur-3xl -top-20 -left-20 animate-floatSlow" />
        <div className="absolute w-80 h-80 bg-purple-300/20 rounded-full blur-3xl top-1/2 right-0 animate-floatMedium" />
        <div className="absolute w-64 h-64 bg-pink-300/20 rounded-full blur-3xl bottom-20 left-1/3 animate-floatFast" />
      </div>

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

      <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
        <div className={`transition-all duration-1000 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 text-white/90 text-sm mb-8">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            AI 驱动的创意问卷平台
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold text-white leading-tight mb-6">
            让每一份测试
            <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-yellow-200 via-pink-200 to-cyan-200">
              都值得分享
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-white/70 max-w-2xl mx-auto mb-10 leading-relaxed">
            性格测试、闺蜜默契、AI 角色对话...
            <br className="hidden sm:block" />
            3 分钟创建爆款测试，让你的内容在小红书刷屏
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a href="/admin" className="px-8 py-4 rounded-2xl bg-white text-indigo-600 font-bold text-lg shadow-xl hover:shadow-2xl hover:scale-105 transition-all">
              免费开始创建
            </a>
            <a href="/templates" className="px-8 py-4 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/30 text-white font-medium hover:bg-white/20 transition-all">
              浏览模板库
            </a>
          </div>
        </div>

        {/* Floating demo cards */}
        <div className={`mt-16 relative transition-all duration-1000 delay-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-20'}`}>
          <div className="flex justify-center gap-4 perspective-1000">
            <DemoCard delay={0} title="MBTI 测试" icon={<Brain className="w-7 h-7" />} color="from-violet-400 to-purple-500" />
            <DemoCard delay={100} title="闺蜜默契" icon={<Heart className="w-7 h-7" />} color="from-pink-400 to-rose-500" />
            <DemoCard delay={200} title="奶茶口味" icon={<Coffee className="w-7 h-7" />} color="from-amber-400 to-orange-500" />
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <ArrowDown className="w-6 h-6 text-white/60" />
      </div>
    </section>
  )
}

function DemoCard({ delay, title, icon, color }: { delay: number; title: string; icon: React.ReactNode; color: string }) {
  return (
    <div
      className={`w-40 sm:w-48 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 text-center hover:scale-110 hover:-translate-y-2 transition-all cursor-pointer`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <span className="flex justify-center text-white/90 mb-2">{icon}</span>
      <span className="text-white/90 text-sm font-medium">{title}</span>
      <div className={`mt-2 h-1.5 rounded-full bg-gradient-to-r ${color} opacity-60`} />
    </div>
  )
}

// ===== Features =====
function FeaturesSection() {
  return (
    <section className="py-24 bg-gray-50 relative">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <ScrollReveal>
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">为什么选择趣测小屋？</h2>
            <p className="text-gray-500 max-w-xl mx-auto">不只是问卷工具，而是帮你打造爆款内容的创作平台</p>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <ScrollReveal delay={0}>
            <FeatureCard
              icon={<Drama className="w-8 h-8 text-violet-600" />}
              title="AI 角色对话"
              description="让 AI 化身有趣角色与用户对话，沉浸式收集答案，完成率提升 3 倍"
              gradient="from-violet-100 to-purple-100"
            />
          </ScrollReveal>
          <ScrollReveal delay={150}>
            <FeatureCard
              icon={<Palette className="w-8 h-8 text-pink-600" />}
              title="一键生成分享卡"
              description="自动生成精美结果卡片，用户截图发小红书、朋友圈，自发传播"
              gradient="from-pink-100 to-rose-100"
            />
          </ScrollReveal>
          <ScrollReveal delay={300}>
            <FeatureCard
              icon={<Zap className="w-8 h-8 text-amber-600" />}
              title="3 分钟创建"
              description="丰富模板库 + AI 辅助，选个模板改几个字就能发布，零门槛"
              gradient="from-amber-100 to-orange-100"
            />
          </ScrollReveal>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
          <ScrollReveal delay={100}>
            <FeatureCard
              icon={<BarChart3 className="w-8 h-8 text-cyan-600" />}
              title="评分与结果系统"
              description="自动计算得分、匹配结果标签，支持多区间多维度评测"
              gradient="from-cyan-100 to-blue-100"
            />
          </ScrollReveal>
          <ScrollReveal delay={250}>
            <FeatureCard
              icon={<Smartphone className="w-8 h-8 text-green-600" />}
              title="移动端优先"
              description="完美适配手机端，滑动答题、手势操作，像刷抖音一样流畅"
              gradient="from-green-100 to-emerald-100"
            />
          </ScrollReveal>
        </div>
      </div>
    </section>
  )
}

function FeatureCard({ icon, title, description, gradient }: { icon: React.ReactNode; title: string; description: string; gradient: string }) {
  return (
    <div className={`bg-gradient-to-br ${gradient} rounded-3xl p-8 hover:scale-[1.02] hover:shadow-lg transition-all cursor-default`}>
      <span className="block mb-4">{icon}</span>
      <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 leading-relaxed">{description}</p>
    </div>
  )
}

// ===== Templates Showcase =====
function TemplatesSection() {
  const templates = [
    { title: 'MBTI 十六型人格', category: '性格测试', color: '#8b5cf6', icon: <Brain className="w-7 h-7" /> },
    { title: '闺蜜默契度考验', category: '情感社交', color: '#ec4899', icon: <Heart className="w-7 h-7" /> },
    { title: '你是什么奶茶', category: '趣味生活', color: '#f59e0b', icon: <Coffee className="w-7 h-7" /> },
    { title: '恋爱人格测试', category: '情感社交', color: '#e11d48', icon: <Sparkles className="w-7 h-7" /> },
    { title: '动物人格占卜', category: 'AI对话', color: '#7c3aed', icon: <Drama className="w-7 h-7" /> },
    { title: '活动满意度', category: '实用工具', color: '#06b6d4', icon: <ClipboardList className="w-7 h-7" /> },
  ]

  return (
    <section className="py-24 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <ScrollReveal>
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">热门模板，一键开始</h2>
            <p className="text-gray-500">选一个喜欢的模板，改几个字就能发布</p>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {templates.map((t, i) => (
            <ScrollReveal key={i} delay={i * 80}>
              <a
                href="/templates"
                className="block bg-white border border-gray-100 rounded-2xl p-5 hover:shadow-lg hover:scale-[1.03] hover:border-gray-200 transition-all group"
              >
                <span className="flex justify-center mb-3 group-hover:scale-110 transition-transform" style={{ color: t.color }}>{t.icon}</span>
                <h4 className="font-semibold text-gray-800 text-sm mb-1">{t.title}</h4>
                <span className="text-[10px] px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: t.color }}>
                  {t.category}
                </span>
              </a>
            </ScrollReveal>
          ))}
        </div>

        <ScrollReveal delay={400}>
          <div className="text-center mt-10">
            <a href="/templates" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gray-900 text-white font-medium hover:bg-gray-800 transition-colors">
              查看全部模板
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}

// ===== Interactive Demo =====
function DemoSection() {
  const [step, setStep] = useState(0)
  const steps = [
    { q: '周末你更喜欢？', options: ['约朋友出去玩', '在家独处充电'] },
    { q: '做决定时你倾向于？', options: ['跟着感觉走', '理性分析利弊'] },
    { q: '聚会时你是？', options: ['全场焦点', '安静观察'] },
  ]

  return (
    <section className="py-24 bg-gradient-to-b from-indigo-50 to-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <ScrollReveal>
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">来，体验一下</h2>
            <p className="text-gray-500">看看你的用户会获得怎样的体验</p>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={200}>
          <div className="max-w-sm mx-auto">
            {/* Phone frame */}
            <div className="bg-gray-900 rounded-[3rem] p-3 shadow-2xl">
              <div className="bg-white rounded-[2.5rem] overflow-hidden">
                {/* Status bar */}
                <div className="h-8 bg-gray-50 flex items-center justify-center">
                  <div className="w-20 h-4 bg-gray-900 rounded-full" />
                </div>

                {/* Demo content */}
                <div className="p-6 min-h-[400px] flex flex-col justify-center">
                  {step < steps.length ? (
                    <div className="animate-fadeIn">
                      <div className="text-center mb-2">
                        <span className="text-[10px] text-indigo-500 font-medium">{step + 1} / {steps.length}</span>
                      </div>
                      <h3 className="text-lg font-bold text-gray-800 text-center mb-6">{steps[step].q}</h3>
                      <div className="space-y-3">
                        {steps[step].options.map((opt, i) => (
                          <button
                            key={i}
                            onClick={() => setTimeout(() => setStep(s => s + 1), 300)}
                            className="w-full text-left px-5 py-3.5 rounded-xl border-2 border-gray-100 hover:border-indigo-400 hover:bg-indigo-50 transition-all text-sm font-medium text-gray-700"
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center animate-bounceIn">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-indigo-100 flex items-center justify-center">
                        <span className="text-2xl font-bold text-indigo-600">8</span>
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 mb-2">INTJ 建筑师</h3>
                      <p className="text-sm text-gray-500 mb-6">独立有远见的战略思想家</p>
                      <button
                        onClick={() => setStep(0)}
                        className="text-xs text-indigo-500 hover:text-indigo-700"
                      >
                        再来一次
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}

// ===== CTA =====
function CTASection() {
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 to-purple-700" />
      <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '30px 30px' }} />

      <div className="relative z-10 max-w-3xl mx-auto px-4 text-center">
        <ScrollReveal>
          <h2 className="text-3xl sm:text-5xl font-bold text-white mb-6">
            准备好了吗？
          </h2>
          <p className="text-xl text-white/70 mb-10">
            免费创建你的第一份爆款测试，只需 3 分钟
          </p>
          <a href="/admin" className="inline-block px-10 py-5 rounded-2xl bg-white text-indigo-600 font-bold text-lg shadow-xl hover:shadow-2xl hover:scale-105 transition-all">
            立即开始，免费使用
          </a>
          <p className="text-white/50 text-sm mt-4">无需信用卡 · 免费版可创建 5 份问卷</p>
        </ScrollReveal>
      </div>
    </section>
  )
}

// ===== Footer =====
function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <FileText className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-sm text-gray-300 font-medium">趣测小屋</span>
          </div>
          <div className="flex items-center gap-6 text-sm">
            <a href="/templates" className="hover:text-white transition-colors">模板库</a>
            <a href="/admin" className="hover:text-white transition-colors">管理后台</a>
          </div>
          <p className="text-xs text-gray-500">jydigtal.com</p>
        </div>
      </div>
    </footer>
  )
}

// ===== Scroll Reveal Component =====
function ScrollReveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true) },
      { threshold: 0.1 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className="transition-all duration-700"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(30px)',
        transitionDelay: `${delay}ms`,
      }}
    >
      {children}
    </div>
  )
}
