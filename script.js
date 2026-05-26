/**
 * Interactive Premium Gender Reveal Experience Engine
 */

document.addEventListener('DOMContentLoaded', () => {
    
    // --- Application State ---
    const state = {
        score: 0,
        targetScore: 7,
        selectedGender: null, // Set explicitly to 'BOY' on start
        soundActive: true,
        gameInterval: null,
        animationFrameId: null
    };

    // --- DOM System Mappings ---
    const cursor = document.getElementById('customCursor');
    const introScreen = document.getElementById('introScreen');
    const gameScreen = document.getElementById('gameScreen');
    const celebrationScreen = document.getElementById('celebrationScreen');
    const revealSequence = document.getElementById('revealSequence');
    
    const startBtn = document.getElementById('startBtn');
    const replayBtn = document.getElementById('replayBtn');
    const shareBtn = document.getElementById('shareBtn');
    const soundToggle = document.getElementById('soundToggle');
    
    const scoreDisplay = document.getElementById('scoreDisplay');
    const suspenseDisplay = document.getElementById('suspenseDisplay');
    const progressBar = document.getElementById('progressBar');
    const gameArena = document.getElementById('gameArena');
    const countdownNumber = document.getElementById('countdownNumber');
    const revealResultText = document.getElementById('revealResultText');
    const revealBadge = document.getElementById('revealBadge');
    
    const canvas = document.getElementById('confettiCanvas');
    const ctx = canvas.getContext('2d');

    // --- Synthesizer Sound Engine (Web Audio API - No External Assets Required) ---
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    
    function playTone(freq, type, duration, volume = 0.1) {
        if (!state.soundActive) return;
        const osc = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        
        osc.type = type;
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
        gainNode.gain.setValueAtTime(volume, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + duration);
        
        osc.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + duration);
    }

    function playPopSound() {
        playTone(400, 'sine', 0.15, 0.2);
        playTone(150, 'triangle', 0.1, 0.3);
    }

    function playTickSound() {
        playTone(600, 'sine', 0.05, 0.1);
    }

    function playCrescendoSound(step) {
        playTone(220 + (step * 80), 'sawtooth', 0.4, 0.08);
    }

    function playChimeSequence() {
        const now = audioCtx.currentTime;
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C Major Chord
        notes.forEach((freq, idx) => {
            setTimeout(() => {
                playTone(freq, 'sine', 0.8, 0.15);
            }, idx * 150);
        });
    }

    // --- Micro-interactions & Custom Cursor System ---
    document.addEventListener('mousemove', (e) => {
        cursor.style.left = `${e.clientX}px`;
        cursor.style.top = `${e.clientY}px`;
        // Sync positional mapping
        cursor.animate({
            left: `${e.clientX}px`,
            top: `${e.clientY}px`
        }, { duration: 100, fill: "forwards" });
    });

    const addCursorHoverMap = (selector) => {
        document.querySelectorAll(selector).forEach(el => {
            el.addEventListener('mouseenter', () => cursor.classList.add('hover'));
            el.addEventListener('mouseleave', () => cursor.classList.remove('hover'));
        });
    };
    
    addCursorHoverMap('button, .balloon, .control-btn');

    // --- Sound Toggle Controller ---
    soundToggle.addEventListener('click', () => {
        state.soundActive = !state.soundActive;
        soundToggle.classList.toggle('muted', !state.soundActive);
        if (audioCtx.state === 'suspended') audioCtx.resume();
    });

    // --- Scene Navigation Core ---
    function switchScreen(from, to) {
        from.classList.remove('active');
        setTimeout(() => {
            to.classList.add('active');
            addCursorHoverMap('button, .balloon');
        }, 500);
    }

    // --- Gameplay Engine Logic ---
    startBtn.addEventListener('click', () => {
        if (audioCtx.state === 'suspended') audioCtx.resume();
        
        // UPDATE: Naka-fix na sa iisang gender ('BOY') imbes na Math.random()
        state.selectedGender = 'GIRL';
        
        switchScreen(introScreen, gameScreen);
        startGameEngine();
    });

    function startGameEngine() {
        state.score = 0;
        updateHUD();
        state.gameInterval = setInterval(spawnBalloon, 900);
    }

    function spawnBalloon() {
        if (!gameScreen.classList.contains('active')) return;
        
        const balloon = document.createElement('div');
        const isPink = Math.random() > 0.5;
        
        balloon.className = `balloon ${isPink ? 'pink' : 'blue'}`;
        balloon.style.left = `${Math.random() * 85 + 5}%`;
        
        // Speed scaling optimization
        const duration = 5 + Math.random() * 4;
        balloon.style.animationDuration = `${duration}s`;

        balloon.addEventListener('mousedown', (e) => {
            executePop(balloon, e.clientX, e.clientY);
        });

        // Touch layout integration
        balloon.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            executePop(balloon, touch.clientX, touch.clientY);
        });

        gameArena.appendChild(balloon);

        // Cleanup cycle
        setTimeout(() => {
            if (balloon.parentNode) balloon.remove();
        }, duration * 1000);
    }

    function executePop(balloon, x, my) {
        playPopSound();
        triggerHapticFeedback();
        createBurstParticles(x, my, window.getComputedStyle(balloon).color);
        balloon.remove();
        
        state.score++;
        updateHUD();

        if (state.score >= state.targetScore) {
            clearInterval(state.gameInterval);
            initiateRevealSequence();
        }
    }

    function triggerHapticFeedback() {
        if ('vibrate' in navigator) navigator.vibrate(15);
    }

    function createBurstParticles(x, y, color) {
        const totalParticles = 16;
        const container = document.body;

        for (let i = 0; i < totalParticles; i++) {
            const p = document.createElement('div');
            p.className = 'burst-particle';
            p.style.backgroundColor = color;
            p.style.left = `${x}px`;
            p.style.top = `${y}px`;

            const angle = Math.random() * Math.PI * 2;
            const velocity = 50 + Math.random() * 100;
            const mx = Math.cos(angle) * velocity;
            const my = Math.sin(angle) * velocity;

            p.style.setProperty('--mx', `${mx}px`);
            p.style.setProperty('--my', `${my}px`);

            container.appendChild(p);
            setTimeout(() => p.remove(), 600);
        }
    }

    function updateHUD() {
        scoreDisplay.textContent = `${state.score} / ${state.targetScore}`;
        const ratio = state.score / state.targetScore;
        progressBar.style.width = `${ratio * 100}%`;

        if (ratio < 0.4) {
            suspenseDisplay.textContent = "Rising";
            suspenseDisplay.className = "hud-value status-low";
        } else if (ratio < 0.8) {
            suspenseDisplay.textContent = "Intense";
            suspenseDisplay.className = "hud-value status-med";
        } else {
            suspenseDisplay.textContent = "Critical";
            suspenseDisplay.className = "hud-value status-high";
        }
    }

    // --- Dramatic Reveal Engine ---
    function initiateRevealSequence() {
        revealSequence.classList.add('active');
        let countdown = 3;
        countdownNumber.textContent = countdown;
        playCrescendoSound(3);

        const timer = setInterval(() => {
            countdown--;
            if (countdown > 0) {
                countdownNumber.textContent = countdown;
                playCrescendoSound(countdown);
            } else {
                clearInterval(timer);
                executeGrandExplosion();
            }
        }, 1200);
    }

    function executeGrandExplosion() {
        revealSequence.classList.remove('active');
        switchScreen(gameScreen, celebrationScreen);

        // At dahil 'BOY' na lang lagi ang active, pasok ito palagi sa unang block
        if (state.selectedGender === 'BOY') {
            document.body.className = 'theme-boy';
            revealResultText.textContent = "It's a Boy! 💙";
            revealBadge.textContent = "Welcome Little Prince";
        } else {
            document.body.className = 'theme-girl';
            revealResultText.textContent = "It's a Girl! 💖";
            revealBadge.textContent = "Welcome Little Princess";
        }

        playChimeSequence();
        initiateConfettiSystem();
    }

    // --- Highly Optimized Canvas Confetti System ---
    let particlesArray = [];
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    class ConfettiParticle {
        constructor() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * -canvas.height - 20;
            this.size = Math.random() * 8 + 6;
            this.speedX = Math.random() * 3 - 1.5;
            this.speedY = Math.random() * 4 + 4;
            this.rotation = Math.random() * 360;
            this.rotationSpeed = Math.random() * 4 - 2;
            
            const boyColors = ['#1e88e5', '#64b5f6', '#9be7ff', '#ffffff'];
            const girlColors = ['#d81b60', '#ff7ebb', '#ffb4d6', '#ffffff'];
            const palette = state.selectedGender === 'BOY' ? boyColors : girlColors;
            this.color = palette[Math.floor(Math.random() * palette.length)];
        }
        update() {
            this.x += this.speedX;
            this.y += this.speedY;
            this.rotation += this.rotationSpeed;
            if (this.y > canvas.height) {
                this.y = -20;
                this.x = Math.random() * canvas.width;
            }
        }
        draw() {
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate((this.rotation * Math.PI) / 180);
            ctx.fillStyle = this.color;
            ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
            ctx.restore();
        }
    }

    function initiateConfettiSystem() {
        particlesArray = [];
        for (let i = 0; i < 150; i++) {
            particlesArray.push(new ConfettiParticle());
        }
        animateParticles();
    }

    function animateParticles() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particlesArray.forEach(p => {
            p.update();
            p.draw();
        });
        state.animationFrameId = requestAnimationFrame(animateParticles);
    }

    // --- Reset & Share Infrastructure ---
    replayBtn.addEventListener('click', () => {
        cancelAnimationFrame(state.animationFrameId);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        document.body.className = '';
        gameArena.innerHTML = '';
        switchScreen(celebrationScreen, introScreen);
    });

    shareBtn.addEventListener('click', () => {
        if (navigator.share) {
            navigator.share({
                title: 'The Big Reveal!',
                text: `We found out the gender of our baby using this interactive game!`,
                url: window.location.href,
            }).catch(console.error);
        } else {
            alert("Copied celebration link to clipboard! Share the joy!");
        }
        /* =========================
   GENERATE STARS
========================= */

const starsContainer = document.getElementById("stars");

for(let i = 0; i < 250; i++){

  const star = document.createElement("div");

  star.classList.add("star");

  star.style.top = Math.random() * 100 + "%";
  star.style.left = Math.random() * 100 + "%";

  star.style.animationDuration =
    (Math.random() * 3 + 2) + "s";

  star.style.opacity = Math.random();

  starsContainer.appendChild(star);
}
    });
});
