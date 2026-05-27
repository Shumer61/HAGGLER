import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../utils/api'
import { useAuth } from '../context/AuthContext'
import { useSocket } from '../context/SocketContext'
import { formatKSh, formatTime } from '../utils/formatters'

function NegotiationChat() {
    const { id } = useParams()
    const navigate = useNavigate()
    const { user } = useAuth()
    const { socket } = useSocket()
    const [negotiation, setNegotiation] = useState(null)
    const [loading, setLoading] = useState(true)
    const [offer, setOffer] = useState('')
    const [message, setMessage] = useState('')
    const [sending, setSending] = useState(false)
    const [isTyping, setIsTyping] = useState(false)
    const messagesEnd = useRef(null)

    useEffect(() => {
        loadNegotiation()
    }, [id])

    useEffect(() => {
        if(!socket || !negotiation) return

        socket.emit('join_negotiation', { negotiationId: id })

        socket.on('new_offer', (data) => {
            setNegotiation(prev => ({
                ...prev,
                messages: [...prev.messages, data],
                currentOffer: data.amount
            }))
        })

        socket.on('new_message', (data) => {
            setNegotiation(prev => ({
                ...prev,
                messages: [...prev.messages, data]
            }))
        })

        socket.on('offer_accepted', (data) => {
            setNegotiation(prev => ({ ...prev, status: 'agreed', agreedPrice: data.agreedPrice }))
        })

        socket.on('offer_declined', () => {
            setNegotiation(prev => ({ ...prev, status: 'cancelled' }))
        })

        socket.on('user_typing', () => {
            setIsTyping(true)
            setTimeout(() => setIsTyping(false), 2000)
        })

        return () => {
            socket.off('new_offer')
            socket.off('new_message')
            socket.off('offer_accepted')
            socket.off('offer_declined')
            socket.off('user_typing')
        }
    }, [socket, negotiation])

    useEffect(() => {
        messagesEnd.current?.scrollIntoView({ behavior: 'smooth' })
    }, [negotiation?.messages])

    const loadNegotiation = async () => {
        try {
            const { data } = await api.get(`/negotiations/${id}`)
            setNegotiation(data)
        } catch(err) {
            navigate('/')
        }
        setLoading(false)
    }

    const sendOffer = async () => {
        if(!offer) return
        setSending(true)
        try {
            socket.emit('send_offer', { negotiationId: id, amount: Number(offer) })
            setOffer('')
        } catch(err) {
            console.warn(err)
        }
        setSending(false)
    }

    const sendMessage = async () => {
        if(!message.trim()) return
        socket.emit('send_message', { negotiationId: id, text: message })
        setMessage('')
    }

    const acceptOffer = async () => {
        try {
            socket.emit('accept_offer', { negotiationId: id })
        } catch(err) { console.warn(err) }
    }

    const declineOffer = async () => {
        try {
            socket.emit('decline_offer', { negotiationId: id })
        } catch(err) { console.warn(err) }
    }

    const handleTyping = () => {
        socket?.emit('typing', { negotiationId: id })
    }

    if(loading) return <div className="loading-screen"><span className="spinner"/></div>
    if(!negotiation) return null

    const isMyMsg = (msg) => msg.sender?._id === user._id || msg.sender === user._id
    const isBuyer = negotiation.buyer._id === user._id || negotiation.buyer === user._id
    const floorPrice = negotiation.item?.floorPrice

    return (
        <div className="chat-page">
            <div className="chat-header">
                <button className="back-btn" onClick={() => navigate(-1)}>←</button>
                <div className="chat-header-info">
                    <h2>{negotiation.item?.title}</h2>
                    <p>Listed: {formatKSh(negotiation.item?.price)}</p>
                </div>
                <div className="chat-status">
                    <span className={`status-dot ${negotiation.status}`}/>
                    {negotiation.status}
                </div>
            </div>

            <div className="listed-price-bar">
                Listed Price: <strong>{formatKSh(negotiation.item?.price)}</strong>
                {negotiation.currentOffer && (
                    <span> · Current offer: <strong>{formatKSh(negotiation.currentOffer)}</strong></span>
                )}
            </div>

            <div className="messages">
                {negotiation.messages.map((msg, i) => (
                    <div key={i} className={`message-wrap ${isMyMsg(msg) ? 'mine' : 'theirs'}`}>
                        {(msg.type === 'offer' || msg.type === 'counter') ? (
                            <div className={`offer-bubble ${isMyMsg(msg) ? 'mine' : 'theirs'}`}>
                                <p className="offer-label">
                                    {msg.type === 'offer' ? 'Offer' : 'Counter offer'}
                                </p>
                                <p className="offer-amount">{formatKSh(msg.amount)}</p>
                                {!isMyMsg(msg) && negotiation.status === 'active' && (
                                    <div className="offer-actions">
                                        <button className="accept-btn" onClick={acceptOffer}>✓ Accept</button>
                                        <button className="decline-btn" onClick={declineOffer}>✗ Decline</button>
                                    </div>
                                )}
                                <p className="msg-time">{formatTime(msg.timestamp)}</p>
                            </div>
                        ) : msg.type === 'accept' ? (
                            <div className="system-msg success">
                                🤝 {msg.text}
                            </div>
                        ) : msg.type === 'decline' ? (
                            <div className="system-msg error">
                                ✗ {msg.text}
                            </div>
                        ) : (
                            <div className={`text-bubble ${isMyMsg(msg) ? 'mine' : 'theirs'}`}>
                                <p>{msg.text}</p>
                                <p className="msg-time">{formatTime(msg.timestamp)}</p>
                            </div>
                        )}
                    </div>
                ))}
                {isTyping && (
                    <div className="typing-indicator">
                        <span/><span/><span/>
                    </div>
                )}
                <div ref={messagesEnd}/>
            </div>

            {negotiation.status === 'agreed' && (
                <div className="agreed-banner">
                    🎉 Deal at {formatKSh(negotiation.agreedPrice)}!
                    {isBuyer && (
                        <button
                            className="btn-primary"
                            style={{ marginTop: '0.8rem' }}
                            onClick={() => navigate(`/payment/${id}`)}
                        >
                            Proceed to Payment
                        </button>
                    )}
                </div>
            )}

            {negotiation.status === 'active' && (
                <div className="chat-input-area">
                    <p className="floor-hint-small">Min offer: {formatKSh(floorPrice)}</p>
                    <div className="offer-input-row">
                        <input
                            type="number"
                            placeholder={`KSh ${floorPrice}+`}
                            value={offer}
                            onChange={e => setOffer(e.target.value)}
                            min={floorPrice}
                        />
                        <button className="send-offer-btn" onClick={sendOffer} disabled={sending}>
                            Make Offer
                        </button>
                    </div>
                    <div className="message-input-row">
                        <input
                            type="text"
                            placeholder="Type a message..."
                            value={message}
                            onChange={e => setMessage(e.target.value)}
                            onKeyDown={e => { handleTyping(); if(e.key === 'Enter') sendMessage() }}
                        />
                        <button className="send-msg-btn" onClick={sendMessage}>→</button>
                    </div>
                    <p className="chat-tip">Be respectful and make fair offers. Happy haggling! 🤝</p>
                </div>
            )}

            <style>{`
                .chat-page { display: flex; flex-direction: column; height: 100vh; }
                .chat-header {
                    display: flex;
                    align-items: center;
                    gap: 0.8rem;
                    padding: 0.8rem 1rem;
                    background: white;
                    border-bottom: 1px solid var(--border);
                    position: sticky;
                    top: 0;
                    z-index: 100;
                }
                .chat-header-info { flex: 1; }
                .chat-header-info h2 { font-size: 0.95rem; font-weight: 600; }
                .chat-header-info p { font-size: 0.78rem; color: var(--text-muted); }
                .chat-status {
                    display: flex;
                    align-items: center;
                    gap: 0.3rem;
                    font-size: 0.75rem;
                    color: var(--text-muted);
                    text-transform: capitalize;
                }
                .status-dot {
                    width: 8px; height: 8px;
                    border-radius: 50%;
                    background: var(--text-dim);
                }
                .status-dot.active { background: var(--success); }
                .status-dot.agreed { background: var(--warning); }
                .listed-price-bar {
                    text-align: center;
                    padding: 0.5rem;
                    background: var(--bg-card);
                    font-size: 0.82rem;
                    color: var(--text-muted);
                    border-bottom: 1px solid var(--border);
                }
                .messages {
                    flex: 1;
                    overflow-y: auto;
                    padding: 1rem;
                    display: flex;
                    flex-direction: column;
                    gap: 0.8rem;
                }
                .message-wrap { display: flex; }
                .message-wrap.mine { justify-content: flex-end; }
                .message-wrap.theirs { justify-content: flex-start; }
                .text-bubble {
                    max-width: 75%;
                    padding: 0.7rem 0.9rem;
                    border-radius: 12px;
                    font-size: 0.88rem;
                }
                .text-bubble.mine {
                    background: var(--accent);
                    color: white;
                    border-bottom-right-radius: 4px;
                }
                .text-bubble.theirs {
                    background: white;
                    border: 1px solid var(--border);
                    border-bottom-left-radius: 4px;
                }
                .offer-bubble {
                    max-width: 75%;
                    padding: 0.9rem;
                    border-radius: 12px;
                    background: white;
                    border: 1.5px solid var(--border);
                }
                .offer-bubble.mine { background: rgba(193,68,14,0.06); border-color: var(--accent); }
                .offer-label { font-size: 0.72rem; color: var(--text-dim); text-transform: uppercase; letter-spacing: 0.5px; }
                .offer-amount { font-size: 1.2rem; font-weight: 700; color: var(--accent); margin: 0.2rem 0; }
                .offer-actions { display: flex; gap: 0.5rem; margin-top: 0.6rem; }
                .accept-btn {
                    flex: 1; padding: 0.5rem;
                    background: var(--success); color: white;
                    border: none; border-radius: 6px;
                    font-weight: 600; cursor: pointer; font-size: 0.85rem;
                }
                .decline-btn {
                    flex: 1; padding: 0.5rem;
                    background: #e53e3e; color: white;
                    border: none; border-radius: 6px;
                    font-weight: 600; cursor: pointer; font-size: 0.85rem;
                }
                .msg-time { font-size: 0.68rem; color: var(--text-dim); margin-top: 0.3rem; }
                .system-msg {
                    text-align: center;
                    padding: 0.6rem 1rem;
                    border-radius: 20px;
                    font-size: 0.82rem;
                    font-weight: 600;
                    margin: 0 auto;
                }
                .system-msg.success { background: rgba(26,122,63,0.1); color: var(--success); }
                .system-msg.error { background: rgba(193,68,14,0.08); color: var(--accent); }
                .typing-indicator {
                    display: flex; gap: 4px; padding: 0.5rem;
                }
                .typing-indicator span {
                    width: 8px; height: 8px;
                    background: var(--text-dim);
                    border-radius: 50%;
                    animation: bounce 0.8s infinite;
                }
                .typing-indicator span:nth-child(2) { animation-delay: 0.15s; }
                .typing-indicator span:nth-child(3) { animation-delay: 0.3s; }
                @keyframes bounce {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-4px); }
                }
                .agreed-banner {
                    padding: 1rem;
                    background: rgba(26,122,63,0.08);
                    border-top: 1px solid rgba(26,122,63,0.2);
                    text-align: center;
                    font-weight: 600;
                    color: var(--success);
                }
                .chat-input-area {
                    padding: 0.8rem;
                    background: white;
                    border-top: 1px solid var(--border);
                }
                .floor-hint-small {
                    font-size: 0.75rem;
                    color: var(--text-dim);
                    margin-bottom: 0.4rem;
                }
                .offer-input-row, .message-input-row {
                    display: flex;
                    gap: 0.5rem;
                    margin-bottom: 0.5rem;
                }
                .offer-input-row input, .message-input-row input {
                    flex: 1;
                    padding: 0.7rem 0.9rem;
                    border: 1.5px solid var(--border);
                    border-radius: var(--radius-sm);
                    font-family: var(--font-sans);
                    font-size: 0.9rem;
                    outline: none;
                }
                .offer-input-row input:focus, .message-input-row input:focus {
                    border-color: var(--accent);
                }
                .send-offer-btn {
                    padding: 0.7rem 1rem;
                    background: var(--accent);
                    color: white;
                    border: none;
                    border-radius: var(--radius-sm);
                    font-weight: 600;
                    cursor: pointer;
                    white-space: nowrap;
                    font-size: 0.85rem;
                }
                .send-msg-btn {
                    padding: 0.7rem 1rem;
                    background: var(--text);
                    color: white;
                    border: none;
                    border-radius: var(--radius-sm);
                    font-size: 1.1rem;
                    cursor: pointer;
                }
                .chat-tip {
                    font-size: 0.75rem;
                    color: var(--text-dim);
                    text-align: center;
                }
            `}</style>
        </div>
    )
}

export default NegotiationChat