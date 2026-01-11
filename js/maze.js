// --- Configuration ---
const GAME_WIDTH = 600;
const GAME_HEIGHT = 400;
const PLAYER_SIZE = 30;
const MOVE_STEP = 15; // Speed of player
const GAME_NAME = 'Maze Escape'; // Identifier for the game history
const PEAK_SCORE_THRESHOLD = 150; // Threshold for a "Peak" game

// --- Game State ---
let gameState = {
    level: 1,
    score: 0,
    difficulty: 'medium',
    isPlaying: false,
    enemyInterval: null,
    playerX: 0,
    playerY: 0,
    startTime: null, // Store when the specific game session started
    sessionLevelCount: 0 // Track how many levels completed in THIS session (independent of difficulty)
};

// --- Elements ---
const container = document.getElementById('gameContainer');
const player = document.getElementById('player');
const scoreEl = document.getElementById('score');
const levelEl = document.getElementById('levelDisplay');
const diffScreen = document.getElementById('difficultyScreen');
const controls = document.getElementById('gameControls');
const messageOverlay = document.getElementById('messageOverlay');

// Disable scrollbars to prevent arrow key scrolling issues
// document.body.style.overflow = 'hidden';

// --- Level Designs (Static Walls) ---
// Each wall is object {x, y, w, h}
// Structure: levels[levelIndex] = [array of 3 maze variants]
// Random variant is selected at the beginning of each level
const levels = [
    // Level 1: Simple corridors - EASY (fewer walls)
    [
        // Variant 1: Open corridors with one vertical wall
        [
            {x: 150, y: 0, w: 20, h: 200},
            {x: 350, y: 150, w: 20, h: 250},
            {x: 200, y: 300, w: 200, h: 20}
        ],
        // Variant 2: Side passages
        [
            {x: 50, y: 100, w: 20, h: 200},
            {x: 300, y: 50, w: 20, h: 250},
            {x: 480, y: 200, w: 20, h: 200}
        ],
        // Variant 3: Simple T-shaped maze
        [
            {x: 200, y: 0, w: 20, h: 150},
            {x: 100, y: 150, w: 300, h: 20},
            {x: 400, y: 150, w: 20, h: 250}
        ]
    ],
    // Level 2: Medium complexity - MEDIUM (more walls, getting crowded)
    [
        // Variant 1: Winding corridors
        [
            {x: 50, y: 50, w: 500, h: 20},
            {x: 50, y: 330, w: 500, h: 20},
            {x: 50, y: 50, w: 20, h: 150},
            {x: 530, y: 200, w: 20, h: 160},
            {x: 150, y: 170, w: 200, h: 20},
            {x: 350, y: 220, w: 150, h: 20}
        ],
        // Variant 2: Divided sections
        [
            {x: 0, y: 0, w: 600, h: 20},
            {x: 0, y: 380, w: 600, h: 20},
            {x: 200, y: 80, w: 20, h: 150},
            {x: 400, y: 150, w: 20, h: 150},
            {x: 100, y: 250, w: 300, h: 20},
            {x: 300, y: 100, w: 20, h: 100}
        ],
        // Variant 3: Spiral-like pattern
        [
            {x: 50, y: 80, w: 150, h: 20},
            {x: 180, y: 80, w: 20, h: 150},
            {x: 50, y: 210, w: 150, h: 20},
            {x: 350, y: 120, w: 200, h: 20},
            {x: 530, y: 120, w: 20, h: 200},
            {x: 250, y: 280, w: 300, h: 20}
        ]
    ],
    // Level 3: Complex maze - HARD (many walls, tight passages)
    [
        // Variant 1: Dense maze with narrow passages
        [
            {x: 0, y: 60, w: 180, h: 20},
            {x: 200, y: 60, w: 200, h: 20},
            {x: 420, y: 60, w: 180, h: 20},
            {x: 0, y: 160, w: 150, h: 20},
            {x: 200, y: 160, w: 180, h: 20},
            {x: 430, y: 160, w: 170, h: 20},
            {x: 60, y: 260, w: 200, h: 20},
            {x: 300, y: 260, w: 300, h: 20},
            {x: 180, y: 80, w: 20, h: 100},
            {x: 420, y: 80, w: 20, h: 100},
            {x: 150, y: 180, w: 20, h: 80},
            {x: 380, y: 200, w: 20, h: 60}
        ],
        // Variant 2: Labyrinth with dead ends
        [
            {x: 80, y: 0, w: 20, h: 120},
            {x: 200, y: 0, w: 20, h: 140},
            {x: 320, y: 0, w: 20, h: 120},
            {x: 440, y: 0, w: 20, h: 140},
            {x: 0, y: 120, w: 100, h: 20},
            {x: 150, y: 140, w: 200, h: 20},
            {x: 380, y: 120, w: 220, h: 20},
            {x: 80, y: 200, w: 150, h: 20},
            {x: 270, y: 200, w: 150, h: 20},
            {x: 480, y: 180, w: 20, h: 100},
            {x: 150, y: 280, w: 450, h: 20},
            {x: 100, y: 300, w: 20, h: 80},
            {x: 350, y: 300, w: 20, h: 80}
        ],
        // Variant 3: Complex interconnected maze
        [
            {x: 60, y: 40, w: 200, h: 20},
            {x: 320, y: 40, w: 220, h: 20},
            {x: 60, y: 140, w: 100, h: 20},
            {x: 220, y: 140, w: 120, h: 20},
            {x: 420, y: 100, w: 120, h: 20},
            {x: 0, y: 240, w: 280, h: 20},
            {x: 350, y: 200, w: 250, h: 20},
            {x: 60, y: 300, w: 200, h: 20},
            {x: 380, y: 300, w: 220, h: 20},
            {x: 200, y: 60, w: 20, h: 90},
            {x: 320, y: 70, w: 20, h: 80},
            {x: 440, y: 120, w: 20, h: 100},
            {x: 100, y: 160, w: 20, h: 100},
            {x: 280, y: 180, w: 20, h: 60}
        ]
    ]
];

// --- Initialization ---

function startGame(difficulty) {
    gameState.difficulty = difficulty;
    gameState.score = 0;
    gameState.isPlaying = true;
    gameState.sessionLevelCount = 0; // Reset session level counter for new game
    
    // Set the start time for this session (Date and Hour)
    gameState.startTime = new Date().toLocaleString('he-IL'); 

    // Set starting level based on difficulty
    switch (difficulty) {
        case 'easy':
            gameState.level = 1;
            break;
        case 'medium':
            gameState.level = 2;
            break;
        case 'hard':
            gameState.level = 3;
            break;
        default:
            gameState.level = 1;
    }

    // UI Updates
    scoreEl.innerText = '0';
    levelEl.innerText = gameState.level;
    diffScreen.style.display = 'none';
    controls.style.display = 'block';
    messageOverlay.classList.add('hidden');

    // Load the appropriate level (convert to 0-based index)
    loadLevel(gameState.level - 1);
    
    // Listen for keys
    document.addEventListener('keydown', handleInput);
    
    // Start Enemy Loop
    startEnemies();
}

function loadLevel(levelIndex) {
    // CRITICAL FIX: Stop any running loops before changing the board
    if (gameState.enemyInterval) clearInterval(gameState.enemyInterval);

    // Clear Board (keep player)
    const removablesElements = document.querySelectorAll('.wall, .enemy, .coin, .exit');
    removablesElements.forEach(el => el.remove());

    // 1. Set Player Start
    gameState.playerX = 20;
    gameState.playerY = 20;
    updatePlayerPos();

    // 2. Create Walls - Select random variant from the level's options
    const levelVariants = levels[levelIndex % levels.length];
    // Randomly pick one of the 3 maze variants for this level
    const randomVariantIndex = Math.floor(Math.random() * levelVariants.length);
    const currentLevelWalls = levelVariants[randomVariantIndex];
    currentLevelWalls.forEach(w => createWall(w));

    // 3. Create Exit
    createExit(540, 340);

    // 4. Create Coins Dynamically
    spawnCoins(5, currentLevelWalls); // Place 5 coins

    // 5. Create Enemies based on difficulty
    setupEnemies();
}

function spawnCoins(count, walls) {
    let placed = 0;
    let attempts = 0;
    const maxAttempts = 100; // Prevent infinite loops
    const coinSize = 20;

    while (placed < count && attempts < maxAttempts) {
        attempts++;

        // Random position (with padding from edges)
        const randX = Math.floor(Math.random() * (GAME_WIDTH - 50)) + 25;
        const randY = Math.floor(Math.random() * (GAME_HEIGHT - 50)) + 25;

        // Check if overlaps with any wall
        let overlaps = false;
        
        // 1. Check against walls
        for (let w of walls) {
            if (
                randX < w.x + w.w &&
                randX + coinSize > w.x &&
                randY < w.y + w.h &&
                randY + coinSize > w.y
            ) {
                overlaps = true;
                break;
            }
        }

        // 2. Check against player start area (top-left corner)
        if (randX < 60 && randY < 60) {
            overlaps = true;
        }

        // 3. Check against Exit area (bottom-right usually)
        if (randX > 500 && randY > 300) {
            overlaps = true;
        }

        // Place if safe
        if (!overlaps) {
            createCoin(randX, randY);
            placed++;
        }
    }

    return placed === count;
}

function createWall(wall) {
    const el = document.createElement('div');
    el.className = 'wall';
    el.style.left = wall.x + 'px';
    el.style.top = wall.y + 'px';
    el.style.width = wall.w + 'px';
    el.style.height = wall.h + 'px';
    container.appendChild(el);
}

function createExit(x, y) {
    const el = document.createElement('div');
    el.className = 'exit';
    el.style.left = x + 'px';
    el.style.top = y + 'px';
    container.appendChild(el);
}

function createCoin(x, y) {
    const el = document.createElement('div');
    el.className = 'coin';
    el.style.left = x + 'px';
    el.style.top = y + 'px';
    container.appendChild(el);
}

function createEnemy(x, y, speedX, speedY) {
    const el = document.createElement('div');
    el.className = 'enemy';
    el.style.left = x + 'px';
    el.style.top = y + 'px';
    // Store movement data on the element itself for simplicity in the loop
    el.dataset.dx = speedX;
    el.dataset.dy = speedY;
    container.appendChild(el);
}

function setupEnemies() {
    let speed = 2; // Medium default
    if (gameState.difficulty === 'easy') speed = 1;
    if (gameState.difficulty === 'hard') speed = 4;

    // Different enemies for different levels
    if (gameState.level === 1) {
        createEnemy(300, 50, 0, speed); // Vertical mover
    } else if (gameState.level === 2) {
        createEnemy(200, 200, speed, 0); // Horizontal
        createEnemy(400, 100, 0, speed); // Vertical
    } else {
        // createEnemy(120, 100, speed, speed); // Diagonal
        // createEnemy(500, 250, -speed, -speed);
        // createEnemy(300, 100, speed, 0);
        createEnemy(200, 200, speed, 0); // Horizontal
        createEnemy(400, 100, 0, speed); // Vertical
    }
}

// --- Movement & Logic ---

function handleInput(e) {
    // Prevent default scrolling for arrow keys
    if(["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].indexOf(e.code) > -1) {
        e.preventDefault();
    }

    if (!gameState.isPlaying) return;

    // Calculate proposed new coordinates
    let nextX = gameState.playerX;
    let nextY = gameState.playerY;

    if (e.key === 'ArrowUp') nextY -= MOVE_STEP;
    if (e.key === 'ArrowDown') nextY += MOVE_STEP;
    if (e.key === 'ArrowLeft') nextX -= MOVE_STEP;
    if (e.key === 'ArrowRight') nextX += MOVE_STEP;

    // 1. Boundary Check
    if (nextX < 0 || nextY < 0 || nextX + PLAYER_SIZE > GAME_WIDTH || nextY + PLAYER_SIZE > GAME_HEIGHT) {
        return; // Hit border
    }

    // 2. Wall Collision Check (The core requirement)
    const walls = document.querySelectorAll('.wall');
    let collision = false;

    // Simulation of player Rect at next position relative to viewport
    const containerRect = container.getBoundingClientRect();
    
    // Next absolute position on screen
    const nextScreenLeft = containerRect.left + nextX;
    const nextScreenTop = containerRect.top + nextY;
    const nextScreenRight = nextScreenLeft + PLAYER_SIZE;
    const nextScreenBottom = nextScreenTop + PLAYER_SIZE;

    walls.forEach(wall => {
        const wallRect = wall.getBoundingClientRect();
        
        // AABB Collision
        if (
            nextScreenLeft < wallRect.right &&
            nextScreenRight > wallRect.left &&
            nextScreenTop < wallRect.bottom &&
            nextScreenBottom > wallRect.top
        ) {
            collision = true;
        }
    });

    if (!collision) {
        gameState.playerX = nextX;
        gameState.playerY = nextY;
        updatePlayerPos();
        checkInteractions(); // Check coins/exit
    }
}

function updatePlayerPos() {
    player.style.left = gameState.playerX + 'px';
    player.style.top = gameState.playerY + 'px';
}

function startEnemies() {
    if (gameState.enemyInterval) clearInterval(gameState.enemyInterval);
    
    // Interval for enemy movement (approx 60fps logic, 16ms)
    gameState.enemyInterval = setInterval(() => {
        if (!gameState.isPlaying) return;
        
        const enemies = document.querySelectorAll('.enemy');
        const walls = document.querySelectorAll('.wall');
        const containerRect = container.getBoundingClientRect();

        enemies.forEach(enemy => {
            let x = parseFloat(enemy.style.left);
            let y = parseFloat(enemy.style.top);
            let dx = parseFloat(enemy.dataset.dx);
            let dy = parseFloat(enemy.dataset.dy);

            let nextX = x + dx;
            let nextY = y + dy;
            let width = 30; // enemy width

            // Boundary Bounce
            if (nextX <= 0 || nextX + width >= GAME_WIDTH) {
                dx = -dx;
                enemy.dataset.dx = dx;
                nextX = x + dx; // Re-calc immediately
            }
            if (nextY <= 0 || nextY + width >= GAME_HEIGHT) {
                dy = -dy;
                enemy.dataset.dy = dy;
                nextY = y + dy;
            }

            // Wall Bounce for Enemy (Simple check)
            // Using getBoundingClientRect logic again
            const enemyScreenLeft = containerRect.left + nextX;
            const enemyScreenTop = containerRect.top + nextY;
            const enemyScreenRight = enemyScreenLeft + width;
            const enemyScreenBottom = enemyScreenTop + width;
            
            let wallHit = false;
            walls.forEach(wall => {
                const wRect = wall.getBoundingClientRect();
                if (
                    enemyScreenLeft < wRect.right &&
                    enemyScreenRight > wRect.left &&
                    enemyScreenTop < wRect.bottom &&
                    enemyScreenBottom > wRect.top
                ) {
                    wallHit = true;
                }
            });

            if (wallHit) {
                // Reverse direction
                dx = -dx;
                dy = -dy;
                enemy.dataset.dx = dx;
                enemy.dataset.dy = dy;
            } else {
                // Apply Move
                enemy.style.left = nextX + 'px';
                enemy.style.top = nextY + 'px';
            }

            // Check Collision with Player
            // We compare DOM rects directly here as requested
            const pRect = player.getBoundingClientRect();
            const eRect = enemy.getBoundingClientRect();

            if (
                pRect.left < eRect.right &&
                pRect.right > eRect.left &&
                pRect.top < eRect.bottom &&
                pRect.bottom > eRect.top
            ) {
                gameOver();
            }
        });

    }, 30);
}

function checkInteractions() {
    const pRect = player.getBoundingClientRect();
    
    // Check Coins
    const coins = document.querySelectorAll('.coin');
    coins.forEach(coin => {
        const cRect = coin.getBoundingClientRect();
        if (
            pRect.left < cRect.right &&
            pRect.right > cRect.left &&
            pRect.top < cRect.bottom &&
            pRect.bottom > cRect.top
        ) {
            // Collected
            gameState.score += 10;
            scoreEl.innerText = gameState.score;
            coin.remove();
        }
    });

    // Check Exit
    const exit = document.querySelector('.exit');
    if (exit) {
        const eRect = exit.getBoundingClientRect();
        if (
            pRect.left < eRect.right &&
            pRect.right > eRect.left &&
            pRect.top < eRect.bottom &&
            pRect.bottom > eRect.top
        ) {
            levelComplete();
        }
    }
}

// --- Game Flow ---

function levelComplete() {
    gameState.isPlaying = false;
    clearInterval(gameState.enemyInterval);
    
    // Reward points
    gameState.score += 50;
    
    // Increment session level counter BEFORE saving
    gameState.sessionLevelCount++;
    
    // Save score immediately upon level completion
    // If it's the first level completed in this session, push new entry
    // If it's subsequent levels, update the last entry by popping and pushing
    if (gameState.sessionLevelCount > 1){
        saveScore(false); // Update existing entry
    } else {
        saveScore(true); // Create new entry
    }
    
    scoreEl.innerText = gameState.score;

    // Check if next level exists
    if (gameState.level < levels.length) {
        showOverlay("כל הכבוד!", "השלמת את שלב " + gameState.level + ". מוכן לשלב הבא?", true);
    } else {
        showOverlay("ניצחון!", "סיימת את כל השלבים עם " + gameState.score + " נקודות!", false);
    }
    
}

function nextLevel() {
    if (gameState.level >= levels.length) {
        // Game Finished completely, reload to menu
        location.reload(); 
        return;
    }
    
    gameState.level++;
    levelEl.innerText = gameState.level;
    gameState.isPlaying = true;
    messageOverlay.classList.add('hidden');
    
    // Load level first to reset positions
    loadLevel(gameState.level - 1);
    
    // Then start enemies
    startEnemies();
}

function gameOver() {
    gameState.isPlaying = false;
    clearInterval(gameState.enemyInterval);
    showOverlay("נפסלת!", "האויב תפס אותך. צברת " + gameState.score + " נקודות.", false);
}

function restartLevel() {
    // Reload current level
    gameState.isPlaying = true;
    gameState.score = 0; // Reset score or keep? usually reset on death in simple games
    scoreEl.innerText = 0;
    messageOverlay.classList.add('hidden');
    loadLevel(gameState.level - 1);
    startEnemies();
}

function quitGame() {
    location.reload();
}

function showOverlay(title, text, isNextLevel) {
    document.getElementById('overlayTitle').innerText = title;
    document.getElementById('overlayText').innerText = text;
    const btn = document.getElementById('overlayBtn');
    
    if (isNextLevel) {
        btn.innerText = "המשך לשלב הבא";
        btn.onclick = nextLevel;
    } else {
        btn.innerText = "חזור לתפריט";
        btn.onclick = quitGame;
    }
    
    messageOverlay.classList.remove('hidden');
}

function saveScore(isNewSession) {
    // Check if user is logged in
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    console.log('Saving score for user:', currentUser);
    
    if (!currentUser) {
        console.log('No user logged in. Cannot save score.');
        return;
    }

    // Ensure gamesHistory structure exists
    // if (!currentUser.gamesHistory) {
    //     currentUser.gamesHistory = {};
    //     console.log('Initialized gamesHistory for user.');
    // }
    
    // Ensure specific game array exists
    if (!currentUser.gamesHistory[GAME_NAME]) {
        currentUser.gamesHistory[GAME_NAME] = [];
        console.log('Initialized gamesHistory array for', GAME_NAME);
    }

    // Create the score object
    const scoreEntry = {
        score: gameState.score,
        date: gameState.startTime, // Use the session start time
        isPeak: gameState.score >= PEAK_SCORE_THRESHOLD
    };

    if (isNewSession) {
        // New game session: Push new entry
        currentUser.gamesHistory[GAME_NAME].push(scoreEntry);
        console.log('Pushed new score entry for user:', currentUser.username);
    } else {
        currentUser.gamesHistory[GAME_NAME].pop();
        currentUser.gamesHistory[GAME_NAME].push(scoreEntry);
        console.log('Popped and Pushed last score entry for user:', currentUser.username);
    }

    // Update User in LocalStorage (list of users)
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const userIndex = users.findIndex(u => u.username === currentUser.username);
    
    if (userIndex !== -1) {
        users[userIndex] = currentUser;
        localStorage.setItem('users', JSON.stringify(users));
        console.log('Updated users in localStorage', gameState.score);
    }
    
    // Always update currentUser session
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    console.log('Updated currentUser in localStorage');
}