// --- Leaderboard Logic ---
function loadLeaderboard() {
    // 1. קבלת כל המשתמשים
    const users = JSON.parse(localStorage.getItem('users')) || [];
    
    if (users.length === 0) return;

    // 2. חישוב ציון כולל לכל משתמש
    const rankedUsers = users.map(user => {
        let totalPoints = 0;

        // בדיקה אם למשתמש יש היסטוריית משחקים (gamesHistory)
        if (user.gamesHistory) {
            // gamesHistory הוא אובייקט (מפתח=שם משחק), עוברים על הערכים שלו
            Object.values(user.gamesHistory).forEach(gameSessions => {
                // gameSessions הוא מערך של משחקים ששוחקו
                if (Array.isArray(gameSessions)) {
                    gameSessions.forEach(session => {
                        // הוספת הניקוד מכל סשן לסך הכולל
                        totalPoints += parseInt(session.score) || 0;
                    });
                }
            });
        } 
        
        else if (user.highScores && Array.isArray(user.highScores)) {
            totalPoints = user.highScores.reduce((sum, s) => sum + (parseInt(s.score) || s), 0);
        }

        return {
            name: user.name || user.username,
            username: user.username,
            score: totalPoints
        };
    });

    // 3. מיון לפי ניקוד יורד (הכי גבוה ראשון)
    rankedUsers.sort((a, b) => b.score - a.score);

    // 4. עדכון ה-DOM (רק ל-3 הראשונים)
    const top3 = rankedUsers.slice(0, 3);
    
    // עדכון המקום הראשון (Gold)
    if (top3[0]) updatePodiumCard('gold', top3[0]);
    // עדכון המקום השני (Silver)
    if (top3[1]) updatePodiumCard('silver', top3[1]);
    // עדכון המקום השלישי (Bronze)
    if (top3[2]) updatePodiumCard('bronze', top3[2]);

    // 5. Display current user rank
    displayUserRank(rankedUsers);
}

function updatePodiumCard(type, user) {
    // איתור הכרטיס לפי המחלקה (gold/silver/bronze)
    const card = document.querySelector(`.podium-card.${type}`);
    if (card) {
        card.querySelector('.podium-name').innerText = user.name;
        card.querySelector('.podium-score').innerText = user.score.toLocaleString() + ' נק\'';
        // עדכון תמונה לפי שם המשתמש
        card.querySelector('img').src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}&backgroundColor=c0aede`;
    }
}

// --- Display Current User Rank ---
function displayUserRank(rankedUsers) {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    
    if (!currentUser) return;

    // Find user's rank
    const userRank = rankedUsers.findIndex(u => u.username === currentUser.username) + 1;
    
    if (userRank === 0) return; // User not found (shouldn't happen)

    // Calculate current user's total points
    let userTotalPoints = 0;
    if (currentUser.gamesHistory) {
        Object.values(currentUser.gamesHistory).forEach(games => {
            if (Array.isArray(games)) {
                games.forEach(game => {
                    userTotalPoints += game.score || 0;
                });
            }
        });
    }

    // Show the user rank section
    const userRankSection = document.getElementById('userRankSection');
    if (userRankSection) {
        userRankSection.style.display = 'block';
        
        // Update rank value
        const rankValue = document.getElementById('userRankValue');
        if (rankValue) {
            rankValue.innerText = '#' + userRank;
        }
        
        // Update score value
        const scoreValue = document.getElementById('userRankScore');
        if (scoreValue) {
            scoreValue.innerText = userTotalPoints.toLocaleString();
        }
    }
}
