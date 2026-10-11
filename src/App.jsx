import React, { useEffect, useMemo, useState } from 'react'
import {
  Activity, ArrowUpRight, Bookmark, Check, Compass, ExternalLink, Globe2,
  Instagram, Link2, Menu, Newspaper, Search, SlidersHorizontal, Sparkles,
  Video, X as XIcon, RefreshCw, Clock3, AlertCircle, LoaderCircle
} from 'lucide-react'

const platforms = [
  { id: 'facebook', name: 'Facebook', color: '#78a8ff', subtitle: 'Watch & discover' },
  { id: 'instagram', name: 'Instagram', color: '#ff91bd', subtitle: 'Reels & creators' },
  { id: 'reddit', name: 'Reddit', color: '#ff986e', subtitle: 'Community clips' },
  { id: 'x', name: 'X', color: '#f0f1f6', subtitle: 'Videos & conversations' }
]
const categories = ['Top stories', 'World', 'Technology', 'Business', 'Science', 'Politics', 'Culture', 'Sports']
const categoryQueries = {
  'Top stories': 'top news', World: 'world news', Technology: 'technology news',
  Business: 'business news', Science: 'science news', Politics: 'politics news',
  Culture: 'culture news', Sports: 'sports news'
}
const socialUrl = (id, query) => {
  const q = encodeURIComponent((query || 'trending news video').trim())
  if (id === 'facebook') return `https://www.facebook.com/search/videos/?q=${q}`
  if (id === 'instagram') return `https://www.google.com/search?q=site%3Ainstagram.com%2Freel%2F+${q}`
  if (id === 'reddit') return `https://www.reddit.com/search/?q=${q}&type=link`
  return `https://x.com/search?q=${q}%20filter%3Avideos&src=typed_query`
}
const timeAgo = date => {
  const ms = Date.now() - new Date(date).getTime()
  if (!Number.isFinite(ms)) return 'Recently'
  const minutes = Math.max(0, Math.floor(ms / 60000))
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}
function App() {
  const [query, setQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('Top stories')
  const [country, setCountry] = useState('IN')
  const [language, setLanguage] = useState('en')
  const [days, setDays] = useState('0')
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [lastUpdated, setLastUpdated] = useState('')
  const [saved, setSaved] = useState(() => {
    try { return JSON.parse(localStorage.getItem('newspulse-saved') || '[]') } catch { return [] }
  })
  const [showSaved, setShowSaved] = useState(false)
  const [savedTab, setSavedTab] = useState('articles')
  const [sourceFilter, setSourceFilter] = useState('all')
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchedFor, setSearchedFor] = useState('')
  const [previewArticle, setPreviewArticle] = useState(null)
  const [savedSocial, setSavedSocial] = useState(() => {
    try { return JSON.parse(localStorage.getItem('newspulse-social-saved') || '[]') } catch { return [] }
  })
  const [notes, setNotes] = useState(() => {
    try { return JSON.parse(localStorage.getItem('newspulse-notes') || '[]') } catch { return [] }
  })
  const [collections, setCollections] = useState(() => {
    try { return JSON.parse(localStorage.getItem('newspulse-collections') || '[]') } catch { return [] }
  })
  const [activeCollection, setActiveCollection] = useState('')
  const [noteDraft, setNoteDraft] = useState('')
  const [noteTitle, setNoteTitle] = useState('')
  const [editingNoteId, setEditingNoteId] = useState('')
  const [collectionDraft, setCollectionDraft] = useState('')
  const [researchSearch, setResearchSearch] = useState('')
  const [researchBackupMessage, setResearchBackupMessage] = useState('')
  const [showResearch, setShowResearch] = useState(false)
  const [researchTab, setResearchTab] = useState('notes')
  const [timelineFilter, setTimelineFilter] = useState('all')
  const [exportMessage, setExportMessage] = useState('')
  const searchTerm = query.trim() || categoryQueries[activeCategory]
  const uniqueArticles = useMemo(() => {
    const seen = new Set()
    return articles.filter(a => {
      const key = a.title.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
      if (seen.has(key)) return false
      seen.add(key); return true
    })
  }, [articles])
  const sourceNames = useMemo(() => [...new Set(uniqueArticles.map(a => a.source).filter(Boolean))].sort((a,b) => a.localeCompare(b)), [uniqueArticles])
  const filteredArticles = useMemo(() => sourceFilter === 'all' ? uniqueArticles : uniqueArticles.filter(a => a.source === sourceFilter), [uniqueArticles, sourceFilter])

  const loadNews = async (term = searchTerm) => {
    if (!window.newsPulse?.searchNews) {
      setError('Live news fetching is available in the Electron desktop app. Launch with npm run dev.')
      return
    }
    setLoading(true); setError('')
    try {
      const result = await window.newsPulse.searchNews({ query: term, country, language, days: Number(days) })
      if (!result.ok) throw new Error(result.error || 'Could not load headlines.')
      setArticles(result.items || [])
      setLastUpdated(result.fetchedAt || new Date().toISOString())
      setSearchedFor(term)
    } catch (e) { setError(e.message || 'Could not load headlines.') }
    finally { setLoading(false) }
  }
  useEffect(() => { loadNews(categoryQueries['Top stories']) }, [])
  useEffect(() => {
    try { localStorage.setItem('newspulse-saved', JSON.stringify(saved)) } catch {}
  }, [saved])
  useEffect(() => {
    try { localStorage.setItem('newspulse-social-saved', JSON.stringify(savedSocial)) } catch {}
  }, [savedSocial])
  useEffect(() => {
    try { localStorage.setItem('newspulse-notes', JSON.stringify(notes)) } catch {}
  }, [notes])
  useEffect(() => {
    try { localStorage.setItem('newspulse-collections', JSON.stringify(collections)) } catch {}
  }, [collections])
  const submitSearch = e => { e?.preventDefault(); loadNews(query.trim() || categoryQueries[activeCategory]) }
  const chooseCategory = c => { setActiveCategory(c); loadNews(query.trim() || categoryQueries[c]) }
  const toggleSave = item => setSaved(old => old.some(x => x.link === item.link) ? old.filter(x => x.link !== item.link) : [item, ...old])
  const isSaved = item => saved.some(x => x.link === item.link)
  const saveSocialSearch = id => {
    const term = query.trim() || searchedFor || activeCategory
    const item = { id: `${id}-${term.toLowerCase()}-${Date.now()}`, platform: id, query: term, url: socialUrl(id, term), savedAt: new Date().toISOString() }
    setSavedSocial(old => old.some(x => x.platform === id && x.query.toLowerCase() === term.toLowerCase()) ? old : [item, ...old])
  }
  const socialSearch = id => window.open(socialUrl(id, query || searchedFor || activeCategory), '_blank', 'noopener,noreferrer')
  const saveNote = () => {
    if (!noteTitle.trim() && !noteDraft.trim()) return
    if (editingNoteId) {
      setNotes(old => old.map(n => n.id === editingNoteId ? { ...n, title: noteTitle.trim() || 'Untitled research note', body: noteDraft.trim(), updatedAt: new Date().toISOString(), collectionId: activeCollection || '' } : n))
      setExportMessage('Research note updated.')
    } else {
      const note = { id: `note-${Date.now()}`, title: noteTitle.trim() || 'Untitled research note', body: noteDraft.trim(), createdAt: new Date().toISOString(), collectionId: activeCollection || '' }
      setNotes(old => [note, ...old]); setExportMessage('Research note saved.')
    }
    setNoteTitle(''); setNoteDraft(''); setEditingNoteId('')
  }
  const editNote = note => {
    setEditingNoteId(note.id); setNoteTitle(note.title); setNoteDraft(note.body || '')
    setActiveCollection(note.collectionId || '')
    setResearchTab('notes')
  }
  const cancelNoteEdit = () => { setEditingNoteId(''); setNoteTitle(''); setNoteDraft('') }
  const exportResearch = () => {
    const payload = { schemaVersion: 1, exportedAt: new Date().toISOString(), headlines: saved, socialSearches: savedSocial, notes, collections }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = `newspulse-backup-${new Date().toISOString().slice(0,10)}.json`; a.click()
    URL.revokeObjectURL(url); setResearchBackupMessage('Backup exported. Keep the JSON file somewhere safe.')
  }
  const importResearch = event => {
    const file = event.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result || '{}'))
        if (!data || typeof data !== 'object' || !Array.isArray(data.headlines) || !Array.isArray(data.socialSearches) || !Array.isArray(data.notes) || !Array.isArray(data.collections)) throw new Error('This file is not a valid NewsPulse backup.')
        setSaved(data.headlines); setSavedSocial(data.socialSearches); setNotes(data.notes); setCollections(data.collections)
        setResearchBackupMessage('Backup restored successfully.')
      } catch (err) { setResearchBackupMessage(err.message || 'Could not restore this backup.') }
      event.target.value = ''
    }
    reader.onerror = () => { setResearchBackupMessage('Could not read the selected file.'); event.target.value = '' }
    reader.readAsText(file)
  }
  const createCollection = () => {
    const name = collectionDraft.trim()
    if (!name || collections.some(c => c.name.toLowerCase() === name.toLowerCase())) return
    const c = { id: `collection-${Date.now()}`, name, createdAt: new Date().toISOString() }
    setCollections(old => [...old, c]); setActiveCollection(c.id); setCollectionDraft('')
  }
  const addCurrentTopicToCollection = () => {
    if (!activeCollection) { setExportMessage('Choose or create a collection first.'); return }
    const term = query.trim() || searchedFor || activeCategory
    const item = { id: `topic-${Date.now()}`, type: 'topic', title: term, url: `https://news.google.com/search?q=${encodeURIComponent(term)}`, collectionId: activeCollection, createdAt: new Date().toISOString() }
    setCollections(old => old.map(c => c.id === activeCollection ? { ...c, items: [...(c.items || []), item] } : c))
    setExportMessage(`Added “${term}” to the collection.`)
  }
  const timelineEvents = useMemo(() => {
    const events = [
      ...saved.map(x => ({ id: `headline-${x.link}`, kind: 'headline', label: 'Saved headline', title: x.title, source: x.source || 'News source', url: x.link, date: x.savedAt || x.pubDate || x.createdAt })),
      ...savedSocial.map(x => ({ id: x.id, kind: 'social', label: 'Social search', title: `${platforms.find(p=>p.id===x.platform)?.name || x.platform}: ${x.query}`, source: 'Social platform search', url: x.url, date: x.savedAt })),
      ...notes.map(x => ({ id: x.id, kind: 'note', label: 'Research note', title: x.title, source: collections.find(c=>c.id===x.collectionId)?.name || 'Research desk', url: '', date: x.updatedAt || x.createdAt, body: x.body })),
      ...collections.flatMap(c => (c.items || []).map(x => ({ id: x.id, kind: x.type === 'article' ? 'headline' : 'topic', label: x.type === 'article' ? 'Collected article' : 'Collected topic', title: x.title, source: c.name, url: x.url, date: x.createdAt })))
    ].filter(x => x.date && Number.isFinite(new Date(x.date).getTime()))
    return events.sort((a,b) => new Date(b.date) - new Date(a.date))
  }, [saved, savedSocial, notes, collections])
  const filteredTimeline = timelineEvents.filter(e => timelineFilter === 'all' || e.kind === timelineFilter)

  return <div className="app-shell">
    <aside className={`sidebar ${menuOpen ? 'sidebar-open' : ''}`}>
      <div className="brand"><div className="brand-mark"><Activity size={21}/></div><div><div className="brand-name">newspulse<span>.</span></div><div className="brand-sub">DISCOVERY STUDIO</div></div><button className="mobile-close" onClick={() => setMenuOpen(false)}><XIcon size={18}/></button></div>
      <div className="side-label">WORKSPACE</div>
      <button className={`nav-item ${!showSaved ? 'active' : ''}`} onClick={() => setShowSaved(false)}><Compass size={18}/><span>Discover</span>{!showSaved && <span className="nav-dot"/>}</button>
      <button className={`nav-item ${showSaved ? 'active' : ''}`} onClick={() => {setShowSaved(true);setShowResearch(false)}}><Bookmark size={18}/><span>Saved links</span><span className="count">{saved.length + savedSocial.length}</span></button>
      <button className={`nav-item ${showResearch ? 'active' : ''}`} onClick={() => {setShowResearch(true);setShowSaved(false)}}><Newspaper size={18}/><span>Research desk</span><span className="count">{notes.length}</span></button>
      <div className="side-label platform-label">VIDEO SOURCES</div>
      <div className="platform-nav">{platforms.map(p => <button className="platform-link" key={p.id} onClick={() => socialSearch(p.id)}><span className={`platform-symbol ${p.id}`} style={{color:p.color}}>{p.id === 'facebook' ? 'f' : p.id === 'instagram' ? <Instagram size={16}/> : p.id === 'reddit' ? '●' : '𝕏'}</span><span>{p.name}</span><ArrowUpRight size={14} className="side-arrow"/></button>)}</div>
      <div className="sidebar-bottom"><div className="pulse-card"><div className="pulse-orb"><Sparkles size={17}/></div><div className="pulse-title">Stay curious.</div><p>Headlines in one place. Social video just a click away.</p></div><div className="version-row"><span className="status-dot"/> Live RSS news desk <span className="version">v0.2</span></div></div>
    </aside>
    {menuOpen && <div className="scrim" onClick={() => setMenuOpen(false)}/>}
    <main className="main">
      <header className="topbar"><button className="menu-button" onClick={() => setMenuOpen(true)}><Menu size={20}/></button><div className="breadcrumb">Workspace <span>/</span> <b>{showSaved ? 'Saved links' : 'Discover'}</b></div><div className="top-actions"><span className="live-label"><span className="live-dot"/> LIVE NEWS DESK</span><div className="avatar">J</div></div></header>
      <div className="content">
        <section className="hero"><div className="hero-copy"><div className="eyebrow"><span className="eyebrow-line"/> YOUR DAILY SIGNAL</div><h1>Find the story.<br/><span>Follow the signal.</span></h1><p>Search live headlines, explore perspectives, and jump straight into videos and conversations across your favourite platforms.</p>
          <form className="search-box" onSubmit={submitSearch}><Search size={20}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search a topic, headline, person or event..." aria-label="Search news"/>{query && <button type="button" className="clear-search" onClick={() => setQuery('')}><XIcon size={15}/></button>}<button className="search-submit" type="submit">Search <ArrowUpRight size={16}/></button></form>
          <div className="quick-searches"><span>TRY:</span>{['AI breakthroughs','Canada','Climate','Space'].map(t => <button key={t} onClick={() => {setQuery(t); loadNews(t)}}>{t}</button>)}</div>
        </div><div className="hero-art" aria-hidden="true"><div className="orbit orbit-one"/><div className="orbit orbit-two"/><div className="orbit orbit-three"/><div className="art-core"><Globe2 size={54} strokeWidth={1.2}/></div><div className="float-chip chip-top"><span className="chip-dot violet-dot"/> LIVE HEADLINES</div><div className="float-chip chip-left"><Video size={15}/> Video discovery</div><div className="float-chip chip-right"><Activity size={15}/> Signal found</div><div className="art-star star-one">✳</div><div className="art-star star-two">✦</div></div></section>

        {showResearch ? <section className="research-section"><div className="section-heading"><div><div className="eyebrow">YOUR WORKSPACE</div><h2>Research desk</h2><p className="section-sub">Search your notes, maintain topic collections, and back up or restore your research archive.</p></div><div className="backup-actions"><button className="filter-button" onClick={exportResearch}><ExternalLink size={15}/> Export backup</button><label className="filter-button import-backup"><ExternalLink size={15}/> Restore backup<input type="file" accept=".json,application/json" onChange={importResearch}/></label></div></div>
          <div className="research-tabs"><button className={researchTab==='notes'?'research-tab-active':''} onClick={() => setResearchTab('notes')}>Research notes <span>{notes.length}</span></button><button className={researchTab==='collections'?'research-tab-active':''} onClick={() => setResearchTab('collections')}>Collections <span>{collections.length}</span></button><button className={researchTab==='timeline'?'research-tab-active':''} onClick={() => setResearchTab('timeline')}>Timeline <span>{timelineEvents.length}</span></button></div>
          {researchTab === 'timeline' ? <div className="timeline-workspace"><div className="timeline-toolbar"><div><h3>Research activity</h3><p>Saved items, notes and collection entries in date order.</p></div><label>SHOW <select value={timelineFilter} onChange={e=>setTimelineFilter(e.target.value)}><option value="all">Everything</option><option value="headline">Headlines & topics</option><option value="social">Social searches</option><option value="note">Research notes</option></select></label></div>{filteredTimeline.length ? <div className="timeline-list">{filteredTimeline.map((item,index)=><article className="timeline-entry" key={`${item.kind}-${item.id}`}><div className={`timeline-marker ${item.kind}`}>{item.kind==='headline'?<Newspaper size={15}/>:item.kind==='social'?<Video size={15}/>:<Link2 size={15}/>}</div><div className="timeline-entry-body"><div className="timeline-entry-meta"><span>{item.label}</span><time>{new Date(item.date).toLocaleString()}</time></div><h4>{item.title}</h4><p>{item.source}{item.body ? ` · ${item.body.slice(0,150)}` : ''}</p><div className="timeline-entry-actions">{item.url && <button className="read-story" onClick={()=>window.open(item.url,'_blank','noopener,noreferrer')}>Open source <ArrowUpRight size={14}/></button>}{item.kind==='note' && <button className="preview-story" onClick={()=>{const note=notes.find(n=>n.id===item.id);if(note)editNote(note)}}>Edit note</button>}</div></div></article>)}</div> : <div className="empty-state"><Activity size={25}/><h3>Your timeline is waiting</h3><p>Save headlines, social searches, or research notes and they'll appear here.</p><button className="outline-button" onClick={()=>setResearchTab('notes')}>Create a research note</button></div>}</div> : researchTab === 'notes' ? <div className="research-layout"><div className="note-editor"><div className="editor-label">{editingNoteId ? 'EDIT RESEARCH NOTE' : 'NEW RESEARCH NOTE'}</div><input value={noteTitle} onChange={e=>setNoteTitle(e.target.value)} placeholder="Note title (optional)"/><textarea value={noteDraft} onChange={e=>setNoteDraft(e.target.value)} placeholder="Capture a key finding, quote, question, or your own analysis…" rows={7}/><div className="editor-footer"><label>ADD TO <select value={activeCollection} onChange={e=>setActiveCollection(e.target.value)}><option value="">No collection</option>{collections.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label><div className="note-form-actions">{editingNoteId && <button className="outline-button" onClick={cancelNoteEdit}>Cancel</button>}<button className="search-submit" onClick={saveNote}>{editingNoteId ? 'Update note' : 'Save note'} <Check size={14}/></button></div></div></div><div className="notes-pane"><div className="notes-search"><Search size={15}/><input value={researchSearch} onChange={e=>setResearchSearch(e.target.value)} placeholder="Search your notes and saved research…"/></div><div className="notes-list">{notes.filter(n=>`${n.title} ${n.body} ${collections.find(c=>c.id===n.collectionId)?.name||''}`.toLowerCase().includes(researchSearch.toLowerCase())).length ? notes.filter(n=>`${n.title} ${n.body} ${collections.find(c=>c.id===n.collectionId)?.name||''}`.toLowerCase().includes(researchSearch.toLowerCase())).map(n=><article className="note-card" key={n.id}><div className="note-card-top"><span>{new Date(n.updatedAt || n.createdAt).toLocaleDateString()}</span><div className="note-card-actions"><button className="icon-button" title="Edit note" onClick={()=>editNote(n)}><SlidersHorizontal size={14}/></button><button className="icon-button" title="Delete note" onClick={()=>{setNotes(old=>old.filter(x=>x.id!==n.id));if(editingNoteId===n.id)cancelNoteEdit()}}><XIcon size={15}/></button></div></div><h3>{n.title}</h3><p>{n.body || 'No note text.'}</p>{n.collectionId && <span className="source-pill">{collections.find(c=>c.id===n.collectionId)?.name || 'Collection'}</span>}</article>) : <div className="empty-state"><Newspaper size={24}/><h3>{notes.length ? 'No matching notes' : 'No research notes yet'}</h3><p>{notes.length ? 'Try a different search phrase.' : 'Capture what you learn as you read the news.'}</p></div>}</div></div></div> : <div className="collections-area"><div className="create-collection"><input value={collectionDraft} onChange={e=>setCollectionDraft(e.target.value)} onKeyDown={e=>e.key==='Enter'&&createCollection()} placeholder="Name a collection, e.g. AI policy or Canada"/><button className="search-submit" onClick={createCollection}>Create collection <Check size={14}/></button></div>{collections.length ? <div className="collection-grid">{collections.map(c=><article className={`collection-card ${activeCollection===c.id?'collection-card-active':''}`} key={c.id} onClick={()=>setActiveCollection(c.id)}><div className="collection-card-icon"><Bookmark size={19}/></div><div className="collection-card-title">{c.name}</div><p>{(c.items||[]).length} saved topics · {notes.filter(n=>n.collectionId===c.id).length} notes</p><div className="collection-topics">{(c.items||[]).map(item=><div className="collection-topic" key={item.id}><span>{item.title}</span><button className="icon-button" onClick={e=>{e.stopPropagation();setCollections(old=>old.map(x=>x.id===c.id?{...x,items:(x.items||[]).filter(y=>y.id!==item.id)}:x))}}><XIcon size={13}/></button><button className="icon-button" onClick={e=>{e.stopPropagation();window.open(item.url,'_blank','noopener,noreferrer')}}><ExternalLink size={13}/></button></div>)}</div><button className="delete-collection" onClick={e=>{e.stopPropagation();setCollections(old=>old.filter(x=>x.id!==c.id));if(activeCollection===c.id)setActiveCollection('');setNotes(old=>old.map(n=>n.collectionId===c.id?{...n,collectionId:''}:n))}}>Delete collection</button></article>)}</div> : <div className="empty-state"><Bookmark size={25}/><h3>Create your first collection</h3><p>Group topics and notes around a story you are researching.</p></div>}</div>}
          {exportMessage && <div className="export-message"><Check size={14}/>{exportMessage}<button onClick={()=>setExportMessage('')}><XIcon size={13}/></button></div>}
        </section> : showSaved ? <section className="saved-section"><div className="section-heading"><div><div className="eyebrow">YOUR COLLECTION</div><h2>Saved links <span className="heading-count">{saved.length}</span></h2><p className="section-sub">Your saved headlines and search shortcuts stay on this device.</p></div></div>
          <div className="saved-tabs"><button className={savedTab==='articles'?'saved-tab-active':''} onClick={() => setSavedTab('articles')}>Saved headlines <span>{saved.length}</span></button><button className={savedTab==='social'?'saved-tab-active':''} onClick={() => setSavedTab('social')}>Social searches <span>{savedSocial.length}</span></button></div>
          {savedTab === 'articles' ? (saved.length ? <div className="saved-list">{saved.map(s=><div className="saved-row" key={s.link}><div className="saved-icon"><Link2 size={18}/></div><div className="saved-copy"><b>{s.title}</b><span>{s.source || 'Saved headline'}</span></div><button className="icon-button" onClick={() => window.open(s.link, '_blank', 'noopener,noreferrer')}><ExternalLink size={16}/></button><button className="icon-button" onClick={() => toggleSave(s)}><XIcon size={16}/></button></div>)}</div> : <div className="empty-state"><Bookmark size={26}/><h3>No saved headlines yet</h3><p>Use the bookmark icon beside any article to keep it here.</p><button className="outline-button" onClick={() => setShowSaved(false)}>Explore headlines</button></div>) : (savedSocial.length ? <div className="saved-list">{savedSocial.map(s=><div className="saved-row" key={s.id}><div className={`platform-logo ${s.platform}`}>{s.platform==='facebook'?'f':s.platform==='instagram'?<Instagram size={18}/>:s.platform==='reddit'?'●':'𝕏'}</div><div className="saved-copy"><b>{platforms.find(p=>p.id===s.platform)?.name || s.platform} · {s.query}</b><span>Saved social search</span></div><button className="icon-button" onClick={() => window.open(s.url, '_blank', 'noopener,noreferrer')}><ExternalLink size={16}/></button><button className="icon-button" onClick={() => setSavedSocial(old=>old.filter(x=>x.id!==s.id))}><XIcon size={16}/></button></div>)}</div> : <div className="empty-state"><Video size={26}/><h3>No saved social searches yet</h3><p>Use the bookmark icon on a platform card to save a reusable search.</p><button className="outline-button" onClick={() => setShowSaved(false)}>Explore platforms</button></div>)}
        </section> : <>
          <section className="platform-section"><div className="section-heading compact"><div><div className="eyebrow">BEYOND THE HEADLINES</div><h2>Explore across platforms</h2><p className="section-sub">Search video posts, reels, clips and community discussions.</p></div><button className="text-action" onClick={() => socialSearch('reddit')}>Explore links <ArrowUpRight size={15}/></button></div>
            <div className="platform-cards">{platforms.map(p=><div key={p.id} className="platform-card-wrap"><button className="platform-card" onClick={() => socialSearch(p.id)}><div className={`platform-logo ${p.id}`} style={{color:p.color}}>{p.id === 'facebook' ? 'f' : p.id === 'instagram' ? <Instagram size={23}/> : p.id === 'reddit' ? '●' : '𝕏'}</div><div className="platform-card-copy"><b>{p.name}</b><span>{p.subtitle}</span></div><ArrowUpRight size={16} className="platform-card-arrow"/></button><button className="save-search" title={`Save ${p.name} search`} onClick={() => saveSocialSearch(p.id)}><Bookmark size={14}/></button></div>)}</div>
          </section>
          <section className="headlines-section"><div className="section-heading compact"><div><div className="eyebrow">THE NEWS DESK</div><h2>{query.trim() ? `Headlines for “${query.trim()}”` : activeCategory}</h2><p className="section-sub">Live results from Google News RSS, grouped into one readable feed.</p></div><div className="heading-actions"><button className="filter-button" onClick={() => {setShowResearch(true);setShowSaved(false)}}><Newspaper size={15}/> Research notes</button><button className="filter-button" onClick={() => loadNews()} disabled={loading}><RefreshCw size={15} className={loading?'spin':''}/> Refresh</button></div></div>
            <div className="filters-row"><div className="category-tabs">{categories.map(c=><button key={c} className={activeCategory===c?'category-active':''} onClick={() => chooseCategory(c)}>{c}</button>)}</div><div className="feed-filters"><label><span>NEWS SOURCE</span><select value={sourceFilter} onChange={e => setSourceFilter(e.target.value)}><option value="all">All sources</option>{sourceNames.map(source => <option key={source} value={source}>{source}</option>)}</select></label><label><span>REGION</span><select value={country} onChange={e => setCountry(e.target.value)}><option value="IN">India</option><option value="CA">Canada</option><option value="US">United States</option><option value="GB">United Kingdom</option><option value="AU">Australia</option><option value="WORLD">World</option></select></label><label><span>LANGUAGE</span><select value={language} onChange={e => setLanguage(e.target.value)}><option value="en">English</option><option value="hi">Hindi</option><option value="fr">French</option><option value="es">Spanish</option></select></label><label><span>DATE RANGE</span><select value={days} onChange={e => setDays(e.target.value)}><option value="0">Any time</option><option value="1">Past 24 hours</option><option value="7">Past 7 days</option><option value="30">Past 30 days</option></select></label><button className="apply-filters" onClick={() => loadNews()} disabled={loading}><SlidersHorizontal size={14}/> Apply</button></div></div>
            <div className="collection-strip"><div className="collection-select"><label htmlFor="collection-select">COLLECTION</label><select id="collection-select" value={activeCollection} onChange={e=>setActiveCollection(e.target.value)}><option value="">Choose collection…</option>{collections.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></div><button className="collection-add" onClick={addCurrentTopicToCollection}><Bookmark size={14}/> Save current topic</button><button className="collection-manage" onClick={() => {setShowResearch(true);setShowSaved(false);setResearchTab('collections')}}>Manage collections <ArrowUpRight size={13}/></button></div>
            <div className="feed-status">{loading ? <><LoaderCircle size={14} className="spin"/> Fetching current headlines…</> : error ? <><AlertCircle size={14}/> News feed unavailable</> : <><span className="live-dot"/> Showing {filteredArticles.length} of {uniqueArticles.length} headlines {lastUpdated ? `· Updated ${timeAgo(lastUpdated)}` : ''} {searchedFor ? `· Search: ${searchedFor}` : ''}</>}</div>
            {error ? <div className="error-state"><AlertCircle size={26}/><h3>Couldn't load headlines</h3><p>{error}</p><button className="outline-button" onClick={() => loadNews()}>Try again</button><button className="text-action" onClick={() => window.open(`https://news.google.com/search?q=${encodeURIComponent(searchTerm)}`, '_blank', 'noopener,noreferrer')}>Open Google News instead <ArrowUpRight size={14}/></button></div> :
              loading && !uniqueArticles.length ? <div className="loading-state"><LoaderCircle size={26} className="spin"/><p>Finding the latest stories…</p></div> :
              filteredArticles.length ? <div className="live-article-list">{filteredArticles.map((item,i)=><article className="live-article" key={item.id || item.link}><div className="article-index">{String(i+1).padStart(2,'0')}</div><div className="article-content"><div className="article-meta"><span className="source-pill">{item.source}</span><span><Clock3 size={12}/>{timeAgo(item.pubDate)}</span></div><h3>{item.title}</h3>{item.description && <p>{item.description.slice(0,220)}{item.description.length>220?'…':''}</p>}<div className="article-actions"><button className="read-story" onClick={() => window.open(item.link, '_blank', 'noopener,noreferrer')}>Read full story <ArrowUpRight size={15}/></button><button className="preview-story" onClick={() => setPreviewArticle(item)}>Quick preview</button><button className="preview-story" onClick={() => { if(!activeCollection){setExportMessage('Choose a collection above first.');return};setCollections(old=>old.map(c=>c.id===activeCollection?{...c,items:[...(c.items||[]),{id:`article-${Date.now()}`,type:'article',title:item.title,url:item.link,source:item.source,collectionId:activeCollection,createdAt:new Date().toISOString()}]}:c));setExportMessage('Headline added to collection.') }}>Add to collection</button><button className={`icon-button ${isSaved(item)?'is-saved':''}`} title="Save headline" onClick={() => toggleSave(item)}>{isSaved(item)?<Check size={16}/>:<Bookmark size={16}/>}</button><button className="social-mini" onClick={() => window.open(socialUrl('reddit', item.title), '_blank', 'noopener,noreferrer')}>Find discussion <ArrowUpRight size={13}/></button></div></div></article>)}</div> :
              <div className="empty-state"><Newspaper size={26}/><h3>No headlines returned</h3><p>Try another search term or change your filters.</p><button className="outline-button" onClick={() => loadNews('top news')}>Load top news</button></div>}
            <div className="live-search-banner"><div className="banner-icon"><Newspaper size={20}/></div><div><b>Take the search further</b><p>Open a broader live search for this topic on Google News.</p></div><button onClick={() => window.open(`https://news.google.com/search?q=${encodeURIComponent(searchTerm)}`, '_blank', 'noopener,noreferrer')}>More coverage <ArrowUpRight size={16}/></button></div>
          </section>
        </>}
        {previewArticle && <div className="preview-overlay" onClick={() => setPreviewArticle(null)}><section className="preview-modal" role="dialog" aria-modal="true" aria-label="Headline quick preview" onClick={e => e.stopPropagation()}><div className="preview-top"><span className="eyebrow">HEADLINE PREVIEW</span><button className="icon-button" onClick={() => setPreviewArticle(null)}><XIcon size={17}/></button></div><div className="preview-source">{previewArticle.source} <span>·</span> {timeAgo(previewArticle.pubDate)}</div><h2>{previewArticle.title}</h2><p>{previewArticle.description || 'The feed did not provide a summary for this article. Open the source article to read the full report and context.'}</p><div className="preview-url">{previewArticle.link}</div><div className="preview-actions"><button className="search-submit" onClick={() => window.open(previewArticle.link, '_blank', 'noopener,noreferrer')}>Open full article <ArrowUpRight size={15}/></button><button className="outline-button" onClick={() => toggleSave(previewArticle)}>{isSaved(previewArticle)?<Check size={15}/>:<Bookmark size={15}/>} {isSaved(previewArticle)?'Saved':'Save headline'}</button><button className="outline-button" onClick={() => {setNoteTitle(previewArticle.title);setNoteDraft(`Source: ${previewArticle.source}\nURL: ${previewArticle.link}\n\nResearch notes:\n`);setEditingNoteId('');setShowResearch(true);setShowSaved(false);setResearchTab('notes');setPreviewArticle(null)}}><Newspaper size={15}/> Make research note</button></div></section></div>}
        <footer><span>NEWSPULSE STUDIO <span className="footer-sep">/</span> YOUR WINDOW ON WHAT'S HAPPENING</span><span>News via Google News RSS · External stories open at source.</span></footer>
      </div>
    </main>
  </div>
}
export default App
