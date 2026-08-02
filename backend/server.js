const multer = require('multer');
const storage = multer.diskStorage({destination: './meme',filename: (req, file, cb) => {cb(null,file.originalname.replace(/\s+/g, '_'));}});
const upload = multer({storage: storage });
let filepath = "./meme"
const mysql = require('mysql2/promise');

const fs = require('node:fs');
let pool;

async function databaser(){
    pool = await mysql.createConnection({host: 'localhost',user: 'root',password: '1q2w3e4r'});
    await pool.query('CREATE DATABASE IF NOT EXISTS dstock');
    await pool.end()
    pool = await mysql.createPool({host: 'localhost',user: 'root',password: '1q2w3e4r',database: 'dstock'});
    await pool.query(`CREATE TABLE IF NOT EXISTS users (id INT AUTO_INCREMENT PRIMARY KEY,email VARCHAR(255) UNIQUE NOT NULL,password VARCHAR(255) NOT NULL,role VARCHAR(50) DEFAULT 'user',WALLET INT DEFAULT 1000, LCLAIM DATETIME)`);
    await pool.query(`CREATE TABLE IF NOT EXISTS meme (id INT AUTO_INCREMENT PRIMARY KEY,title VARCHAR(255) NOT NULL,filename VARCHAR(255) NOT NULL,views INT DEFAULT 0,likes INT DEFAULT 0,uploaded VARCHAR(255), uploader_id INT,price INT DEFAULT 100 CHECK (PRICE>=0),QTY INT DEFAULT 100)`);
    await pool.query(`CREATE TABLE IF NOT EXISTS meme_likes (id INT AUTO_INCREMENT PRIMARY KEY,user_id INT NOT NULL,filename VARCHAR(255) NOT NULL,UNIQUE KEY unique_like (user_id, filename))`);
    await pool.query(`CREATE TABLE IF NOT EXISTS portfolio (id INT AUTO_INCREMENT PRIMARY KEY,user_id INT NOT NULL,filename VARCHAR(255) NOT NULL,shares INT DEFAULT 0,UNIQUE KEY unique_portfolio (user_id, filename))`);
    await pool.query(`CREATE TABLE IF NOT EXISTS price_history (id INT AUTO_INCREMENT PRIMARY KEY,filename VARCHAR(255) NOT NULL,price INT NOT NULL,created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`);
}
databaser();

// async function download(url, path) {
//   const res = await fetch(url);
//   await res.body.pipeTo(Writable.toWeb(fs.createWriteStream(path)));
// }
// function getFilenameFromUrl(urlString) {
//   try {
//     const url = new URL(urlString);
//     const filename = url.pathname.split('/').pop();
//     return filename;
//   } catch (error) {
//     console.error("Invalid URL provided", error);
//     return null;
//   }
// }

// async function getMemes() {
//   try {
//     const response = await fetch('https://reddit.com', { 
//       headers: { 'User-Agent': 'NodeJS:MyCustomMemeApp:v1.0.0 (by /r/greentext)' } 
//     });
    
//     if (!response.ok) {
//       throw new Error(`HTTP error! status: ${response.status} (${response.statusText})`);
//     }
//     const contentType = response.headers.get("content-type");
//     if (!contentType || !contentType.includes("application/json")) {
//       const textError = await response.text();
//       console.error("Received HTML response instead of JSON:", textError.slice(0, 200));
//       return;
//     }

//     const data = await response.json();
//     const posts = data.data.children;
//     let i=0;
//     for (const post of posts) {
//         i++;
//         if(i==100){
//             break;
//         }
//       const postData = post.data;
      
//       if (!postData.url || !postData.url.match(/\.(jpg|jpeg|png|gif)$/i)) {
//         continue;
//       }

//       console.log('Title:', postData.title);
//       console.log('Likes (Upvotes):', postData.score);
//       console.log('Image URL:', postData.url);

//       const filename = getFilenameFromUrl(postData.url);
//       const localPath = `./meme/${filename}`; 

//       try {
//         await pool.query(
//           `INSERT INTO MEME (title, filename, views, likes, uploader_id) VALUES (?, ?, ?, ?, ?)`,
//           [postData.title, filename, 0, postData.score, "def"]
//         );

//         await download(postData.url, localPath);
//         console.log(`Successfully downloaded: ${filename}`);
//       } catch (err) {
//         console.error(`Failed to process post ${postData.title}:`, err.message);
//       }
//     }
//   } catch (error) {
//     console.error("Error fetching memes:", error);
//   }
// }

// async function getMemes() {
//     const response = await fetch('https://reddit.com', {
//         headers: { 'User-Agent': 'MemeDownloader/1.0' }
//     });
//     const data = await response.json();
//     data.data.children.forEach(post => {
//         const postData = post.data;
//         console.log('Title:', postData.title);
//         console.log('Likes (Upvotes):', postData.score);
//         console.log('Image URL:', postData.url);
//         pool,query(`INSERT INTO MEME (title,filename,views,likes,uploader_id) = (?,?,?,?,?)`,[postData.title,getFilenameFromUrl(postData.url),0,postData.score,"def"]);
//         download(postData.url,"./meme");
//     });
// }

//getMemes();

const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');

const jwt = require('jsonwebtoken');
const query = require('pg/lib/native/query');
const JWT_SECRET = "test";

const app = express();
app.use(cors());
app.use(express.json());
app.use('/meme', express.static('meme'));

app.post('/signup', async (req, res) => {
    try {
        const {e,p} = req.body;
        const hash = await bcrypt.hash(p, 10);
        await pool.query('INSERT INTO users (email, password,lclaim) VALUES (?, ?,?)', [e, hash, new Date()]);
        res.status(201).json({message: "User has been created successfully!"});
    }
    catch (error){
        if (error.code === 'ER_DUP_ENTRY') {
            res.status(400).json({message: "Email already in use!"});
        } else {
            res.status(500).json({message: "Server error."});
        }
    }
});

app.post('/login', async (req, res) => {
    try{
        const {e, p} = req.body;
        const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [e]);
        const user = rows[0];
        
        if (!user) return res.status(401).json({message: "The given email or password is incorrect!"});
        const passchk = await bcrypt.compare(p, user.password);
        if (passchk) {
            const tokenData = {id: user.id,email: user.email,role: user.role};
            const token = jwt.sign(tokenData, JWT_SECRET, {expiresIn: '24h' });
            res.status(200).json({message: "Login successful!",token: token});
        } else {
            res.status(401).json({message: "Invalid email or password."});
        }
    }
    catch (error) {
        res.status(500).json({message: "Server error."});
    }
});

app.post('/resetp', async (req, res) => {
    try{
        const {e,newp} = req.body;
        const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [e]);
        if (rows.length === 0) return res.status(404).json({message: "There is no account like that!"});
        const hash = await bcrypt.hash(newp, 10);
        await pool.query('UPDATE users SET password = ? WHERE email = ?',[hash, e]);
        res.status(200).json({message: "Password has been reseted!"});
    } catch (error) {
        res.status(500).json({message: "Server error."});
    }
});

async function resetprice(v,memeid){
    if (v==-1 && memeid == -1) return 0;
    let newp=0;
    if(v==0){
        newp=-5;
    }
    else if(v==1){
        newp=+5;
    }
    await pool.query(`UPDATE MEME SET PRICE = PRICE + ? WHERE ID = ?`,[newp,memeid]);
    const [row] = await pool.query(`SELECT FILENAME FROM MEME WHERE ID=?`,memeid);
    await pool.query('INSERT INTO price_history (filename, price) VALUES (?, ?)', [row[0].FILENAME, newp]);
    return 0;
}

app.post('/upload', upload.single('image'), async (req, res) => {
    try{
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            if (req.file) fs.unlinkSync(req.file.path); 
            return res.status(401).json({message: "Unauthorized"});
        }
        
        const decoded = jwt.verify(token, JWT_SECRET);
        const {title} = req.body;
        const filename = req.file.filename;
        const sanitizedFileName = req.file.originalname.replace(/\s+/g, '_');
        const [existing] = await pool.query(
            'SELECT * FROM meme WHERE uploader_id = ? AND (title = ? OR filename LIKE ?)', 
            [decoded.id, title, `%-${sanitizedFileName}`]
        );
        if (existing.length > 0) {
            fs.unlinkSync(req.file.path);
            return res.status(400).json({message: "You already uploaded a meme with this title or file name!"});
        }
        await pool.query(
            `INSERT INTO meme (title, filename, views, likes, uploaded, uploader_id) VALUES (?, ?, 0, 0, ?, ?)`,
            [title, filename, decoded.email, decoded.id]
        );
        await pool.query('INSERT INTO price_history (filename, price) VALUES (?, ?)', [filename, 100]);
        await resetprice(-1,-1);
        res.status(200).json({message: "Video uploaded successfully!"});
    } catch (error) {
        res.status(500).json({message: "Server error."});
    }
});

app.get('/meme/mine', async (req, res) => {
    try{
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.status(401).json({message: "Unauthorized"});

        const decoded = jwt.verify(token, JWT_SECRET);
        const [memes] = await pool.query('SELECT * FROM meme WHERE uploader_id = ? ORDER BY id DESC', [decoded.id]);
        await resetprice(-1,-1);
        res.status(200).json(memes);
    } catch (error) {
        res.status(500).json({message: "Server error."});
    }
});

app.delete('/meme/:id', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.status(401).json({message: "Unauthorized"});
        const decoded = jwt.verify(token, JWT_SECRET);
        const [meme] = await pool.query('SELECT * FROM meme WHERE id = ? AND uploader_id = ?', [req.params.id, decoded.id]);
        
        if (meme.length === 0) return res.status(404).json({message: "Meme not found or unauthorized"});
        
        await pool.query('DELETE FROM meme WHERE id = ?', [req.params.id]);
        await pool.query('DELETE FROM meme_likes WHERE filename = ?', [meme[0].filename]);
        await pool.query('DELETE FROM portfolio WHERE filename = ?', [meme[0].filename]);
        await pool.query('DELETE FROM price_history WHERE filename = ?', [meme[0].filename]);
        if (fs.existsSync(`${filepath}/${meme[0].filename}`)) {
            fs.unlinkSync(`${filepath}/${meme[0].filename}`);
        }
        res.status(200).json({message: "Deleted"});
    } catch (error) {
        res.status(500).json({message: "Server error."});
    }
});

app.post('/meme/like', async (req, res) => {
    try{
        const {f,userid} = req.body;
        const [existing] = await pool.query('SELECT * FROM meme_likes WHERE user_id = ? AND filename = ?', [userid, f]);
        if (existing.length > 0) {
            await pool.query('DELETE FROM meme_likes WHERE user_id = ? AND filename = ?', [userid, f]);
            await pool.query('UPDATE meme SET likes = likes - 1 WHERE filename = ?', [f]);
            await resetprice(-1,-1);
            res.status(200).json({message: "Unliked!", isLiked: false });
        } else {
            await pool.query('INSERT INTO meme_likes (user_id, filename) VALUES (?, ?)', [userid, f]);
            await pool.query('UPDATE meme SET likes = likes + 1 WHERE filename = ?', [f]);
            await resetprice(-1,-1);
            res.status(200).json({message: "Liked!", isLiked: true });
        }
    } catch (error) {
        res.status(500).json({message: "Server error."});
    }
});

app.post('/chklike', async (req, res) => {
    try{
        const {userid,fname} = req.body;
        const [existing] = await pool.query('SELECT * FROM meme_likes WHERE user_id = ? AND filename = ?', [userid, fname]);
        res.status(200).json({isLiked: existing.length > 0 });
    } catch (error) {
        res.status(500).json({message: "Server error."});
    }
});

app.get('/trend', async (req, res) => {
    try{
        const [videos] = await pool.query(`SELECT v.* FROM meme v JOIN users u ON v.uploader_id = u.id ORDER BY v.price DESC LIMIT 20`);
        await resetprice(-1,-1);
        res.status(200).json(videos);
    } catch (error) {
        res.status(500).json({message: "Server error."});
    }
});

app.get('/meme/details', async (req, res) => {
    try{
        const {fname} = req.query; 
        const [rows] = await pool.query(`SELECT *, uploaded AS uploader_name FROM meme WHERE filename = ?`, [fname]);
        if (rows.length === 0) return res.status(404).json({message: "MEME not found"});
        await resetprice(-1,-1);
        res.status(200).json(rows[0]);
    } catch (error) {
        res.status(500).json({message: "Server error."});
    }
});

app.post('/meme/view', async (req, res) => {
    try{
        const {f} = req.body;
        await pool.query('UPDATE meme SET views = views + 1 WHERE filename = ?', [f]);
        await resetprice(-1,-1);
        res.status(200).json({message: "View counted!"});
    } catch (error) {
        res.status(500).json({message: "Server error."});
    }
});

app.get('/user/wallet', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.status(401).json({message: "Unauthorized"});
        const decoded = jwt.verify(token, JWT_SECRET);
        const [rows] = await pool.query('SELECT WALLET FROM users WHERE id = ?', [decoded.id]);
        res.status(200).json({wallet: rows[0].WALLET});
    } catch (error) {
        res.status(500).json({message: "Server error."});
    }
});

app.post('/trade/buy', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.status(401).json({message: "Unauthorized"});
        const decoded = jwt.verify(token, JWT_SECRET);
        const {fname, qty} = req.body;
        const [memes] = await pool.query('SELECT id,price,QTY FROM meme WHERE filename = ?', [fname]);
        if (memes.length === 0) return res.status(404).json({message: "Meme not found"});
        const cost = memes[0].price;
        const [users] = await pool.query('SELECT WALLET FROM users WHERE id = ?', [decoded.id]);
        if (users[0].WALLET < cost) return res.status(400).json({message: "Insufficient funds"});
        if(memes[0].QTY <= 0){
            return res.status(400).json({message: "Shares are not availaible."});
        }
        await pool.query('UPDATE users SET WALLET = WALLET - ? WHERE id = ?', [cost, decoded.id]);
        await pool.query('INSERT INTO portfolio (user_id, filename, shares) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE shares = shares + ?', [decoded.id, fname, qty, qty]);
        await resetprice(0,memes[0].id);
        await pool.query(`UPDATE MEME SET QTY=QTY-1 WHERE ID=?`,[memes[0].id]);
        res.status(200).json({message: "Trade successful!"});
    } catch (error) {
        if(error.code === "ER_CHECK_CONSTRAINT_VIOLATED"){
            return res.status(500).json({message: "Stock lost its value to zero. No buyers!"});
        }
        console.log(error);
        res.status(500).json({message: "Server error."});
    }
    
});

app.post('/trade/sell', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.status(401).json({message: "Unauthorized"});
        const decoded = jwt.verify(token, JWT_SECRET);
        const {fname, qty} = req.body;
        const [port] = await pool.query('SELECT shares FROM portfolio WHERE user_id = ? AND filename = ?', [decoded.id, fname]);
        if (port.length === 0 || port[0].shares < qty) return res.status(400).json({message: "Not enough shares"});
        const [memes] = await pool.query('SELECT id,price FROM meme WHERE filename = ?', [fname]);
        const revenue = memes[0].price * qty;
        if (port[0].shares === qty) {
            await pool.query('DELETE FROM portfolio WHERE user_id = ? AND filename = ?', [decoded.id, fname]);
        } else {
            await pool.query('UPDATE portfolio SET shares = shares - ? WHERE user_id = ? AND filename = ?', [qty, decoded.id, fname]);
        }
        
        await pool.query('UPDATE users SET WALLET = WALLET + ? WHERE id = ?', [revenue, decoded.id]);
        await resetprice(1,memes[0].id);
        await pool.query(`UPDATE MEME SET QTY=QTY+1 WHERE ID=?`,[memes[0].id]);
        res.status(200).json({message: "Trade successful!"});
    } catch (error) {
        return res.status(500).json({message: "Server error."});
    }
});

app.get('/portfolio', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.status(401).json({message: "Unauthorized"});
        const decoded = jwt.verify(token, JWT_SECRET);
        const [rows] = await pool.query('SELECT p.shares, m.* FROM portfolio p JOIN meme m ON p.filename = m.filename WHERE p.user_id = ?', [decoded.id]);
        res.status(200).json(rows);
    } catch (error) {
        res.status(500).json({message: "Server error."});
    }
});

app.get('/history', async (req, res) => {
    try {
        const {fname} = req.query;
        const [rows] = await pool.query('SELECT price FROM price_history WHERE filename = ? ORDER BY id ASC', [fname]);
        res.status(200).json(rows);
    } catch (error) {
        res.status(500).json({message: "Server error."});
    }
});

app.get('/leaderboard', async (req, res) => {
    try {
        const [rows] = await pool.query(`SELECT u.email, u.WALLET + IFNULL(SUM(p.shares * m.price), 0) AS net_worth FROM users u LEFT JOIN portfolio p ON u.id = p.user_id LEFT JOIN meme m ON p.filename = m.filename GROUP BY u.id ORDER BY net_worth DESC LIMIT 50`);
        res.status(200).json(rows);
    } catch (error) {
        res.status(500).json({message: "Server error."});
    }
});

app.post('/claim',async (req,res) => {
    try{
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.status(401).json({message: "Unauthorized"});
        const decoded = jwt.verify(token, JWT_SECRET);
        const [rows] = await pool.query(`SELECT LCLAIM FROM USERS WHERE ID = ?;`,decoded.id);
        console.log(rows);
        const now = new Date();
        const pastDate = new Date(rows[0]["LCLAIM"]); 
        const msDifference = now.getTime() - pastDate.getTime();
        console.log(msDifference);
        try{ 
            if (msDifference > 86400000){
                pool.query(`UPDATE USERS SET WALLET = WALLET + 100 where ID=?`,[decoded.id]);
                pool.query(`UPDATE USERS SET LCLAIM = ? WHERE ID = ?`,[now,decoded.id]);
            }
        } catch(error){
            pool.query(`UPDATE USERS SET LCLAIM = ? WHERE ID = ?`,[now,decoded.id]);
        }
    } catch (error) {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.status(401).json({message: "Unauthorized"});
        const decoded = jwt.verify(token, JWT_SECRET);
        const now = new Date();
        pool.query(`UPDATE USERS SET LCLAIM = ? WHERE ID = ?`,[now,decoded.id]);
        res.status(500).json({message: "server error!"});
    }
});

app.listen(8000, () => {
    console.log(`Server running at http://localhost:8000`);
});