import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer
} from 'recharts'

/* ================= IA SIMPLE ================= */
function getFinanceAdvice(dep, rec) {
  const a = []
  const r = rec > 0 ? (dep / rec) * 100 : 0

  if (r > 80) a.push("⚠️ Dépenses trop élevées")
  if (r > 100) a.push("🚨 Déficit détecté")
  if (r < 50) a.push("💡 Bonne gestion 👍")

  return a
}

/* ================= FORMAT DATE ================= */
function formatDate(date) {
  const d = new Date(date)
  return `${d.getDate().toString().padStart(2, '0')}/${
    (d.getMonth() + 1).toString().padStart(2, '0')
  }/${d.getFullYear()}`
}

export default function App() {

  const [user, setUser] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [page, setPage] = useState('home')

  const [label, setLabel] = useState('')
  const [montant, setMontant] = useState('')
  const [type, setType] = useState('depense')

  const [dark, setDark] = useState(false)

  /* ================= AUTH ================= */
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user || null)
    })

    const { data } = supabase.auth.onAuthStateChange((_e, s) => {
      setUser(s?.user || null)
    })

    return () => data.subscription.unsubscribe()
  }, [])

  /* ================= DATA ================= */
  useEffect(() => {
    if (user) load()
  }, [user])

  async function load() {
    const { data } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    setTransactions(data || [])
  }

  /* ================= ADD ================= */
  async function add() {
    if (!label || !montant) return

    const { error } = await supabase
      .from('transactions')
      .insert([{
        label,
        montant: Number(montant),
        type,
        user_id: user.id
      }])

    if (error) return alert(error.message)

    setLabel('')
    setMontant('')
    load()
    setPage('list')
  }

  /* ================= DELETE ================= */
  async function remove(id) {
    await supabase.from('transactions').delete().eq('id', id)
    load()
  }

  /* ================= LOGOUT ================= */
  async function logout() {
    await supabase.auth.signOut()
    setUser(null)
  }

  /* ================= CALC ================= */
  const dep = transactions.filter(t => t.type === 'depense')
  const rec = transactions.filter(t => t.type === 'recette')

  const totalDep = dep.reduce((a, b) => a + b.montant, 0)
  const totalRec = rec.reduce((a, b) => a + b.montant, 0)
  const solde = totalRec - totalDep

  const advice = getFinanceAdvice(totalDep, totalRec)

  const chart = [
    { name: 'Recettes', value: totalRec },
    { name: 'Dépenses', value: totalDep }
  ]

  const COLORS = ['#22c55e', '#ef4444']

  /* LOGIN */
  if (!user) return <Login setUser={setUser} />

  return (
    <div className={dark ? "app dark" : "app"}>

      {/* TOP BAR */}
      <div className="topbar">
        <div>
          <h3>💰 Finance </h3>
          <small>{user.email}</small>
        </div>

        <div>
          <button onClick={() => setDark(!dark)} className="icon-btn">
            {dark ? "☀️" : "🌙"}
          </button>

          <button onClick={logout} className="logout-btn">
            🚪
          </button>
        </div>
      </div>

      {/* CONTENT */}
      <div className="content">

        {/* HOME */}
        {page === 'home' && (
          <>
            <div className="card big-card">
              <h5>Solde actuel</h5>
              <h1>{solde.toLocaleString()} FCFA</h1>
            </div>

            <div className="card">
              <h5>🧠 Analyse </h5>
              {advice.map((a, i) => (
                <p key={i}>• {a}</p>
              ))}
            </div>

            <div className="grid">
              <div className="card small">
                <h6>Recettes</h6>
                <b className="green">{totalRec} FCFA</b>
              </div>

              <div className="card small">
                <h6>Dépenses</h6>
                <b className="red">{totalDep} FCFA</b>
              </div>
            </div>

            <div className="card">
              <h5>Graphique</h5>

              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={chart} dataKey="value" outerRadius={80}>
                    {chart.map((_, i) => (
                      <Cell key={i} fill={COLORS[i]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </>
        )}

        {/* LIST */}
        {page === 'list' && (
          <div>
            {transactions.map(t => (
              <div key={t.id} className="tx">
                <div>
                  <b>{t.label}</b>
                  <div className="meta">
                    {t.type} • {formatDate(t.created_at)}
                  </div>
                </div>

                <div>
                  <span className={t.type}>
                    {t.montant} FCFA
                  </span>

                  <button onClick={() => remove(t.id)}>🗑️</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ADD (inchangé) */}
        {page === 'add' && (
          <div className="card form">

            <input placeholder="Libellé"
              value={label}
              onChange={e => setLabel(e.target.value)} />

            <input placeholder="Montant"
              type="number"
              value={montant}
              onChange={e => setMontant(e.target.value)} />

            <select value={type}
              onChange={e => setType(e.target.value)}>
              <option value="depense">Dépense</option>
              <option value="recette">Recette</option>
            </select>

            <button onClick={add}>Enregistrer</button>
          </div>
        )}

      </div>

      {/* NAV */}
      <div className="bottom-nav">
        <button onClick={() => setPage('home')}>🏠</button>
        <button onClick={() => setPage('list')}>📊</button>
        <button onClick={() => setPage('add')}>➕</button>
      </div>

      {/* STYLE APP */}
      <style>{`
.app{
  font-family: 'Inter', sans-serif;
  background:#f4f6fb;
  min-height:100vh;
  color:#111;
}

.dark{
  background:#0f172a;
  color:#e2e8f0;
}

.topbar{
  display:flex;
  justify-content:space-between;
  align-items:center;
  padding:15px;
}

.content{
  padding:15px;
  padding-bottom:90px;
}

.card{
  background:white;
  padding:18px;
  border-radius:18px;
  margin-bottom:15px;
  box-shadow:0 6px 20px rgba(0,0,0,0.06);
}

.dark .card{
  background:#1e293b;
  box-shadow:none;
}

.big-card{text-align:center;}
.big-card h1{font-size:34px;}

.grid{
  display:grid;
  grid-template-columns:1fr 1fr;
  gap:12px;
}

.green{color:#22c55e}
.red{color:#ef4444}

.tx{
  display:flex;
  justify-content:space-between;
  padding:14px;
  border-radius:14px;
  background:white;
  margin-bottom:10px;
}

.dark .tx{background:#1e293b;}

.meta{font-size:12px;opacity:0.7;}

button{
  padding:10px 12px;
  border:none;
  border-radius:10px;
  background:#2563eb;
  color:white;
}

.icon-btn{background:#e2e8f0;color:#111;}
.dark .icon-btn{background:#334155;color:white;}

.logout-btn{background:#ef4444;}

.form input,.form select{
  width:100%;
  padding:12px;
  margin-bottom:12px;
  border-radius:12px;
  border:1px solid #ddd;
}

.bottom-nav{
  position:fixed;
  bottom:0;
  width:100%;
  display:flex;
  justify-content:space-around;
  padding:12px;
  background:white;
}

.dark .bottom-nav{background:#1e293b;}

.bottom-nav button{
  background:none;
  font-size:20px;
  color:#111;
}

.dark .bottom-nav button{color:white;}

@media(max-width:400px){
  .grid{grid-template-columns:1fr;}
  .big-card h1{font-size:26px;}
}
`}</style>

    </div>
  )
}

/* LOGIN PRO */
function Login({ setUser }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  async function login() {
    const { data, error } = await supabase.auth.signInWithPassword({
      email, password
    })
    if (error) return alert(error.message)
    setUser(data.user)
  }

  async function register() {
    const { error } = await supabase.auth.signUp({
      email, password
    })
    if (error) return alert(error.message)
    alert("Compte créé 👍")
  }

  return (
    <div className="login-wrapper">
      <div className="login-card">
        <h2>💰 Finance </h2>
        <p className="subtitle">Gérez vos finances simplement</p>

        <input placeholder="Email" onChange={e => setEmail(e.target.value)} />
        <input type="password" placeholder="Mot de passe" onChange={e => setPassword(e.target.value)} />

        <button onClick={login} className="login-btn">Se connecter</button>
        <button onClick={register} className="register-btn">Créer un compte</button>
      </div>

      <style>{`
.login-wrapper{
  min-height:100vh;
  display:flex;
  align-items:center;
  justify-content:center;
  background:linear-gradient(135deg,#2563eb,#7c3aed);
}

.login-card{
  width:100%;
  max-width:380px;
  background:white;
  padding:30px;
  border-radius:20px;
  text-align:center;
}

.subtitle{margin-bottom:15px;color:#64748b;}

.login-card input{
  width:100%;
  padding:14px;
  margin-bottom:12px;
  border-radius:12px;
  border:1px solid #ddd;
}

.login-btn{
  width:100%;
  padding:14px;
  margin-bottom:10px;
}

.register-btn{
  width:100%;
  padding:12px;
  background:#eee;
}
`}</style>
    </div>
  )
}