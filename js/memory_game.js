// --- Configuration ---
const GAME_NAME = 'Color Memory';
const PEAK_SCORE_THRESHOLD = 6; // Peak if completed more than 6 sequences

// --- Game State ---
let gameState = {
    sequence: [],
    playerSequence: [],
    level: 1,
    isPlaying: false,
    isPlayerTurn: false,
    difficulty: 'medium',
    startTime: null // Store when the game session started
};

// --- Difficulty Settings ---
const difficulties = {
    easy: { 
        startLength: 3, 
        flashSpeed: 800, 
        gapSpeed: 400,
        speedIncrease: 0
    },
    medium: { 
        startLength: 3, 
        flashSpeed: 600, 
        gapSpeed: 300,
        speedIncrease: 20
    },
    hard: { 
        startLength: 4, 
        flashSpeed: 400, 
        gapSpeed: 200,
        speedIncrease: 30
    }
};

// --- Colors ---
const colors = ['red', 'blue', 'green', 'yellow'];

// --- DOM Elements ---
const colorButtons = document.querySelectorAll('.color-button');
const startBtn = document.getElementById('startBtn');
const resetBtn = document.getElementById('resetBtn');
const levelDisplay = document.getElementById('levelDisplay');
const sequenceLengthDisplay = document.getElementById('sequenceLength');
const statusMessage = document.getElementById('statusMessage');
const progressBar = document.getElementById('progressBar');
const difficultyButtons = document.querySelectorAll('.difficulty-btn');

// --- Initialization ---
function init() {
    // Add event listeners
    startBtn.addEventListener('click', startGame);
    resetBtn.addEventListener('click', resetGame);
    
    colorButtons.forEach(btn => {
        btn.addEventListener('click', handleColorClick);
    });

    difficultyButtons.forEach(btn => {
        btn.addEventListener('click', changeDifficulty);
    });

    // Update initial display
    updateDisplay();
}

function startGame() {
    if (gameState.isPlaying) return;
    
    gameState.isPlaying = true;
    gameState.level = 1;
    gameState.sequence = [];
    gameState.startTime = new Date().toLocaleString('he-IL');
    startBtn.disabled = true;
    
    updateStatus('שים לב לרצף...', 'info');
    disableColorButtons();
    
    setTimeout(() => {
        nextRound();
    }, 1000);
}

function nextRound() {
    gameState.playerSequence = [];
    addToSequence();
    updateDisplay();
    
    setTimeout(() => {
        playSequence();
    }, 500);
}

function addToSequence() {
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    gameState.sequence.push(randomColor);
}

async function playSequence() {
    disableColorButtons();
    updateStatus('שים לב לרצף...', 'info');
    
    const settings = difficulties[gameState.difficulty];
    const flashSpeed = Math.max(200, settings.flashSpeed - (gameState.level * settings.speedIncrease));
    const gapSpeed = Math.max(150, settings.gapSpeed - (gameState.level * settings.speedIncrease));

    for (let i = 0; i < gameState.sequence.length; i++) {
        await wait(gapSpeed);
        await flashColor(gameState.sequence[i], flashSpeed);
    }

    await wait(500);
    gameState.isPlayerTurn = true;
    enableColorButtons();
    updateStatus('תורך! חזור על הרצף', 'info');
    updateProgress(0);
}

function flashColor(color, duration) {
    return new Promise(resolve => {
        const button = document.querySelector(`[data-color="${color}"]`);
        button.classList.add('flash');
        
        // Play sound
        playSound(color);
        
        setTimeout(() => {
            button.classList.remove('flash');
            resolve();
        }, duration);
    });
}

function playSound(color) {
    // Frequencies for different colors
    const frequencies = {
        red: 261.63,    // C
        blue: 329.63,   // E
        green: 392.00,  // G
        yellow: 523.25  // C (higher)
    };

    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = frequencies[color];
        oscillator.type = 'sine';

        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
    } catch (e) {
        // Audio not supported or blocked
    }
}

function handleColorClick(e) {
    if (!gameState.isPlayerTurn || !gameState.isPlaying) return;
    
    const color = e.target.dataset.color;
    gameState.playerSequence.push(color);
    
    // Flash the clicked color
    e.target.classList.add('flash');
    playSound(color);
    setTimeout(() => e.target.classList.remove('flash'), 300);
    
    // Check if correct
    const currentIndex = gameState.playerSequence.length - 1;
    
    if (gameState.playerSequence[currentIndex] !== gameState.sequence[currentIndex]) {
        gameOver();
        return;
    }

    // Update progress
    const progress = (gameState.playerSequence.length / gameState.sequence.length) * 100;
    updateProgress(progress);

    // Check if sequence is complete
    if (gameState.playerSequence.length === gameState.sequence.length) {
        roundComplete();
    }
}

function roundComplete() {
    gameState.isPlayerTurn = false;
    disableColorButtons();

    console.log('Updating existing score entry in level:', gameState.level);
    // Save score for every sequence completed
    if (gameState.level > 1){
        saveScore(false); // Update existing entry
    } else {
        saveScore(true); // Create new entry
    }

    gameState.level++;
    
    updateStatus('מעולה! 🎉', 'success');
    updateProgress(100);

    setTimeout(() => {
        nextRound();
    }, 2000);
}

function gameOver() {
    gameState.isPlaying = false;
    gameState.isPlayerTurn = false;
    disableColorButtons();
    startBtn.disabled = false;
    
    updateStatus(`המשחק נגמר! הגעת לשלב ${gameState.level}`, 'error');
    updateProgress(0);
}

function resetGame() {
    gameState.isPlaying = false;
    gameState.isPlayerTurn = false;
    gameState.sequence = [];
    gameState.playerSequence = [];
    gameState.level = 1;
    startBtn.disabled = false;
    
    enableColorButtons();
    updateDisplay();
    updateStatus('לחץ על "התחל משחק" כדי להתחיל!', 'info');
    updateProgress(0);
}

function changeDifficulty(e) {
    if (gameState.isPlaying) return;
    
    difficultyButtons.forEach(btn => btn.classList.remove('active'));
    e.currentTarget.classList.add('active');
    gameState.difficulty = e.currentTarget.dataset.difficulty;
    
    resetGame();
}

// --- View Manipulation Functions ---
function disableColorButtons() {
    colorButtons.forEach(btn => btn.disabled = true);
}

function enableColorButtons() {
    colorButtons.forEach(btn => btn.disabled = false);
}

function updateDisplay() {
    levelDisplay.textContent = gameState.level;
    sequenceLengthDisplay.textContent = gameState.sequence.length || difficulties[gameState.difficulty].startLength;
}

function updateStatus(message, type = 'info') {
    statusMessage.textContent = message;
    statusMessage.className = 'status-message';
    if (type !== 'info') {
        statusMessage.classList.add(type);
    }
}

function updateProgress(percent) {
    progressBar.style.width = `${percent}%`;
}

function saveScore(isNewSession) {
    // Get current user from localStorage
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    
    if (!currentUser) {
        console.log('No user logged in. Cannot save score.');
        return;
    }
    console.log('Saving score for user:', currentUser.username);

    // Ensure gamesHistory structure exists
    if (!currentUser.gamesHistory) {
        currentUser.gamesHistory = {};
    }
    
    // Ensure game array exists
    if (!currentUser.gamesHistory[GAME_NAME]) {
        currentUser.gamesHistory[GAME_NAME] = [];
    }

    // Create score entry
    const scoreEntry = {
        score: gameState.level - 1, // Number of sequences completed
        date: gameState.startTime,
        isPeak: (gameState.level - 1) >= PEAK_SCORE_THRESHOLD
    };

    if (isNewSession) {
        // New game session: Push new entry
        currentUser.gamesHistory[GAME_NAME].push(scoreEntry);
    } else {
        console.log('Updating existing score entry for user:', currentUser.username);
        currentUser.gamesHistory[GAME_NAME].pop();
        currentUser.gamesHistory[GAME_NAME].push(scoreEntry);
    }
    
    // Update user in localStorage (list of users)
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const userIndex = users.findIndex(u => u.username === currentUser.username);
    
    if (userIndex !== -1) {
        users[userIndex] = currentUser;
        localStorage.setItem('users', JSON.stringify(users));
        console.log('Updated users in localStorage', gameState.score);
    }
    
    // Update current user session
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
}

// --- Helper Functions ---
function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// --- Initialize game when page loads ---
document.addEventListener('DOMContentLoaded', () => {
    init();
    
    // Reinitialize Lucide icons
    lucide.createIcons();
});