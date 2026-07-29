import React, { useState } from 'react'
import { Check } from 'lucide-react'
import { SectionHeader, Button } from '../components/ui.jsx'

const DEFAULT_REGIONS = [
  { id: 1, region: 'Johannesburg', baseFare: 25, perKm: 6.5, perMin: 1.8 },
  { id: 2, region: 'Cape Town', baseFare: 27, perKm: 7.0, perMin: 1.9 },
  { id: 3, region: 'Durban', baseFare: 22, perKm: 5.8, perMin: 1.6 },
]

export default function Pricing() {
  const [base, setBase] = useState({ baseFare: 25, perKm: 6.5, perMin: 1.8, surge: 1.0, cancelFee: 15 })
  const [regions, setRegions] = useState(DEFAULT_REGIONS)
  const [saved, setSaved] = useState(false)

  const updateRegion = (id, field, value) => {
    setRegions((rs) => rs.map((r) => r.id === id ? { ...r, [field]: value } : r))
  }

  const save = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div>
      <SectionHeader
        title="Pricing"
        subtitle="Base rates, surge, cancellation fees, and per-region overrides."
        action={<Button variant="accent" onClick={save}>{saved ? <><Check size={15} /> Saved</> : 'Save changes'}</Button>}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Field label="Base fare (R)" value={base.baseFare} onChange={(v) => setBase({ ...base, baseFare: v })} />
        <Field label="Per km (R)" value={base.perKm} onChange={(v) => setBase({ ...base, perKm: v })} />
        <Field label="Per minute (R)" value={base.perMin} onChange={(v) => setBase({ ...base, perMin: v })} />
        <Field label="Cancellation fee (R)" value={base.cancelFee} onChange={(v) => setBase({ ...base, cancelFee: v })} />
      </div>

      <div className="mb-6">
        <label className="text-xs text-slate2">Peak / surge multiplier</label>
        <div className="flex items-center gap-3 mt-1 max-w-sm">
          <input type="range" min="1" max="3" step="0.1" value={base.surge} onChange={(e) => setBase({ ...base, surge: parseFloat(e.target.value) })} className="flex-1" />
          <span className="font-mono text-sm w-12">{base.surge.toFixed(1)}x</span>
        </div>
      </div>

      <h2 className="font-display font-semibold mb-3">Per-region overrides</h2>
      <div className="rounded-lg border border-black/5 bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate2-bg text-xs text-slate2 uppercase tracking-wide">
            <tr>
              <th className="text-left px-4 py-2 font-medium">Region</th>
              <th className="text-left px-4 py-2 font-medium">Base fare (R)</th>
              <th className="text-left px-4 py-2 font-medium">Per km (R)</th>
              <th className="text-left px-4 py-2 font-medium">Per minute (R)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5">
            {regions.map((r) => (
              <tr key={r.id}>
                <td className="px-4 py-2 font-medium">{r.region}</td>
                <td className="px-4 py-2"><InlineInput value={r.baseFare} onChange={(v) => updateRegion(r.id, 'baseFare', v)} /></td>
                <td className="px-4 py-2"><InlineInput value={r.perKm} onChange={(v) => updateRegion(r.id, 'perKm', v)} /></td>
                <td className="px-4 py-2"><InlineInput value={r.perMin} onChange={(v) => updateRegion(r.id, 'perMin', v)} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function Field({ label, value, onChange }) {
  return (
    <div className="rounded-lg border border-black/5 bg-white p-3">
      <label className="text-xs text-slate2">{label}</label>
      <input type="number" step="0.1" value={value} onChange={(e) => onChange(parseFloat(e.target.value) || 0)} className="mt-1 w-full font-mono text-lg font-semibold outline-none" />
    </div>
  )
}

function InlineInput({ value, onChange }) {
  return (
    <input
      type="number" step="0.1" value={value}
      onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
      className="w-24 rounded border border-black/10 px-2 py-1 font-mono text-sm"
    />
  )
}
