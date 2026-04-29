import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { format } from 'date-fns';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import {
  GraduationCap, Users, AlertTriangle, FileText,
  Calendar, Building2, ArrowRight, TrendingUp,
} from 'lucide-react';

const SEVERITY_COLOR = {
  minor: '#0ea5e9', moderate: '#f59e0b', serious: '#f97316', critical: '#dc2626',
};

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
      <div className="page-header">
        <div className="page-title">Dashboard</div>
      </div>
      <div className="stats-grid">
        {[...Array(6)].map((_,i) => (
          <div key={i} className="stat-card">
            <div className="skeleton" style={{ height: 32, width: 60, marginBottom: 8 }}/>
            <div className="skeleton" style={{ height: 12, width: 100 }}/>
          </div>
        ))}
      </div>
    </div>
  );

  const { stats, recent_incidents, pending_schemes, incidents_by_severity } = data || {};
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const severityData = ['minor','moderate','serious','critical'].map(s => ({
    name: s.charAt(0).toUpperCase() + s.slice(1),
    count: incidents_by_severity?.find(i => i.severity === s)?.count || 0,
    color: SEVERITY_COLOR[s],
  }));

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <div className="page-title">{greeting}, {user?.full_name?.split(' ')[0]} 👋</div>
          <div className="page-subtitle">{user?.school_name} · {new Date().toLocaleDateString('en-RW', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}</div>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        {[
          { label:'Trainees', value: stats?.students, icon: GraduationCap, color:'var(--blue)', bg:'var(--blue-bg)', path:'/students' },
          { label:'Staff', value: stats?.trainers, icon: Users, color:'var(--teal)', bg:'var(--teal-bg)', path:'/users' },
          { label:'Classes', value: stats?.classes, icon: Building2, color:'var(--purple)', bg:'var(--purple-bg)', path:'/classes' },
          { label:'Open Incidents', value: stats?.open_incidents, icon: AlertTriangle, color:'var(--red)', bg:'#fee2e2', path:'/incidents' },
          { label:'Pending Schemes', value: stats?.pending_schemes, icon: FileText, color:'var(--amber)', bg:'var(--amber-bg)', path:'/schemes' },
          { label:'Chronograms', value: stats?.chronograms, icon: Calendar, color:'var(--green)', bg:'var(--green-bg)', path:'/chronogram' },
        ].map(({ label, value, icon: Icon, color, bg, path }) => (
          <div
            key={label} className="stat-card"
            style={{ cursor:'pointer' }}
            onClick={() => navigate(path)}
          >
            <div className="stat-icon" style={{ background: bg }}>
              <Icon size={18} color={color}/>
            </div>
            <div className="stat-num">{value ?? '—'}</div>
            <div className="stat-label">{label}</div>
          </div>
        ))}
      </div>

      {/* Two column */}
      <div className="two-col" style={{ marginBottom: 20 }}>
        {/* Incidents by severity */}
        <div className="card">
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
            <div style={{ fontFamily:'var(--font-head)', fontSize:15, fontWeight:700 }}>
              Incidents this month
            </div>
            <button className="btn btn-sm btn-outline" onClick={() => navigate('/incidents')}>
              View all <ArrowRight size={12}/>
            </button>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={severityData} barSize={32}>
              <XAxis dataKey="name" tick={{ fontSize:11 }} axisLine={false} tickLine={false}/>
              <YAxis tick={{ fontSize:11 }} axisLine={false} tickLine={false} allowDecimals={false}/>
              <Tooltip
                contentStyle={{ fontSize:12, borderRadius:8, border:'1px solid var(--border)' }}
                cursor={{ fill:'var(--bg-3)' }}
              />
              <Bar dataKey="count" radius={[4,4,0,0]}>
                {severityData.map((s, i) => <Cell key={i} fill={s.color}/>)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pending schemes */}
        <div className="card">
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
            <div style={{ fontFamily:'var(--font-head)', fontSize:15, fontWeight:700 }}>
              Schemes awaiting review
            </div>
            <button className="btn btn-sm btn-outline" onClick={() => navigate('/schemes')}>
              View all <ArrowRight size={12}/>
            </button>
          </div>
          {pending_schemes?.length ? (
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {pending_schemes.map(s => (
                <div key={s.id} style={{
                  display:'flex', alignItems:'center', justifyContent:'space-between',
                  padding:'10px 12px', background:'var(--bg)', borderRadius:'var(--radius)',
                  border:'1px solid var(--border)',
                }}>
                  <div>
                    <div style={{ fontWeight:600, fontSize:13 }}>{s.trainer_name}</div>
                    <div style={{ fontSize:11, color:'var(--text-3)' }}>
                      {s.module_code} · {s.class_name||'No class'}
                    </div>
                  </div>
                  <span className="badge badge-submitted">Submitted</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state" style={{ padding:'24px 0' }}>
              <p>No schemes pending review</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent incidents */}
      {recent_incidents?.length > 0 && (
        <div className="card" style={{ padding:0 }}>
          <div style={{ padding:'16px 20px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div style={{ fontFamily:'var(--font-head)', fontSize:15, fontWeight:700 }}>
              Recent incidents
            </div>
            <button className="btn btn-sm btn-outline" onClick={() => navigate('/incidents')}>
              All incidents <ArrowRight size={12}/>
            </button>
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
