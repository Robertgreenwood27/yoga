'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabase'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import CardModal from '../../../components/CardModal'
import ModuleModal from '../../../components/ModuleModal'
import FlashCard from '../../../components/FlashCard'

export default function ModulePage() {
  const { id } = useParams()
  const [module, setModule] = useState(null)
  const [breadcrumb, setBreadcrumb] = useState([])
  const [subModules, setSubModules] = useState([])
  const [cards, setCards] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCardModal, setShowCardModal] = useState(false)
  const [showModuleModal, setShowModuleModal] = useState(false)
  const [editCard, setEditCard] = useState(null)
  const [editSubModule, setEditSubModule] = useState(null)
  const [studyMode, setStudyMode] = useState(false)

  useEffect(() => { fetchData() }, [id])

  async function fetchData() {
    setLoading(true)
    const [{ data: mod }, { data: subs }, { data: cds }] = await Promise.all([
      supabase.from('modules').select('*').eq('id', id).single(),
      supabase.from('modules').select('*, flashcards(count)').eq('parent_id', id).order('created_at', { ascending: false }),
      supabase.from('flashcards').select('*').eq('module_id', id).order('position').order('created_at'),
    ])
    setModule(mod)
    setSubModules(subs || [])
    setCards(cds || [])

    // Build breadcrumb by walking up parent chain
    if (mod) {
      const crumbs = []
      let current = mod
      while (current.parent_id) {
        const { data: parent } = await supabase.from('modules').select('id, title, parent_id').eq('id', current.parent_id).single()
        if (!parent) break
        crumbs.unshift(parent)
        current = parent
      }
      setBreadcrumb(crumbs)
    }
    setLoading(false)
  }

  async function deleteCard(cardId) {
    if (!confirm('Delete this card?')) return
    await supabase.from('flashcards').delete().eq('id', cardId)
    setCards(c => c.filter(x => x.id !== cardId))
  }

  async function deleteSubModule(e, subId) {
    e.preventDefault()
    e.stopPropagation()
    if (!confirm('Delete this sub-module and everything inside it?')) return
    await supabase.from('modules').delete().eq('id', subId)
    setSubModules(s => s.filter(x => x.id !== subId))
  }

  function openEditSub(e, sub) {
    e.preventDefault()
    e.stopPropagation()
    setEditSubModule(sub)
    setShowModuleModal(true)
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
      <span style={{ color: 'var(--text-secondary)' }}>Loading...</span>
    </div>
  )

  if (!module) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ background: 'var(--bg-primary)' }}>
      <p style={{ color: 'var(--text-secondary)' }}>Module not found</p>
      <Link href="/" className="btn btn-primary">← Home</Link>
    </div>
  )

  if (studyMode) return (
    <StudyView cards={cards} module={module} onExit={() => setStudyMode(false)} />
  )

  const backHref = module.parent_id ? `/modules/${module.parent_id}` : '/'

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      {/* Navbar */}
      <nav style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-2 flex-wrap">
          {/* Breadcrumb */}
          <Link href="/" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: 13 }}>🏠 Home</Link>
          {breadcrumb.map(crumb => (
            <span key={crumb.id} className="flex items-center gap-2">
              <span style={{ color: 'var(--border)' }}>›</span>
              <Link href={`/modules/${crumb.id}`} style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: 13 }}>{crumb.title}</Link>
            </span>
          ))}
          <span style={{ color: 'var(--border)' }}>›</span>
          <span style={{ color: 'var(--text-primary)', fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 180 }}>{module.title}</span>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Module header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-start gap-4 justify-between">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <div style={{ width: 4, height: 24, background: module.color, borderRadius: 2, flexShrink: 0 }}></div>
              <h1 style={{ fontWeight: 700, fontSize: 22, color: 'var(--text-primary)' }}>{module.title}</h1>
            </div>
            {module.description && <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginLeft: 14 }}>{module.description}</p>}
          </div>
          <div className="flex gap-2 flex-wrap flex-shrink-0">
            {cards.length > 0 && (
              <button className="btn btn-ghost" onClick={() => setStudyMode(true)}>🎯 Study</button>
            )}
            <button className="btn btn-ghost" onClick={() => { setEditSubModule(null); setShowModuleModal(true) }}>
              📁 Add Sub-Module
            </button>
            <button className="btn btn-primary" onClick={() => { setEditCard(null); setShowCardModal(true) }}>
              + Add Card
            </button>
          </div>
        </div>

        {/* Sub-modules section */}
        {subModules.length > 0 && (
          <div className="mb-8">
            <h2 style={{ fontWeight: 600, fontSize: 15, color: 'var(--text-secondary)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: 12 }}>
              Sub-Modules ({subModules.length})
            </h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {subModules.map((sub, i) => (
                <Link href={`/modules/${sub.id}`} key={sub.id} className="no-underline">
                  <div className="module-card fade-in" style={{ '--card-color': sub.color, animationDelay: `${i * 0.04}s`, padding: 16 }}>
                    <div className="flex items-start justify-between">
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h3 style={{ fontWeight: 600, fontSize: 15, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sub.title}</h3>
                        {sub.description && (
                          <p style={{ color: 'var(--text-secondary)', fontSize: 12, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sub.description}</p>
                        )}
                      </div>
                      <div className="flex gap-2 ml-2 flex-shrink-0">
                        <button className="btn btn-ghost btn-sm" onClick={(e) => openEditSub(e, sub)} title="Edit">✏️</button>
                        <button className="btn btn-danger btn-sm" onClick={(e) => deleteSubModule(e, sub.id)} title="Delete">🗑️</button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-3">
                      <span className="badge">{sub.flashcards?.[0]?.count || 0} cards</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Cards section */}
        <div>
          {(cards.length > 0 || subModules.length > 0) && (
            <h2 style={{ fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: 12 }}>
              Flashcards ({cards.length})
            </h2>
          )}

          {cards.length === 0 && subModules.length === 0 ? (
            <div className="text-center py-20 fade-in">
              <div style={{ fontSize: 48, marginBottom: 12 }}>🃏</div>
              <p style={{ color: 'var(--text-secondary)', fontSize: 16, marginBottom: 20 }}>This module is empty. Add sub-modules or flashcards to get started.</p>
              <div className="flex gap-3 justify-center flex-wrap">
                <button className="btn btn-ghost" onClick={() => { setEditSubModule(null); setShowModuleModal(true) }}>📁 Add Sub-Module</button>
                <button className="btn btn-primary" onClick={() => { setEditCard(null); setShowCardModal(true) }}>+ Add Card</button>
              </div>
            </div>
          ) : cards.length === 0 ? (
            <div className="text-center py-10" style={{ border: '1px dashed var(--border)', borderRadius: 14 }}>
              <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 12 }}>No cards in this module yet.</p>
              <button className="btn btn-primary btn-sm" onClick={() => { setEditCard(null); setShowCardModal(true) }}>+ Add Card</button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {cards.map((card, i) => (
                <div key={card.id} className="fade-in" style={{ animationDelay: `${i * 0.04}s` }}>
                  <FlashCard card={card} />
                  <div className="flex gap-2 mt-2 justify-end">
                    <button className="btn btn-ghost btn-sm" onClick={() => { setEditCard(card); setShowCardModal(true) }}>✏️ Edit</button>
                    <button className="btn btn-danger btn-sm" onClick={() => deleteCard(card.id)}>🗑️</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showCardModal && (
        <CardModal
          card={editCard}
          moduleId={id}
          onClose={() => { setShowCardModal(false); setEditCard(null) }}
          onSave={() => { setShowCardModal(false); setEditCard(null); fetchData() }}
        />
      )}

      {showModuleModal && (
        <ModuleModal
          module={editSubModule}
          parentId={editSubModule ? undefined : id}
          onClose={() => { setShowModuleModal(false); setEditSubModule(null) }}
          onSave={() => { setShowModuleModal(false); setEditSubModule(null); fetchData() }}
        />
      )}
    </div>
  )
}

function StudyView({ cards, module, onExit }) {
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [shuffled, setShuffled] = useState(cards)

  function shuffle() {
    setShuffled([...cards].sort(() => Math.random() - 0.5))
    setIndex(0)
    setFlipped(false)
  }

  function next() {
    setFlipped(false)
    setTimeout(() => setIndex(i => Math.min(i + 1, shuffled.length - 1)), 150)
  }

  function prev() {
    setFlipped(false)
    setTimeout(() => setIndex(i => Math.max(i - 1, 0)), 150)
  }

  const card = shuffled[index]

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg-primary)' }}>
      <nav style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <button className="btn btn-ghost btn-sm" onClick={onExit}>← Exit</button>
          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{module.title}</span>
          <button className="btn btn-ghost btn-sm" onClick={shuffle}>🔀 Shuffle</button>
        </div>
      </nav>

      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        <div style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 16 }}>
          {index + 1} / {shuffled.length}
        </div>
        <div style={{ width: '100%', maxWidth: 600, height: 4, background: 'var(--border)', borderRadius: 2, marginBottom: 32, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${((index + 1) / shuffled.length) * 100}%`, background: module.color, borderRadius: 2, transition: 'width 0.3s' }}></div>
        </div>

        <div className="card-scene" style={{ width: '100%', maxWidth: 600, height: 320, marginBottom: 32 }}>
          <div className={`card-inner ${flipped ? 'flipped' : ''}`} onClick={() => setFlipped(f => !f)} style={{ cursor: 'pointer' }}>
            <div className="card-face" style={{ padding: 32 }}>
              {card.front_image_url && <img src={card.front_image_url} alt="" style={{ maxHeight: 120, maxWidth: '100%', objectFit: 'contain', marginBottom: 12, borderRadius: 8 }} />}
              <p style={{ fontSize: 18, fontWeight: 500, color: 'var(--text-primary)', lineHeight: 1.5 }}>{card.front_text || <em style={{ color: 'var(--text-secondary)' }}>No text</em>}</p>
              <p style={{ position: 'absolute', bottom: 16, color: 'var(--text-secondary)', fontSize: 12 }}>Tap to flip</p>
            </div>
            <div className="card-face back" style={{ padding: 32 }}>
              {card.back_image_url && <img src={card.back_image_url} alt="" style={{ maxHeight: 120, maxWidth: '100%', objectFit: 'contain', marginBottom: 12, borderRadius: 8 }} />}
              <p style={{ fontSize: 18, fontWeight: 500, color: 'var(--text-primary)', lineHeight: 1.5 }}>{card.back_text || <em style={{ color: 'var(--text-secondary)' }}>No text</em>}</p>
              <p style={{ position: 'absolute', bottom: 16, color: 'var(--accent)', fontSize: 12 }}>Back</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button className="btn btn-ghost" onClick={prev} disabled={index === 0} style={{ opacity: index === 0 ? 0.4 : 1 }}>← Prev</button>
          <button className="btn btn-primary" onClick={() => setFlipped(f => !f)}>Flip</button>
          <button className="btn btn-ghost" onClick={next} disabled={index === shuffled.length - 1} style={{ opacity: index === shuffled.length - 1 ? 0.4 : 1 }}>Next →</button>
        </div>
      </div>
    </div>
  )
}