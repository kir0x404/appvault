'use client';
import { useEffect, useState } from 'react';

interface App {
  id: string;
  name: string;
  description: string;
  image: string;
  downloadLink: string;
  category: string;
  version: string;
  size: string;
  downloads: number;
  createdAt: string;
}

const emptyForm = { name: '', description: '', image: '', downloadLink: '', category: 'General', version: '1.0', size: '' };

export default function AdminPanel() {
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [apps, setApps] = useState<App[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    const saved = sessionStorage.getItem('admin_token');
    if (saved) { setToken(saved); setIsLoggedIn(true); }
  }, []);

  useEffect(() => {
    if (isLoggedIn) loadApps();
  }, [isLoggedIn]);

  const login = async () => {
    setLoginError('');
    const r = await fetch('/api/admin', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password }) });
    if (r.ok) {
      const { token: t } = await r.json();
      sessionStorage.setItem('admin_token', t);
      setToken(t);
      setIsLoggedIn(true);
    } else {
      setLoginError('Invalid password');
    }
  };

  const loadApps = async () => {
    const r = await fetch('/api/apps');
    const d = await r.json();
    setApps(Array.isArray(d) ? d : []);
  };

  const save = async () => {
    if (!form.name || !form.downloadLink) { setMsg('❌ Name and Download Link are required.'); return; }
    setSaving(true);
    const method = editingId ? 'PUT' : 'POST';
    const url = editingId ? `/api/apps/${editingId}` : '/api/apps';
    const r = await fetch(url, {
      method, headers: { 'Content-Type': 'application/json', 'x-admin-token': token },
      body: JSON.stringify(form)
    });
    if (r.ok) {
      setMsg(editingId ? '✅ App updated!' : '✅ App published!');
      setForm(emptyForm);
      setEditingId(null);
      loadApps();
    } else {
      setMsg('❌ Save failed.');
    }
    setSaving(false);
    setTimeout(() => setMsg(''), 3000);
  };

  const deleteApp = async (id: string) => {
    await fetch(`/api/apps/${id}`, { method: 'DELETE', headers: { 'x-admin-token': token } });
    setDeleteConfirm(null);
    loadApps();
  };

  const startEdit = (app: App) => {
    setForm({ name: app.name, description: app.description, image: app.image, downloadLink: app.downloadLink, category: app.category, version: app.version, size: app.size });
    setEditingId(app.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!isLoggedIn) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: '20px', padding: '48px', width: '100%', maxWidth: '420px', textAlign: 'center' }}>
          <div style={{ fontSize: '40px', marginBottom: '16px' }}>🔐</div>
          <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: '24px', marginBottom: '8px' }}>Admin Panel</h1>
          <p style={{ color: 'var(--text2)', fontSize: '14px', marginBottom: '32px' }}>AppVault Management</p>
          <input
            type="password" value={password} onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && login()}
            placeholder="Enter admin password"
            style={{ width: '100%', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '10px', padding: '12px 16px', color: 'var(--text)', fontSize: '14px', outline: 'none', fontFamily: "'Space Grotesk', sans-serif", marginBottom: '12px' }}
          />
          {loginError && <p style={{ color: 'var(--danger)', fontSize: '13px', marginBottom: '12px' }}>{loginError}</p>}
          <button onClick={login} style={{ width: '100%', background: 'var(--accent)', color: '#000', border: 'none', padding: '13px', borderRadius: '10px', fontWeight: 700, fontSize: '15px', cursor: 'pointer', fontFamily: "'Space Grotesk', sans-serif" }}>
            Login
          </button>
        </div>
      </div>
    );
  }

  const inputStyle = {
    width: '100%', background: 'var(--bg2)', border: '1px solid var(--border)',
    borderRadius: '8px', padding: '10px 14px', color: 'var(--text)', fontSize: '14px',
    outline: 'none', fontFamily: "'Space Grotesk', sans-serif", boxSizing: 'border-box' as const
  };

  const labelStyle = { fontSize: '12px', color: 'var(--text2)', marginBottom: '6px', textTransform: 'uppercase' as const, letterSpacing: '0.08em', display: 'block' };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: '32px 24px' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '40px' }}>
          <div>
            <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: '28px', background: 'linear-gradient(135deg, #00E5FF, #7C3AED)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              ⚡ AppVault Admin
            </h1>
            <p style={{ color: 'var(--text2)', fontSize: '13px', marginTop: '4px' }}>{apps.length} apps published</p>
          </div>
          <button onClick={() => { sessionStorage.removeItem('admin_token'); setIsLoggedIn(false); setToken(''); }}
            style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text2)', padding: '8px 18px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontFamily: "'Space Grotesk', sans-serif" }}>
            Logout
          </button>
        </div>

        {/* Form */}
        <div style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: '16px', padding: '32px', marginBottom: '40px' }}>
          <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: '18px', marginBottom: '24px' }}>
            {editingId ? '✏️ Edit App' : '+ Publish New App'}
          </h2>

          {msg && (
            <div style={{ background: msg.startsWith('✅') ? 'rgba(63,185,80,0.1)' : 'rgba(248,81,73,0.1)', border: `1px solid ${msg.startsWith('✅') ? 'var(--success)' : 'var(--danger)'}`, borderRadius: '8px', padding: '12px 16px', marginBottom: '20px', fontSize: '14px' }}>
              {msg}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>App Name *</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. My Awesome App" style={inputStyle} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Description</label>
              <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Describe the app, features, requirements..." rows={4}
                style={{ ...inputStyle, resize: 'vertical' }} />
            </div>
            <div>
              <label style={labelStyle}>App Image URL</label>
              <input value={form.image} onChange={e => setForm(f => ({ ...f, image: e.target.value }))} placeholder="https://i.imgur.com/..." style={inputStyle} />
              {form.image && <img src={form.image} alt="preview" style={{ marginTop: '10px', height: '80px', borderRadius: '8px', objectFit: 'cover', border: '1px solid var(--border)' }} />}
            </div>
            <div>
              <label style={labelStyle}>Download Link *</label>
              <input value={form.downloadLink} onChange={e => setForm(f => ({ ...f, downloadLink: e.target.value }))} placeholder="https://drive.google.com/..." style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Category</label>
              <input value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} placeholder="Tools, Games, Social..." style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Version</label>
              <input value={form.version} onChange={e => setForm(f => ({ ...f, version: e.target.value }))} placeholder="1.0.0" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>File Size</label>
              <input value={form.size} onChange={e => setForm(f => ({ ...f, size: e.target.value }))} placeholder="e.g. 24 MB" style={inputStyle} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
            <button onClick={save} disabled={saving} style={{ background: 'var(--accent)', color: '#000', border: 'none', padding: '12px 28px', borderRadius: '10px', fontWeight: 700, fontSize: '15px', cursor: 'pointer', fontFamily: "'Space Grotesk', sans-serif" }}>
              {saving ? 'Saving...' : editingId ? 'Update App' : 'Publish App'}
            </button>
            {editingId && (
              <button onClick={() => { setEditingId(null); setForm(emptyForm); }} style={{ background: 'transparent', color: 'var(--text2)', border: '1px solid var(--border)', padding: '12px 20px', borderRadius: '10px', cursor: 'pointer', fontSize: '14px', fontFamily: "'Space Grotesk', sans-serif" }}>
                Cancel
              </button>
            )}
          </div>
        </div>

        {/* Apps table */}
        <div style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: '16px', overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
            <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: '18px' }}>Published Apps</h2>
          </div>
          {apps.length === 0 ? (
            <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text2)' }}>No apps yet. Publish your first one above!</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['App', 'Category', 'Version', 'Size', 'Downloads', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '12px 20px', textAlign: 'left', fontSize: '11px', color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {apps.map(app => (
                  <tr key={app.id} style={{ borderBottom: '1px solid var(--border)' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg2)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <td style={{ padding: '14px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '10px', overflow: 'hidden', background: 'var(--bg2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          {app.image ? <img src={app.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span>📱</span>}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '14px' }}>{app.name}</div>
                          <div style={{ fontSize: '12px', color: 'var(--text2)', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{app.description}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '14px 20px', fontSize: '13px', color: 'var(--text2)' }}>{app.category}</td>
                    <td style={{ padding: '14px 20px', fontSize: '13px', color: 'var(--text2)' }}>v{app.version}</td>
                    <td style={{ padding: '14px 20px', fontSize: '13px', color: 'var(--text2)' }}>{app.size}</td>
                    <td style={{ padding: '14px 20px', fontSize: '13px', color: 'var(--text2)' }}>{(app.downloads || 0).toLocaleString()}</td>
                    <td style={{ padding: '14px 20px' }}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => startEdit(app)} style={{ background: 'rgba(0,229,255,0.1)', color: 'var(--accent)', border: '1px solid rgba(0,229,255,0.2)', padding: '6px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontFamily: "'Space Grotesk', sans-serif" }}>Edit</button>
                        {deleteConfirm === app.id ? (
                          <>
                            <button onClick={() => deleteApp(app.id)} style={{ background: 'var(--danger)', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontFamily: "'Space Grotesk', sans-serif" }}>Confirm</button>
                            <button onClick={() => setDeleteConfirm(null)} style={{ background: 'transparent', color: 'var(--text2)', border: '1px solid var(--border)', padding: '6px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontFamily: "'Space Grotesk', sans-serif" }}>Cancel</button>
                          </>
                        ) : (
                          <button onClick={() => setDeleteConfirm(app.id)} style={{ background: 'rgba(248,81,73,0.1)', color: 'var(--danger)', border: '1px solid rgba(248,81,73,0.2)', padding: '6px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontFamily: "'Space Grotesk', sans-serif" }}>Delete</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
