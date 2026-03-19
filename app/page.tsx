'use client';

import { useState } from 'react';

export default function Home() {
  const [degreeAuditText, setDegreeAuditText] = useState('');
  const [transcriptText, setTranscriptText] = useState('');
  const [degreeAuditFileName, setDegreeAuditFileName] = useState('');
  const [transcriptFileName, setTranscriptFileName] = useState('');
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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

  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: '48px 24px', fontFamily: 'sans-serif' }}>
      <h1 style={{ fontSize: 28, fontWeight: 600, marginBottom: 8 }}>Degree AI</h1>
      <p style={{ color: '#666', marginBottom: 8 }}>
        Upload your documents below. Our AI will identify your graduation gaps instantly.
      </p>
      <p style={{ fontSize: 12, color: '#999', marginBottom: 32 }}>
      Your files are processed securely and never stored. All data is deleted after analysis in accordance with FERPA and applicable state privacy laws.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>

        <div style={{ border: '1px solid #ddd', borderRadius: 8, padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
            Degree Audit
            <span style={{ marginLeft: 6, fontSize: 11, background: '#000', color: '#fff', padding: '1px 6px', borderRadius: 10 }}>Required</span>
          </div>
          <div style={{ fontSize: 12, color: '#999', marginBottom: 12 }}>
            Your official degree requirements and progress report
          </div>
          <label style={{ display: 'inline-block', padding: '8px 14px', background: '#f5f5f5', border: '1px solid #ddd', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}>
            Upload PDF
            <input type="file" accept=".pdf" onChange={(e) => handleFileUpload(e, 'degreeAudit')} style={{ display: 'none' }} />
          </label>
          {degreeAuditFileName
            ? <div style={{ marginTop: 8, fontSize: 12, color: '#22a722' }}>✓ {degreeAuditFileName}</div>
            : <textarea value={degreeAuditText} onChange={(e) => setDegreeAuditText(e.target.value)} placeholder="Or paste text here..." style={{ marginTop: 12, width: '100%', height: 80, padding: 8, fontSize: 12, border: '1px solid #eee', borderRadius: 6, resize: 'none', boxSizing: 'border-box' }} />
          }
        </div>

        <div style={{ border: '1px dashed #ddd', borderRadius: 8, padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
            Transcript
            <span style={{ marginLeft: 6, fontSize: 11, background: '#f5f5f5', color: '#666', padding: '1px 6px', borderRadius: 10, border: '1px solid #ddd' }}>Optional</span>
          </div>
          <div style={{ fontSize: 12, color: '#999', marginBottom: 12 }}>
            Skip if your degree audit already shows completed courses
          </div>
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
        style={{ padding: '12px 24px', fontSize: 15, fontWeight: 600, background: loading || !degreeAuditText.trim() ? '#999' : '#000', color: '#fff', border: 'none', borderRadius: 8, cursor: loading || !degreeAuditText.trim() ? 'not-allowed' : 'pointer' }}
      >
        {loading ? 'Analyzing...' : 'Analyze my degree — Free'}
      </button>

      {error && <p style={{ color: 'red', marginTop: 16 }}>{error}</p>}

      {analysis && (
        <div style={{ marginTop: 40 }}>
          <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 16 }}>Your Degree Analysis</h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
            <div style={{ background: '#f5f5f5', borderRadius: 8, padding: 16 }}>
              <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>Credits completed</div>
              <div style={{ fontSize: 24, fontWeight: 600 }}>{analysis.summary.creditsCompleted} / {analysis.summary.creditsRequired}</div>
            </div>
            <div style={{ background: '#fff0f0', borderRadius: 8, padding: 16 }}>
              <div style={{ fontSize: 12, color: '#c00', marginBottom: 4 }}>Missing requirements</div>
              <div style={{ fontSize: 24, fontWeight: 600, color: '#c00' }}>{analysis.summary.missingRequirementsCount}</div>
            </div>
            <div style={{ background: '#fffbe6', borderRadius: 8, padding: 16 }}>
              <div style={{ fontSize: 12, color: '#996600', marginBottom: 4 }}>At-risk courses</div>
              <div style={{ fontSize: 24, fontWeight: 600, color: '#996600' }}>{analysis.summary.atRiskCount}</div>
            </div>
          </div>

          <div style={{ background: '#f0f7ff', borderRadius: 8, padding: 16, marginBottom: 24 }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Summary</div>
            <div style={{ fontSize: 14, color: '#333' }}>{analysis.freeInsight}</div>
          </div>

          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Missing courses (preview)</h3>
          {analysis.missingCourses.slice(0, 2).map((course: any, i: number) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: '#f9f9f9', borderRadius: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 14 }}>{course.code} — {course.name}</span>
              <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 10, background: course.urgent ? '#ffe0e0' : '#eee', color: course.urgent ? '#c00' : '#666' }}>
                {course.urgent ? 'Urgent' : 'Required'}
              </span>
            </div>
          ))}

          {analysis.missingCourses.length > 2 && (
            <div style={{ padding: '10px 14px', background: '#f9f9f9', borderRadius: 8, fontSize: 14, color: '#999', marginBottom: 24 }}>
              + {analysis.missingCourses.length - 2} more courses hidden — upgrade to see full list
            </div>
          )}

          <div style={{ border: '1px solid #0070f3', borderRadius: 8, padding: 20, background: '#f0f7ff' }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#0070f3', marginBottom: 4 }}>Want the full optimization plan?</div>
            <div style={{ fontSize: 13, color: '#555', marginBottom: 12 }}>
              Get your complete course list, prerequisite map, and fastest path to graduation — reviewed by an academic advisor.
            </div>
            <button style={{ padding: '10px 20px', fontSize: 14, fontWeight: 600, background: '#000', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer' }}>
              Get full plan — $19
            </button>
          </div>
        </div>
      )}
    </main>
  );
}