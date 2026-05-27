import { useState, useEffect } from 'react'
import api from '../utils/api'
import { formatKSh } from '../utils/formatters'

function AdminDashboard() {
    const [stats, setStats] = useState(null)
    const [pendingSellers, setPendingSellers] = useState([])
    const [disputes, setDisputes] = useState([])
    const [tab, setTab] = useState('overview')
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        try {
            const [statsRes, sellersRes, txRes] = await Promise.all([
                api.get('/admin/dashboard'),
                api.get('/admin/sellers/pending'),
                api.get('/admin/transactions?status=disputed')
            ])
            setStats(statsRes.data)
            setPendingSellers(sellersRes.data)
            setDisputes(txRes.data.transactions)
        } catch(err) {
            console.warn(err)
        }
        setLoading(false)
    }

    const approveSeller = async (id) => {
        try {
            await api.put(`/admin/sellers/${id}/approve`)
            setPendingSellers(prev => prev.filter(s => s._id !== id))
            setStats(prev => ({ ...prev, pendingSellers: prev.pendingSellers - 1 }))
        } catch(err) { console.warn(err) }
    }

    const rejectSeller = async (id) => {
        try {
            await api.put(`/admin/sellers/${id}/reject`)
            setPendingSellers(prev => prev.filter(s => s._id !== id))
        } catch(err) { console.warn(err) }
    }

    if(loading) return <div className="loading-screen"><span className="spinner"/></div>

    return (
        <div className="admin-dash">
            <div className="dash-header">
                <h1>Admin Panel</h1>
                <p>Platform Management</p>
            </div>

            {stats && (
                <div className="stats-grid">
                    <div className="stat-card"><h3>{stats.totalUsers}</h3><p>Users</p></div>
                    <div className="stat-card"><h3>{stats.totalItems}</h3><p>Items</p></div>
                    <div className="stat-card"><h3>{stats.pendingSellers}</h3><p>Pending</p></div>
                    <div className="stat-card"><h3>{stats.disputes}</h3><p>Disputes</p></div>
                </div>
            )}

            <div className="tab-bar">
                {['overview', 'sellers', 'disputes'].map(t => (
                    <button
                        key={t}
                        className={`tab ${tab === t ? 'active' : ''}`}
                        onClick={() => setTab(t)}
                    >
                        {t}
                    </button>
                ))}
            </div>

            {tab === 'sellers' && (
                <div className="tab-content">
                    <h3>Pending Seller Applications ({pendingSellers.length})</h3>
                    {pendingSellers.length === 0 ? (
                        <p className="empty-msg">No pending applications</p>
                    ) : pendingSellers.map(seller => (
                        <div key={seller._id} className="seller-card">
                            <div className="seller-card-info">
                                <h4>{seller.name}</h4>
                                <p>{seller.phone}</p>
                                <p>{seller.sellerProfile?.storeName}</p>
                                <p className="store-desc">{seller.sellerProfile?.storeDescription}</p>
                            </div>
                            <div className="seller-card-actions">
                                <button className="approve-btn" onClick={() => approveSeller(seller._id)}>Approve</button>
                                <button className="reject-btn" onClick={() => rejectSeller(seller._id)}>Reject</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {tab === 'disputes' && (
                <div className="tab-content">
                    <h3>Active Disputes ({disputes.length})</h3>
                    {disputes.length === 0 ? (
                        <p className="empty-msg">No active disputes</p>
                    ) : disputes.map(tx => (
                        <div key={tx._id} className="dispute-card">
                            <h4>{tx.item?.title}</h4>
                            <p>Amount: {formatKSh(tx.amount)}</p>
                            <p>Buyer: {tx.buyer?.name}</p>
                            <p>Seller: {tx.seller?.name}</p>
                            <p className="dispute-reason">Reason: {tx.disputeReason}</p>
                        </div>
                    ))}
                </div>
            )}

            <style>{`
                .admin-dash { padding-bottom: 5rem; }
                .dash-header {
                    padding: 1rem;
                    background: var(--bg-dark);
                    color: white;
                }
                .dash-header h1 { font-size: 1.2rem; }
                .dash-header p { font-size: 0.82rem; opacity: 0.7; }
                .stats-grid {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 0.5rem;
                    padding: 1rem;
                }
                .stat-card {
                    background: white;
                    border-radius: var(--radius-sm);
                    padding: 0.8rem;
                    text-align: center;
                    box-shadow: var(--shadow);
                }
                .stat-card h3 { font-size: 1.4rem; font-weight: 700; color: var(--accent); }
                .stat-card p { font-size: 0.68rem; color: var(--text-muted); }
                .tab-bar {
                    display: flex;
                    border-bottom: 1px solid var(--border);
                    background: white;
                }
                .tab {
                    flex: 1;
                    padding: 0.8rem;
                    background: none;
                    border: none;
                    font-family: var(--font-sans);
                    font-size: 0.85rem;
                    cursor: pointer;
                    color: var(--text-muted);
                    text-transform: capitalize;
                    border-bottom: 2px solid transparent;
                }
                .tab.active { color: var(--accent); border-bottom-color: var(--accent); font-weight: 600; }
                .tab-content { padding: 1rem; }
                .tab-content h3 { font-size: 0.95rem; margin-bottom: 0.8rem; }
                .seller-card {
                    background: white;
                    border-radius: var(--radius-sm);
                    padding: 1rem;
                    margin-bottom: 0.6rem;
                    box-shadow: var(--shadow);
                    display: flex;
                    justify-content: space-between;
                    gap: 0.8rem;
                }
                .seller-card-info h4 { font-size: 0.92rem; font-weight: 600; }
                .seller-card-info p { font-size: 0.8rem; color: var(--text-muted); }
                .store-desc { font-style: italic; margin-top: 0.3rem; }
                .seller-card-actions { display: flex; flex-direction: column; gap: 0.4rem; }
                .approve-btn {
                    padding: 0.4rem 0.8rem;
                    background: var(--success);
                    color: white;
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 0.8rem;
                    font-weight: 600;
                }
                .reject-btn {
                    padding: 0.4rem 0.8rem;
                    background: #e53e3e;
                    color: white;
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 0.8rem;
                    font-weight: 600;
                }
                .dispute-card {
                    background: white;
                    border-left: 3px solid var(--accent);
                    border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
                    padding: 1rem;
                    margin-bottom: 0.6rem;
                    box-shadow: var(--shadow);
                }
                .dispute-card h4 { font-size: 0.92rem; font-weight: 600; margin-bottom: 0.4rem; }
                .dispute-card p { font-size: 0.82rem; color: var(--text-muted); }
                .dispute-reason { color: var(--accent); margin-top: 0.4rem; }
                .empty-msg { text-align: center; color: var(--text-muted); font-size: 0.88rem; padding: 2rem 0; }
            `}</style>
        </div>
    )
}

export default AdminDashboard