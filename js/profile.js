document.addEventListener('DOMContentLoaded', () => {
    initUserProfile();
});

function initUserProfile() {
    // 1. תפיסת האלמנטים של העמוד החדש
    const loggedInView = document.getElementById('loggedInView');
    const guestView = document.getElementById('guestView');
    const logoutBtn = document.getElementById('logoutBtn');

    // 2. בדיקה אם יש משתמש מחובר
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));

    if (!currentUser) {
        // --- מצב אורח (לפי הלוגיקה שלך: אם אין משתמש, מציגים מסך מתאים) ---
        if (guestView) guestView.style.display = 'block';
        if (loggedInView) loggedInView.style.display = 'none';
        if (logoutBtn) logoutBtn.style.display = 'none';
        return; // עוצרים כאן
    }

    // 3. אם יש משתמש - מפעילים את לוגיקת הפרופיל
    if (guestView) guestView.style.display = 'none';
    if (loggedInView) loggedInView.style.display = 'block';
    if (logoutBtn) logoutBtn.style.display = 'flex';

    // הפעלת עדכון הנתונים
    updateProfileUI(currentUser);

    // לוגיקת התנתקות
    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('currentUser');
        window.location.href = 'index.html'; // חזרה לדף הבית
    });
}

function updateProfileUI(user) {
    // --- מילוי פרטים בסיסיים ---
    const nameEl = document.getElementById('displayName');
    const usernameEl = document.getElementById('displayUsername');
    const dateEl = document.getElementById('joinDate');
    const avatarEl = document.getElementById('userAvatar');

    nameEl.textContent = user.name || user.username;
    usernameEl.textContent = user.username;
    
    // תאריך (אם אין, נשתמש בהיום)
    const joinDate = user.joinDate || new Date().toLocaleDateString('he-IL');
    dateEl.textContent = joinDate;

    // אווטאר
    if (avatarEl) {
        avatarEl.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}&backgroundColor=c0aede`;
    }

    // --- חישוב נקודות וסטטיסטיקה (הלוגיקה שלך) ---
    const pointsEl = document.getElementById('totalScore');
    const gamesEl = document.getElementById('gamesPlayed');
    const levelEl = document.getElementById('highestLevel');
    const rankEl = document.getElementById('rankBadge');

    let totalPoints = 0;
    let maxLevel = 1;
    let gamesCount = 0;
    let history = user.highScores || []; // מוודאים שיש מערך

    if (Array.isArray(history) && history.length > 0) {
        gamesCount = history.length;
        
        // סיכום נקודות
        totalPoints = history.reduce((sum, game) => {
            // טיפול במקרה שהניקוד נשמר כאובייקט או כמספר
            const scoreVal = typeof game === 'object' ? parseInt(game.score) : parseInt(game);
            
            // בדיקת רמה מקסימלית על הדרך
            if (game.level && parseInt(game.level) > maxLevel) {
                maxLevel = game.level;
            }
            
            return sum + (isNaN(scoreVal) ? 0 : scoreVal);
        }, 0);
    }

    // הצגת הנתונים
    pointsEl.textContent = totalPoints;
    gamesEl.textContent = gamesCount;
    levelEl.textContent = maxLevel;

    // --- חישוב מדליות/דרגות (הלוגיקה שלך) ---
    let medals = '🌱 מתחיל';
    
    if (totalPoints > 1000) {
        medals = '🥇 גיימר זהב';
        rankEl.style.backgroundColor = '#f1c40f'; // צבע זהב
        rankEl.style.color = '#000';
    } 
    else if (totalPoints > 500) {
        medals = '🥈 גיימר כסף';
        rankEl.style.backgroundColor = '#bdc3c7'; // צבע כסף
    } 
    else if (totalPoints > 100) {
        medals = '🥉 גיימר ארד';
        rankEl.style.backgroundColor = '#e67e22'; // צבע ברונזה
    }
    
    rankEl.textContent = medals;

    // --- בניית רשימת ההיסטוריה (תוספת ויזואלית) ---
    const listContainer = document.getElementById('scoresList');
    if (listContainer) {
        if (gamesCount > 0) {
            listContainer.innerHTML = ''; 
            // מציגים מהסוף להתחלה (הכי חדש למעלה)
            history.slice().reverse().forEach(game => {
                const gameName = game.gameName || 'משחק';
                const scoreVal = game.score || game;
                const dateVal = game.date || 'לאחרונה';
                
                const html = `
                    <div class="game-item">
                        <div class="game-info">
                            <div class="game-icon" style="background-color: #ffeaa7">🎮</div>
                            <div>
                                <div class="game-name">${gameName}</div>
                                <div class="game-date">${dateVal}</div>
                            </div>
                        </div>
                        <div class="game-score">${scoreVal} נק'</div>
                    </div>
                `;
                listContainer.innerHTML += html;
            });
        } else {
            listContainer.innerHTML = '<div class="empty-state">עדיין לא שיחקת במשחקים... קדימה לשחק! 🎮</div>';
        }
    }
}