import React, { useState } from 'react'
import { Check } from 'lucide-react'
import { SectionHeader, Button } from '../components/ui.jsx'

const TABS = [
  { key: 'terms', label: 'Terms of service' },
  { key: 'privacy', label: 'Privacy policy' },
  { key: 'faq', label: 'FAQ' },
  { key: 'onboarding', label: 'Onboarding slides' },
  { key: 'support', label: 'Support contact details' },
]

const DEFAULTS = {
  terms: 'By using this app you agree to our terms of service...',
  privacy: 'We collect the following information to provide the service...',
  faq: 'Q: How do I reset my password?\nA: Go to Settings > Account > Reset password.',
  onboarding: 'Slide 1: Welcome — get moving in minutes.\nSlide 2: Set your destination and see your fare upfront.\nSlide 3: Track your ride in real time.',
  support: 'Email: support@lyft-clone.example\nPhone: 0800 555 0142\nHours: 24/7',
}

export default function Content() {
  const [tab, setTab] = useState('terms')
  const [content, setContent] = useState(DEFAULTS)
  const [saved, setSaved] = useState(false)

  const save = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 1800)
  }

  return (
    <div>
      <SectionHeader
        title="Content"
        subtitle="Edit static in-app content."
        action={<Button variant="accent" onClick={save}>{saved ? <><Check size={15} /> Saved</> : 'Save changes'}</Button>}
      />

      <div className="flex gap-1.5 mb-4 flex-wrap">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-full px-3 py-1 text-xs font-medium border transition ${tab === t.key ? 'bg-deep text-white border-deep' : 'border-black/10 text-ink-700 hover:bg-black/5'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <textarea
        value={content[tab]}
        onChange={(e) => setContent({ ...content, [tab]: e.target.value })}
        rows={14}
        className="w-full rounded-lg border border-black/10 bg-white p-4 text-sm font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-accent/40"
      />
      <p className="text-xs text-slate2 mt-2">This is a local draft. Publishing to the live app isn't wired up yet — hook this up to your content API when ready.</p>
    </div>
  )
}
