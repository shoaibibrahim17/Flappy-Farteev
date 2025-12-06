// Wait for the DOM to be fully loaded before running the game script
document.addEventListener('DOMContentLoaded', () => {

    // --- DOM ELEMENT SELECTION ---
    const canvas = document.getElementById('game-canvas');
    const ctx = canvas.getContext('2d');

    // Menus and Popups
    const startMenu = document.getElementById('start-menu');
    const gameOverMenu = document.getElementById('game-over-menu');
    const scoreDisplay = document.getElementById('score-display');

    // Buttons
    const startButton = document.getElementById('start-button');
    const restartButton = document.getElementById('restart-button');

    // Score Displays
    const finalScoreDisplay = document.getElementById('final-score');
    const bestScoreDisplay = document.getElementById('best-score');
    const collectedCoinsDisplay = document.getElementById('collected-coins-display'); // New collected coins display
    const roastText = document.getElementById('roast-text');

    // --- GAME STATE & CONSTANTS ---
    let gameState = 'start'; // 'start', 'playing', 'over'
    const GRAVITY = 0.25;
    const JUMP_FORCE = -6;
    const TERMINAL_VELOCITY = 12;
    let pipeSpeed = 2.5;
    const basePipeSpeed = 2;
    const PIPE_WIDTH = 50; // Decreased for thinner pipes
    const PIPE_GAP = 220; // Increased for easier start
    const PIPE_SPAWN_RATE = 200; // Increased for less frequent pipes

    const roastLines = [
        "Are you even trying? Even the library is more fun than this.",
        "That was a weak effort. Go back to your dorm and study.",
        "Your score is lower than your GPA.",
        "I've seen better scores in my student loan debt.",
        "You play like you're still in high school.",
        "Maybe you should've gone to class instead of playing this.",
        "Your skills are as empty as a lecture hall on a Friday afternoon.",
        "I've seen more coordination from a sleep-deprived student during finals week.",
        "You're the reason the professor grades on a curve.",
        "That was more disappointing than the cafeteria food.",
        "Even the campus squirrels could play better than you.",
        "Your score is a solid 'F'.",
        "You're playing like you're on academic probation.",
        "I've seen more strategic thinking in a frat party.",
        "Your performance was as memorable as a 8 AM lecture.",
        "You should probably stick to your major, because this isn't it.",
        "I've seen better teamwork from a group project.",
        "That was a 'needs improvement' performance.",
        "You're the reason they have to post 'Quiet Hours' signs in the dorms.",
        "I've seen more focus from a student on their phone in class.",
        "Your score is like a textbook you never opened.",
        "You're all-nighter material, but not in a good way.",
        "You must have a minor in 'almost'.",
        "That was more tragic than a failed exam.",
        "Your skills are like the Wi-Fi in the lecture hall: weak and unreliable.",
        "I've seen better comebacks in a group chat.",
        "You're about as sharp as a spoon.",
        "I've seen more effort from a student trying to get extra credit.",
        "Your score is like a parking ticket on campus - unwelcome and disappointing.",
        "You're the reason the 'pass/fail' option exists.",
        "Your flight path looks more like a dying swan than a majestic bird.",
        "Did you even try to flap? Or were you just admiring the scenery?",
        "My grandma can flap better than you, and she's a picture on the wall.",
        "That was less of a flight and more of a controlled descent into failure.",
        "I've seen potatoes with better aerial maneuvers.",
        "Your score is so low, it's practically subterranean.",
        "Perhaps flying isn't your forte. Have you considered competitive napping?",
        "You're not just bad; you're consistently, reliably bad. Bravo.",
        "The pipes are stationary, and you still managed to hit them. Impressive.",
        "Even gravity is embarrassed for you.",
        "You've redefined the art of falling with style... into a pipe.",
        "Is that a high score? Because it looks like a typo.",
        "Your performance was a masterclass in how not to fly."
    ];

    // --- GAME VARIABLES ---
    let player, pipes, score, bestScore, frameCount;
    let coins = []; // Array to hold coin objects
    let coinsCollected = 0; // New variable to track collected coins
    let backgroundOffset = 0;
    let cloudOffset = 0;
    let mountainOffset = 0;
    let foregroundOffset = 0; // New foreground parallax offset
    let fartPuffs = [];

    // --- ASSETS ---
    const playerImg = new Image();
    const fartSound = new Audio('assets/fart.mp3');
    const hitSound = new Audio('assets/hit.wav');
    const coinMp3Sound = new Audio('assets/coin.mp3'); // New coin MP3 sound
    let audioCtx;

    function playCoinSound() {
        if (coinMp3Sound) {
            coinMp3Sound.currentTime = 0; // Rewind to start
            coinMp3Sound.volume = 0.8; // Set volume
            coinMp3Sound.play().catch(e => console.log("Coin MP3 play blocked:", e));
        }
    }
    groundImg.src = 'assets/ground.svg';
    
    // --- PLAYER CUSTOMIZATION ---
    const DEFAULT_CHAR_SRC = 'assets/mycharacter.png';

    // Function to load character (fixed default)
    function loadCharacter() {
        playerImg.src = DEFAULT_CHAR_SRC;
    }
    
    // --- PLAYER OBJECT ---
    function createPlayer() {
        const newPlayer = {
            x: 60,
            y: canvas.height / 2,
            width: 70, // Slightly increased size
            height: 70, // Slightly increased size
            velocityY: 0,
            angle: 0,
            // For idle bobbing animation
            bobbingAngle: 0,
            bobbingSpeed: 0.04,
            // For squash and stretch effect
            scaleX: 1,
            scaleY: 1,

            update: function() {
                // Gameplay physics
                if (gameState === 'playing') {
                    this.velocityY += GRAVITY;
                    if (this.velocityY > TERMINAL_VELOCITY) {
                        this.velocityY = TERMINAL_VELOCITY;
                    }
                    this.y += this.velocityY;

                    // Angle rotation based on velocity
                    this.angle = Math.min(Math.max(this.velocityY / 15, -0.6), 1.2);

                    // Dynamic squash/stretch reset
                    this.scaleX = Math.max(1, this.scaleX - 0.04);
                    this.scaleY = Math.min(1, this.scaleY + 0.04);

                    // Check for collision with top/bottom boundaries
                    if (this.y + this.height > canvas.height - 40 || this.y < -10) { // Added buffer
                        endGame();
                    }
                }
                // Idle animation on start screen
                else if (gameState === 'start') {
                    this.y = (canvas.height / 2) + Math.sin(this.bobbingAngle) * 6;
                    this.bobbingAngle += this.bobbingSpeed;
                }
            },

            draw: function() {
                ctx.save();
                ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
                ctx.rotate(this.angle);
                // Apply squash and stretch
                ctx.scale(this.scaleX, this.scaleY);
                ctx.drawImage(playerImg, -this.width / 2, -this.height / 2, this.width, this.height);
                ctx.restore();
            },

            jump: function() {
                this.velocityY = JUMP_FORCE;
                fartSound.currentTime = 0;
                fartSound.play();

                // Apply squash and stretch effect
                this.scaleX = 1.4;
                this.scaleY = 0.6;

                // Create fart puff
                createFartPuff(this.x, this.y + this.height / 2);
            }
        };
        return newPlayer;
    }

    // --- PIPE HANDLING ---
    function createPipe(y, height, isMoving = false, moveRange = 0, moveSpeed = 0) {
        return {
            x: canvas.width,
            y: y,
            width: PIPE_WIDTH,
            height: height,
            passed: false,
            isMoving: isMoving,
            moveDirection: (Math.random() < 0.5) ? 1 : -1, // 1 for down, -1 for up
            moveSpeed: moveSpeed,
            moveRange: moveRange,
            originalY: y
        };
    }

    const COIN_SIZE = 20; // Define coin size
    const coinShapes = ['circle', 'square', 'triangle']; // Possible coin shapes

    function createCoin(x, y) {
        return {
            x: x,
            y: y,
            size: COIN_SIZE,
            collected: false,
            shape: coinShapes[Math.floor(Math.random() * coinShapes.length)] // Randomly assign a shape
        };
    }

    function generatePipes() {
        const minPipeGap = 100; // Minimum gap to ensure playability
        const currentPipeGap = Math.max(PIPE_GAP - Math.floor(score / 5) * 5, minPipeGap); // Decrease gap every 5 points
        
        const topPipeHeight = Math.random() * (canvas.height - currentPipeGap - 120) + 60;
        const bottomPipeY = topPipeHeight + currentPipeGap;
        const bottomPipeHeight = canvas.height - bottomPipeY - 50; // Account for ground

        // Introduce moving pipes after a certain score
        const movingPipeThreshold = 20;
        let isMoving = false;
        let moveRange = 0;
        let moveSpeed = 0;

        if (score > movingPipeThreshold && Math.random() < 0.3) { // 30% chance for moving pipes
            isMoving = true;
            moveRange = 50; // Move up/down by 50 pixels
            moveSpeed = 1.5; // Pixels per frame
        }

        pipes.push(createPipe(0, topPipeHeight, isMoving, moveRange, moveSpeed));
        pipes.push(createPipe(bottomPipeY, bottomPipeHeight, isMoving, moveRange, moveSpeed));

        // Generate coin patterns
        if (Math.random() < 0.8) { // 80% chance to spawn coins
            const patternType = Math.floor(Math.random() * 4); // 4 different patterns

            switch (patternType) {
                case 0: // Coins in pipe gap
                    const numGapCoins = Math.floor(Math.random() * 3) + 2; // 2 to 4 coins
                    for (let j = 0; j < numGapCoins; j++) {
                        const coinX = canvas.width + PIPE_WIDTH / 2 - COIN_SIZE / 2 + (j * COIN_SIZE * 1.5);
                        const coinY = topPipeHeight + currentPipeGap / 2 + (Math.random() * 40 - 20);
                        if (coinY > COIN_SIZE && coinY < canvas.height - COIN_SIZE * 2) {
                            coins.push(createCoin(coinX, coinY));
                        }
                    }
                    break;
                case 1: // Diagonal line of coins
                    const numDiagCoins = Math.floor(Math.random() * 3) + 3; // 3 to 5 coins
                    const startY = Math.random() * (canvas.height - numDiagCoins * COIN_SIZE * 2) + COIN_SIZE;
                    for (let j = 0; j < numDiagCoins; j++) {
                        const coinX = canvas.width + PIPE_WIDTH / 2 - COIN_SIZE / 2 + (j * COIN_SIZE * 1.5);
                        const coinY = startY + j * COIN_SIZE * 1.5;
                        if (coinY > COIN_SIZE && coinY < canvas.height - COIN_SIZE * 2 &&
                            !(coinY > topPipeHeight - COIN_SIZE && coinY < bottomPipeY + COIN_SIZE)) {
                            coins.push(createCoin(coinX, coinY));
                        }
                    }
                    break;
                case 2: // Vertical line of coins
                    const numVertCoins = Math.floor(Math.random() * 3) + 2; // 2 to 4 coins
                    const vertX = canvas.width + PIPE_WIDTH + COIN_SIZE * 2;
                    const vertStartY = Math.random() * (canvas.height - numVertCoins * COIN_SIZE * 2) + COIN_SIZE;
                    for (let j = 0; j < numVertCoins; j++) {
                        const coinY = vertStartY + j * COIN_SIZE * 1.5;
                        if (coinY > COIN_SIZE && coinY < canvas.height - COIN_SIZE * 2 &&
                            !(coinY > topPipeHeight - COIN_SIZE && coinY < bottomPipeY + COIN_SIZE)) {
                            coins.push(createCoin(vertX, coinY));
                        }
                    }
                    break;
                case 3: // Random scattered coins in a safe area
                    const numScatteredCoins = Math.floor(Math.random() * 3) + 2; // 2 to 4 coins
                    for (let j = 0; j < numScatteredCoins; j++) {
                        const coinX = canvas.width + PIPE_WIDTH / 2 - COIN_SIZE / 2 + (Math.random() * 100 - 50);
                        const coinY = Math.random() * (canvas.height - COIN_SIZE * 4) + COIN_SIZE * 2;
                        if (coinY > COIN_SIZE && coinY < canvas.height - COIN_SIZE * 2 &&
                            !(coinY > topPipeHeight - COIN_SIZE && coinY < bottomPipeY + COIN_SIZE)) {
                            coins.push(createCoin(coinX, coinY));
                        }
                    }
                    break;
            }
        }
    }
    
    function updateAndDrawPipes() {
        if (gameState !== 'playing') return;

        pipeSpeed = basePipeSpeed + Math.min(20, Math.floor(score / 5)) * 0.2; // More aggressive speed increase

        const minPipeSpawnRate = 100;
        const currentPipeSpawnRate = Math.max(PIPE_SPAWN_RATE - Math.floor(score / 10) * 5, minPipeSpawnRate); // Pipes spawn more frequently

        if (frameCount % currentPipeSpawnRate === 0) {
            generatePipes();
        }

        for (let i = pipes.length - 1; i >= 0; i--) {
            const pipe = pipes[i];
            pipe.x -= pipeSpeed;
            
            if (pipe.isMoving) {
                pipe.y += pipe.moveDirection * pipe.moveSpeed;

                // Reverse direction if limits are reached
                if (pipe.moveDirection === 1 && pipe.y >= pipe.originalY + pipe.moveRange) {
                    pipe.moveDirection = -1;
                } else if (pipe.moveDirection === -1 && pipe.y <= pipe.originalY - pipe.moveRange) {
                    pipe.moveDirection = 1;
                }
            }
            
            // Draw pipe with enhanced glossy effect and border
            const gradient = ctx.createLinearGradient(pipe.x, 0, pipe.x + pipe.width, 0);
            gradient.addColorStop(0, '#6bab00');
            gradient.addColorStop(0.5, '#8ed400');
            gradient.addColorStop(1, '#6bab00');

            ctx.fillStyle = gradient;
            ctx.fillRect(pipe.x, pipe.y, pipe.width, pipe.height);

            // Add subtle inner shadow for depth
            ctx.save();
            ctx.beginPath();
            ctx.rect(pipe.x, pipe.y, pipe.width, pipe.height);
            ctx.clip();
            ctx.shadowColor = 'rgba(0,0,0,0.4)';
            ctx.shadowBlur = 10;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
            ctx.fillRect(pipe.x - 5, pipe.y - 5, pipe.width + 10, pipe.height + 10); // Draw a slightly larger shadowed rectangle
            ctx.restore();
            
            // Add subtle highlights
            ctx.fillStyle = 'rgba(255, 255, 255, 0.2)'; // Light highlight
            ctx.fillRect(pipe.x + 2, pipe.y + 2, pipe.width - 4, 3); // Top highlight
            ctx.fillRect(pipe.x + 2, pipe.y + pipe.height - 5, pipe.width - 4, 3); // Bottom highlight
            
            ctx.strokeStyle = '#4f8500';
            ctx.lineWidth = 4;
            ctx.strokeRect(pipe.x, pipe.y, pipe.width, pipe.height);


            // Improved circular collision detection
            const playerCircle = {
                x: player.x + player.width / 2,
                y: player.y + player.height / 2,
                radius: player.width / 2 - 2 // small tolerance
            };

            const pipeRect = {
                x: pipe.x,
                y: pipe.y,
                width: pipe.width,
                height: pipe.height
            };

            // Find closest point in pipe rectangle to player circle center
            let closestX = Math.max(pipeRect.x, Math.min(playerCircle.x, pipeRect.x + pipeRect.width));
            let closestY = Math.max(pipeRect.y, Math.min(playerCircle.y, pipeRect.y + pipeRect.height));
            
            // Calculate distance between closest point and circle center
            let distanceX = playerCircle.x - closestX;
            let distanceY = playerCircle.y - closestY;
            let distanceSquared = (distanceX * distanceX) + (distanceY * distanceY);

            if (distanceSquared < (playerCircle.radius * playerCircle.radius)) {
                endGame();
            }


            // Check for passing pipe to score
            if (!pipe.passed && pipe.x + pipe.width < player.x && i % 2 === 0) {
                pipe.passed = true;
                score++;
                playCoinSound();
                scoreDisplay.textContent = score;
                // Add animation class
                scoreDisplay.classList.add('score-pop');
                // Remove class after animation to allow re-triggering
                setTimeout(() => {
                    scoreDisplay.classList.remove('score-pop');
                }, 200); // Duration of the animation
            }

            // Remove off-screen pipes
            if (pipe.x + pipe.width < 0) {
                pipes.splice(i, 1);
                        }
                    }
                }
            
                // --- COIN HANDLING ---
                function updateAndDrawCoins() {
                    if (gameState !== 'playing') return;
            
                    for (let i = coins.length - 1; i >= 0; i--) {
                        const coin = coins[i];
                        coin.x -= pipeSpeed; // Coins move with the pipes
            
                        // Collision detection with player if not collected
                        if (!coin.collected) {
                            const playerRect = {
                                x: player.x,
                                y: player.y,
                                width: player.width,
                                height: player.height
                            };
                            const coinRect = {
                                x: coin.x,
                                y: coin.y,
                                width: coin.size,
                                height: coin.size
                            };
            
                            // Simple AABB collision
                            if (playerRect.x < coinRect.x + coinRect.width &&
                                playerRect.x + playerRect.width > coinRect.x &&
                                playerRect.y < coinRect.y + coinRect.height &&
                                playerRect.y + playerRect.height > coinRect.y) {
                                
                                coin.collected = true;
                                playCoinSound();
                                coinsCollected++;
                                // Optionally, add a visual effect for collection
                            }
                        }
            
                                    // Draw coin if not collected
                                    if (!coin.collected) {
                                        ctx.save();
                                        ctx.fillStyle = '#FFD700'; // Gold color
                                        ctx.strokeStyle = '#DAA520'; // Darker gold border
                                        ctx.lineWidth = 2;
                        
                                        ctx.beginPath();
                                        if (coin.shape === 'circle') {
                                            ctx.arc(coin.x + coin.size / 2, coin.y + coin.size / 2, coin.size / 2, 0, Math.PI * 2);
                                        } else if (coin.shape === 'square') {
                                            ctx.rect(coin.x, coin.y, coin.size, coin.size);
                                        } else if (coin.shape === 'triangle') {
                                            ctx.moveTo(coin.x + coin.size / 2, coin.y);
                                            ctx.lineTo(coin.x + coin.size, coin.y + coin.size);
                                            ctx.lineTo(coin.x, coin.y + coin.size);
                                            ctx.closePath();
                                        }
                                        ctx.fill();
                                        ctx.stroke();
                                        ctx.restore();
                                    }            
                        // Remove off-screen or collected coins
                        if (coin.x + coin.size < 0 || coin.collected) {
                            coins.splice(i, 1);
                        }
                    }
                }
            
            
                // --- GAME FLOW ---
    function init() {
        player = createPlayer();
        pipes = [];
        coins = []; // Reset coins array
        coinsCollected = 0; // Reset collected coins count
        score = 0;
        frameCount = 0;
        bestScore = localStorage.getItem('bestScore') || 0;
        gameState = 'start';
        backgroundOffset = 0;
        cloudOffset = 0;
        mountainOffset = 0;
        foregroundOffset = 0; // Reset foreground parallax offset
        fartPuffs = [];
        pipeSpeed = basePipeSpeed;

        // Load character and setup UI
        loadCharacter();
        scoreDisplay.style.display = 'none';
        startMenu.style.display = 'flex';
        gameOverMenu.style.display = 'none';
        gameOverMenu.classList.remove('game-over-fade-in'); // Remove animation class on init
        scoreDisplay.textContent = '0';

        // Start the game loop
        if (!gameLoop.running) {
             gameLoop.running = true;
             requestAnimationFrame(gameLoop);
        }

        // Continuous Background Music
        const continuousBackgroundMusic = document.getElementById('continuous-background-music');
        if (continuousBackgroundMusic) {
            continuousBackgroundMusic.volume = 0.2; // Low volume for continuous background music
            continuousBackgroundMusic.play().catch(e => console.log("Continuous background music play blocked:", e));
        }
    }

    function startGame() {
        gameState = 'playing';
        startMenu.style.display = 'none';
        scoreDisplay.style.display = 'block';
        player.velocityY = 0; // Reset velocity
        player.y = canvas.height / 2; // Reset position
    }

    function endGame() {
        if (gameState !== 'over') {
            gameState = 'over';
            hitSound.play();
            
            // Update best score
            if (score > bestScore) {
                bestScore = score;
                localStorage.setItem('bestScore', bestScore);
            }

            // Display game over menu
            finalScoreDisplay.textContent = score;
            collectedCoinsDisplay.textContent = coinsCollected; // Display collected coins
            bestScoreDisplay.textContent = bestScore;
            const randomRoast = roastLines[Math.floor(Math.random() * roastLines.length)];
            roastText.textContent = randomRoast;
            gameOverMenu.style.display = 'flex';
            gameOverMenu.classList.add('game-over-fade-in'); // Apply animation
        }
    }

    // --- PARALLAX BACKGROUND DRAWING ---
    function drawBackground() {
        // Sky gradient
        const skyGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        skyGradient.addColorStop(0, '#65c3e8'); 
        skyGradient.addColorStop(1, '#9fdeb3');
        ctx.fillStyle = skyGradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Parallax Mountains (far)
        drawParallaxLayer('#a1c4a3', 0.2, 250, 150, 50);
        // Parallax Mountains (near)
        drawParallaxLayer('#87ab89', 0.5, 200, 100, 30);

        // --- CLOUD DRAWING ---
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)'; // White, semi-transparent clouds
        const cloudSpeed = 0.3; // Slower than mountains
        const baseCloudHeight = canvas.height * 0.2; // Clouds appear higher

        // Draw multiple clouds
        for (let i = 0; i < 5; i++) { // 5 clouds for example
            const cloudX = (cloudOffset * cloudSpeed * (i + 1)) % (canvas.width * 2) - canvas.width; // Vary speed and ensure looping
            const cloudY = baseCloudHeight + Math.sin(cloudX / 100 + i) * 20; // Wavy path
            const cloudWidth = 80 + i * 20;
            const cloudHeight = 30 + i * 10;

            drawCloud(ctx, cloudX, cloudY, cloudWidth, cloudHeight);
        }

        // Helper function for drawing a single cloud (simple shape for now)
        function drawCloud(context, x, y, width, height) {
            context.beginPath();
            context.arc(x, y, width / 4, 0, Math.PI * 2);
            context.arc(x + width * 0.3, y - height * 0.2, width / 3, 0, Math.PI * 2);
            context.arc(x + width * 0.7, y, width / 4, 0, Math.PI * 2);
            context.arc(x + width, y + height * 0.2, width / 5, 0, Math.PI * 2);
            context.fill();
        }

        // Ground
        const groundGradient = ctx.createLinearGradient(0, canvas.height - 50, 0, canvas.height);
        groundGradient.addColorStop(0, '#78ab7a');
        groundGradient.addColorStop(1, '#5d8a5f');
        ctx.fillStyle = groundGradient;
        ctx.fillRect(0, canvas.height - 50, canvas.width, 100);

        // Draw ground image pattern
        if (groundImg.complete) {
            ctx.globalAlpha = 0.5;
            for (let x = (backgroundOffset * 1.5) % 60; x < canvas.width; x += 60) {
                ctx.drawImage(groundImg, x, canvas.height - 55, 60, 60);
            }
            ctx.globalAlpha = 1;
        }

    }
    
    function drawParallaxLayer(color, speed, amplitude, period, yOffset) {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(0, canvas.height);

        const parallaxOffset = mountainOffset * speed;

        for (let x = 0; x <= canvas.width; x++) {
            const y = canvas.height - yOffset - Math.sin((x + parallaxOffset) / period) * amplitude;
            ctx.lineTo(x, y);
        }
        ctx.lineTo(canvas.width, canvas.height);
        ctx.closePath();
        ctx.fill();
    }

    function drawForeground() {
        ctx.fillStyle = 'rgba(100, 100, 100, 0.3)'; // Semi-transparent dark rectangles
        const elementWidth = 30;
        const elementHeight = 5;
        const spacing = 40;

        for (let x = (foregroundOffset * 4) % spacing - spacing; x < canvas.width; x += spacing) {
            ctx.fillRect(x, canvas.height - 30 - Math.random() * 10, elementWidth, elementHeight);
            ctx.fillRect(x + spacing / 2, canvas.height - 20 - Math.random() * 10, elementWidth, elementHeight);
        }
    }


    // --- FART PUFF ANIMATION ---
    function createFartPuff(x, y) {
        for (let i = 0; i < 15; i++) { // More particles
            fartPuffs.push({
                x: x,
                y: y,
                size: Math.random() * 8 + 3,
                opacity: 1,
                velocityX: Math.random() * 2 - 4, // More outward velocity
                velocityY: Math.random() * 4 - 2,
                shrinkRate: 0.03 + Math.random() * 0.03,
                color: `rgba(160, 82, 45, ${0.5 + Math.random() * 0.3})` // Shade variation
            });
        }
    }

    function updateAndDrawFartPuffs() {
        console.log("updateAndDrawFartPuffs(): started. fartPuffs:", fartPuffs, "ctx:", ctx);
        for (let i = fartPuffs.length - 1; i >= 0; i--) {
            const puff = fartPuffs[i];
            puff.x += puff.velocityX;
            puff.y += puff.velocityY;
            puff.size -= puff.shrinkRate * 2;
            puff.opacity -= puff.shrinkRate;

            if (puff.opacity <= 0 || puff.size <= 0.2) {
                fartPuffs.splice(i, 1);
            } else {
                 // Draw the puff
                ctx.fillStyle = puff.color;
                ctx.globalAlpha = puff.opacity;
                ctx.beginPath();
                ctx.arc(puff.x, puff.y, puff.size, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        ctx.globalAlpha = 1; // Reset alpha
    }


    // --- MAIN GAME LOOP ---
    function gameLoop() {
        console.log("gameLoop(): Frame started.");
        console.log("gameLoop(): Canvas:", canvas, "Context:", ctx);
        // Update parallax offsets
        if (gameState === 'playing') {
            backgroundOffset += 1;
            cloudOffset += 0.5;
            mountainOffset += 0.7;
            foregroundOffset += 3; // Faster moving foreground
        }

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw background
        drawBackground();
        drawForeground(); // Draw the new foreground layer

        // Update and draw game objects
        updateAndDrawPipes();
        updateAndDrawCoins(); // Update and draw coins
        player.update();
        player.draw();
        
        // Update and draw particles
        updateAndDrawFartPuffs();

        frameCount++;
        if (gameState !== 'over') {
            requestAnimationFrame(gameLoop);
        } else {
            gameLoop.running = false;
        }
    }
    gameLoop.running = false;


    // --- EVENT LISTENERS ---
    
    // Start game
        startButton.addEventListener('click', () => {
            startGame();
            const continuousBackgroundMusic = document.getElementById('continuous-background-music');
            if (continuousBackgroundMusic && continuousBackgroundMusic.paused) {
                continuousBackgroundMusic.play().catch(e => console.log("Continuous background music play blocked by user interaction:", e));
            }
            // Removed existing backgroundMusic play for fart.mp3
        });

    // Restart game
    restartButton.addEventListener('click', init);

    // Share Screenshot
    const shareScreenshotButton = document.getElementById('share-screenshot-button');
    if (shareScreenshotButton) {
        shareScreenshotButton.addEventListener('click', () => {
            const dataURL = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.download = 'FlappyFart-eev-score.png';
            link.href = dataURL;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        });
    }

    // No character customization needed

    // Player jump controls
    function onJump(event) {
        if (gameState === 'start') {
            startGame();
        }
        if (gameState === 'playing') {
            player.jump();
        }
    }

    canvas.addEventListener('mousedown', onJump);
    window.addEventListener('keydown', (e) => {
        if (e.code === 'Space') {
            onJump();
        }
    });
    canvas.addEventListener('touchstart', (e) => {
        e.preventDefault(); // Prevent screen zoom
        onJump();
    });


    // --- INITIALIZE GAME ---
    init();
    console.log("DOMContentLoaded: Script finished.");
});
