import { Link, useLocation } from 'react-router-dom';

export default function Header() {
    const location = useLocation();

    return (
        <header className="header">
            <div className="container header-content">
                <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
                    <div className="logo">
                        <div className="logo-icon">AC</div>
                        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: '1' }}>
                            <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>AgroCortex AI</span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', fontWeight: 500 }}>Multi-Agent System</span>
                        </div>
                    </div>
                </Link>
                <nav style={{ display: 'flex' }}>
                    <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>
                        Analiz
                    </Link>
                    <Link to="/greenhouse" className={`nav-link ${location.pathname === '/greenhouse' ? 'active' : ''}`}>
                        Sera
                    </Link>
                </nav>
            </div>
        </header>
    );
}
