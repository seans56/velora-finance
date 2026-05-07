import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

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
  .vf-input:focus { border-color: rgba(74,158,255,0.5); }
  .vf-input option { background: #0d1828; }
  .vf-btn-green { background: linear-gradient(135deg,#00c853,#00a844); color:#000; border:none; padding:10px 20px; border-radius:10px; font-size:13px; font-weight:600; cursor:pointer; font-family:'DM Sans',sans-serif; transition:opacity 0.2s; }
  .vf-btn-green:hover { opacity:0.85; }
  .vf-btn-red { background:rgba(255,100,100,0.1); color:#ff6464; border:1px solid rgba(255,100,100,0.2); padding:5px 12px; border-radius:8px; font-size:11px; cursor:pointer; font-family:'DM Sans',sans-serif; transition:background 0.2s; }
  .vf-btn-red:hover { background:rgba(255,100,100,0.2); }
  .vf-label { font-size:11px; color:#4a6a8a; margin-bottom:4px; letter-spacing:0.06em; }
  .vf-grid2 { display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:12px; }
  .vf-grid3 { display:grid; grid-template-columns:1fr 1fr 1fr; gap:10px; margin-bottom:12px; }
  @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
  .vf-fadein { animation:fadeUp 0.35s ease forwards; }
`

const sahamAwal = [
  { tanggal:'2026-05-06', kode:'BRIS', aksi:'Beli', jumlah:1, satuan:'Lot', harga:2450, mata_uang:'IDR', catatan:'' },
  { tanggal:'2026-05-10', kode:'SPUS', aksi:'Beli', jumlah:1, satuan:'Share', harga:42, mata_uang:'USD', catatan:'' },
  { tanggal:'2026-05-15', kode:'BRIS', aksi:'Beli', jumlah:2, satuan:'Lot', harga:2500, mata_uang:'IDR', catatan:'Tambah posisi' },
]

const EMPTY = { tanggal:'', kode:'', aksi:'Beli', jumlah:'', satuan:'Lot', harga:'', mata_uang:'IDR', catatan:'' }

export default function Saham() {
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState(EMPTY)
  const [dispHarga, setDispHarga] = useState('')

  const loadData = async () => {
    setLoading(true)
    const { data } = await supabase.from('saham').select('*').order('tanggal', { ascending: false })
    setList(data || [])
    setLoading(false)
  }

  useEffect(() => { loadData() }, [])

  const fmt = (n, currency='IDR') => {
    const num = Number(n) || 0
    if (currency === 'IDR') return 'Rp ' + num.toLocaleString('id-ID')
    return '$' + num.toLocaleString('en-US')
  }

  const fmtRp = (n) => 'Rp ' + (Number(n)||0).toLocaleString('id-ID')

  const totalIDR = list
    .filter(s => s.aksi === 'Beli' && s.mata_uang === 'IDR')
    .reduce((sum, s) => sum + (Number(s.jumlah) * (s.satuan === 'Lot' ? 100 : 1) * Number(s.harga)), 0)

  const totalUSD = list
    .filter(s => s.aksi === 'Beli' && s.mata_uang === 'USD')
    .reduce((sum, s) => sum + (Number(s.jumlah) * Number(s.harga)), 0)

  // Ringkasan per kode saham
  const perKode = list.filter(s => s.aksi === 'Beli').reduce((acc, s) => {
    const k = s.kode
    if (!acc[k]) acc[k] = { kode:k, jumlah:0, modal:0, mata_uang:s.mata_uang }
    const lembar = Number(s.jumlah) * (s.satuan === 'Lot' ? 100 : 1)
    acc[k].jumlah += lembar
    acc[k].modal += lembar * Number(s.harga)
    return acc
  }, {})

  const handleHarga = (raw) => {
    const clean = raw.replace(/[^0-9]/g, '')
    const num = Number(clean) || 0
    setForm(f => ({ ...f, harga: num }))
    setDispHarga(num ? num.toLocaleString('id-ID') : '')
  }

  const importData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    for (const s of sahamAwal) await supabase.from('saham').insert({ ...s, user_id: user.id })
    loadData()
  }

  const save = async () => {
    if (!form.kode || !form.tanggal || !form.harga) return
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase.from('saham').insert({
      tanggal: form.tanggal, kode: form.kode.toUpperCase(), aksi: form.aksi,
      jumlah: Number(form.jumlah)||0, satuan: form.satuan, harga: Number(form.harga)||0,
      mata_uang: form.mata_uang, catatan: form.catatan, user_id: user.id
    })
    if (error) { alert('Error: '+error.message); return }
    setForm(EMPTY); setDispHarga(''); loadData()
  }

  const hapus = async (id) => {
    await supabase.from('saham').delete().eq('id', id)
    loadData()
  }

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
        <div className="vf-fadein" style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'24px' }}>
          <div>
            <div style={{ fontSize:'11px', color:'#4a6a8a', letterSpacing:'0.08em', marginBottom:'4px' }}>INVESTASI</div>
            <div style={{ fontFamily:'DM Serif Display,serif', fontSize:'22px', color:'#e8f0fe' }}>Portofolio Saham</div>
          </div>
          {list.length === 0 && (
            <button className="vf-btn-green" onClick={importData} style={{ fontSize:'12px', padding:'8px 14px' }}>Import Contoh</button>
          )}
        </div>

        {/* KPI */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px', marginBottom:'20px' }}>
          <div style={{ background:'linear-gradient(135deg,#0a1a0a,#0d1f0d)', border:'1px solid rgba(0,200,83,0.2)', borderRadius:'16px', padding:'16px' }}>
            <div style={{ fontSize:'10px', color:'#4a6a8a', letterSpacing:'0.08em', marginBottom:'6px' }}>MODAL IDR</div>
            <div style={{ fontFamily:'DM Serif Display,serif', fontSize:'20px', color:'#4cde8a' }}>{fmtRp(totalIDR)}</div>
          </div>
          <div style={{ background:'linear-gradient(135deg,#0a1420,#0d1a28)', border:'1px solid rgba(74,158,255,0.2)', borderRadius:'16px', padding:'16px' }}>
            <div style={{ fontSize:'10px', color:'#4a6a8a', letterSpacing:'0.08em', marginBottom:'6px' }}>MODAL USD</div>
            <div style={{ fontFamily:'DM Serif Display,serif', fontSize:'20px', color:'#4a9eff' }}>${totalUSD.toLocaleString('en-US', {minimumFractionDigits:2,maximumFractionDigits:2})}</div>
          </div>
        </div>

        {/* RINGKASAN PER KODE */}
        {Object.values(perKode).length > 0 && (
          <div className="vf-card" style={{ marginBottom:'14px' }}>
            <div style={{ fontSize:'12px', fontWeight:'600', color:'#c8d8f0', letterSpacing:'0.04em', marginBottom:'14px' }}>RINGKASAN PORTOFOLIO</div>
            {Object.values(perKode).map(k => (
              <div key={k.kode} className="vf-row">
                <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                  <div style={{ width:'32px', height:'32px', borderRadius:'10px', background:'rgba(74,158,255,0.1)', border:'1px solid rgba(74,158,255,0.2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'10px', fontWeight:'700', color:'#4a9eff' }}>
                    {k.kode.slice(0,2)}
                  </div>
                  <div>
                    <div style={{ fontSize:'13px', fontWeight:'600', color:'#e8f0fe' }}>{k.kode}</div>
                    <div style={{ fontSize:'10px', color:'#4a6a8a', marginTop:'1px' }}>{k.jumlah.toLocaleString('id-ID')} lembar</div>
                  </div>
                </div>
                <div style={{ textAlign:'right' }}>
                  <div style={{ fontSize:'13px', fontWeight:'600', color:'#4cde8a' }}>{fmt(k.modal, k.mata_uang)}</div>
                  <div style={{ fontSize:'10px', color:'#4a6a8a', marginTop:'1px' }}>modal</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* FORM TAMBAH */}
        <div className="vf-card">
          <div style={{ fontSize:'12px', fontWeight:'600', color:'#c8d8f0', letterSpacing:'0.04em', marginBottom:'16px' }}>➕ TAMBAH TRANSAKSI</div>
          <div className="vf-grid2">
            <div><div className="vf-label">TANGGAL</div><input className="vf-input" type='date' value={form.tanggal} onChange={e=>setForm({...form,tanggal:e.target.value})}/></div>
            <div><div className="vf-label">KODE SAHAM</div><input className="vf-input" value={form.kode} onChange={e=>setForm({...form,kode:e.target.value.toUpperCase()})} placeholder='BRIS, BBCA, SPUS...'/></div>
          </div>
          <div className="vf-grid3">
            <div><div className="vf-label">AKSI</div><select className="vf-input" value={form.aksi} onChange={e=>setForm({...form,aksi:e.target.value})}><option>Beli</option><option>Jual</option></select></div>
            <div><div className="vf-label">JUMLAH</div><input className="vf-input" type='number' value={form.jumlah} onChange={e=>setForm({...form,jumlah:e.target.value})} placeholder='0'/></div>
            <div><div className="vf-label">SATUAN</div><select className="vf-input" value={form.satuan} onChange={e=>setForm({...form,satuan:e.target.value})}><option>Lot</option><option>Share</option></select></div>
          </div>
          <div className="vf-grid2">
            <div><div className="vf-label">HARGA PER UNIT</div><input className="vf-input" value={dispHarga} onChange={e=>handleHarga(e.target.value)} placeholder='0'/></div>
            <div><div className="vf-label">MATA UANG</div><select className="vf-input" value={form.mata_uang} onChange={e=>setForm({...form,mata_uang:e.target.value})}><option>IDR</option><option>USD</option><option>SGD</option></select></div>
          </div>
          <div style={{ marginBottom:'16px' }}><div className="vf-label">CATATAN</div><input className="vf-input" value={form.catatan} onChange={e=>setForm({...form,catatan:e.target.value})} placeholder='opsional'/></div>
          <button className="vf-btn-green" onClick={save}>Simpan</button>
        </div>

        {/* RIWAYAT */}
        <div className="vf-card">
          <div style={{ fontSize:'12px', fontWeight:'600', color:'#c8d8f0', letterSpacing:'0.04em', marginBottom:'14px' }}>RIWAYAT TRANSAKSI</div>
          {list.length === 0
            ? <div style={{ color:'#3a5a7a', fontSize:'12px', padding:'12px 0' }}>Belum ada transaksi</div>
            : list.map(s => {
              const lembar = Number(s.jumlah) * (s.satuan === 'Lot' ? 100 : 1)
              const total = lembar * Number(s.harga)
              return (
                <div key={s.id} className="vf-row">
                  <div style={{ display:'flex', alignItems:'center', gap:'10px', flex:1 }}>
                    <div style={{ width:'32px', height:'32px', borderRadius:'10px', background: s.aksi==='Beli'?'rgba(0,200,83,0.1)':'rgba(255,100,100,0.1)', border:`1px solid ${s.aksi==='Beli'?'rgba(0,200,83,0.2)':'rgba(255,100,100,0.2)'}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'10px', fontWeight:'700', color:s.aksi==='Beli'?'#4cde8a':'#ff6464' }}>
                      {s.aksi==='Beli'?'B':'J'}
                    </div>
                    <div>
                      <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
                        <span style={{ fontSize:'13px', fontWeight:'600', color:'#e8f0fe' }}>{s.kode}</span>
                        <span style={{ fontSize:'10px', padding:'1px 7px', borderRadius:'20px', background:s.aksi==='Beli'?'rgba(0,200,83,0.1)':'rgba(255,100,100,0.1)', color:s.aksi==='Beli'?'#4cde8a':'#ff6464' }}>{s.aksi}</span>
                      </div>
                      <div style={{ fontSize:'10px', color:'#4a6a8a', marginTop:'2px' }}>
                        {s.tanggal} · {s.jumlah} {s.satuan} ({lembar.toLocaleString('id-ID')} lembar)
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign:'right', marginRight:'12px' }}>
                    <div style={{ fontSize:'13px', fontWeight:'600', color:'#4a9eff' }}>{fmt(total, s.mata_uang)}</div>
                    <div style={{ fontSize:'10px', color:'#4a6a8a', marginTop:'1px' }}>{fmt(s.harga, s.mata_uang)}/unit</div>
                  </div>
                  <button className="vf-btn-red" onClick={() => hapus(s.id)}>Hapus</button>
                </div>
              )
            })
          }
        </div>

      </div>
    </>
  )
}
