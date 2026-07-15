export function formatCurrency(amount : number) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount)
}

export function formatDate(isoString: string) : string {
    const date = new Date(isoString)
    const formatter = new Intl.DateTimeFormat('en-EN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    })
    return formatter.format(date)
}