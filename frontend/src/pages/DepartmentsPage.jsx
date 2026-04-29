import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { Plus, X, Building2 } from 'lucide-react';

function DeptModal({ dept, hods, onClose, onSaved }) {
  const isNew = !dept?.id;
  const [form, setForm] = useState({ name:'', code:'', hod_id:'', description:'', ...(isNew ? {} : dept) });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async e => {
    e.preventDefault(); setSaving(true); setErr('');
    try {
      if (isNew) await api.post('/departments', form);
      else       await api.patch(`/departments/${dept.id}`, form);
      onSaved();
    } catch (er) { setErr(er.response?.data?.error || 'Failed'); }
    finally { setSaving(false); }
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h3>{isNew ? 'Add Department' : 'Edit Department'}</h3>
          <button className="btn-icon" onClick={onClose}><X size={18}/></button>
        </div>
        <form onSubmit={submit}>
          <div className="modal-body">
            {err && <div className="alert alert-error">{err}</div>}
            <div className="form-group">
              <label className="form-label">Department Name *</label>
              <input className="form-input" value={form.name} onChange={e => set('name', e.target.value)} required placeholder="e.g. ICT and Multimedia"/>
            </div>
            <div className="form-group">
              <label className="form-label">Short Code</label>
              <input className="form-input" value={form.code || ''} onChange={e => set('code', e.target.value.toUpperCase())} placeholder="e.g. ICT" maxLength={10}/>
            </div>
            <div className="form-group">
              <label className="form-label">Head of Department (HoD)</label>
              <select className="form-select" value={form.hod_id || ''} onChange={e => set('hod_id', e.target.value)}>
                <option value="">No HoD assigned</option>
                {hods.map(h => <option key={h.id} value={h.id}>{h.full_name} — {h.role}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea className="form-textarea" value={form.description || ''} onChange={e => set('description', e.target.value)} placeholder="Brief description…"/>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : isNew ? 'Add Department' : 'Save Changes'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

const COLORS = ['var(--primary)','var(--teal)','var(--blue)','var(--purple)','var(--amber)','var(--green)','var(--orange)'];

export default function DepartmentsPage() {
  const { can } = useAuth();
  const [depts, setDepts]   = useState([]);
  const [users, setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editDept, setEditDept]   = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [d, u] = await Promise.all([api.get('/departments'), api.get('/users')]);
      setDepts(d.data);
      setUsers(u.data.filter(u => ['hod','headmaster','dos','trainer'].includes(u.role) && u.is_active));
    } catch(e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Departments</div>
          <div className="page-subtitle">
            {depts.length} department{depts.length !== 1 ? 's' : ''} · {depts.reduce((s, d) => s + (d.trainer_count || 0), 0)} trainers total
          </div>
        </div>
        {can('school_admin','headmaster') && (
          <button className="btn btn-primary" onClick={() => { setEditDept(null); setShowModal(true); }}>
            <Plus size={15}/> Add Department
          </button>
        )}
      </div>

      {loading ? (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:16 }}>
          {[1,2,3].map(i => <div key={i} className="card skeleton" style={{ height:160 }}/>)}
        </div>
      ) : depts.length === 0 ? (
        <div className="empty-state">
          <Building2 size={40} color="var(--text-3)" style={{ margin:'0 auto 14px' }}/>
          <h4>No departments yet</h4>
          <p style={{ marginBottom:16 }}>Add departments to organise your trainers and modules</p>
          {can('school_admin','headmaster') && (
            <button className="btn btn-primary" onClick={() => setShowModal(true)}><Plus size={14}/> Add First Department</button>
          )}
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:16 }}>
          {depts.map((d, i) => {
            const color = COLORS[i % COLORS.length];
            return (
              <div key={d.id} className="card" style={{ position:'relative', overflow:'hidden' }}>
                {/* Color top bar */}
                <div style={{ position:'absolute', top:0, left:0, right:0, height:4, background:color }}/>

                <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:14, paddingTop:6 }}>
                  <div style={{ width:44, height:44, background:`${color}18`, border:`1px solid ${color}44`, borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, fontWeight:800, color, fontFamily:'var(--font-head)' }}>
                    {d.code || d.name.slice(0,3).toUpperCase()}
                  </div>
                  {can('school_admin','headmaster') && (
                    <button className="btn-icon" onClick={() => { setEditDept(d); setShowModal(true); }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                  )}
                </div>

                <div style={{ fontFamily:'var(--font-head)', fontSize:17, fontWeight:700, marginBottom:4 }}>{d.name}</div>
                {d.description && <div style={{ fontSize:12, color:'var(--text-3)', marginBottom:12, lineHeight:1.5 }}>{d.description}</div>}

                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                  <div style={{ background:'var(--bg-3)', border:'1px solid var(--border)', borderRadius:'var(--radius)', padding:'10px 12px' }}>
                    <div style={{ fontFamily:'var(--font-head)', fontSize:22, fontWeight:800, color }}>{d.trainer_count || 0}</div>
                    <div style={{ fontSize:10, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'.05em' }}>Trainers</div>
                  </div>
                  <div style={{ background:'var(--bg-3)', border:'1px solid var(--border)', borderRadius:'var(--radius)', padding:'10px 12px' }}>
                    <div style={{ fontSize:13, fontWeight:600, color:'var(--text)', marginBottom:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                      {d.hod_name || 'No HoD'}
                    </div>
                    <div style={{ fontSize:10, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'.05em' }}>Head of Dept</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <DeptModal
          dept={editDept}
          hods={users}
          onClose={() => { setShowModal(false); setEditDept(null); }}
          onSaved={() => { setShowModal(false); setEditDept(null); load(); }}
        />
      )}
    </div>
  );
}
