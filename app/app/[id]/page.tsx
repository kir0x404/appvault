'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

function BackLink() {
  const [href, setHref] = useState('/');
  const [label, setLabel] = useState('← All Apps');
  useEffect(() => {
    const ref = document.referrer;
    if (ref && ref.includes(window.location.hostname)) {
      try {
        const url = new URL(ref);
        if (url.pathname === '/') {
          const q = url.searchParams.get('q');
          const cat = url.searchParams.get('cat');
          setHref(ref);
          if (q) setLabel(`← Results for "${q}"`);
          else if (cat) setLabel(`← ${cat} Apps`);
        }
      } catch {}
    }
  }, []);
  return (
    <Link href={href} style={{ color: 'var(--text2)', textDecoration: 'none', fontSize: '14px', display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '32px' }}>
      {label}
    </Link>
  );
}

function MoreLikeThis({ currentId, category }: { currentId: string; category: string }) {
  const [related, setRelated] = useState<App[]>([]);

  useEffect(() => {
    fetch('/api/apps')
      .then(r => r.json())
      .then((all: App[]) => {
        const filtered = all.filter(a => a.id !== currentId && a.category === category).slice(0, 4);
        setRelated(filtered);
      });
  }, [currentId, category]);

  if (related.length === 0) return null;

  return (
    <div style={{ marginTop: '28px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: '16px', padding: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
        <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: '17px' }}>More in {category}</h2>
        <Link href={`/?cat=${encodeURIComponent(category)}`} style={{ fontSize: '13px', color: 'var(--accent)', textDecoration: 'none' }}>
          See all →
        </Link>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px' }}>
        {related.map(app => (
          <Link key={app.id} href={`/app/${app.id}`} style={{ textDecoration: 'none' }}>
            <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden', transition: 'border-color 0.2s, transform 0.2s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(0,229,255,0.3)'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLDivElement).style.transform = 'none'; }}>
              <div style={{ height: '90px', background: 'var(--bg3)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                {app.image ? <img src={app.image} alt={app.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: '32px' }}>📱</span>}
              </div>
              <div style={{ padding: '10px' }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)', marginBottom: '3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{app.name}</div>
                <div style={{ fontSize: '11px', color: 'var(--text2)' }}>↓ {(app.downloads || 0).toLocaleString()}</div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

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

function BannerAd({ height = 90, label = 'Advertisement' }: { height?: number; label?: string }) {
  return (
    <div style={{
      width: '100%', height,
      background: 'linear-gradient(135deg, #0d1117 0%, #161b22 100%)',
      border: '1px dashed #21262D', borderRadius: '8px',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <span style={{ fontSize: '11px', color: '#8B949E', letterSpacing: '0.15em', textTransform: 'uppercase' }}>{label}</span>
    </div>
  );
}

type DownloadState = 'locked' | 'watching' | 'visited' | 'unlocked';

export default function AppPage() {
  const { id } = useParams<{ id: string }>();
  const [app, setApp] = useState<App | null>(null);
  const [loading, setLoading] = useState(true);
  const [dlState, setDlState] = useState<DownloadState>('locked');
  const [countdown, setCountdown] = useState(30);
  const [adBlocked, setAdBlocked] = useState(false);

  // Ad blocker check
  useEffect(() => {
    const bait = document.createElement('div');
    bait.className = 'ads ad adsbox doubleclick ad-placement';
    bait.style.cssText = 'width:1px;height:1px;position:absolute;left:-9999px;';
    document.body.appendChild(bait);
    setTimeout(() => {
      const blocked = bait.offsetHeight === 0 || bait.offsetParent === null;
      document.body.removeChild(bait);
      if (blocked) setAdBlocked(true);
    }, 150);
  }, []);

  useEffect(() => {
    fetch(`/api/apps/${id}`).then(r => r.json()).then(d => { setApp(d); setLoading(false); });
  }, [id]);

  // Countdown timer while watching
  useEffect(() => {
    if (dlState !== 'watching') return;
    if (countdown <= 0) { setDlState('visited'); return; }
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [dlState, countdown]);

  // Check if user came back from ad
  useEffect(() => {
    const onFocus = () => {
      if (dlState === 'watching' && countdown <= 0) setDlState('visited');
    };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [dlState, countdown]);

  const handleDownloadClick = () => {
    if (dlState === 'locked') {
      // Open ad in new tab, start timer
      window.open(
        // Replace with your actual ad/monetization link (e.g. a CPM redirect or interstitial ad link)
        `https://www.profitablecpmrate.com/placeholder?redirect=${encodeURIComponent(app?.downloadLink || '')}`,
        '_blank'
      );
      setDlState('watching');
      setCountdown(30);
    } else if (dlState === 'visited' || dlState === 'unlocked') {
      // Increment downloads then redirect
      fetch(`/api/apps/${id}`, { method: 'PATCH' });
      window.open(app?.downloadLink, '_blank');
      setDlState('unlocked');
    }
  };

  if (adBlocked) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '20px', background: 'var(--bg)', padding: '32px', textAlign: 'center' }}>
        <div style={{ fontSize: '56px' }}>🚫</div>
        <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: '24px', color: '#F85149' }}>Ad Blocker Detected</h2>
        <p style={{ color: 'var(--text2)', maxWidth: '360px' }}>Please disable your ad blocker to unlock downloads.</p>
        <button onClick={() => window.location.reload()} style={{ background: 'var(--accent)', color: '#000', border: 'none', padding: '10px 28px', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontFamily: "'Space Grotesk', sans-serif" }}>
          Refresh
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
        <div style={{ color: 'var(--text2)' }}>Loading...</div>
      </div>
    );
  }

  if (!app || (app as unknown as { error: string }).error) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px', background: 'var(--bg)' }}>
        <div style={{ fontSize: '48px' }}>🔍</div>
        <p style={{ color: 'var(--text2)' }}>App not found.</p>
        <Link href="/" style={{ color: 'var(--accent)', textDecoration: 'none' }}>← Back to Home</Link>
      </div>
    );
  }

  const btnConfig = {
    locked: { text: '🔒 Watch Ad to Unlock Download', bg: '#7C3AED', color: '#fff', cursor: 'pointer' },
    watching: { text: `⏳ Watching Ad... ${countdown}s remaining`, bg: '#21262D', color: 'var(--text2)', cursor: 'not-allowed' },
    visited: { text: '✅ Ad Watched — Click to Download', bg: '#3FB950', color: '#000', cursor: 'pointer' },
    unlocked: { text: '⬇️ Download Again', bg: '#3FB950', color: '#000', cursor: 'pointer' },
  }[dlState];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Top ad */}
      <div style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)', padding: '8px 24px' }}>
        <BannerAd height={60} label="728×90 Leaderboard Ad" />
      </div>

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 24px' }}>
        {/* Back */}
        <BackLink />

        {/* App header */}
        <div style={{ display: 'flex', gap: '28px', alignItems: 'flex-start', marginBottom: '40px', flexWrap: 'wrap' }}>
          {/* Icon */}
          <div style={{ width: '120px', height: '120px', borderRadius: '24px', overflow: 'hidden', background: 'var(--bg3)', border: '1px solid var(--border)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {app.image
              ? <img src={app.image} alt={app.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <span style={{ fontSize: '52px' }}>📱</span>}
          </div>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <div style={{ display: 'inline-block', background: 'rgba(124,58,237,0.15)', color: '#A78BFA', fontSize: '12px', padding: '3px 10px', borderRadius: '20px', marginBottom: '10px' }}>
              {app.category}
            </div>
            <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: '30px', marginBottom: '8px', letterSpacing: '-0.02em' }}>{app.name}</h1>
            <div style={{ display: 'flex', gap: '20px', fontSize: '13px', color: 'var(--text2)', flexWrap: 'wrap' }}>
              <span>Version {app.version}</span>
              <span>Size: {app.size}</span>
              <span>↓ {(app.downloads || 0).toLocaleString()} downloads</span>
              <span>Added {new Date(app.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        {/* Main content + sidebar */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '32px', alignItems: 'start' }}>
          <div>
            {/* Download gate box */}
            <div style={{
              background: 'var(--bg3)', border: '1px solid var(--border)',
              borderRadius: '16px', padding: '28px', marginBottom: '28px'
            }}>
              <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: '18px', marginBottom: '16px' }}>Download {app.name}</h2>

              {/* State explanation */}
              <div style={{ background: 'var(--bg2)', borderRadius: '10px', padding: '14px 16px', marginBottom: '20px', fontSize: '13px', color: 'var(--text2)', lineHeight: 1.7 }}>
                {dlState === 'locked' && (
                  <>
                    <strong style={{ color: 'var(--accent)' }}>How to download:</strong><br />
                    1. Click the button below — it will open a sponsor page in a new tab.<br />
                    2. Stay on that page for <strong style={{ color: 'var(--text)' }}>30 seconds</strong>.<br />
                    3. Come back here and click again to download.
                  </>
                )}
                {dlState === 'watching' && (
                  <>
                    <strong style={{ color: '#A78BFA' }}>Keep the sponsor tab open!</strong><br />
                    Your download will unlock in <strong style={{ color: 'var(--text)', fontSize: '16px' }}>{countdown}s</strong>. Don&apos;t close this tab.
                  </>
                )}
                {(dlState === 'visited' || dlState === 'unlocked') && (
                  <>
                    <strong style={{ color: 'var(--success)' }}>✅ Download unlocked!</strong><br />
                    Thank you for supporting AppVault. Click the button to start your download.
                  </>
                )}
              </div>

              {/* Download button */}
              <button
                onClick={handleDownloadClick}
                disabled={dlState === 'watching'}
                style={{
                  width: '100%', padding: '16px', borderRadius: '12px', border: 'none',
                  background: btnConfig.bg, color: btnConfig.color,
                  fontWeight: 700, fontSize: '16px', cursor: btnConfig.cursor,
                  fontFamily: "'Space Grotesk', sans-serif",
                  transition: 'opacity 0.2s, transform 0.1s',
                  opacity: dlState === 'watching' ? 0.6 : 1,
                }}
              >
                {btnConfig.text}
              </button>

              {/* Progress bar during watching */}
              {dlState === 'watching' && (
                <div style={{ marginTop: '12px', height: '4px', background: 'var(--border)', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', background: 'var(--accent2)',
                    width: `${((30 - countdown) / 30) * 100}%`,
                    transition: 'width 1s linear', borderRadius: '2px'
                  }} />
                </div>
              )}
            </div>

            {/* Description */}
            <div style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: '16px', padding: '28px' }}>
              <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: '18px', marginBottom: '16px' }}>About this App</h2>
              <p style={{ color: 'var(--text2)', lineHeight: 1.8, fontSize: '14px', whiteSpace: 'pre-wrap' }}>{app.description}</p>
            </div>

            {/* Mid-page banner ad */}
            <div style={{ marginTop: '28px' }}>
              <BannerAd height={90} label="728×90 In-Content Ad" />
            </div>

            {/* More Like This */}
            <MoreLikeThis currentId={app.id} category={app.category} />
          </div>

          {/* Sidebar */}
          <aside style={{ position: 'sticky', top: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <BannerAd height={250} label="300×250 Sidebar Ad" />
            <BannerAd height={250} label="300×250 Sidebar Ad" />
          </aside>
        </div>
      </div>
    </div>
  );
}
