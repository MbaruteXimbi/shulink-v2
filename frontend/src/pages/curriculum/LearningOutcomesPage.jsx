import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import { Plus, X, ChevronDown, ChevronRight, Trash2 } from 'lucide-react';

function LOModal({ moduleId, onClose, onSaved }) {
  const [form, setForm] = useState({
    number: 1, title: '', learning_hours: 0,
    indicative_content: '', resources_equipment: '', resources_materials: '',
    resources_tools: '', facilitation_techniques: '', formative_methods: '',
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async e => {
    e.preventDefault(); setSaving(true); setErr('');
    try {
      const indicative_content = form.indicative_content
        .split('\n').map(l => l.trim()).filter(Boolean);
      const resources = {
        equipment: form.resources_equipment.split(',').map(s => s.trim()).filter(Boolean),
        materials: form.resources_materials.split(',').map(s => s.trim()).filter(Boolean),
        tools: form.resources_tools.split(',').map(s => s.trim()).filter(Boolean),
      };
      await api.post('/learning-outcomes', {
        module_id: moduleId, number: form.number, title: form.title,
        learning_hours: form.learning_hours, indicative_content, resources,
        facilitation_techniques: form.facilitation_techniques,
        formative_methods: form.formative_methods,
      });
      onSaved();
    } catch (er) { setErr(er.response?.data?.error || 'Failed'); }
    finally { setSaving(false); }
  };

  return (
    <div className="modal-overlay">
      <div className="modal modal-xl">
        <div className="modal-header">
          <h3>Add Learning Outcome</h3>
          <button className="btn-icon" onClick={onClose}><X size={18}/></button>
        </div>
        <form onSubmit={submit}>
          <div className="modal-body">
            {err && <div className="alert alert-error">{err}</div>}
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">LO Number *</label>
                <input type="number" className="form-input" value={form.number} onChange={e => set('number', parseInt(e.target.value)||1)} min={1}/>
              </div>
              <div className="form-group">
                <label className="form-label">Learning Hours</label>
                <input type="number" className="form-input" value={form.learning_hours} onChange={e => set('learning_hours', parseInt(e.target.value)||0)} min={0}/>
              </div>
              <div className="form-group form-span-2">
                <label className="form-label">LO Title * (verb phrase, e.g. "Setup repository")</label>
                <input className="form-input" value={form.title} onChange={e => set('title', e.target.value)} required placeholder="e.g. Setup repository"/>
              </div>
              <div className="form-group form-span-2">
                <label className="form-label">Indicative Content (one item per line)</label>
                <textarea className="form-textarea" value={form.indicative_content} onChange={e => set('indicative_content', e.target.value)} placeholder="Definition of version control&#10;Types of VCS&#10;Benefits of version control&#10;Git basic concepts" style={{ minHeight: 120 }}/>
              </div>
              <div className="form-group">
                <label className="form-label">Equipment (comma separated)</label>
                <input className="form-input" value={form.resources_equipment} onChange={e => set('resources_equipment', e.target.value)} placeholder="Computer, Projector, Whiteboard"/>
              </div>
              <div className="form-group">
                <label className="form-label">Materials (comma separated)</label>
                <input className="form-input" value={form.resources_materials} onChange={e => set('resources_materials', e.target.value)} placeholder="Internet, Electricity, Marker pen"/>
              </div>
              <div className="form-group form-span-2">
                <label className="form-label">Tools (comma separated)</label>
                <input className="form-input" value={form.resources_tools} onChange={e => set('resources_tools', e.target.value)} placeholder="Git, GitHub, VS Code, Terminal"/>
              </div>
              <div className="form-group">
                <label className="form-label">Facilitation Techniques</label>
                <input className="form-input" value={form.facilitation_techniques} onChange={e => set('facilitation_techniques', e.target.value)} placeholder="Demonstration, Group work, Practical exercise"/>
              </div>
              <div className="form-group">
                <label className="form-label">Formative Assessment Methods</label>
                <input className="form-input" value={form.formative_methods} onChange={e => set('formative_methods', e.target.value)} placeholder="Written assessment, Performance assessment"/>
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Add Learning Outcome'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function CriteriaModal({ loId, onClose, onSaved }) {
  const [form, setForm] = useState({ element_of_competency: '', criteria_text: '', indicators: '' });
  const [saving, setSaving] = useState(false);
  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  const submit = async e => {
    e.preventDefault();
    setSaving(true);
    try {
      const indicators = form.indicators.split('\n').map(l=>l.trim()).filter(Boolean);
      await api.post('/performance-criteria', {
        learning_outcome_id: loId,
        element_of_competency: form.element_of_competency,
        criteria_text: form.criteria_text,
        indicators,
      });
      onSaved();
    } catch {}
    finally { setSaving(false); }
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h3>Add Performance Criterion</h3>
          <button className="btn-icon" onClick={onClose}><X size={18}/></button>
        </div>
        <form onSubmit={submit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Element of Competency</label>
              <input className="form-input" value={form.element_of_competency} onChange={e=>set('element_of_competency',e.target.value)} placeholder="e.g. Setup repository"/>
            </div>
            <div className="form-group">
              <label className="form-label">Criteria Text *</label>
              <textarea className="form-textarea" value={form.criteria_text} onChange={e=>set('criteria_text',e.target.value)} required placeholder="e.g. Git is properly initiated based on Git commands"/>
            </div>
            <div className="form-group">
              <label className="form-label">Indicators / Yes-No Checklist (one per line)</label>
              <textarea className="form-textarea" value={form.indicators} onChange={e=>set('indicators',e.target.value)} placeholder="Git setup is installed&#10;Git is configured" style={{ minHeight:80 }}/>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving?'Saving…':'Add Criterion'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function LOCard({ lo, canEdit, onRefresh }) {
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [showCriteriaModal, setShowCriteriaModal] = useState(false);

  const loadDetail = async () => {
    if (detail) { setOpen(!open); return; }
    setLoadingDetail(true);
    try {
      const r = await api.get(`/learning-outcomes/${lo.id}`);
      setDetail(r.data);
      setOpen(true);
    } finally { setLoadingDetail(false); }
  };

  const deleteCriteria = async (id) => {
    if (!confirm('Delete this criterion?')) return;
    await api.delete(`/performance-criteria/${id}`);
    const r = await api.get(`/learning-outcomes/${lo.id}`);
    setDetail(r.data);
  };

  const content = detail?.indicative_content ? (
    Array.isArray(detail.indicative_content) ? detail.indicative_content : JSON.parse(detail.indicative_content)
  ) : [];

  const resources = detail?.resources ? (
    typeof detail.resources === 'string' ? JSON.parse(detail.resources) : detail.resources
  ) : {};

  return (
    <div style={{ border:'1px solid var(--border)', borderRadius:'var(--radius-lg)', overflow:'hidden', background:'var(--bg-2)' }}>
      {/* Header */}
      <div
        onClick={loadDetail}
        style={{ display:'flex', alignItems:'center', gap:12, padding:'14px 18px', cursor:'pointer', transition:'background .1s' }}
      >
        <div className="lo-number">LO{lo.number}</div>
        <div style={{ flex:1 }}>
          <div style={{ fontWeight:600, fontSize:14 }}>{lo.title}</div>
          <div style={{ fontSize:12, color:'var(--text-3)', marginTop:2 }}>
            {lo.learning_hours}h · {lo.criteria_count} performance criteria
          </div>
        </div>
        {loadingDetail
          ? <div className="skeleton" style={{ width:20, height:20, borderRadius:'50%' }}/>
          : open ? <ChevronDown size={16} color="var(--text-3)"/> : <ChevronRight size={16} color="var(--text-3)"/>
        }
      </div>

      {/* Expanded detail */}
      {open && detail && (
        <div style={{ borderTop:'1px solid var(--border)', padding:'16px 18px', background:'var(--bg)', display:'flex', flexDirection:'column', gap:16 }}>
          {/* Indicative content */}
          {content.length > 0 && (
            <div>
              <div className="form-label mb-2">Indicative Content</div>
              <ul style={{ paddingLeft:18, display:'flex', flexDirection:'column', gap:4 }}>
                {content.map((item, i) => (
                  <li key={i} style={{ fontSize:13, color:'var(--text-2)' }}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Resources */}
          {(resources.equipment?.length || resources.materials?.length || resources.tools?.length) > 0 && (
            <div>
              <div className="form-label mb-2">Resources</div>
              <div className="form-grid-3">
                {[['Equipment', resources.equipment], ['Materials', resources.materials], ['Tools', resources.tools]].map(([label, items]) => items?.length ? (
                  <div key={label} style={{ background:'var(--bg-2)', border:'1px solid var(--border)', borderRadius:'var(--radius)', padding:'10px 12px' }}>
                    <div style={{ fontSize:10, fontWeight:700, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:6 }}>{label}</div>
                    {items.map((it, i) => <div key={i} style={{ fontSize:12, color:'var(--text-2)' }}>• {it}</div>)}
                  </div>
                ) : null)}
              </div>
            </div>
          )}

          {/* Facilitation + Formative */}
          {(detail.facilitation_techniques || detail.formative_methods) && (
            <div className="form-grid">
              {detail.facilitation_techniques && (
                <div style={{ background:'var(--bg-2)', border:'1px solid var(--border)', borderRadius:'var(--radius)', padding:'10px 12px' }}>
                  <div style={{ fontSize:10, fontWeight:700, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:4 }}>Facilitation</div>
                  <div style={{ fontSize:12, color:'var(--text-2)' }}>{detail.facilitation_techniques}</div>
                </div>
              )}
              {detail.formative_methods && (
                <div style={{ background:'var(--bg-2)', border:'1px solid var(--border)', borderRadius:'var(--radius)', padding:'10px 12px' }}>
                  <div style={{ fontSize:10, fontWeight:700, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:4 }}>Formative Assessment</div>
                  <div style={{ fontSize:12, color:'var(--text-2)' }}>{detail.formative_methods}</div>
                </div>
              )}
            </div>
          )}

          {/* Performance Criteria */}
          <div>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
              <div className="form-label">Performance Criteria</div>
              {canEdit && (
                <button className="btn btn-sm btn-outline" onClick={() => setShowCriteriaModal(true)}>
                  <Plus size={12}/> Add Criterion
                </button>
              )}
            </div>
            {detail.performance_criteria?.length ? (
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {detail.performance_criteria.map((c, i) => {
                  const indicators = c.indicators
                    ? (typeof c.indicators === 'string' ? JSON.parse(c.indicators) : c.indicators)
                    : [];
                  return (
                    <div key={c.id} style={{ background:'var(--bg-2)', border:'1px solid var(--border)', borderRadius:'var(--radius)', padding:'10px 14px' }}>
                      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between' }}>
                        <div style={{ flex:1 }}>
                          {c.element_of_competency && (
                            <div style={{ fontSize:10, fontWeight:700, color:'var(--primary)', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:4 }}>
                              {c.element_of_competency}
                            </div>
                          )}
                          <div style={{ fontSize:13, fontWeight:500, color:'var(--text)', marginBottom: indicators.length ? 8 : 0 }}>
                            {i+1}. {c.criteria_text}
                          </div>
                          {indicators.length > 0 && (
                            <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                              {indicators.map((ind, j) => (
                                <div key={j} style={{ display:'flex', alignItems:'center', gap:8, fontSize:12, color:'var(--text-2)' }}>
                                  <div style={{ width:16, height:16, border:'1px solid var(--border-2)', borderRadius:4, flexShrink:0 }}/>
                                  {ind}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        {canEdit && (
                          <button className="btn-icon" onClick={() => deleteCriteria(c.id)} style={{ color:'var(--red)', marginLeft:8 }}>
                            <Trash2 size={13}/>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ fontSize:13, color:'var(--text-3)', fontStyle:'italic' }}>No performance criteria yet</div>
            )}
          </div>
        </div>
      )}

      {showCriteriaModal && (
        <CriteriaModal
          loId={lo.id}
          onClose={() => setShowCriteriaModal(false)}
          onSaved={async () => {
            setShowCriteriaModal(false);
            const r = await api.get(`/learning-outcomes/${lo.id}`);
            setDetail(r.data);
            onRefresh();
          }}
        />
      )}
    </div>
  );
}

export default function LearningOutcomesPage() {
  const { can } = useAuth();
  const [params] = useSearchParams();
  const moduleId   = params.get('module_id');
  const moduleCode = params.get('module_code');
  const moduleName = params.get('module_name');

  const [los, setLos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const load = useCallback(() => {
    if (!moduleId) return;
    setLoading(true);
    api.get('/learning-outcomes', { params: { module_id: moduleId } })
      .then(r => setLos(r.data)).finally(() => setLoading(false));
  }, [moduleId]);

  useEffect(load, [load]);

  const totalHours = los.reduce((s,lo) => s+(lo.learning_hours||0), 0);

  return (
    <div>
      <div className="page-header">
        <div>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
            <span style={{ fontFamily:'monospace', fontSize:13, fontWeight:700, color:'var(--primary)', background:'var(--primary-bg)', padding:'2px 8px', borderRadius:4 }}>
              {moduleCode}
            </span>
          </div>
          <div className="page-title">{decodeURIComponent(moduleName || 'Learning Outcomes')}</div>
          <div className="page-subtitle">
            {los.length} learning outcome{los.length!==1?'s':''} · {totalHours} total hours
          </div>
        </div>
        {can('school_admin','headmaster','super_admin','dos','trainer') && moduleId && (
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={15}/> Add LO
          </button>
        )}
      </div>

      {!moduleId ? (
        <div className="empty-state"><h4>Select a module first</h4><p>Navigate from Modules → click a module</p></div>
      ) : loading ? (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {[1,2,3].map(i => <div key={i} className="card skeleton" style={{ height:70 }}/>)}
        </div>
      ) : los.length === 0 ? (
        <div className="empty-state">
          <h4>No learning outcomes yet</h4>
          <p style={{ marginBottom:16 }}>Add learning outcomes from the RTB module document</p>
          {can('school_admin','headmaster','dos','trainer') && (
            <button className="btn btn-primary" onClick={() => setShowModal(true)}><Plus size={14}/> Add First LO</button>
          )}
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {los.map(lo => (
            <LOCard
              key={lo.id}
              lo={lo}
              canEdit={can('school_admin','headmaster','super_admin','dos','trainer')}
              onRefresh={load}
            />
          ))}
        </div>
      )}

      {showModal && (
        <LOModal
          moduleId={moduleId}
          onClose={() => setShowModal(false)}
          onSaved={() => { setShowModal(false); load(); }}
        />
      )}
    </div>
  );
}
