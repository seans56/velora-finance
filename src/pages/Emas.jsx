import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const PLATFORMS = ['Batangan Fisik', 'Shopee', 'Tokopedia', 'Dana', 'Pegadaian', 'BSI', 'Lainnya']
const EMPTY = { platform: 'Shopee', gram: '', harga_beli: '', tanggal: new Date().toISOString().split('T')[0], catatan: '' }

const fmtRp = (n) => 'Rp ' + (Number(n) || 0).toLocaleString('id-ID')
const fmtGram = (n) => (Number(n) || 0).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 4 }) + ' gr'

const css = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@300;400;500;600&display=swap');
  .vf-root { font-family: 'DM Sans', sans-serif; }
  .vf-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07); border-radius: 20px; padding: 18px; margin-bottom: 14px; }
  .vf-row { display:flex; justify-content:space-between; align-items:center; padding:10px 6px; border-bottom:1px solid rgba(255,255,255,0.05); border-radius:8px; transition:background 0.15s; }
  .vf-row:last-child { border-bottom:none; }
  .vf-row:hover { background:rgba(255,255,255,0.03); }
  .vf-input { background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); color:#fff; border-radius:10px; padding:10px 12px; font-size:13px; width:100%; box-sizing:border-box; font-family:'DM Sans',sans-serif; outline:none; transition:border-color 0.2s; }
  .vf-input:focus { border-color:rgba(245,200,66,0.5); }
  .vf-input option { background:#0d1828; }
  .vf-btn-gold { background:linear-gradient(135deg,#f5c842,#e0a800); color:#000; border:none; padding:10px 20px; border-radius:10px; font-size:13px; font-weight:700; cursor:pointer; font-family:'DM Sans',sans-serif; transition:opacity 0.2s; }
  .vf-btn-gold:hover { opacity:0.85; }
  .vf-btn-red { background:rgba(255,100,100,0.1); color:#ff6464; border:1px solid rgba(255,100,100,0.2); padding:5px 12px; border-radius:8px; font-size:11px; cursor:pointer; font-family:'DM Sans',sans-serif; transition:background 0.2s; }
  .vf-btn-red:hover { background:rgba(255,100,100,0.2); }
  .vf-label { font-size:11px; color:#4a6a8a; margin-bottom:4px; letter-spacing:0.06em; }
  .vf-grid2 { display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:12px; }
  @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
  .vf-fadein { animation:fadeUp 0.35s ease forwards; }
`

function GrafikEmas({ data }) {
  if (!data || data.length === 0) return (
    <div style={{ textAlign:'center', color:'#3a5a7a', fontSize:'12px', padding:'30px 0' }}>Belum ada data grafik</div>
  )
  const sorted = [...data].sort((a, b) => new Date(a.tanggal) - new Date(b.tanggal))
  const maxVal = Math.max(...sorted.map(d => d.nilai_rupiah))
  const W = 500, H = 140, PAD = 40
  return (
    <svg viewBox={`0 0 ${W} ${H + 30}`} style={{ width:'100%', height:'auto' }}>
      {[0, 0.25, 0.5, 0.75, 1].map((v, i) => (
        <line key={i} x1={PAD} y1={PAD + (1-v)*H} x2={W-10} y2={PAD + (1-v)*H} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
      ))}
      {sorted.map((d, i) => {
        const bw = Math.max(8, (W - PAD - 10) / sorted.length - 6)
        const x = PAD + i * ((W - PAD - 10) / sorted.length) + bw * 0.1
        const bh = maxVal > 0 ? (d.nilai_rupiah / maxVal) * H : 0
        const y = PAD + H - bh
        return (
          <g key={i}>
            <rect x={x} y={y} width={bw * 0.8} height={bh} fill="#f5c842" opacity="0.85" rx="4" />
            <text x={x + bw * 0.4} y={H + PAD + 14} textAnchor="middle" fill="#4a6a8a" fontSize="8">
              {d.tanggal?.slice(5)}
            </text>
          </g>
        )
      })}
      <text x={PAD - 4} y={PAD + 4} textAnchor="end" fill="#4a6a8a" fontSize="8">{(maxVal/1e6).toFixed(1)}M</text>
      <text x={PAD - 4} y={PAD + H} textAnchor="end" fill="#4a6a8a" fontSize="8">0</text>
    </svg>
  )
}

export default function Emas() {
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState(EMPTY)
  const [hargaHariIni, setHargaHariIni] = useState(null)
  const [loadingHarga, setLoadingHarga] = useState(false)
  const [grafikData, setGrafikData] = useState([])

  const refetch = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase.from('emas').select('*').eq('user_id', user.id).order('tanggal', { ascending: false })
    setList(data || [])
    const grouped = {}
    ;(data || []).forEach(d => {
      const tgl = d.tanggal
      if (!grouped[tgl]) grouped[tgl] = 0
      grouped[tgl] += Number(d.berat_gram) * Number(d.harga_beli_per_gram || 0)
    })
    setGrafikData(Object.entries(grouped).map(([tanggal, nilai_rupiah]) => ({ tanggal, nilai_rupiah })))
    setLoading(false)
  }

  const fetchHargaEmas = async () => {
    setLoadingHarga(true)
    setHargaHariIni(2633000)
    setLoadingHarga(false)
  }

  useEffect(() => { refetch(); fetchHargaEmas() }, [])

  const totalGram = list.reduce((s, r) => s + Number(r.berat_gram || 0), 0)
  const totalNilaiModal = list.reduce((s, r) => s + Number(r.berat_gram || 0) * Number(r.harga_beli_per_gram || 0), 0)
  const totalNilaiSekarang = hargaHariIni ? totalGram * hargaHariIni : totalNilaiModal
  const untungRugi = totalNilaiSekarang - totalNilaiModal

  const save = async () => {
    if (!form.gram || !form.harga_beli) return alert('Isi gram dan harga beli dulu!')
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase.from('emas').insert({
      platform: form.platform,
      berat_gram: Number(form.gram),
      harga_beli_per_gram: Number(String(form.harga_beli).replace(/[^0-9]/g, '')),
      tanggal: form.tanggal,
      catatan: form.catatan,
      user_id: user.id
    })
    if (error) return alert('Error: ' + error.message)
    setForm(EMPTY)
    refetch()
  }

  const hapus = async (id) => {
    if (!confirm('Hapus data emas ini?')) return
    await supabase.from('emas').delete().eq('id', id)
    refetch()
  }

  return (
    <>
      <style>{css}</style>
      <div className="vf-root" style={{ padding:'24px 20px', background:'#080c14', minHeight:'100vh', color:'#fff' }}>

        {/* HEADER */}
        <div className="vf-fadein" style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'24px' }}>
          <div>
            <div style={{ fontSize:'11px', color:'#4a6a8a', letterSpacing:'0.08em', marginBottom:'4px' }}>INVESTASI</div>
            <div style={{ fontFamily:'DM Serif Display,serif', fontSize:'22px', color:'#e8f0fe' }}>Portofolio Emas</div>
          </div>
          <button onClick={fetchHargaEmas} disabled={loadingHarga}
            style={{ background:'rgba(245,200,66,0.1)', color:'#f5c842', border:'1px solid rgba(245,200,66,0.2)', padding:'8px 14px', borderRadius:'10px', fontSize:'12px', cursor:'pointer', fontFamily:'DM Sans,sans-serif' }}>
            🔄 Refresh Harga
          </button>
        </div>

        {/* KPI */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px', marginBottom:'16px' }}>
          <div style={{ background:'linear-gradient(135deg,#1a1500,#1a1800)', border:'1px solid rgba(245,200,66,0.2)', borderRadius:'16px', padding:'16px' }}>
            <div style={{ fontSize:'10px', color:'#4a6a8a', letterSpacing:'0.08em', marginBottom:'6px' }}>TOTAL KEPEMILIKAN</div>
            <div style={{ fontFamily:'DM Serif Display,serif', fontSize:'20px', color:'#f5c842' }}>{fmtGram(totalGram)}</div>
            <div style={{ fontSize:'10px', color:'#4a6a8a', marginTop:'4px' }}>Modal: {fmtRp(totalNilaiModal)}</div>
          </div>
          <div style={{ background: untungRugi >= 0 ? 'linear-gradient(135deg,#0a1a0a,#0d1f0d)' : 'linear-gradient(135deg,#1a0808,#1a0a0a)', border:`1px solid ${untungRugi >= 0 ? 'rgba(0,200,83,0.2)' : 'rgba(255,100,100,0.2)'}`, borderRadius:'16px', padding:'16px' }}>
            <div style={{ fontSize:'10px', color:'#4a6a8a', letterSpacing:'0.08em', marginBottom:'6px' }}>NILAI SEKARANG</div>
            <div style={{ fontFamily:'DM Serif Display,serif', fontSize:'20px', color:'#4a9eff' }}>{fmtRp(totalNilaiSekarang)}</div>
            <div style={{ fontSize:'10px', color: untungRugi >= 0 ? '#4cde8a' : '#ff6464', marginTop:'4px' }}>
              {untungRugi >= 0 ? '▲' : '▼'} {fmtRp(Math.abs(untungRugi))}
            </div>
          </div>
        </div>

        {/* HARGA HARI INI */}
        <div className="vf-card" style={{ display:'flex', justifyContent:'space-between', alignItems:'center', border:'1px solid rgba(245,200,66,0.12)' }}>
          <div>
            <div style={{ fontSize:'10px', color:'#4a6a8a', letterSpacing:'0.08em', marginBottom:'4px' }}>HARGA EMAS /GRAM (ESTIMASI)</div>
            <div style={{ fontSize:'18px', fontWeight:'600', color:'#f5c842' }}>
              {loadingHarga ? 'Memuat...' : hargaHariIni ? fmtRp(hargaHariIni) : '-'}
            </div>
          </div>
          <div style={{ fontSize:'24px' }}>🥇</div>
        </div>

        {/* GRAFIK */}
        <div className="vf-card">
          <div style={{ fontSize:'12px', fontWeight:'600', color:'#c8d8f0', letterSpacing:'0.04em', marginBottom:'12px' }}>📈 GRAFIK NILAI EMAS</div>
          <GrafikEmas data={grafikData} />
        </div>

        {/* FORM TAMBAH */}
        <div className="vf-card">
          <div style={{ fontSize:'12px', fontWeight:'600', color:'#c8d8f0', letterSpacing:'0.04em', marginBottom:'16px' }}>➕ CATAT PEMBELIAN</div>
          <div className="vf-grid2">
            <div><div className="vf-label">PLATFORM</div>
              <select className="vf-input" value={form.platform} onChange={e => setForm({...form, platform:e.target.value})}>
                {PLATFORMS.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div><div className="vf-label">TANGGAL BELI</div>
              <input type="date" className="vf-input" value={form.tanggal} onChange={e => setForm({...form, tanggal:e.target.value})} />
            </div>
          </div>
          <div className="vf-grid2">
            <div><div className="vf-label">JUMLAH (GRAM)</div>
              <input className="vf-input" value={form.gram} onChange={e => setForm({...form, gram:e.target.value})} placeholder="0.5" />
            </div>
            <div><div className="vf-label">HARGA BELI /GRAM (RP)</div>
              <input className="vf-input" value={form.harga_beli} onChange={e => setForm({...form, harga_beli:e.target.value})} placeholder="2633000" />
            </div>
          </div>
          <div style={{ marginBottom:'16px' }}>
            <div className="vf-label">CATATAN (OPSIONAL)</div>
            <input className="vf-input" value={form.catatan} onChange={e => setForm({...form, catatan:e.target.value})} placeholder="Nabung rutin..." />
          </div>
          <button className="vf-btn-gold" onClick={save}>Simpan</button>
        </div>

        {/* DAFTAR */}
        <div className="vf-card">
          <div style={{ fontSize:'12px', fontWeight:'600', color:'#c8d8f0', letterSpacing:'0.04em', marginBottom:'14px' }}>📋 DAFTAR EMAS</div>
          {loading
            ? <div style={{ color:'#3a5a7a', fontSize:'12px' }}>Loading...</div>
            : list.length === 0
            ? <div style={{ color:'#3a5a7a', fontSize:'12px', padding:'12px 0' }}>Belum ada data — tambah di atas</div>
            : list.map(r => {
              const nilaiModal = Number(r.berat_gram) * Number(r.harga_beli_per_gram)
              const nilaiSkrg = hargaHariIni ? Number(r.berat_gram) * hargaHariIni : nilaiModal
              const selisih = nilaiSkrg - nilaiModal
              return (
                <div key={r.id} className="vf-row">
                  <div style={{ flex:1 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'3px' }}>
                      <span style={{ fontSize:'13px', fontWeight:'600', color:'#e8f0fe' }}>{fmtGram(r.berat_gram)}</span>
                      <span style={{ fontSize:'10px', padding:'2px 8px', borderRadius:'20px', background:'rgba(245,200,66,0.1)', color:'#f5c842', border:'1px solid rgba(245,200,66,0.2)' }}>{r.platform}</span>
                    </div>
                    <div style={{ fontSize:'10px', color:'#4a6a8a' }}>Beli {fmtRp(r.harga_beli_per_gram)}/gr · {r.tanggal}</div>
                    <div style={{ fontSize:'10px', color: selisih >= 0 ? '#4cde8a' : '#ff6464', marginTop:'2px' }}>
                      {selisih >= 0 ? '▲' : '▼'} {fmtRp(Math.abs(selisih))}
                    </div>
                  </div>
                  <div style={{ textAlign:'right', marginRight:'12px' }}>
                    <div style={{ fontSize:'13px', fontWeight:'600', color:'#f5c842' }}>{fmtRp(nilaiSkrg)}</div>
                    <div style={{ fontSize:'10px', color:'#4a6a8a', marginTop:'1px' }}>modal {fmtRp(nilaiModal)}</div>
                  </div>
                  <button className="vf-btn-red" onClick={() => hapus(r.id)}>Hapus</button>
                </div>
              )
            })
          }
        </div>

      </div>
    </>
  )
}