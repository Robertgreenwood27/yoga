'use client'
import { useState } from 'react'

export default function FlashCard({ card, height = 200 }) {
  const [flipped, setFlipped] = useState(false)

  return (
    <div className="card-scene" style={{height}} onClick={() => setFlipped(f => !f)}>
      <div className={`card-inner ${flipped ? 'flipped' : ''}`} style={{cursor:'pointer'}}>
        {/* Front */}
        <div className="card-face">
          {card.front_image_url && (
            <img src={card.front_image_url} alt="" style={{maxHeight:80, maxWidth:'100%', objectFit:'contain', marginBottom:8, borderRadius:6}} />
          )}
          <p style={{fontSize:15, color:'var(--text-primary)', lineHeight:1.5, fontWeight:500}}>
            {card.front_text || <em style={{color:'var(--text-secondary)', fontStyle:'italic'}}>No front text</em>}
          </p>
          <span style={{position:'absolute', bottom:10, right:14, fontSize:11, color:'var(--text-secondary)'}}>tap to flip</span>
        </div>
        {/* Back */}
        <div className="card-face back">
          {card.back_image_url && (
            <img src={card.back_image_url} alt="" style={{maxHeight:80, maxWidth:'100%', objectFit:'contain', marginBottom:8, borderRadius:6}} />
          )}
          <p style={{fontSize:15, color:'var(--text-primary)', lineHeight:1.5, fontWeight:500}}>
            {card.back_text || <em style={{color:'var(--text-secondary)', fontStyle:'italic'}}>No back text</em>}
          </p>
          <span style={{position:'absolute', bottom:10, right:14, fontSize:11, color:'var(--accent)'}}>back</span>
        </div>
      </div>
    </div>
  )
}
