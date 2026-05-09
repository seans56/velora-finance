import { useEffect, useState, useRef } from 'react'
import { supabase } from '../lib/supabase'

const fmtIDR = (n) => 'Rp ' + (Number(n)||0).toLocaleString('id-ID')
const fmtGram = (n) => (Number(n)||0).toLocaleString('id-ID', { minimumFractionDigits:2, maximumFractionDigits:4 }) + ' gr'

const css = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@300;400;500;600&display=swap');
  .vf-root { font-family: 'DM Sans', sans-serif; }
  .vf-card { background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.07); border-radius:20px; padding:18px; margin-bottom:14px; }
  .vf-btn-green { background:linear-gradient(135deg,#00c853,#00a844); color:#000; border:none; padding:12px 24px; border-radius:10px; font-size:14px; font-weight:700; cursor:pointer; font-family:'DM Sans',sans-serif; transition:opacity 0.2s; display:flex; align-items:center; gap:8px; }
  .vf-btn-green:hover { opacity:0.85; }
  .vf-btn-blue { background:rgba(74,158,255,0.12); color:#4a9eff; border:1px solid rgba(74,158,255,0.25); padding:10px 20px; border-radius:10px; font-size:13px; font-weight:500; cursor:pointer; font-family:'DM Sans',sans-serif; }

  /* PDF STYLES */
  @media print {
    body * { visibility: hidden; }
    #pdf-content, #pdf-content * { visibility: visible; }
    #pdf-content { position: absolute; left: 0; top: 0; width: 100%; }
    .no-print { display: none !important; }
  }

  #pdf-content {
    background: #fff;
    color: #1a1a2e;
    font-family: 'DM Sans', sans-serif;
    width: 794px;
    min-height: 1123px;
    margin: 0 auto;
    padding: 48px;
    box-sizing: border-box;
  }

  .pdf-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding-bottom: 24px;
    border-bottom: 3px solid #1565c0;
    margin-bottom: 32px;
  }

  .pdf-brand { font-family: 'DM Serif Display', serif; font-size: 28px; color: #1565c0; }
  .pdf-subtitle { font-size: 12px; color: #666; margin-top: 4px; }
  .pdf-date { text-align: right; font-size: 11px; color: #888; }

  .pdf-section-title {
    font-size: 13px;
    font-weight: 700;
    color: #1565c0;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    margin-bottom: 14px;
    padding-bottom: 6px;
    border-bottom: 1px solid #e0e0e0;
  }

  .pdf-kpi-grid {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr 1fr;
    gap: 12px;
    margin-bottom: 28px;
  }

  .pdf-kpi {
    border-radius: 12px;
    padding: 14px;
    text-align: center;
  }

  .pdf-kpi-label { font-size: 9px; color: #888; letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 6px; }
  .pdf-kpi-value { font-family: 'DM Serif Display', serif; font-size: 15px; font-weight: 600; }

  .pdf-grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px; }

  .pdf-table { width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 24px; }
  .pdf-table th { background: #f5f7ff; color: #1565c0; font-weight: 600; padding: 8px 10px; text-align: left; font-size: 10px; letter-spacing: 0.04em; }
  .pdf-table td { padding: 8px 10px; border-bottom: 1px solid #f0f0f0; color: #333; }
  .pdf-table tr:hover td { background: #fafbff; }

  .pdf-badge { display: inline-block; padding: 2px 8px; border-radius: 20px; font-size: 9px; font-weight: 600; }

  .pdf-footer {
    margin-top: 40px;
    padding-top: 16px;
    border-top: 1px solid #e0e0e0;
    display: flex;
    justify-content: space-between;
    font-size: 10px;
    color: #aaa;
  }

  .pdf-watermark {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%) rotate(-30deg);
    font-size: 80px;
    color: rgba(21, 101, 192, 0.04);
    font-family: 'DM Serif Display', serif;
    white-space: nowrap;
    pointer-events: none;
    font-weight: 700;
  }

  .pdf-page-break { page-break-before: always; }
  .pdf-section { margin-bottom: 28px; position: relative; }
`

// Simple bar chart SVG untuk PDF
function BarChart({ data, colors, title, height = 120 }) {
  if (!data || data.length === 0) return null
  const max = Math.max(...data.map(d => d.value), 1)
  const W = 680
  const H = height
  const PAD = 40
  const barW = Math.max(20, (W - PAD * 2) / data.length - 8)

  return (
    <div style={{ marginBottom: '20px' }}>
      <div style={{ fontSize: '11px', fontWeight: '600', color: '#1565c0', marginBottom: '8px' }}>{title}</div>
      <svg viewBox={`0 0 ${W} ${H + 30}`} style={{ width: '100%', height: 'auto', background: '#f8faff', borderRadius: '8px' }}>
        {[0, 0.25, 0.5, 0.75, 1].map((v, i) => (
          <line key={i} x1={PAD} y1={PAD + (1-v)*H} x2={W-PAD} y2={PAD + (1-v)*H} stroke="#e8ecf8" strokeWidth="1" />
        ))}
        {data.map((d, i) => {
          const x = PAD + i * ((W - PAD*2) / data.length) + 4
          const bh = max > 0 ? (d.value / max) * H : 0
          const y = PAD + H - bh
          const color = colors ? colors[i % colors.length] : '#1565c0'
          return (
            <g key={i}>
              <rect x={x} y={y} width={barW} height={bh} fill={color} opacity="0.85" rx="4" />
              <text x={x + barW/2} y={H + PAD + 14} textAnchor="middle" fill="#888" fontSize="8">
                {d.label}
              </text>
              {bh > 16 && (
                <text x={x + barW/2} y={y - 4} textAnchor="middle" fill={color} fontSize="8" fontWeight="600">
                  {d.valueLabel || ''}
                </text>
              )}
            </g>
          )
        })}
        <text x={PAD - 4} y={PAD + 4} textAnchor="end" fill="#aaa" fontSize="8">
          {(max/1e6).toFixed(1)}M
        </text>
      </svg>
    </div>
  )
}

// Donut chart untuk komposisi aset
function DonutChart({ data, title }) {
  if (!data || data.length === 0) return null
  const total = data.reduce((s, d) => s + d.value, 0)
  if (total === 0) return null

  const cx = 80, cy = 80, r = 60, ir = 35
  let startAngle = -Math.PI / 2

  const slices = data.map(d => {
    const angle = (d.value / total) * 2 * Math.PI
    const x1 = cx + r * Math.cos(startAngle)
    const y1 = cy + r * Math.sin(startAngle)
    const x2 = cx + r * Math.cos(startAngle + angle)
    const y2 = cy + r * Math.sin(startAngle + angle)
    const ix1 = cx + ir * Math.cos(startAngle)
    const iy1 = cy + ir * Math.sin(startAngle)
    const ix2 = cx + ir * Math.cos(startAngle + angle)
    const iy2 = cy + ir * Math.sin(startAngle + angle)
    const largeArc = angle > Math.PI ? 1 : 0
    const path = `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} L ${ix2} ${iy2} A ${ir} ${ir} 0 ${largeArc} 0 ${ix1} ${iy1} Z`
    const result = { ...d, path, startAngle }
    startAngle += angle
    return result
  })

  return (
    <div>
      <div style={{ fontSize: '11px', fontWeight: '600', color: '#1565c0', marginBottom: '8px' }}>{title}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <svg viewBox="0 0 160 160" style={{ width: '120px', height: '120px', flexShrink: 0 }}>
          {slices.map((s, i) => (
            <path key={i} d={s.path} fill={s.color} opacity="0.9" />
          ))}
          <text x={cx} y={cy - 6} textAnchor="middle" fill="#333" fontSize="8" fontWeight="600">Total</text>
          <text x={cx} y={cy + 8} textAnchor="middle" fill="#1565c0" fontSize="7">
            {(total/1e6).toFixed(1)}M
          </text>
        </svg>
        <div style={{ flex: 1 }}>
          {data.map((d, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: d.color, flexShrink: 0 }} />
                <span style={{ fontSize: '10px', color: '#555' }}>{d.label}</span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '10px', fontWeight: '600', color: '#333' }}>{fmtIDR(d.value)}</div>
                <div style={{ fontSize: '9px', color: '#aaa' }}>{((d.value/total)*100).toFixed(1)}%</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function LaporanPDF() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [bulan, setBulan] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`
  })
  const pdfRef = useRef()

  const HARGA_EMAS = 2633000

  const TICKER_TO_ID = {
    BTC:'bitcoin', ETH:'ethereum', BNB:'binancecoin', SOL:'solana',
    ADA:'cardano', XRP:'ripple', DOGE:'dogecoin', MATIC:'matic-network',
    '1INCH':'1inch', PEPE:'pepe',
  }

  useEffect(() => { loadData() }, [bulan])

  const loadData = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    const [{ data: hutang }, { data: rekening }, { data: crypto }, { data: emas }, { data: saham }, { data: transaksi }] = await Promise.all([
      supabase.from('hutang').select('*').order('created_at'),
      supabase.from('rekening').select('*').eq('user_id', user.id),
      supabase.from('crypto').select('*'),
      supabase.from('emas').select('*').eq('user_id', user.id),
      supabase.from('saham').select('*'),
      supabase.from('transaksi').select('*').filter('tanggal', 'gte', bulan + '-01').filter('tanggal', 'lte', bulan + '-31'),
    ])
    setData({ hutang: hutang||[], rekening: rekening||[], crypto: crypto||[], emas: emas||[], saham: saham||[], transaksi: transaksi||[], user })
    setLoading(false)
  }

  const exportPDF = async () => {
    setGenerating(true)
    // Dynamically load html2pdf
    if (!window.html2pdf) {
      const script = document.createElement('script')
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js'
      document.head.appendChild(script)
      await new Promise(resolve => script.onload = resolve)
    }

    const element = pdfRef.current
    const opt = {
      margin: 0,
      filename: `Velora-Finance-Laporan-${bulan}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff' },
      jsPDF: { unit: 'px', format: [794, 1123], orientation: 'portrait' }
    }

    await window.html2pdf().set(opt).from(element).save()
    setGenerating(false)
  }

  if (loading || !data) return (
    <div style={{ display:'flex', height:'100vh', background:'#080c14', alignItems:'center', justifyContent:'center' }}>
      <div style={{ color:'#4a9eff', fontSize:'13px', fontFamily:'DM Sans,sans-serif' }}>Memuat data laporan...</div>
    </div>
  )

  const { hutang, rekening, crypto, emas, saham, transaksi, user } = data

  // Kalkulasi
  const totalHutang = hutang.filter(h => h.status !== 'lunas').reduce((s, h) => s + Number(h.sisa), 0)
  const totalRekening = rekening.reduce((s, r) => s + Number(r.saldo), 0)
  const totalEmasGram = emas.reduce((s, e) => s + Number(e.berat_gram||0), 0)
  const totalEmasModal = emas.reduce((s, e) => s + Number(e.berat_gram||0) * Number(e.harga_beli_per_gram||0), 0)
  const totalEmasSekarang = totalEmasGram * HARGA_EMAS

  const perTicker = crypto.reduce((acc, c) => {
    const t = c.ticker.toUpperCase()
    if (!acc[t]) acc[t] = { ticker:t, jumlah:0, totalBeliIDR:0 }
    acc[t].jumlah += Number(c.jumlah)
    acc[t].totalBeliIDR += Number(c.jumlah) * Number(c.harga_beli_idr)
    return acc
  }, {})
  const totalCrypto = Object.values(perTicker).reduce((s, t) => s + t.totalBeliIDR, 0)

  const totalAset = totalRekening + totalEmasSekarang + totalCrypto
  const netWorth = totalAset - totalHutang

  const totalMasuk = transaksi.filter(t => t.tipe==='Pemasukan').reduce((s,t) => s+Number(t.jumlah), 0)
  const totalKeluar = transaksi.filter(t => t.tipe==='Pengeluaran').reduce((s,t) => s+Number(t.jumlah), 0)

  const now = new Date()
  const bulanLabel = new Date(bulan + '-01').toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
  const tanggalCetak = now.toLocaleDateString('id-ID', { weekday:'long', day:'numeric', month:'long', year:'numeric' })

  const hutangAktif = hutang.filter(h => h.status !== 'lunas')

  // Data untuk grafik
  const asetDonutData = [
    { label: 'Cash & Rekening', value: totalRekening, color: '#1565c0' },
    { label: 'Emas', value: totalEmasSekarang, color: '#f5c842' },
    { label: 'Crypto', value: totalCrypto, color: '#7b1fa2' },
  ].filter(d => d.value > 0)

  const hutangBarData = hutangAktif.map(h => ({
    label: h.nama.length > 8 ? h.nama.slice(0,8)+'...' : h.nama,
    value: Number(h.sisa),
    valueLabel: (Number(h.sisa)/1e6).toFixed(1)+'M'
  }))

  const cashflowBarData = [
    { label: 'Pemasukan', value: totalMasuk, valueLabel: (totalMasuk/1e6).toFixed(1)+'M' },
    { label: 'Pengeluaran', value: totalKeluar, valueLabel: (totalKeluar/1e6).toFixed(1)+'M' },
    { label: 'Selisih', value: Math.abs(totalMasuk - totalKeluar), valueLabel: ((totalMasuk-totalKeluar)/1e6).toFixed(1)+'M' },
  ]

  return (
    <>
      <style>{css}</style>
      <div className="vf-root" style={{ padding:'24px 20px', background:'#080c14', minHeight:'100vh', color:'#fff' }}>

        {/* HEADER APP */}
        <div className="no-print" style={{ marginBottom:'24px' }}>
          <div style={{ fontSize:'11px', color:'#4a6a8a', letterSpacing:'0.08em', marginBottom:'4px' }}>LAPORAN</div>
          <div style={{ fontFamily:'DM Serif Display,serif', fontSize:'22px', color:'#e8f0fe', marginBottom:'16px' }}>Export Laporan PDF</div>

          <div style={{ display:'flex', gap:'12px', alignItems:'center', flexWrap:'wrap' }}>
            <div>
              <div style={{ fontSize:'11px', color:'#4a6a8a', marginBottom:'4px' }}>PERIODE LAPORAN</div>
              <input type='month' value={bulan} onChange={e => setBulan(e.target.value)}
                style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', color:'#fff', borderRadius:'10px', padding:'10px 14px', fontSize:'13px', fontFamily:'DM Sans,sans-serif', outline:'none' }} />
            </div>
            <div style={{ marginTop:'20px' }}>
              <button className="vf-btn-green" onClick={exportPDF} disabled={generating}>
                {generating ? '⏳' : '📄'} {generating ? 'Membuat PDF...' : 'Export PDF'}
              </button>
            </div>
          </div>
        </div>

        {/* PREVIEW */}
        <div className="no-print vf-card" style={{ marginBottom:'16px' }}>
          <div style={{ fontSize:'12px', color:'#4a6a8a', marginBottom:'8px' }}>👁 Preview Laporan</div>
          <div style={{ fontSize:'11px', color:'#3a5a7a' }}>Scroll ke bawah untuk melihat preview laporan sebelum di-export</div>
        </div>

        {/* PDF CONTENT */}
        <div ref={pdfRef} id="pdf-content" style={{ position: 'relative', overflow: 'hidden' }}>
          <div className="pdf-watermark">VELORA FINANCE</div>

          {/* HEADER */}
          <div className="pdf-header">
            <div>
              <div className="pdf-brand">Velora Finance</div>
              <div className="pdf-subtitle">Laporan Keuangan Pribadi · {bulanLabel}</div>
              <div style={{ marginTop: '8px', fontSize: '11px', color: '#888' }}>
                {user?.user_metadata?.full_name || 'Anggara Putra Maliki'}
              </div>
            </div>
            <div className="pdf-date">
              <div style={{ fontSize: '10px', color: '#aaa', marginBottom: '4px' }}>Dicetak pada</div>
              <div style={{ fontSize: '11px', color: '#555', fontWeight: '600' }}>{tanggalCetak}</div>
              <div style={{ marginTop: '8px', background: '#1565c0', color: '#fff', padding: '4px 10px', borderRadius: '6px', fontSize: '10px', textAlign: 'center' }}>
                CONFIDENTIAL
              </div>
            </div>
          </div>

          {/* RINGKASAN EKSEKUTIF */}
          <div className="pdf-section">
            <div className="pdf-section-title">📊 Ringkasan Eksekutif</div>
            <div className="pdf-kpi-grid">
              {[
                { label: 'Net Worth', value: fmtIDR(netWorth), color: netWorth >= 0 ? '#1b5e20' : '#b71c1c', bg: netWorth >= 0 ? '#f1f8f1' : '#fdf1f1' },
                { label: 'Total Aset', value: fmtIDR(totalAset), color: '#0d47a1', bg: '#f0f4ff' },
                { label: 'Total Hutang', value: fmtIDR(totalHutang), color: '#b71c1c', bg: '#fff5f5' },
                { label: 'Cash & Rekening', value: fmtIDR(totalRekening), color: '#1565c0', bg: '#f5f8ff' },
              ].map((k, i) => (
                <div key={i} className="pdf-kpi" style={{ background: k.bg, border: `1px solid ${k.color}22` }}>
                  <div className="pdf-kpi-label">{k.label}</div>
                  <div className="pdf-kpi-value" style={{ color: k.color, fontSize: '12px' }}>{k.value}</div>
                </div>
              ))}
            </div>

            {/* Grafik komposisi aset */}
            <div className="pdf-grid2">
              <DonutChart data={asetDonutData} title="Komposisi Aset" />
              <div>
                <BarChart
                  data={cashflowBarData}
                  colors={['#1565c0', '#c62828', totalMasuk >= totalKeluar ? '#2e7d32' : '#c62828']}
                  title={`Cashflow ${bulanLabel}`}
                  height={100}
                />
              </div>
            </div>
          </div>

          {/* HUTANG */}
          <div className="pdf-section">
            <div className="pdf-section-title">📉 Daftar Hutang Aktif</div>
            {hutangAktif.length === 0 ? (
              <div style={{ fontSize: '11px', color: '#aaa', padding: '12px 0' }}>Tidak ada hutang aktif 🎉</div>
            ) : (
              <>
                <BarChart
                  data={hutangBarData}
                  colors={['#c62828','#e53935','#ef5350','#f44336','#ef9a9a','#ffcdd2','#b71c1c']}
                  title="Perbandingan Sisa Hutang"
                  height={100}
                />
                <table className="pdf-table">
                  <thead>
                    <tr>
                      <th>Nama Hutang</th>
                      <th>Tipe</th>
                      <th>Total Awal</th>
                      <th>Sisa</th>
                      <th>Cicilan/Bln</th>
                      <th>Jatuh Tempo</th>
                      <th>Progress</th>
                    </tr>
                  </thead>
                  <tbody>
                    {hutangAktif.map(h => {
                      const persen = h.total_awal > 0 ? Math.round((1 - Number(h.sisa)/Number(h.total_awal)) * 100) : 0
                      return (
                        <tr key={h.id}>
                          <td style={{ fontWeight: '600', color: '#1a1a2e' }}>{h.nama}</td>
                          <td><span className="pdf-badge" style={{ background: '#e8eeff', color: '#1565c0' }}>{h.tipe}</span></td>
                          <td>{fmtIDR(h.total_awal)}</td>
                          <td style={{ color: '#c62828', fontWeight: '600' }}>{fmtIDR(h.sisa)}</td>
                          <td>{h.cicilan_per_bulan > 0 ? fmtIDR(h.cicilan_per_bulan) : '-'}</td>
                          <td>{h.jatuh_tempo || '-'}</td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <div style={{ flex: 1, background: '#e0e0e0', borderRadius: '4px', height: '4px', overflow: 'hidden' }}>
                                <div style={{ width: `${persen}%`, height: '100%', background: '#1565c0', borderRadius: '4px' }} />
                              </div>
                              <span style={{ fontSize: '9px', color: '#666', minWidth: '28px' }}>{persen}%</span>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </>
            )}
          </div>

          {/* REKENING */}
          <div className="pdf-section">
            <div className="pdf-section-title">💳 Rekening & Cash</div>
            <table className="pdf-table">
              <thead>
                <tr>
                  <th>Nama Rekening</th>
                  <th>Tipe</th>
                  <th>Mata Uang</th>
                  <th style={{ textAlign: 'right' }}>Saldo</th>
                </tr>
              </thead>
              <tbody>
                {rekening.map(r => (
                  <tr key={r.id}>
                    <td style={{ fontWeight: '600', color: '#1a1a2e' }}>{r.nama}</td>
                    <td>{r.tipe}</td>
                    <td><span className="pdf-badge" style={{ background: '#fff8e1', color: '#f57f17' }}>{r.mata_uang||'IDR'}</span></td>
                    <td style={{ textAlign: 'right', color: '#1565c0', fontWeight: '600' }}>{fmtIDR(r.saldo)}</td>
                  </tr>
                ))}
                <tr>
                  <td colSpan="3" style={{ fontWeight: '700', color: '#1565c0' }}>TOTAL</td>
                  <td style={{ textAlign: 'right', fontWeight: '700', color: '#1565c0' }}>{fmtIDR(totalRekening)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* INVESTASI */}
          <div className="pdf-section">
            <div className="pdf-section-title">📈 Portofolio Investasi</div>
            <div className="pdf-grid2">
              {/* Emas */}
              <div>
                <div style={{ fontSize: '11px', fontWeight: '600', color: '#f57f17', marginBottom: '10px' }}>🥇 Emas</div>
                <table className="pdf-table">
                  <tbody>
                    <tr>
                      <td style={{ color: '#888', fontSize: '10px' }}>Total Gram</td>
                      <td style={{ fontWeight: '600', textAlign: 'right' }}>{fmtGram(totalEmasGram)}</td>
                    </tr>
                    <tr>
                      <td style={{ color: '#888', fontSize: '10px' }}>Modal</td>
                      <td style={{ textAlign: 'right' }}>{fmtIDR(totalEmasModal)}</td>
                    </tr>
                    <tr>
                      <td style={{ color: '#888', fontSize: '10px' }}>Nilai Sekarang</td>
                      <td style={{ fontWeight: '600', color: '#f57f17', textAlign: 'right' }}>{fmtIDR(totalEmasSekarang)}</td>
                    </tr>
                    <tr>
                      <td style={{ color: '#888', fontSize: '10px' }}>Untung/Rugi</td>
                      <td style={{ fontWeight: '600', color: totalEmasSekarang >= totalEmasModal ? '#2e7d32' : '#c62828', textAlign: 'right' }}>
                        {totalEmasSekarang >= totalEmasModal ? '+' : ''}{fmtIDR(totalEmasSekarang - totalEmasModal)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Crypto */}
              <div>
                <div style={{ fontSize: '11px', fontWeight: '600', color: '#7b1fa2', marginBottom: '10px' }}>🪙 Crypto</div>
                <table className="pdf-table">
                  <thead>
                    <tr><th>Ticker</th><th>Unit</th><th style={{ textAlign:'right' }}>Modal</th></tr>
                  </thead>
                  <tbody>
                    {Object.values(perTicker).map(t => (
                      <tr key={t.ticker}>
                        <td style={{ fontWeight: '600' }}>{t.ticker}</td>
                        <td style={{ fontSize: '10px', color: '#888' }}>{t.jumlah.toFixed(4)}</td>
                        <td style={{ textAlign: 'right', color: '#7b1fa2' }}>{fmtIDR(t.totalBeliIDR)}</td>
                      </tr>
                    ))}
                    <tr>
                      <td colSpan="2" style={{ fontWeight: '700', color: '#7b1fa2' }}>TOTAL</td>
                      <td style={{ textAlign: 'right', fontWeight: '700', color: '#7b1fa2' }}>{fmtIDR(totalCrypto)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* CASHFLOW */}
          <div className="pdf-section">
            <div className="pdf-section-title">💸 Cashflow {bulanLabel}</div>
            <div className="pdf-kpi-grid">
              {[
                { label: 'Total Pemasukan', value: fmtIDR(totalMasuk), color: '#1b5e20', bg: '#f1f8f1' },
                { label: 'Total Pengeluaran', value: fmtIDR(totalKeluar), color: '#b71c1c', bg: '#fff5f5' },
                { label: 'Selisih (Net)', value: `${totalMasuk >= totalKeluar ? '+' : ''}${fmtIDR(totalMasuk - totalKeluar)}`, color: totalMasuk >= totalKeluar ? '#1b5e20' : '#b71c1c', bg: totalMasuk >= totalKeluar ? '#f1f8f1' : '#fff5f5' },
                { label: 'Jumlah Transaksi', value: `${transaksi.length}x`, color: '#1565c0', bg: '#f0f4ff' },
              ].map((k, i) => (
                <div key={i} className="pdf-kpi" style={{ background: k.bg, border: `1px solid ${k.color}22` }}>
                  <div className="pdf-kpi-label">{k.label}</div>
                  <div className="pdf-kpi-value" style={{ color: k.color, fontSize: '12px' }}>{k.value}</div>
                </div>
              ))}
            </div>

            {transaksi.length > 0 && (
              <table className="pdf-table">
                <thead>
                  <tr><th>Tanggal</th><th>Keterangan</th><th>Kategori</th><th>Tipe</th><th style={{ textAlign:'right' }}>Jumlah</th></tr>
                </thead>
                <tbody>
                  {transaksi.slice(0, 15).map(t => (
                    <tr key={t.id}>
                      <td>{t.tanggal}</td>
                      <td style={{ fontWeight: '500' }}>{t.keterangan}</td>
                      <td style={{ fontSize: '10px', color: '#888' }}>{t.kategori}</td>
                      <td>
                        <span className="pdf-badge" style={{ background: t.tipe==='Pemasukan'?'#e8f5e9':'#ffebee', color: t.tipe==='Pemasukan'?'#2e7d32':'#c62828' }}>
                          {t.tipe}
                        </span>
                      </td>
                      <td style={{ textAlign:'right', fontWeight:'600', color: t.tipe==='Pemasukan'?'#2e7d32':'#c62828' }}>
                        {t.tipe==='Pemasukan'?'+':'-'}{fmtIDR(t.jumlah)}
                      </td>
                    </tr>
                  ))}
                  {transaksi.length > 15 && (
                    <tr><td colSpan="5" style={{ textAlign: 'center', color: '#aaa', fontSize: '10px', fontStyle: 'italic' }}>... dan {transaksi.length - 15} transaksi lainnya</td></tr>
                  )}
                </tbody>
              </table>
            )}
          </div>

          {/* FOOTER */}
          <div className="pdf-footer">
            <div>Velora Finance · Laporan Keuangan Pribadi · {bulanLabel}</div>
            <div>Digenerate otomatis · {tanggalCetak}</div>
          </div>
        </div>

      </div>
    </>
  )
}
