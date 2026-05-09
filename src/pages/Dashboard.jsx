import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const fmtIDR = (n) => 'Rp ' + (Number(n)||0).toLocaleString('id-ID')
const fmtGram = (n) => (Number(n)||0).toLocaleString('id-ID', { minimumFractionDigits:2, maximumFractionDigits:4 }) + ' gr'
const fmtByCurrency = (n, currency='IDR') => {
  const num = Number(n)||0
  const symbols = { IDR:'Rp ', USD:'$', EUR:'€', SGD:'S$', MYR:'RM ', SAR:'SAR ', JPY:'¥', AUD:'A$', GBP:'£' }
  const sym = symbols[currency] || currency + ' '
  if (['USD','EUR','GBP','AUD'].includes(currency)) return sym + num.toLocaleString('en-US', { minimumFractionDigits:2, maximumFractionDigits:2 })
  return sym + num.toLocaleString('id-ID')
}

export default function Dashboard() {
  const [user, setUser] = useState(null)
  const [hutang, setHutang] = useState([])
  const [rekening, setRekening] = useState([])
  const [crypto, setCrypto] = useState([])
  const [emas, setEmas] = useState([])
  const [hargaLive, setHargaLive] = useState({})
  const [hargaEmas, setHargaEmas] = useState(2633000)
  const [loading, setLoading] = useState(true)

  const TICKER_TO_ID = {
    BTC:'bitcoin', ETH:'ethereum', BNB:'binancecoin', SOL:'solana',
    ADA:'cardano', XRP:'ripple', DOGE:'dogecoin', MATIC:'matic-network',
    '1INCH':'1inch', PEPE:'pepe', EQTY:null,
  }

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      const [{ data: h }, { data: r }, { data: c }, { data: e }] = await Promise.all([
        supabase.from('hutang').select('*'),
        supabase.from('rekening').select('*').eq('user_id', user.id),
        supabase.from('crypto').select('*'),
        supabase.from('emas').select('*').eq('user_id', user.id),
      ])
      setHutang(h || [])
      setRekening(r || [])
      setCrypto(c || [])
      setEmas(e || [])
      if (c && c.length > 0) fetchHargaCrypto(c)
      fetchHargaEmas()
      setLoading(false)
    }
    init()
  }, [])

  const fetchHargaCrypto = async (coinList) => {
    try {
      const ids = [...new Set(
        coinList
          .map(c => TICKER_TO_ID[c.ticker.toUpperCase()])
          .filter(Boolean)
      )].join(',')
      if (!ids) return
      const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=idr`)
      const data = await res.json()
      setHargaLive(data)
    } catch(e) {}
  }

  const fetchHargaEmas = async () => {
    try {
      const res = await fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=gold&vs_currencies=idr'
      )
      const data = await res.json()
      if (data?.gold?.idr) {
        // 1 troy oz = 31.1035 gram
        const perGram = Math.round(data.gold.idr / 31.1035)
        setHargaEmas(perGram)
      }
    } catch {}
  }

  const totalHutang = hutang.reduce((s, h) => s + Number(h.sisa), 0)
  const totalCashIDR = rekening
    .filter(r => (r.mata_uang || 'IDR') === 'IDR')
    .reduce((s, r) => s + Number(r.saldo), 0)

  const perTicker = crypto.reduce((acc, c) => {
    const t = c.ticker.toUpperCase()
    if (!acc[t]) acc[t] = { ticker:t, jumlah:0, totalBeliIDR:0 }
    acc[t].jumlah += Number(c.jumlah)
    acc[t].totalBeliIDR += Number(c.jumlah) * Number(c.harga_beli_idr)
    return acc
  }, {})

  const totalCryptoIDR = Object.values(perTicker).reduce((s, t) => {
    const id = TICKER_TO_ID[t.ticker]
    const liveIDR = id && hargaLive[id]?.idr ? hargaLive[id].idr * t.jumlah : t.totalBeliIDR
    return s + liveIDR
  }, 0)

  const totalEmasGram = emas.reduce((s, e) => s + Number(e.berat_gram || 0), 0)
  const totalEmasModal = emas.reduce((s, e) => s + Number(e.berat_gram || 0) * Number(e.harga_beli_per_gram || 0), 0)
  const totalEmasSekarang = totalEmasGram * hargaEmas
  const untungRugiEmas = totalEmasSekarang - totalEmasModal

  const totalAset = totalCashIDR + totalCryptoIDR + totalEmasSekarang
  const netWorth = totalAset - totalHutang
  const isPositive = netWorth >= 0

  const nama = user?.user_metadata?.full_name?.split(' ')[0] || 'Angga'
  const jam = new Date().getHours()
  const sapa = jam < 11 ? 'Selamat pagi' : jam < 15 ? 'Selamat siang' : jam < 18 ? 'Selamat sore' : 'Selamat malam'

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@300;400;500;600&display=swap');
    .vf-root { font-family: 'DM Sans', sans-serif; }
    .vf-card {
      background: rgba(255,255,255,0.03);
      border: 1px solid rgba(255,255,255,0.07);
      border-radius: 20px;
      padding: 20px;
      margin-bottom: 14px;
      backdrop-filter: blur(10px);
      transition: border-color 0.2s, transform 0.2s;
    }
    .vf-card:hover { border-color: rgba(255,255,255,0.13); }
    .vf-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 0;
      border-bottom: 1px solid rgba(255,255,255,0.05);
      transition: background 0.15s;
    }
    .vf-row:last-child { border-bottom: none; }
    .vf-row:hover { background: rgba(255,255,255,0.02); border-radius: 8px; padding-left: 6px; padding-right: 6px; }
    .vf-kpi {
      border-radius: 16px;
      padding: 16px;
      position: relative;
      overflow: hidden;
      transition: transform 0.2s;
    }
    .vf-kpi:hover { transform: translateY(-2px); }
    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(16px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .vf-fadein { animation: fadeUp 0.4s ease forwards; }
    .vf-fadein-1 { animation-delay: 0.05s; opacity: 0; }
    .vf-fadein-2 { animation-delay: 0.1s; opacity: 0; }
    .vf-fadein-3 { animation-delay: 0.15s; opacity: 0; }
    .vf-fadein-4 { animation-delay: 0.2s; opacity: 0; }
    .vf-fadein-5 { animation-delay: 0.25s; opacity: 0; }
    .vf-fadein-6 { animation-delay: 0.3s; opacity: 0; }
    .vf-fadein-7 { animation-delay: 0.35s; opacity: 0; }
  `

  if (loading) return (
    <div style={{ display:'flex', height:'100vh', background:'#080c14', alignItems:'center', justifyContent:'center' }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ fontSize:'28px', marginBottom:'8px' }}>💎</div>
        <div style={{ color:'#4a9eff', fontSize:'13px', fontFamily:'DM Sans, sans-serif', letterSpacing:'0.1em' }}>MEMUAT...</div>
      </div>
    </div>
  )

  return (
    <>
      <style>{css}</style>
      <div className="vf-root" style={{ padding:'24px 20px', background:'#080c14', minHeight:'100vh', color:'#fff' }}>

        {/* HEADER */}
        <div className="vf-fadein vf-fadein-1" style={{ marginBottom:'24px' }}>
          <div style={{ fontSize:'12px', color:'#4a6a8a', letterSpacing:'0.08em', marginBottom:'4px' }}>
            {sapa} 👋
          </div>
          <div style={{ fontFamily:'DM Serif Display, serif', fontSize:'24px', color:'#e8f0fe', letterSpacing:'-0.01em' }}>
            {nama}
          </div>
        </div>

        {/* NET WORTH */}
        <div className="vf-fadein vf-fadein-2" style={{
          background: isPositive
            ? 'linear-gradient(135deg, #0a2a1a 0%, #0d1f2d 100%)'
            : 'linear-gradient(135deg, #2a0a0a 0%, #1a0d0d 100%)',
          border: `1px solid ${isPositive ? 'rgba(0,200,83,0.2)' : 'rgba(239,83,80,0.2)'}`,
          borderRadius: '24px',
          padding: '24px',
          marginBottom: '16px',
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', top: '-40px', right: '-40px',
            width: '160px', height: '160px', borderRadius: '50%',
            background: isPositive ? 'rgba(0,200,83,0.06)' : 'rgba(239,83,80,0.06)',
          }} />
          <div style={{ fontSize:'11px', color:'#4a6a8a', letterSpacing:'0.1em', marginBottom:'8px' }}>NET WORTH</div>
          <div style={{
            fontFamily: 'DM Serif Display, serif',
            fontSize: '36px',
            color: isPositive ? '#4cde8a' : '#ff6b6b',
            letterSpacing: '-0.02em',
            marginBottom: '8px',
            lineHeight: 1,
          }}>
            {isPositive ? '' : '−'}{fmtIDR(Math.abs(netWorth))}
          </div>
          <div style={{ fontSize:'11px', color:'#3a5a7a', marginTop:'6px' }}>
            Aset <span style={{ color:'#4a8aaa' }}>{fmtIDR(totalAset)}</span>
            {' '}·{' '}
            Hutang <span style={{ color:'#aa4a4a' }}>{fmtIDR(totalHutang)}</span>
          </div>
        </div>

        {/* KPI GRID */}
        <div className="vf-fadein vf-fadein-3" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px', marginBottom:'16px' }}>
          {[
            { label:'Rekening', value: fmtIDR(totalCashIDR), icon:'💳', bg:'#0a1628', border:'rgba(74,158,255,0.2)', color:'#4a9eff' },
            { label:'Crypto', value: fmtIDR(totalCryptoIDR), icon:'🪙', bg:'#180a28', border:'rgba(180,100,255,0.2)', color:'#b464ff' },
            { label:'Emas', value: fmtIDR(totalEmasSekarang), sub: `${untungRugiEmas >= 0 ? '▲' : '▼'} ${fmtIDR(Math.abs(untungRugiEmas))}`, subColor: untungRugiEmas >= 0 ? '#4cde8a' : '#ff6b6b', icon:'🥇', bg:'#1a1500', border:'rgba(245,200,66,0.2)', color:'#f5c842' },
            { label:'Hutang', value: fmtIDR(totalHutang), icon:'📉', bg:'#1a0808', border:'rgba(255,100,100,0.2)', color:'#ff6464' },
          ].map((k, i) => (
            <div key={i} className="vf-kpi" style={{ background: k.bg, border:`1px solid ${k.border}` }}>
              <div style={{ fontSize:'18px', marginBottom:'8px' }}>{k.icon}</div>
              <div style={{ fontSize:'10px', color:'#4a6a8a', letterSpacing:'0.08em', marginBottom:'4px' }}>{k.label.toUpperCase()}</div>
              <div style={{ fontSize:'15px', fontWeight:'600', color: k.color }}>{k.value}</div>
              {k.sub && <div style={{ fontSize:'10px', color: k.subColor, marginTop:'2px' }}>{k.sub}</div>}
            </div>
          ))}
        </div>

        {/* REKENING */}
        <div className="vf-card vf-fadein vf-fadein-4">
          <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'14px' }}>
            <span style={{ fontSize:'16px' }}>💳</span>
            <span style={{ fontSize:'13px', fontWeight:'600', color:'#c8d8f0', letterSpacing:'0.02em' }}>Rekening & Cash</span>
          </div>
          {rekening.length === 0
            ? <div style={{ fontSize:'12px', color:'#3a5a7a' }}>Belum ada data</div>
            : rekening.map(r => (
              <div key={r.id} className="vf-row">
                <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                  <div style={{ width:'6px', height:'6px', borderRadius:'50%', background:'#4a9eff', flexShrink:0 }} />
                  <div>
                    <div style={{ fontSize:'13px', color:'#c8d8f0', fontWeight:'500' }}>{r.nama}</div>
                    <div style={{ fontSize:'10px', color:'#3a5a7a', marginTop:'1px' }}>{r.tipe}</div>
                  </div>
                  {r.mata_uang && r.mata_uang !== 'IDR' && (
                    <span style={{ fontSize:'10px', padding:'2px 6px', borderRadius:'20px', background:'rgba(255,183,77,0.1)', color:'#ffb74d', border:'1px solid rgba(255,183,77,0.2)' }}>
                      {r.mata_uang}
                    </span>
                  )}
                </div>
                <div style={{ fontSize:'13px', fontWeight:'600', color:'#4a9eff' }}>
                  {fmtByCurrency(r.saldo, r.mata_uang || 'IDR')}
                </div>
              </div>
            ))
          }
        </div>

        {/* HUTANG */}
        <div className="vf-card vf-fadein vf-fadein-5">
          <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'14px' }}>
            <span style={{ fontSize:'16px' }}>📉</span>
            <span style={{ fontSize:'13px', fontWeight:'600', color:'#c8d8f0', letterSpacing:'0.02em' }}>Hutang Aktif</span>
          </div>
          {hutang.filter(h => h.status !== 'lunas').length === 0
            ? <div style={{ fontSize:'12px', color:'#4cde8a' }}>Tidak ada hutang aktif 🎉</div>
            : hutang.filter(h => h.status !== 'lunas').map(h => (
              <div key={h.id} className="vf-row">
                <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                  <div style={{ width:'6px', height:'6px', borderRadius:'50%', background:'#ff6464', flexShrink:0 }} />
                  <div>
                    <div style={{ fontSize:'13px', color:'#c8d8f0', fontWeight:'500' }}>{h.nama}</div>
                    <div style={{ fontSize:'10px', color:'#3a5a7a', marginTop:'1px' }}>{h.tipe}</div>
                  </div>
                </div>
                <div style={{ fontSize:'13px', fontWeight:'600', color:'#ff6464' }}>{fmtIDR(h.sisa)}</div>
              </div>
            ))
          }
        </div>

        {/* EMAS */}
        <div className="vf-card vf-fadein vf-fadein-6" style={{ border:'1px solid rgba(245,200,66,0.12)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'14px' }}>
            <span style={{ fontSize:'16px' }}>💰</span>
            <span style={{ fontSize:'13px', fontWeight:'600', color:'#c8d8f0', letterSpacing:'0.02em' }}>Emas</span>
          </div>
          {emas.length === 0
            ? <div style={{ fontSize:'12px', color:'#3a5a7a' }}>Belum ada data emas</div>
            : <>
              {[
                { label:'Total Kepemilikan', value: fmtGram(totalEmasGram), color:'#f5c842' },
                { label:'Modal', value: fmtIDR(totalEmasModal), color:'#4a6a8a' },
                { label:'Nilai Sekarang', value: fmtIDR(totalEmasSekarang), color:'#f5c842' },
                { label:'Untung / Rugi', value: `${untungRugiEmas >= 0 ? '▲' : '▼'} ${fmtIDR(Math.abs(untungRugiEmas))}`, color: untungRugiEmas >= 0 ? '#4cde8a' : '#ff6b6b' },
              ].map((item, i) => (
                <div key={i} className="vf-row">
                  <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                    <div style={{ width:'6px', height:'6px', borderRadius:'50%', background:'#f5c842', flexShrink:0, opacity: i === 0 ? 1 : 0.3 }} />
                    <div style={{ fontSize:'13px', color:'#6a8aaa' }}>{item.label}</div>
                  </div>
                  <div style={{ fontSize:'13px', fontWeight:'600', color: item.color }}>{item.value}</div>
                </div>
              ))}
            </>
          }
        </div>

        {/* CRYPTO */}
        <div className="vf-card vf-fadein vf-fadein-7" style={{ border:'1px solid rgba(180,100,255,0.12)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'14px' }}>
            <span style={{ fontSize:'16px' }}>🪙</span>
            <span style={{ fontSize:'13px', fontWeight:'600', color:'#c8d8f0', letterSpacing:'0.02em' }}>Crypto</span>
          </div>
          {Object.values(perTicker).length === 0
            ? <div style={{ fontSize:'12px', color:'#3a5a7a' }}>Belum ada data</div>
            : Object.values(perTicker).map(t => {
              const id = TICKER_TO_ID[t.ticker]
              const liveIDR = id && hargaLive[id]?.idr ? hargaLive[id].idr * t.jumlah : null
              return (
                <div key={t.ticker} className="vf-row">
                  <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                    <div style={{ width:'6px', height:'6px', borderRadius:'50%', background:'#b464ff', flexShrink:0 }} />
                    <div>
                      <div style={{ fontSize:'13px', color:'#c8d8f0', fontWeight:'600' }}>{t.ticker}</div>
                      <div style={{ fontSize:'10px', color:'#3a5a7a', marginTop:'1px' }}>
                        {t.jumlah % 1 === 0 ? t.jumlah.toLocaleString('id-ID') : t.jumlah.toFixed(4)} unit
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign:'right' }}>
                    <div style={{ fontSize:'13px', fontWeight:'600', color:'#b464ff' }}>
                      {liveIDR ? fmtIDR(liveIDR) : fmtIDR(t.totalBeliIDR)}
                    </div>
                    <div style={{ fontSize:'9px', color:'#3a5a7a', marginTop:'1px' }}>
                      {liveIDR ? '● live' : 'harga beli'}
                    </div>
                  </div>
                </div>
              )
            })
          }
        </div>

      </div>
    </>
  )
}