import React, { useEffect, useRef, useState } from 'react'
import { GlobalWorkerOptions, getDocument } from 'pdfjs-dist'
import PdfJsWorker from 'pdfjs-dist/build/pdf.worker.mjs?worker'
import { toast } from 'sonner'
import { ZoomIn, ZoomOut, Loader2 } from 'lucide-react'

export default function SecurePDFViewer({ srcUrl, token, watermarkText }) {
  const containerRef = useRef(null)
  const overlayRef = useRef(null)
  const [scale, setScale] = useState(1.2)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [numPages, setNumPages] = useState(0)

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
          
          canvas.width = Math.floor(viewport.width)
          canvas.height = Math.floor(viewport.height)
          canvas.className = 'mx-auto mb-4 bg-white shadow-card border border-slate-200'
          canvas.style.display = 'block'
          
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

  // Watermark overlay
  useEffect(() => {
    const overlay = overlayRef.current
    if (!overlay) return
    overlay.textContent = watermarkText
  }, [watermarkText])

  const overlayStyle = {
    position: 'fixed', inset: 0, pointerEvents: 'none',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 'min(5vw, 42px)', color: 'rgba(0,0,0,0.12)',
    transform: 'rotate(-25deg)', textAlign: 'center',
    whiteSpace: 'pre-wrap', userSelect: 'none', zIndex: 1000,
    fontWeight: 'bold'
  }

  return (
    <div className="flex flex-col border border-slate-200 rounded-md overflow-hidden bg-slate-50">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-slate-200 bg-white">
        <div className="text-sm font-medium text-slate-600">
          {loading ? 'Loading...' : `${numPages} page${numPages !== 1 ? 's' : ''}`}
        </div>
        <div className="flex items-center gap-1">
          <button 
            onClick={() => setScale(s => Math.max(0.5, s - 0.2))}
            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
            title="Zoom out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-xs font-medium text-slate-500 w-12 text-center">
            {Math.round(scale * 100)}%
          </span>
          <button 
            onClick={() => setScale(s => Math.min(2.5, s + 0.2))}
            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
            title="Zoom in"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Viewer Area */}
      <div className="relative overflow-auto p-4 min-h-[60vh]" style={{ maxHeight: 'calc(100vh - 200px)' }}>
        {loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50 z-10">
            <Loader2 className="w-8 h-8 text-[#0F766E] animate-spin mb-4" />
            <p className="text-slate-500 text-sm font-medium animate-pulse">Decrypting and loading PDF...</p>
          </div>
        )}
        
        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50 z-10 px-4 text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-3">
              <span className="text-red-600 font-bold">!</span>
            </div>
            <p className="text-slate-900 font-medium">{error}</p>
          </div>
        )}

        <div ref={containerRef} className="relative z-0" />
        <div ref={overlayRef} style={overlayStyle} />
      </div>
    </div>
  )
}
