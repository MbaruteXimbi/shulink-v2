import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import { useNavigate } from 'react-router-dom';
import { Upload, Plus, Download, Calendar, X, CheckCircle, AlertCircle } from 'lucide-react';

function ImportModal({ onClose, onSaved }) {
  const [quals, setQuals] = useState([]);
  const [qualId, setQualId] = useState('');
  const [year, setYear] = useState('2024-2025');
  const [file, setFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    api.get('/school/qualifications').then(r => setQuals(r.data));
  }, []);

  const handleFile = e => {
    const f = e.target.files[0];
    if (f && (f.name.endsWith('.xlsx') || f.name.endsWith('.xls'))) setFile(f);
    else { setErr('Please select an Excel file (.xlsx or .xls)'); setFile(null); }
  };

  const submit = async e => {
    e.preventDefault();
    if (!file) { setErr('Please select a file'); return; }
    if (!qualId) { setErr('Please select a qualification'); return; }
    setImporting(true); setErr(''); setResult(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('qualification_id', qualId);
      fd.append('academic_year', year);
      const { data } = await api.post('/chronograms/import/excel', fd);
      setResult(data);
    } catch (er) {
      setErr(er.response?.data?.error || 'Import failed');
    } finally { setImporting(false); }
  };

  return (
    <div className="modal-overlay">
      <div className="modal modal-lg">
        <div className="modal-header">
          <h3>Import RTB Chronogram from Excel</h3>
          <button className="btn-icon" onClick={onClose}><X size={18}/></button>
        </div>

        {result ? (
          <div className="modal-body">
            <div className="alert alert-success" style={{ display:'flex', flexDirection:'column', gap:8 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <CheckCircle size={18} color="var(--green)"/>
                <strong>{result.message}</strong>
              </div>
              <div style={{ fontSize:12 }}>
                {result.weeks} weeks imported · {result.total_periods} total periods · {result.modules?.length} modules detected
              </div>
              {result.modules?.length > 0 && (
                <div style={{ display:'flex', flexWrap:'wrap', gap:4, marginTop:4 }}>
                  {result.modules.map(m => (
                    <span key={m} style={{ fontFamily:'monospace', fontSize:11, background:'var(--green-bg)', color:'var(--green)', padding:'1px 6px', borderRadius:4, border:'1px solid #a7f3d0' }}>{m}</span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <form onSubmit={submit}>
            <div className="modal-body">
              {err && <div className="alert alert-error">{err}</div>}

              <div className="alert alert-info" style={{ fontSize:12 }}>
                <strong>Before importing:</strong> Fill the Shulink Chronogram Excel template using your RTB PDF as reference, then upload here.
                <br/>Download the template first if you haven't already.
              </div>

              <div className="form-group">
                <label className="form-label">Qualification *</label>
                <select className="form-select" value={qualId} onChange={e => setQualId(e.target.value)} required>
                  <option value="">Select qualification…</option>
                  {quals.map(q => (
                    <option key={q.id} value={q.id}>[{q.curriculum_code}] L{q.rqf_level} — {q.title}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Academic Year *</label>
                <input className="form-input" value={year} onChange={e => setYear(e.target.value)} placeholder="2024-2025"/>
              </div>

              <div className="form-group">
                <label className="form-label">Excel File *</label>
                <label className="upload-zone" style={{ cursor:'pointer' }}>
                  <input type="file" accept=".xlsx,.xls" onChange={handleFile}/>
                  <Upload size={28} color="var(--text-3)" style={{ marginBottom:8 }}/>
                  {file ? (
                    <div>
                      <div style={{ fontWeight:600, fontSize:13 }}>{file.name}</div>
                      <div style={{ fontSize:12, color:'var(--green)' }}>Ready to import</div>
                    </div>
                  ) : (
                    <div>
                      <div style={{ fontWeight:500, fontSize:13 }}>Click to select Excel file</div>
                      <div style={{ fontSize:12, color:'var(--text-3)', marginTop:4 }}>
                        .xlsx or .xls · Use the Shulink chronogram template
                      </div>
                    </div>
                  )}
                </label>
              </div>
            </div>
            <div className="modal-footer">
              <a href="/api/templates/chronogram" download className="btn btn-outline">
                <Download size={14}/> Template
              </a>
              <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={importing || !file || !qualId}>
                {importing ? 'Importing…' : 'Import Chronogram'}
              </button>
            </div>
          </form>
        )}

        {result && (
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={onClose}>Close</button>
            <button className="btn btn-primary" onClick={() => { onSaved(); onClose(); }}>View Chronograms</button>
          </div>
        )}
      </div>
    </div>
  );
}

function ChronogramView({ id }) {
  const [chron, setChron] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/chronograms/${id}`).then(r => setChron(r.data)).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div style={{ textAlign:'center', padding:40, color:'var(--text-3)' }}>Loading chronogram…</div>;
  if (!chron) return null;

  // Collect all module codes with allocations
  const moduleCodes = new Set();
  chron.terms?.forEach(t => t.weeks?.forEach(w => {
    if (w.allocations) {
      try {
        const allocs = typeof w.allocations === 'string' ? JSON.parse(w.allocations) : w.allocations;
        Object.keys(allocs).forEach(k => { if (allocs[k]) moduleCodes.add(k); });
      } catch {}
    }
  }));
  const codes = [...moduleCodes].sort();

  const WEEK_TYPE_COLORS = {
    teaching:             'chron-week-teaching',
    assessment_school:    'chron-week-assessment_school',
    assessment_district:  'chron-week-assessment_district',
    assessment_national:  'chron-week-assessment_national',
    iap:                  'chron-week-iap',
    holiday:              'chron-week-holiday',
  };

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      {chron.terms?.map(term => (
        <div key={term.id}>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
            <div style={{ fontFamily:'var(--font-head)', fontSize:15, fontWeight:700 }}>{term.name || `Term ${term.term_number}`}</div>
            {term.starts_at && (
              <div style={{ fontSize:12, color:'var(--text-3)' }}>
                {new Date(term.starts_at).toLocaleDateString('en-RW',{day:'numeric',month:'short'})} — {new Date(term.ends_at).toLocaleDateString('en-RW',{day:'numeric',month:'short',year:'numeric'})}
              </div>
            )}
            <div style={{ fontSize:12, color:'var(--text-3)' }}>{term.weeks?.length || 0} weeks</div>
          </div>

          <div className="chron-grid">
            <table className="chron-table">
              <thead>
                <tr>
                  <th style={{ minWidth:40 }}>Wk</th>
                  <th style={{ minWidth:100 }}>Dates</th>
                  <th style={{ minWidth:90 }}>Type</th>
                  {codes.map(c => <th key={c} style={{ minWidth:56, fontSize:9 }}>{c}</th>)}
                  <th style={{ minWidth:56, background:'#8B0000' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {term.weeks?.map(w => {
                  const allocs = w.allocations
                    ? (typeof w.allocations === 'string' ? JSON.parse(w.allocations) : w.allocations)
                    : {};
                  return (
                    <tr key={w.id} className={WEEK_TYPE_COLORS[w.week_type] || 'chron-week-teaching'}>
                      <td style={{ fontWeight:700, fontSize:12 }}>{w.week_number}</td>
                      <td style={{ fontSize:10, textAlign:'left', whiteSpace:'nowrap' }}>
                        {w.date_start ? new Date(w.date_start).toLocaleDateString('en-RW',{day:'numeric',month:'short'}) : ''}
                        {w.date_end ? ` – ${new Date(w.date_end).toLocaleDateString('en-RW',{day:'numeric',month:'short'})}` : ''}
                      </td>
                      <td>
                        {w.week_type !== 'teaching' ? (
                          <span style={{ fontSize:9, fontWeight:600, color:'var(--text-2)' }}>
                            {w.week_type.replace(/_/g,' ')}
                          </span>
                        ) : null}
                      </td>
                      {codes.map(c => (
                        <td key={c} style={{ fontWeight: allocs[c] > 0 ? 700 : 400, color: allocs[c] > 0 ? 'var(--text)' : 'var(--text-3)', fontSize:12 }}>
                          {allocs[c] || ''}
                        </td>
                      ))}
                      <td style={{ fontWeight:800, fontSize:13, color:'var(--primary)', background:'#fdf2f2' }}>{w.total_periods}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function ChronogramPage() {
  const { can } = useAuth();
  const navigate = useNavigate();
  const [chronograms, setChronograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [showImport, setShowImport] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    api.get('/chronograms').then(r => {
      setChronograms(r.data);
      if (r.data.length && !selected) setSelected(r.data[0].id);
    }).finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  const del = async id => {
    if (!confirm('Delete this chronogram and all its weekly data?')) return;
    await api.delete(`/chronograms/${id}`);
    setSelected(null);
    load();
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Chronogram</div>
          <div className="page-subtitle">RTB training calendar — weekly period allocations per module</div>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <a href="/api/templates/chronogram" download className="btn btn-outline">
            <Download size={14}/> Download Template
          </a>
          {can('school_admin','headmaster','dos') && (
            <button className="btn btn-primary" onClick={() => setShowImport(true)}>
              <Upload size={14}/> Import from Excel
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign:'center', padding:60, color:'var(--text-3)' }}>Loading…</div>
      ) : chronograms.length === 0 ? (
        <div className="empty-state">
          <Calendar size={40} color="var(--text-3)" style={{ margin:'0 auto 16px' }}/>
          <h4>No chronograms yet</h4>
          <p style={{ marginBottom:20 }}>
            Download the Shulink Excel template, fill it in using your RTB PDF chronogram, then import it here.
          </p>
          <div style={{ display:'flex', gap:10, justifyContent:'center' }}>
            <a href="/api/templates/chronogram" download className="btn btn-outline">
              <Download size={14}/> Download Template
            </a>
            {can('school_admin','headmaster','dos') && (
              <button className="btn btn-primary" onClick={() => setShowImport(true)}>
                <Upload size={14}/> Import Chronogram
              </button>
            )}
          </div>
        </div>
      ) : (
        <div style={{ display:'flex', gap:20 }}>
          {/* Sidebar list */}
          <div style={{ width:260, flexShrink:0 }}>
            <div className="card" style={{ padding:0 }}>
              {chronograms.map(ch => (
                <div
                  key={ch.id}
                  onClick={() => setSelected(ch.id)}
                  style={{
                    padding:'14px 16px',
                    cursor:'pointer',
                    borderBottom:'1px solid var(--border)',
                    background: selected===ch.id ? 'var(--primary-bg)' : 'transparent',
                    transition:'background .1s',
                  }}
                >
                  <div style={{ fontWeight:600, fontSize:13, color: selected===ch.id ? 'var(--primary)' : 'var(--text)' }}>
                    {ch.qualification_title?.slice(0,30)}…
                  </div>
                  <div style={{ fontSize:11, color:'var(--text-3)', marginTop:2 }}>
                    {ch.curriculum_code} · L{ch.rqf_level}
                  </div>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:6 }}>
                    <span className="badge badge-approved">{ch.academic_year}</span>
                    <div style={{ fontSize:11, color:'var(--text-3)' }}>{ch.total_periods} periods</div>
                  </div>
                  {can('school_admin','headmaster') && (
                    <button
                      className="btn btn-sm btn-danger"
                      style={{ marginTop:8, width:'100%' }}
                      onClick={e => { e.stopPropagation(); del(ch.id); }}
                    >
                      Delete
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Chronogram view */}
          <div style={{ flex:1, minWidth:0 }}>
            {selected ? (
              <div className="card">
                <ChronogramView id={selected}/>
              </div>
            ) : (
              <div className="empty-state"><p>Select a chronogram to view</p></div>
            )}
          </div>
        </div>
      )}

      {showImport && (
        <ImportModal onClose={() => setShowImport(false)} onSaved={load}/>
      )}
    </div>
  );
}
