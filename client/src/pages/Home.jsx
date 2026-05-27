import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../utils/api'
import ItemCard from '../components/items/ItemCard'
import { useAuth } from '../context/AuthContext'

const CATEGORIES = ['All', 'tops', 'bottoms', 'dresses', 'shoes', 'jackets', 'accessories']

function Home() {
    const { user } = useAuth()
    const navigate = useNavigate()
    const [items, setItems] = useState([])
    const [loading, setLoading] = useState(true)
    const [category, setCategory] = useState('All')
    const [search, setSearch] = useState('')

    useEffect(() => {
        loadItems()
    }, [category])

    const loadItems = async () => {
        setLoading(true)
        try {
            const params = {}
            if(category !== 'All') params.category = category
            if(search) params.search = search
            const { data } = await api.get('/items', { params })
            setItems(data.items)
        } catch(err) {
            console.warn('load items failed', err)
        }
        setLoading(false)
    }

    return (
        <div className="home">
            <div className="home-header">
                <div className="home-top">
                    <h1 className="home-logo">Haggler 🔥</h1>
                    {user && (
                        <p className="home-greeting">Hey, {user.name.split(' ')[0]}</p>
                    )}
                </div>
                <div className="search-bar">
                    <span className="search-icon">🔍</span>
                    <input
                        type="text"
                        placeholder="Search for clothing..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && loadItems()}
                    />
                </div>
                <div className="category-chips">
                    {CATEGORIES.map(cat => (
                        <button
                            key={cat}
                            className={`chip ${category === cat ? 'active' : ''}`}
                            onClick={() => setCategory(cat)}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            <div className="home-body">
                {loading ? (
                    <div className="loading-state">
                        <span className="spinner"/>
                    </div>
                ) : items.length === 0 ? (
                    <div className="empty-state">
                        <p>No items found</p>
                        <p>Try a different category</p>
                    </div>
                ) : (
                    <div className="items-grid">
                        {items.map(item => (
                            <ItemCard key={item._id} item={item} />
                        ))}
                    </div>
                )}
            </div>

            <style>{`
                .home-header {
                    background: white;
                    padding: 1rem;
                    border-bottom: 1px solid var(--border);
                    position: sticky;
                    top: 0;
                    z-index: 100;
                }
                .home-top {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 0.8rem;
                }
                .home-logo {
                    font-family: var(--font-serif);
                    font-size: 1.6rem;
                    color: var(--accent);
                    font-weight: 400;
                }
                .home-greeting {
                    font-size: 0.85rem;
                    color: var(--text-muted);
                }
                .search-bar {
                    display: flex;
                    align-items: center;
                    gap: 0.6rem;
                    background: var(--bg);
                    border: 1.5px solid var(--border);
                    border-radius: var(--radius-sm);
                    padding: 0.6rem 0.9rem;
                    margin-bottom: 0.8rem;
                }
                .search-icon { font-size: 1rem; }
                .search-bar input {
                    border: none;
                    background: transparent;
                    outline: none;
                    font-family: var(--font-sans);
                    font-size: 0.9rem;
                    width: 100%;
                    color: var(--text);
                }
                .category-chips {
                    display: flex;
                    gap: 0.5rem;
                    overflow-x: auto;
                    padding-bottom: 0.2rem;
                    scrollbar-width: none;
                }
                .category-chips::-webkit-scrollbar { display: none; }
                .chip {
                    white-space: nowrap;
                    padding: 0.35rem 0.9rem;
                    border-radius: 20px;
                    border: 1.5px solid var(--border);
                    background: transparent;
                    font-family: var(--font-sans);
                    font-size: 0.8rem;
                    cursor: pointer;
                    color: var(--text-muted);
                    transition: all 0.15s;
                    text-transform: capitalize;
                }
                .chip.active {
                    background: var(--accent);
                    border-color: var(--accent);
                    color: white;
                    font-weight: 600;
                }
                .home-body { padding: 1rem; }
                .items-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 0.8rem;
                }
                .loading-state {
                    display: flex;
                    justify-content: center;
                    padding: 3rem;
                }
                .empty-state {
                    text-align: center;
                    padding: 3rem 1rem;
                    color: var(--text-muted);
                }
                .empty-state p:first-child {
                    font-size: 1rem;
                    margin-bottom: 0.3rem;
                }
                .empty-state p:last-child { font-size: 0.85rem; }
            `}</style>
        </div>
    )
}

export default Home