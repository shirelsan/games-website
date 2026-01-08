// Memory Game Logic

class MemoryGame {
    constructor() {
        // Game State
        this.sequence = [];
        this.playerSequence = [];
        this.level = 1;
        this.isPlaying = false;
        this.isPlayerTurn = false;
        this.combo = 0;
        this.highScore = this.loadHighScore();
        this.difficulty = 'medium';
        
        // Difficulty Settings
        this.difficulties = {
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

        // Colors
        this.colors = ['red', 'blue', 'green', 'yellow'];
        
        // DOM Elements
        this.colorButtons = document.querySelectorAll('.color-button');
        this.startBtn = document.getElementById('startBtn');
        this.resetBtn = document.getElementById('resetBtn');
        this.levelDisplay = document.getElementById('levelDisplay');
        this.sequenceLengthDisplay = document.getElementById('sequenceLength');
        this.highScoreDisplay = document.getElementById('highScore');
        this.comboDisplay = document.getElementById('comboDisplay');
        this.statusMessage = document.getElementById('statusMessage');
        this.progressBar = document.getElementById('progressBar');
        this.difficultyButtons = document.querySelectorAll('.difficulty-btn');

        // Initialize
        this.init();
    }

    init() {
        // Add event listeners
        this.startBtn.addEventListener('click', () => this.startGame());
        this.resetBtn.addEventListener('click', () => this.resetGame());
        
        this.colorButtons.forEach(btn => {
            btn.addEventListener('click', (e) => this.handleColorClick(e));
        });

        this.difficultyButtons.forEach(btn => {
            btn.addEventListener('click', (e) => this.changeDifficulty(e));
        });

        // Update initial display
        this.updateDisplay();
        this.updateHighScore();
    }

    startGame() {
        if (this.isPlaying) return;
        
        this.isPlaying = true;
        this.level = 1;
        this.combo = 0;
        this.sequence = [];
        this.startBtn.disabled = true;
        
        this.updateStatus('שים לב לרצף...', 'info');
        this.disableColorButtons();
        
        setTimeout(() => {
            this.nextRound();
        }, 1000);
    }

    nextRound() {
        this.playerSequence = [];
        this.addToSequence();
        this.updateDisplay();
        
        setTimeout(() => {
            this.playSequence();
        }, 500);
    }

    addToSequence() {
        const randomColor = this.colors[Math.floor(Math.random() * this.colors.length)];
        this.sequence.push(randomColor);
    }

    async playSequence() {
        this.disableColorButtons();
        this.updateStatus('שים לב לרצף...', 'info');
        
        const settings = this.difficulties[this.difficulty];
        const flashSpeed = Math.max(200, settings.flashSpeed - (this.level * settings.speedIncrease));
        const gapSpeed = Math.max(150, settings.gapSpeed - (this.level * settings.speedIncrease));

        for (let i = 0; i < this.sequence.length; i++) {
            await this.wait(gapSpeed);
            await this.flashColor(this.sequence[i], flashSpeed);
        }

        await this.wait(500);
        this.isPlayerTurn = true;
        this.enableColorButtons();
        this.updateStatus('תורך! חזור על הרצף', 'info');
        this.updateProgress(0);
    }

    flashColor(color, duration) {
        return new Promise(resolve => {
            const button = document.querySelector(`[data-color="${color}"]`);
            button.classList.add('flash');
            
            // Play sound (optional - you can add sound effects here)
            this.playSound(color);
            
            setTimeout(() => {
                button.classList.remove('flash');
                resolve();
            }, duration);
        });
    }

    playSound(color) {
        // Optional: Add sound effects using Web Audio API
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

    handleColorClick(e) {
        if (!this.isPlayerTurn || !this.isPlaying) return;
        
        const color = e.target.dataset.color;
        this.playerSequence.push(color);
        
        // Flash the clicked color
        e.target.classList.add('flash');
        this.playSound(color);
        setTimeout(() => e.target.classList.remove('flash'), 300);
        
        // Check if correct
        const currentIndex = this.playerSequence.length - 1;
        
        if (this.playerSequence[currentIndex] !== this.sequence[currentIndex]) {
            this.gameOver();
            return;
        }

        // Update progress
        const progress = (this.playerSequence.length / this.sequence.length) * 100;
        this.updateProgress(progress);

        // Check if sequence is complete
        if (this.playerSequence.length === this.sequence.length) {
            this.roundComplete();
        }
    }

    roundComplete() {
        this.isPlayerTurn = false;
        this.disableColorButtons();
        this.combo++;
        this.level++;
        
        this.updateStatus('מעולה! 🎉', 'success');
        this.updateProgress(100);
        
        // Check for new high score
        if (this.level - 1 > this.highScore) {
            this.highScore = this.level - 1;
            this.saveHighScore();
            this.updateHighScore();
            this.updateStatus('שיא חדש! 🏆', 'success');
        }

        setTimeout(() => {
            this.nextRound();
        }, 2000);
    }

    gameOver() {
        this.isPlaying = false;
        this.isPlayerTurn = false;
        this.disableColorButtons();
        this.startBtn.disabled = false;
        
        this.updateStatus(`המשחק נגמר! הגעת לשלב ${this.level}`, 'error');
        this.updateProgress(0);
        
        // Save score to user stats if logged in
        this.saveGameStats();
    }

    resetGame() {
        this.isPlaying = false;
        this.isPlayerTurn = false;
        this.sequence = [];
        this.playerSequence = [];
        this.level = 1;
        this.combo = 0;
        this.startBtn.disabled = false;
        
        this.enableColorButtons();
        this.updateDisplay();
        this.updateStatus('לחץ על "התחל משחק" כדי להתחיל!', 'info');
        this.updateProgress(0);
    }

    changeDifficulty(e) {
        if (this.isPlaying) return;
        
        this.difficultyButtons.forEach(btn => btn.classList.remove('active'));
        e.currentTarget.classList.add('active');
        this.difficulty = e.currentTarget.dataset.difficulty;
        
        this.resetGame();
    }

    disableColorButtons() {
        this.colorButtons.forEach(btn => btn.disabled = true);
    }

    enableColorButtons() {
        this.colorButtons.forEach(btn => btn.disabled = false);
    }

    updateDisplay() {
        this.levelDisplay.textContent = this.level;
        this.sequenceLengthDisplay.textContent = this.sequence.length || this.difficulties[this.difficulty].startLength;
        this.comboDisplay.textContent = this.combo;
    }

    updateStatus(message, type = 'info') {
        this.statusMessage.textContent = message;
        this.statusMessage.className = 'status-message';
        if (type !== 'info') {
            this.statusMessage.classList.add(type);
        }
    }

    updateProgress(percent) {
        this.progressBar.style.width = `${percent}%`;
    }

    updateHighScore() {
        this.highScoreDisplay.textContent = this.highScore;
    }

    loadHighScore() {
        const saved = localStorage.getItem('memoryGameHighScore');
        return saved ? parseInt(saved) : 0;
    }

    saveHighScore() {
        localStorage.setItem('memoryGameHighScore', this.highScore.toString());
    }

    saveGameStats() {
        // Save to user profile if logged in
        try {
            const currentUser = getCookie('currentUser');
            if (currentUser && currentUser.username) {
                const stats = {
                    game: 'memory',
                    level: this.level,
                    date: new Date().toISOString(),
                    difficulty: this.difficulty
                };
                
                // Get existing stats
                const userStatsKey = `gameStats_${currentUser.username}`;
                let allStats = JSON.parse(localStorage.getItem(userStatsKey) || '[]');
                allStats.push(stats);
                
                // Keep only last 50 games
                if (allStats.length > 50) {
                    allStats = allStats.slice(-50);
                }
                
                localStorage.setItem(userStatsKey, JSON.stringify(allStats));
            }
        } catch (e) {
            console.log('Could not save stats:', e);
        }
    }

    wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Initialize game when page loads
document.addEventListener('DOMContentLoaded', () => {
    const game = new MemoryGame();
    
    // Reinitialize Lucide icons
    lucide.createIcons();
});

// Helper function to get cookie (if not already defined)
function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
        try {
            return JSON.parse(decodeURIComponent(parts.pop().split(';').shift()));
        } catch (e) {
            return null;
        }
    }
    return null;
}