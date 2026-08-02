document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('dstock_token') || localStorage.getItem('dtube_token');
    if (!token) return window.location.replace("index.html");
    const container = document.getElementById('lb-container');

    try {
        const response = await fetch('http://localhost:8000/leaderboard');
        if (!response.ok) throw new Error("Failed to fetch");
        const users = await response.json();
        container.innerHTML = "";
        
        users.forEach((user, index) => {
            const row = document.createElement('div');
            row.className = 'lb-row';
            row.innerHTML = `<span>#${index + 1} ${user.email.split('@')[0]}</span> <span>$${user.net_worth}</span>`;
            container.appendChild(row);
        });
    } catch (error) {
        container.innerHTML = "Server error!";
    }
});