import React, { useEffect, useState } from 'react'
import { Check } from 'lucide-react'
import { SectionHeader, Button } from '../components/ui.jsx'
import { useData } from '../context/DataContext.jsx'

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
  const { adminSettings, adminSettingsLoading, adminSettingsError, saveAdminSetting } = useData()
  const [tab, setTab] = useState('terms')
  const [content, setContent] = useState(DEFAULTS)
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  useEffect(() => {
    if (!adminSettingsLoading && adminSettings.content) setContent({ ...DEFAULTS, ...adminSettings.content })
  }, [adminSettings.content, adminSettingsLoading])

  const save = async () => {
    setSaving(true)
    setSaved(false)
    setSaveError('')
    const result = await saveAdminSetting('content', content)
    setSaving(false)
    if (result.error) {
      setSaveError(result.error.message || 'Unable to save content.')
      return
    }
    setSaved(true)
    setTimeout(() => setSaved(false), 1800)
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Content"
        subtitle="Edit static in-app content."
        action={<Button variant="accent" onClick={save} disabled={saving || adminSettingsLoading}>{saving ? 'Saving…' : saved ? <><Check size={15} /> Saved</> : 'Save changes'}</Button>}
      />
      {(adminSettingsError || saveError) && <div role="alert" className="rounded-xl border border-bad/20 bg-bad-bg px-4 py-3 text-sm text-bad">{saveError || `Content could not be loaded: ${adminSettingsError.message}`}</div>}

      <div className="flex gap-2 mb-5 flex-wrap">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-xl px-4 py-2 text-xs font-medium border transition ${tab === t.key ? 'bg-deep text-white border-deep shadow-lg' : 'border-black/10 text-ink-700 hover:bg-black/5'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-[0_10px_24px_rgba(15,23,42,0.03)]">
        <textarea
          value={content[tab]}
          disabled={adminSettingsLoading}
          onChange={(e) => setContent({ ...content, [tab]: e.target.value })}
          rows={14}
          className="w-full rounded-xl border border-black/10 bg-slate-50 p-4 text-sm font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-accent/40"
        />
        <p className="text-xs text-slate2 mt-3">Saved content is shared with admin accounts. The passenger app must read these settings before changes appear there.</p>
      </div>
    </div>
  )
}
