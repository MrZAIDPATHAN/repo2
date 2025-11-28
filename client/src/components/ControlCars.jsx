import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

// Import CSV as raw text (Vite will inline this at build/dev)
import carsCsvRaw from '../../newCarsIndia.csv?raw'

// Helpers for UI
function parsePriceMin(priceRange) {
  if (!priceRange) return null;
  try {
    const text = String(priceRange);
    // find first number-like token
    const nums = text.match(/\d+[\d\.,]*/g);
    if (!nums || nums.length === 0) return null;
    const raw = nums[0].replace(/,/g, '');
    let val = parseFloat(raw);
    // if priceRange contains L (lakh) or Cr (crore), scale
    if (/\bL\b|lakh|Lakh| L\b/.test(text)) {
      val = val * 100000;
    } else if (/Cr|cr|crore|Crore/.test(text)) {
      val = val * 10000000;
    }
    return Number.isFinite(val) ? val : null;
  } catch (e) {
    return null;
  }
}

function SpecRow({ label, value }) {
  return (
    <div className="p-3 bg-gradient-to-r from-white via-gray-50 to-white rounded border">
      <div className="text-xs text-gray-400 uppercase tracking-wide">{label}</div>
      <div className="text-sm font-semibold text-gray-900">{value || '—'}</div>
    </div>
  )
}

function toComparable(v) {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  const num = parseFloat(s.replace(/[^0-9\.\-]/g, ''));
  if (!Number.isNaN(num)) return num;
  return s.toLowerCase();
}

function CompareStat({ label, a, b, higherIsBetter = true }) {
  const va = toComparable(a);
  const vb = toComparable(b);
  let winner = 0; // 0 tie/unknown, 1 left, 2 right
  if (va !== null && vb !== null) {
    if (typeof va === 'number' && typeof vb === 'number') {
      if (va === vb) winner = 0;
      else if (va > vb) winner = higherIsBetter ? 1 : 2;
      else winner = higherIsBetter ? 2 : 1;
    } else {
      if (va === vb) winner = 0;
      else winner = (String(va) > String(vb)) ? (higherIsBetter ? 1 : 2) : (higherIsBetter ? 2 : 1);
    }
  }

  const leftClass = winner === 1 ? 'text-green-600 font-semibold' : 'text-gray-800';
  const rightClass = winner === 2 ? 'text-green-600 font-semibold' : 'text-gray-800';
  // compute a simple diff indicator for numeric values
  let diffBadge = null;
  if (typeof va === 'number' && typeof vb === 'number') {
    const delta = va - vb;
    const pct = vb !== 0 ? Math.abs((delta / vb) * 100) : null;
    const isPositive = delta > 0;
    const arrow = isPositive ? '▲' : (delta < 0 ? '▼' : '');
    const color = (winner === 1 || winner === 2) ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700';
    diffBadge = (
      <div className={`inline-flex items-center gap-2 px-2 py-1 rounded ${color} text-xs`}> 
        <span className="font-semibold">{arrow}</span>
        <span>{pct !== null ? `${Math.round(pct)}%` : ''}</span>
      </div>
    )
  }

  return (
    <div className="p-3 rounded border bg-white flex items-center gap-3">
      <div className="w-1/3 text-left text-sm">
        <div className={leftClass}>{a ?? '—'}</div>
      </div>
      <div className="w-1/3 text-center text-xs text-gray-500 flex flex-col items-center">
        <div className="font-medium">{label}</div>
        <div className="mt-1">{diffBadge}</div>
      </div>
      <div className="w-1/3 text-right text-sm">
        <div className={rightClass}>{b ?? '—'}</div>
      </div>
    </div>
  )
}

function formatPrice(v) {
  if (v === null || v === undefined) return '—';
  if (typeof v === 'number') return v.toLocaleString('en-IN');
  const n = parseFloat(String(v).replace(/[^0-9\.\-]/g, ''));
  return Number.isFinite(n) ? n.toLocaleString('en-IN') : String(v);
}

export default function ControlCars() {
  const navigate = useNavigate();
  const location = useLocation();

  const pre1 = location.state?.car1 || null;
  const pre2 = location.state?.car2 || null;

  const [name1, setName1] = useState(pre1?.Car || '')
  const [name2, setName2] = useState(pre2?.Car || '')
  const [car1, setCar1] = useState(pre1)
  const [car2, setCar2] = useState(pre2)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (pre1) setCar1(pre1)
    if (pre2) setCar2(pre2)
  }, [pre1, pre2])

  const [carsList, setCarsList] = useState([])
  const [parseError, setParseError] = useState(null)

  useEffect(() => {
    try {
      const text = carsCsvRaw || '';
      const lines = text.split(/\r?\n/).filter(Boolean);
      if (lines.length === 0) {
        setCarsList([])
        return
      }
      const headers = lines[0].split(',').map(h => h.trim());
      const rows = lines.slice(1).map(line => {
        const parts = line.split(',');
        if (parts.length > headers.length) {
          const start = parts.slice(0, headers.length - 1);
          const last = parts.slice(headers.length - 1).join(',');
          parts.length = 0;
          parts.push(...start, last);
        }
        const obj = {};
        headers.forEach((h, i) => {
          obj[h] = parts[i] ? parts[i].trim().replace(/^\"|\"$/g, '') : '';
        });
        return obj;
      });
      setCarsList(rows)
      setParseError(null)
    } catch (e) {
      setCarsList([])
      setParseError('Failed to parse cars CSV')
      console.error('CSV parse error', e)
    }
  }, [])

  const [suggestions1, setSuggestions1] = useState([])
  const [suggestions2, setSuggestions2] = useState([])

  const updateSuggestions = (value, which) => {
    const q = (value || '').toLowerCase().trim();
    if (!q || q.length < 2) {
      if (which === 1) setSuggestions1([]); else setSuggestions2([])
      return
    }
    const matches = carsList.filter(c => (c.Car || '').toLowerCase().includes(q)).slice(0, 8).map(c => c.Car)
    if (which === 1) setSuggestions1(matches); else setSuggestions2(matches)
  }

  function findByName(name) {
    if (!name) return null;
    const lower = name.toLowerCase();
    const exact = carsList.find(c => (c.Car || '').toLowerCase() === lower);
    if (exact) return exact;
    const starts = carsList.find(c => (c.Car || '').toLowerCase().startsWith(lower));
    if (starts) return starts;
    const partial = carsList.find(c => (c.Car || '').toLowerCase().includes(lower));
    return partial || null;
  }

  function fetchAndCompare() {
    setError(null)
    if (!name1 || !name2) {
      setError('Please enter both car names (at least 2 characters)')
      return
    }
    setLoading(true)
    try {
      const c1 = findByName(name1)
      const c2 = findByName(name2)
      if (!c1 || !c2) {
        let msg = 'Could not find one or both cars.'
        if (!c1) msg += ` No match for "${name1}".`
        if (!c2) msg += ` No match for "${name2}".`
        setError(msg)
      }
      setCar1(c1)
      setCar2(c2)
    } catch (e) {
      setError('Unexpected error while finding cars')
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  function useSample() {
    const s1 = carsList[0] || null;
    const s2 = carsList[1] || null;
    setCar1(s1)
    setCar2(s2)
    if (s1) setName1(s1.Car || '')
    if (s2) setName2(s2.Car || '')
    setError(null)
  }

  function clearAll() {
    setCar1(null)
    setCar2(null)
    setName1('')
    setName2('')
    setError(null)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold">Compare Cars</h1>
            <p className="text-sm text-gray-500 mt-1">Type two car names to compare specs side-by-side. Try "Tata Nexon EV" and "Hyundai Creta".</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="px-3 py-2 bg-white border rounded shadow-sm text-sm" onClick={() => navigate(-1)}>Back</button>
            <button className="px-3 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded shadow" onClick={useSample}>Use Sample</button>
            <button className="px-3 py-2 bg-gray-100 rounded border text-sm" onClick={clearAll}>Clear</button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Car 1 name</label>
            <input className="w-full p-3 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-300" value={name1} onChange={e => { setName1(e.target.value); updateSuggestions(e.target.value, 1) }} placeholder="e.g. Tata Nexon" />
            {suggestions1.length > 0 && (
              <div className="mt-1 bg-white rounded-lg shadow max-h-44 overflow-auto border">
                {suggestions1.map((s, i) => (
                  <div key={i} className="p-2 hover:bg-gray-50 cursor-pointer text-sm border-b last:border-b-0" onClick={() => { setName1(s); setSuggestions1([]) }}>{s}</div>
                ))}
              </div>
            )}
            {name1 && suggestions1.length === 0 && name1.length >= 2 && <div className="text-xs text-gray-500 mt-1">No matches found</div>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Car 2 name</label>
            <input className="w-full p-3 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-300" value={name2} onChange={e => { setName2(e.target.value); updateSuggestions(e.target.value, 2) }} placeholder="e.g. Hyundai Creta" />
            {suggestions2.length > 0 && (
              <div className="mt-1 bg-white rounded-lg shadow max-h-44 overflow-auto border">
                {suggestions2.map((s, i) => (
                  <div key={i} className="p-2 hover:bg-gray-50 cursor-pointer text-sm border-b last:border-b-0" onClick={() => { setName2(s); setSuggestions2([]) }}>{s}</div>
                ))}
              </div>
            )}
            {name2 && suggestions2.length === 0 && name2.length >= 2 && <div className="text-xs text-gray-500 mt-1">No matches found</div>}
          </div>
        </div>

        <div className="mt-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <button onClick={fetchAndCompare} disabled={loading} className="px-5 py-2 bg-green-600 text-white rounded-lg shadow">Compare</button>
          <button onClick={useSample} className="px-4 py-2 bg-indigo-600 text-white rounded-lg">Use Sample</button>
          <button onClick={clearAll} className="px-4 py-2 bg-gray-100 rounded-lg">Clear</button>
          <div className="ml-auto flex items-center gap-3">
            {loading && <div className="text-gray-600">Loading…</div>}
            {parseError && <div className="text-red-600">{parseError}</div>}
            {error && <div className="text-red-600">{error}</div>}
          </div>
        </div>

        <div className="mt-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[car1, car2].map((car, idx) => (
              <div key={idx} className="bg-white rounded-xl shadow-lg overflow-hidden border-l-4" style={{borderColor: idx===0? '#3b82f6':'#6366f1'}}>
                {car ? (
                  <div className="p-5">
                    <div className="flex items-center gap-4">
                      <div className="w-32 h-20 rounded-lg flex items-center justify-center text-white font-bold" style={{background: idx===0? 'linear-gradient(135deg,#60a5fa,#3b82f6)':'linear-gradient(135deg,#a78bfa,#7c3aed)'}}>
                        {String((car && car.Car) || 'Car').split(' ').slice(0,2).map(s => s[0]).join('')}
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold leading-tight">{car.Car}</h2>
                        <div className="text-sm text-gray-500">{car.Style || ''} • {car.VehicleType || ''}</div>
                      </div>
                      <div className="ml-auto text-right">
                        <div className="text-sm text-gray-400">Rating</div>
                        <div className="inline-flex items-center gap-2">
                          <div className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full font-semibold">{(car['Rating(outof10)'] && car['Rating(outof10)'] !== 'na') ? car['Rating(outof10)'] : '—'}</div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <SpecRow label="Range / Mileage" value={car.Range} />
                      <SpecRow label="Transmission" value={car.Transmission} />
                      <SpecRow label="Price" value={ (parsePriceMin(car.PriceRange) ? `₹ ${formatPrice(parsePriceMin(car.PriceRange))}` : (car.PriceRange || '—')) } />
                      <SpecRow label="Fuel / Variant" value={car['Fuel'] || car['Variants'] || '—'} />
                    </div>

                    <div className="mt-4 text-sm text-gray-700">
                      <details>
                        <summary className="cursor-pointer text-sm text-blue-600">Show raw data</summary>
                        <pre className="mt-2 text-xs whitespace-pre-wrap bg-gray-50 p-3 rounded">{JSON.stringify(car, null, 2)}</pre>
                      </details>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 text-gray-400">No car selected</div>
                )}
              </div>
            ))}
          </div>

          {/* Comparison highlights */}
          {car1 && car2 && (
            <div className="mt-6 bg-white rounded-xl shadow p-5">
              <h3 className="text-lg font-semibold mb-3">Head-to-head</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <CompareStat label="Rating" a={car1['Rating(outof10)']} b={car2['Rating(outof10)']} higherIsBetter={true} />
                <CompareStat label="Range / Mileage" a={car1.Range} b={car2.Range} higherIsBetter={true} />
                <CompareStat label="Price (min)" a={parsePriceMin(car1.PriceRange)} b={parsePriceMin(car2.PriceRange)} higherIsBetter={false} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

