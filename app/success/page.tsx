'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useRef, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import type { User } from '@supabase/supabase-js';

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

function buildReportPayload(analysis: Record<string, unknown>) {
  let extra: Record<string, unknown> = {};
  if (typeof window !== 'undefined') {
    try {
      const raw = sessionStorage.getItem('degree_ai_paid_report');
      if (raw) extra = JSON.parse(raw) as Record<string, unknown>;
    } catch { /* ignore */ }
  }
  const planRaw = extra.plan ?? analysis.plan ?? 'basic';
  const plan = planRaw === 'comprehensive' || planRaw === 'basic' ? planRaw : String(planRaw);
  const fullReport = typeof extra.full_report === 'string' ? extra.full_report : typeof analysis.full_report === 'string' ? analysis.full_report : JSON.stringify(analysis);
  const previewText = typeof extra.preview_text === 'string' ? extra.preview_text : typeof analysis.preview_text === 'string' ? analysis.preview_text : typeof analysis.freeInsight === 'string' ? analysis.freeInsight : '';
  const fileName = typeof extra.file_name === 'string' ? extra.file_name : typeof analysis.file_name === 'string' ? analysis.file_name : 'Degree report';
  return { file_name: fileName, preview_text: previewText, full_report: fullReport, plan };
}

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div style={{ marginBottom: 12, marginTop: 32 }}>
      <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>{title}</h3>
      {subtitle && <p style={{ fontSize: 12, color: '#888', margin: '2px 0 0' }}>{subtitle}</p>}
    </div>
  );
}

function SuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [analysis, setAnalysis] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [saveError, setSaveError] = useState('');
  const [copied, setCopied] = useState(false);
  const saveStarted = useRef(false);

  useEffect(() => {
    createClient().auth.getUser().then(({ data }) => setUser(data.user ?? null));
  }, []);

  useEffect(() => {
    if (!sessionId) { setLoading(false); return; }
    fetch('/api/session?session_id=' + sessionId)
      .then((r) => r.json())
      .then((data) => {
        if (data.paid) {
          try {
            const raw = sessionStorage.getItem('degree_ai_paid_report');
            if (raw) setAnalysis(JSON.parse(raw) as Record<string, unknown>);
          } catch { /* ignore */ }
        }
        setLoading(false);
      });
  }, [sessionId]);

  useEffect(() => {
    if (!sessionId || !analysis || user === undefined || user === null) return;
    if (saveStarted.current) return;
    const storageKey = `degree_ai_report_saved_${sessionId}`;
    if (typeof window !== 'undefined' && sessionStorage.getItem(storageKey)) { setSaveState('saved'); return; }
    saveStarted.current = true;
    let cancelled = false;
    const payload = buildReportPayload(analysis);
    (async () => {
      setSaveState('saving');
      setSaveError('');
      const supabase = createClient();
      const { data: insertData, error } = await supabase.from('reports').insert({
        user_id: user.id,
        file_name: payload.file_name,
        preview_text: payload.preview_text,
        full_report: payload.full_report,
        plan: payload.plan,
      }).select().single();
      if (cancelled) return;
      if (error) { setSaveState('error'); setSaveError(error.message); saveStarted.current = false; return; }
      setSaveState('saved');
      if (typeof window !== 'undefined') sessionStorage.setItem(storageKey, '1');
      if (user.email) {
        fetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ toEmail: user.email, reportId: insertData?.id, userName: user.email }),
        }).catch(console.error);
      }
    })();
    return () => { cancelled = true; };
  }, [sessionId, analysis, user]);

  const summary = analysis?.summary as Record<string, unknown> | undefined;
  const graduationBlockers = analysis?.graduationBlockers as { description: string; severity: string; action: string }[] | undefined;
  const prerequisiteAlerts = analysis?.prerequisiteAlerts as { missingCourse: string; prerequisite: string; consequence: string }[] | undefined;
  const nextSemesterPlan = analysis?.nextSemesterPlan as { recommendedCourses: { code: string; name: string; reason: string; priority: string }[]; perfectSemester: string } | undefined;
  const courseOrderSuggestion = analysis?.courseOrderSuggestion as { semester: string; courses: string[]; focus: string }[] | undefined;
  const timeline = analysis?.timeline as { currentPath: string; optimizedPath: string; timeSaved: string } | undefined;
  const advisorScript = analysis?.advisorScript as { emailSubject: string; emailBody: string } | undefined;

  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: '48px 24px', fontFamily: 'sans-serif' }}>
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>✓</div>
        <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 8 }}>Payment successful</h1>
        <p style={{ color: '#666' }}>Your full degree analysis is ready below.</p>
      </div>

      {user === null && analysis && (
        <div style={{ marginBottom: 24, padding: 20, borderRadius: 12, border: '1px solid #0070f3', background: '#f0f7ff', textAlign: 'center' }}>
          <p style={{ fontSize: 15, fontWeight: 600, color: '#0070f3', marginBottom: 8 }}>Save this report to your account</p>
          <p style={{ fontSize: 13, color: '#555', marginBottom: 16 }}>Create a free account to access this and all future reports from your dashboard.</p>
          <Link href="/signup" style={{ display: 'inline-block', padding: '10px 20px', fontSize: 14, fontWeight: 600, background: '#000', color: '#fff', borderRadius: 8, textDecoration: 'none' }}>
            Create free account
          </Link>
        </div>
      )}

      {user && analysis && saveState === 'saving' && <p style={{ textAlign: 'center', color: '#666', marginBottom: 16 }}>Saving report to your account…</p>}
      {user && analysis && saveState === 'saved' && <p style={{ textAlign: 'center', color: '#22a722', marginBottom: 16, fontSize: 14 }}>Report saved to your account. View it anytime on the dashboard.</p>}
      {user && analysis && saveState === 'error' && <p style={{ textAlign: 'center', color: '#c00', marginBottom: 16, fontSize: 14 }}>Could not save report: {saveError}</p>}
      {loading && <p style={{ textAlign: 'center', color: '#666' }}>Loading your report...</p>}

      {analysis && (
        <div>

          {/* ── BLOCK 1: Current Status ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 12 }}>
            <div style={{ background: '#f5f5f5', borderRadius: 8, padding: 16 }}>
              <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>Credits completed</div>
              <div style={{ fontSize: 24, fontWeight: 600 }}>{summary?.creditsCompleted as number} / {summary?.creditsRequired as number}</div>
            </div>
            <div style={{ background: '#fff0f0', borderRadius: 8, padding: 16 }}>
              <div style={{ fontSize: 12, color: '#c00', marginBottom: 4 }}>Missing requirements</div>
              <div style={{ fontSize: 24, fontWeight: 600, color: '#c00' }}>{summary?.missingRequirementsCount as number}</div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
            <div style={{ background: '#fffbe6', borderRadius: 8, padding: 16 }}>
              <div style={{ fontSize: 12, color: '#996600', marginBottom: 4 }}>At-risk courses</div>
              <div style={{ fontSize: 24, fontWeight: 600, color: '#996600' }}>{summary?.atRiskCount as number}</div>
            </div>
            <div style={{ background: (summary?.graduationStressScore as number) >= 7 ? '#fff0f0' : '#f0fff4', borderRadius: 8, padding: 16 }}>
              <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>Graduation stress</div>
              <div style={{ fontSize: 24, fontWeight: 600, color: (summary?.graduationStressScore as number) >= 7 ? '#c00' : '#22a722' }}>
                {summary?.graduationStressScore as number}/10
              </div>
            </div>
            <div style={{ background: '#f5f5f5', borderRadius: 8, padding: 16 }}>
              <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>Semesters left</div>
              <div style={{ fontSize: 24, fontWeight: 600 }}>{summary?.estimatedSemestersRemaining as number}</div>
            </div>
          </div>

          {summary?.gpaAnalysis && (
            <div style={{ background: '#f0f7ff', borderRadius: 8, padding: 16, marginBottom: 8 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#0070f3', marginBottom: 4 }}>GPA Analysis</div>
              <div style={{ fontSize: 14, color: '#333' }}>{String(summary.gpaAnalysis)}</div>
            </div>
          )}

          <div style={{ background: '#f0f7ff', borderRadius: 8, padding: 16, marginBottom: 24 }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Summary</div>
            <div style={{ fontSize: 14, color: '#333' }}>{String(analysis.fullInsight ?? analysis.freeInsight ?? '')}</div>
          </div>

          {/* ── BLOCK 2: Graduation Blockers ── */}
          {Array.isArray(graduationBlockers) && graduationBlockers.length > 0 && (
            <>
              <SectionHeader title="🚨 Graduation Blockers" subtitle="These issues could prevent or delay your graduation" />
              {graduationBlockers.map((blocker, i) => (
                <div key={i} style={{ background: '#fff0f0', border: '1px solid #fca5a5', borderRadius: 8, padding: 14, marginBottom: 8 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#c00', marginBottom: 4 }}>
                    {blocker.severity === 'critical' ? '🔴 Critical' : '🟠 High'} — {blocker.description}
                  </div>
                  <div style={{ fontSize: 13, color: '#555' }}>→ {blocker.action}</div>
                </div>
              ))}
            </>
          )}

          {/* ── Prerequisite Alerts ── */}
          {Array.isArray(prerequisiteAlerts) && prerequisiteAlerts.length > 0 && (
            <>
              <SectionHeader title="⚠️ Prerequisite Alerts" subtitle="Course chain issues that could set you back" />
              {prerequisiteAlerts.map((alert, i) => (
                <div key={i} style={{ background: '#fffbe6', border: '1px solid #fde68a', borderRadius: 8, padding: 14, marginBottom: 8 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                    You need <strong>{alert.missingCourse}</strong> but must first complete <strong>{alert.prerequisite}</strong>
                  </div>
                  <div style={{ fontSize: 13, color: '#555' }}>⚡ {alert.consequence}</div>
                </div>
              ))}
            </>
          )}

          {/* ── All Missing Courses ── */}
          <SectionHeader title="📋 All Missing Courses" />
          {Array.isArray(analysis.missingCourses) &&
            (analysis.missingCourses as { code: string; name: string; urgent?: boolean; type?: string; reason?: string }[]).map((course, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '10px 14px', background: '#f9f9f9', borderRadius: 8, marginBottom: 8 }}>
                <div>
                  <div style={{ fontSize: 14 }}>{course.code} — {course.name}</div>
                  {course.reason && <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>{course.reason}</div>}
                </div>
                <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 10, background: course.urgent ? '#ffe0e0' : '#eee', color: course.urgent ? '#c00' : '#666', whiteSpace: 'nowrap', marginLeft: 8 }}>
                  {course.urgent ? 'Urgent' : course.type}
                </span>
              </div>
            ))}

          {/* ── Risks ── */}
          {Array.isArray(analysis.risks) && (analysis.risks as { description: string; severity?: string }[]).length > 0 && (
            <>
              <SectionHeader title="⚡ Risks to Watch" />
              {(analysis.risks as { description: string; severity?: string }[]).map((risk, i) => (
                <div key={i} style={{ padding: '10px 14px', background: risk.severity === 'high' ? '#fff0f0' : '#fffbe6', borderRadius: 8, marginBottom: 8, fontSize: 14 }}>
                  {risk.description}
                </div>
              ))}
            </>
          )}

          {/* ── BLOCK 3: Next Semester Plan ── */}
          {nextSemesterPlan && (
            <>
              <SectionHeader title="🎯 Next Semester Action Plan" subtitle="Your recommended course lineup" />
              {nextSemesterPlan.perfectSemester && (
                <div style={{ background: '#f0fff4', border: '1px solid #86efac', borderRadius: 8, padding: 14, marginBottom: 12 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#166534', marginBottom: 4 }}>The Perfect Semester</div>
                  <div style={{ fontSize: 14, color: '#333' }}>{nextSemesterPlan.perfectSemester}</div>
                </div>
              )}
              {Array.isArray(nextSemesterPlan.recommendedCourses) && nextSemesterPlan.recommendedCourses.map((course, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '10px 14px', background: '#f9f9f9', borderRadius: 8, marginBottom: 8 }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 500 }}>{course.code} — {course.name}</div>
                    <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>{course.reason}</div>
                  </div>
                  <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 10, background: course.priority === 'must-take' ? '#dbeafe' : '#f3f4f6', color: course.priority === 'must-take' ? '#1d4ed8' : '#666', whiteSpace: 'nowrap', marginLeft: 8 }}>
                    {course.priority === 'must-take' ? 'Must-take' : 'Recommended'}
                  </span>
                </div>
              ))}
            </>
          )}

          {/* ── Course Order ── */}
          {Array.isArray(courseOrderSuggestion) && courseOrderSuggestion.length > 0 && (
            <>
              <SectionHeader title="📅 Suggested Course Order" subtitle="Semester-by-semester roadmap to graduation" />
              {courseOrderSuggestion.map((sem, i) => (
                <div key={i} style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 14, marginBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{sem.semester}</div>
                    <div style={{ fontSize: 11, color: '#888' }}>{sem.focus}</div>
                  </div>
                  {sem.courses.map((c, j) => (
                    <div key={j} style={{ fontSize: 13, color: '#555', marginBottom: 2 }}>• {c}</div>
                  ))}
                </div>
              ))}
            </>
          )}

          {/* ── Timeline ── */}
          {timeline && (
            <>
              <SectionHeader title="⏱️ Graduation Timeline" />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 8 }}>
                <div style={{ background: '#f5f5f5', borderRadius: 8, padding: 14 }}>
                  <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>Current path</div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{timeline.currentPath}</div>
                </div>
                <div style={{ background: '#f0fff4', border: '1px solid #86efac', borderRadius: 8, padding: 14 }}>
                  <div style={{ fontSize: 12, color: '#166534', marginBottom: 4 }}>Optimized path</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#166534' }}>{timeline.optimizedPath}</div>
                </div>
              </div>
              {timeline.timeSaved && (
                <div style={{ background: '#fffbe6', borderRadius: 8, padding: 12, fontSize: 13, color: '#996600', textAlign: 'center' }}>
                  🎓 By following our recommendations, you could save <strong>{timeline.timeSaved}</strong>
                </div>
              )}
            </>
          )}

          {/* ── Advisor Script ── */}
          {advisorScript && (
            <>
              <SectionHeader title="✉️ Email Your Advisor" subtitle="Ready-to-send email draft — just copy and paste" />
              <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 16, background: '#fafafa' }}>
                <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>Subject</div>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, color: '#333' }}>{advisorScript.emailSubject}</div>
                <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>Email body</div>
                <div style={{ fontSize: 13, color: '#333', lineHeight: 1.6, whiteSpace: 'pre-wrap', marginBottom: 12 }}>{advisorScript.emailBody}</div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`Subject: ${advisorScript.emailSubject}\n\n${advisorScript.emailBody}`);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  style={{ padding: '8px 16px', fontSize: 13, fontWeight: 600, background: copied ? '#22a722' : '#000', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}
                >
                  {copied ? '✓ Copied!' : 'Copy email'}
                </button>
              </div>
            </>
          )}

          {/* ── $99 Upsell ── */}
          <div style={{ marginTop: 40, padding: 24, background: 'linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)', borderRadius: 12, textAlign: 'center', color: '#fff' }}>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 1, opacity: 0.7, marginBottom: 8 }}>WANT GUARANTEED RESULTS?</div>
            <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Get a Human Advisor Review</div>
            <div style={{ fontSize: 13, opacity: 0.85, marginBottom: 20, lineHeight: 1.5 }}>
              AI analysis is powerful, but school policies change. Get a real advisor to verify your plan, identify hidden transfer credit opportunities, and guarantee your fastest path to graduation.
            </div>
            <button
              onClick={async () => {
                const res = await fetch('/api/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ plan: 'advisor', analysisData: analysis }) });
                const data = await res.json();
                if (data.url) window.location.href = data.url;
              }}
              style={{ padding: '12px 28px', fontSize: 15, fontWeight: 700, background: '#fff', color: '#1e3a5f', border: 'none', borderRadius: 8, cursor: 'pointer' }}
            >
              Get advisor review — $99
            </button>
          </div>

        </div>
      )}

      <div style={{ textAlign: 'center', marginTop: 32 }}>
        <a href="/" style={{ fontSize: 14, color: '#666' }}>← Back to home</a>
      </div>
    </main>
  );
}

export default function Success() {
  return (
    <Suspense fallback={<div style={{ padding: 48, textAlign: 'center' }}>Loading...</div>}>
      <SuccessContent />
    </Suspense>
  );
}
