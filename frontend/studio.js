document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('dstock_token') || localStorage.getItem('dtube_token');
    if (!token) return window.location.replace("index.html");

    document.getElementById('logout-btn')?.addEventListener('click', () => {
        localStorage.removeItem('dtube_token');
        localStorage.removeItem('dstock_token');
        window.location.replace('index.html'); 
    });

    document.getElementById('claim-btn')?.addEventListener('click', async () => {
        try {
            const res = await fetch('http://localhost:8000/claim', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            alert(data.message);
        } catch (err) {
            alert("Server error.");
        }
    });

    const videoFeed = document.getElementById('video-feed');
    
    try {
        const response = await fetch('http://localhost:8000/trend');
        if (!response.ok) throw new Error("Failed to fetch");
        const memes = await response.json();
        
        if (memes.length === 0) {
            videoFeed.innerHTML = "<h2 style='color: white;'>No memes trending right now!</h2>";
            return;
        }
        
        videoFeed.innerHTML = "";
        memes.forEach(video => {
            const videoCard = document.createElement('div');
            videoCard.className = 'video-card';
            videoCard.style.cursor = 'pointer';
            const imageUrl = `http://localhost:8000/meme/${video.filename}`;
            
            videoCard.innerHTML = `
                <img src="${imageUrl}">
                <div class="video-info">
                    <h3>${video.title}</h3>
                    <p class="stats" style="color: #10b981; font-weight: bold; font-size: 1.1rem;">Price: $${video.price}</p>
                    <p class="stats">${video.views} Views • ${video.likes} Likes</p>
                </div>
            `;
            
            videoCard.onclick = () => {
                window.location.href = `memeplay.html?file=${video.filename}&title=${encodeURIComponent(video.title)}`;
            };
            
            videoFeed.appendChild(videoCard);
        });
    } catch (error) {
        videoFeed.innerHTML = "Server error!";
    }
});