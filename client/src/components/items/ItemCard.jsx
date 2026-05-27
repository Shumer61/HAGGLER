import { useNavigate } from 'react-router-dom'
import { formatKSh, getFireIcon } from '../../utils/formatters'

function ItemCard({ item }) {
    const navigate = useNavigate()

    return (
        <div className="item-card" onClick={() => navigate(`/items/${item._id}`)}>
            <div className="item-card-img">
                <img src={item.images[0]} alt={item.title} loading="lazy" />
                <span className="item-badge negotiable">Negotiable</span>
                {item.bidCount >= 2 && (
                    <span className="item-fire">🔥 {item.bidCount}</span>
                )}
            </div>
            <div className="item-card-body">
                <p className="item-category">{item.category}</p>
                <h3 className="item-title">{item.title}</h3>
                <p className="item-price">{formatKSh(item.price)}</p>
                <p className="item-seller">by {item.seller?.sellerProfile?.storeName || item.seller?.name}</p>
            </div>
            <style>{`
                .item-card {
                    background: white;
                    border-radius: var(--radius-md);
                    overflow: hidden;
                    box-shadow: var(--shadow);
                    cursor: pointer;
                    transition: transform 0.2s;
                }
                .item-card:active { transform: scale(0.98); }
                .item-card-img {
                    position: relative;
                    aspect-ratio: 1;
                    overflow: hidden;
                }
                .item-card-img img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }
                .item-badge {
                    position: absolute;
                    top: 0.5rem;
                    left: 0.5rem;
                    background: var(--accent);
                    color: white;
                    font-size: 0.68rem;
                    font-weight: 600;
                    padding: 0.2rem 0.5rem;
                    border-radius: 4px;
                }
                .item-fire {
                    position: absolute;
                    top: 0.5rem;
                    right: 0.5rem;
                    background: rgba(0,0,0,0.6);
                    color: white;
                    font-size: 0.7rem;
                    padding: 0.2rem 0.4rem;
                    border-radius: 4px;
                }
                .item-card-body { padding: 0.75rem; }
                .item-category { font-size: 0.72rem; color: var(--text-dim); text-transform: capitalize; }
                .item-title { font-size: 0.92rem; font-weight: 600; margin: 0.15rem 0; }
                .item-price { font-size: 1rem; font-weight: 700; color: var(--accent); }
                .item-seller { font-size: 0.72rem; color: var(--text-dim); margin-top: 0.2rem; }
            `}</style>
        </div>
    )
}

export default ItemCard