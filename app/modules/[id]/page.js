'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabase'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import CardModal from '../../../components/CardModal'
import FlashCard from '../../../components/FlashCard'

export default function ModulePage() {
  const { id } = useParams()
  const [module, setModule] = useState(null)
  const [cards, setCards] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editCard, setEditCard] = useState(null)
  const [studyMode, setStudyMode] = useState(false)
  const [studyIndex, setStudyIndex] = useState(0)

  useEffect(() => { fetchData() }, [id])

  async function fetchData() {
    setLoading(true)
    const [{ data: mod }, { data: cds }] = await Promise.all([
      supabase.from('modules').select('*').eq('id', id).single(),
      supabase.from('flashcards').select('*').eq('module_id', id).order('position').order('created_at')
    ])
    setModule(mod)
    setCards(cds || [])
    setLoading(false)
  }

  async function deleteCard(cardId) {
    if (!confirm('Delete this card?')) return
    await supabase.from('flashcards').delete().eq('id', cardId)
    setCards(c => c.filter(x => x.id !== cardId))
  }

  function openEdit(card) {
    setEditCard(card)
    setShowModal(true)
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{background:'var(--bg-primary)'}}>
      <span style={{color:'var(--text-secondary)'}}>Loading...</span>
    </div>
  )

  if (!module) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{background:'var(--bg-primary)'}}>
      <p style={{color:'var(--text-secondary)'}}>Module not found</p>
      <Link href="/" className="btn btn-primary">← Back</Link>
    </div>
  )

  if (studyMode) return (
    <StudyView
      cards={cards}
      module={module}
      onExit={() => setStudyMode(false)}
    />
  )

  return (
    <div className="min-h-screen" style={{background:'var(--bg-primary)'}}>
      {/* Navbar */}
      <nav style={{background:'var(--bg-secondary)', borderBottom:'1px solid var(--border)'}}>
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/" style={{color:'var(--text-secondary)', textDecoration:'none', display:'flex', alignItems:'center', gap:4, fontSize:14}}>
            ← Back
          </Link>
          <span style={{color:'var(--border)'}}>|</span>
          <span style={{fontWeight:600, fontSize:15, color:'var(--text-primary)', flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{module.title}</span>
          <span className="badge">{cards.length} cards</span>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Module header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
          <div>
            <div style={{width:4, height:24, background:module.color, borderRadius:2, display:'inline-block', marginRight:10, verticalAlign:'middle'}}></div>
            <span style={{fontWeight:700, fontSize:22, color:'var(--text-primary)'}}>{module.title}</span>
            {module.description && <p style={{color:'var(--text-secondary)', fontSize:14, marginTop:4}}>{module.description}</p>}
          </div>
          <div className="flex gap-2 flex-wrap">
            {cards.length > 0 && (
              <button className="btn btn-ghost" onClick={() => setStudyMode(true)}>
                🎯 Study
              </button>
            )}
            <button className="btn btn-primary" onClick={() => { setEditCard(null); setShowModal(true) }}>
              + Add Card
            </button>
          </div>
        </div>

        {cards.length === 0 ? (
          <div className="text-center py-20 fade-in">
            <div style={{fontSize:48, marginBottom:12}}>🃏</div>
            <p style={{color:'var(--text-secondary)', fontSize:16, marginBottom:20}}>No flashcards yet. Add your first card!</p>
            <button className="btn btn-primary" onClick={() => { setEditCard(null); setShowModal(true) }}>
              + Add Card
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {cards.map((card, i) => (
              <div key={card.id} className="fade-in" style={{animationDelay:`${i*0.04}s`}}>
                <FlashCard card={card} />
                <div className="flex gap-2 mt-2 justify-end">
                  <button className="btn btn-ghost btn-sm" onClick={() => openEdit(card)}>✏️ Edit</button>
                  <button className="btn btn-danger btn-sm" onClick={() => deleteCard(card.id)}>🗑️</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <CardModal
          card={editCard}
          moduleId={id}
          onClose={() => { setShowModal(false); setEditCard(null) }}
          onSave={() => { setShowModal(false); setEditCard(null); fetchData() }}
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
    <div className="min-h-screen flex flex-col" style={{background:'var(--bg-primary)'}}>
      <nav style={{background:'var(--bg-secondary)', borderBottom:'1px solid var(--border)'}}>
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <button className="btn btn-ghost btn-sm" onClick={onExit}>← Exit</button>
          <span style={{fontWeight:600, color:'var(--text-primary)'}}>{module.title}</span>
          <button className="btn btn-ghost btn-sm" onClick={shuffle}>🔀 Shuffle</button>
        </div>
      </nav>

      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        <div style={{color:'var(--text-secondary)', fontSize:14, marginBottom:16}}>
          {index + 1} / {shuffled.length}
        </div>

        {/* Progress bar */}
        <div style={{width:'100%', maxWidth:600, height:4, background:'var(--border)', borderRadius:2, marginBottom:32, overflow:'hidden'}}>
          <div style={{height:'100%', width:`${((index+1)/shuffled.length)*100}%`, background:module.color, borderRadius:2, transition:'width 0.3s'}}></div>
        </div>

        {/* Big card */}
        <div className="card-scene" style={{width:'100%', maxWidth:600, height:320, marginBottom:32}}>
          <div className={`card-inner ${flipped ? 'flipped' : ''}`} onClick={() => setFlipped(f => !f)} style={{cursor:'pointer'}}>
            <div className="card-face" style={{padding:32}}>
              {card.front_image_url && <img src={card.front_image_url} alt="" style={{maxHeight:120, maxWidth:'100%', objectFit:'contain', marginBottom:12, borderRadius:8}} />}
              <p style={{fontSize:18, fontWeight:500, color:'var(--text-primary)', lineHeight:1.5}}>{card.front_text || <em style={{color:'var(--text-secondary)'}}>No text</em>}</p>
              <p style={{position:'absolute', bottom:16, color:'var(--text-secondary)', fontSize:12}}>Tap to flip</p>
            </div>
            <div className="card-face back" style={{padding:32}}>
              {card.back_image_url && <img src={card.back_image_url} alt="" style={{maxHeight:120, maxWidth:'100%', objectFit:'contain', marginBottom:12, borderRadius:8}} />}
              <p style={{fontSize:18, fontWeight:500, color:'var(--text-primary)', lineHeight:1.5}}>{card.back_text || <em style={{color:'var(--text-secondary)'}}>No text</em>}</p>
              <p style={{position:'absolute', bottom:16, color:'var(--accent)', fontSize:12}}>Back</p>
            </div>
          </div>
        </div>

        {/* Nav buttons */}
        <div className="flex items-center gap-4">
          <button className="btn btn-ghost" onClick={prev} disabled={index === 0} style={{opacity: index===0 ? 0.4 : 1}}>← Prev</button>
          <button className="btn btn-primary" onClick={() => setFlipped(f => !f)}>Flip</button>
          <button className="btn btn-ghost" onClick={next} disabled={index === shuffled.length-1} style={{opacity: index===shuffled.length-1 ? 0.4 : 1}}>Next →</button>
        </div>
      </div>
    </div>
  )
}
