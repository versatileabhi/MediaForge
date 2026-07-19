import {
  createContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type DragEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import { FFmpeg } from '@ffmpeg/ffmpeg'
import { fetchFile, toBlobURL } from '@ffmpeg/util'
import './App.css'

type ToolKey = 'converter' | 'frames' | 'sticker'
type AccentMode = 'lime' | 'cyan'
type BrushMode = 'erase' | 'restore'
type CaptureItem = {
  id: string
  name: string
  dataUrl: string
  timestamp: number
}

type AccentContextValue = {
  accent: AccentMode
  setAccent: (value: AccentMode) => void
}

const AccentContext = createContext<AccentContextValue>({
  accent: 'lime',
  setAccent: () => {},
})

const parseTimeInput = (value: string) => {
  const trimmed = value.trim()
  if (!trimmed) return 0
  if (/^\d+(\.\d+)?$/.test(trimmed)) return Number(trimmed)

  const parts = trimmed.split(':').map((part) => Number(part))
  if (parts.length === 2) {
    const [minutes, seconds] = parts
    return minutes * 60 + seconds
  }
  if (parts.length === 3) {
    const [hours, minutes, seconds] = parts
    return hours * 3600 + minutes * 60 + seconds
  }
  return 0
}

const formatTime = (value: number) => {
  const hours = Math.floor(value / 3600)
  const minutes = Math.floor((value % 3600) / 60)
  const seconds = Math.floor(value % 60)
  return [hours, minutes, seconds]
    .map((part) => part.toString().padStart(2, '0'))
    .join(':')
}

const ffmpegRef = { current: null as FFmpeg | null }

type SocialIconName = 'linkedin' | 'instagram' | 'github' | 'mail'

type SocialLinkProps = {
  href: string
  label: string
  icon: SocialIconName
  external?: boolean
}

function SocialLink({ href, label, icon, external = false }: SocialLinkProps) {
  const iconMarkup = (() => {
    switch (icon) {
      case 'linkedin':
        return (
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M6.94 8.5A1.56 1.56 0 1 0 6.94 5.38a1.56 1.56 0 0 0 0 3.12ZM5.5 9.75h2.88V18H5.5zM10.2 9.75h2.76v1.12h.04c.38-.72 1.32-1.48 2.72-1.48 2.91 0 3.44 1.91 3.44 4.39V18H16.2v-7.48c0-1.78-.03-4.08-2.48-4.08-2.49 0-2.87 1.94-2.87 3.95V18H10.2z" />
          </svg>
        )
      case 'instagram':
        return (
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4Zm0 2a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H7Zm5 3.2A3.8 3.8 0 1 1 8.2 12 3.8 3.8 0 0 1 12 8.2Zm0 2A1.8 1.8 0 1 0 13.8 12 1.8 1.8 0 0 0 12 10.2Zm4.6-4.4a1 1 0 1 1-1 1 1 1 0 0 1 1-1Z" />
          </svg>
        )
      case 'github':
        return (
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 2a10 10 0 0 0-3.16 19.18c.5.09.68-.22.68-.48v-1.7c-2.77.6-3.36-1.34-3.36-1.34-.45-1.15-1.1-1.46-1.1-1.46-.9-.62.07-.61.07-.61 1 .07 1.53 1.03 1.53 1.03.89 1.52 2.33 1.08 2.9.82.09-.64.35-1.08.63-1.33-2.22-.25-4.55-1.11-4.55-4.93 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.64 0 0 .84-.27 2.75 1.02A9.56 9.56 0 0 1 12 6.84c.85 0 1.71.11 2.51.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.37.2 2.39.1 2.64.64.7 1.03 1.59 1.03 2.68 0 3.83-2.34 4.68-4.57 4.92.36.31.68.93.68 1.87v2.77c0 .27.18.58.69.48A10 10 0 0 0 12 2Z" />
          </svg>
        )
      case 'mail':
        return (
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M4 5h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Zm0 2v1.2l8 5.33 8-5.33V7H4Zm16 10V9.8l-7.2 4.8a1 1 0 0 1-1.07 0L4 9.8V17h16Z" />
          </svg>
        )
    }
  })()

  return (
    <a className="profile-link" href={href} target={external ? '_blank' : undefined} rel={external ? 'noreferrer' : undefined}>
      <span className="social-icon" aria-hidden="true">
        {iconMarkup}
      </span>
      <span>{label}</span>
    </a>
  )
}

async function ensureFfmpeg() {
  if (ffmpegRef.current) return ffmpegRef.current

  const ffmpeg = new FFmpeg()
  ffmpegRef.current = ffmpeg
  const coreURL = 'https://unpkg.com/@ffmpeg/core@0.12.10/dist/umd/ffmpeg-core.js'
  const wasmURL = 'https://unpkg.com/@ffmpeg/core@0.12.10/dist/umd/ffmpeg-core.wasm'
  await ffmpeg.load({
    coreURL: await toBlobURL(coreURL, 'text/javascript'),
    wasmURL: await toBlobURL(wasmURL, 'application/wasm'),
  })
  return ffmpeg
}

async function exportAudioFromVideo(file: File, format: 'wav' | 'mp3') {
  if (!window.isSecureContext) {
    throw new Error('This app needs a secure context (HTTPS or localhost) to load ffmpeg core assets.')
  }
  if (!('AudioContext' in window) || !('MediaRecorder' in window)) {
    throw new Error('This browser does not support the required media APIs for local export.')
  }

  try {
    const ffmpeg = await ensureFfmpeg()
    const extension = file.name.split('.').pop()?.toLowerCase() || 'mp4'
    const inputName = `input.${extension}`
    const outputName = format === 'mp3' ? 'output.mp3' : 'output.wav'

    await ffmpeg.writeFile(inputName, await fetchFile(file))
    await ffmpeg.exec(['-i', inputName, '-vn', '-acodec', format === 'mp3' ? 'libmp3lame' : 'pcm_s16le', outputName])
    const data = await ffmpeg.readFile(outputName)
    const bytes = data instanceof Uint8Array ? data : new TextEncoder().encode(String(data))
    const arrayBuffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer
    const blob = new Blob([arrayBuffer], {
      type: format === 'mp3' ? 'audio/mpeg' : 'audio/wav',
    })
    return { blob, outputName }
  } catch (error) {
    const videoUrl = URL.createObjectURL(file)
    const videoElement = document.createElement('video')
    videoElement.src = videoUrl
    videoElement.preload = 'auto'
    videoElement.muted = false
    videoElement.crossOrigin = 'anonymous'
    videoElement.playsInline = true
    videoElement.style.display = 'none'
    document.body.appendChild(videoElement)

    const audioContext = new AudioContext()
    await audioContext.resume()
    const source = audioContext.createMediaElementSource(videoElement)
    const destination = audioContext.createMediaStreamDestination()
    source.connect(destination)
    source.connect(audioContext.destination)

    const recorder = new MediaRecorder(destination.stream)
    const chunks: BlobPart[] = []
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunks.push(event.data)
    }

    const recorded = await new Promise<Blob>((resolve, reject) => {
      recorder.onstop = () => {
        resolve(new Blob(chunks, { type: format === 'mp3' ? 'audio/mpeg' : 'audio/wav' }))
      }
      recorder.onerror = () => reject(new Error('Browser recorder failed while exporting audio.'))
      recorder.start()
      videoElement.addEventListener('ended', () => recorder.stop(), { once: true })
      videoElement.play().catch(() => reject(new Error('The browser blocked media playback for export.')))
    })

    videoElement.remove()
    await audioContext.close()
    URL.revokeObjectURL(videoUrl)
    return { blob: recorded, outputName: `${file.name.replace(/\.[^.]+$/, '')}.${format}` }
  }
}

function App() {
  const [activeTool, setActiveTool] = useState<ToolKey>('converter')
  const [clock, setClock] = useState(() => new Date())
  const [isOnline, setIsOnline] = useState(() => navigator.onLine)
  const [accent, setAccent] = useState<AccentMode>(() => {
    if (typeof window === 'undefined') return 'lime'
    return (window.localStorage.getItem('offgrid-accent') as AccentMode | null) ?? 'lime'
  })

  useEffect(() => {
    const timer = window.setInterval(() => setClock(new Date()), 1000)
    const updateOnline = () => setIsOnline(navigator.onLine)
    updateOnline()
    window.addEventListener('online', updateOnline)
    window.addEventListener('offline', updateOnline)
    return () => {
      window.clearInterval(timer)
      window.removeEventListener('online', updateOnline)
      window.removeEventListener('offline', updateOnline)
    }
  }, [])

  useEffect(() => {
    document.documentElement.style.setProperty('--accent-color', accent === 'lime' ? '#d4fc34' : '#00ffff')
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('offgrid-accent', accent)
    }
  }, [accent])

  const statusLabel = useMemo(
    () => (isOnline ? 'SYSTEM // 100% SECURE & LOCAL' : 'OFFLINE MODE ACTIVE'),
    [isOnline],
  )

  const [socialOpen, setSocialOpen] = useState(false)

  return (
    <AccentContext.Provider value={{ accent, setAccent }}>
      <div className="app-shell">
        <header className="topbar">
          <div className="brand-block">
            <p className="eyebrow">MediaForge</p>
            <h1>Multimedia processing without upload or compromise.</h1>
          </div>
          <div className="topbar-actions">
            <div className={`status-banner ${isOnline ? '' : 'offline'}`} data-testid="status-banner">
              <span>{statusLabel}</span>
              <span>{clock.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            <button
              type="button"
              className="accent-toggle"
              data-testid="accent-toggle"
              onClick={() => setAccent(accent === 'lime' ? 'cyan' : 'lime')}
            >
              {accent === 'lime' ? 'LIME' : 'CYAN'} // ACCENT
            </button>
          </div>
        </header>

        <nav className="tool-tabs" aria-label="Tool selection">
          {[
            ['converter', 'VIDEO ⇄ AUDIO'],
            ['frames', 'FRAME EXTRACTOR'],
            ['sticker', 'STICKER MAKER'],
          ].map(([id, label]) => (
            <button
              key={id}
              type="button"
              className={`tab ${activeTool === id ? 'active' : ''}`}
              data-testid={`tool-tab-${id}`}
              onClick={() => setActiveTool(id as ToolKey)}
            >
              {label}
            </button>
          ))}
        </nav>

        <main className="workspace">
          {activeTool === 'converter' ? <ConverterTool /> : null}
          {activeTool === 'frames' ? <FrameExtractorTool /> : null}
          {activeTool === 'sticker' ? <StickerMakerTool /> : null}
        </main>

        <footer className="footer-stack">
          <div className="footer-marquee" aria-label="Privacy statement">
            <span>ZERO UPLOADS · ZERO TELEMETRY · ZERO COMPROMISE</span>
            <span>ZERO UPLOADS · ZERO TELEMETRY · ZERO COMPROMISE</span>
          </div>

          <div className="footer-note">
            Made with
            <span className="footer-love-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 21s-6.95-4.02-9.24-7.26C1.56 10.3 1.5 7.75 3.34 5.86 5.31 3.85 8.4 3.67 10.22 5.5L12 7.3l1.78-1.8c1.82-1.83 4.91-1.65 6.88.36 1.84 1.9 1.78 4.44-.42 8.88C18.95 16.98 12 21 12 21Z" />
              </svg>
            </span>
            by Abhiraj Sujata Ashok Ukirde
          </div>
        </footer>

        <SocialSidebar open={socialOpen} onToggle={setSocialOpen} />
      </div>
    </AccentContext.Provider>
  )
}

const socialLinks = [
  {
    href: 'https://www.linkedin.com/in/abhiraj-ashok-ukirde-652b1032a/?lipi=urn%3Ali%3Apage%3Ad_flagship3_profile_view_base_contact_details%3BjTfqVpguQJi2U8YAlVWz1A%3D%3D',
    label: 'LinkedIn',
    icon: 'linkedin',
  },
  {
    href: 'https://www.instagram.com/versatile_abhi_18?igsh=NGh0Ynpya2s1eGJz',
    label: 'Instagram',
    icon: 'instagram',
  },
  {
    href: 'https://github.com/versatileabhi',
    label: 'GitHub',
    icon: 'github',
  },
  {
    href: 'mailto:abhi.ukirde.tools@gmail.com',
    label: 'Email',
    icon: 'mail',
  },
]

function SocialSidebar({ open, onToggle }: { open: boolean; onToggle: (value: boolean) => void }) {
  return (
    <aside className={`social-sidebar ${open ? 'open' : ''}`}>
      <button
        type="button"
        className="social-sidebar__toggle"
        onClick={() => onToggle(!open)}
        aria-expanded={open}
        aria-label={open ? 'Close social sidebar' : 'Open social sidebar'}
      >
        {open ? '✕' : '☰'}
      </button>
      <div className="social-sidebar__panel" aria-hidden={!open}>
        <div className="social-sidebar__content">
          <div className="social-sidebar__header">Connect</div>
          <div className="social-sidebar__links">
            {socialLinks.map((link) => (
              <a key={link.label} href={link.href} target="_blank" rel="noreferrer" className="social-sidebar__item">
                <span className="social-icon" aria-hidden="true">
                  {(() => {
                    switch (link.icon) {
                      case 'linkedin':
                        return (
                          <svg viewBox="0 0 24 24" aria-hidden="true">
                            <path d="M6.94 8.5A1.56 1.56 0 1 0 6.94 5.38a1.56 1.56 0 0 0 0 3.12ZM5.5 9.75h2.88V18H5.5zM10.2 9.75h2.76v1.12h.04c.38-.72 1.32-1.48 2.72-1.48 2.91 0 3.44 1.91 3.44 4.39V18H16.2v-7.48c0-1.78-.03-4.08-2.48-4.08-2.49 0-2.87 1.94-2.87 3.95V18H10.2z" />
                          </svg>
                        )
                      case 'instagram':
                        return (
                          <svg viewBox="0 0 24 24" aria-hidden="true">
                            <path d="M7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4Zm0 2a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H7Zm5 3.2A3.8 3.8 0 1 1 8.2 12 3.8 3.8 0 0 1 12 8.2Zm0 2A1.8 1.8 0 1 0 13.8 12 1.8 1.8 0 0 0 12 10.2Zm4.6-4.4a1 1 0 1 1-1 1 1 1 0 0 1 1-1Z" />
                          </svg>
                        )
                      case 'github':
                        return (
                          <svg viewBox="0 0 24 24" aria-hidden="true">
                            <path d="M12 2a10 10 0 0 0-3.16 19.18c.5.09.68-.22.68-.48v-1.7c-2.77.6-3.36-1.34-3.36-1.34-.45-1.15-1.1-1.46-1.1-1.46-.9-.62.07-.61.07-.61 1 .07 1.53 1.03 1.53 1.03.89 1.52 2.33 1.08 2.9.82.09-.64.35-1.08.63-1.33-2.22-.25-4.55-1.11-4.55-4.93 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.64 0 0 .84-.27 2.75 1.02A9.56 9.56 0 0 1 12 6.84c.85 0 1.71.11 2.51.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.37.2 2.39.1 2.64.64.7 1.03 1.59 1.03 2.68 0 3.83-2.34 4.68-4.57 4.92.36.31.68.93.68 1.87v2.77c0 .27.18.58.69.48A10 10 0 0 0 12 2Z" />
                          </svg>
                        )
                      case 'mail':
                        return (
                          <svg viewBox="0 0 24 24" aria-hidden="true">
                            <path d="M4 5h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Zm0 2v1.2l8 5.33 8-5.33V7H4Zm16 10V9.8l-7.2 4.8a1 1 0 0 1-1.07 0L4 9.8V17h16Z" />
                          </svg>
                        )
                    }
                  })()}
                </span>
                <span>{link.label}</span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </aside>
  )
}

function ConverterTool() {
  const [mode, setMode] = useState<'videoToAudio' | 'audioToVideo'>('videoToAudio')
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [loopCount, setLoopCount] = useState(2)
  const [exportType, setExportType] = useState<'wav' | 'mp3'>('wav')
  const [status, setStatus] = useState('Load a local file and export in-browser.')
  const [outputUrl, setOutputUrl] = useState<string | null>(null)
  const [outputName, setOutputName] = useState('')

  const handleConvert = async () => {
    if (mode === 'videoToAudio') {
      if (!videoFile) {
        setStatus('Choose a local video file first.')
        return
      }
      try {
        setStatus(`Transcoding ${videoFile.name} to ${exportType.toUpperCase()}...`)
        const { blob, outputName } = await exportAudioFromVideo(videoFile, exportType)
        const url = URL.createObjectURL(blob)
        setOutputUrl(url)
        setOutputName(outputName)
        setStatus(`Audio export ready from ${videoFile.name}.`)
      } catch (error) {
        const message = error instanceof Error ? error.message : 'unknown error'
        setStatus(`Export failed: ${message}`)
      }
      return
    }

    if (!audioFile || !imageFile) {
      setStatus('Choose both an audio file and a still image for the looped video export.')
      return
    }

    try {
      const audioUrl = URL.createObjectURL(audioFile)
      const audioElement = document.createElement('audio')
      audioElement.src = audioUrl
      audioElement.preload = 'auto'
      audioElement.muted = true
      audioElement.style.display = 'none'
      document.body.appendChild(audioElement)

      const imageBitmap = await loadImageBitmap(imageFile)
      const canvas = document.createElement('canvas')
      canvas.width = 1280
      canvas.height = 720
      const ctx = canvas.getContext('2d')
      const stream = canvas.captureStream(30)
      const audioContext = new AudioContext()
      await audioContext.resume()
      const source = audioContext.createMediaElementSource(audioElement)
      const destination = audioContext.createMediaStreamDestination()
      source.connect(destination)
      source.connect(audioContext.destination)

      const combinedStream = new MediaStream([
        ...stream.getVideoTracks(),
        ...destination.stream.getAudioTracks(),
      ])
      const recorder = new MediaRecorder(combinedStream)
      const chunks: BlobPart[] = []
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunks.push(event.data)
      }

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' })
        const url = URL.createObjectURL(blob)
        setOutputUrl(url)
        setOutputName(`${audioFile.name.replace(/\.[^.]+$/, '')}-loop.webm`)
        setStatus(`Looped video ready with ${loopCount} cycles.`)
        audioElement.remove()
        audioContext.close().catch(() => undefined)
        URL.revokeObjectURL(audioUrl)
      }

      const drawFrame = (time: number) => {
        if (!ctx) return
        const hue = (time * 10) % 360
        ctx.fillStyle = `hsl(${hue}, 78%, 94%)`
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(imageBitmap, 80, 120, 1120, 560)
        ctx.fillStyle = '#000'
        ctx.font = '48px Arial'
        ctx.fillText('OFF/GRID // LOOP', 80, 90)
        ctx.fillText(`CYCLE ${Math.floor(time * 2) % loopCount + 1}`, 80, 640)
      }

      recorder.start()
      const durationSeconds = (audioElement.duration || 3) * loopCount
      const start = performance.now()
      const tick = () => {
        const elapsed = (performance.now() - start) / 1000
        drawFrame(elapsed)
        if (elapsed < durationSeconds) {
          window.requestAnimationFrame(tick)
        } else {
          recorder.stop()
        }
      }
      await audioElement.play()
      tick()
      setStatus('Recording a looped preview stream...')
    } catch (error) {
      setStatus(`Video export failed: ${error instanceof Error ? error.message : 'unknown error'}`)
    }
  }

  return (
    <section className="tool-card">
      <div className="tool-heading">
        <div>
          <p className="eyebrow">TOOL 01</p>
          <h2>VIDEO ⇄ AUDIO CONVERTER</h2>
        </div>
        <p className="muted">Client-side, local-first conversion with a brutalist workbench.</p>
      </div>

      <div className="selector-row">
        <button
          type="button"
          className={`pill ${mode === 'videoToAudio' ? 'active' : ''}`}
          data-testid="converter-mode-video"
          onClick={() => setMode('videoToAudio')}
        >
          VIDEO → AUDIO
        </button>
        <button
          type="button"
          className={`pill ${mode === 'audioToVideo' ? 'active' : ''}`}
          data-testid="converter-mode-audio"
          onClick={() => setMode('audioToVideo')}
        >
          AUDIO → VIDEO
        </button>
      </div>

      <div className="dual-grid">
        <div className="panel">
          <label className="field">
            <span>{mode === 'videoToAudio' ? 'VIDEO FILE' : 'AUDIO FILE'}</span>
            <input
              type="file"
              accept={mode === 'videoToAudio' ? 'video/*' : 'audio/*'}
              data-testid={mode === 'videoToAudio' ? 'converter-input-video' : 'converter-input-audio'}
              onChange={(event) => {
                const file = event.target.files?.[0] ?? null
                if (mode === 'videoToAudio') setVideoFile(file)
                else setAudioFile(file)
              }}
            />
          </label>

          {mode === 'audioToVideo' ? (
            <label className="field">
              <span>STILL IMAGE</span>
              <input
                type="file"
                accept="image/*"
                data-testid="converter-input-image"
                onChange={(event) => setImageFile(event.target.files?.[0] ?? null)}
              />
            </label>
          ) : null}

          <label className="field">
            <span>OUTPUT FORMAT</span>
            <select
              value={mode === 'videoToAudio' ? exportType : 'webm'}
              data-testid="converter-export-format"
              onChange={(event) => setExportType(event.target.value as 'wav' | 'mp3')}
            >
              {mode === 'videoToAudio' ? (
                <>
                  <option value="wav">WAV</option>
                  <option value="mp3">MP3</option>
                </>
              ) : (
                <option value="webm">WEBM</option>
              )}
            </select>
          </label>

          {mode === 'audioToVideo' ? (
            <label className="field">
              <span>LOOP COUNT</span>
              <input
                type="range"
                min="1"
                max="5"
                value={loopCount}
                data-testid="converter-loop-count"
                onChange={(event) => setLoopCount(Number(event.target.value))}
              />
              <span className="value-pill">{loopCount}</span>
            </label>
          ) : null}

          <button
            type="button"
            className="primary-btn"
            data-testid="converter-run"
            onClick={handleConvert}
          >
            {mode === 'videoToAudio' ? 'EXTRACT AUDIO' : 'BUILD LOOPED VIDEO'}
          </button>
        </div>

        <div className="panel">
          <p className="eyebrow">STATUS</p>
          <p>{status}</p>
          {outputUrl ? (
            <div className="output-box">
              <p className="eyebrow">READY</p>
              <p>{outputName}</p>
              <a href={outputUrl} download={outputName} className="primary-btn inline-btn">
                DOWNLOAD
              </a>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  )
}

function FrameExtractorTool() {
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [jumpValue, setJumpValue] = useState('0')
  const [exportFormat, setExportFormat] = useState<'png' | 'jpeg'>('png')
  const [captures, setCaptures] = useState<CaptureItem[]>([])
  const [status, setStatus] = useState('Load a clip to begin extracting frames.')
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  const handleFile = (file: File | null) => {
    if (!file) return
    const url = URL.createObjectURL(file)
    setVideoUrl(url)
    setStatus(`Loaded ${file.name}. Seek and capture frames locally.`)
  }

  const seekTo = (value: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = value
      setCurrentTime(value)
    }
  }

  const jumpBySeconds = (delta: number) => {
    if (videoRef.current) {
      const next = Math.max(0, Math.min(duration, videoRef.current.currentTime + delta))
      seekTo(next)
    }
  }

  const jumpByFrame = (delta: number) => {
    if (videoRef.current) {
      const next = Math.max(0, Math.min(duration, videoRef.current.currentTime + delta / 30))
      seekTo(next)
    }
  }

  const captureFrame = async () => {
    if (!videoRef.current || !canvasRef.current) return
    const canvas = canvasRef.current
    const video = videoRef.current
    canvas.width = video.videoWidth || 1280
    canvas.height = video.videoHeight || 720
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    const blob = await new Promise<Blob | null>((resolve) => {
      const mime = exportFormat === 'jpeg' ? 'image/jpeg' : 'image/png'
      canvas.toBlob((value) => resolve(value), mime, exportFormat === 'jpeg' ? 0.92 : undefined)
    })
    if (!blob) return
    const dataUrl = URL.createObjectURL(blob)
    const item: CaptureItem = {
      id: `${Date.now()}-${captures.length}`,
      name: `frame-${formatTime(Math.floor(currentTime))}`,
      dataUrl,
      timestamp: currentTime,
    }
    setCaptures((previous) => [item, ...previous].slice(0, 12))
    setStatus(`Captured frame at ${formatTime(Math.floor(currentTime))}.`)
  }

  return (
    <section className="tool-card">
      <div className="tool-heading">
        <div>
          <p className="eyebrow">TOOL 02</p>
          <h2>FRAME EXTRACTOR</h2>
        </div>
        <p className="muted">Frame-perfect capture from local footage, exported without uploading anything.</p>
      </div>

      <div className="dual-grid">
        <div className="panel">
          <label className="field">
            <span>VIDEO FILE</span>
            <input
              type="file"
              accept="video/*"
              data-testid="frame-input"
              onChange={(event) => handleFile(event.target.files?.[0] ?? null)}
            />
          </label>

          {videoUrl ? (
            <>
              <video
                ref={videoRef}
                className="media-preview"
                src={videoUrl}
                controls
                onLoadedMetadata={() => {
                  if (videoRef.current) {
                    setDuration(videoRef.current.duration)
                    setCurrentTime(videoRef.current.currentTime)
                  }
                }}
                onTimeUpdate={() => {
                  if (videoRef.current) setCurrentTime(videoRef.current.currentTime)
                }}
              />
              <label className="field">
                <span>SEEK</span>
                <input
                  type="range"
                  min="0"
                  max={duration || 1}
                  step="0.001"
                  value={currentTime}
                  data-testid="frame-seek"
                  onChange={(event) => seekTo(Number(event.target.value))}
                />
              </label>
              <div className="button-stack">
                <button type="button" className="pill" data-testid="frame-jump-minus" onClick={() => jumpBySeconds(-1)}>
                  −1s
                </button>
                <button type="button" className="pill" data-testid="frame-jump-plus" onClick={() => jumpBySeconds(1)}>
                  +1s
                </button>
                <button type="button" className="pill" data-testid="frame-jump-frame-minus" onClick={() => jumpByFrame(-1)}>
                  −1f
                </button>
                <button type="button" className="pill" data-testid="frame-jump-frame-plus" onClick={() => jumpByFrame(1)}>
                  +1f
                </button>
              </div>
              <label className="field">
                <span>TIME INPUT</span>
                <div className="inline-row">
                  <input
                    value={jumpValue}
                    data-testid="frame-time-input"
                    onChange={(event) => setJumpValue(event.target.value)}
                  />
                  <button
                    type="button"
                    className="primary-btn"
                    data-testid="frame-time-apply"
                    onClick={() => {
                      const seconds = parseTimeInput(jumpValue)
                      seekTo(seconds)
                    }}
                  >
                    GO
                  </button>
                </div>
              </label>
              <label className="field">
                <span>EXPORT</span>
                <select
                  value={exportFormat}
                  data-testid="frame-export-format"
                  onChange={(event) => setExportFormat(event.target.value as 'png' | 'jpeg')}
                >
                  <option value="png">PNG</option>
                  <option value="jpeg">JPEG</option>
                </select>
              </label>
              <button type="button" className="primary-btn" data-testid="frame-capture" onClick={captureFrame}>
                CAPTURE FRAME
              </button>
            </>
          ) : null}
        </div>

        <div className="panel">
          <p className="eyebrow">STATUS</p>
          <p>{status}</p>
          <canvas ref={canvasRef} className="hidden-canvas" />
          <div className="contact-sheet">
            {captures.length === 0 ? <p className="muted">No captures yet.</p> : null}
            {captures.map((capture) => (
              <div key={capture.id} className="capture-card">
                <img src={capture.dataUrl} alt={capture.name} />
                <div>
                  <p>{capture.name}</p>
                  <p className="muted">{formatTime(Math.floor(capture.timestamp))}</p>
                  <a href={capture.dataUrl} download={`${capture.name}.${exportFormat}`} className="inline-link">
                    DOWNLOAD
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function StickerMakerTool() {
  const [brushMode, setBrushMode] = useState<BrushMode>('erase')
  const [brushSize, setBrushSize] = useState(48)
  const [previewAlpha, setPreviewAlpha] = useState(100)
  const [outlineEnabled, setOutlineEnabled] = useState(true)
  const [outlineThickness, setOutlineThickness] = useState(12)
  const [outlineColor, setOutlineColor] = useState('#00ffff')
  const [status, setStatus] = useState('Drop a local image and mask it into a sticker.')
  const [isDragging, setIsDragging] = useState(false)
  const baseCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const maskCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const displayCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const historyRef = useRef<ImageData[]>([])

  const drawCheckerboard = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const tile = 20
    ctx.clearRect(0, 0, width, height)
    for (let y = 0; y < height; y += tile) {
      for (let x = 0; x < width; x += tile) {
        const filled = (x / tile + y / tile) % 2 === 0
        ctx.fillStyle = filled ? '#d4fc34' : '#ffffff'
        ctx.fillRect(x, y, tile, tile)
      }
    }
  }

  const redrawPreview = () => {
    const baseCanvas = baseCanvasRef.current
    const maskCanvas = maskCanvasRef.current
    const displayCanvas = displayCanvasRef.current
    if (!baseCanvas || !maskCanvas || !displayCanvas) return
    const ctx = displayCanvas.getContext('2d')
    if (!ctx) return
    const width = baseCanvas.width
    const height = baseCanvas.height
    drawCheckerboard(ctx, width, height)
    ctx.save()
    ctx.globalAlpha = previewAlpha / 100
    ctx.drawImage(baseCanvas, 0, 0)
    ctx.globalCompositeOperation = 'destination-in'
    ctx.drawImage(maskCanvas, 0, 0)
    ctx.restore()
  }

  const pushHistory = () => {
    const maskCanvas = maskCanvasRef.current
    if (!maskCanvas) return
    const ctx = maskCanvas.getContext('2d')
    if (!ctx) return
    const data = ctx.getImageData(0, 0, maskCanvas.width, maskCanvas.height)
    historyRef.current = [...historyRef.current, data].slice(-30)
  }

  const resetMask = () => {
    const maskCanvas = maskCanvasRef.current
    if (!maskCanvas) return
    const ctx = maskCanvas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, maskCanvas.width, maskCanvas.height)
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, maskCanvas.width, maskCanvas.height)
    redrawPreview()
    historyRef.current = []
  }

  const undoMask = () => {
    const maskCanvas = maskCanvasRef.current
    if (!maskCanvas) return
    const ctx = maskCanvas.getContext('2d')
    if (!ctx) return
    const previous = historyRef.current.pop()
    if (!previous) return
    ctx.putImageData(previous, 0, 0)
    redrawPreview()
  }

  const handleImageLoad = (file: File | null) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const url = reader.result as string
      const img = new Image()
      img.onload = () => {
        const baseCanvas = baseCanvasRef.current
        const maskCanvas = maskCanvasRef.current
        const displayCanvas = displayCanvasRef.current
        if (!baseCanvas || !maskCanvas || !displayCanvas) return
        const width = 1024
        const height = (img.height / img.width) * width
        baseCanvas.width = width
        baseCanvas.height = height
        maskCanvas.width = width
        maskCanvas.height = height
        displayCanvas.width = width
        displayCanvas.height = height
        const baseCtx = baseCanvas.getContext('2d')
        const maskCtx = maskCanvas.getContext('2d')
        if (!baseCtx || !maskCtx) return
        baseCtx.drawImage(img, 0, 0, width, height)
        maskCtx.clearRect(0, 0, width, height)
        maskCtx.fillStyle = '#ffffff'
        maskCtx.fillRect(0, 0, width, height)
        redrawPreview()
      }
      img.src = url
    }
    reader.readAsDataURL(file)
  }

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragging(false)
    const file = event.dataTransfer.files?.[0]
    if (file) handleImageLoad(file)
  }

  const handlePaint = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const displayCanvas = displayCanvasRef.current
    const maskCanvas = maskCanvasRef.current
    if (!displayCanvas || !maskCanvas) return
    const rect = displayCanvas.getBoundingClientRect()
    const x = ((event.clientX - rect.left) / rect.width) * displayCanvas.width
    const y = ((event.clientY - rect.top) / rect.height) * displayCanvas.height
    const ctx = maskCanvas.getContext('2d')
    if (!ctx) return
    pushHistory()
    ctx.save()
    ctx.beginPath()
    ctx.arc(x, y, brushSize / 2, 0, Math.PI * 2)
    ctx.fillStyle = brushMode === 'erase' ? 'rgba(0,0,0,1)' : 'rgba(255,255,255,1)'
    ctx.globalCompositeOperation = brushMode === 'erase' ? 'destination-out' : 'source-over'
    ctx.fill()
    ctx.restore()
    redrawPreview()
  }

  const autoRemoveBackground = () => {
    const baseCanvas = baseCanvasRef.current
    const maskCanvas = maskCanvasRef.current
    if (!baseCanvas || !maskCanvas) return
    const baseCtx = baseCanvas.getContext('2d')
    const maskCtx = maskCanvas.getContext('2d')
    if (!baseCtx || !maskCtx) return
    const data = baseCtx.getImageData(0, 0, baseCanvas.width, baseCanvas.height).data
    const sample = Array.from({ length: 64 }, (_, index) => {
      const x = (index % 8) * Math.floor(baseCanvas.width / 8)
      const y = Math.floor(index / 8) * Math.floor(baseCanvas.height / 8)
      const offset = (y * baseCanvas.width + x) * 4
      return [data[offset], data[offset + 1], data[offset + 2]] as const
    })
    const dominant = sample.reduce(
      (best, current) => {
        const bestDistance = Math.hypot(best[0] - 255, best[1] - 255, best[2] - 255)
        const currentDistance = Math.hypot(current[0] - 255, current[1] - 255, current[2] - 255)
        return currentDistance > bestDistance ? current : best
      },
      [255, 255, 255] as const,
    )

    pushHistory()
    maskCtx.clearRect(0, 0, maskCanvas.width, maskCanvas.height)
    maskCtx.fillStyle = '#ffffff'
    maskCtx.fillRect(0, 0, maskCanvas.width, maskCanvas.height)
    const imageData = maskCtx.getImageData(0, 0, maskCanvas.width, maskCanvas.height)
    const pixels = imageData.data
    for (let index = 0; index < pixels.length; index += 4) {
      const r = data[index]
      const g = data[index + 1]
      const b = data[index + 2]
      if (Math.abs(r - dominant[0]) < 24 && Math.abs(g - dominant[1]) < 24 && Math.abs(b - dominant[2]) < 24) {
        pixels[index + 3] = 0
      }
    }
    maskCtx.putImageData(imageData, 0, 0)
    redrawPreview()
    setStatus('Auto-removal applied with a local color-based mask pass.')
  }

  const exportSticker = () => {
    const baseCanvas = baseCanvasRef.current
    const maskCanvas = maskCanvasRef.current
    const displayCanvas = displayCanvasRef.current
    if (!baseCanvas || !maskCanvas || !displayCanvas) return
    const exportCanvas = document.createElement('canvas')
    exportCanvas.width = baseCanvas.width
    exportCanvas.height = baseCanvas.height
    const ctx = exportCanvas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, exportCanvas.width, exportCanvas.height)
    ctx.save()
    ctx.globalAlpha = previewAlpha / 100
    ctx.drawImage(baseCanvas, 0, 0)
    ctx.globalCompositeOperation = 'destination-in'
    ctx.drawImage(maskCanvas, 0, 0)
    ctx.restore()
    if (outlineEnabled) {
      ctx.strokeStyle = outlineColor
      ctx.lineWidth = outlineThickness
      ctx.strokeRect(outlineThickness / 2, outlineThickness / 2, exportCanvas.width - outlineThickness, exportCanvas.height - outlineThickness)
    }
    exportCanvas.toBlob((blob) => {
      if (!blob) return
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'sticker-export.png'
      link.click()
      URL.revokeObjectURL(url)
      setStatus('Sticker exported as a transparent PNG with outline baked in.')
    }, 'image/png')
  }

  return (
    <section className="tool-card">
      <div className="tool-heading">
        <div>
          <p className="eyebrow">TOOL 03</p>
          <h2>STICKER MAKER</h2>
        </div>
        <p className="muted">Erase, restore, and export stickers with a transparent cutout and brutalist outline.</p>
      </div>

      <div className="dual-grid">
        <div className="panel">
          <label className="field">
            <span>IMAGE FILE</span>
            <input
              type="file"
              accept="image/*"
              data-testid="sticker-input"
              onChange={(event) => handleImageLoad(event.target.files?.[0] ?? null)}
            />
          </label>
          <div
            className={`dropzone ${isDragging ? 'dragging' : ''}`}
            data-testid="sticker-dropzone"
            onDrop={handleDrop}
            onDragOver={(event) => {
              event.preventDefault()
              setIsDragging(true)
            }}
            onDragLeave={() => setIsDragging(false)}
          >
            Drop image here or use the picker above.
          </div>
          <div className="button-stack">
            <button type="button" className={`pill ${brushMode === 'erase' ? 'active' : ''}`} onClick={() => setBrushMode('erase')}>
              ERASE
            </button>
            <button type="button" className={`pill ${brushMode === 'restore' ? 'active' : ''}`} onClick={() => setBrushMode('restore')}>
              RESTORE
            </button>
          </div>
          <label className="field">
            <span>BRUSH SIZE</span>
            <input type="range" min="4" max="120" value={brushSize} onChange={(event) => setBrushSize(Number(event.target.value))} />
          </label>
          <div className="button-stack">
            <button type="button" className="pill" onClick={undoMask}>
              UNDO
            </button>
            <button type="button" className="pill" onClick={resetMask}>
              RESET
            </button>
            <button type="button" className="primary-btn" onClick={autoRemoveBackground}>
              AUTO REMOVE
            </button>
          </div>
        </div>

        <div className="panel">
          <p className="eyebrow">STATUS</p>
          <p>{status}</p>
          <canvas
            ref={displayCanvasRef}
            className="sticker-canvas"
            data-testid="sticker-canvas"
            onPointerDown={(event) => {
              handlePaint(event)
              event.currentTarget.setPointerCapture(event.pointerId)
            }}
            onPointerMove={(event) => {
              if (event.buttons === 1) handlePaint(event)
            }}
            onPointerUp={(event) => event.currentTarget.releasePointerCapture(event.pointerId)}
          />
          <canvas ref={baseCanvasRef} className="hidden-canvas" />
          <canvas ref={maskCanvasRef} className="hidden-canvas" />
          <label className="field">
            <span>PREVIEW TRANSPARENCY</span>
            <input type="range" min="20" max="100" value={previewAlpha} onChange={(event) => setPreviewAlpha(Number(event.target.value))} />
          </label>
          <label className="field">
            <span>OUTLINE</span>
            <input type="checkbox" checked={outlineEnabled} onChange={() => setOutlineEnabled((value) => !value)} />
          </label>
          <label className="field">
            <span>OUTLINE WEIGHT</span>
            <input type="range" min="0" max="60" value={outlineThickness} onChange={(event) => setOutlineThickness(Number(event.target.value))} />
          </label>
          <div className="swatches">
            {['#ffffff', '#000000', '#d4fc34', '#00ffff'].map((color) => (
              <button
                key={color}
                type="button"
                className={`swatch ${outlineColor === color ? 'active' : ''}`}
                onClick={() => setOutlineColor(color)}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
          <button type="button" className="primary-btn" onClick={exportSticker}>
            EXPORT PNG
          </button>
        </div>
      </div>
    </section>
  )
}

async function loadImageBitmap(file: File) {
  const imageUrl = URL.createObjectURL(file)
  const image = new Image()
  const loaded = await new Promise<HTMLImageElement>((resolve, reject) => {
    image.onload = () => resolve(image)
    image.onerror = reject
    image.src = imageUrl
  })
  URL.revokeObjectURL(imageUrl)
  return loaded
}

export default App
