import React, { useState } from 'react'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import About from './pages/About'
import Contact from './pages/Contact'

function ProgressCircle({ elapsedMs, formatTime }) {
  const circumference = 2 * Math.PI * 18
  // Indeterminate spinner: animate stroke dash offset using elapsed time
  const offset = (elapsedMs / 50) % circumference
  return (
    <div className="relative h-8 w-8">
      <svg className="h-8 w-8 text-amber-500" viewBox="0 0 42 42">
        <circle cx="21" cy="21" r="18" fill="none" stroke="#fef3c7" strokeWidth="4" />
        <circle
          cx="21"
          cy="21"
          r="18"
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={`${circumference}`}
          strokeDashoffset={`${offset}`}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-[10px] text-slate-700">{formatTime(elapsedMs)}</div>
    </div>
  )
}

function cryptoRandomId() {
  return 'p_' + Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2)
}

function SseProgress({ id, forceComplete }) {
  const [serverPercent, setServerPercent] = React.useState(0)
  const [etaSeconds, setEtaSeconds] = React.useState(null)
  const [elapsed, setElapsed] = React.useState(0)
  const startRef = React.useRef(Date.now())
  const maxDurationMs = 180000 // 3 minutes cap

  React.useEffect(() => {
    startRef.current = Date.now()
    const t = setInterval(() => setElapsed(Date.now() - startRef.current), 250)
    return () => clearInterval(t)
  }, [id])

  React.useEffect(() => {
    if (!id) return
    // Use absolute backend origin in dev to avoid proxy flakiness
    const origin = import.meta.env.VITE_API_BASE_URL || 
      (typeof window !== 'undefined' && window.location && window.location.port === '5177' ? 'http://localhost:5174' : '')
    let usePolling = false
    let src
    try {
      src = new EventSource(`${origin}/api/progress/${id}`)
      src.onmessage = (ev) => {
        try {
          const data = JSON.parse(ev.data)
          if (typeof data.percent === 'number') setServerPercent(Math.max(0, Math.min(100, data.percent)))
          if (typeof data.etaSeconds === 'number') setEtaSeconds(Math.max(0, data.etaSeconds))
        } catch {}
      }
      src.onerror = () => {
        usePolling = true
        try { src.close() } catch {}
      }
    } catch {
      usePolling = true
    }

    let pollTimer
    const startPolling = () => {
      const fetchOnce = async () => {
        try {
          const r = await fetch(`${origin}/api/progress/${id}/json`, { cache: 'no-store' })
          const data = await r.json()
          if (typeof data.percent === 'number') setServerPercent(Math.max(0, Math.min(100, data.percent)))
          if (typeof data.etaSeconds === 'number') setEtaSeconds(Math.max(0, data.etaSeconds))
          if (data.status === 'done' || data.status === 'error') return
          pollTimer = setTimeout(fetchOnce, 1000)
        } catch {
          pollTimer = setTimeout(fetchOnce, 1500)
        }
      }
      fetchOnce()
    }

    if (usePolling) startPolling()

    return () => {
      try { src && src.close() } catch {}
      if (pollTimer) clearTimeout(pollTimer)
    }
  }, [id])

  const fallbackPercent = Math.min(100, (elapsed / maxDurationMs) * 100)
  const basePercent = Math.max(serverPercent || 0, fallbackPercent)
  const displayPercent = forceComplete ? 100 : basePercent
  const remainingMs = Math.max(0, maxDurationMs - elapsed)
  const fallbackMm = Math.floor(remainingMs / 1000 / 60)
  const fallbackSs = String(Math.floor((remainingMs / 1000) % 60)).padStart(2, '0')
  const labelEta = etaSeconds != null ? `${Math.floor(etaSeconds / 60)}:${String(etaSeconds % 60).padStart(2, '0')}` : `${fallbackMm}:${fallbackSs}`

  return (
    <div className="min-w-[240px]">
      <div className="h-2 w-full rounded-full bg-amber-100 overflow-hidden">
        <div
          className="h-full bg-amber-500 transition-[width] duration-300 ease-linear"
          style={{ width: `${Math.round(displayPercent)}%` }}
        />
      </div>
      <div className="mt-1 text-[11px] text-slate-700">
        {Math.round(displayPercent)}% • may take upto 3 minutes • ETA {labelEta}
      </div>
    </div>
  )
}

function Home({ url, setUrl, status, setStatus, handleSubmit }) {
  return (
    <>
      {/* Home / Hero and sections moved intact below */}
      {/* content below will be injected from existing home layout */}
    </>
  )
}

export default function App() {
  const [url, setUrl] = useState('')
  const [status, setStatus] = useState('')
  const [result, setResult] = useState(null)
  // In dev: use proxy, in prod: use env var
  const apiBase = import.meta.env.VITE_API_BASE_URL || 
    (typeof window !== 'undefined' && window.location && window.location.port === '5177' ? 'http://localhost:5174' : 'https://backend-3n4m.onrender.com')
  
  // Debug: Log the environment variable
  console.log('VITE_API_BASE_URL:', import.meta.env.VITE_API_BASE_URL)
  console.log('apiBase:', apiBase)
  console.log('Current URL:', window.location.href)
  console.log('Using fallback backend URL:', apiBase)
  
  const [busy, setBusy] = useState(false)
  const [elapsedMs, setElapsedMs] = useState(0)
  const timerRef = React.useRef(null)
  const [progressId, setProgressId] = useState(null)
  const [forceComplete, setForceComplete] = useState(false)

  function startTimer() {
    if (timerRef.current) clearInterval(timerRef.current)
    setElapsedMs(0)
    setBusy(true)
    const started = Date.now()
    timerRef.current = setInterval(() => {
      setElapsedMs(Date.now() - started)
    }, 250)
  }

  function stopTimer() {
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = null
    setBusy(false)
  }

  async function finishProgressAndHide() {
    // Snap the bar to 100% briefly, then hide
    setForceComplete(true)
    await new Promise((r) => setTimeout(r, 400))
    setForceComplete(false)
    stopTimer()
    setProgressId(null)
  }

  function formatTime(ms) {
    const totalSec = Math.floor(ms / 1000)
    const mm = Math.floor(totalSec / 60)
    const ss = String(totalSec % 60).padStart(2, '0')
    return `${mm}:${ss}`
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!url.trim()) {
      setStatus('Please enter a YouTube URL')
      return
    }
    setResult(null)
    setStatus('Downloading...')
    startTimer()
    try {
      const id = cryptoRandomId()
      setProgressId(id)
      const resp = await fetch(`${apiBase}/api/download`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, progressId: id }),
      })
      const text = await resp.text()
      if (!text) throw new Error('Empty response from server')
      let data
      try { data = JSON.parse(text) } catch { throw new Error(text) }
      if (!resp.ok) throw new Error(data?.error || 'Failed')
      setResult(data)
      setStatus('Download complete: ' + (data?.filename || 'file'))
      await finishProgressAndHide()
    } catch (err) {
      setStatus('Error: ' + err.message)
      stopTimer()
      setProgressId(null)
    }
  }

  return (
    <BrowserRouter>
    <div className="min-h-screen relative">
      {/* Glow accents */}
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-amber-300/30 blur-3xl animate-float" />
        <div className="absolute -top-32 right-10 h-64 w-64 rounded-full bg-amber-200/40 blur-3xl animate-float-delayed" />
      </div>

      {/* Glass Navbar */}
      <nav className="sticky top-0 z-50 mx-4 mt-4 rounded-2xl border border-white/40 bg-white/50 backdrop-blur-md shadow-lg">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-amber-400 text-white shadow shadow-amber-300/40">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5"><path d="M7.5 6.75l9 4.5-9 4.5v-9z"/></svg>
            </span>
            <span className="font-semibold tracking-tight">TubeBee</span>
          </Link>
          <div className="flex items-center gap-1 text-sm">
            <Link to="/" className="nav-link">Home</Link>
            <Link to="/about" className="nav-link">About</Link>
            <Link to="/contact" className="nav-link">Contact</Link>
          </div>
        </div>
      </nav>

      <Routes>
        <Route path="/" element={
          <section id="home" className="px-6 pt-10 pb-16">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-8 items-center">
          <div className="order-2 md:order-1">
            <div className="rounded-2xl border border-white/30 bg-white/40 backdrop-blur-md shadow-xl shadow-amber-200/20">
              <div className="p-6 md:p-8">
                <form onSubmit={handleSubmit} className="space-y-5">
                  <label className="block">
                    <span className="block text-sm font-medium mb-2">YouTube URL</span>
                    <div className="relative">
                      <input
                        type="url"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="https://www.youtube.com/watch?v=..."
                        className="w-full rounded-xl border border-white/60 bg-white/50 backdrop-blur placeholder:text-slate-400 px-4 py-3 pr-28 focus:outline-none focus:ring-2 focus:ring-amber-300/60"
                        required
                      />
                      <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg bg-amber-400 px-4 py-2 text-sm font-medium text-white hover:bg-amber-500 active:bg-amber-600 shadow-md shadow-amber-300/30">Convert</button>
                    </div>
                  </label>

                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={async () => {
                        if (!url.trim()) { setStatus('Please enter a YouTube URL'); return }
                        setResult(null)
                        setStatus('Downloading MP3...')
                        startTimer()
                        try {
                          const id = cryptoRandomId()
                          setProgressId(id)
                          const resp = await fetch(`${apiBase}/api/download-mp3`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ url, bitrate: 192, progressId: id }),
                          })
                          const text = await resp.text()
                          if (!text) throw new Error('Empty response from server')
                          let data
                          try { data = JSON.parse(text) } catch { throw new Error(text) }
                          if (!resp.ok) throw new Error(data?.error || 'MP3 download failed')
                          setResult(data)
                          setStatus('MP3 ready: ' + (data?.filename || 'file'))
                          await finishProgressAndHide()
                        } catch (err) {
                          setStatus('Error: ' + err.message)
                          stopTimer()
                          setProgressId(null)
                        }
                      }}
                      className="inline-flex items-center gap-2 rounded-xl bg-white/60 px-4 py-2 font-medium text-slate-800 hover:bg-white/80 border border-white/70 backdrop-blur shadow-sm"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 text-amber-500"><path fillRule="evenodd" d="M12 2.25a.75.75 0 01.75.75v9.19l2.47-2.47a.75.75 0 111.06 1.06l-3.75 3.75a.75.75 0 01-1.06 0l-3.75-3.75a.75.75 0 011.06-1.06l2.47 2.47V3a.75.75 0 01.75-.75z" clipRule="evenodd" /><path d="M4.5 15.75a.75.75 0 01.75-.75h13.5a.75.75 0 01.75.75V18A2.25 2.25 0 0117.25 20.25H6.75A2.25 2.25 0 014.5 18v-2.25z" /></svg>
                      Download MP3
                    </button>
                  </div>

                  {(busy || status) && (
                    <div className="rounded-xl border border-white/60 bg-white/50 backdrop-blur px-4 py-3 text-sm text-slate-800 shadow-sm">
                      <div className="flex items-center gap-3">
                        {busy && (
                          <SseProgress id={progressId} forceComplete={forceComplete} />
                        )}
                        <span>{status}</span>
                      </div>
                      {!busy && (() => {
                        const rawUrl = result?.url || (result?.filename ? `/downloads/${encodeURIComponent(result.filename)}` : null)
                        const downloadUrl = rawUrl && rawUrl.startsWith('/downloads') ? `${apiBase}${rawUrl}` : rawUrl
                        return downloadUrl ? (
                        <div className="mt-2">
                          <a
                            href={downloadUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            download
                            className="inline-flex items-center gap-2 rounded-lg bg-amber-400 px-3 py-2 text-white hover:bg-amber-500 shadow-sm"
                          >
                            Click to download
                          </a>
                        </div>
                        ) : null
                      })()}
                    </div>
                  )}
                </form>
              </div>
            </div>
          </div>

          {/* Right side hero image */}
          <div className="order-1 md:order-2">
            <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-white/40 bg-white/40 backdrop-blur shadow-xl">
              <img
                alt="TubeBee hero"
                className="h-full w-full object-cover scale-105 animate-slow-pan"
                src="https://images.unsplash.com/photo-1516280440614-37939bbacd81?q=80&w=1600&auto=format&fit=crop"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-white/40 to-transparent" />
            </div>
          </div>
        </div>
      </section>
        } />

        {/* About page with extra FAQ below on home route */}
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
      </Routes>

      {/* FAQ on home page bottom */}
      <section className="px-6 pb-16">
        <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-6">
          {[
            { title: 'Fast', desc: 'Direct MP3 without intermediate video for speed.', icon: (
              <svg className="h-6 w-6 text-amber-500" viewBox="0 0 24 24" fill="currentColor"><path d="M3 13h2a9 9 0 019 9v-2a7 7 0 00-7-7H3z"/><path d="M3 5h2a17 17 0 0117 17v-2A15 15 0 005 5H3z"/></svg>
            )},
            { title: 'Clean', desc: 'Minimal, glassy interface with creamy whites.', icon: (
              <svg className="h-6 w-6 text-amber-500" viewBox="0 0 24 24" fill="currentColor"><path d="M11.7 2.1a1 1 0 011.6 0l8 11A1 1 0 0120.6 15H3.4a1 1 0 01-.8-1.6l9.1-11.3z"/></svg>
            )},
            { title: 'Simple', desc: 'Paste link, click once. That\'s it.', icon: (
              <svg className="h-6 w-6 text-amber-500" viewBox="0 0 24 24" fill="currentColor"><path d="M4 6h16v12H4z"/><path d="M10 9h4v6h-4z" className="opacity-60"/></svg>
            )},
          ].map((f, idx) => (
            <div key={idx} className="rounded-2xl border border-white/40 bg-white/50 backdrop-blur p-5 shadow">
              <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/70 border border-white/60">
                {f.icon}
              </div>
              <h3 className="font-semibold">{f.title}</h3>
              <p className="text-sm text-slate-700 mt-1">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="text-center text-xs text-slate-600 py-8">
        © {new Date().getFullYear()} TubeBee
      </footer>
    </div>
    </BrowserRouter>
  )
}



