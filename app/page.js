'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import Link from 'next/link'
import ModuleModal from '../components/ModuleModal'

export default function Home() {
  const [modules, setModules] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editModule, setEditModule] = useState(null)

  useEffect(() => { fetchModules() }, [])

  async function fetchModules() {
    setLoading(true)
    const { data } = await supabase
      .from('modules')
      .select('*, flashcards(count), children:modules!parent_id(count)')
      .is('parent_id', null)
      .order('created_at', { ascending: false })
    setModules(data || [])
    setLoading(false)
  }

  async function deleteModule(e, id) {
    e.preventDefault()
    e.stopPropagation()
    if (!confirm('Delete this module and everything inside it?')) return
    await supabase.from('modules').delete().eq('id', id)
    setModules(m => m.filter(x => x.id !== id))
  }

  function openEdit(e, mod) {
    e.preventDefault()
    e.stopPropagation()
    setEditModule(mod)
    setShowModal(true)
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <nav style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span style={{ fontSize: 22 }}>🃏</span>
            <span style={{ fontWeight: 700, fontSize: 18, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>StudyDeck</span>
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => { setEditModule(null); setShowModal(true) }}>
            + New Module
          </button>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)' }}>My Modules</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 2 }}>{modules.length} module{modules.length !== 1 ? 's' : ''}</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div style={{ color: 'var(--text-secondary)' }}>Loading...</div>
          </div>
        ) : modules.length === 0 ? (
          <div className="text-center py-20 fade-in">
            <div style={{ fontSize: 48, marginBottom: 12 }}>📚</div>
            <p style={{ color: 'var(--text-secondary)', fontSize: 16, marginBottom: 20 }}>No modules yet. Create your first one!</p>
            <button className="btn btn-primary" onClick={() => { setEditModule(null); setShowModal(true) }}>+ Create Module</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {modules.map((mod, i) => (
              <Link href={`/modules/${mod.id}`} key={mod.id} className="no-underline">
                <div className="module-card fade-in" style={{ '--card-color': mod.color, animationDelay: `${i * 0.05}s` }}>
                  <div className="flex items-start justify-between">
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h2 style={{ fontWeight: 600, fontSize: 16, color: 'var(--text-primary)', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{mod.title}</h2>
                      {mod.description && (
                        <p style={{ color: 'var(--text-secondary)', fontSize: 13, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{mod.description}</p>
                      )}
                    </div>
                    <div className="flex gap-2 ml-3 flex-shrink-0">
                      <button className="btn btn-ghost btn-sm" onClick={(e) => openEdit(e, mod)} title="Edit">✏️</button>
                      <button className="btn btn-danger btn-sm" onClick={(e) => deleteModule(e, mod.id)} title="Delete">🗑️</button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-4 flex-wrap">
                    {mod.children?.[0]?.count > 0 && (
                      <span className="badge" style={{ background: 'rgba(99,102,241,0.1)', color: 'var(--accent)' }}>
                        📁 {mod.children[0].count} sub-module{mod.children[0].count !== 1 ? 's' : ''}
                      </span>
                    )}
                    <span className="badge">{mod.flashcards?.[0]?.count || 0} cards</span>
                    <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{new Date(mod.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <ModuleModal
          module={editModule}
          onClose={() => { setShowModal(false); setEditModule(null) }}
          onSave={() => { setShowModal(false); setEditModule(null); fetchModules() }}
        />
      )}
    </div>
  )
}