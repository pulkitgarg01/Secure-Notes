const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000/api'

function getAuthHeaders() {
  try {
    const token = localStorage.getItem('token')
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    }
  } catch {
    return {
      'Content-Type': 'application/json'
    }
  }
}

export async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`
  const headers = { ...getAuthHeaders(), ...options.headers }
  
  try {
    const res = await fetch(url, { ...options, headers })
    
    // Check if response is JSON
    const contentType = res.headers.get('content-type')
    if (!contentType || !contentType.includes('application/json')) {
      const text = await res.text()
      throw new Error(text || `Server returned ${res.status}`)
    }
    
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Request failed')
    return data
  } catch (err) {
    if (err instanceof SyntaxError) {
      throw new Error('Invalid response from server')
    }
    throw err
  }
}

export async function apiFetchFile(endpoint) {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`
  const token = localStorage.getItem('token')
  const headers = token ? { 'Authorization': `Bearer ${token}` } : {}
  
  const res = await fetch(url, { headers })
  if (!res.ok) {
    throw new Error(`Failed to fetch file: ${res.status}`)
  }
  
  return res.blob()
}

export async function downloadSecureFile(url, filename) {
  const blob = await apiFetchFile(url)
  const objectUrl = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = objectUrl
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(objectUrl), 1000)
}

export async function viewSecureFile(url, mimeType = 'application/pdf') {
  const blob = await apiFetchFile(url)
  const objectUrl = URL.createObjectURL(new Blob([blob], { type: blob.type || mimeType }))
  window.open(objectUrl, '_blank')
}

// Auth
export const auth = {
  login: (email, password) => apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  }),
}

// Admin - Academic Structure
export const academic = {
  branches: {
    list: () => apiRequest('/academic/branches'),
    create: (data) => apiRequest('/academic/branches', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    update: (id, data) => apiRequest(`/academic/branches/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
    delete: (id) => apiRequest(`/academic/branches/${id}`, {
      method: 'DELETE'
    }),
  },
  semesters: {
    list: () => apiRequest('/academic/semesters'),
    create: (data) => apiRequest('/academic/semesters', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    delete: (id) => apiRequest(`/academic/semesters/${id}`, {
      method: 'DELETE'
    }),
  },
  sections: {
    list: (params) => {
      const query = new URLSearchParams(params).toString()
      return apiRequest(`/academic/sections${query ? `?${query}` : ''}`)
    },
    create: (data) => apiRequest('/academic/sections', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    delete: (id) => apiRequest(`/academic/sections/${id}`, {
      method: 'DELETE'
    }),
  },
  subjects: {
    list: (params) => {
      const query = new URLSearchParams(params).toString()
      return apiRequest(`/academic/subjects${query ? `?${query}` : ''}`)
    },
    create: (data) => apiRequest('/academic/subjects', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    update: (id, data) => apiRequest(`/academic/subjects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
    delete: (id) => apiRequest(`/academic/subjects/${id}`, {
      method: 'DELETE'
    }),
  },
}

// Admin - Users
export const admin = {
  stats: () => apiRequest('/admin/stats'),
  users: {
    list: (params) => {
      const query = new URLSearchParams(params).toString()
      return apiRequest(`/admin/users${query ? `?${query}` : ''}`)
    },
    create: (data) => apiRequest('/admin/users', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    update: (id, data) => apiRequest(`/admin/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
    delete: (id) => apiRequest(`/admin/users/${id}`, {
      method: 'DELETE'
    }),
  },
  assignSubject: {
    create: (data) => apiRequest('/admin/assign-subject', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    list: (params) => {
      const query = new URLSearchParams(params).toString()
      return apiRequest(`/admin/assign-subject${query ? `?${query}` : ''}`)
    },
    delete: (id) => apiRequest(`/admin/assign-subject/${id}`, {
      method: 'DELETE'
    }),
  },
  notes: {
    list: () => apiRequest('/admin/notes'),
    delete: (id) => apiRequest(`/admin/notes/${id}`, { method: 'DELETE' })
  }
}

// Teacher
export const teacher = {
  stats: () => apiRequest('/teacher/stats'),
  subjects: () => apiRequest('/teacher/subjects'),
  students: () => apiRequest('/teacher/students'),
  analytics: () => apiRequest('/teacher/analytics'),
  modules: {
    list: (params) => {
      const query = new URLSearchParams(params).toString()
      return apiRequest(`/teacher/modules${query ? `?${query}` : ''}`)
    },
    create: (data) => apiRequest('/teacher/modules', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    update: (id, data) => apiRequest(`/teacher/modules/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
    delete: (id) => apiRequest(`/teacher/modules/${id}`, {
      method: 'DELETE'
    }),
  },
  tasks: {
    list: (params) => {
      const query = new URLSearchParams(params).toString()
      return apiRequest(`/teacher/tasks${query ? `?${query}` : ''}`)
    },
    create: (data) => apiRequest('/teacher/tasks', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    update: (id, data) => apiRequest(`/teacher/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
    delete: (id) => apiRequest(`/teacher/tasks/${id}`, {
      method: 'DELETE'
    }),
    getSubmissions: (id) => apiRequest(`/teacher/tasks/${id}/submissions`),
    downloadSubmissionUrl: (id) => `${API_BASE}/teacher/tasks/submissions/${id}/download`,
    viewSubmissionUrl: (id) => `${API_BASE}/teacher/tasks/submissions/${id}/view`
  },
  notes: {
    list: (params) => {
      const query = new URLSearchParams(params).toString()
      return apiRequest(`/teacher/notes${query ? `?${query}` : ''}`)
    },
    upload: (formData) => {
      try {
        const token = localStorage.getItem('token')
        return fetch(`${API_BASE}/teacher/notes`, {
          method: 'POST',
          headers: { 'Authorization': token ? `Bearer ${token}` : '' },
          body: formData
        }).then(async (res) => {
          const contentType = res.headers.get('content-type')
          if (!contentType || !contentType.includes('application/json')) {
            const text = await res.text()
            throw new Error(text || 'Upload failed')
          }
          const data = await res.json()
          if (!res.ok) throw new Error(data.error || 'Upload failed')
          return data
        })
      } catch (err) {
        throw err
      }
    },
    update: (id, data) => apiRequest(`/teacher/notes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
    delete: (id) => apiRequest(`/teacher/notes/${id}`, {
      method: 'DELETE'
    }),
  },
  search: (q) => apiRequest(`/teacher/search?q=${encodeURIComponent(q)}`),
}

// Student
export const student = {
  stats: () => apiRequest('/student/stats'),
  subjects: () => apiRequest('/student/subjects'),
  modules: (subjectId) => apiRequest(`/student/subjects/${subjectId}/modules`),
  notes: (moduleId) => apiRequest(`/student/modules/${moduleId}/notes`),
  tasks: {
    list: () => apiRequest('/student/tasks'),
    submit: (id, formData) => {
      const token = localStorage.getItem('token')
      return fetch(`${API_BASE}/student/tasks/${id}/submit`, {
        method: 'POST',
        headers: { 'Authorization': token ? `Bearer ${token}` : '' },
        body: formData
      }).then(res => res.json().then(data => { if (!res.ok) throw new Error(data.error || 'Submission failed'); return data; }))
    },
    getSubmissions: (id) => apiRequest(`/student/tasks/${id}/submissions`)
  },
  viewNote: (noteId) => {
    return `${API_BASE}/student/notes/${noteId}/view`
  },
  completeNote: (noteId, completed) => apiRequest(`/student/notes/${noteId}/complete`, {
    method: 'POST',
    body: JSON.stringify({ completed })
  }),
  progress: () => apiRequest('/student/progress'),
  recommended: () => apiRequest('/student/notes/recommended'),
  recent: (limit = 10) => apiRequest(`/student/notes/recent?limit=${limit}`),
  search: (q) => apiRequest(`/student/search?q=${encodeURIComponent(q)}`),
}

// Communication (All roles)
export const communication = {
  searchUsers: (q) => apiRequest(`/communication/search-users?q=${encodeURIComponent(q)}`),
  conversations: {
    list: () => apiRequest('/communication/conversations'),
    create: (data) => apiRequest('/communication/conversations', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    messages: (id) => apiRequest(`/communication/conversations/${id}/messages`),
    reply: (id, body) => apiRequest(`/communication/conversations/${id}/messages`, {
      method: 'POST',
      body: JSON.stringify({ body })
    }),
    markRead: (id) => apiRequest(`/communication/conversations/${id}/read`, {
      method: 'POST'
    })
  },
  announcements: {
    list: () => apiRequest('/communication/announcements'),
    create: (data) => apiRequest('/communication/announcements', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  },
  notifications: {
    list: () => apiRequest('/communication/notifications'),
    markRead: (id) => apiRequest(`/communication/notifications/${id}/read`, {
      method: 'POST'
    }),
    markAllRead: () => apiRequest('/communication/notifications/read-all', {
      method: 'POST'
    })
  }
}
