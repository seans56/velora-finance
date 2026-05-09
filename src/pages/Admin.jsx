import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const fmtIDR = (n) => 'Rp ' + (Number(n)||0).toLocaleString('id-ID')

const css = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@300;400;500;600&display=swap');
  .vf-root { font-family: 'DM Sans', sans-serif; }
  .vf-card { background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.07); border-radius:20px; padding:18px; margin-bottom:14px; }
  .vf-row { display:flex; justify-content:space-between; align-items:center; padding:10px 6px; border-bottom:1px solid rgba(255,255,255,0.05); border-radius:8px; transition:background 0.15s; }
  .vf-row:last-child { border-bottom:none; }
  .vf-row:hover { background:rgba(255,255,255,0.03); }
  .vf-input { background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); color:#fff; border-radius:10px; padding:10px 12px; font-size:13px; width:100%; box-sizing:border-box; font-family:'DM Sans',sans-serif; outline:none; transition:border-color 0.2s; }
  .vf-input:focus { border-color:rgba(74,158,255,0.5); }
  .vf-btn-green { background:linear-gradient(135deg,#00c853,#00a844); color:#000; border:none; padding:10px 18px; border-radius:10px; font-size:13px; font-weight:600; cursor:pointer; font-family:'DM Sans',sans-serif; transition:opacity 0.2s; }
  .vf-btn-green:hover { opacity:0.85; }
  .vf-btn-red { background:rgba(255,100,100,0.1); color:#ff6464; border:1px solid rgba(255,100,100,0.2); padding:5px 12px; border-radius:8px; font-size:11px; cursor:pointer; font-family:'DM Sans',sans-serif; }
  .vf-btn-red:hover { background:rgba(255,100,100,0.2); }
  .vf-label { font-size:11px; color:#4a6a8a; margin-bottom:4px; letter-spacing:0.06em; }
  .vf-modal { position:fixed; top:0; left:0; right:0; bottom:0; background:rgba(0,0,0,0.75); display:flex; align-items:center; justify-content:center; z-index:100; backdrop-filter:blur(4px); }
  .vf-modal-box { background:#0d1828; border:1px solid rgba(255,255,255,0.1); border-radius:20px; padding:24px; width:440px; max-width:92vw; }
  @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
  .vf-fadein { animation:fadeUp 0.35s ease forwards; }
  .user-card { background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.06); border-radius:14px; padding:14px; margin-bottom:10px; transition:border-color 0.2s; cursor:pointer; }
  .user-card:hover { border-color:rgba(74,158,255,0.3); }
  .user-card.selected { border-color:rgba(74,158,255,0.5); background:rgba(74,158,255,0.05); }
`

export default function Admin() {
  const [isAdmin, setIsAdmin] = useState(null)
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState([])
  const [admins, setAdmins] = useState([])
  const [selectedUser, setSelectedUser] = useState(null)
  const [userDetail, setUserDetail] = useState(null)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [showTambahAdmin, setShowTambahAdmin] = useState(false)
  const [emailBaru, setEmailBaru] = useState('')
  const [namaBaru, setNamaBaru] = useState('')
  const [saving, setSaving] = useState(false)
  const [stats, setStats] = useState({ totalUser:0, totalHutang:0, totalAset:0 })

  useEffect(() => { checkAdmin() }, [])

  const checkAdmin = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setIsAdmin(false); setLoading(false); return }
    const { data } = await supabase.from('admins').select('*').eq('user_id', user.id)
    if (!data || data.length === 0) { setIsAdmin(false); setLoading(false); return }
    setIsAdmin(true)
    await Promise.all([loadUsers(), loadAdmins()])
    setLoading(false)
  }

  const loadUsers = async () => {
    const { data: hutangAll } = await supabase.from('hutang').select('user_id, sisa, status')
    const { data: rekeningAll } = await supabase.from('rekening').select('user_id, saldo, mata_uang')
    const { data: emasAll } = await supabase.from('emas').select('user_id, berat_gram, harga_beli_per_gram')
    const { data: adminList } = await supabase.from('admins').select('user_id, email, nama, created_at')

    const allIds = new Set([
      ...(hutangAll||[]).map(h => h.user_id),
      ...(rekeningAll||[]).map(r => r.user_id),
      ...(emasAll||[]).map(e => e.user_id),
      ...(adminList||[]).map(a => a.user_id),
    ])

    const userMap = {}
    allIds.forEach(id => {
      if (!id) return
      const admin = (adminList||[]).find(a => a.user_id === id)
      userMap[id] = {
        user_id: id,
        email: admin?.email || 'Unknown',
        nama: admin?.nama || 'User',
        isAdmin: !!admin,
        totalHutang: (hutangAll||[]).filter(h => h.user_id === id && h.status !== 'lunas').reduce((s, h) => s + Number(h.sisa), 0),
        totalRekening: (rekeningAll||[]).filter(r => r.user_id === id && (r.mata_uang||'IDR') === 'IDR').reduce((s, r) => s + Number(r.saldo), 0),
        totalEmas: (emasAll||[]).filter(e => e.user_id === id).reduce((s, e) => s + Number(e.berat_gram||0) * Number(e.harga_beli_per_gram||0), 0),
        joined: admin?.created_at,
      }
    })

    const userList = Object.values(userMap)
    setUsers(userList)
    setStats({
      totalUser: userList.length,
      totalHutang: userList.reduce((s, u) => s + u.totalHutang, 0),
      totalAset: userList.reduce((s, u) => s + u.totalRekening + u.totalEmas, 0),
    })
  }

  const loadAdmins = async () => {
    const { data } = await supabase.from('admins').select('*').order('created_at')
    setAdmins(data || [])
  }

  const loadUserDetail = async (userId) => {
    setLoadingDetail(true)
    setSelectedUser(userId)
    const [{ data: hutang }, { data: rekening }, { data: emas }, { data: crypto }, { data: transaksi }] = await Promise.all([
      supabase.from('hutang').select('*').eq('user_id', userId),
      supabase.from('rekening').select('*').eq('user_id', userId),
      supabase.from('emas').select('*').eq('user_id', userId),
      supabase.from('crypto').select('*').eq('user_id', userId),
      supabase.from('transaksi').select('*').eq('user_id', userId).order('tanggal', { ascending: false }).limit(5),
    ])
    setUserDetail({ hutang: hutang||[], rekening: rekening||[], emas: emas||[], crypto: crypto||[], transaksi: transaksi||[] })
    setLoadingDetail(false)
  }

  const tambahAdmin = async () => {
    if (!emailBaru) return
    setSaving(true)
    const { error } = await supabase.from('admins').insert({ email: emailBaru, nama: namaBaru || emailBaru, user_id: null })
    if (error) { alert('Error: ' + error.message); setSaving(false); return }
    setEmailBaru(''); setNamaBaru(''); setShowTambahAdmin(false)
    loadAdmins()
    alert('Admin ditambahkan! Mereka perlu login dulu agar user_id terhubung.')
    setSaving(false)
  }

  const hapusAdmin = async (id) => {
    if (!window.confirm('Hapus admin ini?')) return
    await supabase.from('admins').delete().eq('id', id)
    loadAdmins()
  }

  const selectedUserData = users.find(u => u.user_id === selectedUser)

  if (loading) return (
    <div style={{ display:'flex', height:'100vh', background:'#080c14', alignItems:'center', justifyContent:'center' }}>
      <div style={{ color:'#4a9eff', fontSize:'13px', fontFamily:'DM Sans,sans-serif' }}>Memuat...</div>
    </div>
  )

  if (!isAdmin) return (
    <div style={{ display:'flex', height:'100vh', background:'#080c14', alignItems:'center', justifyContent:'center' }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ fontSize:'48px', marginBottom:'16px' }}>🔒</div>
        <div style={{ fontFamily:'DM Serif Display,serif', fontSize:'20px', color:'#e8f0fe', marginBottom:'8px' }}>Akses Ditolak</div>
        <div style={{ fontSize:'13px', color:'#4a6a8a' }}>Kamu tidak punya akses ke halaman admin</div>
      </div>
    </div>
  )

  return (
    <>
      <style>{css}</style>
      <div className="vf-root" style={{ padding:'24px 20px', background:'#080c14', minHeight:'100vh', color:'#fff' }}>

        {/* HEADER */}
        <div className="vf-fadein" style={{ marginBottom:'24px' }}>
          <div style={{ fontSize:'11px', color:'#4a6a8a', letterSpacing:'0.08em', marginBottom:'4px' }}>SISTEM</div>
          <div style={{ fontFamily:'DM Serif Display,serif', fontSize:'22px', color:'#e8f0fe' }}>Admin Panel</div>
        </div>

        {/* STATS */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'10px', marginBottom:'20px' }}>
          {[
            { label:'TOTAL USER', value: stats.totalUser, icon:'👥', color:'#4a9eff', bg:'rgba(74,158,255,0.08)', border:'rgba(74,158,255,0.2)' },
            { label:'TOTAL ASET', value: fmtIDR(stats.totalAset), icon:'💰', color:'#4cde8a', bg:'rgba(0,200,83,0.08)', border:'rgba(0,200,83,0.2)' },
            { label:'TOTAL HUTANG', value: fmtIDR(stats.totalHutang), icon:'📉', color:'#ff6464', bg:'rgba(255,100,100,0.08)', border:'rgba(255,100,100,0.2)' },
          ].map((s, i) => (
            <div key={i} style={{ background: s.bg, border:`1px solid ${s.border}`, borderRadius:'16px', padding:'16px' }}>
              <div style={{ fontSize:'20px', marginBottom:'8px' }}>{s.icon}</div>
              <div style={{ fontSize:'10px', color:'#4a6a8a', letterSpacing:'0.08em', marginBottom:'4px' }}>{s.label}</div>
              <div style={{ fontFamily:'DM Serif Display,serif', fontSize:'18px', color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px' }}>

          {/* DAFTAR USER */}
          <div>
            <div className="vf-card">
              <div style={{ fontSize:'12px', fontWeight:'600', color:'#c8d8f0', letterSpacing:'0.04em', marginBottom:'14px' }}>
                👥 DAFTAR USER ({users.length})
              </div>
              {users.length === 0
                ? <div style={{ color:'#3a5a7a', fontSize:'12px' }}>Belum ada user</div>
                : users.map(u => (
                  <div key={u.user_id} className={`user-card${selectedUser === u.user_id ? ' selected' : ''}`} onClick={() => loadUserDetail(u.user_id)}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'8px' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                        <div style={{ width:'32px', height:'32px', borderRadius:'50%', background:'rgba(74,158,255,0.15)', border:'1px solid rgba(74,158,255,0.3)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'14px', fontWeight:'700', color:'#4a9eff' }}>
                          {u.nama?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <div>
                          <div style={{ fontSize:'13px', fontWeight:'600', color:'#e8f0fe' }}>{u.nama}</div>
                          <div style={{ fontSize:'10px', color:'#4a6a8a' }}>{u.email}</div>
                        </div>
                      </div>
                      {u.isAdmin && (
                        <span style={{ fontSize:'9px', padding:'2px 8px', borderRadius:'20px', background:'rgba(245,200,66,0.1)', color:'#f5c842', border:'1px solid rgba(245,200,66,0.2)' }}>ADMIN</span>
                      )}
                    </div>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'6px' }}>
                      {[
                        { label:'Rekening', value: fmtIDR(u.totalRekening), color:'#4a9eff' },
                        { label:'Emas', value: fmtIDR(u.totalEmas), color:'#f5c842' },
                        { label:'Hutang', value: fmtIDR(u.totalHutang), color:'#ff6464' },
                      ].map((k, i) => (
                        <div key={i} style={{ background:'rgba(255,255,255,0.03)', borderRadius:'8px', padding:'6px 8px' }}>
                          <div style={{ fontSize:'9px', color:'#4a6a8a', marginBottom:'2px' }}>{k.label}</div>
                          <div style={{ fontSize:'10px', fontWeight:'600', color: k.color }}>{k.value}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              }
            </div>
          </div>

          {/* KANAN */}
          <div>
            {/* DETAIL USER */}
            {selectedUser && selectedUserData ? (
              <div className="vf-card" style={{ marginBottom:'14px' }}>
                <div style={{ fontSize:'12px', fontWeight:'600', color:'#c8d8f0', letterSpacing:'0.04em', marginBottom:'14px' }}>
                  🔍 DETAIL — {selectedUserData.nama}
                </div>
                {loadingDetail ? (
                  <div style={{ color:'#4a6a8a', fontSize:'12px' }}>Memuat...</div>
                ) : userDetail && (
                  <>
                    <div style={{ fontSize:'10px', color:'#ff6464', letterSpacing:'0.06em', marginBottom:'6px' }}>HUTANG AKTIF</div>
                    {userDetail.hutang.filter(h => h.status !== 'lunas').length === 0
                      ? <div style={{ fontSize:'11px', color:'#4cde8a', marginBottom:'10px' }}>Tidak ada hutang 🎉</div>
                      : userDetail.hutang.filter(h => h.status !== 'lunas').map(h => (
                        <div key={h.id} className="vf-row" style={{ fontSize:'11px' }}>
                          <div style={{ color:'#c8d8f0' }}>{h.nama} <span style={{ color:'#4a6a8a', fontSize:'10px' }}>({h.tipe})</span></div>
                          <div style={{ color:'#ff6464', fontWeight:'600' }}>{fmtIDR(h.sisa)}</div>
                        </div>
                      ))
                    }

                    <div style={{ fontSize:'10px', color:'#4a9eff', letterSpacing:'0.06em', margin:'10px 0 6px' }}>REKENING</div>
                    {userDetail.rekening.length === 0
                      ? <div style={{ fontSize:'11px', color:'#3a5a7a', marginBottom:'10px' }}>Belum ada rekening</div>
                      : userDetail.rekening.map(r => (
                        <div key={r.id} className="vf-row" style={{ fontSize:'11px' }}>
                          <div style={{ color:'#c8d8f0' }}>{r.nama}</div>
                          <div style={{ color:'#4a9eff', fontWeight:'600' }}>{fmtIDR(r.saldo)}</div>
                        </div>
                      ))
                    }

                    <div style={{ fontSize:'10px', color:'#4cde8a', letterSpacing:'0.06em', margin:'10px 0 6px' }}>5 TRANSAKSI TERAKHIR</div>
                    {userDetail.transaksi.length === 0
                      ? <div style={{ fontSize:'11px', color:'#3a5a7a' }}>Belum ada transaksi</div>
                      : userDetail.transaksi.map(t => (
                        <div key={t.id} className="vf-row" style={{ fontSize:'11px' }}>
                          <div>
                            <div style={{ color:'#c8d8f0' }}>{t.keterangan}</div>
                            <div style={{ color:'#4a6a8a', fontSize:'10px' }}>{t.tanggal}</div>
                          </div>
                          <div style={{ color: t.tipe==='Pemasukan'?'#4cde8a':'#ff6464', fontWeight:'600' }}>
                            {t.tipe==='Pemasukan'?'+':'-'}{fmtIDR(t.jumlah)}
                          </div>
                        </div>
                      ))
                    }
                  </>
                )}
              </div>
            ) : (
              <div className="vf-card" style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'160px', marginBottom:'14px' }}>
                <div style={{ textAlign:'center' }}>
                  <div style={{ fontSize:'28px', marginBottom:'8px' }}>👆</div>
                  <div style={{ fontSize:'12px', color:'#4a6a8a' }}>Klik user untuk lihat detail</div>
                </div>
              </div>
            )}

            {/* KELOLA ADMIN */}
            <div className="vf-card">
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'14px' }}>
                <div style={{ fontSize:'12px', fontWeight:'600', color:'#c8d8f0', letterSpacing:'0.04em' }}>🔑 DAFTAR ADMIN</div>
                <button className="vf-btn-green" style={{ padding:'6px 12px', fontSize:'11px' }} onClick={() => setShowTambahAdmin(true)}>
                  + Tambah
                </button>
              </div>
              {admins.map(a => (
                <div key={a.id} className="vf-row">
                  <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                    <div style={{ width:'8px', height:'8px', borderRadius:'50%', background:'#f5c842' }} />
                    <div>
                      <div style={{ fontSize:'13px', color:'#c8d8f0', fontWeight:'500' }}>{a.nama}</div>
                      <div style={{ fontSize:'10px', color:'#4a6a8a' }}>{a.email}</div>
                    </div>
                  </div>
                  <button className="vf-btn-red" onClick={() => hapusAdmin(a.id)}>Hapus</button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* MODAL TAMBAH ADMIN */}
        {showTambahAdmin && (
          <div className="vf-modal" onClick={() => setShowTambahAdmin(false)}>
            <div className="vf-modal-box" onClick={e => e.stopPropagation()}>
              <div style={{ fontFamily:'DM Serif Display,serif', fontSize:'18px', color:'#e8f0fe', marginBottom:'20px' }}>Tambah Admin Baru</div>
              <div style={{ marginBottom:'12px' }}>
                <div className="vf-label">EMAIL</div>
                <input className="vf-input" value={emailBaru} onChange={e => setEmailBaru(e.target.value)} placeholder='email@gmail.com' />
              </div>
              <div style={{ marginBottom:'16px' }}>
                <div className="vf-label">NAMA</div>
                <input className="vf-input" value={namaBaru} onChange={e => setNamaBaru(e.target.value)} placeholder='Nama admin' />
              </div>
              <div style={{ display:'flex', gap:'8px' }}>
                <button className="vf-btn-green" onClick={tambahAdmin} disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan'}</button>
                <button className="vf-btn-red" style={{ padding:'10px 16px' }} onClick={() => setShowTambahAdmin(false)}>Batal</button>
              </div>
            </div>
          </div>
        )}

      </div>
    </>
  )
}
