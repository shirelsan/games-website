// --- Configuration ---
const GAME_WIDTH = 600;
const GAME_HEIGHT = 400;
const PLAYER_SIZE = 20; 
const MOVE_STEP = 15;
const GAME_NAME = 'Maze Escape';
const PEAK_SCORE_THRESHOLD = 150;

// --- Game State ---
let gameState = {
    level: 1,
    score: 0,
    difficulty: 'medium',
    isPlaying: false,
    enemyInterval: null,
    playerX: 0,
    playerY: 0,
    startTime: null,
    hasSavedInThisSession: false,
    sessionLevelCount: 0
};

// --- Elements ---
const container = document.getElementById('gameContainer');
const player = document.getElementById('player');
const scoreEl = document.getElementById('score');
const levelEl = document.getElementById('levelDisplay');
const diffScreen = document.getElementById('difficultyScreen');
const controls = document.getElementById('gameControls');
const messageOverlay = document.getElementById('messageOverlay');

// --- Level Designs  ---
const levels = [
    [
       
        [
            {x: 200, y: 50, w: 20, h: 100},
            {x: 400, y: 250, w: 20, h: 100}, 
            {x: 300, y: 150, w: 20, h: 100}
        ],
      
        [
            {x: 100, y: 100, w: 200, h: 20},
            {x: 300, y: 200, w: 200, h: 20},
            {x: 100, y: 300, w: 200, h: 20}
        ],
      
        [
            {x: 150, y: 150, w: 50, h: 50},
            {x: 400, y: 100, w: 50, h: 50},
            {x: 250, y: 250, w: 50, h: 50}
        ]
    ],
  
    [
        
        [
            {x: 100, y: 0, w: 20, h: 300},   
            {x: 300, y: 100, w: 20, h: 300}, 
            {x: 500, y: 0, w: 20, h: 250}    
        ],
       
        [
            {x: 150, y: 50, w: 20, h: 300},
            {x: 450, y: 50, w: 20, h: 300},
            {x: 150, y: 200, w: 300, h: 20} 
        ],
        
        [
            {x: 0, y: 80, w: 200, h: 20},
            {x: 200, y: 160, w: 200, h: 20},
            {x: 400, y: 240, w: 200, h: 20},
            {x: 300, y: 0, w: 20, h: 100} 
        ]
    ],

    [
        [
            {x: 0, y: 80, w: 530, h: 20},   
            {x: 70, y: 170, w: 530, h: 20}, 
            {x: 0, y: 260, w: 530, h: 20} 
        ],
    
        [
            {x: 110, y: 0, w: 20, h: 310},
            {x: 230, y: 90, w: 20, h: 310},
            {x: 350, y: 0, w: 20, h: 310},
            {x: 470, y: 90, w: 20, h: 310}
        ],

        [
            {x: 50, y: 50, w: 20, h: 300},
            {x: 50, y: 50, w: 400, h: 20},
            {x: 450, y: 50, w: 20, h: 250},
            {x: 150, y: 300, w: 320, h: 20},
            {x: 150, y: 150, w: 20, h: 170}
        ]
    ]
];

// --- Initialization ---

function startGame(difficulty) {
    gameState.difficulty = difficulty;
    gameState.score = 0;
    gameState.isPlaying = true;
    gameState.sessionLevelCount = 0;
    gameState.startTime = new Date().toLocaleString('he-IL'); 
    
    gameState.hasSavedInThisSession = false;

    switch (difficulty) {
        case 'easy': gameState.level = 1; break;
        case 'medium': gameState.level = 2; break;
        case 'hard': gameState.level = 3; break;
        default: gameState.level = 1;
    }

    scoreEl.innerText = '0';
    levelEl.innerText = gameState.level;
    diffScreen.style.display = 'none';
    controls.style.display = 'block';
    messageOverlay.classList.add('hidden');

    loadLevel(gameState.level - 1);
    
    document.removeEventListener('keydown', handleInput);
    document.addEventListener('keydown', handleInput);
    
    startEnemies();
}

function loadLevel(levelIndex) {
    if (gameState.enemyInterval) clearInterval(gameState.enemyInterval);

    const removables = document.querySelectorAll('.wall, .enemy, .coin, .exit');
    removables.forEach(el => el.remove());

    gameState.playerX = 30;
    gameState.playerY = 30;
    updatePlayerPos();

    const levelVariants = levels[levelIndex % levels.length];
    const randomVariantIndex = Math.floor(Math.random() * levelVariants.length);
    const currentLevelWalls = levelVariants[randomVariantIndex];
    currentLevelWalls.forEach(w => createWall(w));

    createExit(540, 340);
    spawnCoins(5, currentLevelWalls);
    setupEnemies();
}

function spawnCoins(count, walls) {
    let placed = 0;
    let attempts = 0;
    const maxAttempts = 100;
    const coinSize = 20;

    while (placed < count && attempts < maxAttempts) {
        attempts++;
        const randX = Math.floor(Math.random() * (GAME_WIDTH - 60)) + 30;
        const randY = Math.floor(Math.random() * (GAME_HEIGHT - 60)) + 30;
        let overlaps = false;
        
        for (let w of walls) {
            if (randX < w.x + w.w && randX + coinSize > w.x &&
                randY < w.y + w.h && randY + coinSize > w.y) {
                overlaps = true;
                break;
            }
        }
       
        if (randX < 80 && randY < 80) overlaps = true;
       
        if (randX > 500 && randY > 300) overlaps = true;

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
    el.dataset.dx = speedX;
    el.dataset.dy = speedY;
    container.appendChild(el);
}

function setupEnemies() {
    let speed = 2;
    if (gameState.difficulty === 'easy') speed = 1;
    if (gameState.difficulty === 'hard') speed = 3;

    if (gameState.level === 1) {
        
        createEnemy(300, 150, 0, speed);
    } else if (gameState.level === 2) {
        createEnemy(250, 200, speed, 0);
        createEnemy(400, 50, 0, speed);
    } else {
       
        createEnemy(150, 120, speed, 0); 
        createEnemy(450, 250, 0, speed);
    }
}

// --- Movement & Logic ---

function handleInput(e) {
    if(["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].indexOf(e.code) > -1) {
        e.preventDefault();
    }

    if (!gameState.isPlaying) return;

    let nextX = gameState.playerX;
    let nextY = gameState.playerY;

    if (e.key === 'ArrowUp') nextY -= MOVE_STEP;
    if (e.key === 'ArrowDown') nextY += MOVE_STEP;
    if (e.key === 'ArrowLeft') nextX -= MOVE_STEP;
    if (e.key === 'ArrowRight') nextX += MOVE_STEP;

    if (nextX < 0 || nextY < 0 || nextX + PLAYER_SIZE > GAME_WIDTH || nextY + PLAYER_SIZE > GAME_HEIGHT) return;

    const walls = document.querySelectorAll('.wall');
    let collision = false;
    const containerRect = container.getBoundingClientRect();
    
    const nextScreenLeft = containerRect.left + nextX;
    const nextScreenTop = containerRect.top + nextY;
    const nextScreenRight = nextScreenLeft + PLAYER_SIZE;
    const nextScreenBottom = nextScreenTop + PLAYER_SIZE;

    walls.forEach(wall => {
        const wallRect = wall.getBoundingClientRect();
        if (nextScreenLeft < wallRect.right && nextScreenRight > wallRect.left &&
            nextScreenTop < wallRect.bottom && nextScreenBottom > wallRect.top) {
            collision = true;
        }
    });

    if (!collision) {
        gameState.playerX = nextX;
        gameState.playerY = nextY;
        updatePlayerPos();
        checkInteractions();
    }
}

function updatePlayerPos() {
    player.style.left = gameState.playerX + 'px';
    player.style.top = gameState.playerY + 'px';
}

function startEnemies() {
    if (gameState.enemyInterval) clearInterval(gameState.enemyInterval);
    
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
            let width = 30;

            if (nextX <= 0 || nextX + width >= GAME_WIDTH) {
                dx = -dx; enemy.dataset.dx = dx; nextX = x + dx;
            }
            if (nextY <= 0 || nextY + width >= GAME_HEIGHT) {
                dy = -dy; enemy.dataset.dy = dy; nextY = y + dy;
            }

            const enemyScreenLeft = containerRect.left + nextX;
            const enemyScreenTop = containerRect.top + nextY;
            const enemyScreenRight = enemyScreenLeft + width;
            const enemyScreenBottom = enemyScreenTop + width;
            
            let wallHit = false;
            walls.forEach(wall => {
                const wRect = wall.getBoundingClientRect();
                if (enemyScreenLeft < wRect.right && enemyScreenRight > wRect.left &&
                    enemyScreenTop < wRect.bottom && enemyScreenBottom > wRect.top) {
                    wallHit = true;
                }
            });

            if (wallHit) {
                dx = -dx; dy = -dy;
                enemy.dataset.dx = dx; enemy.dataset.dy = dy;
            } else {
                enemy.style.left = nextX + 'px';
                enemy.style.top = nextY + 'px';
            }

            const pRect = player.getBoundingClientRect();
            const eRect = enemy.getBoundingClientRect();

            if (pRect.left < eRect.right && pRect.right > eRect.left &&
                pRect.top < eRect.bottom && pRect.bottom > eRect.top) {
                gameOver();
            }
        });

    }, 30);
}

function checkInteractions() {
    const pRect = player.getBoundingClientRect();
    const coins = document.querySelectorAll('.coin');
    coins.forEach(coin => {
        const cRect = coin.getBoundingClientRect();
        if (pRect.left < cRect.right && pRect.right > cRect.left &&
            pRect.top < cRect.bottom && pRect.bottom > cRect.top) {
            gameState.score += 10;
            scoreEl.innerText = gameState.score;
            coin.remove();
        }
    });

    const exit = document.querySelector('.exit');
    if (exit) {
        const eRect = exit.getBoundingClientRect();
        if (pRect.left < eRect.right && pRect.right > eRect.left &&
            pRect.top < eRect.bottom && pRect.bottom > eRect.top) {
            levelComplete();
        }
    }
}

// --- Game Flow ---

function levelComplete() {
    gameState.isPlaying = false;
    clearInterval(gameState.enemyInterval);
    
    gameState.score += 50;
    saveScore(); 
    
    scoreEl.innerText = gameState.score;

    if (gameState.level < levels.length) {
        showOverlay("כל הכבוד!", "השלמת את שלב " + gameState.level + ". מוכן לשלב הבא?", true);
    } else {
        showOverlay("ניצחון!", "סיימת את כל השלבים עם " + gameState.score + " נקודות!", false);
    }
}

function nextLevel() {
    if (gameState.level >= levels.length) {
        location.reload(); 
        return;
    }
    
    gameState.level++;
    levelEl.innerText = gameState.level;
    gameState.isPlaying = true;
    messageOverlay.classList.add('hidden');
    
    loadLevel(gameState.level - 1);
    startEnemies();
}

function gameOver() {
    gameState.isPlaying = false;
    clearInterval(gameState.enemyInterval);
    saveScore();
    showOverlay("נפסלת!", "האויב תפס אותך. צברת " + gameState.score + " נקודות.", false);
}

function restartLevel() {
    gameState.isPlaying = true;
    gameState.score = 0;
    gameState.hasSavedInThisSession = false;
    gameState.startTime = new Date().toLocaleString('he-IL'); 
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
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) return;

    if (!currentUser.gamesHistory) currentUser.gamesHistory = {};
    if (!currentUser.gamesHistory[GAME_NAME]) currentUser.gamesHistory[GAME_NAME] = [];

    const scoreEntry = {
        score: gameState.score,
        date: gameState.startTime,
        isPeak: gameState.score >= PEAK_SCORE_THRESHOLD
    };

    if (!gameState.hasSavedInThisSession) {
        currentUser.gamesHistory[GAME_NAME].push(scoreEntry);
        gameState.hasSavedInThisSession = true; 
    } else {
        currentUser.gamesHistory[GAME_NAME].pop();
        currentUser.gamesHistory[GAME_NAME].push(scoreEntry);
    }

    const users = JSON.parse(localStorage.getItem('users')) || [];
    const userIndex = users.findIndex(u => u.username === currentUser.username);
    
    if (userIndex !== -1) {
        users[userIndex] = currentUser;
        localStorage.setItem('users', JSON.stringify(users));
    }
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
}