import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../utils/api'
import { useAuth } from '../context/AuthContext'
import { formatKSh } from '../utils/formatters'

function SellerDashboard() {
    const { user } = useAuth()
    const navigate = useNavigate()
    const [listings, setListings] = useState([])
    const [stats, setStats] = useState({ active: 0, sold: 0, offers: 0, revenue: 0 })
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [form, setForm] = useState({
        title: '', description: '', category: 'tops',
        size: 'M', condition: 'good', brand: '', price: ''
    })
    const [images, setImages] = useState([])
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState('')

    useEffect(() => {
        loadListings()
    }, [])

    const loadListings = async () => {
        try {
            const { data } = await api.get('/items/my-listings')
            setListings(data)
            const active = data.filter(i => i.status === 'available' || i.status === 'negotiating').length
            const sold = data.filter(i => i.status === 'sold').length
            const offers = data.reduce((sum, i) => sum + i.bidCount, 0)
            setStats({ active, sold, offers, revenue: 0 })
        } catch(err) {
            console.warn(err)
        }
        setLoading(false)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if(images.length === 0) { setError('Add at least one photo'); return }
        setSubmitting(true)
        setError('')
        try {
            const fd = new FormData()
            Object.entries(form).forEach(([k, v]) => fd.append(k, v))
            images.forEach(img => fd.append('images', img))
            const { data } = await api.post('/items', fd, {
                headers: { 'Content-Type': 'multipart/form-data' }
            })
            setListings(prev => [data, ...prev])
            setShowForm(false)
            setForm({ title: '', description: '', category: 'tops', size: 'M', condition: 'good', brand: '', price: '' })
            setImages([])
        } catch(err) {
            setError(err.response?.data?.message || 'Could not create listing')
        }
        setSubmitting(false)
    }

    const deleteItem = async (id) => {
        try {
            await api.delete(`/items/${id}`)
            setListings(prev => prev.filter(i => i._id !== id))
        } catch(err) { console.warn(err) }
    }

    if(loading) return <div className="loading-screen"><span className="spinner"/></div>

    return (
        <div className="seller-dash">
            <div className="dash-header">
                <div>
                    <h1>Seller Dashboard</h1>
                    <p>{user.sellerProfile?.storeName || user.name}</p>
                </div>
                <button className="btn-primary add-btn" onClick={() => setShowForm(!showForm)}>
                    {showForm ? '✕ Cancel' : '+ Add Item'}
                </button>
            </div>

            <div className="stats-row">
                <div className="stat-card">
                    <h3>{stats.active}</h3>
                    <p>Active</p>
                </div>
                <div className="stat-card">
                    <h3>{stats.sold}</h3>
                    <p>Sold</p>
                </div>
                <div className="stat-card">
                    <h3>{stats.offers}</h3>
                    <p>Offers</p>
                </div>
            </div>

            {showForm && (
                <form onSubmit={handleSubmit} className="listing-form">
                    <h3>Add New Listing</h3>
                    <div className="photo-upload" onClick={() => document.getElementById('img-input').click()}>
                        {images.length === 0 ? (
                            <p>📷 Tap to add photos (up to 5)</p>
                        ) : (
                            <div className="photo-previews">
                                {Array.from(images).map((img, i) => (
                                    <img key={i} src={URL.createObjectURL(img)} alt="" />
                                ))}
                            </div>
                        )}
                        <input
                            id="img-input"
                            type="file"
                            accept="image/*"
                            multiple
                            style={{ display: 'none' }}
                            onChange={e => setImages(e.target.files)}
                        />
                    </div>
                    <div className="input-group">
                        <label>Item Name</label>
                        <input value={form.title} onChange={e => setForm({...form, title: e.target.value})} required placeholder="e.g. Vintage Denim Jacket" />
                    </div>
                    <div className="form-row">
                        <div className="input-group">
                            <label>Price (KSh)</label>
                            <input type="number" value={form.price} onChange={e => setForm({...form, price: e.target.value})} required placeholder="4500" />
                        </div>
                        <div className="input-group">
                            <label>Category</label>
                            <select value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
                                {['tops','bottoms','dresses','shoes','jackets','accessories'].map(c => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="form-row">
                        <div className="input-group">
                            <label>Size</label>
                            <select value={form.size} onChange={e => setForm({...form, size: e.target.value})}>
                                {['XS','S','M','L','XL','XXL','36','37','38','39','40','41','42','43','44','One Size'].map(s => (
                                    <option key={s} value={s}>{s}</option>
                                ))}
                            </select>
                        </div>
                        <div className="input-group">
                            <label>Condition</label>
                            <select value={form.condition} onChange={e => setForm({...form, condition: e.target.value})}>
                                <option value="excellent">Excellent</option>
                                <option value="good">Good</option>
                                <option value="fair">Fair</option>
                            </select>
                        </div>
                    </div>
                    <div className="input-group">
                        <label>Brand (optional)</label>
                        <input value={form.brand} onChange={e => setForm({...form, brand: e.target.value})} placeholder="Unknown" />
                    </div>
                    <div className="input-group">
                        <label>Description</label>
                        <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} required placeholder="Describe the item..." />
                    </div>
                    {form.price && (
                        <p className="floor-preview">
                            Minimum offer buyers can make: <strong>{formatKSh(Math.ceil(Number(form.price) * 0.75))}</strong>
                        </p>
                    )}
                    {error && <p className="error-msg">{error}</p>}
                    <button type="submit" className="btn-primary" disabled={submitting}>
                        {submitting ? <span className="spinner"/> : 'Add Listing'}
                    </button>
                </form>
            )}

            <div className="listings-section">
                <h3>My Listings</h3>
                {listings.length === 0 ? (
                    <p className="empty-msg">No listings yet. Add your first item above.</p>
                ) : (
                    listings.map(item => (
                        <div key={item._id} className="listing-row">
                            <img src={item.images[0]} alt={item.title} className="listing-thumb" />
                            <div className="listing-info">
                                <h4>{item.title}</h4>
                                <p>{formatKSh(item.price)}</p>
                                <div className="listing-meta">
                                    <span>👁 {item.views}</span>
                                    <span>💬 {item.bidCount} offers</span>
                                    <span className={`status-tag ${item.status}`}>{item.status}</span>
                                </div>
                            </div>
                            <button className="delete-listing" onClick={() => deleteItem(item._id)}>🗑</button>
                        </div>
                    ))
                )}
            </div>

            <style>{`
                .seller-dash { padding-bottom: 5rem; }
                .dash-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 1rem;
                    background: white;
                    border-bottom: 1px solid var(--border);
                }
                .dash-header h1 { font-size: 1.1rem; font-weight: 700; }
                .dash-header p { font-size: 0.8rem; color: var(--text-muted); }
                .add-btn { width: auto; padding: 0.6rem 1rem; font-size: 0.85rem; }
                .stats-row {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 0.8rem;
                    padding: 1rem;
                }
                .stat-card {
                    background: white;
                    border-radius: var(--radius-sm);
                    padding: 1rem;
                    text-align: center;
                    box-shadow: var(--shadow);
                }
                .stat-card h3 { font-size: 1.8rem; font-weight: 700; color: var(--accent); }
                .stat-card p { font-size: 0.75rem; color: var(--text-muted); margin-top: 0.2rem; }
                .listing-form {
                    margin: 0 1rem 1rem;
                    background: white;
                    border-radius: var(--radius-md);
                    padding: 1.2rem;
                    box-shadow: var(--shadow);
                }
                .listing-form h3 { margin-bottom: 1rem; font-size: 1rem; }
                .photo-upload {
                    background: var(--bg);
                    border: 2px dashed var(--border);
                    border-radius: var(--radius-sm);
                    padding: 1.5rem;
                    text-align: center;
                    cursor: pointer;
                    margin-bottom: 1rem;
                    font-size: 0.88rem;
                    color: var(--text-muted);
                }
                .photo-previews { display: flex; gap: 0.4rem; flex-wrap: wrap; justify-content: center; }
                .photo-previews img { width: 70px; height: 70px; object-fit: cover; border-radius: 6px; }
                .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 0.6rem; }
                .floor-preview {
                    font-size: 0.82rem;
                    color: var(--text-muted);
                    margin-bottom: 0.8rem;
                    background: var(--bg);
                    padding: 0.6rem 0.8rem;
                    border-radius: var(--radius-sm);
                }
                .listings-section { padding: 0 1rem; }
                .listings-section h3 { font-size: 1rem; margin-bottom: 0.8rem; }
                .listing-row {
                    display: flex;
                    align-items: center;
                    gap: 0.8rem;
                    background: white;
                    border-radius: var(--radius-sm);
                    padding: 0.8rem;
                    margin-bottom: 0.6rem;
                    box-shadow: var(--shadow);
                }
                .listing-thumb { width: 60px; height: 60px; object-fit: cover; border-radius: 6px; }
                .listing-info { flex: 1; }
                .listing-info h4 { font-size: 0.9rem; font-weight: 600; }
                .listing-info p { font-size: 0.85rem; color: var(--accent); font-weight: 600; }
                .listing-meta { display: flex; gap: 0.6rem; margin-top: 0.3rem; font-size: 0.72rem; color: var(--text-dim); align-items: center; }
                .status-tag {
                    padding: 0.15rem 0.5rem;
                    border-radius: 10px;
                    font-size: 0.68rem;
                    font-weight: 600;
                    text-transform: capitalize;
                }
                .status-tag.available { background: rgba(26,122,63,0.1); color: var(--success); }
                .status-tag.negotiating { background: rgba(193,68,14,0.1); color: var(--accent); }
                .status-tag.sold { background: rgba(90,74,58,0.1); color: #5A4A3A; }
                .delete-listing { background: none; border: none; font-size: 1.1rem; cursor: pointer; padding: 0.3rem; }
                .empty-msg { text-align: center; color: var(--text-muted); font-size: 0.88rem; padding: 2rem 0; }
            `}</style>
        </div>
    )
}

export default SellerDashboard