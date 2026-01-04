document.addEventListener('DOMContentLoaded', () => {
    initUserProfile();
});

function initUserProfile() {
    const avatarBtn = document.querySelector('.user-avatar');
    const popup = document.getElementById('userProfilePopup');
    
    // 1. Check if user is logged in
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));

    // If no user is connected, clicking avatar redirects to login
    if (!currentUser) {
        avatarBtn.addEventListener('click', () => {
            window.location.href = 'login.html';
        });
        return; // Stop here, don't setup the popup
    }

    // 2. If user is connected, setup the popup logic
    
    // Populate data
    updateProfileUI(currentUser);

    // Toggle popup on avatar click
    avatarBtn.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent immediate closing
        popup.classList.toggle('hidden');
    });

    // Close popup when clicking outside
    document.addEventListener('click', (e) => {
        if (!popup.contains(e.target) && !avatarBtn.contains(e.target)) {
            popup.classList.add('hidden');
        }
    });

    // Logout logic
    document.getElementById('logoutBtn').addEventListener('click', () => {
        localStorage.removeItem('currentUser');
        window.location.reload(); // Refresh to update UI state
    });
}

function updateProfileUI(user) {
    // DOM Elements
    const nameEl = document.getElementById('profileName');
    const pointsEl = document.getElementById('profilePoints');
    const medalsEl = document.getElementById('profileMedals');

    // Set Name
    nameEl.textContent = user.name || user.username;

    // Calculate Points (Sum of high scores)
    let totalPoints = 0;
    if (user.highScores && Array.isArray(user.highScores)) {
        totalPoints = user.highScores.reduce((sum, score) => sum + score, 0);
    }
    pointsEl.textContent = totalPoints;

    // Calculate Medals (Logic: 1 medal for every 500 points, or specific tiers)
    let medals = '🌱 מתחיל';
    if (totalPoints > 1000) medals = '🥇 זהב';
    else if (totalPoints > 500) medals = '🥈 כסף';
    else if (totalPoints > 100) medals = '🥉 ארד';
    
    medalsEl.textContent = medals;
}