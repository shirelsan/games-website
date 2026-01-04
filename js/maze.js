// --- Configuration ---
const GAME_WIDTH = 600;
const GAME_HEIGHT = 400;
const PLAYER_SIZE = 30;
const MOVE_STEP = 15; // Speed of player

// --- Game State ---
let gameState = {
    level: 1,
    score: 0,
    difficulty: 'medium',
    isPlaying: false,
    enemyInterval: null,
    playerX: 0,
    playerY: 0
};

// --- Elements ---
const container = document.getElementById('gameContainer');
const player = document.getElementById('player');
const scoreEl = document.getElementById('score');
const levelEl = document.getElementById('levelDisplay');
const diffScreen = document.getElementById('difficultyScreen');
const controls = document.getElementById('gameControls');
const messageOverlay = document.getElementById('messageOverlay');

// --- Level Designs (Static Walls) ---
// Each wall is object {x, y, w, h}
const levels = [
    // Level 1: Simple corridors
    [
        {x: 100, y: 0, w: 20, h: 300},
        {x: 250, y: 100, w: 20, h: 260},
        {x: 400, y: 0, w: 20, h: 250},
        {x: 100, y: 300, w: 150, h: 20}
    ],
    // Level 2: Boxy
    [
        {x: 50, y: 50, w: 500, h: 20},
        {x: 50, y: 330, w: 500, h: 20},
        {x: 50, y: 50, w: 20, h: 100},
        {x: 530, y: 230, w: 20, h: 100},
        {x: 200, y: 150, w: 200, h: 20},
        {x: 200, y: 150, w: 20, h: 100}
    ],
    // Level 3: Hard Maze
    [
        {x: 0, y: 80, w: 450, h: 20},
        {x: 150, y: 160, w: 450, h: 20},
        {x: 0, y: 240, w: 450, h: 20},
        {x: 150, y: 320, w: 450, h: 20},
        {x: 500, y: 0, w: 20, h: 80}
    ]
];

// --- Initialization ---

function startGame(difficulty) {
    gameState.difficulty = difficulty;
    gameState.level = 1;
    gameState.score = 0;
    gameState.isPlaying = true;

    // UI Updates
    scoreEl.innerText = '0';
    levelEl.innerText = '1';
    diffScreen.style.display = 'none';
    controls.style.display = 'block';
    messageOverlay.classList.add('hidden');

    switch (difficulty) {
        case 'easy':
            loadLevel(0);
            break;
        case 'hard':
            loadLevel(1);
            break;
        default:
            loadLevel(2);
    }
    
    // Listen for keys
    document.addEventListener('keydown', handleInput);
    
    // Start Enemy Loop
    startEnemies();
}

function loadLevel(levelIndex) {
    // CRITICAL FIX: Stop any running loops before changing the board
    if (gameState.enemyInterval) clearInterval(gameState.enemyInterval);

    // Clear Board (keep player)
    // Remove all walls, enemies, coins, exits
    const removableElements = document.querySelectorAll('.wall, .enemy, .coin, .exit');
    removableElements.forEach(el => el.remove());

    // 1. Set Player Start
    gameState.playerX = 20;
    gameState.playerY = 20;
    updatePlayerPos();

    // 2. Create Walls
    const currentLevelWalls = levels[levelIndex % levels.length];
    currentLevelWalls.forEach(w => createWall(w));

    // 3. Create Exit (Fixed location usually bottom right, or tricky spot)
    createExit(540, 340);

    // 4. Create Coins (Random spots that aren't walls)
    // Simple fixed coins for simplicity
    // createCoin(150, 50);
    // createCoin(300, 200);
    // createCoin(450, 350);

    // // 4. Create Coins Dynamically
    // // We pass the walls array to check collisions during spawn
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
    console.log('Wall created at', wall);
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
    // We create a temporary "rect" for the player's next position
    // Since we don't move the DOM yet, we can't use player.getBoundingClientRect() for the NEXT pos.
    // However, the requirement is to use getBoundingClientRect. 
    // Trick: We check collision against current walls using logic that mimics it,
    // OR strictly: check if the new position overlaps any wall element's rect.
    
    // Let's get all walls
    const walls = document.querySelectorAll('.wall');
    let collision = false;

    // Simulation of player Rect at next position relative to viewport
    // We need offset relative to container, so simpler math is better here, 
    // but let's stick to the spirit of "Client Rect" collision logic.
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
    
    // Check if next level exists
    if (gameState.level < levels.length) {
        showOverlay("כל הכבוד!", "השלמת את שלב " + gameState.level + ". מוכן לשלב הבא?", true);
    } else {
        saveScore();
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

function saveScore() {
    // Check if user is logged in
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (currentUser) {
        // Add score to highScores array
        if (!currentUser.highScores) currentUser.highScores = [];
        currentUser.highScores.push(gameState.score);
        
        // Update User in LocalStorage (list of users)
        const users = JSON.parse(localStorage.getItem('users')) || [];
        const index = users.findIndex(u => u.username === currentUser.username);
        if (index !== -1) {
            users[index] = currentUser;
            localStorage.setItem('users', JSON.stringify(users));
            localStorage.setItem('currentUser', JSON.stringify(currentUser)); // Update session too
        }
    }
}