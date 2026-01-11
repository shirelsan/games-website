document.addEventListener('DOMContentLoaded', () => {
    initUserProfile();
});

function initUserProfile() {
    const loggedInView = document.getElementById('loggedInView');
    const guestView = document.getElementById('guestView');
    const logoutBtn = document.getElementById('logoutBtn');

    const currentUser = getCookie('currentUser');

    if (!currentUser) {
        if (guestView) guestView.style.display = 'block';
        if (loggedInView) loggedInView.style.display = 'none';
        if (logoutBtn) logoutBtn.style.display = 'none';
        return; 
    }

    if (guestView) guestView.style.display = 'none';
    if (loggedInView) loggedInView.style.display = 'block';
    if (logoutBtn) logoutBtn.style.display = 'flex';

    updateProfileUI(currentUser);

    logoutBtn.addEventListener('click', () => {
        deleteCookie('currentUser');
        window.location.href = 'index.html'; 
    });
}

function updateProfileUI(user) {
    // --- Basic Info ---
    const nameEl = document.getElementById('displayName');
    const usernameEl = document.getElementById('displayUsername');
    const avatarEl = document.getElementById('userAvatar');

    nameEl.textContent = user.name || user.username;
    usernameEl.textContent = user.username;

    if (avatarEl) {
        avatarEl.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}&backgroundColor=c0aede`;
    }

    // --- Statistics & Data Processing ---
    const pointsEl = document.getElementById('totalScore');
    const gamesEl = document.getElementById('gamesPlayed');
    const peakCountEl = document.getElementById('peakCount');
    const rankEl = document.getElementById('rankBadge');

    let totalPoints = 0;
    let totalGamesPlayed = 0;
    let totalPeaks = 0;
    let allSessions = [];

    // Check for gamesHistory object
    const gamesHistory = user.gamesHistory || {};

    // 1. Flatten all games into one array and calculate totals
    Object.keys(gamesHistory).forEach(gameName => {
        const gameSessions = gamesHistory[gameName];
        
        if (Array.isArray(gameSessions)) {
            gameSessions.forEach(session => {
                totalPoints += session.score || 0;
                totalGamesPlayed++;
                if (session.isPeak) totalPeaks++;

                // Add to flat list with game name included
                allSessions.push({
                    gameName: gameName,
                    score: session.score,
                    date: session.date,
                    isPeak: session.isPeak
                });
            });
        }
    });

    // Update Stats Bar
    pointsEl.textContent = totalPoints;
    gamesEl.textContent = totalGamesPlayed;
    peakCountEl.textContent = totalPeaks;

    // --- Medals Logic ---
    let medalText = '🌱 מתחיל';
    let medalColor = '#ffeaa7'; // Default pale yellow

    if (totalPoints > 2000) {
        medalText = '👑 אגדת גיימינג';
        medalColor = '#a29bfe'; // Purple
        rankEl.style.color = '#fff';
    } else if (totalPoints > 1000) {
        medalText = '🥇 גיימר זהב';
        medalColor = '#f1c40f'; // Gold
    } else if (totalPoints > 500) {
        medalText = '🥈 גיימר כסף';
        medalColor = '#bdc3c7'; // Silver
    } else if (totalPoints > 100) {
        medalText = '🥉 גיימר ארד';
        medalColor = '#e67e22'; // Bronze
        rankEl.style.color = '#fff';
    }

    rankEl.textContent = medalText;
    rankEl.style.backgroundColor = medalColor;

    // --- Helpers for Sorting ---
    // Helper to parse Hebrew date string "DD.MM.YYYY, HH:mm:ss" to timestamp
    const parseDate = (dateStr) => {
        if (!dateStr || dateStr === 'היסטוריה') return 0;
        try {
            // Split "22.5.2024, 14:30:00"
            const parts = dateStr.split(','); 
            if (parts.length < 2) return 0; // Simple fallback
            const dateParts = parts[0].trim().split('.');
            const timeParts = parts[1].trim().split(':');
            // new Date(year, monthIndex, day, hours, minutes, seconds)
            return new Date(dateParts[2], dateParts[1]-1, dateParts[0], timeParts[0], timeParts[1], timeParts[2] || 0).getTime();
        } catch (e) {
            return 0;
        }
    };

    // --- Render List 1: Full History (Sorted by Date Descending) ---
    const historyListContainer = document.getElementById('historyList');
    
    // Sort by date (Newest first)
    const sortedHistory = [...allSessions].sort((a, b) => parseDate(b.date) - parseDate(a.date));

    renderList(historyListContainer, sortedHistory, false);

    // --- Render List 2: Peak Games (Top 5 sorted by Score) ---
    const peakListContainer = document.getElementById('peakList');
    
    // Filter peaks -> Sort by Score Desc -> Take Top 5
    const peakSessions = allSessions
        .filter(s => s.isPeak)
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);

    renderList(peakListContainer, peakSessions, true);
}

// Helper function to render HTML for a list of games
function renderList(container, data, isPeakList) {
    if (!container) return;
    
    const tbody = container.querySelector('tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '';

    if (data.length === 0) {
        const row = document.createElement('tr');
        row.className = 'empty-row';
        row.innerHTML = '<td colspan="4" class="empty-state">עוד אין נתונים להציג כאן - המשחקים מחכים לך!</td>';
        tbody.appendChild(row);
        return;
    }

    data.forEach(game => {
        const icon = isPeakList ? '🔥' : '🎮';
        const rowClass = isPeakList ? 'peak-row' : '';
        
        const row = document.createElement('tr');
        row.className = rowClass;
        row.innerHTML = `
            <td class="col-icon"><span class="game-icon">${icon}</span></td>
            <td class="col-name">${game.gameName}</td>
            <td class="col-date">${game.date}</td>
            <td class="col-score">${game.score} נק'</td>
        `;
        tbody.appendChild(row);
    });
}