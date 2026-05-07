import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const KATEGORI_MASUK = ['Gaji','Freelance','Bisnis','Transfer Masuk','Lainnya']
const KATEGORI_KELUAR = ['Makan','Transport','Belanja','Hutang','Investasi','Transfer Keluar','Lainnya']

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
  .vf-btn-green { background:linear-gradient(135deg,#00c853,#00a844); color:#000; border:none; padding:10px 20px; border-radius:10px; font-size:13px; font-weight:600; cursor:pointer; font-family:'DM Sans',sans-serif; transition:opacity 0.2s; }
  .vf-btn-green:hover { opacity:0.85; }
  .vf-btn-red { background:rgba(255,100,100,0.1); color:#ff6464; border:1px solid rgba(255,100,100,0.2); padding:5px 12px; border-radius:8px; font-size:11px; cursor:pointer; font-family:'DM Sans',sans-serif; transition:background 0.2s; }
  .vf-btn-red:hover { background:rgba(255,100,100,0.2); }
  .vf-wallet-btn { padding:10px 14px; border-radius:12px; cursor:pointer; border:1px solid rgba(255,255,255,0.08); background:rgba(255,255,255,0.03); color:#6a8aaa; text-align:left; transition:all 0.2s; font-family:'DM Sans',sans-serif; }
  .vf-wallet-btn:hover { border-color:rgba(74,158,255,0.3); color:#c8d8f0; }
  .vf-wallet-btn.active { background:rgba(74,158,255,0.12); border-color:rgba(74,158,255,0.4); color:#fff; }
  .vf-label { font-size:11px; color:#4a6a8a; margin-bottom:4px; letter-spacing:0.06em; }
  .vf-grid2 { display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:12px; }
  @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
  .vf-fadein { animation:fadeUp 0.35s ease forwards; }
`

export default function Cashflow() {
  const [rekening, setRekening] = useState([])
  const [transaksi, setTransaksi] = useState([])
  const [selectedWallet, setSelectedWallet] = useState(null)
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ tanggal:'', keterangan:'', tipe:'Pemasukan', jumlah:0, kategori:'Gaji', catatan:'' })
  const [dispJumlah, setDispJumlah] = useState('')

  const loadRekening = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    const { data } = await supabase.from('rekening').select('*').eq('user_id', user.id).order('created_at')
    setRekening(data || [])
    if (data && data.length > 0 && !selectedWallet) setSelectedWallet(data[0].id)
    setLoading(false)
  }

  const loadTransaksi = async (id) => {
    if (!id) return
    const { data } = await supabase.from('transaksi').select('*').eq('rekening_id', id).order('tanggal', { ascending:false })
    setTransaksi(data || [])
  }

  useEffect(() => { loadRekening() }, [])
  useEffect(() => { loadTransaksi(selectedWallet) }, [selectedWallet])

  const fmt = (n) => 'Rp ' + (Number(n)||0).toLocaleString('id-ID')
  const totalMasuk = transaksi.filter(t => t.tipe==='Pemasukan').reduce((s,t) => s+Number(t.jumlah), 0)
  const totalKeluar = transaksi.filter(t => t.tipe==='Pengeluaran').reduce((s,t) => s+Number(t.jumlah), 0)
  const saldoWallet = rekening.find(r => r.id === selectedWallet)
  const netFlow = totalMasuk - totalKeluar

  const handleJumlah = (raw) => {
    const num = Number(raw.replace(/[^0-9]/g,''))||0
    setForm(f => ({...f, jumlah:num}))
    setDispJumlah(num ? num.toLocaleString('id-ID') : '')
  }

  const save = async () => {
    if (!form.keterangan || !form.tanggal || !form.jumlah || !selectedWallet) return
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase.from('transaksi').insert({
      user_id: user.id, rekening_id: selectedWallet,
      tanggal: form.tanggal, keterangan: form.keterangan,
      tipe: form.tipe, jumlah: Number(form.jumlah),
      kategori: form.kategori, catatan: form.catatan
    })
    if (error) { alert('Error: '+error.message); return }
    const selisih = form.tipe==='Pemasukan' ? Number(form.jumlah) : -Number(form.jumlah)
    const wallet = rekening.find(r => r.id === selectedWallet)
    await supabase.from('rekening').update({ saldo: Number(wallet.saldo)+selisih }).eq('id', selectedWallet)
    setForm({ tanggal:'', keterangan:'', tipe:'Pemasukan', jumlah:0, kategori:'Gaji', catatan:'' })
    setDispJumlah('')
    loadTransaksi(selectedWallet)
    loadRekening()
  }

  const hapus = async (id, tipe, jumlah) => {
    await supabase.from('transaksi').delete().eq('id', id)
    const selisih = tipe==='Pemasukan' ? -Number(jumlah) : Number(jumlah)
    const wallet = rekening.find(r => r.id === selectedWallet)
    await supabase.from('rekening').update({ saldo: Number(wallet.saldo)+selisih }).eq('id', selectedWallet)
    loadTransaksi(selectedWallet)
    loadRekening()
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
        <div className="vf-fadein" style={{ marginBottom:'24px' }}>
          <div style={{ fontSize:'11px', color:'#4a6a8a', letterSpacing:'0.08em', marginBottom:'4px' }}>KEUANGAN</div>
          <div style={{ fontFamily:'DM Serif Display,serif', fontSize:'22px', color:'#e8f0fe' }}>Cashflow</div>
        </div>

        {/* WALLET TABS */}
        <div style={{ display:'flex', gap:'8px', flexWrap:'wrap', marginBottom:'20px' }}>
          {rekening.map(r => (
            <button key={r.id} className={`vf-wallet-btn${selectedWallet===r.id?' active':''}`} onClick={() => setSelectedWallet(r.id)}>
              <div style={{ fontSize:'13px', fontWeight:'500', marginBottom:'2px' }}>{r.nama}</div>
              <div style={{ fontSize:'11px', opacity:0.7 }}>Rp {Number(r.saldo).toLocaleString('id-ID')}</div>
            </button>
          ))}
        </div>

        {selectedWallet && saldoWallet && (
          <>
            {/* KPI */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'10px', marginBottom:'16px' }}>
              {[
                { label:'MASUK', value:fmt(totalMasuk), color:'#4cde8a', bg:'rgba(0,200,83,0.08)', border:'rgba(0,200,83,0.2)', icon:'↑' },
                { label:'KELUAR', value:fmt(totalKeluar), color:'#ff6464', bg:'rgba(255,100,100,0.08)', border:'rgba(255,100,100,0.2)', icon:'↓' },
                { label:'SALDO', value:fmt(saldoWallet.saldo), color:'#4a9eff', bg:'rgba(74,158,255,0.08)', border:'rgba(74,158,255,0.2)', icon:'=' },
              ].map((k,i) => (
                <div key={i} style={{ background:k.bg, border:`1px solid ${k.border}`, borderRadius:'16px', padding:'14px' }}>
                  <div style={{ fontSize:'10px', color:'#4a6a8a', letterSpacing:'0.08em', marginBottom:'6px' }}>{k.label}</div>
                  <div style={{ fontSize:'14px', fontWeight:'600', color:k.color }}>{k.value}</div>
                </div>
              ))}
            </div>

            {/* NET FLOW */}
            <div style={{ background: netFlow>=0?'rgba(0,200,83,0.05)':'rgba(255,100,100,0.05)', border:`1px solid ${netFlow>=0?'rgba(0,200,83,0.15)':'rgba(255,100,100,0.15)'}`, borderRadius:'14px', padding:'12px 16px', marginBottom:'16px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div style={{ fontSize:'11px', color:'#4a6a8a' }}>Net Flow — {saldoWallet.nama}</div>
              <div style={{ fontSize:'16px', fontWeight:'700', color:netFlow>=0?'#4cde8a':'#ff6464' }}>
                {netFlow>=0?'+':''}{fmt(netFlow)}
              </div>
            </div>

            {/* FORM */}
            <div className="vf-card">
              <div style={{ fontSize:'12px', fontWeight:'600', color:'#c8d8f0', letterSpacing:'0.04em', marginBottom:'16px' }}>
                ➕ TAMBAH TRANSAKSI — {saldoWallet.nama}
              </div>
              <div className="vf-grid2">
                <div><div className="vf-label">TANGGAL</div><input className="vf-input" type='date' value={form.tanggal} onChange={e=>setForm({...form,tanggal:e.target.value})}/></div>
                <div><div className="vf-label">TIPE</div>
                  <select className="vf-input" value={form.tipe} onChange={e=>setForm({...form,tipe:e.target.value,kategori:e.target.value==='Pemasukan'?'Gaji':'Makan'})}>
                    <option>Pemasukan</option><option>Pengeluaran</option>
                  </select>
                </div>
              </div>
              <div className="vf-grid2">
                <div><div className="vf-label">KETERANGAN</div><input className="vf-input" value={form.keterangan} onChange={e=>setForm({...form,keterangan:e.target.value})} placeholder='Gaji, Makan, Bensin...'/></div>
                <div><div className="vf-label">KATEGORI</div>
                  <select className="vf-input" value={form.kategori} onChange={e=>setForm({...form,kategori:e.target.value})}>
                    {(form.tipe==='Pemasukan'?KATEGORI_MASUK:KATEGORI_KELUAR).map(k=><option key={k}>{k}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ marginBottom:'16px' }}>
                <div className="vf-label">JUMLAH (RP)</div>
                <input className="vf-input" value={dispJumlah} onChange={e=>handleJumlah(e.target.value)} placeholder='0'/>
              </div>
              <button className="vf-btn-green" onClick={save}>Simpan</button>
            </div>

            {/* RIWAYAT */}
            <div className="vf-card">
              <div style={{ fontSize:'12px', fontWeight:'600', color:'#c8d8f0', letterSpacing:'0.04em', marginBottom:'14px' }}>
                RIWAYAT — {saldoWallet.nama}
              </div>
              {transaksi.length === 0
                ? <div style={{ color:'#3a5a7a', fontSize:'12px', padding:'12px 0' }}>Belum ada transaksi di wallet ini</div>
                : transaksi.map(t => (
                  <div key={t.id} className="vf-row">
                    <div style={{ display:'flex', alignItems:'center', gap:'10px', flex:1 }}>
                      <div style={{ width:'8px', height:'8px', borderRadius:'50%', background:t.tipe==='Pemasukan'?'#4cde8a':'#ff6464', flexShrink:0 }} />
                      <div>
                        <div style={{ fontSize:'13px', color:'#c8d8f0', fontWeight:'500' }}>{t.keterangan}</div>
                        <div style={{ fontSize:'10px', color:'#4a6a8a', marginTop:'1px' }}>{t.tanggal} · {t.kategori}</div>
                      </div>
                    </div>
                    <div style={{ fontSize:'13px', fontWeight:'600', color:t.tipe==='Pemasukan'?'#4cde8a':'#ff6464', marginRight:'12px' }}>
                      {t.tipe==='Pemasukan'?'+':'-'}{fmt(t.jumlah)}
                    </div>
                    <button className="vf-btn-red" onClick={() => hapus(t.id, t.tipe, t.jumlah)}>Hapus</button>
                  </div>
                ))
              }
            </div>
          </>
        )}

      </div>
    </>
  )
}
