import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { Plus, X, Search, Award } from 'lucide-react';

// ═══════════════════════════════════════════════
// STUDENTS PAGE
// ═══════════════════════════════════════════════
function StudentModal({ classes, quals, onClose, onSaved, student }) {
  const isNew = !student?.id;
  const [form, setForm] = useState({ reg_number:'',full_name:'',class_id:'',qualification_id:'',gender:'',date_of_birth:'',boarding:false,parent_name:'',parent_phone:'',parent_email:'', ...(isNew?{}:{...student,date_of_birth:student.date_of_birth?.split('T')[0]||''}) });
  const [saving,setSaving]=useState(false); const [err,setErr]=useState('');
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));
  const submit=async e=>{e.preventDefault();setSaving(true);setErr('');try{if(isNew)await api.post('/students',form);else await api.patch(`/students/${student.id}`,form);onSaved();}catch(er){setErr(er.response?.data?.error||'Failed');}finally{setSaving(false);}};
  return (<div className="modal-overlay"><div className="modal modal-lg">
    <div className="modal-header"><h3>{isNew?'Add Trainee':'Edit Trainee'}</h3><button className="btn-icon" onClick={onClose}><X size={18}/></button></div>
    <form onSubmit={submit}><div className="modal-body">{err&&<div className="alert alert-error">{err}</div>}
      <div className="form-grid">
        <div className="form-group"><label className="form-label">Reg Number *</label><input className="form-input" value={form.reg_number} onChange={e=>set('reg_number',e.target.value)} required placeholder="STM2024001"/></div>
        <div className="form-group"><label className="form-label">Full Name *</label><input className="form-input" value={form.full_name} onChange={e=>set('full_name',e.target.value)} required/></div>
        <div className="form-group"><label className="form-label">Class</label><select className="form-select" value={form.class_id||''} onChange={e=>set('class_id',e.target.value)}><option value="">No class</option>{classes.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
        <div className="form-group"><label className="form-label">Qualification</label><select className="form-select" value={form.qualification_id||''} onChange={e=>set('qualification_id',e.target.value)}><option value="">No qualification</option>{quals.map(q=><option key={q.id} value={q.id}>[{q.curriculum_code}] {q.short_title||q.title}</option>)}</select></div>
        <div className="form-group"><label className="form-label">Gender</label><select className="form-select" value={form.gender||''} onChange={e=>set('gender',e.target.value)}><option value="">Select…</option><option>Male</option><option>Female</option></select></div>
        <div className="form-group"><label className="form-label">Date of Birth</label><input type="date" className="form-input" value={form.date_of_birth||''} onChange={e=>set('date_of_birth',e.target.value)}/></div>
        <div className="form-group"><label className="form-label">Type</label><select className="form-select" value={form.boarding?'1':'0'} onChange={e=>set('boarding',e.target.value==='1')}><option value="0">Day Scholar</option><option value="1">Boarder</option></select></div>
        <div className="form-group"><label className="form-label">Parent Name</label><input className="form-input" value={form.parent_name||''} onChange={e=>set('parent_name',e.target.value)}/></div>
        <div className="form-group"><label className="form-label">Parent Phone</label><input className="form-input" value={form.parent_phone||''} onChange={e=>set('parent_phone',e.target.value)} placeholder="+250 7XX XXX XXX"/></div>
        <div className="form-group"><label className="form-label">Parent Email</label><input type="email" className="form-input" value={form.parent_email||''} onChange={e=>set('parent_email',e.target.value)}/></div>
      </div>
    </div><div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button><button type="submit" className="btn btn-primary" disabled={saving}>{saving?'Saving…':isNew?'Add Trainee':'Save'}</button></div></form>
  </div></div>);
}

export function StudentsPage() {
  const { can } = useAuth();
  const navigate = useNavigate();
  const [students,setStudents]=useState([]); const [classes,setClasses]=useState([]); const [quals,setQuals]=useState([]);
  const [loading,setLoading]=useState(true); const [search,setSearch]=useState(''); const [filterClass,setFilterClass]=useState('');
  const [showModal,setShowModal]=useState(false); const [editStudent,setEditStudent]=useState(null);
  const load=useCallback(async()=>{setLoading(true);try{const p={};if(filterClass)p.class_id=filterClass;if(search)p.search=search;const[s,c,q]=await Promise.all([api.get('/students',{params:p}),api.get('/classes'),api.get('/school/qualifications')]);setStudents(s.data);setClasses(c.data);setQuals(q.data);}catch(e){console.error(e);}finally{setLoading(false);}},[filterClass,search]);
  useEffect(()=>{const t=setTimeout(load,300);return()=>clearTimeout(t);},[load]);
  return (<div>
    <div className="page-header"><div><div className="page-title">Trainees</div><div className="page-subtitle">{students.length} active trainee{students.length!==1?'s':''}</div></div>
      {can('school_admin','headmaster','dod','dos','patron')&&<button className="btn btn-primary" onClick={()=>setShowModal(true)}><Plus size={15}/> Add Trainee</button>}
    </div>
    <div className="filters-bar">
      <div style={{position:'relative',flex:1,minWidth:200}}><Search size={13} style={{position:'absolute',left:9,top:'50%',transform:'translateY(-50%)',color:'var(--text-3)'}}/><input className="filter-input" style={{paddingLeft:30,width:'100%'}} placeholder="Search name or reg…" value={search} onChange={e=>setSearch(e.target.value)}/></div>
      <select className="filter-input" value={filterClass} onChange={e=>setFilterClass(e.target.value)}><option value="">All Classes</option>{classes.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select>
    </div>
    <div className="card" style={{padding:0}}><div className="table-wrap">
      {loading?<div style={{textAlign:'center',padding:40,color:'var(--text-3)'}}>Loading…</div>:students.length===0?<div className="empty-state"><h4>No trainees found</h4></div>:(
        <table><thead><tr><th>Trainee</th><th>Reg No</th><th>Class</th><th>Type</th><th>Parent Phone</th><th>Actions</th></tr></thead>
        <tbody>{students.map(s=>(
          <tr key={s.id}>
            <td><div style={{display:'flex',alignItems:'center',gap:8}}><div style={{width:30,height:30,borderRadius:7,background:'var(--primary-bg)',border:'1px solid var(--primary-border)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:700,color:'var(--primary)',flexShrink:0}}>{s.full_name.split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase()}</div><span style={{fontWeight:600}}>{s.full_name}</span></div></td>
            <td style={{fontFamily:'monospace',fontSize:12,color:'var(--text-3)'}}>{s.reg_number}</td>
            <td>{s.class_name||'—'}</td>
            <td><span className={`badge ${s.boarding?'badge-submitted':'badge-minor'}`}>{s.boarding?'Boarder':'Day Scholar'}</span></td>
            <td style={{color:'var(--primary)',fontSize:13}}>{s.parent_phone||'—'}</td>
            <td><div className="flex gap-1">
              <button className="btn-icon" title="Portfolio" onClick={()=>navigate(`/portfolio/${s.id}`)}><Award size={14}/></button>
              {can('school_admin','headmaster','dod','dos','patron')&&<button className="btn-icon" onClick={()=>setEditStudent(s)}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>}
            </div></td>
          </tr>
        ))}</tbody></table>
      )}
    </div></div>
    {(showModal||editStudent)&&<StudentModal student={editStudent||null} classes={classes} quals={quals} onClose={()=>{setShowModal(false);setEditStudent(null);}} onSaved={()=>{setShowModal(false);setEditStudent(null);load();}}/>}
  </div>);
}

// ═══════════════════════════════════════════════
// CLASSES PAGE
// ═══════════════════════════════════════════════
export function ClassesPage() {
  const { can } = useAuth();
  const [classes,setClasses]=useState([]); const [users,setUsers]=useState([]); const [quals,setQuals]=useState([]);
  const [loading,setLoading]=useState(true); const [showModal,setShowModal]=useState(false); const [editClass,setEditClass]=useState(null);
  const load=useCallback(async()=>{setLoading(true);try{const[c,u,q]=await Promise.all([api.get('/classes'),api.get('/users'),api.get('/school/qualifications')]);setClasses(c.data);setUsers(u.data.filter(u=>['patron','trainer','dos','headmaster'].includes(u.role)&&u.is_active));setQuals(q.data);}catch(e){console.error(e);}finally{setLoading(false);}},[]); 
  useEffect(()=>{load();},[load]);
  const ClassModal=({cls,onClose,onSaved})=>{
    const isNew=!cls?.id;const[form,setF]=useState({name:'',qualification_id:'',level:'',section:'',patron_id:'',academic_year:'2024-2025',...(isNew?{}:cls)});const[saving,setSaving]=useState(false);const[err,setErr]=useState('');
    const set=(k,v)=>setF(f=>({...f,[k]:v}));
    const submit=async e=>{e.preventDefault();setSaving(true);setErr('');try{if(isNew)await api.post('/classes',form);else await api.patch(`/classes/${cls.id}`,form);onSaved();}catch(er){setErr(er.response?.data?.error||'Failed');}finally{setSaving(false);}};
    return(<div className="modal-overlay"><div className="modal"><div className="modal-header"><h3>{isNew?'Add Class':'Edit Class'}</h3><button className="btn-icon" onClick={onClose}><X size={18}/></button></div>
      <form onSubmit={submit}><div className="modal-body">{err&&<div className="alert alert-error">{err}</div>}
        <div className="form-group form-span-2 form-group" style={{gridColumn:'1/-1'}}><label className="form-label">Class Name *</label><input className="form-input" value={form.name} onChange={e=>set('name',e.target.value)} required placeholder="e.g. S4 A — Software Dev"/></div>
        <div className="form-grid">
          <div className="form-group"><label className="form-label">Qualification</label><select className="form-select" value={form.qualification_id||''} onChange={e=>set('qualification_id',e.target.value)}><option value="">None</option>{quals.map(q=><option key={q.id} value={q.id}>[{q.curriculum_code}] {q.short_title||q.title}</option>)}</select></div>
          <div className="form-group"><label className="form-label">Patron</label><select className="form-select" value={form.patron_id||''} onChange={e=>set('patron_id',e.target.value)}><option value="">No patron</option>{users.map(u=><option key={u.id} value={u.id}>{u.full_name}</option>)}</select></div>
          <div className="form-group"><label className="form-label">Level</label><input className="form-input" value={form.level||''} onChange={e=>set('level',e.target.value)} placeholder="e.g. Senior 4"/></div>
          <div className="form-group"><label className="form-label">Academic Year</label><input className="form-input" value={form.academic_year||''} onChange={e=>set('academic_year',e.target.value)}/></div>
        </div>
      </div><div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button><button type="submit" className="btn btn-primary" disabled={saving}>{saving?'Saving…':isNew?'Add Class':'Save'}</button></div></form>
    </div></div>);
  };
  return(<div>
    <div className="page-header"><div><div className="page-title">Classes</div><div className="page-subtitle">{classes.length} class{classes.length!==1?'es':''}</div></div>
      {can('school_admin','headmaster','dos')&&<button className="btn btn-primary" onClick={()=>setShowModal(true)}><Plus size={15}/> Add Class</button>}
    </div>
    {loading?<div style={{textAlign:'center',padding:60,color:'var(--text-3)'}}>Loading…</div>:classes.length===0?(<div className="empty-state"><h4>No classes yet</h4></div>):(
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))',gap:14}}>
        {classes.map(c=>(
          <div key={c.id} className="card">
            <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:10}}>
              <div style={{width:40,height:40,background:'var(--primary-bg)',border:'1px solid var(--primary-border)',borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,fontWeight:800,color:'var(--primary)',fontFamily:'var(--font-head)'}}>{c.name.slice(0,2).toUpperCase()}</div>
              {can('school_admin','headmaster','dos')&&<button className="btn-icon" onClick={()=>setEditClass(c)}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>}
            </div>
            <div style={{fontFamily:'var(--font-head)',fontSize:16,fontWeight:700,marginBottom:2}}>{c.name}</div>
            {c.qualification_name&&<div style={{fontSize:11,color:'var(--primary)',marginBottom:8}}>{c.qualification_name}</div>}
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
              <div style={{background:'var(--bg-3)',border:'1px solid var(--border)',borderRadius:6,padding:'8px 10px'}}>
                <div style={{fontSize:20,fontWeight:800,fontFamily:'var(--font-head)',color:'var(--primary)'}}>{c.student_count}</div>
                <div style={{fontSize:10,color:'var(--text-3)',textTransform:'uppercase',letterSpacing:'.04em'}}>Trainees</div>
              </div>
              <div style={{background:'var(--bg-3)',border:'1px solid var(--border)',borderRadius:6,padding:'8px 10px'}}>
                <div style={{fontSize:12,fontWeight:600,color:'var(--text)',marginBottom:2}}>{c.patron_name||'No patron'}</div>
                <div style={{fontSize:10,color:'var(--text-3)',textTransform:'uppercase',letterSpacing:'.04em'}}>Patron</div>
              </div>
            </div>
            {c.academic_year&&<div style={{marginTop:8,fontSize:11,color:'var(--text-3)'}}>{c.academic_year}</div>}
          </div>
        ))}
      </div>
    )}
    {(showModal||editClass)&&<ClassModal cls={editClass||null} onClose={()=>{setShowModal(false);setEditClass(null);}} onSaved={()=>{setShowModal(false);setEditClass(null);load();}}/>}
  </div>);
}

// ═══════════════════════════════════════════════
// USERS PAGE
// ═══════════════════════════════════════════════
const ROLES=['trainer','dos','dod','hod','patron','metron','headmaster','school_admin'];
const ROLE_LABELS={super_admin:'Platform Admin',school_admin:'School Admin',headmaster:'Headmaster',dos:'Dir. of Studies',dod:'Dir. of Discipline',hod:'Head of Dept',patron:'Patron',metron:'Metron',trainer:'Trainer',trainee:'Trainee'};

export function UsersPage() {
  const { can, user: me } = useAuth();
  const [users,setUsers]=useState([]); const [depts,setDepts]=useState([]);
  const [loading,setLoading]=useState(true); const [filterRole,setFilterRole]=useState('');
  const [showModal,setShowModal]=useState(false); const [editUser,setEditUser]=useState(null);
  const load=useCallback(async()=>{setLoading(true);try{const[u,d]=await Promise.all([api.get('/users'),api.get('/departments')]);setUsers(u.data);setDepts(d.data);}catch(e){console.error(e);}finally{setLoading(false);}},[]); 
  useEffect(()=>{load();},[load]);
  const filtered=filterRole?users.filter(u=>u.role===filterRole):users;
  const UserModal=({user:eu,onClose,onSaved})=>{
    const isNew=!eu?.id;const[form,setF]=useState({full_name:'',email:'',password:'',role:'trainer',department_id:'',phone:'',...(isNew?{}:eu)});const[saving,setSaving]=useState(false);const[err,setErr]=useState('');
    const set=(k,v)=>setF(f=>({...f,[k]:v}));
    const submit=async e=>{e.preventDefault();setSaving(true);setErr('');try{if(isNew)await api.post('/users',form);else await api.patch(`/users/${eu.id}`,form);onSaved();}catch(er){setErr(er.response?.data?.error||'Failed');}finally{setSaving(false);}};
    return(<div className="modal-overlay"><div className="modal"><div className="modal-header"><h3>{isNew?'Add Staff':'Edit Staff'}</h3><button className="btn-icon" onClick={onClose}><X size={18}/></button></div>
      <form onSubmit={submit}><div className="modal-body">{err&&<div className="alert alert-error">{err}</div>}
        <div className="form-group"><label className="form-label">Full Name *</label><input className="form-input" value={form.full_name} onChange={e=>set('full_name',e.target.value)} required/></div>
        <div className="form-group"><label className="form-label">Email *</label><input type="email" className="form-input" value={form.email} onChange={e=>set('email',e.target.value)} required/></div>
        {isNew&&<div className="form-group"><label className="form-label">Password *</label><input type="password" className="form-input" value={form.password} onChange={e=>set('password',e.target.value)} required/></div>}
        <div className="form-grid">
          <div className="form-group"><label className="form-label">Role *</label><select className="form-select" value={form.role} onChange={e=>set('role',e.target.value)}>{ROLES.map(r=><option key={r} value={r}>{ROLE_LABELS[r]||r}</option>)}</select></div>
          <div className="form-group"><label className="form-label">Department</label><select className="form-select" value={form.department_id||''} onChange={e=>set('department_id',e.target.value)}><option value="">None</option>{depts.map(d=><option key={d.id} value={d.id}>{d.name}</option>)}</select></div>
          <div className="form-group"><label className="form-label">Phone</label><input className="form-input" value={form.phone||''} onChange={e=>set('phone',e.target.value)} placeholder="+250 7XX XXX XXX"/></div>
        </div>
      </div><div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button><button type="submit" className="btn btn-primary" disabled={saving}>{saving?'Saving…':isNew?'Add Staff':'Save'}</button></div></form>
    </div></div>);
  };
  return(<div>
    <div className="page-header"><div><div className="page-title">Staff</div><div className="page-subtitle">{users.length} staff member{users.length!==1?'s':''}</div></div>
      {can('school_admin','headmaster')&&<button className="btn btn-primary" onClick={()=>setShowModal(true)}><Plus size={15}/> Add Staff</button>}
    </div>
    <div className="filters-bar">
      <select className="filter-input" value={filterRole} onChange={e=>setFilterRole(e.target.value)}><option value="">All Roles</option>{ROLES.map(r=><option key={r} value={r}>{ROLE_LABELS[r]}</option>)}</select>
    </div>
    <div className="card" style={{padding:0}}><div className="table-wrap">
      {loading?<div style={{textAlign:'center',padding:40,color:'var(--text-3)'}}>Loading…</div>:filtered.length===0?<div className="empty-state"><h4>No staff found</h4></div>:(
        <table><thead><tr><th>Name</th><th>Role</th><th>Department</th><th>Phone</th><th>Status</th><th>Actions</th></tr></thead>
        <tbody>{filtered.map(u=>(
          <tr key={u.id} style={{opacity:u.is_active?1:.5}}>
            <td><div style={{display:'flex',alignItems:'center',gap:8}}><div style={{width:30,height:30,borderRadius:7,background:'var(--primary-bg)',border:'1px solid var(--primary-border)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:700,color:'var(--primary)',flexShrink:0}}>{u.full_name.split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase()}</div><div><div style={{fontWeight:600}}>{u.full_name}</div><div style={{fontSize:11,color:'var(--text-3)'}}>{u.email}</div></div></div></td>
            <td><span className="badge badge-minor">{ROLE_LABELS[u.role]||u.role}</span></td>
            <td style={{fontSize:12}}>{u.department_name||'—'}</td>
            <td style={{fontSize:12}}>{u.phone||'—'}</td>
            <td><span className={`badge ${u.is_active?'badge-approved':'badge-closed'}`}>{u.is_active?'Active':'Inactive'}</span></td>
            <td>{can('school_admin','headmaster')&&u.id!==me?.id&&<button className="btn-icon" onClick={()=>setEditUser(u)}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>}</td>
          </tr>
        ))}</tbody></table>
      )}
    </div></div>
    {(showModal||editUser)&&<UserModal user={editUser||null} onClose={()=>{setShowModal(false);setEditUser(null);}} onSaved={()=>{setShowModal(false);setEditUser(null);load();}}/>}
  </div>);
}

// ═══════════════════════════════════════════════
// SCHEMES OF WORK PAGE
// ═══════════════════════════════════════════════
export function SchemesPage() {
  const { can } = useAuth();
  const [schemes,setSchemes]=useState([]); const [loading,setLoading]=useState(true);
  const [filterStatus,setFilterStatus]=useState(''); const [showModal,setShowModal]=useState(false);
  const [modules,setModules]=useState([]); const [classes,setClasses]=useState([]);
  const load=useCallback(async()=>{setLoading(true);try{const p={};if(filterStatus)p.status=filterStatus;const[s,m,c]=await Promise.all([api.get('/schemes',{params:p}),api.get('/modules'),api.get('/classes')]);setSchemes(s.data);setModules(m.data);setClasses(c.data);}catch(e){console.error(e);}finally{setLoading(false);}},[filterStatus]);
  useEffect(()=>{load();},[load]);
  const SchemeModal=({onClose,onSaved})=>{
    const[form,setF]=useState({module_id:'',class_id:'',subject:'',total_weeks:12});const[saving,setSaving]=useState(false);const[err,setErr]=useState('');
    const set=(k,v)=>setF(f=>({...f,[k]:v}));
    const submit=async e=>{e.preventDefault();setSaving(true);setErr('');try{await api.post('/schemes',form);onSaved();}catch(er){setErr(er.response?.data?.error||'Failed');}finally{setSaving(false);}};
    return(<div className="modal-overlay"><div className="modal"><div className="modal-header"><h3>New Scheme of Work</h3><button className="btn-icon" onClick={onClose}><X size={18}/></button></div>
      <form onSubmit={submit}><div className="modal-body">{err&&<div className="alert alert-error">{err}</div>}
        <div className="form-group"><label className="form-label">Module</label><select className="form-select" value={form.module_id} onChange={e=>set('module_id',e.target.value)}><option value="">Select module…</option>{modules.map(m=><option key={m.id} value={m.id}>[{m.code}] {m.name}</option>)}</select></div>
        <div className="form-group"><label className="form-label">Class</label><select className="form-select" value={form.class_id} onChange={e=>set('class_id',e.target.value)}><option value="">Select class…</option>{classes.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
        <div className="form-group"><label className="form-label">Subject / Title *</label><input className="form-input" value={form.subject} onChange={e=>set('subject',e.target.value)} required placeholder="e.g. Version Control — Term 1 2024"/></div>
        <div className="form-group"><label className="form-label">Total Weeks</label><input type="number" className="form-input" value={form.total_weeks} onChange={e=>set('total_weeks',parseInt(e.target.value)||12)} min={1}/></div>
      </div><div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button><button type="submit" className="btn btn-primary" disabled={saving}>{saving?'Saving…':'Create Scheme'}</button></div></form>
    </div></div>);
  };
  return(<div>
    <div className="page-header"><div><div className="page-title">Schemes of Work</div><div className="page-subtitle">{schemes.length} schemes</div></div>
      <button className="btn btn-primary" onClick={()=>setShowModal(true)}><Plus size={15}/> New Scheme</button>
    </div>
    <div className="filters-bar">
      {['','draft','submitted','approved','rejected'].map(s=>(
        <button key={s} className={`btn btn-sm ${filterStatus===s?'btn-primary':'btn-outline'}`} onClick={()=>setFilterStatus(s)}>
          {s?s.charAt(0).toUpperCase()+s.slice(1):'All'}
        </button>
      ))}
    </div>
    <div className="card" style={{padding:0}}><div className="table-wrap">
      {loading?<div style={{textAlign:'center',padding:40,color:'var(--text-3)'}}>Loading…</div>:schemes.length===0?<div className="empty-state"><h4>No schemes found</h4></div>:(
        <table><thead><tr><th>Subject</th><th>Trainer</th><th>Module</th><th>Class</th><th>Lessons</th><th>Status</th><th>Actions</th></tr></thead>
        <tbody>{schemes.map(s=>(
          <tr key={s.id}>
            <td style={{fontWeight:500}}>{s.subject}</td>
            <td style={{fontSize:12}}>{s.trainer_name}</td>
            <td style={{fontSize:12,fontFamily:'monospace',color:'var(--primary)'}}>{s.module_code||'—'}</td>
            <td style={{fontSize:12}}>{s.class_name||'—'}</td>
            <td style={{fontSize:12}}>{s.lesson_count}</td>
            <td><span className={`badge badge-${s.status}`}>{s.status}</span></td>
            <td><div className="flex gap-1">
              {s.status==='draft'&&<button className="btn btn-sm btn-primary" onClick={async()=>{await api.post(`/schemes/${s.id}/submit`);load();}}>Submit</button>}
              {s.status==='submitted'&&can('school_admin','headmaster','dos')&&(<>
                <button className="btn btn-sm btn-success" onClick={async()=>{await api.post(`/schemes/${s.id}/review`,{decision:'approved'});load();}}>Approve</button>
                <button className="btn btn-sm btn-danger" onClick={async()=>{await api.post(`/schemes/${s.id}/review`,{decision:'rejected'});load();}}>Reject</button>
              </>)}
            </div></td>
          </tr>
        ))}</tbody></table>
      )}
    </div></div>
    {showModal&&<SchemeModal onClose={()=>setShowModal(false)} onSaved={()=>{setShowModal(false);load();}}/>}
  </div>);
}
