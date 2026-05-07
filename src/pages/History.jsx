import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const fmt = (n) => 'Rp ' + (Number(n)||0).toLocaleString('id-ID')

const css = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@300;400;500;600&display=swap');
  .vf-root { font-family: 'DM Sans', sans-serif; }
  .vf-card { background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.07); border-radius:20px; padding:18px; margin-bottom:14px; }
  .vf-row { display:flex; justify-content:space-between; align-items:center; padding:10px 6px; border-bottom:1px solid rgba(255,255,255,0.05); border-radius:8px; transition:background 0.15s; }
  .vf-row:last-child { border-bottom:none; }
  .vf-row:hover { background:rgba(255,255,255,0.03); }
  .vf-tab { padding:8px 16px; border-radius:10px; font-size:12px; cursor:pointer; border:1px solid rgba(255,255,255,0.07); background:transparent; color:#4a6a8a; font-family:'DM Sans',sans-serif; transition:all 0.2s; }
  .vf-tab:hover { color:#c8d8f0; border-color:rgba(255,255,255,0.15); }
  .vf-tab.active { background:rgba(74,158,255,0.12); color:#4a9eff; border-color:rgba(74,158,255,0.3); }
  .vf-wallet-btn { padding:7px 12px; border-radius:10px; font-size:11px; cursor:pointer; border:1px solid rgba(255,255,255,0.07); background:transparent; color:#4a6a8a; font-family:'DM Sans',sans-serif; transition:all 0.2s; }
  .vf-wallet-btn:hover { color:#c8d8f0; border-color:rgba(255,255,255,0.15); }
  .vf-wallet-btn.active { background:rgba(74,158,255,0.1); color:#4a9eff; border-color:rgba(74,158,255,0.25); }
  .vf-month-input { background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); color:#fff; border-radius:10px; padding:8px 12px; font-size:12px; font-family:'DM Sans',sans-serif; outline:none; }
  .vf-label { font-size:11px; color:#4a6a8a; margin-bottom:4px; letter-spacing:0.06em; }
  @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
  .vf-fadein { animation:fadeUp 0.35s ease forwards; }
  .vf-progress { width:100%; background:rgba(255,255,255,0.05); border-radius:6px; height:6px; overflow:hidden; }
`

const WARNA_KATEGORI = {
  'Gaji':'#4cde8a','Freelance':'#4a9eff','Bisnis':'#b464ff','Makalah':'#ffb74d',
  'Transfer Masuk':'#4dd0e1','Makan':'#ff6464','Transport':'#ff8a65','Belanja':'#f48fb1',
  'Hutang':'#ef5350','Investasi':'#26c6da','Transfer Keluar':'#78909c','Lainnya':'#6a8aaa'
}

export default function History() {
  const [transaksi, setTransaksi] = useState([])
  const [rekening, setRekening] = useState([])
  const [tab, setTab] = useState('harian')
  const [selectedWallet, setSelectedWallet] = useState('all')
  const [bulan, setBulan] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`
  })
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    const [{ data:r }, { data:t }] = await Promise.all([
      supabase.from('rekening').select('*').order('created_at'),
      supabase.from('transaksi').select('*, rekening(nama)').order('tanggal', { ascending:false })
    ])
    setRekening(r||[])
    setTransaksi(t||[])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const filtered = transaksi.filter(t => {
    const walletOk = selectedWallet==='all' || t.rekening_id===selectedWallet
    const bulanOk = t.tanggal?.startsWith(bulan)
    return walletOk && bulanOk
  })

  const totalMasuk = filtered.filter(t => t.tipe==='Pemasukan').reduce((s,t) => s+Number(t.jumlah), 0)
  const totalKeluar = filtered.filter(t => t.tipe==='Pengeluaran').reduce((s,t) => s+Number(t.jumlah), 0)
  const selisih = totalMasuk - totalKeluar

  const perKategori = filtered.filter(t => t.tipe==='Pengeluaran').reduce((acc,t) => {
    acc[t.kategori] = (acc[t.kategori]||0) + Number(t.jumlah)
    return acc
  }, {})
  const kategoriList = Object.entries(perKategori).sort((a,b) => b[1]-a[1])
  const maxKategori = Math.max(...kategoriList.map(([,v]) => v), 1)

  const perHari = filtered.reduce((acc,t) => {
    if (!acc[t.tanggal]) acc[t.tanggal] = []
    acc[t.tanggal].push(t)
    return acc
  }, {})
  const hariList = Object.keys(perHari).sort((a,b) => b.localeCompare(a))

  const perMinggu = filtered.reduce((acc,t) => {
    const d = new Date(t.tanggal)
    const day = d.getDay()
    const diff = d.getDate() - day + (day===0?-6:1)
    const senin = new Date(d.setDate(diff))
    const key = senin.toISOString().split('T')[0]
    if (!acc[key]) acc[key] = []
    acc[key].push(t)
    return acc
  }, {})
  const mingguList = Object.keys(perMinggu).sort((a,b) => b.localeCompare(a))

  const ringkasanTx = (list) => ({
    masuk: list.filter(t=>t.tipe==='Pemasukan').reduce((s,t)=>s+Number(t.jumlah),0),
    keluar: list.filter(t=>t.tipe==='Pengeluaran').reduce((s,t)=>s+Number(t.jumlah),0),
  })

  const TxList = ({ list }) => (
    <div>
      {list.map(t => (
        <div key={t.id} className="vf-row">
          <div style={{ display:'flex', alignItems:'center', gap:'10px', flex:1 }}>
            <div style={{ width:'8px', height:'8px', borderRadius:'50%', background:t.tipe==='Pemasukan'?'#4cde8a':'#ff6464', flexShrink:0 }} />
            <div>
              <div style={{ fontSize:'13px', color:'#c8d8f0', fontWeight:'500' }}>{t.keterangan}</div>
              <div style={{ fontSize:'10px', color:'#4a6a8a', marginTop:'1px' }}>
                {t.rekening?.nama||'-'} · {t.kategori}
              </div>
            </div>
          </div>
          <div style={{ fontSize:'13px', fontWeight:'600', color:t.tipe==='Pemasukan'?'#4cde8a':'#ff6464' }}>
            {t.tipe==='Pemasukan'?'+':'-'}{fmt(t.jumlah)}
          </div>
        </div>
      ))}
    </div>
  )

  if (loading) return (
    <div style={{ display:'flex', height:'100vh', background:'#080c14', alignItems:'center', justifyContent:'center' }}>
      <div style={{ color:'#4a9eff', fontSize:'13px', fontFamily:'DM Sans,sans-serif' }}>Memuat...</div>
    </div>
  )

  return (
    <>
      <style>{css}</style>
      <div className="vf-root" style={{ padding:'24px 20px', background:'#080c14', minHeight:'100vh', color:'#fff' }}>

        {/* HEADER */}
        <div className="vf-fadein" style={{ marginBottom:'24px' }}>
          <div style={{ fontSize:'11px', color:'#4a6a8a', letterSpacing:'0.08em', marginBottom:'4px' }}>LAPORAN</div>
          <div style={{ fontFamily:'DM Serif Display,serif', fontSize:'22px', color:'#e8f0fe' }}>History Transaksi</div>
        </div>

        {/* FILTER */}
        <div style={{ display:'flex', gap:'10px', alignItems:'center', marginBottom:'16px', flexWrap:'wrap' }}>
          <input type='month' value={bulan} onChange={e=>setBulan(e.target.value)} className="vf-month-input" />
          <button className={`vf-wallet-btn${selectedWallet==='all'?' active':''}`} onClick={() => setSelectedWallet('all')}>
            Semua
          </button>
          {rekening.map(r => (
            <button key={r.id} className={`vf-wallet-btn${selectedWallet===r.id?' active':''}`} onClick={() => setSelectedWallet(r.id)}>
              {r.nama}
            </button>
          ))}
        </div>

        {/* KPI */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'10px', marginBottom:'16px' }}>
          {[
            { label:'PEMASUKAN', value:fmt(totalMasuk), color:'#4cde8a', bg:'rgba(0,200,83,0.08)', border:'rgba(0,200,83,0.2)' },
            { label:'PENGELUARAN', value:fmt(totalKeluar), color:'#ff6464', bg:'rgba(255,100,100,0.08)', border:'rgba(255,100,100,0.2)' },
            { label:'SELISIH', value:`${selisih>=0?'+':''}${fmt(selisih)}`, color:selisih>=0?'#4cde8a':'#ff6464', bg:selisih>=0?'rgba(0,200,83,0.08)':'rgba(255,100,100,0.08)', border:selisih>=0?'rgba(0,200,83,0.2)':'rgba(255,100,100,0.2)' },
          ].map((k,i) => (
            <div key={i} style={{ background:k.bg, border:`1px solid ${k.border}`, borderRadius:'16px', padding:'14px' }}>
              <div style={{ fontSize:'10px', color:'#4a6a8a', letterSpacing:'0.08em', marginBottom:'6px' }}>{k.label}</div>
              <div style={{ fontSize:'14px', fontWeight:'600', color:k.color }}>{k.value}</div>
            </div>
          ))}
        </div>

        {/* GRAFIK KATEGORI */}
        {kategoriList.length > 0 && (
          <div className="vf-card">
            <div style={{ fontSize:'12px', fontWeight:'600', color:'#c8d8f0', letterSpacing:'0.04em', marginBottom:'14px' }}>PENGELUARAN PER KATEGORI</div>
            {kategoriList.map(([kat, val]) => (
              <div key={kat} style={{ marginBottom:'10px' }}>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:'12px', marginBottom:'4px' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                    <div style={{ width:'8px', height:'8px', borderRadius:'50%', background:WARNA_KATEGORI[kat]||'#6a8aaa' }} />
                    <span style={{ color:'#c8d8f0' }}>{kat}</span>
                  </div>
                  <span style={{ color:'#ff6464', fontWeight:'500' }}>{fmt(val)}</span>
                </div>
                <div className="vf-progress">
                  <div style={{ width:`${(val/maxKategori)*100}%`, height:'100%', background:WARNA_KATEGORI[kat]||'#6a8aaa', borderRadius:'6px', transition:'width 0.4s ease' }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TABS */}
        <div style={{ display:'flex', gap:'8px', marginBottom:'16px' }}>
          {['harian','mingguan','bulanan'].map(t => (
            <button key={t} className={`vf-tab${tab===t?' active':''}`} onClick={() => setTab(t)}>
              {t.charAt(0).toUpperCase()+t.slice(1)}
            </button>
          ))}
        </div>

        {/* HARIAN */}
        {tab === 'harian' && (
          <div>
            {hariList.length === 0
              ? <div style={{ color:'#3a5a7a', fontSize:'13px', textAlign:'center', padding:'32px' }}>Tidak ada transaksi di bulan ini</div>
              : hariList.map(tgl => {
                const list = perHari[tgl]
                const { masuk, keluar } = ringkasanTx(list)
                return (
                  <div key={tgl} className="vf-card">
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'12px' }}>
                      <div style={{ fontFamily:'DM Serif Display,serif', fontSize:'14px', color:'#4a9eff' }}>
                        {new Date(tgl+'T00:00:00').toLocaleDateString('id-ID', { weekday:'long', day:'numeric', month:'long' })}
                      </div>
                      <div style={{ display:'flex', gap:'10px', fontSize:'11px' }}>
                        {masuk > 0 && <span style={{ color:'#4cde8a', fontWeight:'600' }}>+{fmt(masuk)}</span>}
                        {keluar > 0 && <span style={{ color:'#ff6464', fontWeight:'600' }}>-{fmt(keluar)}</span>}
                      </div>
                    </div>
                    <TxList list={list} />
                  </div>
                )
              })
            }
          </div>
        )}

        {/* MINGGUAN */}
        {tab === 'mingguan' && (
          <div>
            {mingguList.length === 0
              ? <div style={{ color:'#3a5a7a', fontSize:'13px', textAlign:'center', padding:'32px' }}>Tidak ada transaksi</div>
              : mingguList.map(senin => {
                const list = perMinggu[senin]
                const { masuk, keluar } = ringkasanTx(list)
                const sabtu = new Date(senin)
                sabtu.setDate(sabtu.getDate() + 6)
                return (
                  <div key={senin} className="vf-card">
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'12px' }}>
                      <div style={{ fontFamily:'DM Serif Display,serif', fontSize:'13px', color:'#b464ff' }}>
                        {new Date(senin+'T00:00:00').toLocaleDateString('id-ID',{day:'numeric',month:'short'})} — {sabtu.toLocaleDateString('id-ID',{day:'numeric',month:'short',year:'numeric'})}
                      </div>
                      <div style={{ display:'flex', gap:'8px', fontSize:'11px' }}>
                        {masuk > 0 && <span style={{ color:'#4cde8a', fontWeight:'600' }}>+{fmt(masuk)}</span>}
                        {keluar > 0 && <span style={{ color:'#ff6464', fontWeight:'600' }}>-{fmt(keluar)}</span>}
                      </div>
                    </div>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'8px', marginBottom:'12px' }}>
                      {[
                        { label:'MASUK', value:fmt(masuk), color:'#4cde8a', bg:'rgba(0,200,83,0.08)' },
                        { label:'KELUAR', value:fmt(keluar), color:'#ff6464', bg:'rgba(255,100,100,0.08)' },
                        { label:'TRANSAKSI', value:`${list.length}x`, color:'#4a9eff', bg:'rgba(74,158,255,0.08)' },
                      ].map((k,i) => (
                        <div key={i} style={{ background:k.bg, borderRadius:'10px', padding:'8px 10px' }}>
                          <div style={{ fontSize:'9px', color:'#4a6a8a', letterSpacing:'0.06em', marginBottom:'3px' }}>{k.label}</div>
                          <div style={{ fontSize:'12px', fontWeight:'600', color:k.color }}>{k.value}</div>
                        </div>
                      ))}
                    </div>
                    <TxList list={list} />
                  </div>
                )
              })
            }
          </div>
        )}

        {/* BULANAN */}
        {tab === 'bulanan' && (
          <div className="vf-card">
            <div style={{ fontFamily:'DM Serif Display,serif', fontSize:'16px', color:'#e8f0fe', marginBottom:'4px' }}>
              {new Date(bulan+'-01').toLocaleDateString('id-ID',{month:'long',year:'numeric'})}
            </div>
            <div style={{ fontSize:'11px', color:'#4a6a8a', marginBottom:'16px' }}>{filtered.length} transaksi</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px', marginBottom:'16px' }}>
              {[
                { label:'TOTAL PEMASUKAN', value:fmt(totalMasuk), sub:`${filtered.filter(t=>t.tipe==='Pemasukan').length} transaksi`, color:'#4cde8a', bg:'rgba(0,200,83,0.08)', border:'rgba(0,200,83,0.2)' },
                { label:'TOTAL PENGELUARAN', value:fmt(totalKeluar), sub:`${filtered.filter(t=>t.tipe==='Pengeluaran').length} transaksi`, color:'#ff6464', bg:'rgba(255,100,100,0.08)', border:'rgba(255,100,100,0.2)' },
              ].map((k,i) => (
                <div key={i} style={{ background:k.bg, border:`1px solid ${k.border}`, borderRadius:'14px', padding:'14px' }}>
                  <div style={{ fontSize:'10px', color:'#4a6a8a', letterSpacing:'0.08em', marginBottom:'6px' }}>{k.label}</div>
                  <div style={{ fontSize:'16px', fontWeight:'700', color:k.color }}>{k.value}</div>
                  <div style={{ fontSize:'10px', color:'#4a6a8a', marginTop:'4px' }}>{k.sub}</div>
                </div>
              ))}
            </div>
            <div style={{ fontSize:'11px', color:'#4a6a8a', letterSpacing:'0.06em', marginBottom:'10px' }}>SEMUA TRANSAKSI</div>
            {filtered.length === 0
              ? <div style={{ color:'#3a5a7a', fontSize:'12px' }}>Tidak ada transaksi</div>
              : <TxList list={filtered} />
            }
          </div>
        )}

      </div>
    </>
  )
}
