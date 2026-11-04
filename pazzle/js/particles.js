// Victory Confetti and Particle System
// Ultra smooth 60fps canvas particles

class ParticleEngine {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.particles = [];
        this.animId = null;
    }

    init(container) {
        if (this.canvas) return;
        this.canvas = document.createElement('canvas');
        this.canvas.className = 'victory-confetti-canvas';
        this.canvas.style.position = 'fixed';
        this.canvas.style.top = '0';
        this.canvas.style.left = '0';
        this.canvas.style.width = '100vw';
        this.canvas.style.height = '100vh';
        this.canvas.style.pointerEvents = 'none';
        this.canvas.style.zIndex = '9999';
        document.body.appendChild(this.canvas);
        this.ctx = this.canvas.getContext('2d');
        this.resize();
        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        if (!this.canvas) return;
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    fireVictoryConfetti(durationMs = 4000) {
        this.init();
        const colors = ['#ffd700', '#ff007f', '#00e5ff', '#00ff88', '#ff9900', '#b388ff', '#ffffff'];
        const pCount = 180;

        for (let i = 0; i < pCount; i++) {
            const angle = (Math.random() * Math.PI) - Math.PI / 2;
            const speed = 12 + Math.random() * 22;
            const fromLeft = Math.random() > 0.5;

            this.particles.push({
                x: fromLeft ? window.innerWidth * 0.15 : window.innerWidth * 0.85,
                y: window.innerHeight * 0.75,
                vx: (fromLeft ? 1 : -1) * (Math.cos(angle) * speed * 0.8 + Math.random() * 5),
                vy: -Math.abs(Math.sin(angle) * speed) - 5,
                w: 8 + Math.random() * 8,
                h: 5 + Math.random() * 7,
                color: colors[Math.floor(Math.random() * colors.length)],
                rotation: Math.random() * 360,
                vRot: (Math.random() - 0.5) * 12,
                opacity: 1,
                decay: 0.006 + Math.random() * 0.006,
                shape: Math.random() > 0.3 ? 'rect' : 'circle'
            });
        }

        if (!this.animId) {
            this.loop();
        }
    }

    loop() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];

            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.38; // gravity
            p.vx *= 0.985; // air drag
            p.rotation += p.vRot;
            p.opacity -= p.decay;

            if (p.opacity <= 0 || p.y > this.canvas.height + 50) {
                this.particles.splice(i, 1);
                continue;
            }

            this.ctx.save();
            this.ctx.translate(p.x, p.y);
            this.ctx.rotate((p.rotation * Math.PI) / 180);
            this.ctx.globalAlpha = Math.max(0, p.opacity);
            this.ctx.fillStyle = p.color;

            if (p.shape === 'rect') {
                this.ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
            } else {
                this.ctx.beginPath();
                this.ctx.arc(0, 0, p.w / 2, 0, Math.PI * 2);
                this.ctx.fill();
            }

            this.ctx.restore();
        }

        if (this.particles.length > 0) {
            this.animId = requestAnimationFrame(() => this.loop());
        } else {
            this.animId = null;
        }
    }

    clear() {
        this.particles = [];
        if (this.ctx && this.canvas) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }
    }
}

window.particleEngine = new ParticleEngine();
