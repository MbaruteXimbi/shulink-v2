import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import { Plus, X, ChevronDown, ChevronRight, Edit2, Send } from 'lucide-react';
import { format } from 'date-fns';

function SessionPlanModal({ plan, schemes, onClose, onSaved }) {
  const isNew = !plan?.id;
  const [form, setForm] = useState({
    scheme_id: '', learning_outcome_id: '', week_number: 1,
    lesson_date: '', topic: '', duration_mins: 60,
    objectives: '', resources: '',
    introduction: '', development: '', conclusion: '',
    assessment_method: '', references_used: '', trainee_notes: '',
    ...(isNew ? {} : plan),
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const [los, setLos] = useState([]);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  useEffect(() => {
    if (!form.scheme_id) { setLos([]); return; }
    const scheme = schemes.find(s => s.id === form.scheme_id);
    if (scheme?.module_id) {
      api.get('/learning-outcomes', { params: { module_id: scheme.module_id } })
        .then(r => setLos(r.data)).catch(() => setLos([]));
    } else setLos([]);
  }, [form.scheme_id, schemes]);

  const submit = async e => {
    e.preventDefault(); setSaving(true); setErr('');
    try {
      if (isNew) await api.post('/session-plans', form);
      else       await api.patch(`/session-plans/${plan.id}`, form);
      onSaved();
    } catch (er) { setErr(er.response?.data?.error || 'Failed to save'); }
    finally { setSaving(false); }
  };

  return (
    <div className="modal-overlay">
      <div className="modal modal-xl">
        <div className="modal-header">
          <h3>{isNew ? 'New Session Plan' : 'Edit Session Plan'}</h3>
          <button className="btn-icon" onClick={onClose}><X size={18}/></button>
        </div>
        <form onSubmit={submit}>
          <div className="modal-body">
            {err && <div className="alert alert-error">{err}</div>}

            {/* Header info */}
            <div style={{ background:'var(--primary-bg)', border:'1px solid var(--primary-border)', borderRadius:'var(--radius)', padding:'14px 16px' }}>
              <div style={{ fontSize:11, fontWeight:700, color:'var(--primary)', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:10 }}>
                Session Plan — Header Information
              </div>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Scheme of Work *</label>
                  <select className="form-select" value={form.scheme_id} onChange={e => set('scheme_id', e.target.value)} required>
                    <option value="">Select scheme…</option>
                    {schemes.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.module_code ? `[${s.module_code}] ` : ''}{s.subject} — {s.class_name || 'No class'}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Learning Outcome</label>
                  <select className="form-select" value={form.learning_outcome_id || ''} onChange={e => set('learning_outcome_id', e.target.value)}>
                    <option value="">Select LO…</option>
                    {los.map(lo => <option key={lo.id} value={lo.id}>LO{lo.number}: {lo.title}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Week Number *</label>
                  <input type="number" className="form-input" value={form.week_number} onChange={e => set('week_number', parseInt(e.target.value) || 1)} min={1} required/>
                </div>
                <div className="form-group">
                  <label className="form-label">Session Date</label>
                  <input type="date" className="form-input" value={form.lesson_date || ''} onChange={e => set('lesson_date', e.target.value)}/>
                </div>
                <div className="form-group form-span-2">
                  <label className="form-label">Topic *</label>
                  <input className="form-input" value={form.topic} onChange={e => set('topic', e.target.value)} required placeholder="e.g. Introduction to Git and Version Control"/>
                </div>
                <div className="form-group">
                  <label className="form-label">Duration (minutes)</label>
                  <input type="number" className="form-input" value={form.duration_mins} onChange={e => set('duration_mins', parseInt(e.target.value) || 60)} min={10}/>
                </div>
                <div className="form-group">
                  <label className="form-label">Resources / Materials</label>
                  <input className="form-input" value={form.resources || ''} onChange={e => set('resources', e.target.value)} placeholder="Computer, projector, GitHub account…"/>
                </div>
              </div>
            </div>

            {/* SMART Objectives */}
            <div className="form-group">
              <label className="form-label">
                Learning Objectives
                <span style={{ fontSize:11, color:'var(--text-3)', fontWeight:400, marginLeft:8 }}>By end of session, trainees will be able to…</span>
              </label>
              <textarea className="form-textarea" value={form.objectives || ''} onChange={e => set('objectives', e.target.value)}
                placeholder={"1. Install and configure Git on their computer\n2. Create a local repository using git init\n3. Commit files to the local repository"}
                style={{ minHeight:80 }}/>
            </div>

            {/* 3-phase delivery */}
            <div style={{ background:'var(--bg-3)', border:'1px solid var(--border)', borderRadius:'var(--radius)', padding:'14px 16px' }}>
              <div style={{ fontSize:11, fontWeight:700, color:'var(--text-2)', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:14 }}>
                Session Delivery — 3 Phases
              </div>
              {[
                { num:1, label:'Introduction', key:'introduction', hint:'Link to prior knowledge · Motivating activity · Session overview', color:'var(--blue)' },
                { num:2, label:'Development', key:'development',  hint:'Main content · Trainer activities · Trainee activities · Practical work', color:'var(--teal)' },
                { num:3, label:'Conclusion',  key:'conclusion',   hint:'Summary · Formative check · Link to next session', color:'var(--purple)' },
              ].map(p => (
                <div key={p.key} className="form-group" style={{ marginBottom:12 }}>
                  <label className="form-label">
                    <span style={{ background:p.color, color:'#fff', borderRadius:4, padding:'1px 7px', fontSize:11, fontWeight:700, marginRight:6 }}>{p.num}</span>
                    {p.label}
                    <span style={{ fontSize:11, color:'var(--text-3)', fontWeight:400, marginLeft:8 }}>{p.hint}</span>
                  </label>
                  <textarea className="form-textarea" value={form[p.key] || ''} onChange={e => set(p.key, e.target.value)}
                    style={{ minHeight: p.key === 'development' ? 110 : 80 }}/>
                </div>
              ))}
            </div>

            {/* Assessment + References */}
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Assessment Method</label>
                <input className="form-input" value={form.assessment_method || ''} onChange={e => set('assessment_method', e.target.value)} placeholder="e.g. Practical: submit GitHub repo link"/>
              </div>
              <div className="form-group">
                <label className="form-label">References</label>
                <input className="form-input" value={form.references_used || ''} onChange={e => set('references_used', e.target.value)} placeholder="e.g. Chacon, S. (2014). Pro Git. Apress."/>
              </div>
            </div>

            {/* Trainee preparation notes */}
            <div className="form-group" style={{ marginTop: 4 }}>
              <label className="form-label">
                Trainee Preparation Notes
                <span style={{ fontSize:11, color:'var(--text-3)', fontWeight:400, marginLeft:8 }}>
                  Trainees will be notified with these instructions when you submit this plan
                </span>
              </label>
              <textarea
                className="form-textarea"
                value={form.trainee_notes || ''}
                onChange={e => set('trainee_notes', e.target.value)}
                placeholder={"Read Chapter 3 of Pro Git on branching\nWatch: git branch tutorial on YouTube\nBring your laptop fully charged"}
                style={{ minHeight: 72, borderColor: form.trainee_notes ? 'var(--teal)' : undefined }}
              />
              {form.trainee_notes && (
                <div style={{ fontSize:11, color:'var(--teal)', marginTop:4, display:'flex', alignItems:'center', gap:4 }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 2L11 13"/><path d="M22 2L15 22 11 13 2 9l20-7z"/></svg>
                  Trainees will be notified when you submit this plan
                </div>
              )}
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving…' : isNew ? 'Create Session Plan' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function SessionPlanCard({ plan, canEdit, onEdit, onRefresh }) {
  const [open, setOpen] = useState(false);

  const addReflection = async () => {
    const text = prompt('Add self-reflection notes:');
    if (!text) return;
    await api.patch(`/session-plans/${plan.id}`, { self_reflection: text });
    onRefresh();
  };

  const submit = async () => {
    if (!confirm('Submit this session plan for review?')) return;
    await api.patch(`/session-plans/${plan.id}`, { status: 'submitted' });
    onRefresh();
  };

  return (
    <div style={{ border:'1px solid var(--border)', borderRadius:'var(--radius-lg)', overflow:'hidden', background:'var(--bg-2)' }}>
      <div onClick={() => setOpen(o => !o)} style={{ display:'flex', alignItems:'center', gap:12, padding:'13px 18px', cursor:'pointer' }}>
        {/* Week badge */}
        <div style={{ width:34, height:34, borderRadius:8, background:'var(--primary-bg)', border:'1px solid var(--primary-border)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:800, color:'var(--primary)', flexShrink:0 }}>
          W{plan.week_number}
        </div>

        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontWeight:600, fontSize:14, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{plan.topic}</div>
          <div style={{ fontSize:11, color:'var(--text-3)', marginTop:2, display:'flex', gap:12, flexWrap:'wrap' }}>
            {plan.lo_title && <span>LO{plan.lo_number}: {plan.lo_title}</span>}
            {plan.lesson_date && <span>{format(new Date(plan.lesson_date), 'dd MMM yyyy')}</span>}
            <span>{plan.duration_mins} min</span>
            {plan.trainer_name && <span>{plan.trainer_name}</span>}
          </div>
        </div>

        <span className={`badge badge-${plan.status}`}>{plan.status}</span>

        <div className="flex gap-1" onClick={e => e.stopPropagation()}>
          {canEdit && plan.status === 'draft' && (
            <>
              <button className="btn-icon" onClick={() => onEdit(plan)}><Edit2 size={13}/></button>
              <button className="btn btn-sm btn-primary" onClick={submit}><Send size={11}/> Submit</button>
            </>
          )}
        </div>

        {open ? <ChevronDown size={15} color="var(--text-3)"/> : <ChevronRight size={15} color="var(--text-3)"/>}
      </div>

      {open && (
        <div style={{ borderTop:'1px solid var(--border)', padding:'16px 20px', background:'var(--bg)', display:'flex', flexDirection:'column', gap:14 }}>
          {plan.objectives && (
            <div>
              <div style={{ fontSize:11, fontWeight:700, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:6 }}>Learning Objectives</div>
              <div style={{ fontSize:13, color:'var(--text-2)', lineHeight:1.7, whiteSpace:'pre-line' }}>{plan.objectives}</div>
            </div>
          )}

          {[
            { num:1, label:'Introduction', key:'introduction', color:'var(--blue)' },
            { num:2, label:'Development',  key:'development',  color:'var(--teal)' },
            { num:3, label:'Conclusion',   key:'conclusion',   color:'var(--purple)' },
          ].filter(p => plan[p.key]).map(phase => (
            <div key={phase.key}>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
                <span style={{ background:phase.color, color:'#fff', borderRadius:4, padding:'1px 7px', fontSize:11, fontWeight:700 }}>{phase.num}</span>
                <span style={{ fontSize:12, fontWeight:700, color:'var(--text-2)' }}>{phase.label}</span>
              </div>
              <div style={{ fontSize:13, color:'var(--text-2)', lineHeight:1.7, whiteSpace:'pre-line', paddingLeft:26 }}>{plan[phase.key]}</div>
            </div>
          ))}

          <div className="form-grid">
            {plan.assessment_method && (
              <div style={{ background:'var(--bg-2)', border:'1px solid var(--border)', borderRadius:'var(--radius)', padding:'10px 12px' }}>
                <div style={{ fontSize:10, fontWeight:700, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:4 }}>Assessment</div>
                <div style={{ fontSize:13 }}>{plan.assessment_method}</div>
              </div>
            )}
            {plan.resources && (
              <div style={{ background:'var(--bg-2)', border:'1px solid var(--border)', borderRadius:'var(--radius)', padding:'10px 12px' }}>
                <div style={{ fontSize:10, fontWeight:700, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:4 }}>Resources</div>
                <div style={{ fontSize:13 }}>{plan.resources}</div>
              </div>
            )}
          </div>

          {plan.references_used && (
            <div>
              <div style={{ fontSize:11, fontWeight:700, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:4 }}>References</div>
              <div style={{ fontSize:12, color:'var(--text-2)', fontStyle:'italic' }}>{plan.references_used}</div>
            </div>
          )}

          {plan.trainee_notes && (
            <div style={{ background:'var(--teal-bg)', border:'1px solid #99f6e4', borderRadius:'var(--radius)', padding:'10px 14px' }}>
              <div style={{ fontSize:11, fontWeight:700, color:'var(--teal)', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:4, display:'flex', alignItems:'center', gap:6 }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 2L11 13"/><path d="M22 2L15 22 11 13 2 9l20-7z"/></svg>
                Trainee Preparation Notes
              </div>
              <div style={{ fontSize:13, lineHeight:1.7, whiteSpace:'pre-line' }}>{plan.trainee_notes}</div>
            </div>
          )}

          {plan.self_reflection ? (
            <div style={{ background:'#fef9c3', border:'1px solid #fde68a', borderRadius:'var(--radius)', padding:'10px 14px' }}>
              <div style={{ fontSize:11, fontWeight:700, color:'#92400e', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:4 }}>Self-Reflection</div>
              <div style={{ fontSize:13, color:'#78350f' }}>{plan.self_reflection}</div>
            </div>
          ) : canEdit && (
            <button className="btn btn-outline btn-sm" style={{ alignSelf:'flex-start' }} onClick={addReflection}>
              + Add self-reflection
            </button>
          )}

          {plan.dos_feedback && (
            <div style={{ background:'var(--blue-bg)', border:'1px solid #bfdbfe', borderRadius:'var(--radius)', padding:'10px 14px' }}>
              <div style={{ fontSize:11, fontWeight:700, color:'#1e40af', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:4 }}>DOS Feedback</div>
              <div style={{ fontSize:13, color:'#1e3a8a' }}>{plan.dos_feedback}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function SessionPlansPage() {
  const { can, user } = useAuth();
  const [plans, setPlans]     = useState([]);
  const [schemes, setSchemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterScheme, setFilterScheme] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editPlan, setEditPlan]   = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterScheme) params.scheme_id = filterScheme;
      const [p, s] = await Promise.all([
        api.get('/session-plans', { params }),
        api.get('/schemes'),
      ]);
      setPlans(p.data);
      setSchemes(s.data);
    } catch(e) { console.error(e); }
    finally { setLoading(false); }
  }, [filterScheme]);

  useEffect(() => { load(); }, [load]);

  const filtered = filterStatus ? plans.filter(p => p.status === filterStatus) : plans;

  const grouped = {};
  filtered.forEach(p => {
    const key = p.scheme_id || 'none';
    if (!grouped[key]) grouped[key] = { label: p.subject || 'No scheme', plans: [] };
    grouped[key].plans.push(p);
  });

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Session Plans</div>
          <div className="page-subtitle">{plans.length} session plan{plans.length !== 1 ? 's' : ''}</div>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditPlan(null); setShowModal(true); }}>
          <Plus size={15}/> New Session Plan
        </button>
      </div>

      <div className="filters-bar">
        <select className="filter-input" style={{ minWidth:220 }} value={filterScheme} onChange={e => setFilterScheme(e.target.value)}>
          <option value="">All Schemes</option>
          {schemes.map(s => <option key={s.id} value={s.id}>{s.module_code ? `[${s.module_code}] ` : ''}{s.subject}</option>)}
        </select>
        <div className="flex gap-2">
          {['', 'draft', 'submitted', 'reviewed'].map(st => (
            <button key={st} className={`btn btn-sm ${filterStatus === st ? 'btn-primary' : 'btn-outline'}`} onClick={() => setFilterStatus(st)}>
              {st ? st.charAt(0).toUpperCase() + st.slice(1) : 'All'}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:18 }}>
        {[
          { label:'Total',     val:plans.length,                                    color:'var(--text)' },
          { label:'Draft',     val:plans.filter(p=>p.status==='draft').length,     color:'var(--text-3)' },
          { label:'Submitted', val:plans.filter(p=>p.status==='submitted').length, color:'var(--blue)' },
          { label:'Reviewed',  val:plans.filter(p=>p.status==='reviewed').length,  color:'var(--green)' },
        ].map(s => (
          <div key={s.label} className="card-sm">
            <div style={{ fontFamily:'var(--font-head)', fontSize:26, fontWeight:800, color:s.color }}>{s.val}</div>
            <div style={{ fontSize:11, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'.05em' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {loading ? (
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {[1,2,3].map(i => <div key={i} className="card skeleton" style={{ height:64 }}/>)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <h4>No session plans yet</h4>
          <p style={{ marginBottom:16 }}>You need an approved scheme of work first, then create session plans linked to it.</p>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}><Plus size={14}/> New Session Plan</button>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
          {Object.entries(grouped).map(([schemeId, group]) => (
            <div key={schemeId}>
              {Object.keys(grouped).length > 1 && (
                <div style={{ fontSize:13, fontWeight:700, color:'var(--text-2)', marginBottom:8, paddingBottom:6, borderBottom:'1px solid var(--border)' }}>
                  {group.label}
                </div>
              )}
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {group.plans
                  .sort((a, b) => a.week_number - b.week_number)
                  .map(plan => (
                    <SessionPlanCard
                      key={plan.id}
                      plan={plan}
                      canEdit={can('trainer','dos','school_admin','headmaster')}
                      onEdit={p => { setEditPlan(p); setShowModal(true); }}
                      onRefresh={load}
                    />
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <SessionPlanModal
          plan={editPlan}
          schemes={schemes}
          onClose={() => { setShowModal(false); setEditPlan(null); }}
          onSaved={() => { setShowModal(false); setEditPlan(null); load(); }}
        />
      )}
    </div>
  );
}
