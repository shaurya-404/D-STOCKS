document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('dstock_token') || localStorage.getItem('dtube_token');
    if (!token) return window.location.replace("index.html");
    const videoFeed = document.getElementById('video-feed');

    const wRes = await fetch('http://localhost:8000/user/wallet', {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    if (wRes.ok) {
        const wData = await wRes.json();
        document.getElementById('wallet-balance').innerText = `Balance: $${wData.wallet}`;
    }

    try {
        const response = await fetch('http://localhost:8000/portfolio', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error("Failed to fetch");
        const memes = await response.json();
        if (memes.length === 0) {
            videoFeed.innerHTML = "<h2 style='color: white;'>Your portfolio is empty. Go buy some memes!</h2>";
            return;
        }
        videoFeed.innerHTML = "";
        memes.forEach(video => {
            const videoCard = document.createElement('div');
            videoCard.className = 'video-card';
            videoCard.style.cursor = 'pointer';
            const imageUrl = `http://localhost:8000/meme/${video.filename}`;
            const totalVal = video.shares * video.price;
            videoCard.innerHTML = `<img src="${imageUrl}" style="width: 100%; height: 170px; object-fit: cover;"> 
            <div class="video-info"> 
                <h3>${video.title}</h3> 
                <p class="stats" style="color: #10b981; font-weight: bold;">${video.shares} Shares @ $${video.price}</p> 
                <p class="stats">Total Value: $${totalVal}</p>
            </div>`;
            videoCard.onclick = () => {
                window.location.href = `memeplay.html?file=${video.filename}&title=${encodeURIComponent(video.title)}`;
            };
            videoFeed.appendChild(videoCard);
        });
    } catch (error) {
        videoFeed.innerHTML = "Server error!";
    }
});