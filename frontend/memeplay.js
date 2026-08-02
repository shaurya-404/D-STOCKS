document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('dstock_token') || localStorage.getItem('dtube_token');
    if (!token) {
        window.location.replace("index.html");
        return;
    }

    const payloadBase64 = token.split('.')[1];
    const Uid = JSON.parse(atob(payloadBase64)).id;
    const urlParams = new URLSearchParams(window.location.search);
    const filename = urlParams.get('file');
    const title = urlParams.get('title');

    if (!filename) {
        document.getElementById('video-title').innerText = "Error: No asset selected.";
        return;
    }

    document.getElementById('video-title').innerText = title || "Untitled Asset";
    const mainPlayer = document.getElementById('main-player');
    mainPlayer.src = `http://localhost:8000/meme/${filename}`;

    async function loadWallet() {
        const res = await fetch('http://localhost:8000/user/wallet', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok) document.getElementById('wallet-balance').innerText = `$${data.wallet}`;
    }
    loadWallet();

    fetch('http://localhost:8000/meme/view', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ f: filename })
    });

    const likeBtn = document.getElementById('like-btn');
    let currentLikes = 0;

    fetch(`http://localhost:8000/meme/details?fname=${filename}`)
        .then(res => res.json())
        .then(data => {
            currentLikes = data.likes || 0;
            document.getElementById('like-count').innerText = `${currentLikes} Likes`;
            document.getElementById('current-price').innerText = `Price: $${data.price}`;

            fetch('http://localhost:8000/chklike', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userid: Uid, fname: filename })
            })
            .then(res => res.json())
            .then(likeData => {
                if (likeData.isLiked) {
                    likeBtn.innerText = "Liked!";
                    likeBtn.style.backgroundColor = "#22c55e";
                }
            });
        });

    fetch(`http://localhost:8000/history?fname=${filename}`)
        .then(res => res.json())
        .then(data => {
            const canvas = document.getElementById('priceChart');
            const ctx = canvas.getContext('2d');
            if (data.length < 2) return;
            const maxP = Math.max(...data.map(d => d.price));
            const minP = Math.min(...data.map(d => d.price));
            const diff = maxP - minP || 1;
            const w = canvas.width = canvas.offsetWidth;
            const h = canvas.height = canvas.offsetHeight;
            ctx.beginPath();
            ctx.strokeStyle = "#10b981";
            ctx.lineWidth = 2;
            data.forEach((pt, i) => {
                const x = (i / (data.length - 1)) * w;
                const y = h - ((pt.price - minP) / diff) * (h - 20) - 10;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            });
            ctx.stroke();
        });

    likeBtn.addEventListener('click', async () => {
        const res = await fetch('http://localhost:8000/meme/like', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ f: filename, userid: Uid })
        });
        const data = await res.json();
        if (res.ok) {
            if (data.isLiked) {
                likeBtn.innerText = "Liked!";
                likeBtn.style.backgroundColor = "#22c55e";
                currentLikes += 1;
            } else {
                likeBtn.innerText = "👍 Like";
                likeBtn.style.backgroundColor = "#3b82f6";
                currentLikes -= 1;
            }
            document.getElementById('like-count').innerText = `${currentLikes} Likes`;
        }
    });

    async function handleTrade(endpoint) {
        const qty = 1;//parseInt(document.getElementById('trade-qty').value);
        const msg = document.getElementById('trade-msg');
        const res = await fetch(`http://localhost:8000/trade/${endpoint}`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ fname: filename, qty: qty })
        });
        const data = await res.json();
        if (res.ok) {
            msg.style.color = "#22c55e";
            msg.innerText = data.message;
            loadWallet();
        } else {
            msg.style.color = "#ef4444";
            msg.innerText = data.message;
        }
        setTimeout(() => msg.innerText = "", 3000);
    }

    document.getElementById('buy-btn').addEventListener('click', () => handleTrade('buy'));
    document.getElementById('sell-btn').addEventListener('click', () => handleTrade('sell'));
});