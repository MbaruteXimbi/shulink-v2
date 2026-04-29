import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import { format } from 'date-fns';
import {
  TrendingUp, TrendingDown, CheckCircle, AlertCircle,
  Clock, Minus, BarChart2, RefreshCw,
} from 'lucide-react';

const STATUS_CONFIG = {
  on_track:      { label: 'On Track',    color: 'var(--green)',  bg: 'var(--green-bg)',   border: '#a7f3d0', icon: CheckCircle },
  complete:      { label: 'Complete',    color: 'var(--teal)',   bg: 'var(--teal-bg)',    border: '#99f6e4', icon: CheckCircle },
  behind:        { label: 'Behind',      color: 'var(--red)',    bg: '#fee2e2',            border: '#fca5a5', icon: TrendingDown },
  ahead:         { label: 'Ahead',       color: 'var(--blue)',   bg: 'var(--blue-bg)',    border: '#bfdbfe', icon: TrendingUp },
  not_started:   { label: 'Not Started', color: 'var(--amber)',  bg: 'var(--amber-bg)',   border: '#fcd34d', icon: AlertCircle },
  no_allocation: { label: 'No Allocation', color: 'var(--text-3)', bg: 'var(--bg-3)',     border: 'var(--border)', icon: Minus },
};

function ProgressBar({ pct, status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.on_track;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ flex: 1, height: 8, background: 'var(--bg-3)', borderRadius: 100, overflow: 'hidden' }}>
        <div style={{
          width: `${Math.min(pct, 100)}%`,
          height: '100%',
          background: cfg.color,
          borderRadius: 100,
          transition: 'width .4s ease',
        }}/>
      </div>
      <span style={{ fontSize: 12, fontWeight: 700, color: cfg.color, minWidth: 36, textAlign: 'right' }}>
        {pct}%
      </span>
    </div>
  );
}

function ModuleRow({ mod }) {
  const cfg = STATUS_CONFIG[mod.status] || STATUS_CONFIG.on_track;
  const Icon = cfg.icon;

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr 200px 120px 120px 100px',
      gap: 16,
      alignItems: 'center',
      padding: '12px 18px',
      borderBottom: '1px solid var(--border)',
      transition: 'background .1s',
    }}
    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg)'}
    onMouseLeave={e => e.currentTarget.style.background = ''}
    >
      {/* Module info */}
      <div style={{ minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
          <span style={{
            fontFamily: 'monospace', fontSize: 11, fontWeight: 700,
            color: 'var(--primary)', background: 'var(--primary-bg)',
            padding: '1px 6px', borderRadius: 4, flexShrink: 0,
          }}>
            {mod.code}
          </span>
          <span style={{
            fontSize: 10, fontWeight: 600, textTransform: 'uppercase',
            letterSpacing: '.04em', color: 'var(--text-3)',
          }}>
            {mod.module_type}
          </span>
        </div>
        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {mod.name}
        </div>
        {mod.last_session && (
          <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 1 }}>
            Last session: {format(new Date(mod.last_session), 'dd MMM yyyy')}
          </div>
        )}
      </div>

      {/* Progress bar */}
      <div>
        <ProgressBar pct={mod.completion_pct} status={mod.status}/>
      </div>

      {/* Periods */}
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 16, fontWeight: 800, fontFamily: 'var(--font-head)', color: 'var(--text)' }}>
          {mod.taught_periods}
          <span style={{ fontSize: 12, fontWeight: 400, color: 'var(--text-3)' }}>/{mod.allocated_periods}</span>
        </div>
        <div style={{ fontSize: 10, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '.04em' }}>periods</div>
      </div>

      {/* Sessions */}
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 16, fontWeight: 800, fontFamily: 'var(--font-head)', color: 'var(--text)' }}>
          {mod.sessions_count}
        </div>
        <div style={{ fontSize: 10, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '.04em' }}>sessions</div>
      </div>

      {/* Status badge */}
      <div style={{ textAlign: 'right' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 5,
          padding: '4px 10px', borderRadius: 100,
          background: cfg.bg, border: `1px solid ${cfg.border}`,
          fontSize: 11, fontWeight: 600, color: cfg.color,
          whiteSpace: 'nowrap',
        }}>
          <Icon size={11}/>
          {cfg.label}
        </div>
        {mod.status === 'behind' && mod.expected_periods > 0 && (
          <div style={{ fontSize: 10, color: 'var(--red)', marginTop: 4 }}>
            Expected: {mod.expected_periods}p
          </div>
        )}
      </div>
    </div>
  );
}

export default function ModuleProgressPage() {
  const { can } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');
  const [selectedChrono, setSelectedChrono] = useState(0); // index

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data: res } = await api.get('/module-progress');
      setData(res);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return (
    <div>
      <div className="page-header">
        <div className="page-title">Module Progress</div>
      </div>
      <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-3)' }}>Loading progress data…</div>
    </div>
  );

  const progress = data?.progress || [];

  if (!progress.length) return (
    <div>
      <div className="page-header">
        <div className="page-title">Module Progress</div>
      </div>
      <div className="empty-state">
        <BarChart2 size={40} color="var(--text-3)" style={{ margin: '0 auto 14px' }}/>
        <h4>No chronogram data yet</h4>
        <p>Import a chronogram first — module progress will appear here once session plans are linked to schemes.</p>
      </div>
    </div>
  );

  const current = progress[selectedChrono] || progress[0];
  const { modules, summary, weeks_passed, weeks_total, term_progress_pct, qualification_title, academic_year } = current;

  const filtered = modules.filter(m => {
    if (filterStatus && m.status !== filterStatus) return false;
    if (filterType && m.module_type !== filterType) return false;
    return true;
  });

  // Sort — behind first, then not_started, then on_track, then ahead, then complete
  const statusOrder = { behind: 0, not_started: 1, on_track: 2, ahead: 3, complete: 4, no_allocation: 5 };
  const sorted = [...filtered].sort((a, b) => (statusOrder[a.status] ?? 9) - (statusOrder[b.status] ?? 9));

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Module Progress</div>
          <div className="page-subtitle">
            {qualification_title} · {academic_year} · {weeks_passed} of {weeks_total} teaching weeks elapsed
          </div>
        </div>
        <button className="btn btn-outline" onClick={load}>
          <RefreshCw size={13}/> Refresh
        </button>
      </div>

      {/* Chronogram selector — if multiple */}
      {progress.length > 1 && (
        <div className="filters-bar" style={{ marginBottom: 16 }}>
          {progress.map((p, i) => (
            <button
              key={p.chronogram_id}
              className={`btn btn-sm ${selectedChrono === i ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setSelectedChrono(i)}
            >
              {p.curriculum_code} · {p.academic_year}
            </button>
          ))}
        </div>
      )}

      {/* Term progress bar */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div style={{ fontFamily: 'var(--font-head)', fontSize: 14, fontWeight: 700 }}>
            Academic Year Progress
          </div>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--primary)' }}>
            {term_progress_pct}% of teaching weeks elapsed
          </div>
        </div>
        <div style={{ height: 10, background: 'var(--bg-3)', borderRadius: 100, overflow: 'hidden' }}>
          <div style={{ width: `${term_progress_pct}%`, height: '100%', background: 'var(--primary)', borderRadius: 100, transition: 'width .4s' }}/>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 11, color: 'var(--text-3)' }}>
          <span>Week 1</span>
          <span>{weeks_passed} weeks passed · {weeks_total - weeks_passed} remaining</span>
          <span>Week {weeks_total}</span>
        </div>
      </div>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 10, marginBottom: 20 }}>
        {[
          { label: 'On Track',    val: summary.on_track,    color: 'var(--green)', status: 'on_track' },
          { label: 'Behind',      val: summary.behind,      color: 'var(--red)',   status: 'behind' },
          { label: 'Not Started', val: summary.not_started, color: 'var(--amber)', status: 'not_started' },
          { label: 'Complete',    val: summary.complete,    color: 'var(--teal)',  status: 'complete' },
          { label: 'Ahead',       val: summary.ahead,       color: 'var(--blue)',  status: 'ahead' },
        ].map(s => (
          <div
            key={s.label}
            className="card-sm"
            style={{
              cursor: 'pointer',
              border: `1px solid ${filterStatus === s.status ? s.color : 'var(--border)'}`,
              transition: 'border-color .12s',
            }}
            onClick={() => setFilterStatus(filterStatus === s.status ? '' : s.status)}
          >
            <div style={{ fontFamily: 'var(--font-head)', fontSize: 28, fontWeight: 800, color: s.color }}>
              {s.val}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '.04em' }}>
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* Warnings */}
      {summary.behind > 0 && (
        <div className="alert alert-error" style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
          <TrendingDown size={16}/>
          <span>
            <strong>{summary.behind} module{summary.behind !== 1 ? 's are' : ' is'} behind schedule.</strong>{' '}
            Review session plan submissions and check chronogram alignment.
          </span>
        </div>
      )}
      {summary.not_started > 0 && term_progress_pct > 10 && (
        <div className="alert alert-warn" style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
          <AlertCircle size={16}/>
          <span>
            <strong>{summary.not_started} module{summary.not_started !== 1 ? 's have' : ' has'} not been started</strong>{' '}
            despite {term_progress_pct}% of the year elapsed.
          </span>
        </div>
      )}

      {/* Filters */}
      <div className="filters-bar">
        <select className="filter-input" value={filterType} onChange={e => setFilterType(e.target.value)}>
          <option value="">All Types</option>
          <option value="specific">Specific</option>
          <option value="general">General</option>
          <option value="complementary">Complementary</option>
        </select>
        <div className="flex gap-2">
          {['','on_track','behind','not_started','complete','ahead'].map(st => (
            <button
              key={st}
              className={`btn btn-sm ${filterStatus === st ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setFilterStatus(st)}
            >
              {st ? STATUS_CONFIG[st]?.label : 'All'}
            </button>
          ))}
        </div>
      </div>

      {/* Module table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {/* Header */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 200px 120px 120px 100px',
          gap: 16, padding: '10px 18px',
          background: 'var(--bg)',
          borderBottom: '1px solid var(--border)',
        }}>
          {['Module', 'Progress', 'Periods', 'Sessions', 'Status'].map(h => (
            <div key={h} style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '.05em', textAlign: h === 'Status' ? 'right' : h === 'Periods' || h === 'Sessions' ? 'center' : 'left' }}>
              {h}
            </div>
          ))}
        </div>

        {sorted.length === 0 ? (
          <div className="empty-state"><p>No modules match the current filters</p></div>
        ) : (
          sorted.map(mod => <ModuleRow key={mod.module_id} mod={mod}/>)
        )}
      </div>

      <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 12, textAlign: 'right' }}>
        Showing {sorted.length} of {modules.length} modules · Progress based on session plans submitted
      </div>
    </div>
  );
}
