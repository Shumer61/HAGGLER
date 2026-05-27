const getAccessToken = async () => {
    const auth = Buffer.from(
        `${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`
    ).toString('base64')

    const url = process.env.NODE_ENV === 'production'
        ? 'https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials'
        : 'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials'

    const res = await fetch(url, {
        headers: { Authorization: `Basic ${auth}` }
    })
    const data = await res.json()
    return data.access_token
}

const stkPush = async ({ phone, amount, accountRef, transactionDesc }) => {
    const token = await getAccessToken()
    const timestamp = new Date()
        .toISOString().replace(/[^0-9]/g, '').slice(0, 14)
    const password = Buffer.from(
        `${process.env.MPESA_SHORTCODE}${process.env.MPESA_PASSKEY}${timestamp}`
    ).toString('base64')

    const url = process.env.NODE_ENV === 'production'
        ? 'https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest'
        : 'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest'

    const res = await fetch(url, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            BusinessShortCode: process.env.MPESA_SHORTCODE,
            Password:          password,
            Timestamp:         timestamp,
            TransactionType:   'CustomerPayBillOnline',
            Amount:            Math.ceil(amount),
            PartyA:            phone,
            PartyB:            process.env.MPESA_SHORTCODE,
            PhoneNumber:       phone,
            CallBackURL:       process.env.MPESA_CALLBACK_URL,
            AccountReference:  accountRef,
            TransactionDesc:   transactionDesc
        })
    })
    return res.json()
}

module.exports = { getAccessToken, stkPush }