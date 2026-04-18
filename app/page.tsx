'use client';
import { useEffect, useState, useRef, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

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
}

function AdBlockerWall() {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(8,11,16,0.97)', backdropFilter: 'blur(20px)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '24px', padding: '32px', textAlign: 'center' }}>
      <div style={{ fontSize: '64px' }}>🚫</div>
      <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: '28px', color: '#F85149' }}>Ad Blocker Detected</h2>
      <p style={{ color: 'var(--text2)', maxWidth: '400px', lineHeight: 1.7 }}>AppVault is free because of ads. Please disable your ad blocker and refresh to continue.</p>
      <button onClick={() => window.location.reload()} style={{ background: 'var(--accent)', color: '#000', border: 'none', padding: '12px 32px', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontSize: '15px', fontFamily: "'Space Grotesk', sans-serif" }}>Refresh Page</button>
    </div>
  );
}

function BannerAd({ width, height = 90, label = 'Advertisement' }: { width?: number | string; height?: number; label?: string }) {
  return (
    <div style={{ width: width || '100%', height, background: 'linear-gradient(135deg, #0d1117 0%, #161b22 100%)', border: '1px dashed #21262D', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
      <span style={{ fontSize: '11px', color: '#8B949E', letterSpacing: '0.15em', textTransform: 'uppercase' }}>{label}</span>
    </div>
  );
}

// Highlight matching text in a string
function Highlight({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>;
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);
  return (
    <>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark key={i} style={{ background: 'rgba(0,229,255,0.25)', color: 'var(--accent)', borderRadius: '2px', padding: '0 1px' }}>{part}</mark>
        ) : part
      )}
    </>
  );
}

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [apps, setApps] = useState<App[]>([]);
  const [loading, setLoading] = useState(true);
  const [adBlocked, setAdBlocked] = useState(false);

  // Search state — synced to URL ?q=
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [inputValue, setInputValue] = useState(searchParams.get('q') || '');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [category, setCategory] = useState(searchParams.get('cat') || 'All');
  const [sortBy, setSortBy] = useState<'newest' | 'downloads' | 'name'>(
    (searchParams.get('sort') as 'newest' | 'downloads' | 'name') || 'newest'
  );

  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Ad blocker detection
  useEffect(() => {
    const bait = document.createElement('div');
    bait.className = 'ads ad adsbox doubleclick ad-placement carbon-ads';
    bait.style.cssText = 'width:1px;height:1px;position:absolute;left:-9999px;top:-9999px;';
    document.body.appendChild(bait);
    setTimeout(() => {
      const blocked = bait.offsetHeight === 0 || bait.offsetParent === null || window.getComputedStyle(bait).display === 'none';
      document.body.removeChild(bait);
      if (blocked) setAdBlocked(true);
    }, 150);
  }, []);

  useEffect(() => {
    fetch('/api/apps').then(r => r.json()).then(d => { setApps(Array.isArray(d) ? d : []); setLoading(false); });
  }, []);

  // Close suggestions on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!suggestionsRef.current?.contains(e.target as Node) && !inputRef.current?.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Debounced URL sync
  const syncUrl = useCallback((q: string, cat: string, sort: string) => {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (cat !== 'All') params.set('cat', cat);
    if (sort !== 'newest') params.set('sort', sort);
    const qs = params.toString();
    router.replace(qs ? `/?${qs}` : '/', { scroll: false });
  }, [router]);

  const handleInput = (val: string) => {
    setInputValue(val);
    setShowSuggestions(val.length > 0);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setQuery(val);
      syncUrl(val, category, sortBy);
    }, 300);
  };

  const handleCategoryChange = (cat: string) => {
    setCategory(cat);
    syncUrl(query, cat, sortBy);
  };

  const handleSortChange = (sort: 'newest' | 'downloads' | 'name') => {
    setSortBy(sort);
    syncUrl(query, category, sort);
  };

  const clearSearch = () => {
    setInputValue('');
    setQuery('');
    setShowSuggestions(false);
    syncUrl('', category, sortBy);
    inputRef.current?.focus();
  };

  // Suggestions — top 6 matching app names
  const suggestions = apps
    .filter(a => inputValue && a.name.toLowerCase().includes(inputValue.toLowerCase()))
    .slice(0, 6);

  // Filtered + sorted apps
  const filtered = apps
    .filter(a => {
      const q = query.toLowerCase();
      const matchSearch = !q || a.name.toLowerCase().includes(q) || a.description.toLowerCase().includes(q) || a.category.toLowerCase().includes(q) || a.version.toLowerCase().includes(q);
      const matchCat = category === 'All' || a.category === category;
      return matchSearch && matchCat;
    })
    .sort((a, b) => {
      if (sortBy === 'downloads') return (b.downloads || 0) - (a.downloads || 0);
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      return new Date(b as unknown as string).getTime() - new Date(a as unknown as string).getTime();
    });

  const categories = ['All', ...Array.from(new Set(apps.map(a => a.category)))];

  if (adBlocked) return <AdBlockerWall />;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Sticky top ad */}
      <div style={{ position: 'sticky', top: 0, zIndex: 100, background: 'var(--bg)', borderBottom: '1px solid var(--border)', padding: '8px 24px' }}>
        <BannerAd width={728} height={90} label="728×90 Leaderboard Ad" />
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
        <header style={{ padding: '40px 0 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
            <div>
              <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: '34px', letterSpacing: '-0.02em', background: 'linear-gradient(135deg, #00E5FF, #7C3AED)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>⚡ AppVault</h1>
              <p style={{ color: 'var(--text2)', fontSize: '13px', marginTop: '4px' }}>Free Android Apps — Direct Downloads</p>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text2)', background: 'var(--bg3)', border: '1px solid var(--border)', padding: '6px 14px', borderRadius: '20px' }}>
              {apps.length} Apps
            </div>
          </div>

          <BannerAd width={970} height={90} label="970×90 Billboard Ad" />

          {/* ── Search bar ── */}
          <div style={{ margin: '28px 0 0', position: 'relative' }}>
            <div style={{ position: 'relative' }}>
              {/* Search icon */}
              <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', fontSize: '16px', pointerEvents: 'none', zIndex: 1 }}>🔍</span>

              <input
                ref={inputRef}
                value={inputValue}
                onChange={e => handleInput(e.target.value)}
                onFocus={() => inputValue && setShowSuggestions(true)}
                onKeyDown={e => {
                  if (e.key === 'Escape') { setShowSuggestions(false); inputRef.current?.blur(); }
                  if (e.key === 'Enter') { setQuery(inputValue); setShowSuggestions(false); syncUrl(inputValue, category, sortBy); }
                }}
                placeholder="Search by name, category, description..."
                style={{
                  width: '100%', background: 'var(--bg3)',
                  border: '1px solid',
                  borderColor: showSuggestions && suggestions.length > 0 ? 'rgba(0,229,255,0.4)' : 'var(--border)',
                  borderRadius: showSuggestions && suggestions.length > 0 ? '12px 12px 0 0' : '12px',
                  padding: '14px 48px 14px 48px',
                  color: 'var(--text)', fontSize: '15px', outline: 'none',
                  fontFamily: "'Space Grotesk', sans-serif",
                  transition: 'border-color 0.2s',
                  boxSizing: 'border-box'
                }}
              />

              {/* Clear button */}
              {inputValue && (
                <button onClick={clearSearch} style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'var(--border)', border: 'none', color: 'var(--text2)', width: '24px', height: '24px', borderRadius: '50%', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  ✕
                </button>
              )}
            </div>

            {/* Suggestions dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div ref={suggestionsRef} style={{
                position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 200,
                background: 'var(--bg3)', border: '1px solid rgba(0,229,255,0.4)',
                borderTop: 'none', borderRadius: '0 0 12px 12px',
                overflow: 'hidden', boxShadow: '0 16px 40px rgba(0,0,0,0.4)'
              }}>
                {suggestions.map((app, i) => (
                  <Link key={app.id} href={`/app/${app.id}`} style={{ textDecoration: 'none' }}
                    onClick={() => setShowSuggestions(false)}>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px',
                      borderBottom: i < suggestions.length - 1 ? '1px solid var(--border)' : 'none',
                      cursor: 'pointer', transition: 'background 0.15s'
                    }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg2)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    
                      <div style={{ width: '36px', height: '36px', borderRadius: '8px', overflow: 'hidden', background: 'var(--bg2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {app.image ? <img src={app.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: '18px' }}>📱</span>}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)' }}>
                          <Highlight text={app.name} query={inputValue} />
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text2)' }}>{app.category} · v{app.version}</div>
                      </div>
                      <span style={{ fontSize: '11px', color: 'var(--text2)' }}>↓ {(app.downloads || 0).toLocaleString()}</span>
                    </div>
                  </Link>
                ))}
                {/* "Search all results" footer */}
                <div
                  style={{ padding: '10px 16px', fontSize: '13px', color: 'var(--accent)', cursor: 'pointer', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '8px' }}
                  onClick={() => { setQuery(inputValue); setShowSuggestions(false); syncUrl(inputValue, category, sortBy); }}
                >
                  <span>🔍</span> Search all results for <strong>&ldquo;{inputValue}&rdquo;</strong>
                </div>
              </div>
            )}
          </div>

          {/* Filters row */}
          <div style={{ display: 'flex', gap: '12px', margin: '16px 0 24px', flexWrap: 'wrap', alignItems: 'center' }}>
            {/* Category pills */}
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', flex: 1 }}>
              {categories.map(cat => (
                <button key={cat} onClick={() => handleCategoryChange(cat)} style={{
                  padding: '7px 14px', borderRadius: '8px', fontSize: '13px', cursor: 'pointer',
                  border: '1px solid', fontFamily: "'Space Grotesk', sans-serif",
                  borderColor: category === cat ? 'var(--accent)' : 'var(--border)',
                  background: category === cat ? 'rgba(0,229,255,0.1)' : 'var(--bg3)',
                  color: category === cat ? 'var(--accent)' : 'var(--text2)',
                  transition: 'all 0.15s'
                }}>{cat}</button>
              ))}
            </div>
            {/* Sort */}
            <select value={sortBy} onChange={e => handleSortChange(e.target.value as 'newest' | 'downloads' | 'name')} style={{
              background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: '8px',
              color: 'var(--text2)', padding: '7px 12px', fontSize: '13px', cursor: 'pointer',
              outline: 'none', fontFamily: "'Space Grotesk', sans-serif"
            }}>
              <option value="newest">Newest First</option>
              <option value="downloads">Most Downloaded</option>
              <option value="name">Name A–Z</option>
            </select>
          </div>

          {/* Result count / active search indicator */}
          {query && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', padding: '10px 16px', background: 'rgba(0,229,255,0.06)', border: '1px solid rgba(0,229,255,0.15)', borderRadius: '8px' }}>
              <span style={{ fontSize: '14px', color: 'var(--text2)' }}>
                {filtered.length === 0
                  ? <>No results for <strong style={{ color: 'var(--text)' }}>&ldquo;{query}&rdquo;</strong></>
                  : <><strong style={{ color: 'var(--accent)' }}>{filtered.length}</strong> result{filtered.length !== 1 ? 's' : ''} for <strong style={{ color: 'var(--text)' }}>&ldquo;{query}&rdquo;</strong></>}
              </span>
              <button onClick={clearSearch} style={{ marginLeft: 'auto', background: 'transparent', border: 'none', color: 'var(--text2)', cursor: 'pointer', fontSize: '13px', padding: '2px 8px' }}>
                Clear ✕
              </button>
            </div>
          )}
        </header>

        {/* Grid + Sidebar */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '32px', paddingBottom: '60px' }}>
          {/* App grid */}
          <div>
            {loading ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '16px' }}>
                {[...Array(6)].map((_, i) => <div key={i} style={{ height: '200px', background: 'var(--bg3)', borderRadius: '16px', border: '1px solid var(--border)', opacity: 0.5 }} />)}
              </div>
            ) : filtered.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text2)' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
                <p style={{ fontSize: '16px', marginBottom: '8px', color: 'var(--text)' }}>No apps found</p>
                <p style={{ fontSize: '14px' }}>Try a different keyword or category</p>
                {query && <button onClick={clearSearch} style={{ marginTop: '20px', background: 'var(--accent)', color: '#000', border: 'none', padding: '10px 24px', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontFamily: "'Space Grotesk', sans-serif" }}>Clear Search</button>}
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '16px' }}>
                {filtered.map((app, i) => (
                  <>
                    {i > 0 && i % 6 === 0 && (
                      <div key={`ad-${i}`} style={{ gridColumn: '1 / -1' }}>
                        <BannerAd height={80} label="In-Feed Ad" />
                      </div>
                    )}
                    <Link key={app.id} href={`/app/${app.id}`} style={{ textDecoration: 'none', display: 'block' }}>
                      <div
                        style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: '16px', overflow: 'hidden', cursor: 'pointer', transition: 'transform 0.2s, border-color 0.2s, box-shadow 0.2s' }}
                        onMouseEnter={e => { const el = e.currentTarget as HTMLDivElement; el.style.borderColor = 'rgba(0,229,255,0.4)'; el.style.transform = 'translateY(-4px)'; el.style.boxShadow = '0 12px 40px rgba(0,229,255,0.08)'; }}
                        onMouseLeave={e => { const el = e.currentTarget as HTMLDivElement; el.style.borderColor = 'var(--border)'; el.style.transform = 'none'; el.style.boxShadow = 'none'; }}
                      >
                        <div style={{ height: '140px', background: 'var(--bg2)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
                          {app.image ? <img src={app.image} alt={app.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ fontSize: '52px' }}>📱</div>}
                          <div style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(0,0,0,0.7)', borderRadius: '6px', padding: '3px 8px', fontSize: '11px', color: 'var(--text2)' }}>{app.category}</div>
                        </div>
                        <div style={{ padding: '14px' }}>
                          <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '6px', color: 'var(--text)' }}>
                            <Highlight text={app.name} query={query} />
                          </h3>
                          <p style={{ fontSize: '12px', color: 'var(--text2)', lineHeight: 1.5, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                            <Highlight text={app.description} query={query} />
                          </p>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', fontSize: '11px', color: 'var(--text2)' }}>
                            <span>v{app.version}</span>
                            <span>{app.size}</span>
                            <span>↓ {(app.downloads || 0).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar ads */}
          <aside>
            <div style={{ position: 'sticky', top: '90px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <div style={{ fontSize: '10px', color: 'var(--text2)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '8px' }}>Sponsored</div>
                <BannerAd width={300} height={250} label="300×250 Rectangle" />
              </div>
              <BannerAd width={300} height={600} label="300×600 Half-Page" />
            </div>
          </aside>
        </div>
      </div>

      <footer style={{ borderTop: '1px solid var(--border)', padding: '24px', textAlign: 'center', color: 'var(--text2)', fontSize: '13px' }}>
        © {new Date().getFullYear()} AppVault. All &copy; rights reserved by Ripp3r.
      </footer>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text2)' }}>Loading...</div>}>
      <HomeContent />
    </Suspense>
  );
}
