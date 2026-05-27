export const formatKSh = (amount) => {
    return `KSh ${Number(amount).toLocaleString('en-KE')}`
}

export const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-KE', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    })
}

export const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('en-KE', {
        hour: '2-digit',
        minute: '2-digit'
    })
}

export const getStatusColor = (status) => {
    const colors = {
        available:   '#1A7A3F',
        negotiating: '#C1440E',
        sold:        '#5A4A3A',
        active:      '#1A7A3F',
        agreed:      '#8B6914',
        paid:        '#1A7A3F',
        completed:   '#5A4A3A',
        disputed:    '#C1440E',
        pending:     '#8B6914'
    }
    return colors[status] || '#6B5E52'
}

export const getFireIcon = (bidCount) => bidCount >= 2 ? '🔥' : ''