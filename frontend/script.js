function showSection(sectionId) {
    document.getElementById('logsec').style.display = 'none';
    document.getElementById('signsec').style.display = 'none';
    document.getElementById('forgotsec').style.display = 'none';
    document.getElementById('msgbx').style.display = 'none';
    document.getElementById(sectionId).style.display = 'block';
}

const red = '#fc0000'
const green = '#00ff22'

document.getElementById('loginForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const e = document.getElementById('login-email').value;
    const p = document.getElementById('login-password').value;

    try {
        const response = await fetch('http://localhost:8000/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({e,p})
        });
        const data = await response.json();

        if (response.ok) {
            let mtxt = document.getElementById('msgbx');
            mtxt.innerText = "Log in successful!";
            mtxt.style.display = 'block';
            mtxt.style.backgroundColor = green;
            localStorage.setItem('dtube_token', data.token);
            setTimeout(() => {
                window.location.href = "homepage.html"; 
            }, 1000);
        } else {
            let mtxt = document.getElementById('msgbx');
            mtxt.innerText = data.message;
            mtxt.style.display = 'block';
            mtxt.style.backgroundColor = red;
        }
    } catch (err) {
        let mtxt = document.getElementById('msgbx');
        mtxt.innerText = "Server error.";
        mtxt.style.display = 'block';
        mtxt.style.backgroundColor = red;
    }
});

document.getElementById('signupForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const e = document.getElementById('signup-email').value;
    const p = document.getElementById('signup-password').value;

    try {
        const response = await fetch('http://localhost:8000/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({e,p})
        });
        const data = await response.json();

        if (response.ok) {
            let mtxt = document.getElementById('msgbx');
            mtxt.innerText = "Account created! Please log in.";
            mtxt.style.display = 'block';
            mtxt.style.backgroundColor = green;

            document.getElementById('logsec').style.display = 'none';
            document.getElementById('signsec').style.display = 'none';
            document.getElementById('forgotsec').style.display = 'none';
            document.getElementById('msgbx').style.display = 'none';
            document.getElementById('logsec').style.display = 'block';
        } else {
            let mtxt = document.getElementById('msgbx');
            mtxt.innerText = data.message;
            mtxt.style.display = 'block';
            mtxt.style.backgroundColor = red;
        }
    } catch (err) {
        let mtxt = document.getElementById('msgbx');
        mtxt.innerText = "server error!";
        mtxt.style.display = 'block';
        mtxt.style.backgroundColor = red;
    }
});

document.getElementById('forgotForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const e = document.getElementById('forgot-email').value;
    const newp = document.getElementById('forgot-new-password').value;

    try {
        const response = await fetch('http://localhost:8000/resetp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({e,newp})
        });
        const data = await response.json();

        if (response.ok) {
            let mtxt = document.getElementById('msgbx');
            mtxt.innerText = "Password has been resetted, log in!";
            mtxt.style.display = 'block';
            mtxt.style.backgroundColor = green;

            document.getElementById('logsec').style.display = 'none';
            document.getElementById('signsec').style.display = 'none';
            document.getElementById('forgotsec').style.display = 'none';
            document.getElementById('msgbx').style.display = 'none';
            document.getElementById('logsec').style.display = 'block';
        } else {
            let mtxt = document.getElementById('msgbx');
            mtxt.innerText = data.message;
            mtxt.style.display = 'block';
            mtxt.style.backgroundColor = red;
        }
    } catch (err) {
        let mtxt = document.getElementById('msgbx');
        mtxt.innerText = "Server error.";
        mtxt.style.display = 'block';
        mtxt.style.backgroundColor = red;
    }
});