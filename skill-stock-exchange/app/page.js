import Link from 'next/link';

export default function LandingPage() {
  return (
    <main style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      minHeight: '100vh',
      textAlign: 'center',
      padding: '2rem'
    }}>
      <div style={{ maxWidth: '800px' }}>
        <h1 style={{ 
          fontSize: '3.5rem', 
          marginBottom: '1rem',
          lineHeight: '1.2',
          letterSpacing: '-0.02em'
        }}>
          Is Your Skillset <span className="text-green">Appreciating</span> or <span className="text-red">Depreciating</span>?
        </h1>
        
        <p style={{ 
          fontSize: '1.5rem', 
          color: 'var(--text-muted)',
          marginBottom: '3rem'
        }}>
          Real market data. Two AI analysts. One portfolio score.
        </p>
        
        <Link href="/profile">
          <button className="btn-primary" style={{ fontSize: '1.25rem', padding: '1rem 2rem' }}>
            Analyze My Skills
          </button>
        </Link>
      </div>
    </main>
  );
}
