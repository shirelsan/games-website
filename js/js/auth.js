document.addEventListener('DOMContentLoaded', () => {
    setupTabs();
    setupForms();
});

// פונקציית עזר להצגת הודעות בתוך הטופס
function showMessage(text, type) {
    const msgBox = document.getElementById('messageBox');
    msgBox.textContent = text;
    
    // איפוס מחלקות קודמות
    msgBox.className = 'message-box';
    
    // הוספת הצבע המתאים (אדום או ירוק)
    if (type === 'error') {
        msgBox.classList.add('message-error');
    } else if (type === 'success') {
        msgBox.classList.add('message-success');
    }

    // ניקוי ההודעה אחרי 3 שניות (אופציונלי)
    setTimeout(() => {
        msgBox.textContent = '';
        msgBox.className = 'message-box';
    }, 4000);
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
            // ניקוי הודעות כשעוברים טאב
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

    // מעבר אוטומטי להתחברות אחרי שנייה וחצי
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
        
        // כאן תהיה הפניה לדף הבית בעתיד
        // setTimeout(() => window.location.href = "game.html", 1000);
    } else {
        // הנה החלק ששאלת עליו! עכשיו זה יציג הודעה אדומה
        showMessage("שם משתמש או סיסמה שגויים", "error");
    }
}