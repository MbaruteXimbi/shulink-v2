import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { Upload, Download, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';

function ImportCard({ title, description, endpoint, templateName, acceptField, extraFields = [], onDone }) {
  const [file, setFile] = useState(null);
  const [extras, setExtras] = useState({});
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);
  const [err, setErr] = useState('');

  const submit = async () => {
    if (!file) { setErr('Select a file first'); return; }
    setImporting(true); setErr(''); setResult(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      Object.entries(extras).forEach(([k,v]) => fd.append(k,v));
      const { data } = await api.post(endpoint, fd);
      setResult(data);
      onDone?.();
    } catch (er) { setErr(er.response?.data?.error || 'Import failed'); }
    finally { setImporting(false); }
  };

  return (
    <div className="card">
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:14 }}>
        <div>
          <div style={{ fontFamily:'var(--font-head)', fontSize:15, fontWeight:700, marginBottom:4 }}>{title}</div>
          <div style={{ fontSize:12, color:'var(--text-3)' }}>{description}</div>
        </div>
        <a href={`/api/templates/${templateName}`} download className="btn btn-sm btn-outline">
          <Download size={12}/> Template
        </a>
      </div>

      {extraFields.map(f => (
        <div key={f.key} className="form-group" style={{ marginBottom:12 }}>
          <label className="form-label">{f.label}</label>
          {f.type === 'select' ? (
            <select className="form-select" value={extras[f.key]||''} onChange={e => setExtras(x=>({...x,[f.key]:e.target.value}))}>
              <option value="">Select…</option>
              {f.options?.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
            </select>
          ) : (
            <input className="form-input" value={extras[f.key]||''} onChange={e => setExtras(x=>({...x,[f.key]:e.target.value}))} placeholder={f.placeholder}/>
          )}
        </div>
      ))}

      {err && <div className="alert alert-error" style={{ marginBottom:12 }}>{err}</div>}

      {result && (
        <div className="alert alert-success" style={{ marginBottom:12 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
            <CheckCircle size={15}/>
            <strong>{result.message}</strong>
          </div>
          {result.default_password && (
            <div style={{ fontSize:12 }}>Default password: <code style={{ background:'rgba(0,0,0,.08)', padding:'1px 5px', borderRadius:4 }}>{result.default_password}</code></div>
          )}
          {result.errors?.length > 0 && (
            <div style={{ marginTop:8 }}>
              <div style={{ fontSize:12, fontWeight:600, marginBottom:4 }}>Warnings ({result.errors.length}):</div>
              {result.errors.slice(0,5).map((e,i) => (
                <div key={i} style={{ fontSize:11, color:'#92400e' }}>Row {e.row}: {e.error}</div>
              ))}
              {result.errors.length > 5 && <div style={{ fontSize:11 }}>…and {result.errors.length-5} more</div>}
            </div>
          )}
        </div>
      )}

      <label className="upload-zone" style={{ cursor:'pointer' }}>
        <input type="file" accept={acceptField} onChange={e => { setFile(e.target.files[0]); setResult(null); }}/>
        <Upload size={24} color="var(--text-3)" style={{ marginBottom:6 }}/>
        {file ? (
          <div style={{ fontSize:13, fontWeight:600 }}>{file.name}</div>
        ) : (
          <div style={{ fontSize:13, color:'var(--text-3)' }}>Click to select Excel file (.xlsx)</div>
        )}
      </label>

      <button
        className="btn btn-primary w-full"
        style={{ marginTop:12 }}
        disabled={importing || !file}
        onClick={submit}
      >
        {importing ? 'Importing…' : `Import ${title}`}
      </button>
    </div>
  );
}

export default function ImportPage() {
  const { can } = useAuth();
  const [logs, setLogs] = useState([]);
  const [quals, setQuals] = useState([]);

  const loadLogs = () => api.get('/import/logs').then(r => setLogs(r.data));
  useEffect(() => {
    loadLogs();
    api.get('/school/qualifications').then(r => setQuals(r.data));
  }, []);

  const TYPE_ICON = { students:'👥', trainers:'👤', modules:'📚', chronogram:'📅' };

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Excel Import</div>
          <div className="page-subtitle">Bulk import trainees, staff, modules and chronogram data</div>
        </div>
      </div>

      <div className="alert alert-info" style={{ marginBottom:20 }}>
        <strong>How it works:</strong> Download the Shulink Excel template, fill it in, then upload here.
        Module codes and class names must match exactly what's already in Shulink.
        Existing records are updated (not duplicated) on re-import.
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(340px,1fr))', gap:18, marginBottom:28 }}>
        <ImportCard
          title="Trainees"
          description="Bulk import trainee records with class assignments and parent contacts"
          endpoint="/import/students"
          templateName="students"
          acceptField=".xlsx,.xls"
          onDone={loadLogs}
        />

        {can('school_admin','headmaster') && (
          <ImportCard
            title="Staff"
            description="Bulk import trainers and staff members. Passwords auto-generated."
            endpoint="/import/trainers"
            templateName="trainers"
            acceptField=".xlsx,.xls"
            onDone={loadLogs}
          />
        )}

        {can('school_admin','headmaster','super_admin') && (
          <ImportCard
            title="Modules"
            description="Bulk import modules for a qualification from RTB curriculum document"
            endpoint="/import/modules"
            templateName="modules"
            acceptField=".xlsx,.xls"
            extraFields={[{
              key:'qualification_id', label:'Qualification *', type:'select',
              options: quals.map(q => ({ id: q.id, label: `[${q.curriculum_code}] ${q.title}` }))
            }]}
            onDone={loadLogs}
          />
        )}
      </div>

      {/* Import logs */}
      <div className="card" style={{ padding:0 }}>
        <div style={{ padding:'14px 20px', borderBottom:'1px solid var(--border)' }}>
          <div style={{ fontFamily:'var(--font-head)', fontSize:15, fontWeight:700 }}>Import History</div>
        </div>
        {logs.length === 0 ? (
          <div className="empty-state"><p>No imports yet</p></div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Type</th><th>File</th><th>Total</th><th>Success</th><th>Errors</th><th>By</th><th>When</th></tr>
              </thead>
              <tbody>
                {logs.map(l => (
                  <tr key={l.id}>
                    <td>
                      <span style={{ fontSize:16, marginRight:6 }}>{TYPE_ICON[l.import_type]||'📁'}</span>
                      <span style={{ textTransform:'capitalize', fontWeight:500 }}>{l.import_type}</span>
                    </td>
                    <td style={{ fontSize:12, color:'var(--text-2)', maxWidth:200, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                      {l.file_name || '—'}
                    </td>
                    <td style={{ fontWeight:600 }}>{l.total_rows}</td>
                    <td style={{ color:'var(--green)', fontWeight:600 }}>{l.success_rows}</td>
                    <td style={{ color: l.error_rows > 0 ? 'var(--red)' : 'var(--text-3)', fontWeight: l.error_rows > 0 ? 700 : 400 }}>
                      {l.error_rows}
                    </td>
                    <td style={{ fontSize:12 }}>{l.imported_by_name || '—'}</td>
                    <td style={{ fontSize:12, whiteSpace:'nowrap', color:'var(--text-3)' }}>
                      {l.created_at ? format(new Date(l.created_at),'dd MMM yyyy HH:mm') : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
