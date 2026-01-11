document.addEventListener('DOMContentLoaded', () => {
    setupTabs();
    setupForms();
});

// פונקציית עזר להצגת הודעות
function showMessage(text, type) {
    const msgBox = document.getElementById('messageBox');
    
    // איפוס מלא
    msgBox.textContent = text;
    msgBox.className = 'message-box';
    
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
    const newUser = { 
        name, 
        username, 
        password, 
        gamesHistory: {}, // Initialize empty gamesHistory for score tracking
        failedAttempts: 0, // Track failed login attempts
        isLocked: false, // Account lock status
        lockedUntil: null // Time when account will be auto-unlocked (null = no lock)
    };
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
    // Prevents form submission
    event.preventDefault();

    const username = document.getElementById('loginUser').value.trim();
    const password = document.getElementById('loginPass').value;

    let users = JSON.parse(localStorage.getItem('users')) || [];
    
    // חיפוש המשתמש
    const user = users.find(u => u.username === username);

    // Check if account is locked
    if (user && user.isLocked) {
        const now = Date.now();
        
        // Check if lock time has expired (30 minutes = 30 * 60 * 1000 ms)
        if (user.lockedUntil && now > user.lockedUntil) {
            // Auto-unlock account
            user.isLocked = false;
            user.failedAttempts = 0;
            user.lockedUntil = null;
            users[users.indexOf(user)] = user;
            localStorage.setItem('users', JSON.stringify(users));
            showMessage("החשבון נפתח. אנא נסה להתחבר שוב.", "success");
            return;
        } else {
            // Still locked - show time remaining
            const timeLeft = Math.ceil((user.lockedUntil - now) / 1000 / 60); // Minutes
            showMessage(`החשבון חסום. אנא נסה שוב תוך ${timeLeft} דקות.`, "error");
            return;
        }
    }

    // Check credentials
    if (user && user.password === password) {
        // Successful login - reset failed attempts
        user.failedAttempts = 0;
        users[users.indexOf(user)] = user;
        localStorage.setItem('users', JSON.stringify(users));

        setCookie('currentUser', user);
        showMessage("התחברת בהצלחה! ברוך הבא " + user.name, "success");
        
        // --- Navigate to home page after 1.5 seconds ---
        setTimeout(() => {
            window.location.href = "index.html"; 
        }, 1500);

    } else {
        // Failed login attempt
        if (user) {
            // Initialize failedAttempts if not exists
            if (!user.failedAttempts) {
                user.failedAttempts = 0;
            }
            
            // Increment failed attempts
            user.failedAttempts++;
            
            // Lock account if 5 failed attempts reached
            if (user.failedAttempts >= 5) {
                user.isLocked = true;
                user.lockedUntil = Date.now() + (30 * 60 * 1000); // Lock for 30 minutes
                users[users.indexOf(user)] = user;
                localStorage.setItem('users', JSON.stringify(users));
                showMessage("החשבון חסום לתקופה של 30 דקות עקב 5 ניסיונות כניסה כושלים.", "error");
            } else {
                users[users.indexOf(user)] = user;
                localStorage.setItem('users', JSON.stringify(users));
                const attemptsLeft = 5 - user.failedAttempts;
                showMessage(`שם משתמש או סיסמה שגויים. ${attemptsLeft} ניסיונות נותרו`, "error");
            }
        } else {
            showMessage("שם משתמש או סיסמה שגויים", "error");
        }
    }
}