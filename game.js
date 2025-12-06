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

    // --- GAME STATE & CONSTANTS ---
    let gameState = 'start'; // 'start', 'playing', 'over'
    const GRAVITY = 0.5;
    const JUMP_FORCE = -8;
    const PIPE_SPEED = 2;
    const PIPE_WIDTH = 60;
    const PIPE_GAP = 150;
    const PIPE_SPAWN_RATE = 120; // Lower is more frequent

    // --- GAME VARIABLES ---
    let player, pipes, score, bestScore, frameCount;
    let backgroundOffset = 0;
    let cloudOffset = 0;
    let mountainOffset = 0;
    let fartPuffs = [];

    // --- ASSETS ---
    const playerImg = new Image();
    const fartSound = new Audio('assets/fart.mp3');
    const hitSound = new Audio('assets/hit.wav');
    let audioCtx;

    function playCoinSound() {
        if (!audioCtx) {
            try {
                audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            } catch (e) {
                console.error("Web Audio API is not supported in this browser");
                return;
            }
        }

        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(440, audioCtx.currentTime); // A4
        gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime);

        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.1);
    }
    const groundImg = new Image();
    groundImg.src = 'assets/ground.svg';
    
    // --- PLAYER CUSTOMIZATION ---
    const DEFAULT_CHAR_SRC = 'assets/mycharacter.png';

    // Function to load character (fixed default)
    function loadCharacter() {
        playerImg.src = DEFAULT_CHAR_SRC;
    }
    
    // --- PLAYER OBJECT ---
    function createPlayer() {
        return {
            x: 60,
            y: canvas.height / 2,
            width: 38,
            height: 38,
            velocityY: 0,
            angle: 0,
            // For idle bobbing animation
            bobbingAngle: 0,
            bobbingSpeed: 0.05,
            // For squash and stretch effect
            scaleX: 1,
            scaleY: 1,

            update: function() {
                // Gameplay physics
                if (gameState === 'playing') {
                    this.velocityY += GRAVITY;
                    this.y += this.velocityY;

                    // Angle rotation based on velocity
                    this.angle = Math.min(Math.max(this.velocityY / 10, -0.5), 0.9);

                    // Reset squash/stretch effect
                    this.scaleX = Math.max(1, this.scaleX - 0.05);
                    this.scaleY = Math.min(1, this.scaleY + 0.05);

                    // Check for collision with top/bottom boundaries
                    if (this.y + this.height > canvas.height || this.y < 0) {
                        endGame();
                    }
                }
                // Idle animation on start screen
                else if (gameState === 'start') {
                    this.y = (canvas.height / 2) + Math.sin(this.bobbingAngle) * 5;
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
                this.scaleX = 1.3;
                this.scaleY = 0.7;

                // Create fart puff
                fartPuffs.push({
                    x: this.x - 10,
                    y: this.y + this.height / 2,
                    size: 5,
                    opacity: 1,
                    velocityX: -1
                });
            }
        };
    }

    // --- PIPE HANDLING ---
    function createPipe(y, height) {
        return {
            x: canvas.width,
            y: y,
            width: PIPE_WIDTH,
            height: height,
            passed: false
        };
    }

    function generatePipes() {
        const topPipeHeight = Math.random() * (canvas.height - PIPE_GAP - 100) + 50;
        const bottomPipeY = topPipeHeight + PIPE_GAP;
        const bottomPipeHeight = canvas.height - bottomPipeY;

        pipes.push(createPipe(0, topPipeHeight));
        pipes.push(createPipe(bottomPipeY, bottomPipeHeight));
    }
    
    function updateAndDrawPipes() {
        if (gameState !== 'playing') return;

        if (frameCount % PIPE_SPAWN_RATE === 0) {
            generatePipes();
        }

        for (let i = pipes.length - 1; i >= 0; i--) {
            const pipe = pipes[i];
            pipe.x -= PIPE_SPEED;
            
            // Draw pipe with glossy effect
            const gradient = ctx.createLinearGradient(pipe.x, 0, pipe.x + pipe.width, 0);
            gradient.addColorStop(0, '#558000');
            gradient.addColorStop(0.5, '#78a800');
            gradient.addColorStop(1, '#558000');
            ctx.fillStyle = gradient;
            ctx.fillRect(pipe.x, pipe.y, pipe.width, pipe.height);
            ctx.strokeStyle = '#000';
            ctx.strokeRect(pipe.x, pipe.y, pipe.width, pipe.height);


            // Check for collision
            if (
                player.x < pipe.x + pipe.width &&
                player.x + player.width > pipe.x &&
                player.y < pipe.y + pipe.height &&
                player.y + player.height > pipe.y
            ) {
                endGame();
            }

            // Check for passing pipe to score
            if (!pipe.passed && pipe.x < player.x && i % 2 === 0) { // Only score on top pipes
                pipe.passed = true;
                score++;
                playCoinSound();
                scoreDisplay.textContent = score;
            }

            // Remove off-screen pipes
            if (pipe.x + pipe.width < 0) {
                pipes.splice(i, 1);
            }
        }
    }

    // --- GAME FLOW ---
    function init() {
        player = createPlayer();
        pipes = [];
        score = 0;
        frameCount = 0;
        bestScore = localStorage.getItem('bestScore') || 0;
        gameState = 'start';
        backgroundOffset = 0;
        cloudOffset = 0;
        mountainOffset = 0;
        fartPuffs = [];

        // Load character and setup UI
        loadCharacter();
        scoreDisplay.style.display = 'none';
        startMenu.style.display = 'flex';
        gameOverMenu.style.display = 'none';
        scoreDisplay.textContent = '0';

        // Start the game loop
        if (!gameLoop.running) {
             gameLoop.running = true;
             requestAnimationFrame(gameLoop);
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
            bestScoreDisplay.textContent = bestScore;
            gameOverMenu.style.display = 'flex';
        }
    }

    // --- PARALLAX BACKGROUND DRAWING ---
    function drawBackground() {
        // Sky gradient
        const skyGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        skyGradient.addColorStop(0, '#87CEEB'); // Light blue
        skyGradient.addColorStop(1, '#70c5ce'); // Original sky color
        ctx.fillStyle = skyGradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Clouds (slow parallax)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        for (let i = 0; i < 5; i++) {
            const x = (i * 100 + cloudOffset) % (canvas.width + 100);
            ctx.beginPath();
            ctx.arc(x, 100 + i * 20, 30, 0, Math.PI * 2);
            ctx.fill();
        }

        // Mountains (medium parallax)
        ctx.fillStyle = '#8B4513';
        for (let i = 0; i < 3; i++) {
            const x = (i * 150 + mountainOffset) % (canvas.width + 150);
            ctx.beginPath();
            ctx.moveTo(x, canvas.height - 100);
            ctx.lineTo(x + 75, canvas.height - 200);
            ctx.lineTo(x + 150, canvas.height - 100);
            ctx.closePath();
            ctx.fill();
        }

        // Ground (fast parallax)
        ctx.fillStyle = '#228B22';
        ctx.fillRect(0, canvas.height - 50, canvas.width, 50);
        // Draw ground image if loaded
        if (groundImg.complete) {
            for (let x = backgroundOffset % 50; x < canvas.width; x += 50) {
                ctx.drawImage(groundImg, x, canvas.height - 50, 50, 50);
            }
        }
    }

    // --- FART PUFF ANIMATION ---
    function updateFartPuffs() {
        for (let i = fartPuffs.length - 1; i >= 0; i--) {
            const puff = fartPuffs[i];
            puff.x += puff.velocityX;
            puff.size += 0.5;
            puff.opacity -= 0.02;

            if (puff.opacity <= 0) {
                fartPuffs.splice(i, 1);
            }
        }
    }

    function drawFartPuffs() {
        ctx.fillStyle = 'rgba(139, 69, 19, 0.5)'; // Brownish color for fart
        fartPuffs.forEach(puff => {
            ctx.globalAlpha = puff.opacity;
            ctx.beginPath();
            ctx.arc(puff.x, puff.y, puff.size, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.globalAlpha = 1; // Reset alpha
    }

    // --- MAIN GAME LOOP ---
    function gameLoop() {
        // Update parallax offsets
        if (gameState === 'playing') {
            backgroundOffset += 1;
            cloudOffset += 0.5;
            mountainOffset += 0.7;
        }

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw background
        drawBackground();

        // Update and draw fart puffs
        updateFartPuffs();
        drawFartPuffs();

        // Update and draw game objects
        updateAndDrawPipes();
        player.update();
        player.draw();

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
    startButton.addEventListener('click', startGame);

    // Restart game
    restartButton.addEventListener('click', init);

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
});
