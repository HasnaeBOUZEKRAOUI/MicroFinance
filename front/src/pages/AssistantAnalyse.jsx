import { useState, useRef, useEffect } from 'react'
import { Bot, Send, Sparkles, RefreshCw } from 'lucide-react'
import { assistantApi } from '../../api/services'

export default function AssistantAnalyse({ demande }) {
  const [messages, setMessages]         = useState([])
  const [input, setInput]               = useState('')
  const [loading, setLoading]           = useState(false)
  const [analyseDone, setAnalyseDone]   = useState(false)
  const bottomRef                       = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (demande?.id && !analyseDone) lancerAnalyse()
  }, [demande?.id])

  const addMessage = (role, text, isSystem = false) =>
    setMessages(prev => [...prev, { id: Date.now() + Math.random(), role, text, isSystem }])

  const lancerAnalyse = async () => {
    setLoading(true)
    setAnalyseDone(true)
    addMessage('bot', '🔍 Analyse du dossier en cours…', true)
    try {
      const res = await assistantApi.analyser(demande.id)
      setMessages(prev => prev.filter(m => !m.isSystem))
      addMessage('bot', res.data.message)
    } catch {
      setMessages(prev => prev.filter(m => !m.isSystem))
      addMessage('bot', "❌ Erreur lors de l'analyse. Vérifiez la configuration.")
    } finally {
      setLoading(false)
    }
  }

  const handleSend = async () => {
    if (!input.trim() || loading) return
    const question = input.trim()
    setInput('')
    addMessage('user', question)
    setLoading(true)
    try {
      const res = await assistantApi.chat(demande.id, {
        message: question,
        history: messages
          .filter(m => !m.isSystem)
          .map(m => ({
            role:    m.role === 'bot' ? 'model' : 'user',
            content: m.text,
          })),
      })
      addMessage('bot', res.data.message)
    } catch {
      addMessage('bot', '❌ Erreur de communication.')
    } finally {
      setLoading(false)
    }
  }

  const QUICK_QUESTIONS = [
    'Quel montant maximum recommandes-tu ?',
    "Quel taux d'intérêt adapté ?",
    'Quels sont les risques principaux ?',
    'Le garant est-il suffisant ?',
    'Résume en une phrase ta recommandation.',
  ]

  return (
    <div className="flex flex-col h-full bg-white rounded-xl border border-surface-100 overflow-hidden">

      {/* ── En-tête ── */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-brand-600 to-brand-700 text-white">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-white/20 rounded-full flex items-center justify-center">
            <Bot size={14} />
          </div>
          <div>
            <p className="text-xs font-bold">Assistant Analyse de Risque</p>
            <p className="text-[10px] text-white/70">Powered by Gemini AI</p>
          </div>
        </div>
        <button
          onClick={() => { setMessages([]); setAnalyseDone(false) }}
          title="Relancer l'analyse"
          className="w-7 h-7 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors"
        >
          <RefreshCw size={12} />
        </button>
      </div>

      {/* ── Zone messages ── */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-surface-50/50 min-h-[240px] max-h-[320px]">

        {messages.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-center py-8">
            <Sparkles size={24} className="text-brand-400" />
            <p className="text-xs text-surface-400">
              L'assistant va analyser ce dossier automatiquement…
            </p>
          </div>
        )}

        {messages.map(m => (
          <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {m.role === 'bot' && (
              <div className="w-6 h-6 bg-brand-100 rounded-full flex items-center justify-center mr-2 flex-shrink-0 mt-1">
                <Bot size={11} className="text-brand-600" />
              </div>
            )}
            <div className={`max-w-[85%] px-3 py-2 rounded-xl text-xs leading-relaxed whitespace-pre-wrap
              ${m.role === 'user'
                ? 'bg-brand-600 text-white rounded-br-sm'
                : m.isSystem
                  ? 'bg-surface-100 text-surface-400 italic'
                  : 'bg-white border border-surface-100 text-surface-800 shadow-sm rounded-bl-sm'
              }`}>
              {m.text}
            </div>
          </div>
        ))}

        {/* Indicateur de frappe */}
        {loading && (
          <div className="flex justify-start">
            <div className="w-6 h-6 bg-brand-100 rounded-full flex items-center justify-center mr-2 flex-shrink-0">
              <Bot size={11} className="text-brand-600" />
            </div>
            <div className="bg-white border border-surface-100 rounded-xl rounded-bl-sm px-3 py-2 shadow-sm">
              <div className="flex gap-1 items-center h-4">
                {[0, 150, 300].map(delay => (
                  <span
                    key={delay}
                    className="w-1.5 h-1.5 bg-brand-400 rounded-full animate-bounce"
                    style={{ animationDelay: `${delay}ms` }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* ── Questions rapides ── */}
      <div className="px-3 py-2 border-t border-surface-100 bg-white">
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {QUICK_QUESTIONS.map((q, i) => (
            <button
              key={i}
              onClick={() => setInput(q)}
              disabled={loading}
              className="flex-shrink-0 px-2.5 py-1 bg-brand-50 text-brand-700 text-[10px] font-medium
                         rounded-full border border-brand-100 hover:bg-brand-100 transition-colors
                         disabled:opacity-40 whitespace-nowrap"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* ── Zone de saisie ── */}
      <div className="px-3 py-2.5 border-t border-surface-100 bg-white">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder="Posez une question sur ce dossier…"
            disabled={loading}
            className="flex-1 text-xs bg-surface-50 border border-surface-200 rounded-xl
                       px-3 py-2 focus:outline-none focus:border-brand-400 focus:bg-white
                       transition-colors disabled:opacity-50"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="w-8 h-8 bg-brand-600 hover:bg-brand-700 text-white rounded-xl
                       flex items-center justify-center transition-colors
                       disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
          >
            <Send size={13} />
          </button>
        </div>
      </div>

    </div>
  )
}