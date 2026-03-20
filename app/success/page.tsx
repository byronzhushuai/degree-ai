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
    } catch {
      /* ignore */
    }
  }

  const planRaw = extra.plan ?? analysis.plan ?? 'basic';
  const plan =
    planRaw === 'comprehensive' || planRaw === 'basic'
      ? planRaw
      : String(planRaw);

  const fullReport =
    typeof extra.full_report === 'string'
      ? extra.full_report
      : typeof analysis.full_report === 'string'
        ? analysis.full_report
        : JSON.stringify(analysis);

  const previewText =
    typeof extra.preview_text === 'string'
      ? extra.preview_text
      : typeof analysis.preview_text === 'string'
        ? analysis.preview_text
        : typeof analysis.freeInsight === 'string'
          ? analysis.freeInsight
          : '';

  const fileName =
    typeof extra.file_name === 'string'
      ? extra.file_name
      : typeof analysis.file_name === 'string'
        ? analysis.file_name
        : 'Degree report';

  return {
    file_name: fileName,
    preview_text: previewText,
    full_report: fullReport,
    plan,
  };
}

function SuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [analysis, setAnalysis] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [saveError, setSaveError] = useState('');
  const saveStarted = useRef(false);

  useEffect(() => {
    createClient()
      .auth.getUser()
      .then(({ data }) => setUser(data.user ?? null));
  }, []);

  useEffect(() => {
    if (!sessionId) {
      setLoading(false);
      return;
    }
    fetch('/api/session?session_id=' + sessionId)
      .then((r) => r.json())
      .then((data) => {
        if (data.paid) {
          // 从 sessionStorage 读报告数据
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
    if (typeof window !== 'undefined' && sessionStorage.getItem(storageKey)) {
      setSaveState('saved');
      return;
    }

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
      if (error) {
        setSaveState('error');
        setSaveError(error.message);
        saveStarted.current = false;
        return;
      }
setSaveState('saved');
if (typeof window !== 'undefined') sessionStorage.setItem(storageKey, '1');


// 发邮件通知
if (user.email) {
  fetch('/api/send-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      toEmail: user.email,
      reportId: insertData?.id,    // Supabase insert 返回的报告 ID
      userName: user.email,
    }),
  }).catch(console.error);    // 发邮件失败不影响主流程
}
    })();

    return () => {
      cancelled = true;
    };
  }, [sessionId, analysis, user]);

  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: '48px 24px', fontFamily: 'sans-serif' }}>
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>✓</div>
        <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 8 }}>Payment successful</h1>
        <p style={{ color: '#666' }}>Your full degree analysis is ready below.</p>
      </div>

      {user === null && analysis && (
        <div
          style={{
            marginBottom: 24,
            padding: 20,
            borderRadius: 12,
            border: '1px solid #0070f3',
            background: '#f0f7ff',
            textAlign: 'center',
          }}
        >
          <p style={{ fontSize: 15, fontWeight: 600, color: '#0070f3', marginBottom: 8 }}>
            保存此报告以便日后查看
          </p>
          <p style={{ fontSize: 13, color: '#555', marginBottom: 16 }}>
            创建免费账户后，可在控制台随时查看本次与历史报告。
          </p>
          <Link
            href="/signup"
            style={{
              display: 'inline-block',
              padding: '10px 20px',
              fontSize: 14,
              fontWeight: 600,
              background: '#000',
              color: '#fff',
              borderRadius: 8,
              textDecoration: 'none',
            }}
          >
            注册账户
          </Link>
        </div>
      )}

      {user && analysis && saveState === 'saving' && (
        <p style={{ textAlign: 'center', color: '#666', marginBottom: 16 }}>Saving report to your account…</p>
      )}
      {user && analysis && saveState === 'saved' && (
        <p style={{ textAlign: 'center', color: '#22a722', marginBottom: 16, fontSize: 14 }}>
          Report saved to your account. View it anytime on the dashboard.
        </p>
      )}
      {user && analysis && saveState === 'error' && (
        <p style={{ textAlign: 'center', color: '#c00', marginBottom: 16, fontSize: 14 }}>
          Could not save report: {saveError}
        </p>
      )}

      {loading && <p style={{ textAlign: 'center', color: '#666' }}>Loading your report...</p>}

      {analysis && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
            <div style={{ background: '#f5f5f5', borderRadius: 8, padding: 16 }}>
              <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>Credits completed</div>
              <div style={{ fontSize: 24, fontWeight: 600 }}>
                {(analysis.summary as { creditsCompleted?: number })?.creditsCompleted} /{' '}
                {(analysis.summary as { creditsRequired?: number })?.creditsRequired}
              </div>
            </div>
            <div style={{ background: '#fff0f0', borderRadius: 8, padding: 16 }}>
              <div style={{ fontSize: 12, color: '#c00', marginBottom: 4 }}>Missing requirements</div>
              <div style={{ fontSize: 24, fontWeight: 600, color: '#c00' }}>
                {(analysis.summary as { missingRequirementsCount?: number })?.missingRequirementsCount}
              </div>
            </div>
            <div style={{ background: '#fffbe6', borderRadius: 8, padding: 16 }}>
              <div style={{ fontSize: 12, color: '#996600', marginBottom: 4 }}>At-risk courses</div>
              <div style={{ fontSize: 24, fontWeight: 600, color: '#996600' }}>
                {(analysis.summary as { atRiskCount?: number })?.atRiskCount}
              </div>
            </div>
          </div>

          <div style={{ background: '#f0f7ff', borderRadius: 8, padding: 16, marginBottom: 24 }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Summary</div>
            <div style={{ fontSize: 14, color: '#333' }}>{String(analysis.freeInsight ?? '')}</div>
          </div>

          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>All missing courses</h3>
          {Array.isArray(analysis.missingCourses) &&
            (analysis.missingCourses as { code: string; name: string; urgent?: boolean; type?: string }[]).map(
              (course, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '10px 14px',
                    background: '#f9f9f9',
                    borderRadius: 8,
                    marginBottom: 8,
                  }}
                >
                  <span style={{ fontSize: 14 }}>
                    {course.code} — {course.name}
                  </span>
                  <span
                    style={{
                      fontSize: 11,
                      padding: '2px 8px',
                      borderRadius: 10,
                      background: course.urgent ? '#ffe0e0' : '#eee',
                      color: course.urgent ? '#c00' : '#666',
                    }}
                  >
                    {course.urgent ? 'Urgent' : course.type}
                  </span>
                </div>
              )
            )}

          <h3 style={{ fontSize: 16, fontWeight: 600, margin: '24px 0 12px' }}>Risks to watch</h3>
          {Array.isArray(analysis.risks) &&
            (analysis.risks as { description: string; severity?: string }[]).map((risk, i) => (
              <div
                key={i}
                style={{
                  padding: '10px 14px',
                  background: risk.severity === 'high' ? '#fff0f0' : '#fffbe6',
                  borderRadius: 8,
                  marginBottom: 8,
                  fontSize: 14,
                }}
              >
                {risk.description}
              </div>
            ))}

          <div style={{ marginTop: 32, padding: 20, background: '#f9f9f9', borderRadius: 8, textAlign: 'center' }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Want a personalized advisor review?</div>
            <div style={{ fontSize: 13, color: '#666', marginBottom: 12 }}>
              Get a human advisor to map your fastest path to graduation.
            </div>
            <button
              onClick={async () => {
                const res = await fetch('/api/checkout', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ plan: 'advisor', analysisData: analysis }),
                });
                const data = await res.json();
                if (data.url) window.location.href = data.url;
              }}
              style={{
                padding: '10px 20px',
                fontSize: 14,
                fontWeight: 600,
                background: '#000',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                cursor: 'pointer',
              }}
            >
              Get advisor plan — $99
            </button>
          </div>
        </div>
      )}

      <div style={{ textAlign: 'center', marginTop: 32 }}>
        <a href="/" style={{ fontSize: 14, color: '#666' }}>
          ← Back to home
        </a>
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
