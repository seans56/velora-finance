import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const fmtIDR = (n) => 'Rp ' + (Number(n)||0).toLocaleString('id-ID', { minimumFractionDigits:0, maximumFractionDigits:0 })
const fmtUSD = (n) => '$' + (Number(n)||0).toLocaleString('en-US', { minimumFractionDigits:2, maximumFractionDigits:6 })

const css = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@300;400;500;600&display=swap');
  .vf-root { font-family: 'DM Sans', sans-serif; }
  .vf-card {
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 20px;
    padding: 18px;
    margin-bottom: 14px;
  }
  .vf-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 6px;
    border-bottom: 1px solid rgba(255,255,255,0.05);
    border-radius: 8px;
    transition: background 0.15s;
  }
  .vf-row:last-child { border-bottom: none; }
  .vf-row:hover { background: rgba(255,255,255,0.03); }
  .vf-input {
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.1);
    color: #fff;
    border-radius: 10px;
    padding: 10px 12px;
    font-size: 13px;
    width: 100%;
    box-sizing: border-box;
    font-family: 'DM Sans', sans-serif;
    outline: none;
    transition: border-color 0.2s;
  }
  .vf-input:focus { border-color: rgba(180,100,255,0.5); }
  .vf-input option { background: #0d1828; }
  .vf-btn-green { background: linear-gradient(135deg,#00c853,#00a844); color:#000; border:none; padding:10px 18px; border-radius:10px; font-size:13px; font-weight:600; cursor:pointer; font-family:'DM Sans',sans-serif; transition:opacity 0.2s; }
  .vf-btn-green:hover { opacity:0.85; }
  .vf-btn-blue { background:rgba(74,158,255,0.12); color:#4a9eff; border:1px solid rgba(74,158,255,0.25); padding:9px 14px; border-radius:10px; font-size:12px; font-weight:500; cursor:pointer; font-family:'DM Sans',sans-serif; transition:background 0.2s; }
  .vf-btn-blue:hover { background:rgba(74,158,255,0.22); }
  .vf-btn-purple { background:rgba(180,100,255,0.12); color:#b464ff; border:1px solid rgba(180,100,255,0.25); padding:9px 14px; border-radius:10px; font-size:12px; font-weight:500; cursor:pointer; font-family:'DM Sans',sans-serif; transition:background 0.2s; }
  .vf-btn-purple:hover { background:rgba(180,100,255,0.22); }
  .vf-btn-red { background:rgba(255,100,100,0.1); color:#ff6464; border:1px solid rgba(255,100,100,0.2); padding:5px 12px; border-radius:8px; font-size:11px; cursor:pointer; font-family:'DM Sans',sans-serif; transition:background 0.2s; }
  .vf-btn-red:hover { background:rgba(255,100,100,0.2); }
  .vf-tab { padding:8px 16px; border-radius:10px; font-size:12px; cursor:pointer; border:1px solid rgba(255,255,255,0.07); background:transparent; color:#4a6a8a; font-family:'DM Sans',sans-serif; transition:all 0.2s; }
  .vf-tab:hover { color:#c8d8f0; border-color:rgba(255,255,255,0.15); }
  .vf-tab.active { background:rgba(180,100,255,0.12); color:#b464ff; border-color:rgba(180,100,255,0.3); }
  .vf-modal { position:fixed; top:0; left:0; right:0; bottom:0; background:rgba(0,0,0,0.75); display:flex; align-items:center; justify-content:center; z-index:100; backdrop-filter:blur(4px); }
  .vf-modal-box { background:#0d1828; border:1px solid rgba(255,255,255,0.1); border-radius:20px; padding:24px; width:440px; max-width:92vw; max-height:90vh; overflow-y:auto; }
  .vf-label { font-size:11px; color:#4a6a8a; margin-bottom:4px; letter-spacing:0.06em; }
  .vf-grid2 { display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:12px; }
  .vf-grid3 { display:grid; grid-template-columns:1fr 1fr 1fr; gap:8px; }
  @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
  .vf-fadein { animation:fadeUp 0.35s ease forwards; }
  .vf-coin-block { padding:14px 6px; border-bottom:1px solid rgba(255,255,255,0.05); }
  .vf-coin-block:last-child { border-bottom:none; }
`

const COIN_WARNA = {
  BTC:'#f7931a', ETH:'#627eea', BNB:'#f3ba2f', SOL:'#9945ff',
  ADA:'#0033ad', XRP:'#346aa9', DOGE:'#c2a633', MATIC:'#8247e5',
  '1INCH':'#d82122', EQTY:'#00a8e0', PEPE:'#4caf50',
}

const TICKER_TO_ID = {
  BTC:'bitcoin', ETH:'ethereum', BNB:'binancecoin', SOL:'solana',
  ADA:'cardano', XRP:'ripple', DOGE:'dogecoin', MATIC:'matic-network',
  DOT:'polkadot', AVAX:'avalanche-2', LINK:'chainlink', UNI:'uniswap',
  '1INCH':'1inch', PEPE:'pepe', EQTY:'equitybot',
}

const cryptoAwal = [
  { nama:'1INCH', ticker:'1INCH', jumlah:11.62, harga_beli_usd:0, harga_beli_idr:4710.967, tanggal:'2026-01-01', catatan:'Ajaib' },
  { nama:'EQTY', ticker:'EQTY', jumlah:177.77, harga_beli_usd:0, harga_beli_idr:286.6636, tanggal:'2026-01-01', catatan:'Ajaib' },
  { nama:'PEPE', ticker:'PEPE', jumlah:200, harga_beli_usd:0, harga_beli_idr:0.208589, tanggal:'2026-01-01', catatan:'Ajaib' },
]

const EMPTY = { nama:'', ticker:'', jumlah:'', harga_beli_usd:'', harga_beli_idr:'', tanggal:'', catatan:'' }

export default function Crypto() {
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('portofolio')
  const [showTambah, setShowTambah] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [editForm, setEditForm] = useState(null)
  const [hargaLive, setHargaLive] = useState({})
  const [loadingHarga, setLoadingHarga] = useState(false)
  const [kursUSD, setKursUSD] = useState(16000)
  const [loadingKurs, setLoadingKurs] = useState(false)
  const [lastUpdate, setLastUpdate] = useState(null)

  const load = async () => {
    setLoading(true)
    const { data } = await supabase.from('crypto').select('*').order('created_at')
    setList(data || [])
    setLoading(false)
  }

  const fetchKursUSD = async () => {
    setLoadingKurs(true)
    try {
      const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=usd&vs_currencies=idr')
      const data = await res.json()
      if (data?.usd?.idr) setKursUSD(Math.round(data.usd.idr))
    } catch(e) {}
    setLoadingKurs(false)
  }

  const fetchHargaLive = async (coinList) => {
    if (!coinList || coinList.length === 0) return
    setLoadingHarga(true)
    try {
      const ids = [...new Set(coinList.map(c => TICKER_TO_ID[c.ticker.toUpperCase()] || c.ticker.toLowerCase()))].join(',')
      const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd,idr`)
      const data = await res.json()
      setHargaLive(data)
      setLastUpdate(new Date().toLocaleTimeString('id-ID'))
    } catch(e) { alert('Gagal fetch harga.') }
    setLoadingHarga(false)
  }

  useEffect(() => { load(); fetchKursUSD() }, [])
  useEffect(() => { if (list.length > 0) fetchHargaLive(list) }, [list])

  const getHargaLive = (ticker) => hargaLive[TICKER_TO_ID[ticker.toUpperCase()] || ticker.toLowerCase()]?.usd || null
  const getHargaLiveIDR = (ticker) => hargaLive[TICKER_TO_ID[ticker.toUpperCase()] || ticker.toLowerCase()]?.idr || null

  const perTicker = list.reduce((acc, c) => {
    const t = c.ticker.toUpperCase()
    if (!acc[t]) acc[t] = { ticker:t, nama:c.nama, jumlah:0, totalBeliIDR:0, entries:[] }
    acc[t].jumlah += Number(c.jumlah)
    acc[t].totalBeliIDR += Number(c.jumlah) * Number(c.harga_beli_idr)
    acc[t].entries.push(c)
    return acc
  }, {})

  const tickerList = Object.values(perTicker)
  const totalBeliIDR = list.reduce((s,c) => s + Number(c.jumlah)*Number(c.harga_beli_idr), 0)
  const totalNilaiLiveIDR = tickerList.reduce((s, t) => {
    const live = getHargaLiveIDR(t.ticker)
    return s + (live ? t.jumlah * live : t.totalBeliIDR)
  }, 0)
  const pnl = totalNilaiLiveIDR - totalBeliIDR
  const hasLive = Object.keys(hargaLive).length > 0

  const importData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    for (const c of cryptoAwal) await supabase.from('crypto').insert({ ...c, user_id: user.id })
    load()
  }

  const save = async () => {
    if (!form.ticker || !form.jumlah) return
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase.from('crypto').insert({
      nama: form.nama || form.ticker.toUpperCase(),
      ticker: form.ticker.toUpperCase(),
      jumlah: Number(form.jumlah),
      harga_beli_usd: Number(form.harga_beli_usd)||0,
      harga_beli_idr: Number(form.harga_beli_idr)||0,
      tanggal: form.tanggal||null,
      catatan: form.catatan,
      user_id: user.id
    })
    if (error) { alert('Error: '+error.message); return }
    setForm(EMPTY); setShowTambah(false); load()
  }

  const saveEdit = async () => {
    if (!editForm) return
    const { error } = await supabase.from('crypto').update({
      nama: editForm.nama, ticker: editForm.ticker.toUpperCase(),
      jumlah: Number(editForm.jumlah),
      harga_beli_usd: Number(editForm.harga_beli_usd)||0,
      harga_beli_idr: Number(editForm.harga_beli_idr)||0,
      tanggal: editForm.tanggal||null, catatan: editForm.catatan
    }).eq('id', editForm.id)
    if (error) { alert('Error: '+error.message); return }
    setShowEdit(false); setEditForm(null); load()
  }

  const hapus = async (id) => {
    if (!window.confirm('Hapus entri ini?')) return
    await supabase.from('crypto').delete().eq('id', id); load()
  }

  if (loading) return (
    <div style={{ display:'flex', height:'100vh', background:'#080c14', alignItems:'center', justifyContent:'center' }}>
      <div style={{ color:'#b464ff', fontSize:'13px', fontFamily:'DM Sans,sans-serif' }}>Memuat...</div>
    </div>
  )

  return (
    <>
      <style>{css}</style>
      <div className="vf-root" style={{ padding:'24px 20px', background:'#080c14', minHeight:'100vh', color:'#fff' }}>

        {/* HEADER */}
        <div className="vf-fadein" style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'24px' }}>
          <div>
            <div style={{ fontSize:'11px', color:'#4a6a8a', letterSpacing:'0.08em', marginBottom:'4px' }}>INVESTASI</div>
            <div style={{ fontFamily:'DM Serif Display,serif', fontSize:'22px', color:'#e8f0fe' }}>Crypto Portfolio</div>
            {lastUpdate && <div style={{ fontSize:'10px', color:'#4a6a8a', marginTop:'2px' }}>Update: {lastUpdate}</div>}
          </div>
          <div style={{ display:'flex', gap:'8px', flexWrap:'wrap', justifyContent:'flex-end' }}>
            <button className="vf-btn-purple" onClick={() => fetchHargaLive(list)} disabled={loadingHarga}>
              {loadingHarga ? '⏳ Updating...' : '🔄 Refresh'}
            </button>
            {list.length === 0 && <button className="vf-btn-blue" onClick={importData}>Import Coin</button>}
            <button className="vf-btn-green" onClick={() => setShowTambah(true)}>+ Coin</button>
          </div>
        </div>

        {/* KURS */}
        <div style={{ background:'rgba(255,183,77,0.06)', border:'1px solid rgba(255,183,77,0.15)', borderRadius:'12px', padding:'10px 14px', marginBottom:'16px', display:'flex', alignItems:'center', gap:'10px' }}>
          <span style={{ fontSize:'14px' }}>💱</span>
          <span style={{ fontSize:'11px', color:'#4a6a8a' }}>USD/IDR</span>
          <span style={{ fontSize:'14px', fontWeight:'600', color:'#ffb74d' }}>
            {loadingKurs ? '...' : `Rp ${kursUSD.toLocaleString('id-ID')}`}
          </span>
          <span style={{ fontSize:'10px', color:'#4a6a8a' }}>via CoinGecko</span>
          <button className="vf-btn-blue" style={{ padding:'4px 10px', fontSize:'10px', marginLeft:'auto' }} onClick={fetchKursUSD}>Refresh</button>
        </div>

        {/* KPI */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'10px', marginBottom:'20px' }}>
          <div style={{ background:'rgba(180,100,255,0.08)', border:'1px solid rgba(180,100,255,0.2)', borderRadius:'16px', padding:'14px' }}>
            <div style={{ fontSize:'10px', color:'#4a6a8a', letterSpacing:'0.08em', marginBottom:'6px' }}>DIINVESTASIKAN</div>
            <div style={{ fontSize:'14px', fontWeight:'600', color:'#b464ff' }}>{fmtIDR(totalBeliIDR)}</div>
          </div>
          <div style={{ background: hasLive?(pnl>=0?'rgba(0,200,83,0.08)':'rgba(255,100,100,0.08)'):'rgba(255,255,255,0.03)', border:`1px solid ${hasLive?(pnl>=0?'rgba(0,200,83,0.2)':'rgba(255,100,100,0.2)'):'rgba(255,255,255,0.07)'}`, borderRadius:'16px', padding:'14px' }}>
            <div style={{ fontSize:'10px', color:'#4a6a8a', letterSpacing:'0.08em', marginBottom:'6px' }}>NILAI SEKARANG</div>
            <div style={{ fontSize:'14px', fontWeight:'600', color:hasLive?(pnl>=0?'#4cde8a':'#ff6464'):'#4a6a8a' }}>
              {hasLive ? fmtIDR(totalNilaiLiveIDR) : '— refresh'}
            </div>
          </div>
          <div style={{ background: pnl>=0?'rgba(0,200,83,0.08)':'rgba(255,100,100,0.08)', border:`1px solid ${pnl>=0?'rgba(0,200,83,0.2)':'rgba(255,100,100,0.2)'}`, borderRadius:'16px', padding:'14px' }}>
            <div style={{ fontSize:'10px', color:'#4a6a8a', letterSpacing:'0.08em', marginBottom:'6px' }}>PNL</div>
            <div style={{ fontSize:'14px', fontWeight:'600', color:pnl>=0?'#4cde8a':'#ff6464' }}>
              {hasLive ? `${pnl>=0?'+':''}${fmtIDR(Math.abs(pnl))}` : '—'}
            </div>
            {hasLive && totalBeliIDR > 0 && (
              <div style={{ fontSize:'10px', color:pnl>=0?'#4cde8a':'#ff6464', marginTop:'2px' }}>
                {pnl>=0?'+':''}{((pnl/totalBeliIDR)*100).toFixed(2)}%
              </div>
            )}
          </div>
        </div>

        {/* TABS */}
        <div style={{ display:'flex', gap:'8px', marginBottom:'16px' }}>
          {[{key:'portofolio',label:'📊 Portofolio'},{key:'riwayat',label:'📋 Riwayat'}].map(t => (
            <button key={t.key} className={`vf-tab${tab===t.key?' active':''}`} onClick={() => setTab(t.key)}>{t.label}</button>
          ))}
        </div>

        {/* PORTOFOLIO */}
        {tab === 'portofolio' && (
          <div className="vf-card">
            <div style={{ fontSize:'12px', fontWeight:'600', color:'#c8d8f0', letterSpacing:'0.04em', marginBottom:'14px' }}>
              {tickerList.length} ASET · PLATFORM: AJAIB
            </div>
            {tickerList.length === 0 ? (
              <div style={{ textAlign:'center', padding:'24px' }}>
                <div style={{ fontSize:'32px', marginBottom:'8px' }}>🪙</div>
                <div style={{ color:'#4a6a8a', fontSize:'13px', marginBottom:'16px' }}>Belum ada coin</div>
                <button className="vf-btn-blue" onClick={importData}>Import Coin Kamu</button>
              </div>
            ) : tickerList.map(t => {
              const liveUSD = getHargaLive(t.ticker)
              const liveIDR = getHargaLiveIDR(t.ticker)
              const nilaiLive = liveIDR ? t.jumlah * liveIDR : null
              const pnlCoin = nilaiLive ? nilaiLive - t.totalBeliIDR : null
              const warna = COIN_WARNA[t.ticker] || '#b464ff'
              const avgBeliIDR = t.jumlah > 0 ? t.totalBeliIDR / t.jumlah : 0

              return (
                <div key={t.ticker} className="vf-coin-block">
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'10px' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                      <div style={{ width:'36px', height:'36px', borderRadius:'12px', background:`${warna}18`, border:`1px solid ${warna}33`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'11px', fontWeight:'700', color:warna }}>
                        {t.ticker.slice(0,3)}
                      </div>
                      <div>
                        <div style={{ fontSize:'14px', fontWeight:'600', color:'#e8f0fe' }}>{t.ticker}</div>
                        <div style={{ fontSize:'10px', color:'#4a6a8a', marginTop:'1px' }}>
                          {t.jumlah % 1 === 0 ? t.jumlah.toLocaleString('id-ID') : t.jumlah.toFixed(6)} unit
                        </div>
                      </div>
                    </div>
                    <div style={{ textAlign:'right' }}>
                      {liveUSD && <div style={{ fontSize:'11px', color:'#ffb74d', marginBottom:'2px' }}>Live: {fmtUSD(liveUSD)}</div>}
                      <div style={{ fontSize:'13px', fontWeight:'600', color: nilaiLive?(pnlCoin>=0?'#4cde8a':'#ff6464'):'#4a6a8a' }}>
                        {nilaiLive ? fmtIDR(nilaiLive) : fmtIDR(t.totalBeliIDR)}
                      </div>
                      {pnlCoin !== null && (
                        <div style={{ fontSize:'10px', color:pnlCoin>=0?'#4cde8a':'#ff6464' }}>
                          {pnlCoin>=0?'▲':'▼'} {fmtIDR(Math.abs(pnlCoin))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="vf-grid3">
                    {[
                      { label:'AVG BELI', value:fmtIDR(avgBeliIDR) },
                      { label:'MODAL', value:fmtIDR(t.totalBeliIDR) },
                      { label:liveIDR?'HARGA LIVE':'BELUM ADA', value:liveIDR?fmtIDR(liveIDR):'refresh' },
                    ].map((k,i) => (
                      <div key={i} style={{ background:'rgba(255,255,255,0.04)', borderRadius:'8px', padding:'7px 10px' }}>
                        <div style={{ fontSize:'9px', color:'#4a6a8a', letterSpacing:'0.06em', marginBottom:'3px' }}>{k.label}</div>
                        <div style={{ fontSize:'11px', color:'#c8d8f0', fontWeight:'500' }}>{k.value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* RIWAYAT */}
        {tab === 'riwayat' && (
          <div className="vf-card">
            <div style={{ fontSize:'12px', fontWeight:'600', color:'#c8d8f0', letterSpacing:'0.04em', marginBottom:'14px' }}>RIWAYAT BELI</div>
            {list.length === 0
              ? <div style={{ color:'#3a5a7a', fontSize:'12px', padding:'12px 0' }}>Belum ada data</div>
              : list.map(c => (
                <div key={c.id} className="vf-row">
                  <div style={{ display:'flex', alignItems:'center', gap:'10px', flex:1 }}>
                    <div style={{ width:'8px', height:'8px', borderRadius:'50%', background:COIN_WARNA[c.ticker.toUpperCase()]||'#b464ff', flexShrink:0 }} />
                    <div>
                      <div style={{ fontSize:'13px', fontWeight:'600', color:'#e8f0fe' }}>
                        {c.ticker.toUpperCase()}
                        {c.catatan && <span style={{ fontSize:'10px', color:'#4a6a8a', marginLeft:'6px', fontWeight:'400' }}>{c.catatan}</span>}
                      </div>
                      <div style={{ fontSize:'10px', color:'#4a6a8a', marginTop:'1px' }}>
                        {c.tanggal} · {Number(c.jumlah).toLocaleString('id-ID')} unit · {fmtIDR(c.harga_beli_idr)}/unit
                      </div>
                    </div>
                  </div>
                  <div style={{ fontSize:'13px', fontWeight:'600', color:'#b464ff', marginRight:'12px' }}>
                    {fmtIDR(Number(c.jumlah)*Number(c.harga_beli_idr))}
                  </div>
                  <div style={{ display:'flex', gap:'6px' }}>
                    <button className="vf-btn-blue" style={{ padding:'5px 10px', fontSize:'11px' }} onClick={() => { setEditForm({...c}); setShowEdit(true) }}>Edit</button>
                    <button className="vf-btn-red" onClick={() => hapus(c.id)}>Hapus</button>
                  </div>
                </div>
              ))
            }
          </div>
        )}

        {/* MODAL TAMBAH */}
        {showTambah && (
          <div className="vf-modal" onClick={() => setShowTambah(false)}>
            <div className="vf-modal-box" onClick={e=>e.stopPropagation()}>
              <div style={{ fontFamily:'DM Serif Display,serif', fontSize:'18px', color:'#e8f0fe', marginBottom:'20px' }}>Tambah Coin</div>
              <div className="vf-grid2">
                <div><div className="vf-label">TICKER</div><input className="vf-input" value={form.ticker} onChange={e=>setForm({...form,ticker:e.target.value.toUpperCase()})} placeholder='BTC, ETH, PEPE...'/></div>
                <div><div className="vf-label">NAMA COIN</div><input className="vf-input" value={form.nama} onChange={e=>setForm({...form,nama:e.target.value})} placeholder='Bitcoin...'/></div>
              </div>
              <div className="vf-grid2">
                <div><div className="vf-label">JUMLAH UNIT</div><input className="vf-input" type='number' step='any' value={form.jumlah} onChange={e=>setForm({...form,jumlah:e.target.value})} placeholder='0'/></div>
                <div><div className="vf-label">TANGGAL BELI</div><input className="vf-input" type='date' value={form.tanggal} onChange={e=>setForm({...form,tanggal:e.target.value})}/></div>
              </div>
              <div className="vf-grid2">
                <div><div className="vf-label">HARGA BELI IDR/UNIT</div><input className="vf-input" type='number' step='any' value={form.harga_beli_idr} onChange={e=>setForm({...form,harga_beli_idr:e.target.value})} placeholder='0'/></div>
                <div><div className="vf-label">HARGA BELI USD/UNIT</div><input className="vf-input" type='number' step='any' value={form.harga_beli_usd} onChange={e=>setForm({...form,harga_beli_usd:e.target.value})} placeholder='0'/></div>
              </div>
              <div style={{ marginBottom:'16px' }}><div className="vf-label">PLATFORM / CATATAN</div><input className="vf-input" value={form.catatan} onChange={e=>setForm({...form,catatan:e.target.value})} placeholder='Ajaib, Binance...'/></div>
              <div style={{ display:'flex', gap:'8px' }}>
                <button className="vf-btn-green" onClick={save}>Simpan</button>
                <button className="vf-btn-red" style={{ padding:'10px 16px' }} onClick={() => setShowTambah(false)}>Batal</button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL EDIT */}
        {showEdit && editForm && (
          <div className="vf-modal" onClick={() => setShowEdit(false)}>
            <div className="vf-modal-box" onClick={e=>e.stopPropagation()}>
              <div style={{ fontFamily:'DM Serif Display,serif', fontSize:'18px', color:'#e8f0fe', marginBottom:'4px' }}>Edit Coin</div>
              <div style={{ fontSize:'11px', color:'#4a6a8a', marginBottom:'20px' }}>{editForm.ticker}</div>
              <div className="vf-grid2">
                <div><div className="vf-label">TICKER</div><input className="vf-input" value={editForm.ticker} onChange={e=>setEditForm({...editForm,ticker:e.target.value.toUpperCase()})}/></div>
                <div><div className="vf-label">NAMA</div><input className="vf-input" value={editForm.nama} onChange={e=>setEditForm({...editForm,nama:e.target.value})}/></div>
              </div>
              <div className="vf-grid2">
                <div><div className="vf-label">JUMLAH</div><input className="vf-input" type='number' step='any' value={editForm.jumlah} onChange={e=>setEditForm({...editForm,jumlah:e.target.value})}/></div>
                <div><div className="vf-label">TANGGAL</div><input className="vf-input" type='date' value={editForm.tanggal||''} onChange={e=>setEditForm({...editForm,tanggal:e.target.value})}/></div>
              </div>
              <div className="vf-grid2">
                <div><div className="vf-label">HARGA IDR/UNIT</div><input className="vf-input" type='number' step='any' value={editForm.harga_beli_idr} onChange={e=>setEditForm({...editForm,harga_beli_idr:e.target.value})}/></div>
                <div><div className="vf-label">HARGA USD/UNIT</div><input className="vf-input" type='number' step='any' value={editForm.harga_beli_usd} onChange={e=>setEditForm({...editForm,harga_beli_usd:e.target.value})}/></div>
              </div>
              <div style={{ marginBottom:'16px' }}><div className="vf-label">PLATFORM / CATATAN</div><input className="vf-input" value={editForm.catatan||''} onChange={e=>setEditForm({...editForm,catatan:e.target.value})}/></div>
              <div style={{ display:'flex', gap:'8px' }}>
                <button className="vf-btn-green" onClick={saveEdit}>Simpan</button>
                <button className="vf-btn-red" style={{ padding:'10px 16px' }} onClick={() => setShowEdit(false)}>Batal</button>
              </div>
            </div>
          </div>
        )}

      </div>
    </>
  )
}
