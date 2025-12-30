document.addEventListener('DOMContentLoaded', () => {
    setupTabs();
    setupForms();
});

// פונקציית עזר להצגת הודעות
function showMessage(text, type) {
    const msgBox = document.getElementById('messageBox');
    
    // איפוס מלא
    msgBox.textContent = text;
    msgBox.className = 'message-box'; // מוחק עיצובים קודמים
    
    // הוספת הצבע המתאים
    if (type === 'error') {
        msgBox.classList.add('message-error');
    } else if (type === 'success') {
        msgBox.classList.add('message-success');
    }

    // ניקוי ההודעה אחרי 3 שניות
    setTimeout(() => {
        msgBox.textContent = '';
        msgBox.className = 'message-box';
    }, 3000);
}

// --- ניהול הטאבים (הגרסה היציבה) ---
function setupTabs() {
    const buttons = document.querySelectorAll('.tab-btn');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const card = document.getElementById('authCard');
    const msgBox = document.getElementById('messageBox');

    buttons.forEach((btn, index) => {
        btn.addEventListener('click', () => {
            // ניקוי הודעות במעבר
            msgBox.textContent = ''; 
            msgBox.className = 'message-box';

            // איפוס כפתורים
            buttons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // בדיקה לפי מיקום הכפתור (0 = התחברות, 1 = הרשמה)
            if (index === 0) {
                // מצב התחברות
                loginForm.classList.add('active-form');
                registerForm.classList.remove('active-form');
                card.classList.remove('show-register'); // הקו הירוק ימינה
            } else {
                // מצב הרשמה
                registerForm.classList.add('active-form');
                loginForm.classList.remove('active-form');
                card.classList.add('show-register'); // הקו הכתום שמאלה
            }
        });
    });
}

// --- ניהול הטפסים ---
function setupForms() {
    // הרשמה
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }

    // התחברות
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
}

function handleRegister(event) {
    event.preventDefault();
    
    const name = document.getElementById('regName').value;
    const username = document.getElementById('regUser').value.trim();
    const password = document.getElementById('regPass').value;
    const confirm = document.getElementById('regConfirm').value;

    // בדיקות תקינות
    if (password.length < 6) {
        showMessage("הסיסמה חייבת להיות לפחות 6 תווים", "error");
        return;
    }

    if (password !== confirm) {
        showMessage("הסיסמאות אינן תואמות!", "error");
        return;
    }

    // שליפה מהזיכרון
    let users = JSON.parse(localStorage.getItem('users')) || [];

    // בדיקה אם המשתמש קיים
    if (users.some(u => u.username === username)) {
        showMessage("שם המשתמש הזה כבר תפוס", "error");
        return;
    }

    // יצירת משתמש ושמירה
    const newUser = { name, username, password, highScores: [] };
    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));

    showMessage("נרשמת בהצלחה! עובר להתחברות...", "success");

    // מעבר אוטומטי לטאב התחברות אחרי 1.5 שניות
    setTimeout(() => {
        const loginBtn = document.querySelectorAll('.tab-btn')[0];
        if(loginBtn) loginBtn.click();
    }, 1500);
}

function handleLogin(event) {
    event.preventDefault();

    const username = document.getElementById('loginUser').value.trim();
    const password = document.getElementById('loginPass').value;

    let users = JSON.parse(localStorage.getItem('users')) || [];
    
    // חיפוש המשתמש
    const user = users.find(u => u.username === username && u.password === password);

    if (user) {
        localStorage.setItem('currentUser', JSON.stringify(user));
        showMessage("התחברת בהצלחה! ברוך הבא " + user.name, "success");
        // כאן תהיה הפניה לדף הבא בעתיד
    } else {
        showMessage("שם משתמש או סיסמה שגויים", "error");
    }
}