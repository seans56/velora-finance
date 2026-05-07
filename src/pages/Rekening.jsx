import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const fmtNum = (raw) => raw.replace(/[^0-9]/g,'')
const fmt = (n, currency='IDR') => {
  const num = Number(n)||0
  const symbols = { IDR:'Rp ', USD:'$', EUR:'€', SGD:'S$', MYR:'RM ', SAR:'SAR ', JPY:'¥', AUD:'A$', GBP:'£' }
  const sym = symbols[currency] || currency + ' '
  if (['USD','EUR','GBP','AUD'].includes(currency)) return sym + num.toLocaleString('en-US', {minimumFractionDigits:2,maximumFractionDigits:2})
  return sym + num.toLocaleString('id-ID')
}

const TIPE = ['Bank','E-wallet','Cash','Investasi','Lainnya']
const CURRENCIES = ['IDR','USD','EUR','SGD','MYR','SAR','JPY','AUD','GBP']
const KATEGORI_MASUK = ['Gaji','Freelance','Bisnis','Makalah','Transfer Masuk','Lainnya']
const KATEGORI_KELUAR = ['Makan','Transport','Belanja','Hutang','Investasi','Transfer Keluar','Lainnya']

const TIPE_ICON = { Bank:'🏦', 'E-wallet':'📱', Cash:'💵', Investasi:'📈', Lainnya:'💼' }

const css = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@300;400;500;600&display=swap');
  .vf-root { font-family: 'DM Sans', sans-serif; }
  .vf-card {
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 20px;
    padding: 18px;
    margin-bottom: 14px;
    transition: border-color 0.2s;
  }
  .vf-card:hover { border-color: rgba(255,255,255,0.12); }
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
  .vf-btn-green { background: linear-gradient(135deg,#00c853,#00a844); color:#000; border:none; padding:10px 20px; border-radius:10px; font-size:13px; font-weight:600; cursor:pointer; font-family:'DM Sans',sans-serif; transition: opacity 0.2s; }
  .vf-btn-green:hover { opacity: 0.85; }
  .vf-btn-blue { background: rgba(74,158,255,0.15); color:#4a9eff; border:1px solid rgba(74,158,255,0.3); padding:9px 16px; border-radius:10px; font-size:12px; font-weight:500; cursor:pointer; font-family:'DM Sans',sans-serif; transition: background 0.2s; }
  .vf-btn-blue:hover { background: rgba(74,158,255,0.25); }
  .vf-btn-red { background: rgba(255,100,100,0.1); color:#ff6464; border:1px solid rgba(255,100,100,0.2); padding:5px 12px; border-radius:8px; font-size:11px; cursor:pointer; font-family:'DM Sans',sans-serif; transition: background 0.2s; }
  .vf-btn-red:hover { background: rgba(255,100,100,0.2); }
  .vf-wallet-btn {
    padding: 10px 14px;
    border-radius: 12px;
    cursor: pointer;
    border: 1px solid rgba(255,255,255,0.08);
    background: rgba(255,255,255,0.03);
    color: #6a8aaa;
    text-align: left;
    transition: all 0.2s;
    font-family: 'DM Sans', sans-serif;
  }
  .vf-wallet-btn:hover { border-color: rgba(74,158,255,0.3); color: #c8d8f0; }
  .vf-wallet-btn.active { background: rgba(74,158,255,0.12); border-color: rgba(74,158,255,0.4); color: #fff; }
  .vf-modal { position:fixed; top:0; left:0; right:0; bottom:0; background:rgba(0,0,0,0.75); display:flex; align-items:center; justify-content:center; z-index:100; backdrop-filter:blur(4px); }
  .vf-modal-box { background:#0d1828; border:1px solid rgba(255,255,255,0.1); border-radius:20px; padding:24px; width:440px; max-width:92vw; }
  .vf-label { font-size:11px; color:#4a6a8a; margin-bottom:4px; letter-spacing:0.06em; }
  .vf-grid2 { display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:12px; }
  @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
  .vf-fadein { animation: fadeUp 0.35s ease forwards; }
`

const rekeningAwal = [
  { nama:'BCA', tipe:'Bank', saldo:265676, mata_uang:'IDR' },
  { nama:'SeaBank', tipe:'Bank', saldo:418, mata_uang:'IDR' },
  { nama:'GoPay', tipe:'E-wallet', saldo:51530, mata_uang:'IDR' },
  { nama:'Dana', tipe:'E-wallet', saldo:2694, mata_uang:'IDR' },
  { nama:'ShopeePay', tipe:'E-wallet', saldo:960, mata_uang:'IDR' },
  { nama:'Cash IDR', tipe:'Cash', saldo:131000, mata_uang:'IDR' },
  { nama:'Cash Ringgit', tipe:'Cash', saldo:20, mata_uang:'MYR' },
]

export default function Rekening() {
  const [rekening, setRekening] = useState([])
  const [transaksi, setTransaksi] = useState([])
  const [selectedWallet, setSelectedWallet] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showTambahWallet, setShowTambahWallet] = useState(false)
  const [showTambahTx, setShowTambahTx] = useState(false)
  const [showEditWallet, setShowEditWallet] = useState(false)
  const [walletForm, setWalletForm] = useState({ nama:'', tipe:'Bank', saldo:0, mata_uang:'IDR' })
  const [dispWalletSaldo, setDispWalletSaldo] = useState('')
  const [editWalletForm, setEditWalletForm] = useState(null)
  const [dispEditSaldo, setDispEditSaldo] = useState('')
  const [txForm, setTxForm] = useState({ tanggal:'', keterangan:'', tipe:'Pemasukan', jumlah:0, kategori:'Gaji', catatan:'' })
  const [dispTx, setDispTx] = useState('')

  const loadRekening = async (keepSelected=null) => {
    const { data: { user } } = await supabase.auth.getUser()
    const { data } = await supabase.from('rekening').select('*').eq('user_id', user.id).order('created_at')
    setRekening(data || [])
    if (keepSelected) setSelectedWallet(keepSelected)
    else if (data && data.length > 0 && !selectedWallet) setSelectedWallet(data[0].id)
    setLoading(false)
  }

  const loadTransaksi = async (id) => {
    if (!id) return
    const { data } = await supabase.from('transaksi').select('*').eq('rekening_id', id).order('tanggal', { ascending:false })
    setTransaksi(data || [])
  }

  useEffect(() => { loadRekening() }, [])
  useEffect(() => { loadTransaksi(selectedWallet) }, [selectedWallet])

  const wallet = rekening.find(r => r.id === selectedWallet)
  const totalMasuk = transaksi.filter(t => t.tipe==='Pemasukan').reduce((s,t) => s+Number(t.jumlah), 0)
  const totalKeluar = transaksi.filter(t => t.tipe==='Pengeluaran').reduce((s,t) => s+Number(t.jumlah), 0)
  const totalIDR = rekening.filter(r => (r.mata_uang||'IDR')==='IDR').reduce((s,r) => s+Number(r.saldo), 0)

  const importData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    for (const r of rekeningAwal) await supabase.from('rekening').insert({ ...r, user_id: user.id })
    loadRekening()
  }

  const tambahWallet = async () => {
    if (!walletForm.nama) return
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase.from('rekening').insert({ ...walletForm, saldo: Number(walletForm.saldo)||0, user_id: user.id })
    if (error) { alert('Error: '+error.message); return }
    setWalletForm({ nama:'', tipe:'Bank', saldo:0, mata_uang:'IDR' })
    setDispWalletSaldo('')
    setShowTambahWallet(false)
    loadRekening()
  }

  const editWallet = async () => {
    if (!editWalletForm) return
    await supabase.from('rekening').update({ nama:editWalletForm.nama, tipe:editWalletForm.tipe, saldo:Number(editWalletForm.saldo)||0, mata_uang:editWalletForm.mata_uang||'IDR' }).eq('id', editWalletForm.id)
    setShowEditWallet(false)
    const savedId = editWalletForm.id
    setEditWalletForm(null)
    loadRekening(savedId)
  }

  const hapusWallet = async (id) => {
    if (!window.confirm('Hapus wallet ini? Semua transaksi juga akan terhapus.')) return
    await supabase.from('transaksi').delete().eq('rekening_id', id)
    await supabase.from('rekening').delete().eq('id', id)
    setSelectedWallet(null)
    loadRekening()
  }

  const tambahTx = async () => {
    if (!txForm.keterangan || !txForm.tanggal || !txForm.jumlah || !selectedWallet) return
    const { data: { user } } = await supabase.auth.getUser()
    const jumlah = Number(txForm.jumlah)
    const { error } = await supabase.from('transaksi').insert({ user_id:user.id, rekening_id:selectedWallet, tanggal:txForm.tanggal, keterangan:txForm.keterangan, tipe:txForm.tipe, jumlah, kategori:txForm.kategori, catatan:txForm.catatan })
    if (error) { alert('Error: '+error.message); return }
    const selisih = txForm.tipe==='Pemasukan' ? jumlah : -jumlah
    await supabase.from('rekening').update({ saldo: Number(wallet.saldo)+selisih }).eq('id', selectedWallet)
    setTxForm({ tanggal:'', keterangan:'', tipe:'Pemasukan', jumlah:0, kategori:'Gaji', catatan:'' })
    setDispTx('')
    setShowTambahTx(false)
    loadTransaksi(selectedWallet)
    loadRekening(selectedWallet)
  }

  const hapusTx = async (id, tipe, jumlah) => {
    await supabase.from('transaksi').delete().eq('id', id)
    const selisih = tipe==='Pemasukan' ? -Number(jumlah) : Number(jumlah)
    await supabase.from('rekening').update({ saldo: Number(wallet.saldo)+selisih }).eq('id', selectedWallet)
    loadTransaksi(selectedWallet)
    loadRekening(selectedWallet)
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
            <div style={{ fontSize:'11px', color:'#4a6a8a', letterSpacing:'0.08em', marginBottom:'4px' }}>KEUANGAN</div>
            <div style={{ fontFamily:'DM Serif Display,serif', fontSize:'22px', color:'#e8f0fe' }}>Rekening & Cash</div>
          </div>
          <div style={{ display:'flex', gap:'8px' }}>
            {rekening.length === 0 && (
              <button className="vf-btn-blue" onClick={importData}>Import Data</button>
            )}
            <button className="vf-btn-green" onClick={() => setShowTambahWallet(true)}>+ Wallet</button>
          </div>
        </div>

        {/* KPI */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px', marginBottom:'20px' }}>
          <div style={{ background:'linear-gradient(135deg,#0a1628,#0d1f2d)', border:'1px solid rgba(74,158,255,0.2)', borderRadius:'16px', padding:'16px' }}>
            <div style={{ fontSize:'10px', color:'#4a6a8a', letterSpacing:'0.08em', marginBottom:'6px' }}>TOTAL WALLET</div>
            <div style={{ fontFamily:'DM Serif Display,serif', fontSize:'20px', color:'#4a9eff' }}>{fmt(totalIDR,'IDR')}</div>
          </div>
          <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:'16px', padding:'16px' }}>
            <div style={{ fontSize:'10px', color:'#4a6a8a', letterSpacing:'0.08em', marginBottom:'6px' }}>JUMLAH WALLET</div>
            <div style={{ fontFamily:'DM Serif Display,serif', fontSize:'20px', color:'#c8d8f0' }}>{rekening.length}</div>
          </div>
        </div>

        {/* WALLET TABS */}
        <div style={{ display:'flex', gap:'8px', flexWrap:'wrap', marginBottom:'20px' }}>
          {rekening.map(r => (
            <button key={r.id} className={`vf-wallet-btn${selectedWallet===r.id?' active':''}`} onClick={() => setSelectedWallet(r.id)}>
              <div style={{ fontSize:'13px', fontWeight:'500', marginBottom:'2px' }}>
                {TIPE_ICON[r.tipe] || '💼'} {r.nama}
              </div>
              <div style={{ fontSize:'11px', opacity:0.7 }}>
                {fmt(r.saldo, r.mata_uang||'IDR')}
                {r.mata_uang && r.mata_uang!=='IDR' && <span style={{ color:'#ffb74d', marginLeft:'4px' }}>{r.mata_uang}</span>}
              </div>
            </button>
          ))}
        </div>

        {/* DETAIL WALLET */}
        {selectedWallet && wallet && (
          <>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'12px' }}>
              <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                <span style={{ fontSize:'20px' }}>{TIPE_ICON[wallet.tipe]||'💼'}</span>
                <div>
                  <div style={{ fontSize:'15px', fontWeight:'600', color:'#e8f0fe' }}>{wallet.nama}</div>
                  <div style={{ fontSize:'10px', color:'#4a6a8a' }}>{wallet.tipe} · {wallet.mata_uang||'IDR'}</div>
                </div>
              </div>
              <div style={{ display:'flex', gap:'8px' }}>
                <button className="vf-btn-blue" onClick={() => { setEditWalletForm({...wallet,mata_uang:wallet.mata_uang||'IDR'}); setDispEditSaldo(Number(wallet.saldo).toLocaleString('id-ID')); setShowEditWallet(true) }}>Edit</button>
                <button className="vf-btn-red" onClick={() => hapusWallet(wallet.id)}>Hapus</button>
                <button className="vf-btn-green" onClick={() => setShowTambahTx(true)}>+ Transaksi</button>
              </div>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'10px', marginBottom:'16px' }}>
              {[
                { label:'MASUK', value: fmt(totalMasuk, wallet.mata_uang||'IDR'), color:'#4cde8a', bg:'rgba(0,200,83,0.08)', border:'rgba(0,200,83,0.2)' },
                { label:'KELUAR', value: fmt(totalKeluar, wallet.mata_uang||'IDR'), color:'#ff6464', bg:'rgba(255,100,100,0.08)', border:'rgba(255,100,100,0.2)' },
                { label:'SALDO', value: fmt(wallet.saldo, wallet.mata_uang||'IDR'), color:'#4a9eff', bg:'rgba(74,158,255,0.08)', border:'rgba(74,158,255,0.2)' },
              ].map((k,i) => (
                <div key={i} style={{ background:k.bg, border:`1px solid ${k.border}`, borderRadius:'14px', padding:'12px' }}>
                  <div style={{ fontSize:'10px', color:'#4a6a8a', letterSpacing:'0.08em', marginBottom:'4px' }}>{k.label}</div>
                  <div style={{ fontSize:'14px', fontWeight:'600', color:k.color }}>{k.value}</div>
                </div>
              ))}
            </div>

            <div className="vf-card">
              <div style={{ fontSize:'12px', fontWeight:'600', color:'#c8d8f0', letterSpacing:'0.04em', marginBottom:'12px' }}>
                RIWAYAT — {wallet.nama}
              </div>
              {transaksi.length === 0
                ? <div style={{ fontSize:'12px', color:'#3a5a7a', padding:'12px 0' }}>Belum ada transaksi</div>
                : transaksi.map(t => (
                  <div key={t.id} className="vf-row">
                    <div style={{ display:'flex', alignItems:'center', gap:'10px', flex:1 }}>
                      <div style={{ width:'8px', height:'8px', borderRadius:'50%', background: t.tipe==='Pemasukan'?'#4cde8a':'#ff6464', flexShrink:0 }} />
                      <div>
                        <div style={{ fontSize:'13px', color:'#c8d8f0', fontWeight:'500' }}>{t.keterangan}</div>
                        <div style={{ fontSize:'10px', color:'#3a5a7a', marginTop:'1px' }}>{t.tanggal} · {t.kategori}</div>
                      </div>
                    </div>
                    <div style={{ fontSize:'13px', fontWeight:'600', color:t.tipe==='Pemasukan'?'#4cde8a':'#ff6464', marginRight:'12px' }}>
                      {t.tipe==='Pemasukan'?'+':'-'}{fmt(t.jumlah, wallet.mata_uang||'IDR')}
                    </div>
                    <button className="vf-btn-red" onClick={() => hapusTx(t.id, t.tipe, t.jumlah)}>Hapus</button>
                  </div>
                ))
              }
            </div>
          </>
        )}

        {/* MODAL TAMBAH WALLET */}
        {showTambahWallet && (
          <div className="vf-modal" onClick={() => setShowTambahWallet(false)}>
            <div className="vf-modal-box" onClick={e => e.stopPropagation()}>
              <div style={{ fontFamily:'DM Serif Display,serif', fontSize:'18px', color:'#e8f0fe', marginBottom:'20px' }}>Wallet Baru</div>
              <div className="vf-grid2">
                <div><div className="vf-label">NAMA WALLET</div><input className="vf-input" value={walletForm.nama} onChange={e=>setWalletForm({...walletForm,nama:e.target.value})} placeholder='BCA, GoPay...'/></div>
                <div><div className="vf-label">TIPE</div><select className="vf-input" value={walletForm.tipe} onChange={e=>setWalletForm({...walletForm,tipe:e.target.value})}>{TIPE.map(t=><option key={t}>{t}</option>)}</select></div>
              </div>
              <div className="vf-grid2">
                <div><div className="vf-label">MATA UANG</div><select className="vf-input" value={walletForm.mata_uang} onChange={e=>setWalletForm({...walletForm,mata_uang:e.target.value})}>{CURRENCIES.map(c=><option key={c}>{c}</option>)}</select></div>
                <div><div className="vf-label">SALDO AWAL</div><input className="vf-input" value={dispWalletSaldo} onChange={e=>{const n=Number(fmtNum(e.target.value))||0;setWalletForm(f=>({...f,saldo:n}));setDispWalletSaldo(n?n.toLocaleString('id-ID'):'')}}/></div>
              </div>
              <div style={{ display:'flex', gap:'8px', marginTop:'4px' }}>
                <button className="vf-btn-green" onClick={tambahWallet}>Simpan</button>
                <button className="vf-btn-red" style={{ padding:'10px 16px' }} onClick={() => setShowTambahWallet(false)}>Batal</button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL EDIT WALLET */}
        {showEditWallet && editWalletForm && (
          <div className="vf-modal" onClick={() => setShowEditWallet(false)}>
            <div className="vf-modal-box" onClick={e => e.stopPropagation()}>
              <div style={{ fontFamily:'DM Serif Display,serif', fontSize:'18px', color:'#e8f0fe', marginBottom:'20px' }}>Edit Wallet</div>
              <div className="vf-grid2">
                <div><div className="vf-label">NAMA</div><input className="vf-input" value={editWalletForm.nama} onChange={e=>setEditWalletForm({...editWalletForm,nama:e.target.value})}/></div>
                <div><div className="vf-label">TIPE</div><select className="vf-input" value={editWalletForm.tipe} onChange={e=>setEditWalletForm({...editWalletForm,tipe:e.target.value})}>{TIPE.map(t=><option key={t}>{t}</option>)}</select></div>
              </div>
              <div className="vf-grid2">
                <div><div className="vf-label">MATA UANG</div><select className="vf-input" value={editWalletForm.mata_uang||'IDR'} onChange={e=>setEditWalletForm({...editWalletForm,mata_uang:e.target.value})}>{CURRENCIES.map(c=><option key={c}>{c}</option>)}</select></div>
                <div><div className="vf-label">SALDO</div><input className="vf-input" value={dispEditSaldo} onChange={e=>{const n=Number(fmtNum(e.target.value))||0;setEditWalletForm(f=>({...f,saldo:n}));setDispEditSaldo(n?n.toLocaleString('id-ID'):'')}}/></div>
              </div>
              <div style={{ display:'flex', gap:'8px', marginTop:'4px' }}>
                <button className="vf-btn-green" onClick={editWallet}>Simpan</button>
                <button className="vf-btn-red" style={{ padding:'10px 16px' }} onClick={() => setShowEditWallet(false)}>Batal</button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL TAMBAH TRANSAKSI */}
        {showTambahTx && (
          <div className="vf-modal" onClick={() => setShowTambahTx(false)}>
            <div className="vf-modal-box" onClick={e => e.stopPropagation()}>
              <div style={{ fontFamily:'DM Serif Display,serif', fontSize:'18px', color:'#e8f0fe', marginBottom:'4px' }}>Tambah Transaksi</div>
              <div style={{ fontSize:'11px', color:'#4a6a8a', marginBottom:'20px' }}>{wallet?.nama} · {wallet?.mata_uang||'IDR'}</div>
              <div className="vf-grid2">
                <div><div className="vf-label">TANGGAL</div><input className="vf-input" type='date' value={txForm.tanggal} onChange={e=>setTxForm({...txForm,tanggal:e.target.value})}/></div>
                <div><div className="vf-label">TIPE</div><select className="vf-input" value={txForm.tipe} onChange={e=>setTxForm({...txForm,tipe:e.target.value,kategori:e.target.value==='Pemasukan'?'Gaji':'Makan'})}><option>Pemasukan</option><option>Pengeluaran</option></select></div>
              </div>
              <div className="vf-grid2">
                <div><div className="vf-label">KETERANGAN</div><input className="vf-input" value={txForm.keterangan} onChange={e=>setTxForm({...txForm,keterangan:e.target.value})} placeholder='Gaji, Makan...'/></div>
                <div><div className="vf-label">KATEGORI</div><select className="vf-input" value={txForm.kategori} onChange={e=>setTxForm({...txForm,kategori:e.target.value})}>{(txForm.tipe==='Pemasukan'?KATEGORI_MASUK:KATEGORI_KELUAR).map(k=><option key={k}>{k}</option>)}</select></div>
              </div>
              <div style={{ marginBottom:'16px' }}>
                <div className="vf-label">JUMLAH ({wallet?.mata_uang||'IDR'})</div>
                <input className="vf-input" value={dispTx} onChange={e=>{const n=Number(fmtNum(e.target.value))||0;setTxForm(f=>({...f,jumlah:n}));setDispTx(n?n.toLocaleString('id-ID'):'')}}/> 
              </div>
              <div style={{ display:'flex', gap:'8px' }}>
                <button className="vf-btn-green" onClick={tambahTx}>Simpan</button>
                <button className="vf-btn-red" style={{ padding:'10px 16px' }} onClick={() => setShowTambahTx(false)}>Batal</button>
              </div>
            </div>
          </div>
        )}

      </div>
    </>
  )
}
