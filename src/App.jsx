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

  /* ================= LOGIN ================= */
  if (!user) return <Login setUser={setUser} />

  return (
    <div className={dark ? "app dark" : "app"}>

      {/* TOP BAR */}
      <div className="topbar">
        <div>
          <h3>💰 Finance AI</h3>
          <small>{user.email}</small>
        </div>

        <button onClick={() => setDark(!dark)} className="icon-btn">
          {dark ? "☀️" : "🌙"}
        </button>
      </div>

      {/* CONTENT */}
      <div className="content">

        {/* HOME */}
        {page === 'home' && (
          <>
            <div className="card big-card">
              <h5>Solde actuel</h5>
              <h1>{solde.toLocaleString()} €</h1>
            </div>

            <div className="card">
              <h5>🧠 Analyse IA</h5>
              {advice.map((a, i) => (
                <p key={i}>• {a}</p>
              ))}
            </div>

            <div className="grid">
              <div className="card small">
                <h6>Recettes</h6>
                <b className="green">{totalRec} €</b>
              </div>

              <div className="card small">
                <h6>Dépenses</h6>
                <b className="red">{totalDep} €</b>
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
                </div>

                <div>
                  <span className={t.type}>
                    {t.montant} €
                  </span>

                  <button onClick={() => remove(t.id)}>🗑️</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ADD */}
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

      {/* BOTTOM NAV */}
      <div className="bottom-nav">
        <button onClick={() => setPage('home')}>🏠</button>
        <button onClick={() => setPage('list')}>📊</button>
        <button onClick={() => setPage('add')}>➕</button>
      </div>

      {/* STYLE */}
      <style>{`
        .app{
          font-family: sans-serif;
          background:#f4f6fb;
          min-height:100vh;
          color:#111;
        }

        .dark{
          background:#0f172a;
          color:white;
        }

        .topbar{
          display:flex;
          justify-content:space-between;
          padding:15px;
        }

        .content{
          padding:15px;
          padding-bottom:80px;
        }

        .card{
          background:white;
          padding:15px;
          border-radius:16px;
          margin-bottom:12px;
          box-shadow:0 5px 15px rgba(0,0,0,0.05);
        }

        .dark .card{
          background:#1e293b;
        }

        .big-card h1{
          font-size:32px;
        }

        .grid{
          display:grid;
          grid-template-columns:1fr 1fr;
          gap:10px;
        }

        .small{
          text-align:center;
        }

        .green{color:#22c55e}
        .red{color:#ef4444}

        .tx{
          display:flex;
          justify-content:space-between;
          padding:12px;
          background:white;
          border-radius:12px;
          margin-bottom:10px;
        }

        .dark .tx{
          background:#1e293b;
        }

        .form input, .form select{
          width:100%;
          padding:10px;
          margin-bottom:10px;
          border-radius:10px;
          border:1px solid #ddd;
        }

        button{
          padding:10px;
          border:none;
          border-radius:10px;
          background:#2563eb;
          color:white;
        }

        .bottom-nav{
          position:fixed;
          bottom:0;
          left:0;
          right:0;
          display:flex;
          justify-content:space-around;
          background:white;
          padding:10px;
          border-top:1px solid #ddd;
        }

        .dark .bottom-nav{
          background:#1e293b;
        }

        .icon-btn{
          background:none;
          font-size:18px;
        }
      `}</style>

    </div>
  )
}

/* ================= LOGIN ================= */
function Login({ setUser }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  async function login() {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) return alert(error.message)
    setUser(data.user)
  }

  async function register() {
    const { error } = await supabase.auth.signUp({
      email,
      password
    })

    if (error) return alert(error.message)
    alert("Compte créé 👍")
  }

  return (
    <div className="login">

      <h2>💰 Finance AI</h2>

      <input placeholder="Email"
        onChange={e => setEmail(e.target.value)} />

      <input type="password"
        placeholder="Password"
        onChange={e => setPassword(e.target.value)} />

      <button onClick={login}>Login</button>
      <button onClick={register}>Register</button>

      <style>{`
        .login{
          display:flex;
          flex-direction:column;
          justify-content:center;
          height:100vh;
          padding:20px;
          gap:10px;
          text-align:center;
        }

        input{
          padding:12px;
          border-radius:10px;
          border:1px solid #ddd;
        }

        button{
          padding:12px;
          border:none;
          border-radius:10px;
          background:#2563eb;
          color:white;
        }
      `}</style>
    </div>
  )
}