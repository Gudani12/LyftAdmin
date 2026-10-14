import React, { useEffect, useMemo, useState } from 'react'
import { AlertCircle, Building2, Check, Crosshair, MapPin, Pencil, Plus, Search, Sparkles, Trash2, X } from 'lucide-react'
import { Circle, CircleMarker, MapContainer, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import { useOutletContext } from 'react-router-dom'
import 'leaflet/dist/leaflet.css'
import { useData } from '../context/DataContext.jsx'
import { Button, EmptyState, Modal, SectionHeader, StatusBadge } from '../components/ui.jsx'

const JOHANNESBURG = { latitude: -26.2041, longitude: 28.0473 }
const SOUTH_AFRICA_CENTER = [-30.5595, 22.9375]
const EMPTY_FORM = { name: '', address: '', latitude: JOHANNESBURG.latitude, longitude: JOHANNESBURG.longitude, radius: 500, status: 'active' }
const MAX_RECOMMENDATIONS = 3
const MIN_REQUESTS_FOR_RECOMMENDATION = 2

export default function Hubs() {
  const { hubs, hubsLoading, hubsError, rides, ridesLoading, ridesError, createHub, updateHub, deleteHub } = useData()
  const { searchQuery: query, setSearchQuery: setQuery } = useOutletContext()
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const pickupLocationCount = useMemo(() => getRidePickupPoints(rides).length, [rides])
  const recommendations = useMemo(() => getPopularPickupRecommendations(rides, hubs), [rides, hubs])

  const filteredHubs = useMemo(() => {
    const searchTerms = query.trim().toLowerCase().split(/\s+/).filter(Boolean)
    if (searchTerms.length === 0) return hubs

    return hubs.filter((hub) => {
      const searchableText = [
        hub.id,
        hub.name,
        hub.address,
        hub.city,
        hub.region,
        hub.description,
        hub.latitude,
        hub.longitude,
      ]
        .filter((value) => value !== null && value !== undefined)
        .map(String)
        .join(' ')
        .toLowerCase()

      return searchTerms.every((term) => searchableText.includes(term))
    })
  }, [hubs, query])
  const activeCount = hubs.filter((hub) => hub.status === 'active').length

  const openCreate = () => { setEditing('new'); setForm({ ...EMPTY_FORM }); setMessage('') }
  const openRecommendation = (recommendation) => {
    setEditing('new')
    setForm({
      ...EMPTY_FORM,
      name: `${recommendation.nearestPickup} Pickup Hub`,
      address: `Near ${recommendation.nearestPickup}`,
      latitude: recommendation.latitude,
      longitude: recommendation.longitude,
    })
    setMessage('')
  }
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
      <section className="rounded-2xl border border-black/5 bg-white p-5 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
        <div className="mb-4 flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-50 text-accent"><Sparkles size={18} /></div>
          <div>
            <h2 className="font-display text-lg font-semibold">Popular pickup hub recommendations</h2>
            <p className="mt-1 text-sm text-slate2">K-means groups valid origin coordinates from all rows in the Supabase rides table. Suggestions need at least {MIN_REQUESTS_FOR_RECOMMENDATION} requests and omit areas already covered by active hubs.</p>
          </div>
        </div>
        {ridesError
          ? <p role="alert" className="rounded-xl border border-bad/20 bg-bad-bg px-4 py-5 text-center text-sm text-bad">Could not load ride pickup history from Supabase. Check access to the rides table and try again.</p>
          : ridesLoading
            ? <p className="rounded-xl border border-dashed border-black/10 bg-slate-50 px-4 py-5 text-center text-sm text-slate2">Loading historical ride pickup locations...</p>
            : recommendations.length === 0
          ? <p className="rounded-xl border border-dashed border-black/10 bg-slate-50 px-4 py-5 text-center text-sm text-slate2">{rides.length === 0 ? 'Supabase returned no rides visible to this admin. Check SELECT access and RLS policies on public.rides.' : pickupLocationCount < MIN_REQUESTS_FOR_RECOMMENDATION ? `Loaded ${rides.length} rides, but only ${pickupLocationCount} have valid origin coordinates. Check origin_latitude and origin_longitude in public.rides.` : 'No uncovered popular pickup areas found. The available origin coordinates may already be covered by active hubs.'}</p>
          : <div className="grid gap-3 lg:grid-cols-3">{recommendations.map((recommendation, index) => (
            <div key={`${recommendation.latitude}-${recommendation.longitude}`} className="rounded-xl border border-black/5 bg-slate-50 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-ink">Near {recommendation.nearestPickup}</p>
                  <p className="mt-1 text-sm text-slate2">{recommendation.requestCount} historical pickup requests</p>
                  {recommendation.coveredBy
                    ? <p className="mt-2 text-xs font-medium text-good">Already covered by {recommendation.coveredBy}</p>
                    : <p className="mt-2 text-xs font-medium text-amber-700">No active hub coverage</p>}
                </div>
                <span className="rounded-full bg-accent-50 px-2.5 py-1 text-[11px] font-semibold text-accent">#{index + 1}</span>
              </div>
              <p className="mt-3 font-mono text-xs text-slate2">{recommendation.latitude.toFixed(6)}, {recommendation.longitude.toFixed(6)}</p>
              <Button variant="accent" className="mt-4 w-full" onClick={() => openRecommendation(recommendation)}><Plus size={14} /> Add this recommendation</Button>
            </div>
          ))}</div>}
      </section>
      {hubsError && <div className="flex items-center gap-2 rounded-xl border border-bad/20 bg-bad-bg px-4 py-3 text-sm text-bad"><AlertCircle size={16} /> Could not load hubs from Supabase. Check the table permissions and try again.</div>}
      {message && <div className="rounded-xl border border-amber/30 bg-amber-bg px-4 py-3 text-sm text-amber-700">{message}</div>}
      <div className="rounded-2xl border border-black/5 bg-white shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/5 px-5 py-4">
          <div><h2 className="font-display text-lg font-semibold">All hubs</h2><p className="text-sm text-slate2">{filteredHubs.length} of {hubs.length} locations</p></div>
          <div className="relative w-full sm:w-72"><Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate2" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search name, address, city..." aria-label="Search hubs" className="w-full rounded-xl border border-black/10 bg-slate-50 py-2.5 pl-9 pr-16 text-sm outline-none focus:border-accent/40 focus:ring-4 focus:ring-accent/10" />{query && <button type="button" onClick={() => setQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1 text-xs font-medium text-slate2 hover:bg-black/5 hover:text-ink">Clear</button>}</div>
        </div>
        {hubsLoading ? <div className="p-10 text-center text-sm text-slate2">Loading hubs...</div> : filteredHubs.length === 0 ? <div className="p-5"><EmptyState title={query ? 'No hubs match your search' : 'No hubs created yet'} hint={query ? 'Try a different name or address.' : 'Create the first hub to start managing service coverage.'} /></div> : <div className="divide-y divide-black/5">{filteredHubs.map((hub) => <HubRow key={hub.id} hub={hub} onEdit={openEdit} onToggle={toggleHub} onDelete={removeHub} />)}</div>}
      </div>
      <Modal open={editing !== null} onClose={closeModal} title={editing === 'new' ? 'Create hub' : 'Edit hub'} wide>
        <form onSubmit={saveHub} className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2"><Field label="Hub name" value={form.name} required onChange={(value) => setForm({ ...form, name: value })} /><AddressAutocomplete value={form.address} onChange={(value) => setForm({ ...form, address: value })} onSelect={(place) => setForm({ ...form, address: place.address, latitude: place.latitude, longitude: place.longitude })} /></div>
          <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]"><MapPicker form={form} setForm={setForm} /><div className="space-y-4"><div className="grid grid-cols-2 gap-3"><Field label="Latitude" type="number" step="0.00000001" value={form.latitude} required onChange={(value) => setForm({ ...form, latitude: value })} /><Field label="Longitude" type="number" step="0.00000001" value={form.longitude} required onChange={(value) => setForm({ ...form, longitude: value })} /></div><Field label="Radius (metres)" type="number" min="1" value={form.radius} required onChange={(value) => setForm({ ...form, radius: value })} /><label className="flex items-center justify-between rounded-xl border border-black/10 px-3.5 py-3 text-sm"><span><span className="block font-semibold">Hub enabled</span><span className="text-xs text-slate2">Allow trips to use this location</span></span><input type="checkbox" checked={form.status === 'active'} onChange={(event) => setForm({ ...form, status: event.target.checked ? 'active' : 'inactive' })} className="h-4 w-4 accent-accent" /></label></div></div>
          {message && <p className="text-sm text-bad">{message}</p>}<div className="flex justify-end gap-2 border-t border-black/5 pt-4"><Button type="button" variant="ghost" onClick={closeModal}>Cancel</Button><Button type="submit" variant="accent" disabled={saving || !form.name.trim() || !form.address.trim()}>{saving ? 'Saving...' : <><Check size={15} /> Save hub</>}</Button></div>
        </form>
      </Modal>
    </div>
  )
}

function Summary({ label, value, icon: Icon, tone = 'text-accent' }) { return <div className="rounded-2xl border border-black/5 bg-white p-4 shadow-sm"><div className="flex items-center justify-between"><span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate2">{label}</span><Icon size={17} className={tone} /></div><div className="mt-2 font-display text-2xl font-semibold">{value}</div></div> }
function Field({ label, value, onChange, ...props }) { return <label className="block text-xs font-semibold uppercase tracking-[0.14em] text-slate2">{label}<input {...props} value={value} onChange={(event) => onChange(event.target.value)} className="mt-1.5 w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm font-normal normal-case tracking-normal text-ink outline-none focus:border-accent/40 focus:ring-4 focus:ring-accent/10" /></label> }
function AddressAutocomplete({ value, onChange, onSelect }) {
  const [suggestions, setSuggestions] = useState([])
  const [loading, setLoading] = useState(false)
  const [focused, setFocused] = useState(false)
  const apiKey = import.meta.env.VITE_GEOAPIFY_API_KEY

  useEffect(() => {
    if (value.trim().length < 3) { setSuggestions([]); return undefined }
    const controller = new AbortController()
    const timer = setTimeout(async () => {
      setLoading(true)
      try {
        const endpoint = apiKey
          ? `https://api.geoapify.com/v1/geocode/autocomplete?${new URLSearchParams({ text: value.trim(), filter: 'countrycode:za', limit: '5', apiKey })}`
          : `https://nominatim.openstreetmap.org/search?${new URLSearchParams({ q: value.trim(), format: 'jsonv2', countrycodes: 'za', limit: '5', addressdetails: '1' })}`
        const response = await fetch(endpoint, { signal: controller.signal, headers: apiKey ? undefined : { Accept: 'application/json' } })
        if (!response.ok) throw new Error('Address search failed')
        const result = await response.json()
        setSuggestions(apiKey
          ? (result.features || []).map((feature) => ({
              address: feature.properties.formatted,
              latitude: Number(feature.properties.lat).toFixed(8),
              longitude: Number(feature.properties.lon).toFixed(8),
            }))
          : (result || []).map((place) => ({
              address: place.display_name,
              latitude: Number(place.lat).toFixed(8),
              longitude: Number(place.lon).toFixed(8),
            })))
      } catch (error) {
        if (error.name !== 'AbortError') setSuggestions([])
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }, 350)
    return () => { clearTimeout(timer); controller.abort() }
  }, [apiKey, value])

  const choose = (suggestion) => { onSelect(suggestion); setSuggestions([]); setFocused(false) }
  return <div className="relative"><label className="block text-xs font-semibold uppercase tracking-[0.14em] text-slate2">Address<input value={value} required onChange={(event) => onChange(event.target.value)} onFocus={() => setFocused(true)} onBlur={() => setTimeout(() => setFocused(false), 150)} placeholder="Search an address..." className="mt-1.5 w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm font-normal normal-case tracking-normal text-ink outline-none focus:border-accent/40 focus:ring-4 focus:ring-accent/10" /></label>{focused && (loading || suggestions.length > 0) && <div className="absolute left-0 right-0 top-[4.5rem] z-10 overflow-hidden rounded-xl border border-black/10 bg-white shadow-[0_14px_30px_rgba(15,23,42,0.12)]">{loading && <div className="px-3 py-2 text-xs text-slate2">Searching addresses...</div>}{suggestions.map((suggestion) => <button type="button" key={`${suggestion.latitude}-${suggestion.longitude}`} onMouseDown={() => choose(suggestion)} className="flex w-full items-start gap-2 px-3 py-2.5 text-left text-sm hover:bg-accent-50"><MapPin size={15} className="mt-0.5 shrink-0 text-accent" /><span>{suggestion.address}</span></button>)}</div>}</div>
}
function HubRow({ hub, onEdit, onToggle, onDelete }) { return <div className="flex flex-wrap items-center gap-4 px-5 py-4 transition hover:bg-slate-50"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-50 text-accent"><Building2 size={18} /></div><div className="min-w-[180px] flex-1"><div className="font-semibold">{hub.name}</div><div className="mt-0.5 text-sm text-slate2">{hub.address}</div></div><div className="hidden min-w-[170px] text-sm text-slate2 md:block"><div className="font-mono text-xs text-ink">{Number(hub.latitude).toFixed(6)}, {Number(hub.longitude).toFixed(6)}</div><div className="mt-1">{hub.radius} m radius</div></div><StatusBadge status={hub.status} /><div className="flex items-center gap-1"><button title="Edit hub" onClick={() => onEdit(hub)} className="rounded-lg p-2 text-slate2 hover:bg-accent-50 hover:text-accent"><Pencil size={16} /></button><button title={hub.status === 'active' ? 'Disable hub' : 'Enable hub'} onClick={() => onToggle(hub)} className="rounded-lg p-2 text-slate2 hover:bg-accent-50 hover:text-accent">{hub.status === 'active' ? <X size={16} /> : <Check size={16} />}</button><button title="Delete hub" onClick={() => onDelete(hub)} className="rounded-lg p-2 text-slate2 hover:bg-bad-bg hover:text-bad"><Trash2 size={16} /></button></div></div> }
function MapPicker({ form, setForm }) {
  const latitude = Number(form.latitude) || JOHANNESBURG.latitude
  const longitude = Number(form.longitude) || JOHANNESBURG.longitude
  const position = [latitude, longitude]
  const geoapifyKey = import.meta.env.VITE_GEOAPIFY_API_KEY
  const tileUrl = geoapifyKey ? `https://maps.geoapify.com/v1/tile/osm-bright-smooth/{z}/{x}/{y}.png?apiKey=${geoapifyKey}` : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
  return <div><div className="mb-1.5 flex items-center justify-between"><label className="text-xs font-semibold uppercase tracking-[0.14em] text-slate2">Map location</label><span className="flex items-center gap-1 text-xs text-slate2"><Crosshair size={13} /> Click to place</span></div><div className="h-64 overflow-hidden rounded-xl border border-black/10"><MapContainer center={SOUTH_AFRICA_CENTER} zoom={5} minZoom={4} maxZoom={18} scrollWheelZoom className="h-full w-full"><TileLayer attribution='&copy; OpenStreetMap contributors &copy; Geoapify' url={tileUrl} /><MapClickHandler setForm={setForm} form={form} /><MapCenter position={position} /><Circle center={position} radius={Number(form.radius) || 500} pathOptions={{ color: '#0e5c3f', fillColor: '#6fefb4', fillOpacity: 0.22 }} /><CircleMarker center={position} radius={8} pathOptions={{ color: '#ffffff', weight: 3, fillColor: '#0e5c3f', fillOpacity: 1 }} /></MapContainer></div></div>
}

function MapClickHandler({ form, setForm }) {
  useMapEvents({ click: (event) => setForm({ ...form, latitude: event.latlng.lat.toFixed(8), longitude: event.latlng.lng.toFixed(8) }) })
  return null
}

function MapCenter({ position }) {
  const map = useMap()
  useEffect(() => { map.setView(position) }, [map, position[0], position[1]])
  return null
}

function getRidePickupPoints(rides) {
  return rides
    .map((ride) => {
      if (ride.origin_latitude === null || ride.origin_latitude === undefined || ride.origin_latitude === ''
        || ride.origin_longitude === null || ride.origin_longitude === undefined || ride.origin_longitude === '') return null
      const latitude = Number(ride.origin_latitude)
      const longitude = Number(ride.origin_longitude)
      if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90 || !Number.isFinite(longitude) || longitude < -180 || longitude > 180) return null
      return { latitude, longitude, label: String(ride.origin_address || 'Pickup area') }
    })
    .filter(Boolean)
}

function getPopularPickupRecommendations(rides, hubs) {
  const points = getRidePickupPoints(rides)
  if (points.length < MIN_REQUESTS_FOR_RECOMMENDATION) return []

  const clusterCount = Math.min(
    MAX_RECOMMENDATIONS,
    Math.max(1, Math.round(Math.sqrt(points.length / MIN_REQUESTS_FOR_RECOMMENDATION))),
  )
  const centers = [points[0]]
  while (centers.length < clusterCount) {
    const nextPoint = points.reduce((farthest, point) => {
      const nearestDistance = Math.min(...centers.map((center) => squaredDistance(point, center)))
      return !farthest || nearestDistance > farthest.distance ? { point, distance: nearestDistance } : farthest
    }, null)
    centers.push(nextPoint.point)
  }

  let assignments = []
  for (let iteration = 0; iteration < 50; iteration += 1) {
    assignments = points.map((point) => centers.reduce((closestIndex, center, index) => (
      squaredDistance(point, center) < squaredDistance(point, centers[closestIndex]) ? index : closestIndex
    ), 0))
    const nextCenters = centers.map((center, index) => {
      const clusterPoints = points.filter((_, pointIndex) => assignments[pointIndex] === index)
      if (clusterPoints.length === 0) return center
      return {
        latitude: clusterPoints.reduce((sum, point) => sum + point.latitude, 0) / clusterPoints.length,
        longitude: clusterPoints.reduce((sum, point) => sum + point.longitude, 0) / clusterPoints.length,
      }
    })
    const converged = nextCenters.every((center, index) => squaredDistance(center, centers[index]) < 1e-12)
    centers.splice(0, centers.length, ...nextCenters)
    if (converged) break
  }

  return centers.map((center, index) => {
    const clusterPoints = points.filter((_, pointIndex) => assignments[pointIndex] === index)
    if (clusterPoints.length < MIN_REQUESTS_FOR_RECOMMENDATION) return null
    const nearestPickup = clusterPoints.reduce((nearest, point) => (
      squaredDistance(point, center) < squaredDistance(nearest, center) ? point : nearest
    )).label
    const coveringHub = hubs.find((hub) => hub.status === 'active' && distanceInMetres(
      center.latitude,
      center.longitude,
      Number(hub.latitude),
      Number(hub.longitude),
    ) <= (Number(hub.radius) || 500))
    return { ...center, nearestPickup, requestCount: clusterPoints.length, coveredBy: coveringHub?.name || null }
  })
    .filter(Boolean)
    .sort((first, second) => second.requestCount - first.requestCount)
}

function squaredDistance(first, second) {
  const meanLatitude = ((first.latitude + second.latitude) / 2) * Math.PI / 180
  const latitudeDistance = first.latitude - second.latitude
  const longitudeDistance = (first.longitude - second.longitude) * Math.cos(meanLatitude)
  return latitudeDistance ** 2 + longitudeDistance ** 2
}

function distanceInMetres(firstLatitude, firstLongitude, secondLatitude, secondLongitude) {
  if (![firstLatitude, firstLongitude, secondLatitude, secondLongitude].every(Number.isFinite)) return Infinity
  const toRadians = (degrees) => degrees * Math.PI / 180
  const latitudeDifference = toRadians(secondLatitude - firstLatitude)
  const longitudeDifference = toRadians(secondLongitude - firstLongitude)
  const haversine = Math.sin(latitudeDifference / 2) ** 2
    + Math.cos(toRadians(firstLatitude)) * Math.cos(toRadians(secondLatitude)) * Math.sin(longitudeDifference / 2) ** 2
  return 6371000 * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine))
}
