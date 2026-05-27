import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

function BottomNav() {
    const navigate = useNavigate()
    const location = useLocation()
    const { user } = useAuth()

    const tabs = [
        { path: '/',        icon: '🏠', label: 'Home' },
        { path: '/search',  icon: '🔍', label: 'Search' },
        { path: '/my-offers',icon: '💬', label: 'Offers' },
        { path: '/profile', icon: '👤', label: 'Profile' }
    ]

    if(user?.role === 'seller' || user?.role === 'platform_admin') {
        tabs.splice(3, 0, { path: '/seller', icon: '🏪', label: 'Store' })
    }

    return (
        <nav className="bottom-nav">
            {tabs.map(tab => (
                <button
                    key={tab.path}
                    className={`bottom-nav-item ${location.pathname === tab.path ? 'active' : ''}`}
                    onClick={() => navigate(tab.path)}
                >
                    <span className="bottom-nav-icon">{tab.icon}</span>
                    <span className="bottom-nav-label">{tab.label}</span>
                </button>
            ))}
            <style>{`
                .bottom-nav {
                    position: fixed;
                    bottom: 0;
                    left: 50%;
                    transform: translateX(-50%);
                    width: 100%;
                    max-width: 480px;
                    height: var(--bottom-nav);
                    background: white;
                    border-top: 1px solid var(--border);
                    display: flex;
                    z-index: 200;
                }
                .bottom-nav-item {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    gap: 0.2rem;
                    background: none;
                    border: none;
                    cursor: pointer;
                    padding: 0.5rem 0;
                    transition: all 0.15s;
                }
                .bottom-nav-icon { font-size: 1.3rem; line-height: 1; }
                .bottom-nav-label { font-size: 0.65rem; color: var(--text-muted); font-weight: 500; }
                .bottom-nav-item.active .bottom-nav-label { color: var(--accent); }
                .bottom-nav-item.active .bottom-nav-icon { transform: scale(1.15); }
            `}</style>
        </nav>
    )
}

export default BottomNav