import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { SocketProvider } from './context/SocketContext'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import ItemDetail from './pages/ItemDetail'
import NegotiationChat from './pages/NegotiationChat'
import Payment from './pages/Payment'
import PaymentSuccess from './pages/PaymentSuccess'
import SellerDashboard from './pages/SellerDashboard'
import AdminDashboard from './pages/AdminDashboard'
import Profile from './pages/Profile'
import BottomNav from './components/common/BottomNav'
import './index.css'

function ProtectedRoute({ children }) {
    const { user, loading } = useAuth()
    if(loading) return <div className="loading-screen">Loading...</div>
    if(!user) return <Navigate to="/login" />
    return children
}

function SellerRoute({ children }) {
    const { user, loading } = useAuth()
    if(loading) return <div className="loading-screen">Loading...</div>
    if(!user || (user.role !== 'seller' && user.role !== 'platform_admin')) {
        return <Navigate to="/" />
    }
    return children
}

function AdminRoute({ children }) {
    const { user, loading } = useAuth()
    if(loading) return <div className="loading-screen">Loading...</div>
    if(!user || user.role !== 'platform_admin') return <Navigate to="/" />
    return children
}

function AppContent() {
    const { user } = useAuth()

    return (
        <BrowserRouter>
            <div className="app-wrapper">
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/items/:id" element={<ItemDetail />} />
                    <Route path="/negotiate/:id" element={
                        <ProtectedRoute><NegotiationChat /></ProtectedRoute>
                    } />
                    <Route path="/payment/:negotiationId" element={
                        <ProtectedRoute><Payment /></ProtectedRoute>
                    } />
                    <Route path="/payment/success" element={
                        <ProtectedRoute><PaymentSuccess /></ProtectedRoute>
                    } />
                    <Route path="/seller" element={
                        <SellerRoute><SellerDashboard /></SellerRoute>
                    } />
                    <Route path="/admin" element={
                        <AdminRoute><AdminDashboard /></AdminRoute>
                    } />
                    <Route path="/profile" element={
                        <ProtectedRoute><Profile /></ProtectedRoute>
                    } />
                </Routes>
                {user && <BottomNav />}
            </div>
        </BrowserRouter>
    )
}

function App() {
    return (
        <AuthProvider>
            <SocketProvider>
                <AppContent />
            </SocketProvider>
        </AuthProvider>
    )
}

export default App