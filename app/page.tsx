'use client';

import { useEffect, useRef, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import type { User } from '@supabase/supabase-js';

export default function Home() {
  const [degreeAuditText, setDegreeAuditText] = useState('');
  const [degreeAuditFileName, setDegreeAuditFileName] = useState('');
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState('');
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [howOpen, setHowOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    createClient()
      .auth.getUser()
      .then(({ data }) => setUser(data.user ?? null));
  }, []);

  const handleSignOut = async () => {
    await createClient().auth.signOut();
    setUser(null);
  };

  const handleFileUpload = async (file: File) => {
    if (!file) return;
    setDegreeAuditFileName(file.name);
    setScanning(true);
    setDegreeAuditText('');

    const formData = new FormData();
    formData.append('file', file);

    // 2.5s perceived scan delay, then upload
    await new Promise(resolve => setTimeout(resolve, 2500));

    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.text) {
        setDegreeAuditText(data.text);
      } else {
        setError('Failed to read PDF. Please try again.');
        setDegreeAuditFileName('');
      }
    } catch {
      setError('Failed to upload file.');
      setDegreeAuditFileName('');
    } finally {
      setScanning(false);
    }
  };

  const handleAnalyze = async () => {
    if (!degreeAuditText.trim()) return;
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcriptText: 'DEGREE AUDIT:\n' + degreeAuditText }),
      });
      const data = await res.json();
      if (data.analysis) {
        sessionStorage.setItem('degree_ai_paid_report', JSON.stringify({
          ...data.analysis,
          plan: 'basic',
          full_report: JSON.stringify(data.analysis),
          preview_text: data.analysis.freeInsight ?? '',
          file_name: degreeAuditFileName || 'Degree report',
        }));
        const checkoutRes = await fetch('/api/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ plan: 'basic', analysisData: data.analysis }),
        });
        const checkoutData = await checkoutRes.json();
        if (checkoutData.url) window.location.href = checkoutData.url;
      } else {
        setError('Analysis failed. Please try again.');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const dzBg = scanning || degreeAuditFileName ? '#EFF6FF' : '#fff';
  const dzBorder = scanning || degreeAuditFileName ? '1.5px solid #2563EB' : '1.5px dashed #CBD5E1';
  const ctaDisabled = loading || scanning || !degreeAuditText.trim();

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', fontFamily: 'system-ui,-apple-system,sans-serif', background: '#fff', color: '#0F172A' }}>

      <style>{`
        @keyframes tagBlink{0%,100%{opacity:1}50%{opacity:.25}}
        @keyframes scanLine{0%{top:0}100%{top:100%}}
        @keyframes ticker{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
        .scan-bar{position:absolute;top:0;left:0;width:100%;height:2px;background:linear-gradient(90deg,transparent,#2563EB,transparent);opacity:0;}
        .scan-bar.active{animation:scanLine 2s linear infinite;opacity:.5;}
        .ticker-track{display:flex;gap:28px;animation:ticker 28s linear infinite;white-space:nowrap;}
      `}</style>

      {/* NAV */}
      <nav style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'14px 24px', background:'rgba(255,255,255,0.95)', backdropFilter:'blur(8px)', borderBottom:'1px solid #E2E8F0', position:'sticky', top:0, zIndex:100 }}>
        <div style={{ fontSize:17, fontWeight:800, letterSpacing:-0.5 }}>
          Degree<em style={{ color:'#2563EB', fontStyle:'normal' }}>AI</em>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          {user ? (
            <>
              <span style={{ fontSize:13, color:'#64748B', alignSelf:'center' }}>{user.email}</span>
              <button onClick={handleSignOut} style={{ fontSize:13, fontWeight:600, color:'#64748B', background:'none', border:'none', cursor:'pointer' }}>Sign out</button>
            </>
          ) : (
            <>
              <button onClick={() => window.location.href='/login'} style={{ fontSize:13, fontWeight:600, color:'#64748B', background:'none', border:'none', cursor:'pointer' }}>Log in</button>
              <button onClick={() => window.location.href='/signup'} style={{ background:'#0F172A', color:'#fff', border:'none', borderRadius:7, padding:'8px 14px', fontSize:13, fontWeight:700, cursor:'pointer' }}>Sign up free</button>
            </>
          )}
        </div>
      </nav>

      {/* HERO */}
      <section style={{ padding:'52px 24px 40px', textAlign:'center', borderBottom:'1px solid #E2E8F0' }}>

        {/* Tag */}
        <div style={{ display:'inline-flex', alignItems:'center', gap:7, fontSize:11, fontWeight:700, color:'#2563EB', background:'#EFF6FF', border:'1px solid #DBEAFE', padding:'5px 13px', borderRadius:20, marginBottom:22, letterSpacing:0.5, textTransform:'uppercase' }}>
          <div style={{ width:6, height:6, borderRadius:'50%', background:'#2563EB', flexShrink:0, animation:'tagBlink 1.4s infinite' }} />
          Registration season is now
        </div>

        {/* Headline */}
        <h1 style={{ fontSize:40, fontWeight:900, lineHeight:1.05, letterSpacing:-2, color:'#0F172A', marginBottom:6 }}>
          Nearly <span style={{ color:'#E11D48' }}>half</span> of college students<br />don&apos;t graduate in 4 years.
        </h1>
        <div style={{ width:40, height:3, background:'#E11D48', borderRadius:2, margin:'16px auto' }} />
        <p style={{ fontSize:16, color:'#64748B', lineHeight:1.65, maxWidth:420, margin:'0 auto 10px', fontWeight:500 }}>
          Find out if you&apos;re on track — <strong style={{ color:'#0F172A' }}>free.</strong><br />
          Upload your degree audit and see every gap, blocker, and risk in 30 seconds.
        </p>
        <p style={{ fontSize:13, color:'#64748B', marginBottom:24, fontStyle:'italic' }}>
          Most students who find a problem here didn&apos;t know they had one.
        </p>

        {/* Trust line */}
        <div style={{ fontSize:12, color:'#94A3B8', marginBottom:24, display:'flex', alignItems:'center', justifyContent:'center', gap:6, flexWrap:'wrap' }}>
          <span>Analyzes your actual degree audit</span>
          <div style={{ width:3, height:3, borderRadius:'50%', background:'#CBD5E1' }} />
          <span>Not a generic checklist</span>
          <div style={{ width:3, height:3, borderRadius:'50%', background:'#CBD5E1' }} />
          <span>Real findings from your file</span>
        </div>

        {/* Mini preview */}
        <div style={{ background:'#F8FAFC', border:'1px solid #E2E8F0', borderRadius:12, padding:'14px 16px', marginBottom:20, textAlign:'left' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
            <div style={{ fontSize:9, fontWeight:800, color:'#2563EB', textTransform:'uppercase', letterSpacing:0.8 }}>Example output</div>
            <div style={{ fontSize:10, fontWeight:800, color:'#15803D', background:'#F0FDF4', border:'1px solid #BBF7D0', padding:'3px 10px', borderRadius:20 }}>All of this is free</div>
          </div>
          <div style={{ display:'flex', gap:8, marginBottom:10 }}>
            {[['Credits done','94/120','#0F172A'],['Gaps found','7','#E11D48'],['Delay risk','+1 sem','#2563EB']].map(([l,v,c]) => (
              <div key={l} style={{ flex:1, background:'#fff', border:'1px solid #E2E8F0', borderRadius:8, padding:'10px 12px' }}>
                <div style={{ fontSize:9, color:'#64748B', marginBottom:3 }}>{l}</div>
                <div style={{ fontSize:18, fontWeight:800, color:c, letterSpacing:-0.5 }}>{v}</div>
              </div>
            ))}
          </div>
          <div style={{ background:'#FFF1F2', border:'1px solid #FECACA', borderRadius:8, padding:'9px 12px', fontSize:12, color:'#881337', fontWeight:600, lineHeight:1.55, marginBottom:8 }}>
            <strong style={{ color:'#E11D48' }}>CS 301 is blocking 3 required courses.</strong> If you don&apos;t register this semester, you can&apos;t graduate on time.
          </div>
          {[
            ['CS 301 — Algorithms','Blocks 3 required courses · Prereq red flag','blocker'],
            ['WRIT 201 — Writing Elective','Hidden graduation requirement','hidden'],
            ['CS 401 — Senior Capstone','Can\'t register until CS 301 is done','blocker'],
          ].map(([name,sub,type]) => (
            <div key={name} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 10px', background:'#fff', border:'1px solid #E2E8F0', borderRadius:7, marginBottom:6 }}>
              <div>
                <div style={{ fontSize:12, fontWeight:700, color:'#0F172A' }}>{name}</div>
                <div style={{ fontSize:10, color:'#64748B', marginTop:1 }}>{sub}</div>
              </div>
              <div style={{ fontSize:9, fontWeight:800, color: type==='blocker'?'#E11D48':'#2563EB', background: type==='blocker'?'#FFF1F2':'#EFF6FF', border: `1px solid ${type==='blocker'?'#FECACA':'#DBEAFE'}`, padding:'2px 8px', borderRadius:4, textTransform:'uppercase', whiteSpace:'nowrap' }}>
                {type==='blocker'?'Blocker':'Hidden req'}
              </div>
            </div>
          ))}
          <div style={{ fontSize:10, color:'#94A3B8', textAlign:'center', marginTop:4 }}>Sample only · your results reflect your actual file</div>
        </div>

        {/* Upload card */}
        <div style={{ background:'#fff', border:'1px solid #E2E8F0', borderRadius:16, padding:20, boxShadow:'0 2px 20px rgba(0,0,0,0.07)', marginBottom:8 }}>

          {/* How-to accordion */}
          <div style={{ marginBottom: howOpen ? 0 : 14 }}>
            <button
              onClick={() => setHowOpen(!howOpen)}
              style={{ width:'100%', display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 14px', background:'#F8FAFC', border:'1px solid #E2E8F0', borderRadius: howOpen ? '8px 8px 0 0' : 8, cursor:'pointer', fontSize:12, fontWeight:600, color:'#2563EB', textAlign:'left', gap:8, fontFamily:'inherit' }}
            >
              Not sure where to find your degree audit?
              <span style={{ fontSize:14, color:'#2563EB', fontWeight:700, display:'inline-block', transform: howOpen ? 'rotate(45deg)' : 'none', transition:'transform 0.18s' }}>+</span>
            </button>
            {howOpen && (
              <div style={{ padding:'12px 14px 8px', background:'#F8FAFC', border:'1px solid #E2E8F0', borderTop:'none', borderRadius:'0 0 8px 8px', marginBottom:14 }}>
                {[
                  ['1','Log into your student portal','— same place you register for classes'],
                  ['2','Look for Degree Audit, Degree Works, DARS, or MyDegreePlan',''],
                  ['3','Download as PDF and drop it here',''],
                ].map(([n,strong,rest]) => (
                  <div key={n} style={{ display:'flex', alignItems:'flex-start', gap:10, marginBottom:8 }}>
                    <div style={{ width:18, height:18, borderRadius:'50%', background:'#2563EB', color:'#fff', fontSize:10, fontWeight:800, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, marginTop:1 }}>{n}</div>
                    <div style={{ fontSize:12, lineHeight:1.5 }}><strong>{strong}</strong> <span style={{ color:'#64748B' }}>{rest}</span></div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Drop zone */}
          <div
            style={{ border:dzBorder, borderRadius:12, padding:'24px 16px', textAlign:'center', cursor:'pointer', transition:'all 0.2s', marginBottom:14, position:'relative', overflow:'hidden', background:dzBg }}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={e => e.preventDefault()}
            onDrop={e => { e.preventDefault(); const f=e.dataTransfer.files?.[0]; if(f) handleFileUpload(f); }}
          >
            <div className={`scan-bar${scanning||degreeAuditFileName?' active':''}`} />
            <svg width="36" height="40" viewBox="0 0 36 40" fill="none" style={{ margin:'0 auto 10px', display:'block', opacity: scanning ? 0.5 : 0.25, transition:'opacity 0.3s' }}>
              <rect x="2" y="2" width="22" height="30" rx="3" stroke="#0F172A" strokeWidth="1.5" fill="#F8FAFC"/>
              <path d="M18 2v9h8" stroke="#0F172A" strokeWidth="1.5"/>
              <path d="M7 17h12M7 22h8" stroke="#0F172A" strokeWidth="1.5" strokeLinecap="round"/>
              <circle cx="28" cy="33" r="7" fill="#2563EB" stroke="#0F172A" strokeWidth="1.5"/>
              <path d="M28 30v6M25 33h6" stroke="#fff" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <div style={{ fontWeight:700, fontSize:14, marginBottom:3, color: scanning ? '#2563EB' : '#0F172A' }}>
              {scanning ? `Scanning ${degreeAuditFileName}...` : degreeAuditFileName ? degreeAuditFileName : 'Drop your Degree Audit PDF here'}
            </div>
            <div style={{ fontSize:12, color:'#64748B' }}>
              {scanning ? 'Reading your degree audit — this takes a moment' : degreeAuditFileName ? 'Ready to analyze · click the button below' : 'or click to browse · Works with Degree Works, DARS, and most U.S. portals'}
            </div>
          </div>

          <input ref={fileInputRef} type="file" accept=".pdf" style={{ display:'none' }} onChange={e => { const f=e.target.files?.[0]; if(f) handleFileUpload(f); }} />

          {/* CTA button */}
          <button
            onClick={handleAnalyze}
            disabled={ctaDisabled}
            style={{ width:'100%', background: ctaDisabled ? '#93C5FD' : '#2563EB', color:'#fff', border:'none', borderRadius:10, padding:16, fontSize:15, fontWeight:800, cursor: ctaDisabled ? 'not-allowed' : 'pointer', boxShadow: ctaDisabled ? 'none' : '0 4px 14px rgba(37,99,235,0.3)', marginBottom:10, transition:'all 0.12s', fontFamily:'inherit' }}
          >
            {loading ? 'Analyzing...' : scanning ? 'Scanning...' : 'Scan My Audit for Gaps — Free'}
          </button>

          {error && <p style={{ color:'#E11D48', fontSize:13, marginBottom:10 }}>{error}</p>}

          <div style={{ display:'flex', justifyContent:'center', flexWrap:'wrap', gap:10, marginBottom:10 }}>
            {[['Secure upload','shield'],['No account needed',''],['No credit card',''],['FERPA compliant','']].map(([label]) => (
              <span key={label} style={{ fontSize:10, fontWeight:600, color:'#94A3B8', display:'flex', alignItems:'center', gap:4 }}>{label}</span>
            ))}
          </div>

          <div style={{ textAlign:'center', marginTop:4 }}>
            <a href="/sample" style={{ fontSize:12, color:'#2563EB', fontWeight:600, textDecoration:'none', borderBottom:'1px solid #DBEAFE', paddingBottom:1 }}>
              Not ready to upload? See a full sample report first →
            </a>
          </div>
        </div>
      </section>

      {/* SOCIAL PROOF */}
      <div style={{ padding:'20px 24px', borderTop:'1px solid #E2E8F0', background:'#F8FAFC', display:'flex', alignItems:'center', justifyContent:'center', gap:20, flexWrap:'wrap' }}>
        {[
          ['10,000+','U.S. college students helped','with course planning'],
          ['48h','Human advisor review','turnaround'],
          ['$0','To get your full','AI diagnosis'],
        ].map(([num,l1,l2],i) => (
          <div key={num} style={{ display:'flex', alignItems:'center', gap:20 }}>
            {i > 0 && <div style={{ width:1, height:36, background:'#E2E8F0' }} />}
            <div style={{ textAlign:'center' }}>
              <div style={{ fontSize:22, fontWeight:900, color:'#2563EB', letterSpacing:-1 }}>{num}</div>
              <div style={{ fontSize:11, color:'#64748B', marginTop:2, lineHeight:1.4 }}>{l1}<br />{l2}</div>
            </div>
          </div>
        ))}
      </div>

      {/* FOOTNOTE */}
      <div style={{ fontSize:10, color:'#E2E8F0', textAlign:'center', padding:'8px 24px', background:'#F8FAFC' }}>
        * NCES data: ~45% of U.S. students graduate within 4 years at 4-year institutions.
      </div>

      {/* TICKER */}
      <div style={{ overflow:'hidden', padding:'11px 0', borderTop:'1px solid #E2E8F0', borderBottom:'1px solid #E2E8F0', background:'#fff' }}>
        <div className="ticker-track">
          {['Compatible with','Degree Works','·','DARS','·','MyDegreePlan','·','uAchieve','·','Stellic','·','Academica','·','and most U.S. university portals','·',
            'Compatible with','Degree Works','·','DARS','·','MyDegreePlan','·','uAchieve','·','Stellic','·','Academica','·','and most U.S. university portals','·'].map((item,i) => (
            <span key={i} style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:0.8, color: ['·','Compatible with','and most U.S. university portals'].includes(item) ? '#94A3B8' : '#2563EB', opacity: ['·','Compatible with','and most U.S. university portals'].includes(item) ? 1 : 0.7 }}>
              {item}
            </span>
          ))}
        </div>
      </div>

    </div>
  );
}
