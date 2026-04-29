import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import { Calendar, Award, BookOpen, Building2 } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate  = useNavigate();

  const [step, setStep]     = useState(1); // 1=email, 2=school+password
  const [email, setEmail]   = useState('');
  const [schools, setSchools] = useState([]);
  const [selected, setSelected] = useState(null);
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const handleLookup = async e => {
    e.preventDefault(); setLoading(true); setError('');
    try {
      const { data } = await api.post('/auth/lookup', { email });
      setSchools(data.schools);
      if (data.schools.length === 1) setSelected(data.schools[0]);
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.error || 'No account found for this email');
    } finally { setLoading(false); }
  };

  const handleLogin = async e => {
    e.preventDefault();
    if (!selected) { setError('Please select a school'); return; }
    setLoading(true); setError('');
    try {
      const { data } = await api.post('/auth/login', {
        email, password, school_id: selected.school_id,
      });
      login(data.token, data.user);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid credentials');
    } finally { setLoading(false); }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex',
      background: 'linear-gradient(135deg, #f8f7f4 0%, #fdf2f2 100%)',
    }}>
      {/* Left panel */}
      <div style={{
        width: 420, flexShrink: 0,
        background: '#fff',
        display: 'flex', flexDirection: 'column',
        justifyContent: 'center',
        padding: '48px 44px',
        borderRight: '1px solid var(--border)',
      }}>
        {/* Logo */}
        <div style={{ marginBottom: 40 }}>
          <div style={{
            fontFamily: 'var(--font-head)', fontSize: 32, fontWeight: 800,
            color: 'var(--primary)', letterSpacing: -1, marginBottom: 4,
          }}>Shulink</div>
          <div style={{ fontSize: 13, color: 'var(--text-3)' }}>
            TVET School Management Platform
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>
            by MilleHills Ltd · Rwanda + East Africa
          </div>
        </div>

        {/* Step indicator */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 28 }}>
          {[1,2].map(s => (
            <div key={s} style={{
              height: 3, flex: 1, borderRadius: 100,
              background: step >= s ? 'var(--primary)' : 'var(--border)',
              transition: 'background .3s',
            }}/>
          ))}
        </div>

        {error && (
          <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>
        )}

        {step === 1 && (
          <form onSubmit={handleLookup}>
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 20, fontWeight: 700, fontFamily: 'var(--font-head)', marginBottom: 4 }}>
                Sign in
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-3)' }}>Enter your email to get started</div>
            </div>
            <div className="form-group" style={{ marginBottom: 20 }}>
              <label className="form-label">Email address</label>
              <input
                type="email" className="form-input"
                value={email} onChange={e => setEmail(e.target.value)}
                placeholder="your@school.rw"
                required autoFocus
              />
            </div>
            <button type="submit" className="btn btn-primary w-full" disabled={loading}>
              {loading ? 'Looking up…' : 'Continue →'}
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 20, fontWeight: 700, fontFamily: 'var(--font-head)', marginBottom: 4 }}>
                Welcome back
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-3)' }}>{email}</div>
            </div>

            {/* School picker */}
            {schools.length > 1 && (
              <div style={{ marginBottom: 18 }}>
                <div className="form-label" style={{ marginBottom: 8 }}>Select school</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {schools.map(sc => (
                    <div
                      key={sc.school_id}
                      onClick={() => setSelected(sc)}
                      style={{
                        padding: '12px 14px',
                        border: `1px solid ${selected?.school_id === sc.school_id ? 'var(--primary)' : 'var(--border)'}`,
                        borderRadius: 'var(--radius)',
                        background: selected?.school_id === sc.school_id ? 'var(--primary-bg)' : '#fff',
                        cursor: 'pointer',
                        transition: 'all .12s',
                      }}
                    >
                      <div style={{ fontWeight: 600, fontSize: 13, color: selected?.school_id === sc.school_id ? 'var(--primary)' : 'var(--text)' }}>
                        {sc.school_name}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-3)' }}>
                        {sc.school_type} · {sc.district} · <span style={{ textTransform: 'capitalize' }}>{sc.role}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {schools.length === 1 && selected && (
              <div style={{
                padding: '12px 14px', marginBottom: 18,
                background: 'var(--primary-bg)', border: '1px solid var(--primary-border)',
                borderRadius: 'var(--radius)',
              }}>
                <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--primary)' }}>{selected.school_name}</div>
                <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{selected.school_type} · {selected.district}</div>
              </div>
            )}

            <div className="form-group" style={{ marginBottom: 20 }}>
              <label className="form-label">Password</label>
              <input
                type="password" className="form-input"
                value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required autoFocus
              />
            </div>

            <button type="submit" className="btn btn-primary w-full" disabled={loading || !selected}>
              {loading ? 'Signing in…' : 'Sign in'}
            </button>

            <button
              type="button"
              onClick={() => { setStep(1); setError(''); setPassword(''); }}
              style={{ marginTop: 12, background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--text-3)', width: '100%', textAlign: 'center' }}
            >
              ← Use a different email
            </button>
          </form>
        )}
      </div>

      {/* Right panel - decorative */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 60 }}>
        <div style={{ maxWidth: 420 }}>
          <div style={{
            fontFamily: 'var(--font-head)', fontSize: 34, fontWeight: 800,
            color: 'var(--text)', lineHeight: 1.2, marginBottom: 20,
          }}>
            Rwanda's TVET<br/>management platform
          </div>
          <div style={{ fontSize: 15, color: 'var(--text-2)', lineHeight: 1.7, marginBottom: 32 }}>
            RTB-aligned curriculum management, chronogram tracking, CBC portfolios, and discipline management — all in one place.
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              { icon: Calendar,  title: 'RTB chronogram import',   desc: 'Upload the RTB Excel template once per academic year' },
              { icon: Award,     title: 'CBC portfolio tracking',   desc: 'Track LO competencies, evidence, and integrated assessments' },
              { icon: BookOpen,  title: 'Scheme & session plans',   desc: 'Linked to chronogram weeks and RTB learning outcomes' },
              { icon: Building2, title: 'Multi-school SaaS',        desc: 'One platform, every school in Rwanda' },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                <div style={{ width: 36, height: 36, borderRadius: 9, background: 'var(--primary-bg)', border: '1px solid var(--primary-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={18} color="var(--primary)"/>
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text)' }}>{title}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 1 }}>{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
