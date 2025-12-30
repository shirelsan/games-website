document.addEventListener('DOMContentLoaded', () => {
    setupTabs();
    setupForms();
});

function showMessage(text, type) {
    const msgBox = document.getElementById('messageBox');
    msgBox.textContent = text;
    
    msgBox.className = 'message-box';
    
    if (type === 'error') {
        msgBox.classList.add('message-error');
    } else if (type === 'success') {
        msgBox.classList.add('message-success');
    }

}

// --- ניהול הטאבים ---
function setupTabs() {
    const buttons = document.querySelectorAll('.tab-btn');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const card = document.getElementById('authCard');
    const msgBox = document.getElementById('messageBox');

    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            msgBox.textContent = ''; 

            buttons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            if (btn.innerText === 'התחברות') {
                loginForm.classList.add('active-form');
                registerForm.classList.remove('active-form');
                card.classList.remove('show-register');
            } else {
                registerForm.classList.add('active-form');
                loginForm.classList.remove('active-form');
                card.classList.add('show-register');
            }
        });
    });
}

// --- ניהול הטפסים ---
function setupForms() {
    document.getElementById('registerForm').addEventListener('submit', handleRegister);
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
}

function handleRegister(event) {
    event.preventDefault();
    
    const name = document.getElementById('regName').value;
    const username = document.getElementById('regUser').value.trim();
    const password = document.getElementById('regPass').value;
    const confirm = document.getElementById('regConfirm').value;

    if (password.length < 6) {
        showMessage("הסיסמה חייבת להכיל לפחות 6 תווים", "error");
        return;
    }

    if (password !== confirm) {
        showMessage("הסיסמאות אינן תואמות!", "error");
        return;
    }

    let users = JSON.parse(localStorage.getItem('users')) || [];

    if (users.some(u => u.username === username)) {
        showMessage("שם המשתמש כבר תפוס", "error");
        return;
    }

    const newUser = { name, username, password, highScores: [] };
    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));

    showMessage("ההרשמה הצליחה! עובר להתחברות...", "success");

    setTimeout(() => {
        document.querySelectorAll('.tab-btn')[0].click();
    }, 1500);
}

function handleLogin(event) {
    event.preventDefault();

    const username = document.getElementById('loginUser').value.trim();
    const password = document.getElementById('loginPass').value;

    let users = JSON.parse(localStorage.getItem('users')) || [];
    const user = users.find(u => u.username === username && u.password === password);

    if (user) {
        localStorage.setItem('currentUser', JSON.stringify(user));
        showMessage("התחברת בהצלחה! מיד מתחילים...", "success");
        
    } else {

        showMessage("שם משתמש או סיסמה שגויים", "error");
    }
}