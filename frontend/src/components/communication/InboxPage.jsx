import React, { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { communication, teacher, admin, academic } from '../../lib/api'
import { PageContainer, PageHero, Skeleton, Badge, itemVariants } from '../ui/design-system'
import { Button } from '../ui/button'
import { MessageSquare, Plus, Search, User as UserIcon, Send, X, Clock, Megaphone, CheckCircle2, MoreVertical, Loader2 } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { Select } from '../ui/select'
import { toast } from 'sonner'
import { Input } from '../ui/input'
import { formatDistanceToNow } from 'date-fns'

const getConversationDisplayInfo = (conv, currentUser) => {
  const isParticipant = conv.participants.some(p => p._id === currentUser?.id)
  if (isParticipant) {
    const otherUser = conv.participants.find(p => p._id !== currentUser.id) || conv.participants[0]
    return {
      name: otherUser.name,
      role: otherUser.role,
      initial: otherUser.name.charAt(0)
    }
  } else {
    // Admin viewing someone else's conversation
    const p1 = conv.participants[0]
    const p2 = conv.participants[1]
    if (p1 && p2) {
      return {
        name: `${p1.name} ↔ ${p2.name}`,
        role: `${p1.role} & ${p2.role}`,
        initial: p1.name.charAt(0) + p2.name.charAt(0)
      }
    }
    return { name: 'Unknown', role: 'Unknown', initial: '?' }
  }
}

export default function InboxPage() {
  const { auth } = useAuth()
  const user = auth?.user
  const [conversations, setConversations] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeConv, setActiveConv] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const location = useLocation()
  
  const [isComposeOpen, setIsComposeOpen] = useState(false)
  const [isAnnounceOpen, setIsAnnounceOpen] = useState(false)

  useEffect(() => {
    fetchConversations()
    if (location.state?.openBroadcast) {
      setIsAnnounceOpen(true)
      window.history.replaceState({}, document.title)
    }
    if (location.state?.openCompose) {
      setIsComposeOpen(true)
      window.history.replaceState({}, document.title)
    }
  }, [location.state])

  const fetchConversations = async () => {
    setLoading(true)
    try {
      const data = await communication.conversations.list()
      setConversations(data)
    } catch (err) {
      toast.error('Failed to load conversations')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenConversation = async (conv) => {
    setActiveConv(conv)
    if (conv.unreadCount > 0) {
      try {
        await communication.conversations.markRead(conv._id)
        setConversations(prev => prev.map(c => c._id === conv._id ? { ...c, unreadCount: 0 } : c))
      } catch (err) {
        console.error('Failed to mark read', err)
      }
    }
  }

  const filteredConversations = conversations.filter(c => {
    const info = getConversationDisplayInfo(c, user)
    return info.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.subject.toLowerCase().includes(searchQuery.toLowerCase())
  })

  return (
    <PageContainer>
      <PageHero 
        title="Inbox" 
        description="Academic communication and feedback."
        icon={MessageSquare}
        action={
          <div className="flex gap-2">
            {(user?.role === 'teacher' || user?.role === 'admin') && (
              <Button onClick={() => setIsAnnounceOpen(true)} variant="outline" className="gap-2 bg-white/50 backdrop-blur-md dark:bg-slate-900/50 text-[#0F766E] border-[#0F766E]/20 hover:bg-[#0F766E]/10 shadow-sm rounded-xl">
                <Megaphone className="w-4 h-4" /> New Announcement
              </Button>
            )}
            <Button onClick={() => setIsComposeOpen(true)} className="gap-2 bg-gradient-to-r from-[#0F766E] to-[#0D6B64] hover:from-[#0D6B64] hover:to-[#0B5C56] text-white shadow-md shadow-[#0F766E]/20 rounded-xl">
              <Plus className="w-4 h-4" /> New Message
            </Button>
          </div>
        }
      />

      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-xl shadow-slate-200/40 dark:shadow-slate-900/40 overflow-hidden min-h-[650px] flex">
        {/* Sidebar List */}
        <div className="w-full md:w-[350px] border-r border-slate-200/60 dark:border-slate-800/60 flex flex-col bg-slate-50/50 dark:bg-slate-950/50">
          <div className="p-4 border-b border-slate-200/60 dark:border-slate-800/60 backdrop-blur-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input 
                placeholder="Search messages..." 
                className="pl-9 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-xl shadow-sm" 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {loading ? (
              <div className="p-4 space-y-4">
                {[1,2,3,4].map(i => (
                  <div key={i} className="flex gap-3">
                    <Skeleton className="w-12 h-12 rounded-full" />
                    <div className="space-y-2 flex-1 pt-1">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-8 text-center text-slate-500 h-full flex flex-col items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                  <MessageSquare className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                </div>
                <p className="font-semibold text-slate-700 dark:text-slate-300">No conversations</p>
                <p className="text-xs text-slate-500 mt-1">Start a new message to connect.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {filteredConversations.map(conv => {
                  const info = getConversationDisplayInfo(conv, user)
                  const isActive = activeConv?._id === conv._id
                  return (
                    <button
                      key={conv._id}
                      onClick={() => handleOpenConversation(conv)}
                      className={`w-full text-left p-4 hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition-all flex gap-3 relative ${isActive ? 'bg-white dark:bg-slate-900 shadow-sm before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:bg-[#0F766E]' : ''}`}
                    >
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold ${info.initial.length > 1 ? 'text-xs tracking-tighter' : 'text-lg'} shadow-sm ${isActive ? 'bg-gradient-to-br from-[#0F766E] to-[#0D6B64]' : 'bg-gradient-to-br from-slate-400 to-slate-500'}`}>
                        {info.initial}
                      </div>
                      <div className="flex-1 min-w-0 pt-0.5">
                        <div className="flex justify-between items-baseline mb-1">
                          <h4 className={`text-sm truncate pr-2 ${conv.unreadCount > 0 ? 'font-bold text-slate-900 dark:text-white' : 'font-medium text-slate-700 dark:text-slate-200'}`}>
                            {info.name}
                          </h4>
                          <span className={`text-[10px] flex-shrink-0 ${conv.unreadCount > 0 ? 'font-bold text-[#0F766E]' : 'text-slate-400'}`}>
                            {new Date(conv.last_message_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                        <p className={`text-xs truncate ${conv.unreadCount > 0 ? 'font-medium text-slate-800 dark:text-slate-200' : 'text-slate-500'}`}>
                          {conv.subject}
                        </p>
                      </div>
                      {conv.unreadCount > 0 && (
                        <div className="w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-2 shadow-sm shadow-red-500/20">
                          {conv.unreadCount}
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="hidden md:flex flex-col flex-1 bg-white/50 dark:bg-slate-950/20 relative backdrop-blur-sm">
          {activeConv ? (
            <MessageThread conversation={activeConv} />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
              <div className="w-24 h-24 rounded-full bg-slate-50 dark:bg-slate-900 flex items-center justify-center mb-6 shadow-inner border border-slate-100 dark:border-slate-800">
                <MessageSquare className="w-10 h-10 text-slate-300 dark:text-slate-700" />
              </div>
              <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300 mb-2">Your Messages</h3>
              <p className="text-sm text-slate-500 max-w-sm text-center">Select a conversation from the sidebar or start a new one to begin communicating securely.</p>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {isComposeOpen && (
          <ComposeModal onClose={() => setIsComposeOpen(false)} onSent={() => { setIsComposeOpen(false); fetchConversations(); }} />
        )}
        {isAnnounceOpen && (
          <AnnounceModal onClose={() => setIsAnnounceOpen(false)} onSent={() => setIsAnnounceOpen(false)} />
        )}
      </AnimatePresence>
    </PageContainer>
  )
}

function MessageThread({ conversation }) {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)
  const { auth } = useAuth()
  const user = auth?.user
  
  const endRef = useRef(null)

  useEffect(() => {
    if (conversation) fetchMessages()
  }, [conversation])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const fetchMessages = async () => {
    setLoading(true)
    try {
      const data = await communication.conversations.messages(conversation._id)
      setMessages(data)
    } catch (err) {
      toast.error('Failed to load messages')
    } finally {
      setLoading(false)
    }
  }

  const handleReply = async (e) => {
    e.preventDefault()
    if (!reply.trim()) return
    setSending(true)
    try {
      await communication.conversations.reply(conversation._id, reply)
      await fetchMessages()
      setReply('')
    } catch (err) {
      toast.error('Failed to send reply')
    } finally {
      setSending(false)
    }
  }

  const info = getConversationDisplayInfo(conversation, user)

  return (
    <>
      {/* Header */}
      <div className="px-6 py-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 font-bold ${info.initial.length > 1 ? 'text-sm tracking-tighter' : 'text-lg'} shadow-inner`}>
            {info.initial}
          </div>
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-lg">{info.name}</h3>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{info.role}</p>
          </div>
        </div>
        <div className="text-right hidden sm:block">
          <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Subject</p>
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{conversation.subject}</p>
        </div>
      </div>
      
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-slate-50/30 dark:bg-slate-950/30">
        {loading ? (
          <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 text-[#0F766E] animate-spin" /></div>
        ) : (
          messages.map((msg, i) => {
            const isMe = msg.sender_id._id === user.id
            const showAvatar = !isMe && (i === 0 || messages[i-1].sender_id._id !== msg.sender_id._id)
            
            return (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                key={msg._id} 
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                <div className={`flex items-end gap-2 max-w-[85%] ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                  {!isMe ? (
                    showAvatar ? (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-300 to-slate-400 dark:from-slate-600 dark:to-slate-700 flex-shrink-0 flex items-center justify-center text-white text-xs font-bold shadow-sm mb-1">
                        {msg.sender_id.name.charAt(0)}
                      </div>
                    ) : (
                      <div className="w-8 h-8 flex-shrink-0" />
                    )
                  ) : null}
                  
                  <div className={`px-5 py-3.5 rounded-3xl shadow-sm ${isMe ? 'bg-gradient-to-tr from-[#0F766E] to-[#118B81] text-white rounded-br-md shadow-[#0F766E]/20' : 'bg-white/90 dark:bg-slate-800/90 border border-slate-200/50 dark:border-slate-700/50 text-slate-800 dark:text-slate-200 rounded-bl-md backdrop-blur-md shadow-slate-200/50 dark:shadow-none'}`}>
                    <p className="text-[15px] whitespace-pre-wrap leading-relaxed">{msg.body}</p>
                  </div>
                </div>
                <span className={`text-[10px] font-medium text-slate-400 mt-1.5 ${isMe ? 'mr-2' : 'ml-12'}`}>
                  {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                </span>
              </motion.div>
            )
          })
        )}
        <div ref={endRef} className="h-2" />
      </div>

      {/* Input */}
      <div className="p-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-t border-slate-200/60 dark:border-slate-800/60">
        <form onSubmit={handleReply} className="flex gap-3">
          <Input 
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 bg-slate-50 dark:bg-slate-950 border-slate-200/80 dark:border-slate-700/80 rounded-2xl px-5 h-12 shadow-inner focus-visible:ring-[#0F766E]"
          />
          <Button type="submit" disabled={sending || !reply.trim()} className="rounded-2xl w-12 h-12 p-0 flex items-center justify-center flex-shrink-0 bg-[#0F766E] hover:bg-[#0D6B64] text-white shadow-md shadow-[#0F766E]/20">
            {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 ml-1" />}
          </Button>
        </form>
      </div>
    </>
  )
}

function ComposeModal({ onClose, onSent }) {
  const { auth } = useAuth()
  const user = auth?.user
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [selectedUser, setSelectedUser] = useState(null)
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const [searching, setSearching] = useState(false)

  // Debounced search
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults([])
      return
    }
    const timer = setTimeout(async () => {
      setSearching(true)
      try {
        const results = await communication.searchUsers(searchQuery)
        setSearchResults(results)
      } catch (err) {
        console.error(err)
      } finally {
        setSearching(false)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!selectedUser) return toast.error('Please select a recipient')
    setSending(true)
    try {
      await communication.conversations.create({ recipient_id: selectedUser._id, subject, body })
      toast.success('Message sent successfully')
      onSent()
    } catch (err) {
      toast.error(err.message || 'Failed to send message')
    } finally {
      setSending(false)
    }
  }

  if (typeof document === 'undefined') return null
  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        transition={{ type: "spring", duration: 0.5, bounce: 0 }}
        className="w-full max-w-lg bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-white/20 dark:border-white/10"
      >
        <div className="flex items-center justify-between p-6 border-b border-slate-100/50 dark:border-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0F766E] to-[#0D6B64] flex items-center justify-center shadow-sm">
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-900 dark:text-white leading-tight">New Message</h3>
              <p className="text-xs text-slate-500 font-medium">Start a secure conversation</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* User Search / Selected User */}
          <div className="space-y-2 relative">
            <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Recipient</label>
            
            {selectedUser ? (
              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl shadow-inner">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#0F766E]/10 text-[#0F766E] flex items-center justify-center font-bold text-sm">
                    {selectedUser.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white leading-none">{selectedUser.name}</p>
                    <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-wide">{selectedUser.role} • {selectedUser.email}</p>
                  </div>
                </div>
                <button type="button" onClick={() => setSelectedUser(null)} className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search by name or email..." 
                  className="pl-9 h-11 bg-slate-50 dark:bg-slate-950 rounded-xl focus-visible:ring-[#0F766E]"
                  autoFocus
                />
                {searching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#0F766E] animate-spin" />}
                
                {/* Search Results Dropdown */}
                {searchQuery.trim().length >= 2 && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl overflow-hidden z-50 max-h-60 overflow-y-auto">
                    {!searching && searchResults.length > 0 ? (
                      searchResults.map(res => (
                        <button
                          key={res._id}
                          type="button"
                          onClick={() => { setSelectedUser(res); setSearchQuery(''); }}
                          className="w-full flex items-center gap-3 p-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border-b last:border-0 border-slate-100 dark:border-slate-800 group"
                        >
                          <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-600 dark:text-slate-400 text-xs shrink-0 group-hover:bg-[#0F766E]/10 group-hover:text-[#0F766E] transition-colors">
                            {res.name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{res.name}</p>
                            <p className="text-[10px] uppercase tracking-wide text-slate-500">{res.role}</p>
                          </div>
                        </button>
                      ))
                    ) : !searching && (
                      <div className="p-4 text-center text-sm text-slate-500">No matching users found</div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Subject</label>
            <Input 
              value={subject} 
              onChange={e => setSubject(e.target.value)} 
              required 
              placeholder="What is this regarding?" 
              className="bg-slate-50 dark:bg-slate-950 rounded-xl h-11 focus-visible:ring-[#0F766E]"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Message</label>
            <textarea
              className="w-full rounded-xl border border-input bg-slate-50 dark:bg-slate-950 px-4 py-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E] min-h-[140px] resize-none shadow-inner"
              value={body}
              onChange={e => setBody(e.target.value)}
              required
              placeholder="Write your message here..."
            />
          </div>

          <div className="pt-2 flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={onClose} className="rounded-xl font-bold">Cancel</Button>
            <Button type="submit" disabled={sending || !selectedUser || !subject || !body} className="gap-2 bg-[#0F766E] hover:bg-[#0D6B64] text-white rounded-xl shadow-md shadow-[#0F766E]/20 font-bold px-6">
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Send Message
            </Button>
          </div>
        </form>
      </motion.div>
    </div>,
    document.body
  )
}

function AnnounceModal({ onClose, onSent }) {
  const { auth } = useAuth()
  const user = auth?.user
  const [subjects, setSubjects] = useState([])
  const [selectedSubject, setSelectedSubject] = useState('')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        let data;
        if (user?.role === 'admin') {
          data = await academic.subjects.list()
        } else {
          data = await teacher.subjects()
        }
        setSubjects(data)
      } catch (err) {
        toast.error('Failed to load subjects')
      }
    }
    fetchSubjects()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSending(true)
    try {
      await communication.announcements.create({ subject_id: selectedSubject, title, body })
      toast.success('Announcement broadcasted')
      onSent()
    } catch (err) {
      toast.error(err.message || 'Failed to send')
    } finally {
      setSending(false)
    }
  }

  if (typeof document === 'undefined') return null
  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        transition={{ type: "spring", duration: 0.5, bounce: 0 }}
        className="w-full max-w-lg bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-white/20 dark:border-white/10"
      >
        <div className="flex items-center justify-between p-6 border-b border-slate-100/50 dark:border-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-sm">
              <Megaphone className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-900 dark:text-white leading-tight">Broadcast Announcement</h3>
              <p className="text-xs text-slate-500 font-medium">Send a global notice</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Target Class</label>
            <Select value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)} required className="h-11 rounded-xl">
              <option value="" disabled>Select a subject...</option>
              {subjects.map(s => (
                <option key={s._id} value={s._id}>{s.name} ({s.code})</option>
              ))}
            </Select>
            <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
              <Clock className="w-3 h-3"/> Reaches all students in this class.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Title</label>
            <Input 
              value={title} 
              onChange={e => setTitle(e.target.value)} 
              required 
              placeholder="e.g. Mid-term Exam Syllabus" 
              className="h-11 rounded-xl bg-slate-50 dark:bg-slate-950 focus-visible:ring-indigo-500"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Announcement Content</label>
            <textarea
              className="w-full rounded-xl border border-input bg-slate-50 dark:bg-slate-950 px-4 py-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 min-h-[140px] resize-none shadow-inner"
              value={body}
              onChange={e => setBody(e.target.value)}
              required
              placeholder="Write your announcement here..."
            />
          </div>

          <div className="pt-2 flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={onClose} className="rounded-xl font-bold">Cancel</Button>
            <Button type="submit" disabled={sending || !selectedSubject || !title || !body} className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md shadow-indigo-500/20 font-bold px-6">
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Megaphone className="w-4 h-4" />}
              Broadcast
            </Button>
          </div>
        </form>
      </motion.div>
    </div>,
    document.body
  )
}
