import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { Plus, X, Eye, CheckCircle, Send, Bell } from 'lucide-react';
import { format } from 'date-fns';

// ═══════════════════════════════════════════════
// INCIDENTS PAGE
// ═══════════════════════════════════════════════
function IncidentModal({ students, onClose, onSaved }) {
  const [form,setForm]=useState({student_id:'',title:'',description:'',location:'',incident_date:new Date().toISOString().split('T')[0],severity:'moderate',witnesses:''});
  const [saving,setSaving]=useState(false);const[err,setErr]=useState('');const set=(k,v)=>setForm(f=>({...f,[k]:v}));
  const submit=async e=>{e.preventDefault();setSaving(true);setErr('');try{await api.post('/incidents',form);onSaved();}catch(er){setErr(er.response?.data?.error||'Failed');}finally{setSaving(false);}};
  return(<div className="modal-overlay"><div className="modal modal-lg"><div className="modal-header"><h3>Log Incident</h3><button className="btn-icon" onClick={onClose}><X size={18}/></button></div>
    <form onSubmit={submit}><div className="modal-body">{err&&<div className="alert alert-error">{err}</div>}
      <div className="form-grid">
        <div className="form-group form-span-2"><label className="form-label">Trainee *</label><select className="form-select" value={form.student_id} onChange={e=>set('student_id',e.target.value)} required><option value="">Select trainee…</option>{students.map(s=><option key={s.id} value={s.id}>{s.full_name} ({s.reg_number})</option>)}</select></div>
        <div className="form-group form-span-2"><label className="form-label">Title *</label><input className="form-input" value={form.title} onChange={e=>set('title',e.target.value)} required placeholder="Brief incident title…"/></div>
        <div className="form-group"><label className="form-label">Severity *</label><select className="form-select" value={form.severity} onChange={e=>set('severity',e.target.value)}>{['minor','moderate','serious','critical'].map(s=><option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}</select></div>
        <div className="form-group"><label className="form-label">Date *</label><input type="date" className="form-input" value={form.incident_date} onChange={e=>set('incident_date',e.target.value)} required/></div>
        <div className="form-group form-span-2"><label className="form-label">Location</label><input className="form-input" value={form.location} onChange={e=>set('location',e.target.value)} placeholder="e.g. Workshop, Dormitory"/></div>
        <div className="form-group form-span-2"><label className="form-label">Description *</label><textarea className="form-textarea" value={form.description} onChange={e=>set('description',e.target.value)} required placeholder="Detailed account…" style={{minHeight:90}}/></div>
        <div className="form-group form-span-2"><label className="form-label">Witnesses</label><input className="form-input" value={form.witnesses} onChange={e=>set('witnesses',e.target.value)} placeholder="Names of any witnesses"/></div>
      </div>
    </div><div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button><button type="submit" className="btn btn-primary" disabled={saving}>{saving?'Saving…':'Log Incident'}</button></div></form>
  </div></div>);
}

export function IncidentsPage() {
  const { can } = useAuth();
  const [incidents,setIncidents]=useState([]);const[students,setStudents]=useState([]);
  const [loading,setLoading]=useState(true);const[filterSeverity,setFilterSeverity]=useState('');const[filterStatus,setFilterStatus]=useState('');
  const [showModal,setShowModal]=useState(false);
  const load=useCallback(async()=>{setLoading(true);try{const p={};if(filterSeverity)p.severity=filterSeverity;if(filterStatus)p.status=filterStatus;const[i,s]=await Promise.all([api.get('/incidents',{params:p}),api.get('/students')]);setIncidents(i.data);setStudents(s.data);}catch(e){console.error(e);}finally{setLoading(false);}},[filterSeverity,filterStatus]);
  useEffect(()=>{load();},[load]);
  return(<div>
    <div className="page-header"><div><div className="page-title">Incidents</div><div className="page-subtitle">{incidents.length} incident{incidents.length!==1?'s':''}</div></div>
      <button className="btn btn-primary" onClick={()=>setShowModal(true)}><Plus size={15}/> Log Incident</button>
    </div>
    <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginBottom:16}}>
      {['minor','moderate','serious','critical'].map(sev=>(<div key={sev} className="card-sm" style={{cursor:'pointer',borderColor:filterSeverity===sev?'var(--primary)':'var(--border)'}} onClick={()=>setFilterSeverity(filterSeverity===sev?'':sev)}>
        <div style={{fontSize:22,fontWeight:800,fontFamily:'var(--font-head)'}}>{incidents.filter(i=>i.severity===sev).length}</div>
        <span className={`badge badge-${sev}`}>{sev}</span>
      </div>))}
    </div>
    <div className="filters-bar">
      <select className="filter-input" value={filterStatus} onChange={e=>setFilterStatus(e.target.value)}><option value="">All Statuses</option>{['pending','reviewed','sanctioned','resolved','closed'].map(s=><option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}</select>
    </div>
    <div className="card" style={{padding:0}}><div className="table-wrap">
      {loading?<div style={{textAlign:'center',padding:40,color:'var(--text-3)'}}>Loading…</div>:incidents.length===0?<div className="empty-state"><h4>No incidents found</h4></div>:(
        <table><thead><tr><th>Trainee</th><th>Incident</th><th>Severity</th><th>Date</th><th>Reported By</th><th>Status</th><th>Actions</th></tr></thead>
        <tbody>{incidents.map(i=>(
          <tr key={i.id}>
            <td><div style={{fontWeight:600}}>{i.student_name}</div><div style={{fontSize:11,color:'var(--text-3)'}}>{i.class_name||'—'}</div></td>
            <td style={{maxWidth:180}}><div style={{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{i.title}</div></td>
            <td><span className={`badge badge-${i.severity}`}>{i.severity}</span></td>
            <td style={{fontSize:12,whiteSpace:'nowrap'}}>{i.incident_date?format(new Date(i.incident_date),'dd MMM yyyy'):'—'}</td>
            <td style={{fontSize:12}}>{i.reporter_name}</td>
            <td><span className={`badge badge-${i.status}`}>{i.status}</span></td>
            <td><div className="flex gap-1">
              {can('dod','headmaster','school_admin')&&i.status==='pending'&&(
                <button className="btn btn-sm btn-success" onClick={async()=>{await api.post(`/incidents/${i.id}/review`,{decision:'approve'});load();}}>Review</button>
              )}
              {can('school_admin','headmaster','dod')&&(
                <button className="btn-icon" style={{color:'var(--red)'}} onClick={async()=>{if(confirm('Delete?'))await api.delete(`/incidents/${i.id}`);load();}}>×</button>
              )}
            </div></td>
          </tr>
        ))}</tbody></table>
      )}
    </div></div>
    {showModal&&<IncidentModal students={students} onClose={()=>setShowModal(false)} onSaved={()=>{setShowModal(false);load();}}/>}
  </div>);
}

// ═══════════════════════════════════════════════
// SANCTIONS PAGE
// ═══════════════════════════════════════════════
export function SanctionsPage() {
  const { can } = useAuth();
  const [sanctions,setSanctions]=useState([]);const[loading,setLoading]=useState(true);const[filterStatus,setFilterStatus]=useState('');
  const LABELS={verbal_warning:'Verbal Warning',written_warning:'Written Warning',detention:'Detention',suspension:'Suspension',parent_summon:'Parent Summon',community_service:'Community Service',expulsion:'Expulsion',other:'Other'};
  const load=useCallback(async()=>{setLoading(true);try{const p={};if(filterStatus)p.status=filterStatus;const{data}=await api.get('/sanctions',{params:p});setSanctions(data);}catch(e){console.error(e);}finally{setLoading(false);}},[filterStatus]);
  useEffect(()=>{load();},[load]);
  const updateStatus=async(id,status)=>{await api.patch(`/sanctions/${id}/status`,{status});load();};
  return(<div>
    <div className="page-header"><div><div className="page-title">Sanctions</div><div className="page-subtitle">{sanctions.length} sanction{sanctions.length!==1?'s':''}</div></div></div>
    <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:10,marginBottom:16}}>
      {['pending','approved','active','completed','cancelled'].map(st=>(
        <div key={st} className="card-sm" style={{cursor:'pointer',borderColor:filterStatus===st?'var(--primary)':'var(--border)'}} onClick={()=>setFilterStatus(filterStatus===st?'':st)}>
          <div style={{fontSize:20,fontWeight:800,fontFamily:'var(--font-head)'}}>{sanctions.filter(s=>s.status===st).length}</div>
          <div style={{fontSize:11,color:'var(--text-3)',textTransform:'uppercase',letterSpacing:'.04em'}}>{st}</div>
        </div>
      ))}
    </div>
    <div className="card" style={{padding:0}}><div className="table-wrap">
      {loading?<div style={{textAlign:'center',padding:40,color:'var(--text-3)'}}>Loading…</div>:sanctions.length===0?<div className="empty-state"><h4>No sanctions found</h4></div>:(
        <table><thead><tr><th>Trainee</th><th>Sanction</th><th>Incident</th><th>Duration</th><th>Status</th><th>Actions</th></tr></thead>
        <tbody>{sanctions.map(s=>(
          <tr key={s.id}>
            <td><div style={{fontWeight:600}}>{s.student_name}</div><div style={{fontSize:11,color:'var(--text-3)'}}>{s.class_name||'—'}</div></td>
            <td>{LABELS[s.sanction_type]||s.sanction_type}</td>
            <td>{s.incident_title?<div style={{maxWidth:140,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',fontSize:12}}>{s.incident_title}</div>:'—'}</td>
            <td style={{fontSize:12}}>{s.duration_days?`${s.duration_days}d`:'—'}</td>
            <td><span className={`badge badge-${s.status}`}>{s.status}</span></td>
            <td><div className="flex gap-1">
              {can('dod','headmaster','school_admin')&&(
                <>
                  {s.status==='pending'&&<button className="btn btn-sm btn-success" onClick={()=>updateStatus(s.id,'approved')}><CheckCircle size={11}/> Approve</button>}
                  {s.status==='approved'&&<button className="btn btn-sm btn-primary" onClick={()=>updateStatus(s.id,'active')}>Activate</button>}
                  {s.status==='active'&&<button className="btn btn-sm btn-secondary" onClick={()=>updateStatus(s.id,'completed')}>Complete</button>}
                  {['pending','approved','active'].includes(s.status)&&<button className="btn btn-sm btn-danger" onClick={()=>updateStatus(s.id,'cancelled')}>Cancel</button>}
                </>
              )}
            </div></td>
          </tr>
        ))}</tbody></table>
      )}
    </div></div>
  </div>);
}

// ═══════════════════════════════════════════════
// PATRON REPORTS PAGE
// ═══════════════════════════════════════════════
export function PatronReportsPage() {
  const { can } = useAuth();
  const [reports,setReports]=useState([]);const[classes,setClasses]=useState([]);const[loading,setLoading]=useState(true);
  const [filterStatus,setFilterStatus]=useState('');const[showModal,setShowModal]=useState(false);
  const load=useCallback(async()=>{setLoading(true);try{const p={};if(filterStatus)p.status=filterStatus;const[r,c]=await Promise.all([api.get('/patron-reports',{params:p}),api.get('/classes')]);setReports(r.data);setClasses(c.data);}catch(e){console.error(e);}finally{setLoading(false);}},[filterStatus]);
  useEffect(()=>{load();},[load]);
  const ReportModal=({onClose,onSaved})=>{
    const[form,setF]=useState({class_id:'',report_period:'',summary:'',incidents_count:0,recommendations:''});const[saving,setSaving]=useState(false);const[err,setErr]=useState('');
    const set=(k,v)=>setF(f=>({...f,[k]:v}));
    const submit=async e=>{e.preventDefault();setSaving(true);setErr('');try{await api.post('/patron-reports',form);onSaved();}catch(er){setErr(er.response?.data?.error||'Failed');}finally{setSaving(false);}};
    return(<div className="modal-overlay"><div className="modal"><div className="modal-header"><h3>Submit Report</h3><button className="btn-icon" onClick={onClose}><X size={18}/></button></div>
      <form onSubmit={submit}><div className="modal-body">{err&&<div className="alert alert-error">{err}</div>}
        <div className="form-group"><label className="form-label">Class</label><select className="form-select" value={form.class_id} onChange={e=>set('class_id',e.target.value)}><option value="">Select…</option>{classes.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
        <div className="form-group"><label className="form-label">Period</label><input className="form-input" value={form.report_period} onChange={e=>set('report_period',e.target.value)} placeholder="e.g. Week 3 — Term 1"/></div>
        <div className="form-group"><label className="form-label">Incidents Count</label><input type="number" className="form-input" min={0} value={form.incidents_count} onChange={e=>set('incidents_count',parseInt(e.target.value)||0)}/></div>
        <div className="form-group"><label className="form-label">Summary *</label><textarea className="form-textarea" value={form.summary} onChange={e=>set('summary',e.target.value)} required placeholder="Discipline situation this period…" style={{minHeight:100}}/></div>
        <div className="form-group"><label className="form-label">Recommendations</label><textarea className="form-textarea" value={form.recommendations} onChange={e=>set('recommendations',e.target.value)} placeholder="For DOD or headmaster…"/></div>
      </div><div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button><button type="submit" className="btn btn-primary" disabled={saving}>{saving?'Saving…':'Save Report'}</button></div></form>
    </div></div>);
  };
  return(<div>
    <div className="page-header"><div><div className="page-title">Patron Reports</div><div className="page-subtitle">Periodic class discipline reports</div></div>
      {can('patron')&&<button className="btn btn-primary" onClick={()=>setShowModal(true)}><Plus size={15}/> New Report</button>}
    </div>
    <div className="filters-bar">{['','draft','submitted','reviewed'].map(s=><button key={s} className={`btn btn-sm ${filterStatus===s?'btn-primary':'btn-outline'}`} onClick={()=>setFilterStatus(s)}>{s?s.charAt(0).toUpperCase()+s.slice(1):'All'}</button>)}</div>
    <div className="card" style={{padding:0}}><div className="table-wrap">
      {loading?<div style={{textAlign:'center',padding:40,color:'var(--text-3)'}}>Loading…</div>:reports.length===0?<div className="empty-state"><h4>No reports found</h4></div>:(
        <table><thead><tr><th>Patron</th><th>Class</th><th>Period</th><th>Incidents</th><th>Status</th><th>Actions</th></tr></thead>
        <tbody>{reports.map(r=>(
          <tr key={r.id}>
            <td style={{fontWeight:600}}>{r.patron_name}</td>
            <td>{r.class_name||'—'}</td>
            <td style={{fontSize:12}}>{r.report_period||'—'}</td>
            <td><span style={{fontWeight:700,color:r.incidents_count>5?'var(--red)':r.incidents_count>0?'var(--amber)':'var(--green)'}}>{r.incidents_count}</span></td>
            <td><span className={`badge badge-${r.status}`}>{r.status}</span></td>
            <td><div className="flex gap-1">
              {can('patron')&&r.status==='draft'&&<button className="btn btn-sm btn-primary" onClick={async()=>{await api.post(`/patron-reports/${r.id}/submit`);load();}}><Send size={11}/> Submit</button>}
              {can('dod','headmaster','school_admin')&&r.status==='submitted'&&<button className="btn btn-sm btn-success" onClick={async()=>{await api.post(`/patron-reports/${r.id}/review`,{dod_notes:'Reviewed'});load();}}><CheckCircle size={11}/> Review</button>}
            </div></td>
          </tr>
        ))}</tbody></table>
      )}
    </div></div>
    {showModal&&<ReportModal onClose={()=>setShowModal(false)} onSaved={()=>{setShowModal(false);load();}}/>}
  </div>);
}

// ═══════════════════════════════════════════════
// PORTFOLIO PAGE
// ═══════════════════════════════════════════════
export function PortfolioPage() {
  const [students,setStudents]=useState([]);const[loading,setLoading]=useState(true);const[search,setSearch]=useState('');
  const load=useCallback(async()=>{setLoading(true);try{const p={};if(search)p.search=search;const{data}=await api.get('/students',{params:p});setStudents(data);}catch(e){console.error(e);}finally{setLoading(false);}},[search]);
  useEffect(()=>{const t=setTimeout(load,300);return()=>clearTimeout(t);},[load]);
  return(<div>
    <div className="page-header"><div><div className="page-title">CBC Portfolios</div><div className="page-subtitle">Trainee competency portfolios</div></div></div>
    <div className="filters-bar"><div style={{position:'relative',flex:1,minWidth:200}}><input className="filter-input" style={{width:'100%'}} placeholder="Search trainee…" value={search} onChange={e=>setSearch(e.target.value)}/></div></div>
    {loading?<div style={{textAlign:'center',padding:40,color:'var(--text-3)'}}>Loading…</div>:(
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))',gap:12}}>
        {students.map(s=>(
          <a key={s.id} href={`/portfolio/${s.id}`} style={{textDecoration:'none'}} onClick={e=>{e.preventDefault();window.location.href=`/portfolio/${s.id}`;}}>
            <div className="card" style={{cursor:'pointer',transition:'border-color .12s'}} onMouseEnter={e=>e.currentTarget.style.borderColor='var(--primary)'} onMouseLeave={e=>e.currentTarget.style.borderColor=''}>
              <div style={{width:40,height:40,background:'var(--primary-bg)',border:'1px solid var(--primary-border)',borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,fontWeight:800,color:'var(--primary)',marginBottom:10}}>{s.full_name.split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase()}</div>
              <div style={{fontWeight:600,fontSize:14}}>{s.full_name}</div>
              <div style={{fontSize:11,color:'var(--text-3)',marginTop:2}}>{s.reg_number}</div>
              <div style={{fontSize:11,color:'var(--text-3)'}}>{s.class_name||'No class'}</div>
            </div>
          </a>
        ))}
      </div>
    )}
  </div>);
}

export function TraineePortfolioPage() {
  const { id } = useParams();
  const { can } = useAuth();
  const [data,setData]=useState(null);const[loading,setLoading]=useState(true);
  useEffect(()=>{api.get(`/portfolio/${id}`).then(r=>setData(r.data)).finally(()=>setLoading(false));},[id]);
  if(loading)return<div style={{textAlign:'center',padding:60,color:'var(--text-3)'}}>Loading portfolio…</div>;
  if(!data)return<div className="empty-state"><h4>Trainee not found</h4></div>;
  const {student,competencies}=data;
  const grouped={};
  competencies?.forEach(c=>{if(!grouped[c.module_code])grouped[c.module_code]={code:c.module_code,name:c.module_name,los:[]};grouped[c.module_code].los.push(c);});
  return(<div>
    <div className="page-header">
      <div>
        <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:4}}>
          <div style={{width:44,height:44,background:'var(--primary-bg)',border:'2px solid var(--primary)',borderRadius:12,display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,fontWeight:800,color:'var(--primary)'}}>{student.full_name.split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase()}</div>
          <div><div className="page-title">{student.full_name}</div><div className="page-subtitle">{student.reg_number} · {student.class_name||'No class'} · {student.qualification_title||'No qualification'}</div></div>
        </div>
      </div>
    </div>
    {Object.keys(grouped).length===0?<div className="empty-state"><h4>No competency records yet</h4></div>:(
      <div style={{display:'flex',flexDirection:'column',gap:16}}>
        {Object.values(grouped).map(mod=>(
          <div key={mod.code} className="card">
            <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:14}}>
              <span style={{fontFamily:'monospace',fontSize:12,fontWeight:700,color:'var(--primary)',background:'var(--primary-bg)',padding:'2px 8px',borderRadius:4}}>{mod.code}</span>
              <span style={{fontFamily:'var(--font-head)',fontSize:15,fontWeight:700}}>{mod.name}</span>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:8}}>
              {mod.los.map(lo=>(
                <div key={lo.id} style={{display:'flex',alignItems:'center',gap:12,padding:'10px 14px',background:'var(--bg)',border:'1px solid var(--border)',borderRadius:'var(--radius)'}}>
                  <div className="lo-number">LO{lo.lo_number}</div>
                  <div style={{flex:1}}><div style={{fontWeight:500,fontSize:13}}>{lo.lo_title||'Learning Outcome'}</div>
                  {lo.trainer_name&&<div style={{fontSize:11,color:'var(--text-3)'}}>Assessed by {lo.trainer_name}</div>}</div>
                  {lo.formative_score!=null&&<div style={{textAlign:'center'}}><div style={{fontSize:16,fontWeight:700,color:'var(--blue)'}}>{lo.formative_score}%</div><div style={{fontSize:10,color:'var(--text-3)'}}>Formative</div></div>}
                  {lo.summative_score!=null&&<div style={{textAlign:'center'}}><div style={{fontSize:16,fontWeight:700,color:'var(--teal)'}}>{lo.summative_score}%</div><div style={{fontSize:10,color:'var(--text-3)'}}>Summative</div></div>}
                  <span className={`badge badge-${lo.status}`}>{lo.status?.replace(/_/g,' ')}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    )}
  </div>);
}

// ═══════════════════════════════════════════════
// NOTIFICATIONS PAGE
// ═══════════════════════════════════════════════
export function NotificationsPage() {
  const [notifs,setNotifs]=useState([]);const[loading,setLoading]=useState(true);
  const load=()=>api.get('/notifications').then(r=>setNotifs(r.data.notifications)).finally(()=>setLoading(false));
  useEffect(()=>{load();},[]);
  const markRead=async()=>{await api.post('/notifications/read');load();};
  const TYPE_COLORS={incident:'var(--red)',scheme:'var(--blue)',portfolio:'var(--teal)',iap:'var(--amber)',system:'var(--text-3)'};
  return(<div>
    <div className="page-header"><div><div className="page-title">Notifications</div><div className="page-subtitle">{notifs.filter(n=>!n.is_read).length} unread</div></div>
      <button className="btn btn-outline" onClick={markRead}>Mark all read</button>
    </div>
    {loading?<div style={{textAlign:'center',padding:40,color:'var(--text-3)'}}>Loading…</div>:notifs.length===0?<div className="empty-state"><Bell size={36} color="var(--text-3)" style={{margin:'0 auto 12px'}}/><h4>No notifications</h4></div>:(
      <div style={{display:'flex',flexDirection:'column',gap:8}}>
        {notifs.map(n=>(
          <div key={n.id} style={{background:'var(--bg-2)',border:'1px solid var(--border)',borderRadius:'var(--radius)',padding:'14px 18px',display:'flex',gap:14,alignItems:'flex-start',opacity:n.is_read?.5:1,borderLeft:`3px solid ${TYPE_COLORS[n.type]||'var(--primary)'}`}}>
            {!n.is_read&&<div style={{width:8,height:8,borderRadius:'50%',background:'var(--primary)',flexShrink:0,marginTop:6}}/>}
            <div style={{flex:1}}>
              <div style={{fontWeight:600,fontSize:13}}>{n.title}</div>
              <div style={{fontSize:13,color:'var(--text-2)',marginTop:2}}>{n.message}</div>
              <div style={{fontSize:11,color:'var(--text-3)',marginTop:6}}>{n.created_at?format(new Date(n.created_at),'dd MMM yyyy HH:mm'):'—'}</div>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>);
}
