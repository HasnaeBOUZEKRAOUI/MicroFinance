import { useState, useEffect } from 'react'
import { statistiquesApi } from '../api/services'
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import {
  TrendingUp, TrendingDown, Wallet, Users,
  ArrowUpCircle, ArrowDownCircle, Activity, Eye
} from 'lucide-react'

const fmt = (n) =>
  new Intl.NumberFormat('fr-MA', { style: 'currency', currency: 'MAD', maximumFractionDigits: 2 })
    .format(n ?? 0)

const fmtNum = (n) => new Intl.NumberFormat('fr-FR').format(n ?? 0)
const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']
const MODE_LABELS = {
  ESPECES: 'Espèces', VIREMENT: 'Virement',
  CHEQUE: 'Chèque', MOBILE_MONEY: 'Mobile Money', PRELEVEMENT: 'Prélèvement'
}

function KpiCard({ title, value, subtitle, icon: Icon, color, trend }) {
  return (
    <div className="bg-white rounded-xl border border-surface-100 shadow-sm p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-surface-500">{title}</span>
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color}`}>
          <Icon size={18} className="text-white" />
        </div>
      </div>
      <div>
        <p className="text-2xl font-bold text-surface-900 leading-tight">{value}</p>
        {subtitle && <p className="text-xs text-surface-400 mt-1">{subtitle}</p>}
      </div>
      {trend !== undefined && (
        <div className={`flex items-center gap-1 text-xs font-medium ${trend >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
          {trend >= 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
          {trend >= 0 ? '+' : ''}{trend}% vs période préc.
        </div>
      )}
    </div>
  )
}

function SectionTitle({ children }) {
  return (
    <h2 className="text-sm font-bold uppercase tracking-wider text-surface-700 mb-4 flex items-center gap-2">
      <span className="w-1 h-4 bg-brand-500 rounded-full inline-block" />
      {children}
    </h2>
  )
}

function Badge({ type }) {
  return type === 'ENTREE'
    ? <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200"><ArrowUpCircle size={10} />ENTRÉE</span>
    : <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-700 border border-red-200"><ArrowDownCircle size={10} />SORTIE</span>
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-surface-200 rounded-xl shadow-lg p-3 text-xs">
      <p className="font-bold text-surface-700 mb-2">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="font-medium">{p.name} : {fmt(p.value)}</p>
      ))}
    </div>
  )
}

export default function StatistiquesCaissePage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedAgent, setSelectedAgent] = useState(null)
  const [agentDetail, setAgentDetail] = useState(null)
  const [loadingAgent, setLoadingAgent] = useState(false)

  const today = new Date().toISOString().split('T')[0]
  const firstDay = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    .toISOString().split('T')[0]

  const [filters, setFilters] = useState({
    date_debut: firstDay,
    date_fin: today,
    employe_id: '',
    num_caisse: '',
  })

  // ✅ CORRIGÉ — statistiquesApi.caisse avec les filtres
  const fetchStats = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await statistiquesApi.caisse(filters)
      setData(res.data)
    } catch (e) {
        console.error('ERREUR STATS:', e.response?.data)
      setError(e.response?.data?.message || 'Erreur lors du chargement des statistiques.')
    } finally {
      setLoading(false)
    }
  }

  const fetchAgentDetail = async (id) => {
    setLoadingAgent(true)
    setSelectedAgent(id)
    try {
      const res = await statistiquesApi.detailAgent(id, {
        date_debut: filters.date_debut,
        date_fin:   filters.date_fin,
      })
      setAgentDetail(res.data)
    } catch (e) {
      console.error('Erreur détail agent :', e)
    } finally {
      setLoadingAgent(false)
    }
  }

  useEffect(() => { fetchStats() }, [])

  const kpis = data?.kpis

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-surface-900">Statistiques Caisse & Agents</h1>
          <p className="text-sm text-surface-400 mt-0.5">Suivi des encaissements, décaissements et activité des agents</p>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-xl border border-surface-100 shadow-sm p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-semibold text-surface-500 mb-1">Date début</label>
            <input type="date" className="input text-sm h-9" value={filters.date_debut}
              onChange={e => setFilters(f => ({ ...f, date_debut: e.target.value }))} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-surface-500 mb-1">Date fin</label>
            <input type="date" className="input text-sm h-9" value={filters.date_fin}
              onChange={e => setFilters(f => ({ ...f, date_fin: e.target.value }))} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-surface-500 mb-1">N° Caisse</label>
            <input type="text" className="input text-sm h-9" placeholder="ex: CAISSE-01" value={filters.num_caisse}
              onChange={e => setFilters(f => ({ ...f, num_caisse: e.target.value }))} />
          </div>
          <div className="flex items-end">
            <button onClick={fetchStats} disabled={loading}
              className="w-full h-9 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-2">
              {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Activity size={15} />}
              {loading ? 'Chargement...' : 'Actualiser'}
            </button>
          </div>
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-4">{error}</div>}

      {data && (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <KpiCard title="Total Encaissé"  value={fmt(kpis?.total_entrees)}          subtitle={`${fmtNum(kpis?.nb_entrees)} opérations`}   icon={ArrowUpCircle}   color="bg-emerald-500" />
            <KpiCard title="Total Décaissé"  value={fmt(kpis?.total_sorties)}          subtitle={`${fmtNum(kpis?.nb_sorties)} opérations`}   icon={ArrowDownCircle} color="bg-red-500" />
            <KpiCard title="Solde Net"        value={fmt(kpis?.solde_net)}              subtitle="Entrées - Sorties"                           icon={Wallet}          color={parseFloat(kpis?.solde_net) >= 0 ? 'bg-brand-600' : 'bg-orange-500'} />
            <KpiCard title="Nb Opérations"   value={fmtNum(kpis?.nb_total_operations)} subtitle="Total mouvements"                            icon={Activity}        color="bg-purple-500" />
            <KpiCard title="Agents Actifs"   value={fmtNum(data.par_agent?.length)}    subtitle="Sur la période"                              icon={Users}           color="bg-blue-500" />
            <KpiCard title="Caisses"         value={fmtNum(data.par_caisse?.length)}   subtitle="Caisses actives"                             icon={Wallet}          color="bg-amber-500" />
          </div>

          {/* Graphiques */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 bg-white rounded-xl border border-surface-100 shadow-sm p-5">
              <SectionTitle>Évolution journalière des mouvements</SectionTitle>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={data.evolution_journaliere} barGap={2}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="jour" tick={{ fontSize: 10 }} tickFormatter={v => v.slice(5)} />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="entrees" name="Entrées" fill="#10b981" radius={[3,3,0,0]} />
                  <Bar dataKey="sorties" name="Sorties" fill="#ef4444" radius={[3,3,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-white rounded-xl border border-surface-100 shadow-sm p-5">
              <SectionTitle>Modes de paiement</SectionTitle>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={data.par_mode_paiement} dataKey="total" nameKey="mode_paiement"
                    cx="50%" cy="50%" outerRadius={75}
                    label={({ mode_paiement, percent }) => `${MODE_LABELS[mode_paiement] ?? mode_paiement} ${(percent*100).toFixed(0)}%`}
                    labelLine={false} fontSize={9}>
                    {data.par_mode_paiement.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v) => fmt(v)} />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-2 space-y-1">
                {data.par_mode_paiement.map((m, i) => (
                  <div key={i} className="flex justify-between text-xs">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                      {MODE_LABELS[m.mode_paiement] ?? m.mode_paiement}
                    </span>
                    <span className="font-mono font-semibold">{fmt(m.total)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Stats par caisse */}
          {data.par_caisse?.length > 0 && (
            <div className="bg-white rounded-xl border border-surface-100 shadow-sm p-5">
              <SectionTitle>Solde par caisse</SectionTitle>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {data.par_caisse.map((c, i) => (
                  <div key={i} className="border border-surface-100 rounded-xl p-4 flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-bold text-surface-800">{c.num_caisse}</span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${parseFloat(c.solde_net) >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                        Solde : {fmt(c.solde_net)}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-emerald-50 rounded-lg p-2 text-center">
                        <p className="text-emerald-600 font-bold">{fmt(c.total_entrees)}</p>
                        <p className="text-emerald-500">Entrées</p>
                      </div>
                      <div className="bg-red-50 rounded-lg p-2 text-center">
                        <p className="text-red-600 font-bold">{fmt(c.total_sorties)}</p>
                        <p className="text-red-500">Sorties</p>
                      </div>
                    </div>
                    <p className="text-xs text-surface-400 text-center">{fmtNum(c.nb_operations)} opérations</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tableau agents */}
          <div className="bg-white rounded-xl border border-surface-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-surface-100 bg-surface-50/60">
              <SectionTitle>Performance par agent</SectionTitle>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-surface-50 text-surface-500 font-semibold border-b border-surface-100">
                  <tr>
                    <th className="py-3 px-5">Agent</th>
                    <th className="py-3 px-4">Rôle</th>
                    <th className="py-3 px-4">Caisse</th>
                    <th className="py-3 px-4 text-right">Total Encaissé</th>
                    <th className="py-3 px-4 text-right">Total Décaissé</th>
                    <th className="py-3 px-4 text-right">Solde Net</th>
                    <th className="py-3 px-4 text-center">Opérations</th>
                    <th className="py-3 px-4 text-center">Dernière Op.</th>
                    <th className="py-3 px-5 text-center">Détail</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-100">
                  {data.par_agent.map((a) => (
                    <tr key={a.employe_id}
                      className={`hover:bg-surface-50/50 transition-colors ${selectedAgent === a.employe_id ? 'bg-brand-50/30' : ''}`}>
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-brand-100 text-brand-700 font-bold text-[10px] flex items-center justify-center uppercase">
                            {a.nom_complet?.split(' ').map(n => n[0]).join('').slice(0,2)}
                          </div>
                          <div>
                            <p className="font-semibold text-surface-800">{a.nom_complet}</p>
                            <p className="text-surface-400">@{a.nom_utilisateur}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">{a.role}</span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-surface-600">{a.num_caisse ?? '—'}</td>
                      <td className="py-3.5 px-4 text-right font-mono font-semibold text-emerald-700">{fmt(a.total_encaisse)}</td>
                      <td className="py-3.5 px-4 text-right font-mono font-semibold text-red-600">{fmt(a.total_decaisse)}</td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold">
                        <span className={parseFloat(a.solde_net) >= 0 ? 'text-emerald-700' : 'text-red-600'}>{fmt(a.solde_net)}</span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="bg-surface-100 text-surface-700 font-bold px-2 py-0.5 rounded-lg">{fmtNum(a.nb_operations)}</span>
                      </td>
                      <td className="py-3.5 px-4 text-center text-surface-400">
                        {a.derniere_operation ? new Date(a.derniere_operation).toLocaleDateString('fr-FR') : '—'}
                      </td>
                      <td className="py-3.5 px-5 text-center">
                        <button onClick={() => fetchAgentDetail(a.employe_id)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-brand-50 text-brand-700 hover:bg-brand-600 hover:text-white transition-all border border-brand-200">
                          <Eye size={12} /> Voir
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Détail agent */}
          {selectedAgent && (
            <div className="bg-white rounded-xl border border-brand-200 shadow-sm p-5">
              <div className="flex justify-between items-center mb-4">
                <SectionTitle>Détail — {data.par_agent.find(a => a.employe_id === selectedAgent)?.nom_complet}</SectionTitle>
                <button onClick={() => { setSelectedAgent(null); setAgentDetail(null) }}
                  className="text-xs text-surface-400 hover:text-surface-700">✕ Fermer</button>
              </div>
              {loadingAgent ? (
                <div className="flex justify-center py-8">
                  <span className="w-6 h-6 border-2 border-brand-300 border-t-brand-600 rounded-full animate-spin" />
                </div>
              ) : agentDetail && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-semibold text-surface-500 mb-3 uppercase tracking-wider">Activité journalière</p>
                    <ResponsiveContainer width="100%" height={200}>
                      <LineChart data={agentDetail.mouvements}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="jour" tick={{ fontSize: 9 }} tickFormatter={v => v.slice(5)} />
                        <YAxis tick={{ fontSize: 9 }} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend wrapperStyle={{ fontSize: 10 }} />
                        <Line type="monotone" dataKey="entrees" name="Entrées" stroke="#10b981" strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="sorties" name="Sorties" stroke="#ef4444" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-surface-500 mb-3 uppercase tracking-wider">Modes de paiement utilisés</p>
                    <div className="space-y-2">
                      {agentDetail.paiements.map((p, i) => {
                        const max = Math.max(...agentDetail.paiements.map(x => parseFloat(x.total)))
                        const pct = (parseFloat(p.total) / max) * 100
                        return (
                          <div key={i}>
                            <div className="flex justify-between text-xs mb-1">
                              <span className="font-medium text-surface-700">{MODE_LABELS[p.mode_paiement] ?? p.mode_paiement}</span>
                              <span className="font-mono font-bold">{fmt(p.total)} <span className="text-surface-400">({fmtNum(p.nb)} op.)</span></span>
                            </div>
                            <div className="w-full bg-surface-100 rounded-full h-2">
                              <div className="h-2 rounded-full transition-all duration-500"
                                style={{ width: `${pct}%`, background: COLORS[i % COLORS.length] }} />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                    <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                      <div className="bg-emerald-50 rounded-xl p-3">
                        <p className="text-xs font-bold text-emerald-700">{fmt(agentDetail.totaux?.total_encaisse)}</p>
                        <p className="text-[10px] text-emerald-500 mt-0.5">Encaissé</p>
                      </div>
                      <div className="bg-red-50 rounded-xl p-3">
                        <p className="text-xs font-bold text-red-700">{fmt(agentDetail.totaux?.total_decaisse)}</p>
                        <p className="text-[10px] text-red-500 mt-0.5">Décaissé</p>
                      </div>
                      <div className="bg-brand-50 rounded-xl p-3">
                        <p className="text-xs font-bold text-brand-700">{fmtNum(agentDetail.totaux?.nb_operations)}</p>
                        <p className="text-[10px] text-brand-500 mt-0.5">Opérations</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Derniers mouvements */}
          <div className="bg-white rounded-xl border border-surface-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-surface-100 bg-surface-50/60">
              <SectionTitle>20 derniers mouvements</SectionTitle>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-surface-50 text-surface-500 font-semibold border-b border-surface-100">
                  <tr>
                    <th className="py-3 px-5">Date</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Libellé</th>
                    <th className="py-3 px-4">Caisse</th>
                    <th className="py-3 px-4">Agent</th>
                    <th className="py-3 px-5 text-right">Montant</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-100">
                  {data.derniers_mouvements.map((m) => (
                    <tr key={m.id} className="hover:bg-surface-50/50">
                      <td className="py-3 px-5 font-mono text-surface-500">{m.date}</td>
                      <td className="py-3 px-4"><Badge type={m.type} /></td>
                      <td className="py-3 px-4 text-surface-600">{m.libelle ?? '—'}</td>
                      <td className="py-3 px-4 font-mono text-surface-500">{m.num_caisse}</td>
                      <td className="py-3 px-4 font-medium text-surface-700">{m.agent}</td>
                      <td className={`py-3 px-5 text-right font-mono font-bold ${m.type === 'ENTREE' ? 'text-emerald-700' : 'text-red-600'}`}>
                        {m.type === 'ENTREE' ? '+' : '-'}{fmt(m.montant)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}