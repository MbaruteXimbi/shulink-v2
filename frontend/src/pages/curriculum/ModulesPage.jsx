import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import { Plus, X, ChevronRight, BookOpen, Clock, Award } from 'lucide-react';

function ModuleModal({ qualificationId, onClose, onSaved }) {
  const [form, setForm] = useState({
    code:'', name:'', module_type:'specific', learning_hours:0,
    learning_periods:0, credits:0, theory_pct:30, practical_pct:70,
    passing_line_pct:70, sequence_order:0,
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const set = (k,v) => setForm(f => ({...f,[k]:v}));

  const updatePassLine = (type) => {
    set('passing_line_pct', type === 'specific' ? 70 : 50);
  };

  const submit = async e => {
    e.preventDefault(); setSaving(true); setErr('');
    try {
      await api.post('/modules', { ...form, qualification_id: qualificationId });
      onSaved();
    } catch (er) { setErr(er.response?.data?.error || 'Failed'); }
    finally { setSaving(false); }
  };

  return (
    <div className="modal-overlay">
      <div className="modal modal-lg">
        <div className="modal-header">
          <h3>Add Module</h3>
          <button className="btn-icon" onClick={onClose}><X size={18}/></button>
        </div>
        <form onSubmit={submit}>
          <div className="modal-body">
            {err && <div className="alert alert-error">{err}</div>}
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Module Code *</label>
                <input className="form-input" value={form.code} onChange={e => set('code', e.target.value.toUpperCase())} required placeholder="e.g. SWDVC301"/>
              </div>
              <div className="form-group">
                <label className="form-label">Module Type *</label>
                <select className="form-select" value={form.module_type} onChange={e => { set('module_type', e.target.value); updatePassLine(e.target.value); }}>
                  <option value="specific">Specific</option>
                  <option value="general">General</option>
                  <option value="complementary">Complementary</option>
                </select>
              </div>
              <div className="form-group form-span-2">
                <label className="form-label">Module Name *</label>
                <input className="form-input" value={form.name} onChange={e => set('name', e.target.value)} required placeholder="e.g. Conduct Version Control"/>
              </div>
              <div className="form-group">
                <label className="form-label">Learning Hours</label>
                <input type="number" className="form-input" value={form.learning_hours} onChange={e => set('learning_hours', parseInt(e.target.value)||0)} min={0}/>
              </div>
              <div className="form-group">
                <label className="form-label">Learning Periods</label>
                <input type="number" className="form-input" value={form.learning_periods} onChange={e => set('learning_periods', parseInt(e.target.value)||0)} min={0}/>
              </div>
              <div className="form-group">
                <label className="form-label">Credits</label>
                <input type="number" className="form-input" value={form.credits} onChange={e => set('credits', parseInt(e.target.value)||0)} min={0}/>
              </div>
              <div className="form-group">
                <label className="form-label">Passing Line (%)</label>
                <input type="number" className="form-input" value={form.passing_line_pct} onChange={e => set('passing_line_pct', parseInt(e.target.value)||0)} min={0} max={100}/>
              </div>
              <div className="form-group">
                <label className="form-label">Theory (%)</label>
                <input type="number" className="form-input" value={form.theory_pct} onChange={e => set('theory_pct', parseInt(e.target.value)||0)} min={0} max={100}/>
              </div>
              <div className="form-group">
                <label className="form-label">Practical (%)</label>
                <input type="number" className="form-input" value={form.practical_pct} onChange={e => set('practical_pct', parseInt(e.target.value)||0)} min={0} max={100}/>
              </div>
              <div className="form-group">
                <label className="form-label">Sequence Order</label>
                <input type="number" className="form-input" value={form.sequence_order} onChange={e => set('sequence_order', parseInt(e.target.value)||0)} min={0}/>
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Add Module'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

const TYPE_STYLES = {
  specific:      { bg:'var(--primary-bg)', border:'var(--primary-border)', color:'var(--primary)', label:'Specific' },
  general:       { bg:'#eff6ff', border:'#bfdbfe', color:'#1d4ed8', label:'General' },
  complementary: { bg:'#f5f3ff', border:'#ddd6fe', color:'#6d28d9', label:'Complementary' },
};

export default function ModulesPage() {
  const { can } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const qualId = params.get('qualification_id');
  const qualTitle = params.get('title') || 'All Modules';

  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filterType, setFilterType] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    const p = qualId ? { qualification_id: qualId } : {};
    api.get('/modules', { params: p }).then(r => setModules(r.data)).finally(() => setLoading(false));
  }, [qualId]);

  useEffect(load, [load]);

  const filtered = filterType ? modules.filter(m => m.module_type === filterType) : modules;
  const grouped = {
    specific:      filtered.filter(m => m.module_type === 'specific'),
    general:       filtered.filter(m => m.module_type === 'general'),
    complementary: filtered.filter(m => m.module_type === 'complementary'),
  };
  const totalHours = modules.reduce((s, m) => s + (m.learning_hours || 0), 0);
  const totalCredits = modules.reduce((s, m) => s + (m.credits || 0), 0);

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Modules</div>
          <div className="page-subtitle">
            {qualTitle} · {modules.length} modules · {totalHours}h · {totalCredits} credits
          </div>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          {can('school_admin','headmaster','super_admin','dos') && qualId && (
            <button className="btn btn-primary" onClick={() => setShowModal(true)}>
              <Plus size={15}/> Add Module
            </button>
          )}
        </div>
      </div>

      {/* Type filter */}
      <div className="filters-bar">
        {['','specific','general','complementary'].map(t => (
          <button
            key={t} className={`btn ${filterType===t?'btn-primary':'btn-outline'} btn-sm`}
            onClick={() => setFilterType(t)}
          >
            {t ? t.charAt(0).toUpperCase()+t.slice(1) : 'All Types'}
            {t && ` (${modules.filter(m=>m.module_type===t).length})`}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {[...Array(6)].map((_,i) => (
            <div key={i} className="card" style={{ height:72 }}>
              <div className="skeleton" style={{ height:'100%', width:'100%' }}/>
            </div>
          ))}
        </div>
      ) : modules.length === 0 ? (
        <div className="empty-state">
          <h4>No modules found</h4>
          <p>Add modules manually or use the Excel Import</p>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
          {Object.entries(grouped).filter(([,mods]) => mods.length > 0).map(([type, mods]) => (
            <div key={type}>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
                <span style={{
                  ...TYPE_STYLES[type],
                  padding:'3px 10px', borderRadius:'var(--radius)',
                  fontSize:12, fontWeight:700, border:'1px solid',
                }}>
                  {TYPE_STYLES[type].label}
                </span>
                <span style={{ fontSize:12, color:'var(--text-3)' }}>
                  {mods.length} module{mods.length!==1?'s':''} · {mods.reduce((s,m)=>s+(m.learning_hours||0),0)}h
                </span>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {mods.map(m => (
                  <div
                    key={m.id}
                    onClick={() => navigate(`/learning-outcomes?module_id=${m.id}&module_code=${m.code}&module_name=${encodeURIComponent(m.name)}`)}
                    style={{
                      background:'var(--bg-2)',
                      border:'1px solid var(--border)',
                      borderRadius:'var(--radius-lg)',
                      padding:'14px 18px',
                      cursor:'pointer',
                      display:'flex', alignItems:'center', gap:14,
                      transition:'border-color .12s, box-shadow .12s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor='var(--primary)'; e.currentTarget.style.boxShadow='var(--shadow-md)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor=''; e.currentTarget.style.boxShadow=''; }}
                  >
                    {/* Code badge */}
                    <div style={{
                      background: TYPE_STYLES[type].bg,
                      border: `1px solid ${TYPE_STYLES[type].border}`,
                      color: TYPE_STYLES[type].color,
                      borderRadius:'var(--radius)',
                      padding:'4px 10px',
                      fontSize:12, fontWeight:700,
                      flexShrink:0, fontFamily:'monospace',
                    }}>
                      {m.code}
                    </div>

                    {/* Name */}
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontWeight:600, color:'var(--text)', fontSize:14 }}>{m.name}</div>
                      <div style={{ fontSize:11, color:'var(--text-3)', marginTop:2 }}>
                        {m.lo_count} learning outcome{m.lo_count!==1?'s':''} · {m.theory_pct}% theory / {m.practical_pct}% practical
                      </div>
                    </div>

                    {/* Stats */}
                    <div style={{ display:'flex', gap:16, flexShrink:0 }}>
                      <div style={{ textAlign:'center' }}>
                        <div style={{ fontFamily:'var(--font-head)', fontSize:18, fontWeight:700 }}>{m.learning_hours}</div>
                        <div style={{ fontSize:10, color:'var(--text-3)', textTransform:'uppercase' }}>hours</div>
                      </div>
                      <div style={{ textAlign:'center' }}>
                        <div style={{ fontFamily:'var(--font-head)', fontSize:18, fontWeight:700 }}>{m.credits}</div>
                        <div style={{ fontSize:10, color:'var(--text-3)', textTransform:'uppercase' }}>credits</div>
                      </div>
                      <div style={{ textAlign:'center' }}>
                        <div style={{ fontFamily:'var(--font-head)', fontSize:18, fontWeight:700, color: m.passing_line_pct>=70?'var(--primary)':'var(--amber)' }}>{m.passing_line_pct}%</div>
                        <div style={{ fontSize:10, color:'var(--text-3)', textTransform:'uppercase' }}>pass line</div>
                      </div>
                    </div>

                    <ChevronRight size={16} color="var(--text-3)"/>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <ModuleModal
          qualificationId={qualId}
          onClose={() => setShowModal(false)}
          onSaved={() => { setShowModal(false); load(); }}
        />
      )}
    </div>
  );
}
