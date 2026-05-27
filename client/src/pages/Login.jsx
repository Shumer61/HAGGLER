import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../utils/api'

function Login() {
    const { login } = useAuth()
    const navigate = useNavigate()
    const [form, setForm] = useState({ email: '', password: '' })
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError('')
        try {
            const { data } = await api.post('/auth/login', form)
            login(data, data.accessToken)
            if(data.role === 'platform_admin') navigate('/admin')
            else if(data.role === 'seller') navigate('/seller')
            else navigate('/')
        } catch(err) {
            setError(err.response?.data?.message || 'Login failed')
        }
        setLoading(false)
    }

    return (
        <div className="auth-page">
            <div className="auth-header">
                <h1>Haggler</h1>
                <p>Gikomba, in your pocket</p>
            </div>
            <form onSubmit={handleSubmit} className="auth-form">
                <div className="input-group">
                    <label>Email</label>
                    <input
                        type="email"
                        value={form.email}
                        onChange={e => setForm({...form, email: e.target.value})}
                        placeholder="your@email.com"
                        autoComplete="off"
                        required
                    />
                </div>
                <div className="input-group">
                    <label>Password</label>
                    <input
                        type="password"
                        value={form.password}
                        onChange={e => setForm({...form, password: e.target.value})}
                        placeholder="••••••"
                        autoComplete="new-password"
                        required
                    />
                </div>
                {error && <p className="error-msg">{error}</p>}
                <button type="submit" className="btn-primary" disabled={loading}>
                    {loading ? <span className="spinner"/> : 'Login'}
                </button>
                <p className="auth-switch">
                    No account? <Link to="/register">Register here</Link>
                </p>
            </form>
            <style>{`
                .auth-page {
                    min-height: 100vh;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    padding: 2rem 1.5rem;
                    background: var(--bg);
                }
                .auth-header {
                    text-align: center;
                    margin-bottom: 2.5rem;
                }
                .auth-header h1 {
                    font-family: var(--font-serif);
                    font-size: 3rem;
                    color: var(--accent);
                    letter-spacing: 2px;
                }
                .auth-header p {
                    color: var(--text-muted);
                    font-size: 0.9rem;
                    margin-top: 0.3rem;
                }
                .auth-form {
                    width: 100%;
                    max-width: 380px;
                }
                .auth-switch {
                    text-align: center;
                    margin-top: 1.2rem;
                    font-size: 0.85rem;
                    color: var(--text-muted);
                }
                .auth-switch a {
                    color: var(--accent);
                    font-weight: 600;
                    text-decoration: none;
                }
            `}</style>
        </div>
    )
}

export default Login