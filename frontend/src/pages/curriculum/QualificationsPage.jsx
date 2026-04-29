import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import { Plus, X, ChevronRight } from 'lucide-react';

function LinkModal({ onClose, onSaved }) {
  const [allQuals, setAllQuals] = useState([]);
  const [selected, setSelected] = useState('');
  const [year, setYear] = useState('2024-2025');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    api.get('/qualifications').then(r => setAllQuals(r.data));
  }, []);

  const submit = async e => {
    e.preventDefault(); setSaving(true); setErr('');
    try {
      await api.post('/school/qualifications/link', { qualification_id: selected, started_year: year });
      onSaved();
    } catch (er) { setErr(er.response?.data?.error || 'Failed'); }
    finally { setSaving(false); }
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h3>Link Qualification to School</h3>
          <button className="btn-icon" onClick={onClose}><X size={18}/></button>
        </div>
        <form onSubmit={submit}>
          <div className="modal-body">
            {err && <div className="alert alert-error">{err}</div>}
            <div className="form-group">
              <label className="form-label">Qualification *</label>
              <select className="form-select" value={selected} onChange={e => setSelected(e.target.value)} required>
                <option value="">Select qualification…</option>
                {allQuals.map(q => (
                  <option key={q.id} value={q.id}>
                    [{q.curriculum_code}] L{q.rqf_level} — {q.title}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Academic Year Started</label>
              <input className="form-input" value={year} onChange={e => setYear(e.target.value)} placeholder="2024-2025"/>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving || !selected}>
              {saving ? 'Linking…' : 'Link Qualification'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const LEVEL_COLOR = { 1:'#0ea5e9',2:'#8b5cf6',3:'#f59e0b',4:'#10b981',5:'#ef4444' };

export default function QualificationsPage() {
  const { can } = useAuth();
  const navigate = useNavigate();
  const [quals, setQuals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showLink, setShowLink] = useState(false);

  const load = () => {
    setLoading(true);
    api.get('/school/qualifications').then(r => setQuals(r.data)).finally(() => setLoading(false));
  };
  useEffect(load, []);

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Qualifications</div>
          <div className="page-subtitle">{quals.length} qualification{quals.length!==1?'s':''} offered by this school</div>
        </div>
        {can('school_admin','headmaster','super_admin') && (
          <button className="btn btn-primary" onClick={() => setShowLink(true)}>
            <Plus size={15}/> Link Qualification
          </button>
        )}
      </div>

      {loading ? (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:16 }}>
          {[1,2,3].map(i => (
            <div key={i} className="card">
              <div className="skeleton" style={{ height:20, width:'60%', marginBottom:10 }}/>
              <div className="skeleton" style={{ height:14, width:'80%', marginBottom:8 }}/>
              <div className="skeleton" style={{ height:14, width:'40%' }}/>
            </div>
          ))}
        </div>
      ) : quals.length === 0 ? (
        <div className="empty-state">
          <h4>No qualifications linked yet</h4>
          <p style={{ marginBottom:16 }}>Link your school's RTB qualifications to get started</p>
          {can('school_admin','headmaster') && (
            <button className="btn btn-primary" onClick={() => setShowLink(true)}>
              <Plus size={14}/> Link First Qualification
            </button>
          )}
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(320px,1fr))', gap:16 }}>
          {quals.map(q => (
            <div
              key={q.id}
              className="card"
              style={{ cursor:'pointer', transition:'border-color .12s' }}
              onClick={() => navigate(`/modules?qualification_id=${q.id}&title=${encodeURIComponent(q.title)}`)}
            >
              <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:12 }}>
                <div style={{
                  background: LEVEL_COLOR[q.rqf_level] + '22',
                  border: `1px solid ${LEVEL_COLOR[q.rqf_level]}44`,
                  color: LEVEL_COLOR[q.rqf_level],
                  borderRadius:'var(--radius)',
                  padding:'4px 10px',
                  fontSize:12, fontWeight:700,
                }}>
                  RQF Level {q.rqf_level}
                </div>
                <span className="rtb-badge">RTB</span>
              </div>

              <div style={{ fontFamily:'var(--font-head)', fontSize:16, fontWeight:700, marginBottom:4, lineHeight:1.3 }}>
                {q.title}
              </div>

              <div style={{ fontSize:12, color:'var(--text-3)', marginBottom:12 }}>
                {q.curriculum_code} · {q.sector_name || 'No sector'}
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, marginBottom:14 }}>
                {[
                  ['Credits', q.total_credits],
                  ['Hours', q.total_hours],
                  ['Modules', q.module_count],
                ].map(([label, val]) => (
                  <div key={label} style={{
                    background:'var(--bg-3)', border:'1px solid var(--border)',
                    borderRadius:'var(--radius)', padding:'8px 10px', textAlign:'center',
                  }}>
                    <div style={{ fontFamily:'var(--font-head)', fontSize:18, fontWeight:700 }}>{val}</div>
                    <div style={{ fontSize:10, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'.04em' }}>{label}</div>
                  </div>
                ))}
              </div>

              {q.started_year && (
                <div style={{ fontSize:11, color:'var(--text-3)' }}>Started {q.started_year}</div>
              )}

              <div style={{ display:'flex', alignItems:'center', justifyContent:'flex-end', marginTop:10 }}>
                <span style={{ fontSize:12, color:'var(--primary)', fontWeight:600 }}>
                  View modules <ChevronRight size={12}/>
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {showLink && (
        <LinkModal onClose={() => setShowLink(false)} onSaved={() => { setShowLink(false); load(); }}/>
      )}
    </div>
  );
}
