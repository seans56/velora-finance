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
import LaporanPDF from './pages/LaporanPDF'
import Admin from './pages/Admin'

const NAV = [
  { to:'/dashboard', label:'Dashboard', icon:'📊' },
  { to:'/history', label:'History', icon:'📋' },
  { to:'/rekening', label:'Rekening', icon:'💳' },
  { to:'/hutang', label:'Hutang', icon:'📉' },
  { to:'/saham', label:'Saham', icon:'📈' },
  { to:'/crypto', label:'Crypto', icon:'🪙' },
  { to:'/emas', label:'Emas', icon:'🥇' },
  { to:'/cashflow', label:'Cashflow', icon:'💸' },
  { to:'/laporan', label:'Laporan', icon:'📑' },
  { to:'/admin', label:'Admin', icon:'🔑' },
]

const BOTTOM_NAV = [
  { to:'/dashboard', label:'Home', icon:'📊' },
  { to:'/rekening', label:'Wallet', icon:'💳' },
  { to:'/hutang', label:'Hutang', icon:'📉' },
  { to:'/cashflow', label:'Cash', icon:'💸' },
  { to:'/history', label:'History', icon:'📋' },
]

const MORE_NAV = [
  { to:'/saham', label:'Saham', icon:'📈' },
  { to:'/crypto', label:'Crypto', icon:'🪙' },
  { to:'/emas', label:'Emas', icon:'🥇' },
  { to:'/laporan', label:'Laporan PDF', icon:'📑' },
  { to:'/admin', label:'Admin Panel', icon:'🔑' },
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
  .vf-nav-item:hover { background: rgba(255,255,255,0.04); color: #c8d8f0; }
  .vf-nav-item.active { background: rgba(74,158,255,0.1); color: #fff; border-color: rgba(74,158,255,0.2); }
  .vf-nav-icon { font-size: 15px; width: 20px; text-align: center; }
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
  .vf-logout-btn:hover { background: rgba(255,100,100,0.15); }
  .vf-sidebar-footer { padding: 12px; border-top: 1px solid rgba(255,255,255,0.06); }
  .vf-dot { width: 6px; height: 6px; border-radius: 50%; background: #4cde8a; display: inline-block; margin-right: 6px; box-shadow: 0 0 6px #4cde8a; }

  .vf-bottom-nav {
    display: none;
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background: rgba(8,12,20,0.95);
    border-top: 1px solid rgba(255,255,255,0.08);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    z-index: 100;
    padding: 8px 0 env(safe-area-inset-bottom);
  }
  .vf-bottom-nav-inner {
    display: flex;
    justify-content: space-around;
    align-items: center;
  }
  .vf-bottom-nav-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 3px;
    padding: 6px 12px;
    text-decoration: none;
    color: #4a6a8a;
    font-family: 'DM Sans', sans-serif;
    font-size: 10px;
    border-radius: 10px;
    transition: all 0.15s;
    min-width: 56px;
  }
  .vf-bottom-nav-item.active { color: #4a9eff; }
  .vf-bottom-nav-item .bn-icon { font-size: 20px; line-height: 1; }
  .vf-bottom-nav-item .bn-dot {
    width: 4px; height: 4px; border-radius: 50%;
    background: #4a9eff; margin-top: 2px;
    opacity: 0; transition: opacity 0.15s;
  }
  .vf-bottom-nav-item.active .bn-dot { opacity: 1; }

  .vf-mobile-header {
    display: none;
    position: sticky;
    top: 0;
    background: rgba(8,12,20,0.95);
    border-bottom: 1px solid rgba(255,255,255,0.06);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    padding: 12px 16px;
    z-index: 99;
    align-items: center;
    justify-content: space-between;
  }
  .vf-mobile-header-brand {
    font-family: 'DM Serif Display', serif;
    font-size: 16px;
    color: #f5c842;
  }

  .vf-more-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.6);
    z-index: 200;
    backdrop-filter: blur(4px);
  }
  .vf-more-sheet {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background: #0d1828;
    border-top: 1px solid rgba(255,255,255,0.1);
    border-radius: 20px 20px 0 0;
    padding: 20px 20px calc(80px + env(safe-area-inset-bottom));
    z-index: 201;
    animation: slideUp 0.25s ease;
  }
  @keyframes slideUp {
    from { transform: translateY(100%); }
    to { transform: translateY(0); }
  }
  .vf-more-sheet-title {
    font-family: 'DM Sans', sans-serif;
    font-size: 11px;
    color: #4a6a8a;
    letter-spacing: 0.08em;
    margin-bottom: 16px;
  }
  .vf-more-item {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 14px 12px;
    text-decoration: none;
    color: #c8d8f0;
    font-family: 'DM Sans', sans-serif;
    font-size: 14px;
    border-radius: 12px;
    transition: background 0.15s;
    margin-bottom: 4px;
  }
  .vf-more-item:hover, .vf-more-item.active { background: rgba(74,158,255,0.1); color: #fff; }
  .vf-more-icon { font-size: 22px; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.05); border-radius: 10px; }
  .vf-more-logout {
    width: 100%;
    background: rgba(255,100,100,0.08);
    color: #ff6464;
    border: 1px solid rgba(255,100,100,0.15);
    padding: 12px;
    border-radius: 12px;
    cursor: pointer;
    font-size: 14px;
    font-family: 'DM Sans', sans-serif;
    font-weight: 500;
    margin-top: 8px;
    transition: background 0.2s;
  }
  .vf-more-logout:hover { background: rgba(255,100,100,0.15); }

  @media (max-width: 768px) {
    .vf-sidebar { display: none !important; }
    .vf-bottom-nav { display: block !important; }
    .vf-mobile-header { display: flex !important; }
    .vf-main-content { padding-bottom: 80px !important; }
  }

  @media (min-width: 769px) {
    .vf-bottom-nav { display: none !important; }
    .vf-mobile-header { display: none !important; }
  }
`

const Sidebar = ({ user, onLogout }) => {
  const loc = useLocation()
  return (
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
        <button className="vf-logout-btn" onClick={onLogout}>🚪 Logout</button>
      </div>
    </div>
  )
}

const MobileHeader = ({ user, onMoreClick }) => (
  <div className="vf-mobile-header">
    <div className="vf-mobile-header-brand">Velora Finance</div>
    <button onClick={onMoreClick} style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', color:'#c8d8f0', padding:'6px 12px', borderRadius:'8px', cursor:'pointer', fontSize:'12px', fontFamily:'DM Sans,sans-serif' }}>
      ☰ Menu
    </button>
  </div>
)

const BottomNav = ({ onMoreClick }) => {
  const loc = useLocation()
  return (
    <div className="vf-bottom-nav">
      <div className="vf-bottom-nav-inner">
        {BOTTOM_NAV.map(item => {
          const active = loc.pathname === item.to
          return (
            <Link key={item.to} to={item.to} className={`vf-bottom-nav-item${active?' active':''}`}>
              <span className="bn-icon">{item.icon}</span>
              <span>{item.label}</span>
              <span className="bn-dot" />
            </Link>
          )
        })}
        <button onClick={onMoreClick} className="vf-bottom-nav-item" style={{ background:'none', border:'none', cursor:'pointer' }}>
          <span className="bn-icon">⋯</span>
          <span>Lainnya</span>
          <span className="bn-dot" style={{ opacity:0 }} />
        </button>
      </div>
    </div>
  )
}

const MoreSheet = ({ onClose, onLogout, user }) => {
  const loc = useLocation()
  return (
    <>
      <div className="vf-more-overlay" onClick={onClose} />
      <div className="vf-more-sheet">
        <div className="vf-more-sheet-title">MENU LAINNYA</div>
        {MORE_NAV.map(item => (
          <Link key={item.to} to={item.to} className={`vf-more-item${loc.pathname===item.to?' active':''}`} onClick={onClose}>
            <span className="vf-more-icon">{item.icon}</span>
            {item.label}
          </Link>
        ))}
        <div style={{ height:'1px', background:'rgba(255,255,255,0.06)', margin:'12px 0' }} />
        <div style={{ fontSize:'11px', color:'#4a6a8a', fontFamily:'DM Sans,sans-serif', marginBottom:'8px', padding:'0 4px' }}>
          Login sebagai {user?.user_metadata?.full_name || 'User'}
        </div>
        <button className="vf-more-logout" onClick={() => { onLogout(); onClose() }}>
          🚪 Logout
        </button>
      </div>
    </>
  )
}

export default function App() {
  const [user, setUser] = useState(undefined)
  const [showMore, setShowMore] = useState(false)

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
        <div style={{ fontFamily:'DM Serif Display, serif', fontSize:'20px', color:'#f5c842', marginBottom:'8px' }}>Velora Finance</div>
        <div style={{ color:'#4a6a8a', fontSize:'12px', fontFamily:'DM Sans, sans-serif', letterSpacing:'0.1em' }}>MEMUAT...</div>
      </div>
    </div>
  )

  const Layout = ({ children }) => (
    <>
      <style>{css}</style>
      <div style={{ display:'flex', height:'100vh', background:'#080c14' }}>
        <Sidebar user={user} onLogout={logout} />
        <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
          <MobileHeader user={user} onMoreClick={() => setShowMore(true)} />
          <main className="vf-main-content" style={{ flex:1, overflowY:'auto' }}>
            {children}
          </main>
        </div>
        <BottomNav onMoreClick={() => setShowMore(true)} />
        {showMore && <MoreSheet onClose={() => setShowMore(false)} onLogout={logout} user={user} />}
      </div>
    </>
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
        <Route path='/laporan' element={user ? <Layout><LaporanPDF /></Layout> : <Navigate to='/login' />} />
        <Route path='/admin' element={user ? <Layout><Admin /></Layout> : <Navigate to='/login' />} />
        <Route path='*' element={<Navigate to={user ? '/dashboard' : '/login'} />} />
      </Routes>
    </BrowserRouter>
  )
}