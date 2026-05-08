import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const fmt = (n) => 'Rp ' + (Number(n)||0).toLocaleString('id-ID')
const fmtNum = (raw) => raw.replace(/[^0-9]/g,'')

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID
const CALENDAR_SCOPE = 'https://www.googleapis.com/auth/calendar.events'

const css = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@300;400;500;600&display=swap');
  .vf-root { font-family: 'DM Sans', sans-serif; }
  .vf-card { background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.07); border-radius:20px; padding:18px; margin-bottom:14px; }
  .vf-row { display:flex; justify-content:space-between; align-items:center; padding:10px 6px; border-bottom:1px solid rgba(255,255,255,0.05); border-radius:8px; transition:background 0.15s; }
  .vf-row:last-child { border-bottom:none; }
  .vf-row:hover { background:rgba(255,255,255,0.03); }
  .vf-input { background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); color:#fff; border-radius:10px; padding:10px 12px; font-size:13px; width:100%; box-sizing:border-box; font-family:'DM Sans',sans-serif; outline:none; transition:border-color 0.2s; }
  .vf-input:focus { border-color:rgba(74,158,255,0.5); }
  .vf-input option { background:#0d1828; }
  .vf-btn-green { background:linear-gradient(135deg,#00c853,#00a844); color:#000; border:none; padding:10px 18px; border-radius:10px; font-size:13px; font-weight:600; cursor:pointer; font-family:'DM Sans',sans-serif; transition:opacity 0.2s; }
  .vf-btn-green:hover { opacity:0.85; }
  .vf-btn-blue { background:rgba(74,158,255,0.12); color:#4a9eff; border:1px solid rgba(74,158,255,0.25); padding:9px 14px; border-radius:10px; font-size:12px; font-weight:500; cursor:pointer; font-family:'DM Sans',sans-serif; transition:background 0.2s; }
  .vf-btn-blue:hover { background:rgba(74,158,255,0.22); }
  .vf-btn-red { background:rgba(255,100,100,0.1); color:#ff6464; border:1px solid rgba(255,100,100,0.2); padding:5px 12px; border-radius:8px; font-size:11px; cursor:pointer; font-family:'DM Sans',sans-serif; transition:background 0.2s; }
  .vf-btn-red:hover { background:rgba(255,100,100,0.2); }
  .vf-btn-orange { background:rgba(255,152,0,0.12); color:#ffa726; border:1px solid rgba(255,152,0,0.25); padding:9px 14px; border-radius:10px; font-size:12px; font-weight:500; cursor:pointer; font-family:'DM Sans',sans-serif; transition:background 0.2s; }
  .vf-btn-orange:hover { background:rgba(255,152,0,0.22); }
  .vf-btn-gcal { background:rgba(66,133,244,0.12); color:#4285f4; border:1px solid rgba(66,133,244,0.25); padding:5px 10px; border-radius:8px; font-size:11px; cursor:pointer; font-family:'DM Sans',sans-serif; transition:background 0.2s; }
  .vf-btn-gcal:hover { background:rgba(66,133,244,0.22); }
  .vf-btn-gcal:disabled { opacity:0.5; cursor:not-allowed; }
  .vf-tab { padding:8px 16px; border-radius:10px; font-size:12px; cursor:pointer; border:1px solid rgba(255,255,255,0.07); background:transparent; color:#4a6a8a; font-family:'DM Sans',sans-serif; transition:all 0.2s; }
  .vf-tab:hover { color:#c8d8f0; border-color:rgba(255,255,255,0.15); }
  .vf-tab.active { background:rgba(74,158,255,0.12); color:#4a9eff; border-color:rgba(74,158,255,0.3); }
  .vf-modal { position:fixed; top:0; left:0; right:0; bottom:0; background:rgba(0,0,0,0.75); display:flex; align-items:center; justify-content:center; z-index:100; backdrop-filter:blur(4px); }
  .vf-modal-box { background:#0d1828; border:1px solid rgba(255,255,255,0.1); border-radius:20px; padding:24px; width:440px; max-width:92vw; max-height:90vh; overflow-y:auto; }
  .vf-label { font-size:11px; color:#4a6a8a; margin-bottom:4px; letter-spacing:0.06em; }
  .vf-grid2 { display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:12px; }
  @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
  .vf-fadein { animation:fadeUp 0.35s ease forwards; }
  .vf-progress { width:100%; background:rgba(255,255,255,0.06); border-radius:6px; height:5px; margin-top:6px; overflow:hidden; }
  .vf-progress-bar { height:100%; border-radius:6px; background:linear-gradient(90deg,#00c853,#4cde8a); transition:width 0.6s ease; }
  .gcal-banner { background:rgba(66,133,244,0.08); border:1px solid rgba(66,133,244,0.2); border-radius:14px; padding:12px 16px; margin-bottom:16px; display:flex; justify-content:space-between; align-items:center; gap:10px; }
  .gcal-success { background:rgba(0,200,83,0.08); border:1px solid rgba(0,200,83,0.2); border-radius:10px; padding:10px 14px; font-size:12px; color:#4cde8a; margin-bottom:14px; }
`

const hutangAwal = [
  { nama:'Tunaiku', tipe:'Pinjol', currency:'IDR', total_awal:8624800, sisa:5724800, cicilan_per_bulan:1624960, jatuh_tempo:'2026-08-19', status:'aktif' },
  { nama:'Kredivo 9/9', tipe:'Pinjol', currency:'IDR', total_awal:3784450, sisa:3784450, cicilan_per_bulan:3784450, jatuh_tempo:'2026-06-15', status:'aktif' },
  { nama:'Aku Laku', tipe:'Pinjol', currency:'IDR', total_awal:1743000, sisa:581000, cicilan_per_bulan:581000, jatuh_tempo:'2026-07-01', status:'aktif' },
  { nama:'Setor Makalah', tipe:'Personal', currency:'IDR', total_awal:1300000, sisa:1300000, cicilan_per_bulan:0, jatuh_tempo:null, status:'aktif' },
  { nama:'Atria', tipe:'Personal', currency:'IDR', total_awal:17900000, sisa:17900000, cicilan_per_bulan:0, jatuh_tempo:null, status:'aktif' },
  { nama:'Shardi', tipe:'Personal', currency:'IDR', total_awal:30000000, sisa:30000000, cicilan_per_bulan:0, jatuh_tempo:null, status:'aktif' },
  { nama:'Chief Romadoni', tipe:'Personal', currency:'IDR', total_awal:1000000, sisa:1000000, cicilan_per_bulan:0, jatuh_tempo:null, status:'aktif' },
]

const EMPTY_HUTANG = { nama:'', tipe:'Pinjol', currency:'IDR', total_awal:0, sisa:0, cicilan_per_bulan:0, jatuh_tempo:'' }
const EMPTY_BAYAR = { hutang_id:'', rekening_id:'', tanggal:'', jumlah:0, catatan:'' }
const EMPTY_TRANSFER = { dari_rekening_id:'', ke_rekening_id:'', tanggal:'', jumlah:0, catatan:'' }
const TIPE_COLOR = { Pinjol:'#ff6464', Personal:'#4a9eff', 'Kartu Kredit':'#b464ff', Cicilan:'#ffa726' }

const loadGoogleScript = () => new Promise((resolve) => {
  if (window.google?.accounts) { resolve(); return }
  const script = document.createElement('script')
  script.src = 'https://accounts.google.com/gsi/client'
  script.onload = resolve
  document.head.appendChild(script)
})

export default function Hutang() {
  const [tab, setTab] = useState('hutang')
  const [hutangList, setHutangList] = useState([])
  const [rekening, setRekening] = useState([])
  const [riwayat, setRiwayat] = useState([])
  const [transferList, setTransferList] = useState([])
  const [loading, setLoading] = useState(true)
  const [googleToken, setGoogleToken] = useState(null)
  const [calendarLoading, setCalendarLoading] = useState(false)
  const [calendarSuccess, setCalendarSuccess] = useState('')

  const [showBayar, setShowBayar] = useState(false)
  const [showTransfer, setShowTransfer] = useState(false)
  const [showEditHutang, setShowEditHutang] = useState(false)
  const [showTambah, setShowTambah] = useState(false)

  const [bayarForm, setBayarForm] = useState(EMPTY_BAYAR)
  const [transferForm, setTransferForm] = useState(EMPTY_TRANSFER)
  const [editForm, setEditForm] = useState(null)
  const [tambahForm, setTambahForm] = useState(EMPTY_HUTANG)

  const [dispBayar, setDispBayar] = useState('')
  const [dispTransfer, setDispTransfer] = useState('')
  const [dispTambah, setDispTambah] = useState({ total_awal:'', sisa:'', cicilan_per_bulan:'' })
  const [dispEdit, setDispEdit] = useState({ total_awal:'', sisa:'', cicilan_per_bulan:'' })

  const load = async () => {
    setLoading(true)
    const [{ data:h },{ data:r },{ data:p },{ data:t }] = await Promise.all([
      supabase.from('hutang').select('*').order('created_at'),
      supabase.from('rekening').select('*').order('created_at'),
      supabase.from('pembayaran_hutang').select('*, hutang(nama), rekening(nama)').order('tanggal',{ascending:false}),
      supabase.from('transfer_wallet').select('*, dari:dari_rekening_id(nama), ke:ke_rekening_id(nama)').order('tanggal',{ascending:false}),
    ])
    setHutangList(h||[])
    setRekening(r||[])
    setRiwayat(p||[])
    setTransferList(t||[])
    setLoading(false)
  }

  useEffect(() => { load(); loadGoogleScript() }, [])

  const totalHutang = hutangList.reduce((s,h) => s+Number(h.sisa), 0)
  const totalRekening = rekening.reduce((s,r) => s+Number(r.saldo), 0)
  const hutangDenganTempo = hutangList.filter(h => h.jatuh_tempo && h.status !== 'lunas')

  const loginGoogle = () => new Promise((resolve, reject) => {
    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: CALENDAR_SCOPE,
      callback: (res) => {
        if (res.error) { reject(res.error); return }
        setGoogleToken(res.access_token)
        resolve(res.access_token)
      }
    })
    client.requestAccessToken()
  })

  const buatEvent = async (hutang, token) => {
    const event = {
      summary: `💸 Bayar ${hutang.nama} — ${fmt(hutang.cicilan_per_bulan || hutang.sisa)}`,
      description: `Reminder cicilan dari Velora Finance.\nNama: ${hutang.nama}\nTipe: ${hutang.tipe}\nSisa: ${fmt(hutang.sisa)}\nCicilan: ${fmt(hutang.cicilan_per_bulan)}/bln`,
      start: { date: hutang.jatuh_tempo },
      end: { date: hutang.jatuh_tempo },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'popup', minutes: 1440 },
          { method: 'popup', minutes: 60 },
          { method: 'email', minutes: 1440 },
        ]
      },
      colorId: '11'
    }
    return fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(event)
    })
  }

  const tambahSatuKeCalendar = async (hutang) => {
    if (!hutang.jatuh_tempo) { alert('Hutang ini tidak punya jatuh tempo!'); return }
    setCalendarLoading(true)
    try {
      let token = googleToken || await loginGoogle()
      const res = await buatEvent(hutang, token)
      if (res.ok) {
        setCalendarSuccess(`✅ ${hutang.nama} berhasil ditambahkan ke Google Calendar!`)
        setTimeout(() => setCalendarSuccess(''), 4000)
      } else {
        const err = await res.json()
        alert('Gagal: ' + err.error?.message)
      }
    } catch(e) { alert('Error: ' + e.message) }
    setCalendarLoading(false)
  }

  const tambahSemuaKeCalendar = async () => {
    if (hutangDenganTempo.length === 0) { alert('Tidak ada hutang dengan jatuh tempo!'); return }
    setCalendarLoading(true)
    try {
      let token = googleToken || await loginGoogle()
      let berhasil = 0
      for (const h of hutangDenganTempo) {
        const res = await buatEvent(h, token)
        if (res.ok) berhasil++
      }
      setCalendarSuccess(`✅ ${berhasil} hutang berhasil ditambahkan ke Google Calendar!`)
      setTimeout(() => setCalendarSuccess(''), 5000)
    } catch(e) { alert('Error: ' + e.message) }
    setCalendarLoading(false)
  }

  const importData = async () => {
    const { data:{ user } } = await supabase.auth.getUser()
    for (const h of hutangAwal) await supabase.from('hutang').insert({...h, user_id:user.id})
    load()
  }

  const bayarHutang = async () => {
    if (!bayarForm.hutang_id||!bayarForm.tanggal||!bayarForm.jumlah) return
    const { data:{ user } } = await supabase.auth.getUser()
    const jumlah = Number(bayarForm.jumlah)
    const hutang = hutangList.find(h=>h.id===bayarForm.hutang_id)
    const wallet = rekening.find(r=>r.id===bayarForm.rekening_id)
    if (!hutang) return
    await supabase.from('pembayaran_hutang').insert({ user_id:user.id, hutang_id:bayarForm.hutang_id, rekening_id:bayarForm.rekening_id||null, tanggal:bayarForm.tanggal, jumlah, catatan:bayarForm.catatan })
    const sisaBaru = Math.max(0, Number(hutang.sisa)-jumlah)
    await supabase.from('hutang').update({ sisa:sisaBaru, status:sisaBaru===0?'lunas':'aktif' }).eq('id',bayarForm.hutang_id)
    if (wallet) await supabase.from('rekening').update({ saldo:Math.max(0,Number(wallet.saldo)-jumlah) }).eq('id',bayarForm.rekening_id)
    setBayarForm(EMPTY_BAYAR); setDispBayar(''); setShowBayar(false); load()
  }

  const transferWallet = async () => {
    if (!transferForm.dari_rekening_id||!transferForm.ke_rekening_id||!transferForm.tanggal||!transferForm.jumlah) return
    if (transferForm.dari_rekening_id===transferForm.ke_rekening_id) { alert('Wallet asal dan tujuan tidak boleh sama!'); return }
    const { data:{ user } } = await supabase.auth.getUser()
    const jumlah = Number(transferForm.jumlah)
    const dari = rekening.find(r=>r.id===transferForm.dari_rekening_id)
    const ke = rekening.find(r=>r.id===transferForm.ke_rekening_id)
    await supabase.from('transfer_wallet').insert({ user_id:user.id, dari_rekening_id:transferForm.dari_rekening_id, ke_rekening_id:transferForm.ke_rekening_id, tanggal:transferForm.tanggal, jumlah, catatan:transferForm.catatan })
    await supabase.from('rekening').update({ saldo:Math.max(0,Number(dari.saldo)-jumlah) }).eq('id',dari.id)
    await supabase.from('rekening').update({ saldo:Number(ke.saldo)+jumlah }).eq('id',ke.id)
    setTransferForm(EMPTY_TRANSFER); setDispTransfer(''); setShowTransfer(false); load()
  }

  const saveEdit = async () => {
    if (!editForm) return
    await supabase.from('hutang').update({ nama:editForm.nama, tipe:editForm.tipe, total_awal:Number(editForm.total_awal)||0, sisa:Number(editForm.sisa)||0, cicilan_per_bulan:Number(editForm.cicilan_per_bulan)||0, jatuh_tempo:editForm.jatuh_tempo||null, status:Number(editForm.sisa)===0?'lunas':'aktif' }).eq('id',editForm.id)
    setShowEditHutang(false); setEditForm(null); load()
  }

  const tambahHutang = async () => {
    if (!tambahForm.nama) return
    const { data:{ user } } = await supabase.auth.getUser()
    const { error } = await supabase.from('hutang').insert({ ...tambahForm, total_awal:Number(tambahForm.total_awal)||0, sisa:Number(tambahForm.sisa)||0, cicilan_per_bulan:Number(tambahForm.cicilan_per_bulan)||0, jatuh_tempo:tambahForm.jatuh_tempo||null, user_id:user.id })
    if (error) { alert('Error: '+error.message); return }
    setTambahForm(EMPTY_HUTANG); setDispTambah({total_awal:'',sisa:'',cicilan_per_bulan:''}); setShowTambah(false); load()
  }

  const hapusHutang = async (id) => {
    if (!window.confirm('Hapus hutang ini?')) return
    await supabase.from('hutang').delete().eq('id',id); load()
  }

  const handleNum = (val, setter, dispSetter, field) => {
    const num = Number(fmtNum(val))||0
    setter(f=>({...f,[field]:num}))
    dispSetter(d=>({...d,[field]:num?num.toLocaleString('id-ID'):''}))
  }

  if (loading) return (
    <div style={{ display:'flex', height:'100vh', background:'#080c14', alignItems:'center', justifyContent:'center' }}>
      <div style={{ color:'#4a9eff', fontSize:'13px', fontFamily:'DM Sans,sans-serif' }}>Memuat...</div>
    </div>
  )

  const TABS = [
    { key:'hutang', label:'Daftar Hutang' },
    { key:'riwayat_bayar', label:'Riwayat Bayar' },
    { key:'transfer', label:'Transfer' },
    { key:'wallet', label:'Wallet' },
  ]

  return (
    <>
      <style>{css}</style>
      <div className="vf-root" style={{ padding:'24px 20px', background:'#080c14', minHeight:'100vh', color:'#fff' }}>

        <div className="vf-fadein" style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'24px' }}>
          <div>
            <div style={{ fontSize:'11px', color:'#4a6a8a', letterSpacing:'0.08em', marginBottom:'4px' }}>KEUANGAN</div>
            <div style={{ fontFamily:'DM Serif Display,serif', fontSize:'22px', color:'#e8f0fe' }}>Hutang & Transfer</div>
          </div>
          <div style={{ display:'flex', gap:'8px', flexWrap:'wrap', justifyContent:'flex-end' }}>
            <button className="vf-btn-orange" onClick={() => setShowBayar(true)}>💸 Bayar</button>
            <button className="vf-btn-blue" onClick={() => setShowTransfer(true)}>↔ Transfer</button>
            <button className="vf-btn-green" onClick={() => setShowTambah(true)}>+ Hutang</button>
          </div>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px', marginBottom:'16px' }}>
          <div style={{ background:'linear-gradient(135deg,#1a0808,#1a0a0a)', border:'1px solid rgba(255,100,100,0.2)', borderRadius:'16px', padding:'16px' }}>
            <div style={{ fontSize:'10px', color:'#4a6a8a', letterSpacing:'0.08em', marginBottom:'6px' }}>TOTAL HUTANG</div>
            <div style={{ fontFamily:'DM Serif Display,serif', fontSize:'20px', color:'#ff6464' }}>{fmt(totalHutang)}</div>
          </div>
          <div style={{ background:'linear-gradient(135deg,#0a1628,#0d1f2d)', border:'1px solid rgba(74,158,255,0.2)', borderRadius:'16px', padding:'16px' }}>
            <div style={{ fontSize:'10px', color:'#4a6a8a', letterSpacing:'0.08em', marginBottom:'6px' }}>TOTAL SALDO</div>
            <div style={{ fontFamily:'DM Serif Display,serif', fontSize:'20px', color:'#4a9eff' }}>{fmt(totalRekening)}</div>
          </div>
        </div>

        {/* GOOGLE CALENDAR BANNER */}
        {tab === 'hutang' && hutangDenganTempo.length > 0 && (
          <div className="gcal-banner">
            <div>
              <div style={{ fontSize:'13px', color:'#4a9eff', fontWeight:'500' }}>📅 Sinkron ke Google Calendar</div>
              <div style={{ fontSize:'10px', color:'#4a6a8a', marginTop:'2px' }}>{hutangDenganTempo.length} hutang punya jatuh tempo · reminder popup + email otomatis</div>
            </div>
            <button className="vf-btn-gcal" onClick={tambahSemuaKeCalendar} disabled={calendarLoading}
              style={{ padding:'8px 14px', fontSize:'12px', borderRadius:'10px', whiteSpace:'nowrap' }}>
              {calendarLoading ? '⏳ Menambahkan...' : '📅 Tambah Semua'}
            </button>
          </div>
        )}

        {calendarSuccess && <div className="gcal-success">{calendarSuccess}</div>}

        <div style={{ display:'flex', gap:'8px', marginBottom:'20px', flexWrap:'wrap' }}>
          {TABS.map(t => (
            <button key={t.key} className={`vf-tab${tab===t.key?' active':''}`} onClick={() => setTab(t.key)}>{t.label}</button>
          ))}
        </div>

        {tab === 'hutang' && (
          <div className="vf-card">
            {hutangList.length === 0 ? (
              <div style={{ textAlign:'center', padding:'24px' }}>
                <div style={{ fontSize:'32px', marginBottom:'8px' }}>📋</div>
                <div style={{ color:'#4a6a8a', fontSize:'13px', marginBottom:'16px' }}>Belum ada hutang tercatat</div>
                <button className="vf-btn-blue" onClick={importData}>Import Data Real Kamu</button>
              </div>
            ) : hutangList.map(h => {
              const persen = h.total_awal > 0 ? Math.round((1 - Number(h.sisa)/Number(h.total_awal)) * 100) : 0
              const tipeColor = TIPE_COLOR[h.tipe] || '#9e9e9e'
              return (
                <div key={h.id} style={{ padding:'14px 6px', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'8px' }}>
                    <div style={{ flex:1 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'4px', flexWrap:'wrap' }}>
                        <span style={{ fontSize:'14px', fontWeight:'600', color:'#e8f0fe' }}>{h.nama}</span>
                        <span style={{ fontSize:'10px', padding:'2px 8px', borderRadius:'20px', background:`${tipeColor}18`, color:tipeColor, border:`1px solid ${tipeColor}33` }}>{h.tipe}</span>
                        <span style={{ fontSize:'10px', padding:'2px 8px', borderRadius:'20px', background:h.status==='lunas'?'rgba(0,200,83,0.1)':'rgba(255,100,100,0.1)', color:h.status==='lunas'?'#4cde8a':'#ff6464', border:`1px solid ${h.status==='lunas'?'rgba(0,200,83,0.2)':'rgba(255,100,100,0.2)'}` }}>{h.status}</span>
                      </div>
                      <div style={{ fontSize:'11px', color:'#4a6a8a' }}>
                        Sisa <span style={{ color:'#ff6464', fontWeight:'600' }}>{fmt(h.sisa)}</span>
                        <span style={{ margin:'0 6px', opacity:0.4 }}>·</span>dari {fmt(h.total_awal)}
                        {h.cicilan_per_bulan > 0 && <><span style={{ margin:'0 6px', opacity:0.4 }}>·</span><span style={{ color:'#ffa726' }}>{fmt(h.cicilan_per_bulan)}/bln</span></>}
                        {h.jatuh_tempo && <><span style={{ margin:'0 6px', opacity:0.4 }}>·</span><span style={{ color:'#4a6a8a' }}>⏰ {h.jatuh_tempo}</span></>}
                      </div>
                    </div>
                    <div style={{ display:'flex', gap:'6px', marginLeft:'10px', flexWrap:'wrap', justifyContent:'flex-end' }}>
                      {h.jatuh_tempo && h.status !== 'lunas' && (
                        <button className="vf-btn-gcal" onClick={() => tambahSatuKeCalendar(h)} disabled={calendarLoading} title="Tambah ke Google Calendar">📅</button>
                      )}
                      <button className="vf-btn-blue" style={{ padding:'5px 10px', fontSize:'11px' }} onClick={() => {
                        setEditForm({...h})
                        setDispEdit({ total_awal:Number(h.total_awal).toLocaleString('id-ID'), sisa:Number(h.sisa).toLocaleString('id-ID'), cicilan_per_bulan:Number(h.cicilan_per_bulan).toLocaleString('id-ID') })
                        setShowEditHutang(true)
                      }}>Edit</button>
                      <button className="vf-btn-red" onClick={() => hapusHutang(h.id)}>Hapus</button>
                    </div>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                    <div className="vf-progress" style={{ flex:1 }}>
                      <div className="vf-progress-bar" style={{ width:`${persen}%` }} />
                    </div>
                    <span style={{ fontSize:'11px', color:'#4cde8a', minWidth:'36px', textAlign:'right' }}>{persen}%</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {tab === 'riwayat_bayar' && (
          <div className="vf-card">
            <div style={{ fontSize:'12px', fontWeight:'600', color:'#c8d8f0', letterSpacing:'0.04em', marginBottom:'14px' }}>RIWAYAT PEMBAYARAN</div>
            {riwayat.length === 0 ? <div style={{ color:'#3a5a7a', fontSize:'12px', padding:'12px 0' }}>Belum ada pembayaran</div>
              : riwayat.map(p => (
                <div key={p.id} className="vf-row">
                  <div style={{ display:'flex', alignItems:'center', gap:'10px', flex:1 }}>
                    <div style={{ width:'8px', height:'8px', borderRadius:'50%', background:'#ff6464', flexShrink:0 }} />
                    <div>
                      <div style={{ fontSize:'13px', color:'#c8d8f0', fontWeight:'500' }}>{p.hutang?.nama}</div>
                      <div style={{ fontSize:'10px', color:'#3a5a7a', marginTop:'1px' }}>{p.tanggal} · dari {p.rekening?.nama||'manual'}{p.catatan&&' · '+p.catatan}</div>
                    </div>
                  </div>
                  <div style={{ fontSize:'13px', fontWeight:'600', color:'#ff6464' }}>{fmt(p.jumlah)}</div>
                </div>
              ))
            }
          </div>
        )}

        {tab === 'transfer' && (
          <div className="vf-card">
            <div style={{ fontSize:'12px', fontWeight:'600', color:'#c8d8f0', letterSpacing:'0.04em', marginBottom:'14px' }}>RIWAYAT TRANSFER</div>
            {transferList.length === 0 ? <div style={{ color:'#3a5a7a', fontSize:'12px', padding:'12px 0' }}>Belum ada transfer</div>
              : transferList.map(t => (
                <div key={t.id} className="vf-row">
                  <div style={{ display:'flex', alignItems:'center', gap:'10px', flex:1 }}>
                    <div style={{ width:'8px', height:'8px', borderRadius:'50%', background:'#4a9eff', flexShrink:0 }} />
                    <div>
                      <div style={{ fontSize:'13px', color:'#c8d8f0', fontWeight:'500' }}>{t.dari?.nama} → {t.ke?.nama}</div>
                      <div style={{ fontSize:'10px', color:'#3a5a7a', marginTop:'1px' }}>{t.tanggal}{t.catatan&&' · '+t.catatan}</div>
                    </div>
                  </div>
                  <div style={{ fontSize:'13px', fontWeight:'600', color:'#4a9eff' }}>{fmt(t.jumlah)}</div>
                </div>
              ))
            }
          </div>
        )}

        {tab === 'wallet' && (
          <div className="vf-card">
            <div style={{ fontSize:'12px', fontWeight:'600', color:'#c8d8f0', letterSpacing:'0.04em', marginBottom:'14px' }}>SALDO WALLET</div>
            {rekening.map(r => (
              <div key={r.id} className="vf-row">
                <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                  <div style={{ width:'8px', height:'8px', borderRadius:'50%', background:'#4a9eff', flexShrink:0 }} />
                  <div>
                    <div style={{ fontSize:'13px', color:'#c8d8f0', fontWeight:'500' }}>{r.nama}</div>
                    <div style={{ fontSize:'10px', color:'#3a5a7a', marginTop:'1px' }}>{r.tipe}</div>
                  </div>
                </div>
                <div style={{ fontSize:'13px', fontWeight:'600', color:'#4a9eff' }}>{fmt(r.saldo)}</div>
              </div>
            ))}
          </div>
        )}

        {showBayar && (
          <div className="vf-modal" onClick={() => setShowBayar(false)}>
            <div className="vf-modal-box" onClick={e=>e.stopPropagation()}>
              <div style={{ fontFamily:'DM Serif Display,serif', fontSize:'18px', color:'#e8f0fe', marginBottom:'20px' }}>Bayar Hutang</div>
              <div style={{ marginBottom:'12px' }}><div className="vf-label">PILIH HUTANG</div><select className="vf-input" value={bayarForm.hutang_id} onChange={e=>setBayarForm({...bayarForm,hutang_id:e.target.value})}><option value=''>-- Pilih hutang --</option>{hutangList.filter(h=>h.status!=='lunas').map(h=><option key={h.id} value={h.id}>{h.nama} — sisa {fmt(h.sisa)}</option>)}</select></div>
              <div style={{ marginBottom:'12px' }}><div className="vf-label">BAYAR DARI WALLET</div><select className="vf-input" value={bayarForm.rekening_id} onChange={e=>setBayarForm({...bayarForm,rekening_id:e.target.value})}><option value=''>-- Pilih wallet (opsional) --</option>{rekening.map(r=><option key={r.id} value={r.id}>{r.nama} — {fmt(r.saldo)}</option>)}</select></div>
              <div className="vf-grid2">
                <div><div className="vf-label">TANGGAL</div><input className="vf-input" type='date' value={bayarForm.tanggal} onChange={e=>setBayarForm({...bayarForm,tanggal:e.target.value})}/></div>
                <div><div className="vf-label">JUMLAH</div><input className="vf-input" value={dispBayar} onChange={e=>{const n=Number(fmtNum(e.target.value))||0;setBayarForm(f=>({...f,jumlah:n}));setDispBayar(n?n.toLocaleString('id-ID'):'')}} placeholder='0'/></div>
              </div>
              <div style={{ marginBottom:'16px' }}><div className="vf-label">CATATAN</div><input className="vf-input" value={bayarForm.catatan} onChange={e=>setBayarForm({...bayarForm,catatan:e.target.value})} placeholder='opsional'/></div>
              <div style={{ display:'flex', gap:'8px' }}>
                <button className="vf-btn-green" onClick={bayarHutang}>Simpan</button>
                <button className="vf-btn-red" style={{ padding:'10px 16px' }} onClick={() => setShowBayar(false)}>Batal</button>
              </div>
            </div>
          </div>
        )}

        {showTransfer && (
          <div className="vf-modal" onClick={() => setShowTransfer(false)}>
            <div className="vf-modal-box" onClick={e=>e.stopPropagation()}>
              <div style={{ fontFamily:'DM Serif Display,serif', fontSize:'18px', color:'#e8f0fe', marginBottom:'20px' }}>Transfer Antar Wallet</div>
              <div style={{ marginBottom:'12px' }}><div className="vf-label">DARI WALLET</div><select className="vf-input" value={transferForm.dari_rekening_id} onChange={e=>setTransferForm({...transferForm,dari_rekening_id:e.target.value})}><option value=''>-- Pilih asal --</option>{rekening.map(r=><option key={r.id} value={r.id}>{r.nama} — {fmt(r.saldo)}</option>)}</select></div>
              <div style={{ marginBottom:'12px' }}><div className="vf-label">KE WALLET</div><select className="vf-input" value={transferForm.ke_rekening_id} onChange={e=>setTransferForm({...transferForm,ke_rekening_id:e.target.value})}><option value=''>-- Pilih tujuan --</option>{rekening.map(r=><option key={r.id} value={r.id}>{r.nama} — {fmt(r.saldo)}</option>)}</select></div>
              <div className="vf-grid2">
                <div><div className="vf-label">TANGGAL</div><input className="vf-input" type='date' value={transferForm.tanggal} onChange={e=>setTransferForm({...transferForm,tanggal:e.target.value})}/></div>
                <div><div className="vf-label">JUMLAH</div><input className="vf-input" value={dispTransfer} onChange={e=>{const n=Number(fmtNum(e.target.value))||0;setTransferForm(f=>({...f,jumlah:n}));setDispTransfer(n?n.toLocaleString('id-ID'):'')}} placeholder='0'/></div>
              </div>
              <div style={{ marginBottom:'16px' }}><div className="vf-label">CATATAN</div><input className="vf-input" value={transferForm.catatan} onChange={e=>setTransferForm({...transferForm,catatan:e.target.value})} placeholder='opsional'/></div>
              <div style={{ display:'flex', gap:'8px' }}>
                <button className="vf-btn-green" onClick={transferWallet}>Simpan</button>
                <button className="vf-btn-red" style={{ padding:'10px 16px' }} onClick={() => setShowTransfer(false)}>Batal</button>
              </div>
            </div>
          </div>
        )}

        {showEditHutang && editForm && (
          <div className="vf-modal" onClick={() => setShowEditHutang(false)}>
            <div className="vf-modal-box" onClick={e=>e.stopPropagation()}>
              <div style={{ fontFamily:'DM Serif Display,serif', fontSize:'18px', color:'#e8f0fe', marginBottom:'4px' }}>Edit Hutang</div>
              <div style={{ fontSize:'11px', color:'#4a6a8a', marginBottom:'20px' }}>{editForm.nama}</div>
              <div className="vf-grid2">
                <div><div className="vf-label">NAMA</div><input className="vf-input" value={editForm.nama} onChange={e=>setEditForm({...editForm,nama:e.target.value})}/></div>
                <div><div className="vf-label">TIPE</div><select className="vf-input" value={editForm.tipe} onChange={e=>setEditForm({...editForm,tipe:e.target.value})}><option>Pinjol</option><option>Personal</option><option>Kartu Kredit</option><option>Cicilan</option></select></div>
              </div>
              <div className="vf-grid2">
                <div><div className="vf-label">TOTAL AWAL</div><input className="vf-input" value={dispEdit.total_awal} onChange={e=>handleNum(e.target.value,setEditForm,setDispEdit,'total_awal')} placeholder='0'/></div>
                <div><div className="vf-label">SISA HUTANG</div><input className="vf-input" value={dispEdit.sisa} onChange={e=>handleNum(e.target.value,setEditForm,setDispEdit,'sisa')} placeholder='0'/></div>
              </div>
              <div className="vf-grid2">
                <div><div className="vf-label">CICILAN/BULAN</div><input className="vf-input" value={dispEdit.cicilan_per_bulan} onChange={e=>handleNum(e.target.value,setEditForm,setDispEdit,'cicilan_per_bulan')} placeholder='0'/></div>
                <div><div className="vf-label">JATUH TEMPO</div><input className="vf-input" type='date' value={editForm.jatuh_tempo||''} onChange={e=>setEditForm({...editForm,jatuh_tempo:e.target.value})}/></div>
              </div>
              <div style={{ display:'flex', gap:'8px', marginTop:'4px' }}>
                <button className="vf-btn-green" onClick={saveEdit}>Simpan</button>
                <button className="vf-btn-red" style={{ padding:'10px 16px' }} onClick={() => setShowEditHutang(false)}>Batal</button>
              </div>
            </div>
          </div>
        )}

        {showTambah && (
          <div className="vf-modal" onClick={() => setShowTambah(false)}>
            <div className="vf-modal-box" onClick={e=>e.stopPropagation()}>
              <div style={{ fontFamily:'DM Serif Display,serif', fontSize:'18px', color:'#e8f0fe', marginBottom:'20px' }}>Hutang Baru</div>
              <div className="vf-grid2">
                <div><div className="vf-label">NAMA HUTANG</div><input className="vf-input" value={tambahForm.nama} onChange={e=>setTambahForm({...tambahForm,nama:e.target.value})} placeholder='KTA, Personal...'/></div>
                <div><div className="vf-label">TIPE</div><select className="vf-input" value={tambahForm.tipe} onChange={e=>setTambahForm({...tambahForm,tipe:e.target.value})}><option>Pinjol</option><option>Personal</option><option>Kartu Kredit</option><option>Cicilan</option></select></div>
              </div>
              <div className="vf-grid2">
                <div><div className="vf-label">TOTAL AWAL</div><input className="vf-input" value={dispTambah.total_awal} onChange={e=>handleNum(e.target.value,setTambahForm,setDispTambah,'total_awal')} placeholder='0'/></div>
                <div><div className="vf-label">SISA HUTANG</div><input className="vf-input" value={dispTambah.sisa} onChange={e=>handleNum(e.target.value,setTambahForm,setDispTambah,'sisa')} placeholder='0'/></div>
              </div>
              <div className="vf-grid2">
                <div><div className="vf-label">CICILAN/BULAN</div><input className="vf-input" value={dispTambah.cicilan_per_bulan} onChange={e=>handleNum(e.target.value,setTambahForm,setDispTambah,'cicilan_per_bulan')} placeholder='0'/></div>
                <div><div className="vf-label">JATUH TEMPO</div><input className="vf-input" type='date' value={tambahForm.jatuh_tempo} onChange={e=>setTambahForm({...tambahForm,jatuh_tempo:e.target.value})}/></div>
              </div>
              <div style={{ display:'flex', gap:'8px', marginTop:'4px' }}>
                <button className="vf-btn-green" onClick={tambahHutang}>Simpan</button>
                <button className="vf-btn-red" style={{ padding:'10px 16px' }} onClick={() => setShowTambah(false)}>Batal</button>
              </div>
            </div>
          </div>
        )}

      </div>
    </>
  )
}
