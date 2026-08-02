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
        const response = await fetch('http://localhost:8000/meme/mine', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error("Failed to fetch");
        const memes = await response.json();
        
        if (memes.length === 0) {
            videoFeed.innerHTML = "<h2 style='color: white;'>You didn't upload any memes!</h2>";
            return;
        }
        
        videoFeed.innerHTML = "";
        memes.forEach(video => {
            const videoCard = document.createElement('div');
            videoCard.className = 'video-card';
            videoCard.style.cursor = 'pointer';
            const imageUrl = `http://localhost:8000/meme/${video.filename}`;
            const imgId = `thumb-${video.id}`;
            
            videoCard.innerHTML = `
                <img id="${imgId}" src="${imageUrl}" style="width: 100%; height: 170px; object-fit: cover;">
                <div class="video-info" id="info-${video.id}">
                    <h3>${video.title}</h3>
                    <p class="stats" style="color: #10b981; font-weight: bold; font-size: 1.1rem;">Price: $${video.price}</p>
                    <p class="stats">${video.views} Views • ${video.likes} Likes</p>
                </div>
            `;
            
            videoCard.onclick = (e) => {
                if (e.target.tagName !== 'BUTTON') {
                    window.location.href = `memeplay.html?file=${video.filename}&title=${encodeURIComponent(video.title)}`;
                }
            };
            
            videoFeed.appendChild(videoCard);
            
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-btn';
            deleteBtn.innerText = 'Delete';
            deleteBtn.onclick = async (e) => {
                e.stopPropagation();
                if (confirm("confirm deelte?")) {
                    const delRes = await fetch(`http://localhost:8000/meme/${video.id}`, {
                        method: 'DELETE',
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (delRes.ok) {
                        videoCard.remove();
                        if (videoFeed.children.length === 0) {
                            videoFeed.innerHTML = "<h2 style='color: white;'>You have no more images.</h2>";
                        }
                    } else {
                        const errData = await delRes.json();
                        alert("Could not delete: " + errData.message);
                    }
                }
            };
            document.getElementById(`info-${video.id}`).appendChild(deleteBtn);
        });
    } catch (error) {
        videoFeed.innerHTML = "Server error!";
    }
});