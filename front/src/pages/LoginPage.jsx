import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Landmark, Eye, EyeOff, Loader2 } from 'lucide-react'
import { ErrorAlert } from '../components/ui'
export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm]       = useState({ nom_utilisateur: '', mot_de_passe: '' })
  const [show, setShow]       = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await login(form.nom_utilisateur, form.mot_de_passe)
      navigate('/clients')
    } catch (err) {
      setError(err.response?.data?.message || 'Identifiants incorrects.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-50 px-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-brand-100/60 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-brand-50 blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm">
        {/* Card */}
        <div className="bg-white rounded-3xl shadow-modal p-8 border border-surface-100">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <span className="flex items-center justify-center w-14 h-14 rounded-2xl bg-brand-600 text-white shadow-sm mb-4">
              <Landmark size={26} />
            </span>
            <h1 className="font-display font-bold text-2xl text-surface-900">MicroFinance Pro</h1>
            <p className="text-sm text-surface-800/50 mt-1">Connectez-vous à votre espace</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <ErrorAlert message={error} />

            <div>
              <label className="label">Nom d'utilisateur</label>
              <input
                className="input"
                type="text"
                placeholder="ex: agent.dupont"
                value={form.nom_utilisateur}
                onChange={e => setForm(f => ({ ...f, nom_utilisateur: e.target.value }))}
                required
                autoFocus
              />
            </div>

            <div>
              <label className="label">Mot de passe</label>
              <div className="relative">
                <input
                  className="input pr-10"
                  type={show ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={form.mot_de_passe}
                  onChange={e => setForm(f => ({ ...f, mot_de_passe: e.target.value }))}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShow(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-800/40 hover:text-surface-800"
                >
                  {show ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full justify-center mt-2">
              {loading && <Loader2 size={16} className="animate-spin" />}
              {loading ? 'Connexion…' : 'Se connecter'}
            </button>
          </form>
        </div>
        <p className="text-center text-xs text-surface-800/40 mt-5">
          © {new Date().getFullYear()} MicroFinance Pro — Tous droits réservés
        </p>
      </div>
    </div>
  )
}