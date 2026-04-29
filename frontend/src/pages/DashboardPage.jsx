import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { format } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import {
  GraduationCap, Users, AlertTriangle, FileText, Calendar,
  Building2, ArrowRight, BookOpen, CheckCircle, Plus, AlertCircle, Eye,
} from 'lucide-react';

const SEVERITY_COLOR = {
  minor: '#0ea5e9', moderate: '#f59e0b', serious: '#f97316', critical: '#dc2626',
};

function TodayWidget({ todayPlans, navigate }) {
  const today = new Date();
  const dayName = today.toLocaleDateString('en-RW', { weekday: 'long' });
  const dateStr = today.toLocaleDateString('en-RW', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="card" style={{ borderLeft: `4px solid ${todayPlans.length ? 'var(--primary)' : 'var(--amber)'}`, marginBottom: 20 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:36, height:36, borderRadius:9, background: todayPlans.length ? 'var(--primary-bg)' : 'var(--amber-bg)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Calendar size={18} color={todayPlans.length ? 'var(--primary)' : 'var(--amber)'}/>
          </div>
          <div>
            <div style={{ fontFamily:'var(--font-head)', fontSize:15, fontWeight:700 }}>Today — {dayName}</div>
            <div style={{ fontSize:12, color:'var(--text-3)' }}>
              {dateStr} · {todayPlans.length ? `${todayPlans.length} session${todayPlans.length !== 1 ? 's' : ''} scheduled` : 'No sessions scheduled'}
            </div>
          </div>
        </div>
        <button className="btn btn-sm btn-outline" onClick={() => navigate('/session-plans')}>
          All plans <ArrowRight size={12}/>
        </button>
      </div>

      {todayPlans.length === 0 ? (
        <div style={{ background:'var(--amber-bg)', border:'1px solid #fcd34d', borderRadius:'var(--radius)', padding:'12px 16px', display:'flex', alignItems:'center', gap:12 }}>
          <AlertCircle size={18} color="var(--amber)"/>
          <div style={{ flex:1 }}>
            <div style={{ fontWeight:600, fontSize:13, color:'#92400e' }}>No session plans for today</div>
            <div style={{ fontSize:12, color:'var(--text-2)', marginTop:2 }}>Create a session plan with today's date to see it here.</div>
          </div>
          <button className="btn btn-sm btn-primary" style={{ flexShrink:0 }} onClick={() => navigate('/session-plans')}>
            <Plus size={12}/> Create
          </button>
        </div>
      ) : (
        <>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {todayPlans.map(plan => (
              <div key={plan.id} style={{ background:'var(--bg)', border:'1px solid var(--border)', borderRadius:'var(--radius)', padding:'12px 16px', display:'flex', alignItems:'center', gap:14 }}>
                <div style={{ width:34, height:34, borderRadius:8, background:'var(--primary-bg)', border:'1px solid var(--primary-border)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:800, color:'var(--primary)', flexShrink:0 }}>
                  W{plan.week_number}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontWeight:700, fontSize:14, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{plan.topic}</div>
                  <div style={{ fontSize:12, color:'var(--text-3)', marginTop:2, display:'flex', gap:10, flexWrap:'wrap' }}>
                    {plan.module_code && <span style={{ fontFamily:'monospace', color:'var(--primary)', fontWeight:600 }}>{plan.module_code}</span>}
                    {plan.class_name && <span>{plan.class_name}</span>}
                    {plan.lo_title && <span>LO{plan.lo_number}: {plan.lo_title}</span>}
                    <span>{plan.duration_mins} min</span>
                  </div>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
                  <span className={`badge badge-${plan.status}`}>{plan.status}</span>
                  <button className="btn-icon" onClick={() => navigate('/session-plans')}><Eye size={14}/></button>
                </div>
              </div>
            ))}
          </div>

          {/* Quick prep checklist */}
          <div style={{ marginTop:14, paddingTop:14, borderTop:'1px solid var(--border)', display:'flex', gap:20, flexWrap:'wrap' }}>
            {[
              { label:'Plans submitted', done: todayPlans.every(p => p.status !== 'draft') },
              { label:'Resources listed', done: todayPlans.some(p => p.resources) },
              { label:'Objectives set',  done: todayPlans.some(p => p.objectives) },
              { label:'Intro prepared',  done: todayPlans.some(p => p.introduction) },
            ].map(item => (
              <div key={item.label} style={{ display:'flex', alignItems:'center', gap:6, fontSize:12 }}>
                {item.done
                  ? <CheckCircle size={14} color="var(--green)"/>
                  : <div style={{ width:14, height:14, borderRadius:'50%', border:'1.5px solid var(--border-2)' }}/>
                }
                <span style={{ color: item.done ? 'var(--green)' : 'var(--text-3)', fontWeight: item.done ? 600 : 400 }}>
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const { user, can } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard').then(r => setData(r.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div>
      <div className="page-header"><div className="page-title">Dashboard</div></div>
      <div className="stats-grid">
        {[...Array(6)].map((_,i) => (
          <div key={i} className="stat-card">
            <div className="skeleton" style={{ height:32, width:60, marginBottom:8 }}/>
            <div className="skeleton" style={{ height:12, width:100 }}/>
          </div>
        ))}
      </div>
    </div>
  );

  const { stats, recent_incidents, pending_schemes, incidents_by_severity, today_plans } = data || {};
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const isTrainer = user?.role === 'trainer';

  const severityData = ['minor','moderate','serious','critical'].map(s => ({
    name: s.charAt(0).toUpperCase() + s.slice(1),
    count: incidents_by_severity?.find(i => i.severity === s)?.count || 0,
    color: SEVERITY_COLOR[s],
  }));

  const statCards = isTrainer ? [
    { label:'My Schemes',      value: stats?.pending_schemes, icon: FileText,      color:'var(--primary)', bg:'var(--primary-bg)', path:'/schemes' },
    { label:'Trainees',        value: stats?.students,        icon: GraduationCap, color:'var(--blue)',    bg:'var(--blue-bg)',    path:'/students' },
    { label:'Classes',         value: stats?.classes,         icon: Building2,     color:'var(--purple)', bg:'var(--purple-bg)', path:'/classes' },
    { label:'Incidents',       value: stats?.open_incidents,  icon: AlertTriangle, color:'var(--red)',    bg:'#fee2e2',           path:'/incidents' },
    { label:'Session Plans',   value: null,                   icon: BookOpen,      color:'var(--teal)',   bg:'var(--teal-bg)',    path:'/session-plans' },
    { label:'Chronograms',     value: stats?.chronograms,     icon: Calendar,      color:'var(--green)',  bg:'var(--green-bg)',   path:'/chronogram' },
  ] : [
    { label:'Trainees',        value: stats?.students,        icon: GraduationCap, color:'var(--blue)',    bg:'var(--blue-bg)',    path:'/students' },
    { label:'Staff',           value: stats?.trainers,        icon: Users,         color:'var(--teal)',    bg:'var(--teal-bg)',    path:'/users' },
    { label:'Classes',         value: stats?.classes,         icon: Building2,     color:'var(--purple)',  bg:'var(--purple-bg)', path:'/classes' },
    { label:'Open Incidents',  value: stats?.open_incidents,  icon: AlertTriangle, color:'var(--red)',     bg:'#fee2e2',           path:'/incidents' },
    { label:'Pending Schemes', value: stats?.pending_schemes, icon: FileText,      color:'var(--amber)',   bg:'var(--amber-bg)',  path:'/schemes' },
    { label:'Chronograms',     value: stats?.chronograms,     icon: Calendar,      color:'var(--green)',   bg:'var(--green-bg)',  path:'/chronogram' },
  ];

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <div className="page-title">{greeting}, {user?.full_name?.split(' ')[0]} 👋</div>
          <div className="page-subtitle">
            {user?.school_name} · {new Date().toLocaleDateString('en-RW', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}
          </div>
        </div>
      </div>

      {/* TODAY WIDGET — trainers only */}
      {isTrainer && <TodayWidget todayPlans={today_plans || []} navigate={navigate}/>}

      {/* Stats */}
      <div className="stats-grid">
        {statCards.map(({ label, value, icon: Icon, color, bg, path }) => (
          <div key={label} className="stat-card" style={{ cursor:'pointer' }} onClick={() => navigate(path)}>
            <div className="stat-icon" style={{ background: bg }}><Icon size={18} color={color}/></div>
            <div className="stat-num">{value ?? '—'}</div>
            <div className="stat-label">{label}</div>
          </div>
        ))}
      </div>

      {/* Trainer: my schemes */}
      {isTrainer && pending_schemes?.length > 0 && (
        <div className="card" style={{ marginBottom:20 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
            <div style={{ fontFamily:'var(--font-head)', fontSize:15, fontWeight:700 }}>My Schemes</div>
            <button className="btn btn-sm btn-outline" onClick={() => navigate('/schemes')}>View all <ArrowRight size={12}/></button>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {pending_schemes.slice(0,4).map(s => (
              <div key={s.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 14px', background:'var(--bg)', border:'1px solid var(--border)', borderRadius:'var(--radius)' }}>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontWeight:600, fontSize:13, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{s.subject}</div>
                  <div style={{ fontSize:11, color:'var(--text-3)', marginTop:2 }}>
                    {s.module_code && <span style={{ fontFamily:'monospace', color:'var(--primary)', marginRight:8 }}>{s.module_code}</span>}
                    {s.class_name || 'No class'} · {s.session_count || 0} session plans
                  </div>
                </div>
                <span className={`badge badge-${s.status}`}>{s.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Supervisor: two-column layout */}
      {!isTrainer && (
        <div className="two-col" style={{ marginBottom:20 }}>
          <div className="card">
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
              <div style={{ fontFamily:'var(--font-head)', fontSize:15, fontWeight:700 }}>Incidents this month</div>
              <button className="btn btn-sm btn-outline" onClick={() => navigate('/incidents')}>View all <ArrowRight size={12}/></button>
            </div>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={severityData} barSize={32}>
                <XAxis dataKey="name" tick={{ fontSize:11 }} axisLine={false} tickLine={false}/>
                <YAxis tick={{ fontSize:11 }} axisLine={false} tickLine={false} allowDecimals={false}/>
                <Tooltip contentStyle={{ fontSize:12, borderRadius:8, border:'1px solid var(--border)' }} cursor={{ fill:'var(--bg-3)' }}/>
                <Bar dataKey="count" radius={[4,4,0,0]}>
                  {severityData.map((s, i) => <Cell key={i} fill={s.color}/>)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="card">
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
              <div style={{ fontFamily:'var(--font-head)', fontSize:15, fontWeight:700 }}>Schemes awaiting review</div>
              <button className="btn btn-sm btn-outline" onClick={() => navigate('/schemes')}>View all <ArrowRight size={12}/></button>
            </div>
            {pending_schemes?.length ? (
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {pending_schemes.map(s => (
                  <div key={s.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 12px', background:'var(--bg)', borderRadius:'var(--radius)', border:'1px solid var(--border)' }}>
                    <div>
                      <div style={{ fontWeight:600, fontSize:13 }}>{s.trainer_name}</div>
                      <div style={{ fontSize:11, color:'var(--text-3)' }}>{s.module_code} · {s.class_name||'No class'}</div>
                    </div>
                    <span className="badge badge-submitted">Submitted</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state" style={{ padding:'24px 0' }}><p>No schemes pending review</p></div>
            )}
          </div>
        </div>
      )}

      {/* Recent incidents table — supervisors */}
      {!isTrainer && recent_incidents?.length > 0 && (
        <div className="card" style={{ padding:0 }}>
          <div style={{ padding:'16px 20px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div style={{ fontFamily:'var(--font-head)', fontSize:15, fontWeight:700 }}>Recent incidents</div>
            <button className="btn btn-sm btn-outline" onClick={() => navigate('/incidents')}>All incidents <ArrowRight size={12}/></button>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Trainee</th><th>Incident</th><th>Severity</th><th>Reported by</th><th>Date</th><th>Status</th></tr>
              </thead>
              <tbody>
                {recent_incidents.map(i => (
                  <tr key={i.id} style={{ cursor:'pointer' }} onClick={() => navigate('/incidents')}>
                    <td>
                      <div style={{ fontWeight:600 }}>{i.student_name}</div>
                      <div style={{ fontSize:11, color:'var(--text-3)' }}>{i.class_name||'—'}</div>
                    </td>
                    <td style={{ maxWidth:200 }}>
                      <div style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{i.title}</div>
                    </td>
                    <td><span className={`badge badge-${i.severity}`}>{i.severity}</span></td>
                    <td style={{ fontSize:12 }}>{i.reporter_name}</td>
                    <td style={{ fontSize:12, whiteSpace:'nowrap' }}>
                      {i.incident_date ? format(new Date(i.incident_date),'dd MMM yyyy') : '—'}
                    </td>
                    <td><span className={`badge badge-${i.status}`}>{i.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
