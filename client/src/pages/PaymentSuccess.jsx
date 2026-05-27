import { useNavigate } from 'react-router-dom'

function PaymentSuccess() {
    const navigate = useNavigate()

    return (
        <div className="success-page">
            <div className="success-card">
                <div className="success-icon">✅</div>
                <h2>Payment Successful!</h2>
                <p>Your payment has been received.</p>
                <div className="success-info">
                    <p>The seller has been notified and will prepare your item.</p>
                    <p>Check your SMS for your pickup code.</p>
                </div>
                <button className="btn-primary" onClick={() => navigate('/')}>
                    Continue Shopping
                </button>
                <button className="btn-secondary" style={{ marginTop: '0.6rem' }} onClick={() => navigate('/profile')}>
                    View My Orders
                </button>
            </div>
            <style>{`
                .success-page {
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 1.5rem;
                    background: rgba(26,122,63,0.04);
                }
                .success-card {
                    background: white;
                    border-radius: var(--radius-lg);
                    padding: 2rem;
                    text-align: center;
                    box-shadow: var(--shadow-lg);
                    width: 100%;
                }
                .success-icon { font-size: 3rem; margin-bottom: 1rem; }
                .success-card h2 { font-size: 1.4rem; margin-bottom: 0.4rem; }
                .success-card > p { color: var(--text-muted); font-size: 0.9rem; margin-bottom: 1rem; }
                .success-info {
                    background: rgba(26,122,63,0.06);
                    border-radius: var(--radius-sm);
                    padding: 1rem;
                    margin-bottom: 1.5rem;
                    font-size: 0.85rem;
                    color: var(--success);
                    display: flex;
                    flex-direction: column;
                    gap: 0.4rem;
                }
            `}</style>
        </div>
    )
}

export default PaymentSuccess