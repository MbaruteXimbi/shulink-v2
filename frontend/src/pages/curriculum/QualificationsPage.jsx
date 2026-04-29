import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import { Plus, X, ChevronRight, Link, PlusCircle } from 'lucide-react';

function LinkModal({ onClose, onSaved }) {
  const [allQuals, setAllQuals] = useState([]);
  const [selected, setSelected] = useState('');
  const [year, setYear] = useState(`${new Date().getFullYear()}-${new Date().getFullYear()+1}`);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => { api.get('/qualifications').then(r => setAllQuals(r.data)); }, []);

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
          <h3>Link Existing Qualification</h3>
          <button className="btn-icon" onClick={onClose}><X size={18}/></button>
        </div>
        <form onSubmit={submit}>
          <div className="modal-body">
            {err && <div className="alert alert-error">{err}</div>}
            <div className="alert alert-info" style={{ fontSize:12 }}>
              Select from RTB qualifications already in Shulink. If yours isn't listed, use "Create New" instead.
            </div>
            <div className="form-group">
              <label className="form-label">Qualification *</label>
              <select className="form-select" value={selected} onChange={e => setSelected(e.target.value)} required>
                <option value="">Select qualification…</option>
                {allQuals.map(q => (
                  <option key={q.id} value={q.id}>[{q.curriculum_code}] L{q.rqf_level} — {q.title}</option>
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

function CreateModal({ onClose, onSaved }) {
  const [sectors, setSectors] = useState([]);
  const [form, setForm] = useState({
    curriculum_code:'', title:'', short_title:'', rqf_level:'3',
    total_credits:'', total_hours:'', duration_years:'3',
    entry_requirement:'', sector_id:'',
    started_year:`${new Date().getFullYear()}-${new Date().getFullYear()+1}`,
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  useEffect(() => { api.get('/sectors').then(r => setSectors(r.data)); }, []);

  const submit = async e => {
    e.preventDefault(); setSaving(true); setErr('');
    try {
      const { data: qual } = await api.post('/qualifications', {
        curriculum_code: form.curriculum_code.toUpperCase(),
        title: form.title,
        short_title: form.short_title || null,
        rqf_level: parseInt(form.rqf_level),
        total_credits: parseInt(form.total_credits) || 0,
        total_hours: parseInt(form.total_hours) || 0,
        duration_years: parseInt(form.duration_years) || 3,
        entry_requirement: form.entry_requirement || null,
        sector_id: form.sector_id || null,
      });
      await api.post('/school/qualifications/link', {
        qualification_id: qual.id,
        started_year: form.started_year,
      });
      onSaved();
    } catch (er) { setErr(er.response?.data?.error || 'Failed to create qualification'); }
    finally { setSaving(false); }
  };

  return (
    <div className="modal-overlay">
      <div className="modal modal-lg">
        <div className="modal-header">
          <h3>Create New Qualification</h3>
          <button className="btn-icon" onClick={onClose}><X size={18}/></button>
        </div>
        <form onSubmit={submit}>
          <div className="modal-body">
            {err && <div className="alert alert-error">{err}</div>}
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Curriculum Code *</label>
                <input className="form-input" value={form.curriculum_code} onChange={e => set('curriculum_code', e.target.value)} required placeholder="e.g. ICTSWD3001" style={{ fontFamily:'monospace', fontWeight:700 }}/>
              </div>
              <div className="form-group">
                <label className="form-label">RQF Level *</label>
                <select className="form-select" value={form.rqf_level} onChange={e => set('rqf_level', e.target.value)} required>
                  {[1,2,3,4,5,6].map(l => <option key={l} value={l}>Level {l}</option>)}
                </select>
              </div>
              <div className="form-group form-span-2">
                <label className="form-label">Full Title *</label>
                <input className="form-input" value={form.title} onChange={e => set('title', e.target.value)} required placeholder="e.g. TVET Certificate III in Software Development"/>
              </div>
              <div className="form-group form-span-2">
                <label className="form-label">Short Title</label>
                <input className="form-input" value={form.short_title} onChange={e => set('short_title', e.target.value)} placeholder="e.g. Cert III - Software Dev"/>
              </div>
              <div className="form-group">
                <label className="form-label">Sector</label>
                <select className="form-select" value={form.sector_id} onChange={e => set('sector_id', e.target.value)}>
                  <option value="">Select sector…</option>
                  {sectors.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Duration (years)</label>
                <select className="form-select" value={form.duration_years} onChange={e => set('duration_years', e.target.value)}>
                  {[1,2,3,4].map(y => <option key={y} value={y}>{y} year{y!==1?'s':''}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Total Credits</label>
                <input type="number" className="form-input" value={form.total_credits} onChange={e => set('total_credits', e.target.value)} placeholder="e.g. 156" min={0}/>
              </div>
              <div className="form-group">
                <label className="form-label">Total Hours</label>
                <input type="number" className="form-input" value={form.total_hours} onChange={e => set('total_hours', e.target.value)} placeholder="e.g. 1400" min={0}/>
              </div>
              <div className="form-group form-span-2">
                <label className="form-label">Entry Requirement</label>
                <input className="form-input" value={form.entry_requirement} onChange={e => set('entry_requirement', e.target.value)} placeholder="e.g. Completed 9 Year Basic Education (9YBE)"/>
              </div>
              <div className="form-group form-span-2">
                <label className="form-label">Academic Year Started at This School</label>
                <input className="form-input" value={form.started_year} onChange={e => set('started_year', e.target.value)} placeholder="e.g. 2024-2025"/>
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving || !form.curriculum_code || !form.title}>
              {saving ? 'Creating…' : 'Create & Link Qualification'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const LEVEL_COLOR = { 1:'#0ea5e9',2:'#8b5cf6',3:'#f59e0b',4:'#10b981',5:'#ef4444',6:'#6366f1' };

export default function QualificationsPage() {
  const { can } = useAuth();
  const navigate = useNavigate();
  const [quals, setQuals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showLink, setShowLink] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const load = () => {
    setLoading(true);
    api.get('/school/qualifications').then(r => setQuals(r.data)).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const canManage = can('school_admin','headmaster','dos','super_admin');

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Qualifications</div>
          <div className="page-subtitle">{quals.length} qualification{quals.length!==1?'s':''} offered by this school</div>
        </div>

        {canManage && (
          <div style={{ position:'relative' }}>
            <button className="btn btn-primary" onClick={() => setShowMenu(m => !m)}>
              <Plus size={15}/> Add Qualification
            </button>

            {showMenu && (
              <>
                <div style={{ position:'fixed', inset:0, zIndex:99 }} onClick={() => setShowMenu(false)}/>
                <div style={{
                  position:'absolute', right:0, top:'100%', marginTop:6,
                  background:'var(--bg-2)', border:'1px solid var(--border)',
                  borderRadius:'var(--radius-lg)', boxShadow:'var(--shadow-md)',
                  minWidth:250, zIndex:100, overflow:'hidden',
                }}>
                  <button
                    onClick={() => { setShowMenu(false); setShowCreate(true); }}
                    style={{ display:'flex', alignItems:'center', gap:12, width:'100%', padding:'12px 16px', background:'none', border:'none', cursor:'pointer', textAlign:'left' }}
                    onMouseEnter={e => e.currentTarget.style.background='var(--bg-3)'}
                    onMouseLeave={e => e.currentTarget.style.background=''}
                  >
                    <div style={{ width:32, height:32, borderRadius:8, background:'var(--primary-bg)', border:'1px solid var(--primary-border)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      <PlusCircle size={15} color="var(--primary)"/>
                    </div>
                    <div>
                      <div style={{ fontWeight:600, fontSize:13 }}>Create New Qualification</div>
                      <div style={{ fontSize:11, color:'var(--text-3)' }}>Add one not yet in Shulink</div>
                    </div>
                  </button>

                  <div style={{ height:1, background:'var(--border)' }}/>

                  <button
                    onClick={() => { setShowMenu(false); setShowLink(true); }}
                    style={{ display:'flex', alignItems:'center', gap:12, width:'100%', padding:'12px 16px', background:'none', border:'none', cursor:'pointer', textAlign:'left' }}
                    onMouseEnter={e => e.currentTarget.style.background='var(--bg-3)'}
                    onMouseLeave={e => e.currentTarget.style.background=''}
                  >
                    <div style={{ width:32, height:32, borderRadius:8, background:'var(--blue-bg)', border:'1px solid #bfdbfe', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      <Link size={15} color="var(--blue)"/>
                    </div>
                    <div>
                      <div style={{ fontWeight:600, fontSize:13 }}>Link Existing Qualification</div>
                      <div style={{ fontSize:11, color:'var(--text-3)' }}>Pick from RTB list in Shulink</div>
                    </div>
                  </button>
                </div>
              </>
            )}
          </div>
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
          <p style={{ marginBottom:16 }}>Add your school's RTB qualifications to get started</p>
          {canManage && (
            <div style={{ display:'flex', gap:10, justifyContent:'center' }}>
              <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
                <PlusCircle size={14}/> Create New
              </button>
              <button className="btn btn-outline" onClick={() => setShowLink(true)}>
                <Link size={14}/> Link Existing
              </button>
            </div>
          )}
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(320px,1fr))', gap:16 }}>
          {quals.map(q => (
            <div
              key={q.id}
              className="card"
              style={{ cursor:'pointer', transition:'border-color .12s, box-shadow .12s' }}
              onClick={() => navigate(`/modules?qualification_id=${q.id}&title=${encodeURIComponent(q.title)}`)}
              onMouseEnter={e => { e.currentTarget.style.borderColor='var(--primary)'; e.currentTarget.style.boxShadow='var(--shadow-md)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor=''; e.currentTarget.style.boxShadow=''; }}
            >
              <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:12 }}>
                <div style={{
                  background:(LEVEL_COLOR[q.rqf_level]||'#888')+'22',
                  border:`1px solid ${(LEVEL_COLOR[q.rqf_level]||'#888')}44`,
                  color:LEVEL_COLOR[q.rqf_level]||'#888',
                  borderRadius:'var(--radius)', padding:'4px 10px',
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
                {[['Credits',q.total_credits],['Hours',q.total_hours],['Modules',q.module_count]].map(([label,val]) => (
                  <div key={label} style={{ background:'var(--bg-3)', border:'1px solid var(--border)', borderRadius:'var(--radius)', padding:'8px 10px', textAlign:'center' }}>
                    <div style={{ fontFamily:'var(--font-head)', fontSize:18, fontWeight:700 }}>{val}</div>
                    <div style={{ fontSize:10, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'.04em' }}>{label}</div>
                  </div>
                ))}
              </div>

              {q.started_year && <div style={{ fontSize:11, color:'var(--text-3)' }}>Started {q.started_year}</div>}

              <div style={{ display:'flex', alignItems:'center', justifyContent:'flex-end', marginTop:10 }}>
                <span style={{ fontSize:12, color:'var(--primary)', fontWeight:600, display:'flex', alignItems:'center', gap:4 }}>
                  View modules <ChevronRight size={12}/>
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {showLink && <LinkModal onClose={() => setShowLink(false)} onSaved={() => { setShowLink(false); load(); }}/>}
      {showCreate && <CreateModal onClose={() => setShowCreate(false)} onSaved={() => { setShowCreate(false); load(); }}/>}
    </div>
  );
}
