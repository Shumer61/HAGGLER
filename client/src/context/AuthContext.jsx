import { createContext, useContext, useState, useEffect } from 'react'
import api from '../utils/api'

const AuthContext = createContext()

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const token = localStorage.getItem('accessToken')
        if(token) {
            api.get('/auth/me')
                .then(res => setUser(res.data))
                .catch(() => localStorage.removeItem('accessToken'))
                .finally(() => setLoading(false))
        } else {
            setLoading(false)
        }
    }, [])

    const login = (userData, token) => {
        localStorage.setItem('accessToken', token)
        setUser(userData)
    }

    const logout = async () => {
        try {
            await api.post('/auth/logout')
        } catch(err) {
            console.warn('logout error', err)
        }
        localStorage.removeItem('accessToken')
        setUser(null)
    }

    const updateUser = (data) => setUser(prev => ({ ...prev, ...data }))

    return (
        <AuthContext.Provider value={{ user, loading, login, logout, updateUser }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => useContext(AuthContext)