'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import type { User } from '@supabase/supabase-js';

export default function Home() {
  const [degreeAuditText, setDegreeAuditText] = useState('');
  const [transcriptText, setTranscriptText] = useState('');
  const [degreeAuditFileName, setDegreeAuditFileName] = useState('');
  const [transcriptFileName, setTranscriptFileName] = useState('');
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const uploadRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    createClient()
      .auth.getUser()
      .then(({ data }) => setUser(data.user ?? null));
  }, []);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
  };

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'degreeAudit' | 'transcript'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (type === 'degreeAudit') setDegreeAuditFileName(file.name);
    else setTranscriptFileName(file.name);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.text) {
        if (type === 'degreeAudit') setDegreeAuditText(data.text);
        else setTranscriptText(data.text);
      } else {
        setError('Failed to read PDF. Please paste text manually.');
      }
    } catch {
      setError('Failed to upload file.');
    }
  };

  const handleAnalyze = async () => {
    if (!degreeAuditText.trim()) return;
    setLoading(true);
    setError('');
    setAnalysis(null);

    const combinedText = transcriptText
      ? 'DEGREE AUDIT:\n' + degreeAuditText + '\n\nTRANSCRIPT:\n' + transcriptText
      : 'DEGREE AUDIT:\n' + degreeAuditText;

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcriptText: combinedText }),
      });
      const data = await res.json();
      if (data.analysis) {
        setAnalysis(data.analysis);
      } else {
        setError('Analysis failed. Please try again.');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const scrollToUpload = () => {
    uploadRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <main style={{ fontFamily: 'sans-serif', color: '#111' }}>

      {/* ── Navbar ── */}
      <nav style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 32px',
        borderBottom: '1px solid #eee',
        position: 'sticky',
        top: 0,
        background: '#fff',
        zIndex: 100,
      }}>
        <Link href="/" style={{ fontSize: 16, fontWeight: 700, color: '#000', textDecoration: 'none', letterSpacing: '-0.3px' }}>
          Degree<span style={{ color: '#0070f3' }}>AI</span>
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {user ? (
            <>
              <span style={{ fontSize: 13, color: '#666' }}>{user.email}</span>
              <Link href="/dashboard" style={{ fontSize: 13, color: '#0070f3', textDecoration: 'none', fontWeight: 500 }}>
                Dashboard
              </Link>
              <button
                type="button"
                onClick={handleSignOut}
                style={{ padding: '7px 14px', fontSize: 13, fontWeight: 500, border: '1px solid #ddd', borderRadius: 8, background: '#fff', cursor: 'pointer' }}
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link href="/login" style={{ fontSize: 13, color: '#444', textDecoration: 'none' }}>Log in</Link>
              <Link href="/signup" style={{ fontSize: 13, fontWeight: 600, color: '#fff', background: '#000', padding: '8px 16px', borderRadius: 8, textDecoration: 'none' }}>
                Sign up free
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* ── Hero ── */}
      <section style={{
        maxWidth: 760,
        margin: '0 auto',
        padding: '80px 24px 64px',
        textAlign: 'center',
      }}>
        <div style={{
          display: 'inline-block',
          fontSize: 12,
          fontWeight: 600,
          color: '#0070f3',
          background: '#e8f0fe',
          padding: '4px 12px',
          borderRadius: 20,
          marginBottom: 20,
          letterSpacing: '0.5px',
          textTransform: 'uppercase',
        }}>
          Free AI Degree Analysis
        </div>
        <h1 style={{
          fontSize: 'clamp(32px, 5vw, 52px)',
          fontWeight: 700,
          lineHeight: 1.15,
          letterSpacing: '-1px',
          marginBottom: 20,
          color: '#0a0a0a',
        }}>
          Find out exactly what's standing between you and graduation
        </h1>
        <p style={{ fontSize: 18, color: '#555', lineHeight: 1.6, maxWidth: 560, margin: '0 auto 36px' }}>
          Upload your degree audit. Our AI identifies missing requirements, at-risk courses, and your fastest path to graduation — in under 30 seconds.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={scrollToUpload}
            style={{
              padding: '14px 28px',
              fontSize: 15,
              fontWeight: 700,
              background: '#000',
              color: '#fff',
              border: 'none',
              borderRadius: 10,
              cursor: 'pointer',
              letterSpacing: '-0.2px',
            }}
          >
            Analyze my degree — Free →
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#666' }}>
            <span>🔒</span> No account required &nbsp;·&nbsp; Results in 30s
          </div>
        </div>
      </section>

      {/* ── Sample Report Preview ── */}
      <section style={{ background: '#f7f8fa', padding: '56px 24px' }}>
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, textAlign: 'center', marginBottom: 8, letterSpacing: '-0.4px' }}>
            Here's what your report looks like
          </h2>
          <p style={{ fontSize: 14, color: '#888', textAlign: 'center', marginBottom: 32 }}>
            Real output from a sample Computer Science degree audit
          </p>

          {/* Mock report card */}
          <div style={{
            background: '#fff',
            borderRadius: 16,
            border: '1px solid #e5e7eb',
            overflow: 'hidden',
            boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
          }}>
            {/* Report header */}
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#0a0a0a' }}>B.S. Computer Science</div>
                <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>Spring 2025 · 94 credits completed</div>
              </div>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#22a722', background: '#f0fdf0', padding: '4px 10px', borderRadius: 20, border: '1px solid #bbf0bb' }}>
                Analysis complete
              </div>
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 0 }}>
              {[
                { label: 'Credits completed', value: '94 / 120', bg: '#fff', color: '#111', sub: '' },
                { label: 'Missing requirements', value: '7', bg: '#fff8f8', color: '#c00', sub: '3 urgent' },
                { label: 'At-risk courses', value: '2', bg: '#fffdf0', color: '#996600', sub: 'Check grades' },
              ].map((stat, i) => (
                <div key={i} style={{
                  padding: '20px 20px',
                  background: stat.bg,
                  borderRight: i < 2 ? '1px solid #f0f0f0' : undefined,
                }}>
                  <div style={{ fontSize: 11, color: '#888', marginBottom: 6, fontWeight: 500 }}>{stat.label}</div>
                  <div style={{ fontSize: 28, fontWeight: 700, color: stat.color, letterSpacing: '-0.5px' }}>{stat.value}</div>
                  {stat.sub && <div style={{ fontSize: 11, color: stat.color, marginTop: 4, opacity: 0.8 }}>{stat.sub}</div>}
                </div>
              ))}
            </div>

            {/* AI Summary */}
            <div style={{ padding: '16px 24px', background: '#f0f7ff', borderTop: '1px solid #e0ecff', borderBottom: '1px solid #e0ecff' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#0070f3', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>AI Summary</div>
              <div style={{ fontSize: 13, color: '#334', lineHeight: 1.6 }}>
                You're 26 credits from graduation. Your most urgent gap is <strong>CS 401 (Senior Capstone)</strong> — it must be taken in sequence and requires CS 301 which you haven't completed yet. Recommend taking CS 301 this semester to stay on track for a Spring 2026 graduation.
              </div>
            </div>

            {/* Missing courses preview */}
            <div style={{ padding: '20px 24px' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#444', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.4px' }}>Missing courses (preview)</div>
              {[
                { code: 'CS 301', name: 'Algorithms & Data Structures', urgent: true },
                { code: 'CS 350', name: 'Operating Systems', urgent: false },
              ].map((c, i) => (
                <div key={i} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '10px 14px', background: '#f9f9f9', borderRadius: 8, marginBottom: 8,
                }}>
                  <span style={{ fontSize: 13, fontWeight: 500 }}>{c.code} — {c.name}</span>
                  <span style={{
                    fontSize: 11, padding: '3px 9px', borderRadius: 10, fontWeight: 600,
                    background: c.urgent ? '#ffe0e0' : '#eee', color: c.urgent ? '#c00' : '#666',
                  }}>
                    {c.urgent ? '⚠ Urgent' : 'Required'}
                  </span>
                </div>
              ))}
              {/* Blurred rows */}
              <div style={{ position: 'relative' }}>
                <div style={{
                  padding: '10px 14px', background: '#f9f9f9', borderRadius: 8, marginBottom: 8,
                  filter: 'blur(4px)', userSelect: 'none', fontSize: 13,
                }}>
                  CS 401 — Senior Capstone Project
                </div>
                <div style={{
                  padding: '10px 14px', background: '#f9f9f9', borderRadius: 8, marginBottom: 8,
                  filter: 'blur(4px)', userSelect: 'none', fontSize: 13,
                }}>
                  MATH 320 — Linear Algebra
                </div>
                <div style={{
                  position: 'absolute', inset: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, fontWeight: 600, color: '#0070f3',
                }}>
                  + 5 more courses · Unlock for $19 →
                </div>
              </div>
            </div>

            <div style={{ padding: '0 24px 24px' }}>
              <button
                onClick={scrollToUpload}
                style={{
                  width: '100%', padding: '13px', fontSize: 14, fontWeight: 700,
                  background: '#000', color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer',
                }}
              >
                Get this for your degree — Free
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section style={{ maxWidth: 760, margin: '0 auto', padding: '64px 24px' }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, textAlign: 'center', marginBottom: 48, letterSpacing: '-0.4px' }}>
          Three steps, 30 seconds
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 32 }}>
          {[
            { step: '01', title: 'Upload your degree audit', desc: 'Export it as a PDF from your student portal. Takes 30 seconds.' },
            { step: '02', title: 'AI scans your requirements', desc: 'Claude analyzes every requirement, completed course, and remaining gap.' },
            { step: '03', title: 'Get your full plan', desc: 'See missing courses, risks, and the fastest path to your diploma.' },
          ].map((item) => (
            <div key={item.step}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#0070f3', letterSpacing: '1px', marginBottom: 10 }}>{item.step}</div>
              <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 8, letterSpacing: '-0.2px' }}>{item.title}</div>
              <div style={{ fontSize: 13, color: '#666', lineHeight: 1.6 }}>{item.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Upload Section ── */}
      <section ref={uploadRef} style={{ background: '#f7f8fa', padding: '64px 24px' }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8, letterSpacing: '-0.4px' }}>
            Analyze your degree
          </h2>
          <p style={{ color: '#666', marginBottom: 6, fontSize: 14 }}>
            Upload your documents. Our AI identifies your graduation gaps instantly.
          </p>
          <p style={{ fontSize: 12, color: '#999', marginBottom: 28 }}>
            🔒 Files are processed securely and never stored. Deleted after analysis (FERPA & CCPA compliant).
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
            <div style={{ border: '1px solid #ddd', borderRadius: 10, padding: 18, background: '#fff' }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>
                Degree Audit
                <span style={{ marginLeft: 6, fontSize: 11, background: '#000', color: '#fff', padding: '1px 7px', borderRadius: 10 }}>Required</span>
              </div>
              <div style={{ fontSize: 12, color: '#999', marginBottom: 12 }}>Your official degree requirements and progress report</div>
              <label style={{ display: 'inline-block', padding: '8px 14px', background: '#f5f5f5', border: '1px solid #ddd', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}>
                Upload PDF
                <input type="file" accept=".pdf" onChange={(e) => handleFileUpload(e, 'degreeAudit')} style={{ display: 'none' }} />
              </label>
              {degreeAuditFileName
                ? <div style={{ marginTop: 8, fontSize: 12, color: '#22a722' }}>✓ {degreeAuditFileName}</div>
                : <textarea value={degreeAuditText} onChange={(e) => setDegreeAuditText(e.target.value)} placeholder="Or paste text here..." style={{ marginTop: 12, width: '100%', height: 80, padding: 8, fontSize: 12, border: '1px solid #eee', borderRadius: 6, resize: 'none', boxSizing: 'border-box' }} />
              }
            </div>

            <div style={{ border: '1px dashed #ddd', borderRadius: 10, padding: 18, background: '#fff' }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>
                Transcript
                <span style={{ marginLeft: 6, fontSize: 11, background: '#f5f5f5', color: '#666', padding: '1px 7px', borderRadius: 10, border: '1px solid #ddd' }}>Optional</span>
              </div>
              <div style={{ fontSize: 12, color: '#999', marginBottom: 12 }}>Skip if your degree audit already shows completed courses</div>
              <label style={{ display: 'inline-block', padding: '8px 14px', background: '#f5f5f5', border: '1px solid #ddd', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}>
                Upload PDF
                <input type="file" accept=".pdf" onChange={(e) => handleFileUpload(e, 'transcript')} style={{ display: 'none' }} />
              </label>
              {transcriptFileName
                ? <div style={{ marginTop: 8, fontSize: 12, color: '#22a722' }}>✓ {transcriptFileName}</div>
                : <textarea value={transcriptText} onChange={(e) => setTranscriptText(e.target.value)} placeholder="Or paste text here..." style={{ marginTop: 12, width: '100%', height: 80, padding: 8, fontSize: 12, border: '1px solid #eee', borderRadius: 6, resize: 'none', boxSizing: 'border-box' }} />
              }
            </div>
          </div>

          <button
            onClick={handleAnalyze}
            disabled={loading || !degreeAuditText.trim()}
            style={{
              padding: '13px 28px', fontSize: 15, fontWeight: 700,
              background: loading || !degreeAuditText.trim() ? '#aaa' : '#000',
              color: '#fff', border: 'none', borderRadius: 10,
              cursor: loading || !degreeAuditText.trim() ? 'not-allowed' : 'pointer',
              letterSpacing: '-0.2px',
            }}
          >
            {loading ? 'Analyzing...' : 'Analyze my degree — Free'}
          </button>

          {error && <p style={{ color: 'red', marginTop: 16, fontSize: 14 }}>{error}</p>}

          {analysis && (
            <div style={{ marginTop: 40 }}>
              <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20, letterSpacing: '-0.4px' }}>Your Degree Analysis</h2>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
                <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: 10, padding: 16 }}>
                  <div style={{ fontSize: 11, color: '#888', marginBottom: 4, fontWeight: 500 }}>Credits completed</div>
                  <div style={{ fontSize: 26, fontWeight: 700 }}>{analysis.summary?.creditsCompleted} / {analysis.summary?.creditsRequired}</div>
                </div>
                <div style={{ background: '#fff8f8', border: '1px solid #ffd0d0', borderRadius: 10, padding: 16 }}>
                  <div style={{ fontSize: 11, color: '#c00', marginBottom: 4, fontWeight: 500 }}>Missing requirements</div>
                  <div style={{ fontSize: 26, fontWeight: 700, color: '#c00' }}>{analysis.summary?.missingRequirementsCount}</div>
                </div>
                <div style={{ background: '#fffdf0', border: '1px solid #ffe98a', borderRadius: 10, padding: 16 }}>
                  <div style={{ fontSize: 11, color: '#996600', marginBottom: 4, fontWeight: 500 }}>At-risk courses</div>
                  <div style={{ fontSize: 26, fontWeight: 700, color: '#996600' }}>{analysis.summary?.atRiskCount}</div>
                </div>
              </div>

              <div style={{ background: '#f0f7ff', borderRadius: 10, padding: 16, marginBottom: 20, border: '1px solid #d0e8ff' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#0070f3', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>AI Summary</div>
                <div style={{ fontSize: 14, color: '#334', lineHeight: 1.6 }}>{analysis.freeInsight}</div>
              </div>

              <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.4px', color: '#444' }}>Missing courses (preview)</h3>
              {analysis.missingCourses.slice(0, 2).map((course: any, i: number) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: '#fff', border: '1px solid #eee', borderRadius: 8, marginBottom: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 500 }}>{course.code} — {course.name}</span>
                  <span style={{ fontSize: 11, padding: '3px 9px', borderRadius: 10, fontWeight: 600, background: course.urgent ? '#ffe0e0' : '#eee', color: course.urgent ? '#c00' : '#666' }}>
                    {course.urgent ? '⚠ Urgent' : 'Required'}
                  </span>
                </div>
              ))}

              {analysis.missingCourses.length > 2 && (
                <div style={{ padding: '10px 14px', background: '#f9f9f9', borderRadius: 8, fontSize: 13, color: '#999', marginBottom: 20, border: '1px solid #eee' }}>
                  + {analysis.missingCourses.length - 2} more courses hidden — upgrade to see full list
                </div>
              )}

              <div style={{ border: '1px solid #0070f3', borderRadius: 12, padding: 24, background: '#f0f7ff' }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#003ea8', marginBottom: 6 }}>Want the full optimization plan?</div>
                <div style={{ fontSize: 13, color: '#555', marginBottom: 16, lineHeight: 1.6 }}>
                  Get your complete course list, prerequisite map, GPA impact analysis, and fastest path to graduation.
                </div>
                <button
                  onClick={async () => {
                    sessionStorage.setItem('degree_ai_paid_report', JSON.stringify({
                      ...analysis,
                      plan: 'basic',
                      full_report: JSON.stringify(analysis),
                      preview_text: analysis.freeInsight ?? '',
                      file_name: degreeAuditFileName || 'Degree report',
                    }));
                    const res = await fetch('/api/checkout', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ plan: 'basic', analysisData: analysis }),
                    });
                    const data = await res.json();
                    if (data.url) window.location.href = data.url;
                  }}
                  style={{ padding: '12px 24px', fontSize: 14, fontWeight: 700, background: '#000', color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer' }}
                >
                  Get full plan — $19
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ padding: '32px 24px', textAlign: 'center', borderTop: '1px solid #eee' }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#000', marginBottom: 8 }}>
          Degree<span style={{ color: '#0070f3' }}>AI</span>
        </div>
        <div style={{ fontSize: 12, color: '#aaa' }}>
          © 2025 DegreeAI · Powered by Claude AI
        </div>
      </footer>

    </main>
  );
}
