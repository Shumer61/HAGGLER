import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../utils/api'
import { useAuth } from '../context/AuthContext'
import { formatKSh } from '../utils/formatters'

function Payment() {
    const { negotiationId } = useParams()
    const navigate = useNavigate()
    const { user } = useAuth()
    const [negotiation, setNegotiation] = useState(null)
    const [phone, setPhone] = useState(user?.phone || '')
    const [pickupMethod, setPickupMethod] = useState('in_person')
    const [loading, setLoading] = useState(true)
    const [paying, setPaying] = useState(false)
    const [error, setError] = useState('')
    const [transactionId, setTransactionId] = useState(null)

    useEffect(() => {
        api.get(`/negotiations/${negotiationId}`)
            .then(res => setNegotiation(res.data))
            .catch(() => navigate('/'))
            .finally(() => setLoading(false))
    }, [negotiationId])

    const handlePay = async () => {
        setPaying(true)
        setError('')
        try {
            const { data } = await api.post('/payments/initiate', {
                negotiationId,
                phone,
                pickupMethod
            })
            setTransactionId(data.transactionId)
        } catch(err) {
            setError(err.response?.data?.message || 'Payment failed')
        }
        setPaying(false)
    }

    if(loading) return <div className="loading-screen"><span className="spinner"/></div>
    if(!negotiation) return null

    return (
        <div className="payment-page">
            <div className="page-header">
                <button className="back-btn" onClick={() => navigate(-1)}>←</button>
                <h1>M-Pesa Payment</h1>
            </div>

            <div className="payment-body">
                <div className="agreed-price-card">
                    <p>Agreed Price</p>
                    <h2>{formatKSh(negotiation.agreedPrice)}</h2>
                    <p className="item-ref">{negotiation.item?.title}</p>
                </div>

                {!transactionId ? (
                    <>
                        <div className="input-group">
                            <label>Your M-Pesa Number</label>
                            <input
                                type="tel"
                                value={phone}
                                onChange={e => setPhone(e.target.value)}
                                placeholder="0712345678"
                            />
                        </div>

                        <div className="input-group">
                            <label>Pickup Method</label>
                            <select value={pickupMethod} onChange={e => setPickupMethod(e.target.value)}>
                                <option value="in_person">In Person — Gikomba</option>
                                <option value="pick_up_mtaani">Pick Up Mtaani</option>
                                <option value="cbd_shelf">CBD Shelf</option>
                            </select>
                        </div>

                        <div className="payment-instructions">
                            <p className="instructions-title">Payment Instructions</p>
                            <ol>
                                <li>Enter your M-Pesa number above</li>
                                <li>Click the pay button below</li>
                                <li>A prompt will appear on your phone</li>
                                <li>Enter your M-Pesa PIN to confirm</li>
                                <li>You will receive a pickup code via SMS</li>
                            </ol>
                        </div>

                        {error && <p className="error-msg">{error}</p>}

                        <button className="btn-primary" onClick={handlePay} disabled={paying}>
                            {paying ? <span className="spinner"/> : `Pay ${formatKSh(negotiation.agreedPrice)}`}
                        </button>
                    </>
                ) : (
                    <div className="payment-pending">
                        <div className="pending-icon">📱</div>
                        <h3>Check your phone</h3>
                        <p>An M-Pesa prompt has been sent to {phone}</p>
                        <p>Enter your PIN to complete payment</p>
                        <p className="pending-note">
                            You will receive an SMS with your pickup code once payment is confirmed
                        </p>
                        <button
                            className="btn-secondary"
                            style={{ marginTop: '1.5rem' }}
                            onClick={() => navigate('/')}
                        >
                            Back to Home
                        </button>
                    </div>
                )}
            </div>

            <style>{`
                .payment-body { padding: 1rem; }
                .agreed-price-card {
                    background: rgba(193,68,14,0.06);
                    border: 1px solid rgba(193,68,14,0.2);
                    border-radius: var(--radius-md);
                    padding: 1.2rem;
                    text-align: center;
                    margin-bottom: 1.5rem;
                }
                .agreed-price-card p { font-size: 0.82rem; color: var(--text-muted); }
                .agreed-price-card h2 { font-size: 2rem; font-weight: 700; color: var(--accent); margin: 0.3rem 0; }
                .item-ref { font-size: 0.85rem; }
                .payment-instructions {
                    background: var(--bg-card);
                    border-radius: var(--radius-sm);
                    padding: 1rem;
                    margin-bottom: 1rem;
                }
                .instructions-title { font-weight: 600; margin-bottom: 0.6rem; font-size: 0.88rem; }
                .payment-instructions ol {
                    padding-left: 1.2rem;
                    display: flex;
                    flex-direction: column;
                    gap: 0.4rem;
                }
                .payment-instructions li { font-size: 0.85rem; color: var(--text-muted); }
                .payment-pending {
                    text-align: center;
                    padding: 2rem 1rem;
                }
                .pending-icon { font-size: 3rem; margin-bottom: 1rem; }
                .payment-pending h3 { font-size: 1.2rem; margin-bottom: 0.5rem; }
                .payment-pending p { font-size: 0.88rem; color: var(--text-muted); margin-bottom: 0.3rem; }
                .pending-note {
                    margin-top: 1rem;
                    font-size: 0.82rem;
                    color: var(--text-dim);
                    background: var(--bg-card);
                    padding: 0.8rem;
                    border-radius: var(--radius-sm);
                }
            `}</style>
        </div>
    )
}

export default Payment