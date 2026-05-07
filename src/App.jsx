import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom'
import { supabase } from './lib/supabase'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Hutang from './pages/Hutang'
import Rekening from './pages/Rekening'
import Saham from './pages/Saham'
import Cashflow from './pages/Cashflow'
import History from './pages/History'
import Crypto from './pages/Crypto'
import Emas from './pages/Emas'

const NAV = [
  { to:'/dashboard', label:'Dashboard', icon:'📊' },
  { to:'/history', label:'History', icon:'📋' },
  { to:'/rekening', label:'Rekening', icon:'💳' },
  { to:'/hutang', label:'Hutang', icon:'📉' },
  { to:'/saham', label:'Saham', icon:'📈' },
  { to:'/crypto', label:'Crypto', icon:'🪙' },
  { to:'/emas', label:'Emas', icon:'🥇' },
  { to:'/cashflow', label:'Cashflow', icon:'💸' },
]

const css = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@300;400;500;600&display=swap');
  * { box-sizing: border-box; }
  body { margin: 0; background: #080c14; }

  .vf-sidebar {
    width: 200px;
    background: #080c14;
    border-right: 1px solid rgba(255,255,255,0.06);
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
    height: 100vh;
    position: sticky;
    top: 0;
  }

  .vf-sidebar-header {
    padding: 20px 16px 16px;
    border-bottom: 1px solid rgba(255,255,255,0.06);
  }

  .vf-brand {
    font-family: 'DM Serif Display', serif;
    font-size: 16px;
    color: #f5c842;
    letter-spacing: -0.01em;
    margin-bottom: 4px;
  }

  .vf-username {
    font-family: 'DM Sans', sans-serif;
    font-size: 11px;
    color: #4a6a8a;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .vf-nav {
    padding: 10px 8px;
    flex: 1;
    overflow-y: auto;
  }

  .vf-nav-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 9px 10px;
    text-decoration: none;
    font-family: 'DM Sans', sans-serif;
    font-size: 13px;
    color: #4a6a8a;
    border-radius: 10px;
    margin-bottom: 2px;
    transition: all 0.15s;
    border: 1px solid transparent;
  }

  .vf-nav-item:hover {
    background: rgba(255,255,255,0.04);
    color: #c8d8f0;
  }

  .vf-nav-item.active {
    background: rgba(74,158,255,0.1);
    color: #fff;
    border-color: rgba(74,158,255,0.2);
  }

  .vf-nav-icon {
    font-size: 15px;
    width: 20px;
    text-align: center;
  }

  .vf-logout-btn {
    width: 100%;
    background: rgba(255,100,100,0.08);
    color: #ff6464;
    border: 1px solid rgba(255,100,100,0.15);
    padding: 9px;
    border-radius: 10px;
    cursor: pointer;
    font-size: 12px;
    font-family: 'DM Sans', sans-serif;
    font-weight: 500;
    transition: background 0.2s;
  }

  .vf-logout-btn:hover {
    background: rgba(255,100,100,0.15);
  }

  .vf-sidebar-footer {
    padding: 12px;
    border-top: 1px solid rgba(255,255,255,0.06);
  }

  .vf-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #4cde8a;
    display: inline-block;
    margin-right: 6px;
    box-shadow: 0 0 6px #4cde8a;
  }
`

const Sidebar = ({ user, onLogout }) => {
  const loc = useLocation()
  return (
    <>
      <style>{css}</style>
      <div className="vf-sidebar">
        <div className="vf-sidebar-header">
          <div className="vf-brand">Velora Finance</div>
          <div className="vf-username">
            <span className="vf-dot" />
            {user?.user_metadata?.full_name || 'User'}
          </div>
        </div>

        <nav className="vf-nav">
          {NAV.map(item => {
            const active = loc.pathname === item.to
            return (
              <Link key={item.to} to={item.to} className={`vf-nav-item${active?' active':''}`}>
                <span className="vf-nav-icon">{item.icon}</span>
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="vf-sidebar-footer">
          <button className="vf-logout-btn" onClick={onLogout}>
            🚪 Logout
          </button>
        </div>
      </div>
    </>
  )
}

export default function App() {
  const [user, setUser] = useState(undefined)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => setUser(session?.user ?? null)
    )
    return () => subscription.unsubscribe()
  }, [])

  const logout = async () => {
    await supabase.auth.signOut()
    setUser(null)
  }

  if (user === undefined) return (
    <div style={{ display:'flex', height:'100vh', background:'#080c14', alignItems:'center', justifyContent:'center' }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ fontFamily:'DM Serif Display, serif', fontSize:'20px', color:'#f5c842', marginBottom:'8px' }}>
          Velora Finance
        </div>
        <div style={{ color:'#4a6a8a', fontSize:'12px', fontFamily:'DM Sans, sans-serif', letterSpacing:'0.1em' }}>
          MEMUAT...
        </div>
      </div>
    </div>
  )

  const Layout = ({ children }) => (
    <div style={{ display:'flex', height:'100vh', background:'#080c14' }}>
      <Sidebar user={user} onLogout={logout} />
      <main style={{ flex:1, overflowY:'auto' }}>{children}</main>
    </div>
  )

  return (
    <BrowserRouter>
      <Routes>
        <Route path='/login' element={!user ? <Login /> : <Navigate to='/dashboard' />} />
        <Route path='/dashboard' element={user ? <Layout><Dashboard /></Layout> : <Navigate to='/login' />} />
        <Route path='/history' element={user ? <Layout><History /></Layout> : <Navigate to='/login' />} />
        <Route path='/rekening' element={user ? <Layout><Rekening /></Layout> : <Navigate to='/login' />} />
        <Route path='/hutang' element={user ? <Layout><Hutang /></Layout> : <Navigate to='/login' />} />
        <Route path='/saham' element={user ? <Layout><Saham /></Layout> : <Navigate to='/login' />} />
        <Route path='/crypto' element={user ? <Layout><Crypto /></Layout> : <Navigate to='/login' />} />
        <Route path='/emas' element={user ? <Layout><Emas /></Layout> : <Navigate to='/login' />} />
        <Route path='/cashflow' element={user ? <Layout><Cashflow /></Layout> : <Navigate to='/login' />} />
        <Route path='*' element={<Navigate to={user ? '/dashboard' : '/login'} />} />
      </Routes>
    </BrowserRouter>
  )
}