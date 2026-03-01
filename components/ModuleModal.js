'use client'
import { useState } from 'react'
import { supabase } from '../lib/supabase'

const COLORS = ['#6366f1','#ec4899','#f59e0b','#10b981','#3b82f6','#8b5cf6','#ef4444','#06b6d4']

export default function ModuleModal({ module, onClose, onSave }) {
  const [title, setTitle] = useState(module?.title || '')
  const [description, setDescription] = useState(module?.description || '')
  const [color, setColor] = useState(module?.color || COLORS[0])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSave() {
    if (!title.trim()) { setError('Title is required'); return }
    setSaving(true)
    setError('')
    const payload = { title: title.trim(), description: description.trim(), color }
    if (module) {
      await supabase.from('modules').update(payload).eq('id', module.id)
    } else {
      await supabase.from('modules').insert(payload)
    }
    setSaving(false)
    onSave()
  }

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div className="flex items-center justify-between mb-5">
          <h2 style={{fontWeight:700, fontSize:18, color:'var(--text-primary)'}}>{module ? 'Edit Module' : 'New Module'}</h2>
          <button onClick={onClose} style={{background:'none', border:'none', color:'var(--text-secondary)', fontSize:20, cursor:'pointer', lineHeight:1}}>×</button>
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <label className="label">Title *</label>
            <input className="input" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Trading Setups, Chart Patterns..." autoFocus />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="input" value={description} onChange={e => setDescription(e.target.value)} placeholder="Optional description..." rows={2} />
          </div>
          <div>
            <label className="label">Color</label>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map(c => (
                <button key={c} onClick={() => setColor(c)} style={{
                  width:32, height:32, borderRadius:8, background:c, border: color===c ? '3px solid white' : '3px solid transparent',
                  cursor:'pointer', transition:'transform 0.1s', transform: color===c ? 'scale(1.15)' : 'scale(1)'
                }} />
              ))}
            </div>
          </div>
          {error && <p style={{color:'var(--danger)', fontSize:13}}>{error}</p>}
          <div className="flex gap-3 justify-end mt-2">
            <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : (module ? 'Save Changes' : 'Create Module')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
