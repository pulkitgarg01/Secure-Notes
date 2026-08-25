import React from 'react'
import { Modal } from './ui/design-system'
import SecurePDFViewer from './SecurePDFViewer'

export default function PDFViewerModal({ isOpen, onClose, fileId, endpointPrefix, watermarkText }) {
  if (!isOpen || !fileId) return null

  const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000/api'
  const srcUrl = `${API_BASE}/${endpointPrefix}/notes/${fileId}/view`
  const token = localStorage.getItem('token')

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Document Viewer" 
      size="full"
    >
      <div className="h-[80vh] w-full bg-slate-900 rounded-lg overflow-hidden flex flex-col relative">
        <SecurePDFViewer 
          srcUrl={srcUrl} 
          token={token} 
          watermarkText={watermarkText || 'Acadence'} 
        />
      </div>
    </Modal>
  )
}
