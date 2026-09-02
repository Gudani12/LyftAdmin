import React, { useMemo, useState } from 'react'
import { AlertCircle, Building2, Check, Crosshair, MapPin, Pencil, Plus, Search, Trash2, X } from 'lucide-react'
import { useData } from '../context/DataContext.jsx'
import { Button, EmptyState, Modal, SectionHeader, StatusBadge } from '../components/ui.jsx'

const JOHANNESBURG = { latitude: -26.2041, longitude: 28.0473 }
const EMPTY_FORM = { name: '', address: '', latitude: JOHANNESBURG.latitude, longitude: JOHANNESBURG.longitude, radius: 500, status: 'active' }

export default function Hubs() {
  const { hubs, hubsLoading, hubsError, createHub, updateHub, deleteHub } = useData()
  const [query, setQuery] = useState('')
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  const filteredHubs = useMemo(() => hubs.filter((hub) => `${hub.name} ${hub.address}`.toLowerCase().includes(query.toLowerCase())), [hubs, query])
  const activeCount = hubs.filter((hub) => hub.status === 'active').length

  const openCreate = () => { setEditing('new'); setForm({ ...EMPTY_FORM }); setMessage('') }
  const openEdit = (hub) => { setEditing(hub.id); setForm({ ...hub }); setMessage('') }
  const closeModal = () => { if (!saving) setEditing(null) }

  const saveHub = async (event) => {
    event.preventDefault()
    setSaving(true)
    setMessage('')
    const payload = {
      name: form.name.trim(),
      address: form.address.trim(),
      latitude: Number(form.latitude),
      longitude: Number(form.longitude),
      radius: Number(form.radius),
      status: form.status,
    }
    const result = editing === 'new' ? await createHub(payload) : await updateHub(editing, payload)
    setSaving(false)
    if (result.error) { setMessage(result.error.message || 'Unable to save hub.'); return }
    setEditing(null)
  }

  const toggleHub = async (hub) => {
    const result = await updateHub(hub.id, { status: hub.status === 'active' ? 'inactive' : 'active' })
    if (result.error) setMessage(result.error.message || 'Unable to change hub status.')
  }

  const removeHub = async (hub) => {
    if (!window.confirm(`Delete ${hub.name}? This cannot be undone.`)) return
    const result = await deleteHub(hub.id)
    if (result.error) setMessage(result.error.message || 'Unable to delete hub.')
  }

  return (
    <div className="space-y-6">
      <SectionHeader title="Hub management" subtitle="Create, locate, and control the service hubs used by your network." action={<Button variant="accent" onClick={openCreate}><Plus size={16} /> New hub</Button>} />
      <div className="grid gap-4 sm:grid-cols-3">
        <Summary label="Total hubs" value={hubs.length} icon={Building2} />
        <Summary label="Active hubs" value={activeCount} icon={Check} tone="text-good" />
        <Summary label="Inactive hubs" value={hubs.length - activeCount} icon={X} tone="text-slate2" />
      </div>
      {hubsError && <div className="flex items-center gap-2 rounded-xl border border-bad/20 bg-bad-bg px-4 py-3 text-sm text-bad"><AlertCircle size={16} /> Could not load hubs from Supabase. Check the table permissions and try again.</div>}
      {message && <div className="rounded-xl border border-amber/30 bg-amber-bg px-4 py-3 text-sm text-amber-700">{message}</div>}
      <div className="rounded-2xl border border-black/5 bg-white shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/5 px-5 py-4">
          <div><h2 className="font-display text-lg font-semibold">All hubs</h2><p className="text-sm text-slate2">{filteredHubs.length} of {hubs.length} locations</p></div>
          <div className="relative w-full sm:w-72"><Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate2" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search hubs..." className="w-full rounded-xl border border-black/10 bg-slate-50 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-accent/40 focus:ring-4 focus:ring-accent/10" /></div>
        </div>
        {hubsLoading ? <div className="p-10 text-center text-sm text-slate2">Loading hubs...</div> : filteredHubs.length === 0 ? <div className="p-5"><EmptyState title={query ? 'No hubs match your search' : 'No hubs created yet'} hint={query ? 'Try a different name or address.' : 'Create the first hub to start managing service coverage.'} /></div> : <div className="divide-y divide-black/5">{filteredHubs.map((hub) => <HubRow key={hub.id} hub={hub} onEdit={openEdit} onToggle={toggleHub} onDelete={removeHub} />)}</div>}
      </div>
      <Modal open={editing !== null} onClose={closeModal} title={editing === 'new' ? 'Create hub' : 'Edit hub'} wide>
        <form onSubmit={saveHub} className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2"><Field label="Hub name" value={form.name} required onChange={(value) => setForm({ ...form, name: value })} /><Field label="Address" value={form.address} required onChange={(value) => setForm({ ...form, address: value })} /></div>
          <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]"><MapPicker form={form} setForm={setForm} /><div className="space-y-4"><div className="grid grid-cols-2 gap-3"><Field label="Latitude" type="number" step="0.00000001" value={form.latitude} required onChange={(value) => setForm({ ...form, latitude: value })} /><Field label="Longitude" type="number" step="0.00000001" value={form.longitude} required onChange={(value) => setForm({ ...form, longitude: value })} /></div><Field label="Radius (metres)" type="number" min="1" value={form.radius} required onChange={(value) => setForm({ ...form, radius: value })} /><label className="flex items-center justify-between rounded-xl border border-black/10 px-3.5 py-3 text-sm"><span><span className="block font-semibold">Hub enabled</span><span className="text-xs text-slate2">Allow trips to use this location</span></span><input type="checkbox" checked={form.status === 'active'} onChange={(event) => setForm({ ...form, status: event.target.checked ? 'active' : 'inactive' })} className="h-4 w-4 accent-accent" /></label></div></div>
          {message && <p className="text-sm text-bad">{message}</p>}<div className="flex justify-end gap-2 border-t border-black/5 pt-4"><Button type="button" variant="ghost" onClick={closeModal}>Cancel</Button><Button type="submit" variant="accent" disabled={saving || !form.name.trim() || !form.address.trim()}>{saving ? 'Saving...' : <><Check size={15} /> Save hub</>}</Button></div>
        </form>
      </Modal>
    </div>
  )
}

function Summary({ label, value, icon: Icon, tone = 'text-accent' }) { return <div className="rounded-2xl border border-black/5 bg-white p-4 shadow-sm"><div className="flex items-center justify-between"><span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate2">{label}</span><Icon size={17} className={tone} /></div><div className="mt-2 font-display text-2xl font-semibold">{value}</div></div> }
function Field({ label, value, onChange, ...props }) { return <label className="block text-xs font-semibold uppercase tracking-[0.14em] text-slate2">{label}<input {...props} value={value} onChange={(event) => onChange(event.target.value)} className="mt-1.5 w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm font-normal normal-case tracking-normal text-ink outline-none focus:border-accent/40 focus:ring-4 focus:ring-accent/10" /></label> }
function HubRow({ hub, onEdit, onToggle, onDelete }) { return <div className="flex flex-wrap items-center gap-4 px-5 py-4 transition hover:bg-slate-50"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-50 text-accent"><Building2 size={18} /></div><div className="min-w-[180px] flex-1"><div className="font-semibold">{hub.name}</div><div className="mt-0.5 text-sm text-slate2">{hub.address}</div></div><div className="hidden min-w-[170px] text-sm text-slate2 md:block"><div className="font-mono text-xs text-ink">{Number(hub.latitude).toFixed(6)}, {Number(hub.longitude).toFixed(6)}</div><div className="mt-1">{hub.radius} m radius</div></div><StatusBadge status={hub.status} /><div className="flex items-center gap-1"><button title="Edit hub" onClick={() => onEdit(hub)} className="rounded-lg p-2 text-slate2 hover:bg-accent-50 hover:text-accent"><Pencil size={16} /></button><button title={hub.status === 'active' ? 'Disable hub' : 'Enable hub'} onClick={() => onToggle(hub)} className="rounded-lg p-2 text-slate2 hover:bg-accent-50 hover:text-accent">{hub.status === 'active' ? <X size={16} /> : <Check size={16} />}</button><button title="Delete hub" onClick={() => onDelete(hub)} className="rounded-lg p-2 text-slate2 hover:bg-bad-bg hover:text-bad"><Trash2 size={16} /></button></div></div> }
function MapPicker({ form, setForm }) { const handleMapClick = (event) => { const bounds = event.currentTarget.getBoundingClientRect(); const longitude = -180 + ((event.clientX - bounds.left) / bounds.width) * 360; const latitude = 85 - ((event.clientY - bounds.top) / bounds.height) * 170; setForm({ ...form, latitude: latitude.toFixed(8), longitude: longitude.toFixed(8) }) }; const left = `${((Number(form.longitude) + 180) / 360) * 100}%`; const top = `${((85 - Number(form.latitude)) / 170) * 100}%`; return <div><div className="mb-1.5 flex items-center justify-between"><label className="text-xs font-semibold uppercase tracking-[0.14em] text-slate2">Map location</label><span className="flex items-center gap-1 text-xs text-slate2"><Crosshair size={13} /> Click to place</span></div><div onClick={handleMapClick} className="relative h-64 cursor-crosshair overflow-hidden rounded-xl border border-black/10 bg-[#dcebe2] bg-[linear-gradient(30deg,transparent_48%,rgba(255,255,255,0.7)_49%,rgba(255,255,255,0.7)_51%,transparent_52%),linear-gradient(150deg,transparent_48%,rgba(255,255,255,0.7)_49%,rgba(255,255,255,0.7)_51%,transparent_52%)] bg-[length:68px_68px]"><div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_35%,rgba(14,92,63,0.12)_100%)]" /><div className="absolute left-[18%] top-[24%] h-24 w-44 rotate-12 rounded-[45%] bg-[#b6d8c0]/80" /><div className="absolute bottom-[16%] right-[12%] h-20 w-36 -rotate-12 rounded-[45%] bg-[#b6d8c0]/70" /><div className="absolute -translate-x-1/2 -translate-y-full" style={{ left, top }}><MapPin size={30} fill="#0e5c3f" className="text-white drop-shadow-md" /></div><div className="absolute bottom-3 left-3 rounded-lg bg-white/85 px-2 py-1 text-[11px] font-medium text-slate2 backdrop-blur">South Africa region</div></div></div> }
