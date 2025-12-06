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
    const roastText = document.getElementById('roast-text');

    // --- GAME STATE & CONSTANTS ---
    let gameState = 'start'; // 'start', 'playing', 'over'
    const GRAVITY = 0.25;
    const JUMP_FORCE = -9;
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
        "You're the reason the 'pass/fail' option exists."
    ];

    // --- GAME VARIABLES ---
    let player, pipes, score, bestScore, frameCount;
    let backgroundOffset = 0;
    let cloudOffset = 0;
    let mountainOffset = 0;
    let foregroundOffset = 0; // New foreground parallax offset
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

        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(600, audioCtx.currentTime);
        gainNode.gain.setValueAtTime(0.15, audioCtx.currentTime);

        oscillator.frequency.exponentialRampToValueAtTime(900, audioCtx.currentTime + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);


        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.15);
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
        const minPipeGap = 100; // Minimum gap to ensure playability
        const currentPipeGap = Math.max(PIPE_GAP - Math.floor(score / 5) * 5, minPipeGap); // Decrease gap every 5 points
        
        const topPipeHeight = Math.random() * (canvas.height - currentPipeGap - 120) + 60;
        const bottomPipeY = topPipeHeight + currentPipeGap;
        const bottomPipeHeight = canvas.height - bottomPipeY - 50; // Account for ground

        pipes.push(createPipe(0, topPipeHeight));
        pipes.push(createPipe(bottomPipeY, bottomPipeHeight));
    }
    
    function updateAndDrawPipes() {
        if (gameState !== 'playing') return;

        pipeSpeed = basePipeSpeed + Math.min(10, Math.floor(score / 10)) * 0.1;

        if (frameCount % PIPE_SPAWN_RATE === 0) {
            generatePipes();
        }

        for (let i = pipes.length - 1; i >= 0; i--) {
            const pipe = pipes[i];
            pipe.x -= pipeSpeed;
            
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
