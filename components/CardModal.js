'use client'
import { useState, useRef, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export default function CardModal({ card, moduleId, onClose, onSave }) {
  const [frontText, setFrontText] = useState(card?.front_text || '')
  const [backText, setBackText] = useState(card?.back_text || '')
  const [frontImage, setFrontImage] = useState(card?.front_image_url || '')
  const [backImage, setBackImage] = useState(card?.back_image_url || '')
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState({ front: false, back: false })
  const [dragOver, setDragOver] = useState({ front: false, back: false })

  async function uploadImage(file, side) {
    setUploading(u => ({ ...u, [side]: true }))
    const ext = file.name.split('.').pop()
    const path = `${moduleId}/${Date.now()}.${ext}`
    const { data, error } = await supabase.storage.from('card-images').upload(path, file)
    if (!error) {
      const { data: { publicUrl } } = supabase.storage.from('card-images').getPublicUrl(path)
      if (side === 'front') setFrontImage(publicUrl)
      else setBackImage(publicUrl)
    }
    setUploading(u => ({ ...u, [side]: false }))
  }

  function handleDrop(e, side) {
    e.preventDefault()
    setDragOver(d => ({ ...d, [side]: false }))
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('image/')) uploadImage(file, side)
  }

  function handlePaste(e, side) {
    const items = Array.from(e.clipboardData.items)
    const imageItem = items.find(i => i.type.startsWith('image/'))
    if (imageItem) {
      e.preventDefault()
      const file = imageItem.getAsFile()
      uploadImage(file, side)
    }
  }

  function handleFileInput(e, side) {
    const file = e.target.files[0]
    if (file) uploadImage(file, side)
  }

  async function removeImage(side) {
    if (side === 'front') setFrontImage('')
    else setBackImage('')
  }

  async function handleSave() {
    setSaving(true)
    const payload = {
      module_id: moduleId,
      front_text: frontText.trim(),
      back_text: backText.trim(),
      front_image_url: frontImage || null,
      back_image_url: backImage || null,
    }
    if (card) {
      await supabase.from('flashcards').update(payload).eq('id', card.id)
    } else {
      await supabase.from('flashcards').insert(payload)
    }
    setSaving(false)
    onSave()
  }

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box" style={{maxWidth:600}}>
        <div className="flex items-center justify-between mb-5">
          <h2 style={{fontWeight:700, fontSize:18, color:'var(--text-primary)'}}>{card ? 'Edit Card' : 'New Card'}</h2>
          <button onClick={onClose} style={{background:'none', border:'none', color:'var(--text-secondary)', fontSize:20, cursor:'pointer'}}>×</button>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <CardSide
            label="Front"
            text={frontText}
            onTextChange={setFrontText}
            image={frontImage}
            onRemoveImage={() => removeImage('front')}
            uploading={uploading.front}
            dragOver={dragOver.front}
            onDragOver={e => { e.preventDefault(); setDragOver(d => ({...d, front:true})) }}
            onDragLeave={() => setDragOver(d => ({...d, front:false}))}
            onDrop={e => handleDrop(e, 'front')}
            onPaste={e => handlePaste(e, 'front')}
            onFileInput={e => handleFileInput(e, 'front')}
          />
          <CardSide
            label="Back"
            text={backText}
            onTextChange={setBackText}
            image={backImage}
            onRemoveImage={() => removeImage('back')}
            uploading={uploading.back}
            dragOver={dragOver.back}
            onDragOver={e => { e.preventDefault(); setDragOver(d => ({...d, back:true})) }}
            onDragLeave={() => setDragOver(d => ({...d, back:false}))}
            onDrop={e => handleDrop(e, 'back')}
            onPaste={e => handlePaste(e, 'back')}
            onFileInput={e => handleFileInput(e, 'back')}
          />
        </div>

        <div className="flex gap-3 justify-end mt-5">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving || uploading.front || uploading.back}>
            {saving ? 'Saving...' : (card ? 'Save Changes' : 'Add Card')}
          </button>
        </div>
      </div>
    </div>
  )
}

function CardSide({ label, text, onTextChange, image, onRemoveImage, uploading, dragOver, onDragOver, onDragLeave, onDrop, onPaste, onFileInput }) {
  const fileRef = useRef()

  return (
    <div style={{display:'flex', flexDirection:'column', gap:10}}>
      <label className="label">{label}</label>
      <textarea
        className="input"
        placeholder={`${label} text...`}
        value={text}
        onChange={e => onTextChange(e.target.value)}
        onPaste={onPaste}
        rows={3}
      />

      {/* Image drop zone */}
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => !image && fileRef.current?.click()}
        style={{
          border: `2px dashed ${dragOver ? 'var(--accent)' : 'var(--border)'}`,
          borderRadius:10,
          padding:12,
          background: dragOver ? 'var(--accent-soft)' : 'var(--bg-card)',
          cursor: image ? 'default' : 'pointer',
          transition:'all 0.15s',
          minHeight:90,
          display:'flex',
          flexDirection:'column',
          alignItems:'center',
          justifyContent:'center',
          gap:8,
          position:'relative'
        }}
      >
        {uploading ? (
          <p style={{color:'var(--text-secondary)', fontSize:13}}>Uploading...</p>
        ) : image ? (
          <>
            <img src={image} alt="" style={{maxHeight:120, maxWidth:'100%', objectFit:'contain', borderRadius:6}} />
            <button
              onClick={e => { e.stopPropagation(); onRemoveImage() }}
              className="btn btn-danger btn-sm"
              style={{marginTop:4}}
            >🗑️ Remove</button>
          </>
        ) : (
          <>
            <span style={{fontSize:24}}>📷</span>
            <p style={{color:'var(--text-secondary)', fontSize:12, textAlign:'center'}}>
              Drop, paste, or click to upload image
            </p>
          </>
        )}
      </div>
      <input ref={fileRef} type="file" accept="image/*" style={{display:'none'}} onChange={onFileInput} />
    </div>
  )
}
