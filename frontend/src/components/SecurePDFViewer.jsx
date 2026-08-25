import React, { useEffect, useRef, useState } from 'react'
import { GlobalWorkerOptions, getDocument } from 'pdfjs-dist'
import PdfJsWorker from 'pdfjs-dist/build/pdf.worker.mjs?worker'
import { toast } from 'sonner'
import { ZoomIn, ZoomOut, Loader2, Maximize, Minimize } from 'lucide-react'

export default function SecurePDFViewer({ srcUrl, token, watermarkText }) {
  const containerRef = useRef(null)
  const [scale, setScale] = useState(() => window.innerWidth < 640 ? 0.6 : 0.8)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [numPages, setNumPages] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Security: disable right-click, print/save shortcuts, and browser print dialog
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    
    // Block right-click context menu
    const onContext = (e) => e.preventDefault()
    
    // Block keyboard shortcuts (Ctrl+P, Ctrl+S, PrintScreen)
    const onKeyDown = (e) => {
      const key = e.key.toLowerCase()
      const ctrl = e.ctrlKey || e.metaKey
      if ((ctrl && (key === 'p' || key === 's')) || key === 'printscreen') {
        e.preventDefault()
        e.stopPropagation()
        toast.warning('Printing and saving are disabled for this protected document.')
        return false
      }
    }
    
    // Block browser print dialog (File → Print, or window.print())
    const blockPrint = (e) => {
      e.preventDefault()
      toast.warning('Printing is disabled for this protected document.')
      return false
    }
    
    // Override window.print() function
    const originalPrint = window.print
    window.print = () => {
      toast.warning('Printing is disabled for this protected document.')
      return false
    }
    
    // Block beforeprint event (fires when print dialog opens)
    window.addEventListener('beforeprint', blockPrint)
    
    // Block afterprint event (fires when print dialog closes)
    window.addEventListener('afterprint', blockPrint)
    
    document.addEventListener('contextmenu', onContext)
    document.addEventListener('keydown', onKeyDown, true)
    
    return () => {
      document.removeEventListener('contextmenu', onContext)
      document.removeEventListener('keydown', onKeyDown, true)
      window.removeEventListener('beforeprint', blockPrint)
      window.removeEventListener('afterprint', blockPrint)
      window.print = originalPrint // Restore original print function
    }
  }, [])

  // Add CSS to block printing completely at OS level
  useEffect(() => {
    const style = document.createElement('style')
    style.textContent = `
      @media print {
        body * { visibility: hidden !important; }
        body::before {
          content: "Printing is disabled for this protected document.";
          visibility: visible !important; display: block; position: fixed;
          top: 50%; left: 50%; transform: translate(-50%, -50%);
          font-size: 24px; color: #000;
        }
      }
    `
    document.head.appendChild(style)
    return () => document.head.removeChild(style)
  }, [])

  // Render PDF with PDF.js
  useEffect(() => {
    let cancelled = false
    const container = containerRef.current
    if (!container) return

    // Ensure worker is configured once
    if (!GlobalWorkerOptions.workerPort) {
      GlobalWorkerOptions.workerPort = new PdfJsWorker()
    }

    async function load() {
      try {
        setLoading(true)
        setError(null)
        container.innerHTML = '' // Clear previous renders

        const res = await fetch(srcUrl, { headers: { Authorization: `Bearer ${token}` } })
        if (!res.ok) {
          const msg = await res.text().catch(() => '')
          setError(`Failed to load PDF (${res.status}): ${msg}`)
          setLoading(false)
          return
        }
        
        const buf = await res.arrayBuffer()
        if (cancelled) return

        const pdf = await getDocument({ data: buf }).promise
        setNumPages(pdf.numPages)
        container.innerHTML = ''
        
        for (let p = 1; p <= pdf.numPages; p++) {
          const page = await pdf.getPage(p)
          const viewport = page.getViewport({ scale })
          const canvas = document.createElement('canvas')
          const ctx = canvas.getContext('2d')
          
          const pixelRatio = window.devicePixelRatio || 1
          
          canvas.width = Math.floor(viewport.width * pixelRatio)
          canvas.height = Math.floor(viewport.height * pixelRatio)
          canvas.style.width = `${Math.floor(viewport.width)}px`
          canvas.style.height = `${Math.floor(viewport.height)}px`
          
          canvas.className = 'mx-auto mb-4 bg-white dark:invert dark:hue-rotate-180 shadow-card border border-slate-200 dark:border-slate-700'
          canvas.style.display = 'block'
          
          ctx.scale(pixelRatio, pixelRatio)
          
          container.appendChild(canvas)
          await page.render({ canvasContext: ctx, viewport }).promise
        }
      } catch (err) {
        console.error('PDF load error', err)
        setError(err?.message || 'Failed to parse PDF document')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [srcUrl, token, scale])

  return (
    <div className={isFullscreen 
      ? "fixed inset-0 z-50 bg-slate-900 flex flex-col w-full h-full" 
      : "flex flex-col border border-slate-200 dark:border-slate-700 rounded-md overflow-hidden bg-slate-50 dark:bg-slate-950"}
    >
      {/* Toolbar */}
      <div className={`flex items-center justify-between px-4 py-2 border-b ${isFullscreen ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700'}`}>
        <div className={`text-sm font-medium ${isFullscreen ? 'text-slate-300' : 'text-slate-600 dark:text-slate-300'}`}>
          {loading ? 'Loading...' : `${numPages} page${numPages !== 1 ? 's' : ''}`}
        </div>
        <div className="flex items-center gap-1">
          <button 
            onClick={() => setScale(s => Math.max(0.5, s - 0.2))}
            className={`p-1.5 rounded-md transition-colors ${isFullscreen ? 'text-slate-400 hover:text-white hover:bg-slate-700' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-50 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
            title="Zoom out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className={`text-xs font-medium w-12 text-center ${isFullscreen ? 'text-slate-300' : 'text-slate-500 dark:text-slate-400'}`}>
            {Math.round(scale * 100)}%
          </span>
          <button 
            onClick={() => setScale(s => Math.min(2.5, s + 0.2))}
            className={`p-1.5 rounded-md transition-colors ${isFullscreen ? 'text-slate-400 hover:text-white hover:bg-slate-700' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-50 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
            title="Zoom in"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <div className={`w-px h-4 mx-1 ${isFullscreen ? 'bg-slate-700' : 'bg-slate-200'}`} />
          <button 
            onClick={() => setIsFullscreen(!isFullscreen)}
            className={`p-1.5 rounded-md transition-colors ${isFullscreen ? 'text-slate-400 hover:text-white hover:bg-slate-700' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-50 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
            title={isFullscreen ? "Exit Full Screen" : "Full Screen"}
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Viewer Area Wrapper */}
      <div className={`relative flex-1 flex flex-col overflow-hidden ${isFullscreen ? 'bg-slate-900' : ''}`} style={{ maxHeight: isFullscreen ? 'calc(100vh - 50px)' : 'calc(100vh - 200px)', minHeight: isFullscreen ? 'auto' : '60vh' }}>
        
        {/* Scrollable Document Area */}
        <div className="overflow-auto p-4 flex-1 w-full flex flex-col items-center">
          <div ref={containerRef} className="relative z-0" />
        </div>

        {loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 z-50">
            <Loader2 className="w-8 h-8 text-[#0F766E] animate-spin mb-4" />
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium animate-pulse">Decrypting and loading PDF...</p>
          </div>
        )}
        
        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 z-50 px-4 text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-3">
              <span className="text-red-600 font-bold">!</span>
            </div>
            <p className="text-slate-900 dark:text-slate-50 font-medium">{error}</p>
          </div>
        )}
      </div>
    </div>
  )
}
