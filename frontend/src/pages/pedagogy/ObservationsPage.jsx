import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import { Plus, X, ChevronDown, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';

const DIMENSIONS = [
  { key:'preparation',        label:'Preparation',         desc:'Session plan ready, materials organised, objectives clear' },
  { key:'delivery',           label:'Delivery',            desc:'Clear explanation, appropriate methods, good pacing' },
  { key:'student_engagement', label:'Trainee Engagement',  desc:'Active participation, questions handled, attention maintained' },
  { key:'classroom_mgmt',     label:'Classroom Management',desc:'Time management, environment, discipline' },
  { key:'assessment_used',    label:'Assessment Used',     desc:'Formative assessment conducted, feedback given' },
];

function ScoreInput({ value, onChange }) {
  return (
    <div style={{ display:'flex', gap:5 }}>
      {[1,2,3,4,5].map(n => (
        <button key={n} type="button" onClick={() => onChange(n)} style={{
          width:32, height:32, borderRadius:7,
          border:`1.5px solid ${value >= n ? 'var(--primary)' : 'var(--border)'}`,
          background: value >= n ? 'var(--primary)' : 'var(--bg-2)',
          color: value >= n ? '#fff' : 'var(--text-3)',
          fontWeight:700, fontSize:13, cursor:'pointer', transition:'all .1s',
        }}>{n}</button>
      ))}
    </div>
  );
}

function ObservationModal({ obs, trainers, classes, modules, onClose, onSaved }) {
  const isNew = !obs?.id;
  const [form, setForm] = useState({
    trainer_id:'', class_id:'', module_id:'',
    observation_date: new Date().toISOString().split('T')[0],
    subject:'', preparation:0, delivery:0, student_engagement:0,
    classroom_mgmt:0, assessment_used:0,
    strengths:'', areas_to_improve:'', recommendations:'',
    ...(isNew ? {} : obs),
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const overall = Math.round(
    DIMENSIONS.reduce((s, d) => s + (parseInt(form[d.key]) || 0), 0) / DIMENSIONS.length
  );
  const scoreColor = s => s >= 4 ? 'var(--green)' : s >= 3 ? 'var(--amber)' : s >= 1 ? 'var(--red)' : 'var(--text-3)';

  const submit = async e => {
    e.preventDefault(); setSaving(true); setErr('');
    try {
      if (isNew) await api.post('/observations', form);
      else       await api.patch(`/observations/${obs.id}`, form);
      onSaved();
    } catch (er) { setErr(er.response?.data?.error || 'Failed'); }
    finally { setSaving(false); }
  };

  return (
    <div className="modal-overlay">
      <div className="modal modal-xl">
        <div className="modal-header">
          <h3>{isNew ? 'New Classroom Observation' : 'Edit Observation'}</h3>
          <button className="btn-icon" onClick={onClose}><X size={18}/></button>
        </div>
        <form onSubmit={submit}>
          <div className="modal-body">
            {err && <div className="alert alert-error">{err}</div>}

            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Trainer Observed *</label>
                <select className="form-select" value={form.trainer_id} onChange={e => set('trainer_id', e.target.value)} required>
                  <option value="">Select trainer…</option>
                  {trainers.map(t => <option key={t.id} value={t.id}>{t.full_name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Observation Date *</label>
                <input type="date" className="form-input" value={form.observation_date} onChange={e => set('observation_date', e.target.value)} required/>
              </div>
              <div className="form-group">
                <label className="form-label">Class</label>
                <select className="form-select" value={form.class_id || ''} onChange={e => set('class_id', e.target.value)}>
                  <option value="">Select class…</option>
                  {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Module</label>
                <select className="form-select" value={form.module_id || ''} onChange={e => set('module_id', e.target.value)}>
                  <option value="">Select module…</option>
                  {modules.map(m => <option key={m.id} value={m.id}>[{m.code}] {m.name}</option>)}
                </select>
              </div>
              <div className="form-group form-span-2">
                <label className="form-label">Topic / Subject Observed</label>
                <input className="form-input" value={form.subject || ''} onChange={e => set('subject', e.target.value)} placeholder="e.g. Git branching and merging"/>
              </div>
            </div>

            {/* Scoring rubric */}
            <div style={{ background:'var(--bg-3)', border:'1px solid var(--border)', borderRadius:'var(--radius)', padding:'16px' }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
                <div style={{ fontSize:12, fontWeight:700, color:'var(--text-2)', textTransform:'uppercase', letterSpacing:'.05em' }}>
                  Observation Rubric — 1 (Poor) to 5 (Excellent)
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <span style={{ fontSize:12, color:'var(--text-3)' }}>Overall:</span>
                  <span style={{ fontFamily:'var(--font-head)', fontSize:24, fontWeight:800, color:scoreColor(overall) }}>{overall || '—'}/5</span>
                </div>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {DIMENSIONS.map(dim => (
                  <div key={dim.key} style={{ display:'flex', alignItems:'center', gap:16, padding:'10px 14px', background:'var(--bg-2)', borderRadius:'var(--radius)', border:'1px solid var(--border)' }}>
                    <div style={{ flex:1 }}>
                      <div style={{ fontWeight:600, fontSize:13 }}>{dim.label}</div>
                      <div style={{ fontSize:11, color:'var(--text-3)' }}>{dim.desc}</div>
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <ScoreInput value={form[dim.key]} onChange={v => set(dim.key, v)}/>
                      <span style={{ fontFamily:'var(--font-head)', fontSize:20, fontWeight:800, color:scoreColor(form[dim.key]), minWidth:24, textAlign:'center' }}>
                        {form[dim.key] || '—'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Strengths Observed</label>
              <textarea className="form-textarea" value={form.strengths || ''} onChange={e => set('strengths', e.target.value)} placeholder="What the trainer did well…" style={{ minHeight:70 }}/>
            </div>
            <div className="form-group">
              <label className="form-label">Areas to Improve</label>
              <textarea className="form-textarea" value={form.areas_to_improve || ''} onChange={e => set('areas_to_improve', e.target.value)} placeholder="Specific improvements needed…" style={{ minHeight:70 }}/>
            </div>
            <div className="form-group">
              <label className="form-label">Recommendations</label>
              <textarea className="form-textarea" value={form.recommendations || ''} onChange={e => set('recommendations', e.target.value)} placeholder="Actions for the trainer to take…" style={{ minHeight:60 }}/>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : isNew ? 'Save Observation' : 'Update'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ObsCard({ obs, canEdit, onEdit }) {
  const [open, setOpen] = useState(false);
  const scoreColor = s => s >= 4 ? 'var(--green)' : s >= 3 ? 'var(--amber)' : s >= 1 ? 'var(--red)' : 'var(--text-3)';

  return (
    <div style={{ border:'1px solid var(--border)', borderRadius:'var(--radius-lg)', overflow:'hidden', background:'var(--bg-2)' }}>
      <div onClick={() => setOpen(o => !o)} style={{ display:'flex', alignItems:'center', gap:14, padding:'14px 18px', cursor:'pointer' }}>
        {/* Score circle */}
        <div style={{ width:46, height:46, borderRadius:12, background: obs.overall_score>=4?'var(--green-bg)':obs.overall_score>=3?'var(--amber-bg)':'#fee2e2', border:`2px solid ${scoreColor(obs.overall_score)}`, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
          <div style={{ fontFamily:'var(--font-head)', fontSize:17, fontWeight:800, color:scoreColor(obs.overall_score), lineHeight:1 }}>{obs.overall_score}</div>
          <div style={{ fontSize:9, color:scoreColor(obs.overall_score), fontWeight:600 }}>/5</div>
        </div>

        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontWeight:600, fontSize:14 }}>{obs.trainer_name}</div>
          <div style={{ fontSize:12, color:'var(--text-3)', display:'flex', gap:12, marginTop:2, flexWrap:'wrap' }}>
            {obs.subject && <span>{obs.subject}</span>}
            {obs.class_name && <span>{obs.class_name}</span>}
            {obs.module_code && <span style={{ fontFamily:'monospace', color:'var(--primary)' }}>{obs.module_code}</span>}
            <span>by {obs.observer_name}</span>
            {obs.observation_date && <span>{format(new Date(obs.observation_date), 'dd MMM yyyy')}</span>}
          </div>
        </div>

        {/* Mini dimension bars */}
        <div style={{ display:'flex', gap:4, alignItems:'flex-end', height:28, flexShrink:0 }}>
          {DIMENSIONS.map(d => (
            <div key={d.key} style={{ width:8, background:scoreColor(obs[d.key]), borderRadius:3, height:`${(obs[d.key]||0)/5*100}%`, minHeight:4 }} title={d.label}/>
          ))}
        </div>

        {canEdit && (
          <button className="btn-icon" onClick={e => { e.stopPropagation(); onEdit(obs); }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
        )}
        {open ? <ChevronDown size={15} color="var(--text-3)"/> : <ChevronRight size={15} color="var(--text-3)"/>}
      </div>

      {open && (
        <div style={{ borderTop:'1px solid var(--border)', padding:'16px 20px', background:'var(--bg)', display:'flex', flexDirection:'column', gap:14 }}>
          {/* Dimension breakdown */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:8 }}>
            {DIMENSIONS.map(d => (
              <div key={d.key} style={{ background:'var(--bg-2)', border:'1px solid var(--border)', borderRadius:'var(--radius)', padding:'10px 8px', textAlign:'center' }}>
                <div style={{ fontFamily:'var(--font-head)', fontSize:22, fontWeight:800, color:scoreColor(obs[d.key]) }}>{obs[d.key] || 0}</div>
                <div style={{ fontSize:10, color:'var(--text-3)', marginTop:2, lineHeight:1.3 }}>{d.label}</div>
              </div>
            ))}
          </div>

          {[
            { label:'Strengths',        key:'strengths',        bg:'var(--green-bg)', border:'#a7f3d0', text:'var(--green)' },
            { label:'Areas to Improve', key:'areas_to_improve', bg:'#fff7ed',         border:'#fed7aa', text:'var(--orange)' },
            { label:'Recommendations',  key:'recommendations',  bg:'var(--primary-bg)',border:'var(--primary-border)', text:'var(--primary)' },
          ].filter(s => obs[s.key]).map(s => (
            <div key={s.key} style={{ background:s.bg, border:`1px solid ${s.border}`, borderRadius:'var(--radius)', padding:'12px 14px' }}>
              <div style={{ fontSize:11, fontWeight:700, color:s.text, textTransform:'uppercase', letterSpacing:'.05em', marginBottom:4 }}>{s.label}</div>
              <div style={{ fontSize:13, lineHeight:1.7 }}>{obs[s.key]}</div>
            </div>
          ))}

          {obs.trainer_response && (
            <div style={{ background:'var(--blue-bg)', border:'1px solid #bfdbfe', borderRadius:'var(--radius)', padding:'12px 14px' }}>
              <div style={{ fontSize:11, fontWeight:700, color:'#1e40af', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:4 }}>Trainer Response</div>
              <div style={{ fontSize:13, lineHeight:1.7 }}>{obs.trainer_response}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ObservationsPage() {
  const { can } = useAuth();
  const [obs, setObs]           = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [classes, setClasses]   = useState([]);
  const [modules, setModules]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [filterTrainer, setFilterTrainer] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editObs, setEditObs]   = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterTrainer) params.trainer_id = filterTrainer;
      const [o, u, c, m] = await Promise.all([
        api.get('/observations', { params }),
        api.get('/users'),
        api.get('/classes'),
        api.get('/modules'),
      ]);
      setObs(o.data);
      setTrainers(u.data.filter(u => u.role === 'trainer' && u.is_active));
      setClasses(c.data);
      setModules(m.data);
    } catch(e) { console.error(e); }
    finally { setLoading(false); }
  }, [filterTrainer]);

  useEffect(() => { load(); }, [load]);

  const avgScore = obs.length
    ? (obs.reduce((s, o) => s + (o.overall_score || 0), 0) / obs.length).toFixed(1)
    : null;

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Classroom Observations</div>
          <div className="page-subtitle">
            {obs.length} observation{obs.length !== 1 ? 's' : ''}
            {avgScore && <> · Average score: <strong style={{ color:'var(--teal)' }}>{avgScore}/5</strong></>}
          </div>
        </div>
        {can('school_admin','headmaster','dos','hod') && (
          <button className="btn btn-primary" onClick={() => { setEditObs(null); setShowModal(true); }}>
            <Plus size={15}/> New Observation
          </button>
        )}
      </div>

      <div className="filters-bar">
        <select className="filter-input" style={{ minWidth:180 }} value={filterTrainer} onChange={e => setFilterTrainer(e.target.value)}>
          <option value="">All Trainers</option>
          {trainers.map(t => <option key={t.id} value={t.id}>{t.full_name}</option>)}
        </select>
      </div>

      {/* Average per dimension */}
      {obs.length > 0 && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:10, marginBottom:18 }}>
          {DIMENSIONS.map(d => {
            const avg = (obs.reduce((s, o) => s + (o[d.key] || 0), 0) / obs.length).toFixed(1);
            const color = parseFloat(avg) >= 4 ? 'var(--green)' : parseFloat(avg) >= 3 ? 'var(--amber)' : 'var(--red)';
            return (
              <div key={d.key} className="card-sm" style={{ textAlign:'center' }}>
                <div style={{ fontFamily:'var(--font-head)', fontSize:24, fontWeight:800, color }}>{avg}</div>
                <div style={{ fontSize:11, color:'var(--text-3)', marginTop:2 }}>{d.label}</div>
              </div>
            );
          })}
        </div>
      )}

      {loading ? (
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {[1,2,3].map(i => <div key={i} className="card skeleton" style={{ height:72 }}/>)}
        </div>
      ) : obs.length === 0 ? (
        <div className="empty-state">
          <h4>No observations yet</h4>
          {can('school_admin','headmaster','dos','hod') && (
            <>
              <p style={{ marginBottom:16 }}>Start observing trainers in their sessions</p>
              <button className="btn btn-primary" onClick={() => setShowModal(true)}><Plus size={14}/> New Observation</button>
            </>
          )}
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {obs.map(o => (
            <ObsCard key={o.id} obs={o} canEdit={can('school_admin','headmaster','dos','hod')} onEdit={o => { setEditObs(o); setShowModal(true); }}/>
          ))}
        </div>
      )}

      {showModal && (
        <ObservationModal
          obs={editObs}
          trainers={trainers}
          classes={classes}
          modules={modules}
          onClose={() => { setShowModal(false); setEditObs(null); }}
          onSaved={() => { setShowModal(false); setEditObs(null); load(); }}
        />
      )}
    </div>
  );
}
