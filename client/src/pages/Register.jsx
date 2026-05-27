import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../utils/api'

function Register() {
    const { login } = useAuth()
    const navigate = useNavigate()
    const [form, setForm] = useState({
        name: '', email: '', password: '', phone: '', acceptedTerms: false
    })
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()
        if(!form.acceptedTerms) {
            setError('Please accept the terms and conditions')
            return
        }
        setLoading(true)
        setError('')
        try {
            const { data } = await api.post('/auth/register', form)
            login(data, data.accessToken)
            navigate('/')
        } catch(err) {
            setError(err.response?.data?.message || 'Registration failed')
        }
        setLoading(false)
    }

    return (
        <div className="auth-page">
            <div className="auth-header">
                <h1>Haggler</h1>
                <p>Create your account</p>
            </div>
            <form onSubmit={handleSubmit} className="auth-form">
                <div className="input-group">
                    <label>Full Name</label>
                    <input
                        type="text"
                        value={form.name}
                        onChange={e => setForm({...form, name: e.target.value})}
                        placeholder="Your name"
                        required
                    />
                </div>
                <div className="input-group">
                    <label>Email</label>
                    <input
                        type="email"
                        value={form.email}
                        onChange={e => setForm({...form, email: e.target.value})}
                        placeholder="your@email.com"
                        required
                    />
                </div>
                <div className="input-group">
                    <label>Phone (Safaricom)</label>
                    <input
                        type="tel"
                        value={form.phone}
                        onChange={e => setForm({...form, phone: e.target.value})}
                        placeholder="0712345678"
                        required
                    />
                </div>
                <div className="input-group">
                    <label>Password</label>
                    <input
                        type="password"
                        value={form.password}
                        onChange={e => setForm({...form, password: e.target.value})}
                        placeholder="Min 6 characters"
                        required
                    />
                </div>
                <div className="terms-check">
                    <input
                        type="checkbox"
                        id="terms"
                        checked={form.acceptedTerms}
                        onChange={e => setForm({...form, acceptedTerms: e.target.checked})}
                    />
                    <label htmlFor="terms">
                        I agree to the <a href="/terms">Terms & Conditions</a>
                    </label>
                </div>
                {error && <p className="error-msg">{error}</p>}
                <button type="submit" className="btn-primary" disabled={loading}>
                    {loading ? <span className="spinner"/> : 'Create Account'}
                </button>
                <p className="auth-switch">
                    Have an account? <Link to="/login">Login</Link>
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
                }
                .auth-header {
                    text-align: center;
                    margin-bottom: 2rem;
                }
                .auth-header h1 {
                    font-family: var(--font-serif);
                    font-size: 2.5rem;
                    color: var(--accent);
                    letter-spacing: 2px;
                }
                .auth-header p { color: var(--text-muted); font-size: 0.9rem; }
                .auth-form { width: 100%; max-width: 380px; }
                .terms-check {
                    display: flex;
                    align-items: center;
                    gap: 0.6rem;
                    margin-bottom: 1rem;
                    font-size: 0.85rem;
                    color: var(--text-muted);
                }
                .terms-check a { color: var(--accent); }
                .auth-switch {
                    text-align: center;
                    margin-top: 1.2rem;
                    font-size: 0.85rem;
                    color: var(--text-muted);
                }
                .auth-switch a { color: var(--accent); font-weight: 600; text-decoration: none; }
            `}</style>
        </div>
    )
}

export default Register