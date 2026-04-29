import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import { format } from 'date-fns';
import {
  User, BookOpen, FileText, Eye, Award, Star,
  Share2, Printer, CheckCircle, Clock, TrendingUp,
  ChevronDown, ChevronRight,
} from 'lucide-react';

// ── PRINT STYLES ──────────────────────────────────────────────
const printStyles = `
@media print {
  .no-print { display: none !important; }
  .sidebar  { display: none !important; }
  .main-content { margin-left: 0 !important; }
  .page-content { padding: 0 !important; }
  body { font-size: 12px; }
  .portfolio-header { border-bottom: 2px solid #C0392B; padding-bottom: 16px; margin-bottom: 24px; }
  .section-card { break-inside: avoid; border: 1px solid #ddd; border-radius: 8px; padding: 16px; margin-bottom: 16px; }
  .stat-row { display: flex; gap: 16px; margin-bottom: 16px; }
  .stat-box { border: 1px solid #ddd; border-radius: 6px; padding: 10px 14px; text-align: center; flex: 1; }
}
`;

// ── SCORE BAR ─────────────────────────────────────────────────
function ScoreBar({ value, max = 5 }) {
  const pct = (value / max) * 100;
  const color = value >= 4 ? 'var(--green)' : value >= 3 ? 'var(--amber)' : 'var(--red)';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ flex: 1, height: 6, background: 'var(--bg-3)', borderRadius: 100, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 100 }}/>
      </div>
      <span style={{ fontSize: 12, fontWeight: 700, color, minWidth: 28 }}>{value}/{max}</span>
    </div>
  );
}

// ── SECTION WRAPPER ───────────────────────────────────────────
function Section({ title, icon: Icon, count, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="section-card" style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', marginBottom: 16 }}>
      <div
        onClick={() => setOpen(o => !o)}
        style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 20px', cursor: 'pointer', background: 'var(--bg)' }}
      >
        <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--primary-bg)', border: '1px solid var(--primary-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon size={16} color="var(--primary)"/>
        </div>
        <div style={{ flex: 1 }}>
          <span style={{ fontFamily: 'var(--font-head)', fontSize: 14, fontWeight: 700 }}>{title}</span>
          {count !== undefined && (
            <span style={{ marginLeft: 8, fontSize: 12, color: 'var(--text-3)' }}>{count} record{count !== 1 ? 's' : ''}</span>
          )}
        </div>
        {open ? <ChevronDown size={15} color="var(--text-3)"/> : <ChevronRight size={15} color="var(--text-3)"/>}
      </div>
      {open && <div style={{ padding: '16px 20px' }}>{children}</div>}
    </div>
  );
}

// ── MAIN PAGE ─────────────────────────────────────────────────
export default function TrainerPortfolioPage() {
  const { id } = useParams();          // trainer user id — optional, defaults to self
  const { user, can } = useAuth();
  const navigate = useNavigate();
  const [portfolio, setPortfolio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const trainerId = id || user?.id;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/trainer-portfolio/${trainerId}`);
      setPortfolio(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [trainerId]);

  useEffect(() => { load(); }, [load]);

  const handlePrint = () => window.print();

  const handleShare = async () => {
    const url = `${window.location.origin}/portfolio/trainer/${trainerId}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      prompt('Copy this link:', url);
    }
  };

  if (loading) return (
    <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-3)' }}>
      Loading portfolio…
    </div>
  );

  if (!portfolio) return (
    <div className="empty-state">
      <h4>Portfolio not found</h4>
    </div>
  );

  const { trainer, schemes, session_plans, observations, competencies_signed, stats } = portfolio;

  // Average observation score
  const avgScore = observations?.length
    ? (observations.reduce((s, o) => s + (o.overall_score || 0), 0) / observations.length).toFixed(1)
    : null;

  const DIMS = [
    { key: 'preparation',        label: 'Preparation' },
    { key: 'delivery',           label: 'Delivery' },
    { key: 'student_engagement', label: 'Trainee Engagement' },
    { key: 'classroom_mgmt',     label: 'Classroom Management' },
    { key: 'assessment_used',    label: 'Assessment Used' },
  ];

  return (
    <>
      <style>{printStyles}</style>

      <div>
        {/* Action bar */}
        <div className="page-header no-print">
          <div>
            <div className="page-title">Trainer Portfolio</div>
            <div className="page-subtitle">Professional teaching portfolio — shareable &amp; printable</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-outline" onClick={handleShare}>
              <Share2 size={14}/>
              {copied ? 'Link copied!' : 'Share link'}
            </button>
            <button className="btn btn-primary" onClick={handlePrint}>
              <Printer size={14}/> Print / PDF
            </button>
          </div>
        </div>

        {/* ── PORTFOLIO HEADER ── */}
        <div className="portfolio-header" style={{
          background: 'var(--bg-2)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-xl)',
          padding: '28px 32px',
          marginBottom: 20,
          borderTop: '4px solid var(--primary)',
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20 }}>
            {/* Avatar */}
            <div style={{
              width: 72, height: 72, borderRadius: 16,
              background: 'var(--primary-bg)', border: '2px solid var(--primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 24, fontWeight: 800, color: 'var(--primary)',
              fontFamily: 'var(--font-head)', flexShrink: 0,
            }}>
              {trainer?.full_name?.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()}
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'var(--font-head)', fontSize: 24, fontWeight: 800, color: 'var(--text)', marginBottom: 4 }}>
                {trainer?.full_name}
              </div>
              <div style={{ fontSize: 14, color: 'var(--text-2)', marginBottom: 2 }}>
                {trainer?.role?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())} · {trainer?.school_name}
              </div>
              {trainer?.department_name && (
                <div style={{ fontSize: 13, color: 'var(--text-3)' }}>{trainer.department_name}</div>
              )}
              {trainer?.email && (
                <div style={{ fontSize: 13, color: 'var(--primary)', marginTop: 4 }}>{trainer.email}</div>
              )}
            </div>

            {/* RTB badge */}
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 4 }}>
                Rwanda TVET Board
              </div>
              <div className="rtb-badge">RTB</div>
              <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 6 }}>
                Generated {format(new Date(), 'dd MMM yyyy')}
              </div>
            </div>
          </div>

          {/* Stats row */}
          <div className="stat-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginTop: 24 }}>
            {[
              { label: 'Schemes',       value: stats?.schemes_total || 0,     color: 'var(--primary)' },
              { label: 'Session Plans', value: stats?.session_plans_total || 0, color: 'var(--blue)' },
              { label: 'Observations',  value: observations?.length || 0,     color: 'var(--teal)' },
              { label: 'Avg Score',     value: avgScore ? `${avgScore}/5` : '—', color: avgScore >= 4 ? 'var(--green)' : avgScore >= 3 ? 'var(--amber)' : 'var(--text-3)' },
              { label: 'LOs Signed Off',value: competencies_signed?.length || 0, color: 'var(--green)' },
            ].map(s => (
              <div key={s.label} className="stat-box" style={{ background: 'var(--bg-3)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '12px 14px', textAlign: 'center' }}>
                <div style={{ fontFamily: 'var(--font-head)', fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '.04em', marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── OBSERVATIONS ── */}
        <Section title="Classroom Observations" icon={Eye} count={observations?.length} defaultOpen>
          {observations?.length ? (
            <>
              {/* Dimension averages */}
              {observations.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 10 }}>
                    Average scores across {observations.length} observation{observations.length !== 1 ? 's' : ''}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {DIMS.map(d => {
                      const avg = (observations.reduce((s, o) => s + (o[d.key] || 0), 0) / observations.length).toFixed(1);
                      return (
                        <div key={d.key} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{ width: 140, fontSize: 12, color: 'var(--text-2)', flexShrink: 0 }}>{d.label}</div>
                          <ScoreBar value={parseFloat(avg)}/>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Individual observations */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {observations.map(o => (
                  <div key={o.id} style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: o.strengths ? 10 : 0 }}>
                      <div style={{ width: 40, height: 40, borderRadius: 10, background: o.overall_score >= 4 ? 'var(--green-bg)' : o.overall_score >= 3 ? 'var(--amber-bg)' : '#fee2e2', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <span style={{ fontFamily: 'var(--font-head)', fontSize: 15, fontWeight: 800, color: o.overall_score >= 4 ? 'var(--green)' : o.overall_score >= 3 ? 'var(--amber)' : 'var(--red)', lineHeight: 1 }}>{o.overall_score}</span>
                        <span style={{ fontSize: 9, color: 'var(--text-3)' }}>/5</span>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>
                          {o.subject || 'Observation'} {o.module_code && `· ${o.module_code}`}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-3)' }}>
                          {o.class_name} · Observed by {o.observer_name} · {o.observation_date ? format(new Date(o.observation_date), 'dd MMM yyyy') : '—'}
                        </div>
                      </div>
                    </div>
                    {o.strengths && (
                      <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 6, paddingTop: 6, borderTop: '1px solid var(--border)' }}>
                        <strong style={{ color: 'var(--green)' }}>Strengths:</strong> {o.strengths}
                      </div>
                    )}
                    {o.areas_to_improve && (
                      <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 4 }}>
                        <strong style={{ color: 'var(--amber)' }}>Areas to improve:</strong> {o.areas_to_improve}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="empty-state" style={{ padding: '20px 0' }}>
              <p>No observations recorded yet</p>
            </div>
          )}
        </Section>

        {/* ── SCHEMES OF WORK ── */}
        <Section title="Schemes of Work" icon={FileText} count={schemes?.length} defaultOpen={false}>
          {schemes?.length ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {schemes.map(s => (
                <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{s.subject}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>
                      {s.module_code && <span style={{ fontFamily: 'monospace', color: 'var(--primary)', marginRight: 8 }}>{s.module_code}</span>}
                      {s.class_name || 'No class'} · {s.session_count || 0} session plans
                      {s.approved_at && <span style={{ marginLeft: 8 }}>· Approved {format(new Date(s.approved_at), 'dd MMM yyyy')}</span>}
                    </div>
                  </div>
                  <span className={`badge badge-${s.status}`}>{s.status}</span>
                  {s.status === 'approved' && <CheckCircle size={14} color="var(--green)"/>}
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state" style={{ padding: '20px 0' }}><p>No schemes yet</p></div>
          )}
        </Section>

        {/* ── SESSION PLANS ── */}
        <Section title="Session Plans" icon={BookOpen} count={session_plans?.length} defaultOpen={false}>
          {session_plans?.length ? (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 14 }}>
                {[
                  { label: 'Total', val: session_plans.length, color: 'var(--text)' },
                  { label: 'Submitted', val: session_plans.filter(p => p.status === 'submitted').length, color: 'var(--blue)' },
                  { label: 'Reviewed', val: session_plans.filter(p => p.status === 'reviewed').length, color: 'var(--green)' },
                ].map(s => (
                  <div key={s.label} style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '10px 14px', textAlign: 'center' }}>
                    <div style={{ fontFamily: 'var(--font-head)', fontSize: 20, fontWeight: 800, color: s.color }}>{s.val}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{s.label}</div>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {session_plans.slice(0, 10).map(p => (
                  <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
                    <div style={{ width: 28, height: 28, borderRadius: 6, background: 'var(--primary-bg)', border: '1px solid var(--primary-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: 'var(--primary)', flexShrink: 0 }}>
                      W{p.week_number}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.topic}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-3)' }}>
                        {p.module_code && <span style={{ fontFamily: 'monospace', color: 'var(--primary)', marginRight: 6 }}>{p.module_code}</span>}
                        {p.lesson_date ? format(new Date(p.lesson_date), 'dd MMM yyyy') : 'No date'}
                      </div>
                    </div>
                    <span className={`badge badge-${p.status}`}>{p.status}</span>
                  </div>
                ))}
                {session_plans.length > 10 && (
                  <div style={{ fontSize: 12, color: 'var(--text-3)', textAlign: 'center', paddingTop: 8 }}>
                    + {session_plans.length - 10} more session plans
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="empty-state" style={{ padding: '20px 0' }}><p>No session plans yet</p></div>
          )}
        </Section>

        {/* ── COMPETENCIES SIGNED OFF ── */}
        <Section title="Trainee Competencies Signed Off" icon={Award} count={competencies_signed?.length} defaultOpen={false}>
          {competencies_signed?.length ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {competencies_signed.map(c => (
                <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 14px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
                  <CheckCircle size={14} color="var(--green)" style={{ flexShrink: 0 }}/>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontWeight: 500, fontSize: 13 }}>{c.student_name}</span>
                    <span style={{ fontSize: 12, color: 'var(--text-3)', marginLeft: 8 }}>
                      {c.module_code} {c.lo_title && `· LO${c.lo_number}: ${c.lo_title}`}
                    </span>
                  </div>
                  <span className={`badge badge-${c.status}`}>{c.status?.replace(/_/g,' ')}</span>
                  {c.final_score && (
                    <span style={{ fontSize: 12, fontWeight: 700, color: parseFloat(c.final_score) >= 70 ? 'var(--green)' : 'var(--red)' }}>
                      {c.final_score}%
                    </span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state" style={{ padding: '20px 0' }}><p>No competencies signed off yet</p></div>
          )}
        </Section>

        {/* Print footer */}
        <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-3)', fontSize: 12, borderTop: '1px solid var(--border)', marginTop: 20 }}>
          Generated by Shulink · MilleHills Ltd · Rwanda TVET Board aligned · {format(new Date(), 'dd MMMM yyyy')}
        </div>
      </div>
    </>
  );
}
