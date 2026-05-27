import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../utils/api'
import { useAuth } from '../context/AuthContext'
import { formatKSh, formatDate } from '../utils/formatters'

function ItemDetail() {
    const { id } = useParams()
    const navigate = useNavigate()
    const { user } = useAuth()
    const [item, setItem] = useState(null)
    const [loading, setLoading] = useState(true)
    const [offer, setOffer] = useState('')
    const [offering, setOffering] = useState(false)
    const [error, setError] = useState('')
    const [currentImg, setCurrentImg] = useState(0)

    useEffect(() => {
        api.get(`/items/${id}`)
            .then(res => setItem(res.data))
            .catch(() => navigate('/'))
            .finally(() => setLoading(false))
    }, [id])

    const handleOffer = async () => {
        if(!user) return navigate('/login')
        if(!offer) return
        setOffering(true)
        setError('')
        try {
            const { data } = await api.post('/negotiations', {
                itemId: id,
                initialOffer: Number(offer)
            })
            navigate(`/negotiate/${data._id}`)
        } catch(err) {
            setError(err.response?.data?.message || 'Could not start negotiation')
        }
        setOffering(false)
    }

    const handleBuyNow = async () => {
        if(!user) return navigate('/login')
        setOffering(true)
        try {
            const { data } = await api.post('/negotiations', {
                itemId: id,
                initialOffer: item.price
            })
            await api.post(`/negotiations/${data._id}/accept`)
            navigate(`/payment/${data._id}`)
        } catch(err) {
            setError(err.response?.data?.message || 'Could not proceed')
        }
        setOffering(false)
    }

    if(loading) return <div className="loading-screen"><span className="spinner"/></div>
    if(!item) return null

    return (
        <div className="item-detail">
            <div className="page-header">
                <button className="back-btn" onClick={() => navigate(-1)}>←</button>
                <h1>{item.category}</h1>
            </div>

            <div className="item-images">
                <img src={item.images[currentImg]} alt={item.title} className="main-img" />
                {item.images.length > 1 && (
                    <div className="img-thumbs">
                        {item.images.map((img, i) => (
                            <img
                                key={i}
                                src={img}
                                alt=""
                                className={`thumb ${i === currentImg ? 'active' : ''}`}
                                onClick={() => setCurrentImg(i)}
                            />
                        ))}
                    </div>
                )}
            </div>

            <div className="item-info">
                <div className="item-info-top">
                    <div>
                        <h2>{item.title}</h2>
                        <p className="item-price-big">{formatKSh(item.price)}</p>
                    </div>
                    <span className="badge badge-negotiable">Negotiable</span>
                </div>

                <div className="item-meta">
                    <div className="meta-row">
                        <span>Condition</span><span>{item.condition}</span>
                    </div>
                    <div className="meta-row">
                        <span>Size</span><span>{item.size}</span>
                    </div>
                    {item.brand !== 'Unknown' && (
                        <div className="meta-row">
                            <span>Brand</span><span>{item.brand}</span>
                        </div>
                    )}
                    <div className="meta-row">
                        <span>Seller</span>
                        <span>{item.seller?.sellerProfile?.storeName || item.seller?.name}</span>
                    </div>
                    <div className="meta-row">
                        <span>Listed</span><span>{formatDate(item.createdAt)}</span>
                    </div>
                </div>

                <p className="item-description">{item.description}</p>

                {item.bidCount >= 2 && (
                    <div className="fire-notice">
                        🔥 {item.bidCount} people are negotiating this item
                    </div>
                )}

                {error && <p className="error-msg">{error}</p>}

                {item.status === 'available' && user?._id !== item.seller?._id && (
                    <div className="offer-section">
                        <p className="floor-hint">
                            Minimum offer: <strong>{formatKSh(item.floorPrice)}</strong>
                        </p>
                        <div className="offer-input-row">
                            <input
                                type="number"
                                placeholder={`KSh ${item.floorPrice} or more`}
                                value={offer}
                                onChange={e => setOffer(e.target.value)}
                                min={item.floorPrice}
                                max={item.price}
                            />
                            <button
                                className="btn-primary offer-btn"
                                onClick={handleOffer}
                                disabled={offering}
                            >
                                {offering ? <span className="spinner"/> : 'Make an Offer'}
                            </button>
                        </div>
                        <button
                            className="btn-secondary"
                            onClick={handleBuyNow}
                            disabled={offering}
                            style={{ marginTop: '0.6rem' }}
                        >
                            Buy at {formatKSh(item.price)}
                        </button>
                        <p className="offer-tip">
                            💡 Start with a reasonable offer — most sellers are open to negotiation
                        </p>
                    </div>
                )}

                {item.status === 'sold' && (
                    <div className="sold-notice">This item has been sold</div>
                )}
            </div>

            <style>{`
                .item-detail { padding-bottom: 2rem; }
                .main-img { width: 100%; aspect-ratio: 1; object-fit: cover; }
                .img-thumbs {
                    display: flex;
                    gap: 0.4rem;
                    padding: 0.5rem;
                    background: white;
                }
                .thumb {
                    width: 60px;
                    height: 60px;
                    object-fit: cover;
                    border-radius: 6px;
                    border: 2px solid transparent;
                    cursor: pointer;
                }
                .thumb.active { border-color: var(--accent); }
                .item-info { padding: 1rem; }
                .item-info-top {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 1rem;
                }
                .item-info-top h2 { font-size: 1.2rem; font-weight: 600; }
                .item-price-big {
                    font-size: 1.4rem;
                    font-weight: 700;
                    color: var(--accent);
                    margin-top: 0.2rem;
                }
                .item-meta {
                    background: var(--bg-card);
                    border-radius: var(--radius-sm);
                    padding: 0.8rem;
                    margin-bottom: 1rem;
                }
                .meta-row {
                    display: flex;
                    justify-content: space-between;
                    font-size: 0.88rem;
                    padding: 0.4rem 0;
                    border-bottom: 1px solid var(--border);
                }
                .meta-row:last-child { border-bottom: none; }
                .meta-row span:first-child { color: var(--text-muted); }
                .meta-row span:last-child { font-weight: 500; }
                .item-description {
                    font-size: 0.88rem;
                    color: var(--text-muted);
                    line-height: 1.65;
                    margin-bottom: 1rem;
                }
                .fire-notice {
                    background: rgba(193,68,14,0.08);
                    border-radius: var(--radius-sm);
                    padding: 0.6rem 0.9rem;
                    font-size: 0.85rem;
                    color: var(--accent);
                    font-weight: 500;
                    margin-bottom: 1rem;
                }
                .floor-hint {
                    font-size: 0.82rem;
                    color: var(--text-muted);
                    margin-bottom: 0.6rem;
                }
                .offer-input-row {
                    display: flex;
                    gap: 0.6rem;
                    margin-bottom: 0.6rem;
                }
                .offer-input-row input {
                    flex: 1;
                    padding: 0.8rem;
                    border: 1.5px solid var(--border);
                    border-radius: var(--radius-sm);
                    font-family: var(--font-sans);
                    font-size: 0.95rem;
                    outline: none;
                }
                .offer-input-row input:focus { border-color: var(--accent); }
                .offer-btn { width: auto; padding: 0.8rem 1.2rem; white-space: nowrap; }
                .offer-tip {
                    font-size: 0.78rem;
                    color: var(--text-dim);
                    margin-top: 0.8rem;
                }
                .sold-notice {
                    text-align: center;
                    padding: 1rem;
                    background: var(--bg-card);
                    border-radius: var(--radius-sm);
                    color: var(--text-muted);
                    font-weight: 500;
                }
            `}</style>
        </div>
    )
}

export default ItemDetail