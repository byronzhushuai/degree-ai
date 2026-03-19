export default function Success() {
    return (
      <main style={{ maxWidth: 480, margin: '0 auto', padding: '80px 24px', fontFamily: 'sans-serif', textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>✓</div>
        <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 8 }}>Payment successful</h1>
        <p style={{ color: '#666', marginBottom: 32 }}>
          Thank you for your purchase. Our team will review your degree audit and deliver your full plan within 48 hours.
        </p>
        <a href="/" style={{ padding: '12px 24px', background: '#000', color: '#fff', borderRadius: 8, textDecoration: 'none', fontSize: 14, fontWeight: 600 }}>
          Back to home
        </a>
      </main>
    );
  }
  