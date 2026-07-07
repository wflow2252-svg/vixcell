'use client'

import { Cpu, Bot, Sparkles, Terminal } from 'lucide-react'

interface ComparisonProps {
  lang: 'ar' | 'en';
}

export default function Comparison({ lang }: ComparisonProps) {
  const t = (en: string, ar: string) => (lang === 'ar' ? ar : en)

  const agents = [
    { name: 'Claude Code', desc: 'Anthropic\'s developer CLI agent' },
    { name: 'Gemini CLI', desc: 'Google\'s multi-modal CLI developer' },
    { name: 'Cursor agent', desc: 'Local workspace coding companion' },
    { name: 'DeepSeek R1', desc: 'Advanced reasoning visual coder' },
    { name: 'Devin AI', desc: 'Fully autonomous software engineer' },
    { name: 'Antigravity SDK', desc: 'Google DeepMind coding companion' },
    { name: 'Qwen 2.5', desc: 'Open-source local model integration' },
    { name: 'Aider CLI', desc: 'Command-line pair programmer' }
  ]

  return (
    <section 
      id="agents"
      className="py-24 bg-white border-b border-neutral-200 relative z-10"
      dir={lang === 'ar' ? 'rtl' : 'ltr'}
    >
      <div className="max-w-6xl mx-auto px-6 text-center">
        
        {/* Title */}
        <h2 className="text-2xl sm:text-4xl font-black text-black mb-4 tracking-tight leading-relaxed">
          {t('Plug in 21+ coding agents, zero config', 'ربط 21+ مساعد برمجي ذكي، بدون إعدادات معقدة')}
        </h2>
        <p className="text-xs text-[#71717A] max-w-2xl mx-auto mb-16 leading-relaxed">
          {t(
            'Vixcell does not lock you into a single LLM provider. Choose your preferred coding agent or local weight model, and connect it instantly to your workspace.',
            'لا تلزمك فيكسل بمزود ذكاء اصطناعي واحد. اختر مساعد البرمجة المفضل لديك أو الموديل المحلي، وقم بربطه مباشرة ببيئة عملك.'
          )}
        </p>

        {/* Agents Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto text-right lg:text-left" style={{ textAlign: lang === 'ar' ? 'right' : 'left' }}>
          {agents.map((agent, idx) => (
            <div 
              key={idx}
              className="border border-neutral-200 bg-white p-5 rounded-xl hover:border-[#22C55E]/30 transition-all duration-300 group flex flex-col justify-between min-h-[120px] shadow-[0_4px_12px_rgba(0,0,0,0.01)]"
            >
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-bold text-black group-hover:text-[#22C55E] transition-colors">{agent.name}</span>
                <span className="text-[#A1A1AA] group-hover:text-black transition-colors">
                  {idx % 4 === 0 ? <Cpu className="w-3.5 h-3.5" /> :
                   idx % 4 === 1 ? <Bot className="w-3.5 h-3.5" /> :
                   idx % 4 === 2 ? <Sparkles className="w-3.5 h-3.5" /> : <Terminal className="w-3.5 h-3.5" />}
                </span>
              </div>
              <p className="text-[10px] text-[#71717A] leading-relaxed">{t(agent.desc, 'مساعد برمجي متكامل ومحسّن للتوليد والتعديل المباشر')}</p>
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}
