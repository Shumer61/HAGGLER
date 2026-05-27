import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function Profile() {
    const { user, logout } = useAuth()
    const navigate = useNavigate()

    const handleLogout = async () => {
        await logout()
        navigate('/login')
    }

    if(!user) return null

    return (
        <div className="profile-page">
            <div className="profile-header">
                <div className="avatar">{user.name[0].toUpperCase()}</div>
                <h2>{user.name}</h2>
                <p>{user.email}</p>
                <p>{user.phone}</p>
                <span className={`role-badge ${user.role}`}>{user.role.replace('_', ' ')}</span>
            </div>

            <div className="profile-menu">
                <button className="menu-item" onClick={() => navigate('/my-offers')}>
                    <span>💬</span>
                    <span>My Negotiations</span>
                    <span>→</span>
                </button>
                {user.role === 'buyer' && user.sellerStatus !== 'approved' && (
                    <button className="menu-item" onClick={() => navigate('/apply-seller')}>
                        <span>🏪</span>
                        <span>
                            {user.sellerStatus === 'pending'
                                ? 'Seller Application Pending'
                                : 'Become a Seller'}
                        </span>
                        <span>→</span>
                    </button>
                )}
                {(user.role === 'seller' || user.role === 'platform_admin') && (
                    <button className="menu-item" onClick={() => navigate('/seller')}>
                        <span>🏪</span>
                        <span>Seller Dashboard</span>
                        <span>→</span>
                    </button>
                )}
                {user.role === 'platform_admin' && (
                    <button className="menu-item" onClick={() => navigate('/admin')}>
                        <span>⚙️</span>
                        <span>Admin Panel</span>
                        <span>→</span>
                    </button>
                )}
            </div>

            <div style={{ padding: '1rem' }}>
                <button className="btn-secondary" onClick={handleLogout}>Logout</button>
            </div>

            <style>{`
                .profile-page { padding-bottom: 5rem; }
                .profile-header {
                    background: white;
                    padding: 2rem 1rem;
                    text-align: center;
                    border-bottom: 1px solid var(--border);
                }
                .avatar {
                    width: 70px; height: 70px;
                    background: var(--accent);
                    color: white;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.8rem;
                    font-weight: 700;
                    margin: 0 auto 0.8rem;
                }
                .profile-header h2 { font-size: 1.2rem; }
                .profile-header p { font-size: 0.85rem; color: var(--text-muted); }
                .role-badge {
                    display: inline-block;
                    margin-top: 0.5rem;
                    padding: 0.2rem 0.8rem;
                    border-radius: 20px;
                    font-size: 0.72rem;
                    font-weight: 600;
                    text-transform: capitalize;
                    background: var(--accent-dim);
                    color: var(--accent);
                }
                .profile-menu { padding: 1rem; display: flex; flex-direction: column; gap: 0.5rem; }
                .menu-item {
                    display: flex;
                    align-items: center;
                    gap: 0.8rem;
                    padding: 1rem;
                    background: white;
                    border: 1px solid var(--border);
                    border-radius: var(--radius-sm);
                    cursor: pointer;
                    font-family: var(--font-sans);
                    font-size: 0.9rem;
                    width: 100%;
                    text-align: left;
                }
                .menu-item span:first-child { font-size: 1.2rem; }
                .menu-item span:nth-child(2) { flex: 1; }
                .menu-item span:last-child { color: var(--text-dim); }
            `}</style>
        </div>
    )
}

export default Profile