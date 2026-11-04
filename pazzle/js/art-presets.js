// Procedural HD Artwork Generator for Puzzles
// 100% offline, crystal clear HD canvas graphics

class ArtPresets {
    constructor() {
        this.cache = {};
        this.presets = [
            { id: 'ancient_mosaic', name: 'Samarqand Mozaikasi', category: 'Madaniyat' },
            { id: 'galaxy', name: 'Fazoviy Galaktika', category: 'Koinot' },
            { id: 'sunset_mountain', name: 'Togʻ va Quyosh botishi', category: 'Tabiat' },
            { id: 'cyber_city', name: 'Kiber Neon Shahar', category: 'Futurizm' },
            { id: 'nature_forest', name: 'Sehrli Zumrad Oʻrmon', category: 'Tabiat' },
            { id: 'geometric_mandala', name: 'Oltin Mandala', category: 'Sanʼat' }
        ];
    }

    getImage(id, size = 800) {
        const cacheKey = `${id}_${size}`;
        if (this.cache[cacheKey]) {
            return Promise.resolve(this.cache[cacheKey]);
        }

        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');

        switch (id) {
            case 'ancient_mosaic':
                this.renderSamarkandMosaic(ctx, size);
                break;
            case 'galaxy':
                this.renderGalaxy(ctx, size);
                break;
            case 'sunset_mountain':
                this.renderSunsetMountains(ctx, size);
                break;
            case 'cyber_city':
                this.renderCyberCity(ctx, size);
                break;
            case 'nature_forest':
                this.renderEnchantedForest(ctx, size);
                break;
            case 'geometric_mandala':
                this.renderMandala(ctx, size);
                break;
            default:
                this.renderSamarkandMosaic(ctx, size);
                break;
        }

        const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
        this.cache[cacheKey] = dataUrl;
        return Promise.resolve(dataUrl);
    }

    // 1. Samarqand Mozaikasi (Registon uslubidagi muhtasham naqshlar)
    renderSamarkandMosaic(ctx, S) {
        // Deep turquoise / lapis lazuli background
        const bgGrad = ctx.createRadialGradient(S/2, S/2, 50, S/2, S/2, S*0.7);
        bgGrad.addColorStop(0, '#0a3663');
        bgGrad.addColorStop(0.6, '#06203d');
        bgGrad.addColorStop(1, '#020d1a');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, S, S);

        ctx.save();
        ctx.translate(S/2, S/2);

        // 8-pointed and 16-pointed Islamic star geometric mosaic
        const rings = [
            { r: S * 0.44, count: 16, color: '#d4af37', width: 4 },
            { r: S * 0.38, count: 16, color: '#00c4cc', width: 3 },
            { r: S * 0.31, count: 8, color: '#f5d77f', width: 5 },
            { r: S * 0.24, count: 8, color: '#00838f', width: 4 },
            { r: S * 0.16, count: 8, color: '#e67e22', width: 4 },
            { r: S * 0.08, count: 8, color: '#ffffff', width: 3 }
        ];

        // Concentric geometric star polygons
        for (let step = 0; step < 16; step++) {
            ctx.rotate((Math.PI * 2) / 16);
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(S * 0.12, S * 0.35);
            ctx.lineTo(0, S * 0.44);
            ctx.lineTo(-S * 0.12, S * 0.35);
            ctx.closePath();
            ctx.fillStyle = step % 2 === 0 ? 'rgba(0, 180, 216, 0.25)' : 'rgba(212, 175, 55, 0.22)';
            ctx.fill();
            ctx.strokeStyle = '#d4af37';
            ctx.lineWidth = 1.5;
            ctx.stroke();
        }

        // Star outlines
        rings.forEach(ring => {
            ctx.beginPath();
            for (let i = 0; i <= ring.count * 2; i++) {
                const angle = (i * Math.PI) / ring.count;
                const radius = i % 2 === 0 ? ring.r : ring.r * 0.82;
                const x = Math.cos(angle) * radius;
                const y = Math.sin(angle) * radius;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.closePath();
            ctx.strokeStyle = ring.color;
            ctx.lineWidth = ring.width;
            ctx.stroke();
        });

        // Center medallion
        const centerGrad = ctx.createRadialGradient(0, 0, 5, 0, 0, S * 0.1);
        centerGrad.addColorStop(0, '#ffd700');
        centerGrad.addColorStop(0.5, '#e67e22');
        centerGrad.addColorStop(1, '#005b96');
        ctx.beginPath();
        ctx.arc(0, 0, S * 0.09, 0, Math.PI * 2);
        ctx.fillStyle = centerGrad;
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.stroke();

        // 4 corner arabesque ornaments
        ctx.restore();
        const cornerSize = S * 0.22;
        const corners = [
            [0, 0, 0],
            [S, 0, Math.PI / 2],
            [S, S, Math.PI],
            [0, S, -Math.PI / 2]
        ];

        corners.forEach(([cx, cy, rot]) => {
            ctx.save();
            ctx.translate(cx, cy);
            ctx.rotate(rot);
            ctx.fillStyle = 'rgba(212, 175, 55, 0.2)';
            ctx.strokeStyle = '#d4af37';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.quadraticCurveTo(cornerSize, 0, cornerSize, cornerSize);
            ctx.quadraticCurveTo(0, cornerSize, 0, 0);
            ctx.fill();
            ctx.stroke();
            ctx.restore();
        });

        // Ornate border frame
        ctx.strokeStyle = '#d4af37';
        ctx.lineWidth = 14;
        ctx.strokeRect(10, 10, S - 20, S - 20);
        ctx.strokeStyle = '#00e5ff';
        ctx.lineWidth = 2;
        ctx.strokeRect(20, 20, S - 40, S - 40);
    }

    // 2. Fazoviy Galaktika (Cosmic Spiral Galaxy with Nebula & Glowing Stars)
    renderGalaxy(ctx, S) {
        // Deep space gradient
        const bg = ctx.createRadialGradient(S * 0.5, S * 0.5, 20, S * 0.5, S * 0.5, S * 0.75);
        bg.addColorStop(0, '#2e0854');
        bg.addColorStop(0.4, '#150630');
        bg.addColorStop(0.8, '#08011a');
        bg.addColorStop(1, '#020008');
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, S, S);

        // Nebula cloud layers (additive blending)
        ctx.save();
        ctx.globalCompositeOperation = 'screen';

        const drawNebula = (x, y, r, color1, color2) => {
            const rad = ctx.createRadialGradient(x, y, 0, x, y, r);
            rad.addColorStop(0, color1);
            rad.addColorStop(0.5, color2);
            rad.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = rad;
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.fill();
        };

        drawNebula(S * 0.5, S * 0.5, S * 0.45, 'rgba(255, 80, 180, 0.45)', 'rgba(80, 20, 120, 0.2)');
        drawNebula(S * 0.35, S * 0.4, S * 0.35, 'rgba(0, 230, 255, 0.4)', 'rgba(20, 80, 150, 0.15)');
        drawNebula(S * 0.65, S * 0.6, S * 0.38, 'rgba(160, 32, 240, 0.45)', 'rgba(40, 10, 80, 0.2)');
        drawNebula(S * 0.5, S * 0.5, S * 0.15, 'rgba(255, 240, 200, 0.8)', 'rgba(255, 120, 50, 0.3)');

        // Spiral galaxy arms
        const arms = 3;
        for (let a = 0; a < arms; a++) {
            const armOffset = (a * Math.PI * 2) / arms;
            for (let i = 0; i < 450; i++) {
                const theta = (i / 450) * Math.PI * 4;
                const r = (theta / (Math.PI * 4)) * (S * 0.45);
                const jitterX = (Math.random() - 0.5) * (r * 0.35);
                const jitterY = (Math.random() - 0.5) * (r * 0.35);
                const x = S * 0.5 + Math.cos(theta + armOffset) * r + jitterX;
                const y = S * 0.5 + Math.sin(theta + armOffset) * r + jitterY;
                const pRad = Math.random() * 2.5 + 0.5;

                ctx.fillStyle = (i % 3 === 0) ? '#ff99e6' : (i % 2 === 0 ? '#80ffff' : '#ffffff');
                ctx.beginPath();
                ctx.arc(x, y, pRad, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // Glowing Core
        const coreGrad = ctx.createRadialGradient(S * 0.5, S * 0.5, 0, S * 0.5, S * 0.5, 50);
        coreGrad.addColorStop(0, '#ffffff');
        coreGrad.addColorStop(0.4, 'rgba(255, 240, 180, 0.9)');
        coreGrad.addColorStop(1, 'rgba(255, 100, 50, 0)');
        ctx.fillStyle = coreGrad;
        ctx.beginPath();
        ctx.arc(S * 0.5, S * 0.5, 50, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();

        // Big distant glowing ring planet in corner
        ctx.save();
        const px = S * 0.82;
        const py = S * 0.22;
        const pSize = 48;
        
        // Planet body
        const pGrad = ctx.createRadialGradient(px - 10, py - 10, 5, px, py, pSize);
        pGrad.addColorStop(0, '#ff9a44');
        pGrad.addColorStop(0.7, '#962d3e');
        pGrad.addColorStop(1, '#1b0c1e');
        ctx.fillStyle = pGrad;
        ctx.beginPath();
        ctx.arc(px, py, pSize, 0, Math.PI * 2);
        ctx.fill();

        // Planet rings
        ctx.beginPath();
        ctx.ellipse(px, py, pSize * 1.8, pSize * 0.45, -0.4, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255, 200, 150, 0.7)';
        ctx.lineWidth = 5;
        ctx.stroke();
        ctx.restore();

        // Cross stars / Lens flare stars
        const drawCrossStar = (x, y, len, color) => {
            ctx.save();
            ctx.strokeStyle = color;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(x - len, y);
            ctx.lineTo(x + len, y);
            ctx.moveTo(x, y - len);
            ctx.lineTo(x, y + len);
            ctx.stroke();

            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(x, y, 2.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        };

        drawCrossStar(S * 0.2, S * 0.25, 14, 'rgba(255, 255, 255, 0.8)');
        drawCrossStar(S * 0.75, S * 0.78, 18, 'rgba(100, 240, 255, 0.9)');
        drawCrossStar(S * 0.25, S * 0.7, 12, 'rgba(255, 150, 220, 0.8)');
    }

    // 3. Tog' va Oltin Quyosh Botishi (Vibrant Alpine Mountain Sunset)
    renderSunsetMountains(ctx, S) {
        // Sunset sky gradient
        const sky = ctx.createLinearGradient(0, 0, 0, S * 0.65);
        sky.addColorStop(0, '#1a103c');
        sky.addColorStop(0.25, '#6c2c6a');
        sky.addColorStop(0.5, '#c84b55');
        sky.addColorStop(0.75, '#f48847');
        sky.addColorStop(0.92, '#ffc44f');
        sky.addColorStop(1, '#ffe580');
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, S, S * 0.65);

        // Radiant Glowing Sun
        const sunY = S * 0.42;
        const sunX = S * 0.5;
        const sunGlow = ctx.createRadialGradient(sunX, sunY, 15, sunX, sunY, 160);
        sunGlow.addColorStop(0, '#ffffff');
        sunGlow.addColorStop(0.3, '#fff494');
        sunGlow.addColorStop(0.7, 'rgba(255, 140, 50, 0.4)');
        sunGlow.addColorStop(1, 'rgba(255, 100, 50, 0)');
        ctx.fillStyle = sunGlow;
        ctx.beginPath();
        ctx.arc(sunX, sunY, 160, 0, Math.PI * 2);
        ctx.fill();

        // Mountain Range 1 (Distant Purple Silhouettes)
        ctx.fillStyle = '#44224c';
        ctx.beginPath();
        ctx.moveTo(0, S * 0.65);
        ctx.lineTo(0, S * 0.48);
        ctx.lineTo(S * 0.18, S * 0.38);
        ctx.lineTo(S * 0.35, S * 0.46);
        ctx.lineTo(S * 0.5, S * 0.35);
        ctx.lineTo(S * 0.68, S * 0.45);
        ctx.lineTo(S * 0.84, S * 0.36);
        ctx.lineTo(S, S * 0.46);
        ctx.lineTo(S, S * 0.65);
        ctx.closePath();
        ctx.fill();

        // Mountain Range 2 (Middle Dark Violet)
        ctx.fillStyle = '#281335';
        ctx.beginPath();
        ctx.moveTo(0, S * 0.65);
        ctx.lineTo(0, S * 0.54);
        ctx.lineTo(S * 0.25, S * 0.42);
        ctx.lineTo(S * 0.45, S * 0.56);
        ctx.lineTo(S * 0.65, S * 0.41);
        ctx.lineTo(S * 0.88, S * 0.52);
        ctx.lineTo(S, S * 0.48);
        ctx.lineTo(S, S * 0.65);
        ctx.closePath();
        ctx.fill();

        // Mountain snow peaks / highlights
        ctx.fillStyle = 'rgba(255, 230, 200, 0.45)';
        ctx.beginPath();
        ctx.moveTo(S * 0.25, S * 0.42);
        ctx.lineTo(S * 0.21, S * 0.48);
        ctx.lineTo(S * 0.29, S * 0.48);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(S * 0.65, S * 0.41);
        ctx.lineTo(S * 0.61, S * 0.47);
        ctx.lineTo(S * 0.69, S * 0.47);
        ctx.closePath();
        ctx.fill();

        // Lake surface
        const lake = ctx.createLinearGradient(0, S * 0.65, 0, S);
        lake.addColorStop(0, '#ff9640');
        lake.addColorStop(0.18, '#822e4d');
        lake.addColorStop(0.5, '#2c143d');
        lake.addColorStop(1, '#0c071a');
        ctx.fillStyle = lake;
        ctx.fillRect(0, S * 0.65, S, S * 0.35);

        // Sun reflection on water
        ctx.save();
        for (let i = 0; i < 40; i++) {
            const y = S * 0.65 + i * (S * 0.35 / 40);
            const w = 40 + i * 5 + Math.sin(i * 1.5) * 20;
            ctx.fillStyle = `rgba(255, 220, 120, ${Math.max(0, 0.7 - i * 0.016)})`;
            ctx.fillRect(S * 0.5 - w / 2, y, w, 2.5);
        }
        ctx.restore();

        // Foreground Pine Forest silhouettes & hill
        ctx.fillStyle = '#0f0717';
        ctx.beginPath();
        ctx.moveTo(0, S);
        ctx.lineTo(0, S * 0.78);
        ctx.quadraticCurveTo(S * 0.35, S * 0.72, S * 0.65, S * 0.85);
        ctx.lineTo(S, S * 0.82);
        ctx.lineTo(S, S);
        ctx.closePath();
        ctx.fill();

        // Draw individual stylized pines
        const drawPine = (px, py, h, w) => {
            ctx.fillStyle = '#09040e';
            ctx.beginPath();
            ctx.moveTo(px, py - h);
            ctx.lineTo(px + w * 0.5, py);
            ctx.lineTo(px - w * 0.5, py);
            ctx.closePath();
            ctx.fill();
        };

        const pines = [
            [S * 0.06, S * 0.82, 60, 24],
            [S * 0.12, S * 0.80, 75, 28],
            [S * 0.18, S * 0.81, 55, 22],
            [S * 0.25, S * 0.83, 70, 26],
            [S * 0.33, S * 0.84, 50, 20],
            [S * 0.75, S * 0.88, 65, 25],
            [S * 0.82, S * 0.87, 85, 30],
            [S * 0.90, S * 0.86, 70, 26],
            [S * 0.96, S * 0.89, 50, 20]
        ];
        pines.forEach(p => drawPine(...p));

        // Birds flying across sunset
        ctx.strokeStyle = '#220b29';
        ctx.lineWidth = 2.5;
        const birds = [
            [S * 0.36, S * 0.32, 10],
            [S * 0.42, S * 0.29, 13],
            [S * 0.46, S * 0.34, 9]
        ];
        birds.forEach(([bx, by, bsize]) => {
            ctx.beginPath();
            ctx.arc(bx - bsize/2, by, bsize/2, Math.PI, 0, false);
            ctx.arc(bx + bsize/2, by, bsize/2, Math.PI, 0, false);
            ctx.stroke();
        });
    }

    // 4. Kiber Neon Shahar (Cyberpunk Futuristic Cityscape)
    renderCyberCity(ctx, S) {
        // Deep purple to teal sky
        const sky = ctx.createLinearGradient(0, 0, 0, S);
        sky.addColorStop(0, '#04020e');
        sky.addColorStop(0.45, '#16092c');
        sky.addColorStop(0.75, '#2a0845');
        sky.addColorStop(1, '#050c26');
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, S, S);

        // Giant Synthwave Neon Sun
        const sunY = S * 0.45;
        const sunRadius = S * 0.22;
        const sunGrad = ctx.createLinearGradient(0, sunY - sunRadius, 0, sunY + sunRadius);
        sunGrad.addColorStop(0, '#ff007f');
        sunGrad.addColorStop(0.5, '#ff0055');
        sunGrad.addColorStop(1, '#ffaa00');

        ctx.fillStyle = sunGrad;
        ctx.beginPath();
        ctx.arc(S * 0.5, sunY, sunRadius, 0, Math.PI * 2);
        ctx.fill();

        // Horizontal sun cuts (retro synthwave aesthetic)
        ctx.fillStyle = '#16092c';
        for (let i = 0; i < 7; i++) {
            const cutY = sunY + 15 + i * 14;
            const cutH = 2.5 + i * 1.5;
            ctx.fillRect(S * 0.5 - sunRadius, cutY, sunRadius * 2, cutH);
        }

        // Skyscrapers silhouettes in background and foreground
        const buildings = [
            { x: S * 0.02, w: S * 0.14, h: S * 0.45, neon: '#00ffff' },
            { x: S * 0.15, w: S * 0.11, h: S * 0.55, neon: '#ff007f' },
            { x: S * 0.24, w: S * 0.15, h: S * 0.38, neon: '#ffff00' },
            { x: S * 0.38, w: S * 0.12, h: S * 0.62, neon: '#00ff88' },
            { x: S * 0.48, w: S * 0.16, h: S * 0.50, neon: '#ff0055' },
            { x: S * 0.62, w: S * 0.13, h: S * 0.58, neon: '#00e5ff' },
            { x: S * 0.74, w: S * 0.12, h: S * 0.42, neon: '#ff00cc' },
            { x: S * 0.84, w: S * 0.15, h: S * 0.52, neon: '#00ffcc' }
        ];

        buildings.forEach(b => {
            const by = S * 0.75 - b.h;
            ctx.fillStyle = '#090514';
            ctx.fillRect(b.x, by, b.w, b.h + S * 0.25);

            // Roof antenna
            ctx.strokeStyle = b.neon;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(b.x + b.w / 2, by);
            ctx.lineTo(b.x + b.w / 2, by - 24);
            ctx.stroke();

            // Neon glowing windows grid
            ctx.fillStyle = b.neon;
            const cols = 4;
            const rows = Math.floor(b.h / 24);
            for (let r = 2; r < rows; r++) {
                for (let c = 0; c < cols; c++) {
                    if (Math.random() > 0.4) {
                        const wx = b.x + 6 + c * ((b.w - 12) / cols);
                        const wy = by + r * 22;
                        ctx.fillRect(wx, wy, 4, 8);
                    }
                }
            }

            // Top beacon
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(b.x + b.w / 2, by - 24, 3, 0, Math.PI * 2);
            ctx.fill();
        });

        // Perspective 3D Neon Grid Floor
        const horizon = S * 0.75;
        ctx.fillStyle = '#030208';
        ctx.fillRect(0, horizon, S, S - horizon);

        ctx.strokeStyle = '#ff007f';
        ctx.lineWidth = 1.8;

        // Radiating grid lines
        for (let i = -15; i <= 25; i++) {
            const startX = S * 0.5 + i * 22;
            const endX = S * 0.5 + i * 110;
            ctx.beginPath();
            ctx.moveTo(startX, horizon);
            ctx.lineTo(endX, S);
            ctx.stroke();
        }

        // Horizontal perspective lines
        ctx.strokeStyle = '#00ffff';
        for (let i = 1; i <= 12; i++) {
            const y = horizon + Math.pow(i / 12, 2.2) * (S - horizon);
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(S, y);
            ctx.stroke();
        }
    }

    // 5. Sehrli Zumrad O'rmon (Enchanted Emerald Forest)
    renderEnchantedForest(ctx, S) {
        // Deep emerald background
        const bg = ctx.createLinearGradient(0, 0, 0, S);
        bg.addColorStop(0, '#021814');
        bg.addColorStop(0.5, '#052922');
        bg.addColorStop(1, '#0a382d');
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, S, S);

        // Giant radiant moon through trees
        const moonGrad = ctx.createRadialGradient(S * 0.5, S * 0.35, 10, S * 0.5, S * 0.35, 140);
        moonGrad.addColorStop(0, '#eafff7');
        moonGrad.addColorStop(0.35, '#52ffc6');
        moonGrad.addColorStop(0.7, 'rgba(10, 180, 140, 0.3)');
        moonGrad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = moonGrad;
        ctx.beginPath();
        ctx.arc(S * 0.5, S * 0.35, 140, 0, Math.PI * 2);
        ctx.fill();

        // Sunbeams / Moon rays filtering through canopy
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        for (let i = -5; i <= 5; i++) {
            ctx.fillStyle = 'rgba(100, 255, 210, 0.08)';
            ctx.beginPath();
            ctx.moveTo(S * 0.5, S * 0.1);
            ctx.lineTo(S * 0.5 + i * 160 - 50, S);
            ctx.lineTo(S * 0.5 + i * 160 + 50, S);
            ctx.closePath();
            ctx.fill();
        }
        ctx.restore();

        // Massive Ancient Tree in center
        ctx.fillStyle = '#061a15';
        ctx.beginPath();
        // Trunk
        ctx.moveTo(S * 0.38, S);
        ctx.quadraticCurveTo(S * 0.42, S * 0.65, S * 0.35, S * 0.45);
        ctx.lineTo(S * 0.2, S * 0.3); // left branch
        ctx.lineTo(S * 0.28, S * 0.32);
        ctx.lineTo(S * 0.45, S * 0.48);
        ctx.lineTo(S * 0.55, S * 0.32); // right branch
        ctx.lineTo(S * 0.68, S * 0.25);
        ctx.lineTo(S * 0.6, S * 0.48);
        ctx.quadraticCurveTo(S * 0.58, S * 0.65, S * 0.64, S);
        ctx.closePath();
        ctx.fill();

        // Lush foliage clouds (foliage clusters)
        const clusters = [
            [S * 0.25, S * 0.28, 80, '#0e4a3c'],
            [S * 0.22, S * 0.26, 65, '#19735d'],
            [S * 0.50, S * 0.20, 110, '#0a3d31'],
            [S * 0.48, S * 0.18, 90, '#156a56'],
            [S * 0.72, S * 0.26, 85, '#0e4a3c'],
            [S * 0.76, S * 0.24, 70, '#1da384'],
            [S * 0.35, S * 0.15, 75, '#2ed1aa']
        ];
        clusters.forEach(([cx, cy, cr, col]) => {
            ctx.fillStyle = col;
            ctx.beginPath();
            ctx.arc(cx, cy, cr, 0, Math.PI * 2);
            ctx.fill();
        });

        // Glowing Fireflies / Magic Wisps
        for (let i = 0; i < 90; i++) {
            const fx = Math.random() * S;
            const fy = S * 0.25 + Math.random() * (S * 0.7);
            const fr = Math.random() * 4 + 1.5;
            const glow = ctx.createRadialGradient(fx, fy, 0, fx, fy, fr * 4);
            glow.addColorStop(0, '#ffffff');
            glow.addColorStop(0.4, '#64ffd8');
            glow.addColorStop(1, 'rgba(0, 255, 180, 0)');
            ctx.fillStyle = glow;
            ctx.beginPath();
            ctx.arc(fx, fy, fr * 4, 0, Math.PI * 2);
            ctx.fill();
        }

        // Foreground enchanted flowers & moss
        ctx.fillStyle = '#04130f';
        ctx.beginPath();
        ctx.moveTo(0, S);
        ctx.quadraticCurveTo(S * 0.5, S * 0.88, S, S);
        ctx.fill();

        for (let i = 0; i < 25; i++) {
            const mx = S * 0.1 + (i / 25) * (S * 0.8);
            const my = S * 0.94 + Math.sin(i * 2) * 20;
            ctx.fillStyle = i % 2 === 0 ? '#ff79c6' : '#50fa7b';
            ctx.beginPath();
            ctx.arc(mx, my, 4, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // 6. Oltin Mandala (Sacred Golden Mandala & Sacred Geometry)
    renderMandala(ctx, S) {
        // Deep royal midnight velvet background
        const bg = ctx.createRadialGradient(S/2, S/2, 20, S/2, S/2, S*0.7);
        bg.addColorStop(0, '#1c1028');
        bg.addColorStop(0.6, '#0b0612');
        bg.addColorStop(1, '#020005');
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, S, S);

        ctx.save();
        ctx.translate(S/2, S/2);

        const petals = 12;
        for (let layer = 6; layer >= 1; layer--) {
            const radius = (layer / 6) * (S * 0.44);
            const color = layer % 2 === 0 ? '#ffd700' : '#e65100';
            const innerColor = layer % 2 === 0 ? 'rgba(255, 215, 0, 0.12)' : 'rgba(230, 81, 0, 0.12)';

            for (let i = 0; i < petals * 2; i++) {
                ctx.rotate((Math.PI * 2) / (petals * 2));
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.quadraticCurveTo(radius * 0.35, radius * 0.6, 0, radius);
                ctx.quadraticCurveTo(-radius * 0.35, radius * 0.6, 0, 0);
                ctx.fillStyle = innerColor;
                ctx.fill();
                ctx.strokeStyle = color;
                ctx.lineWidth = 2;
                ctx.stroke();
            }
        }

        // Concentric pearl circles
        for (let c = 1; c <= 5; c++) {
            const cr = c * (S * 0.08);
            ctx.beginPath();
            ctx.arc(0, 0, cr, 0, Math.PI * 2);
            ctx.strokeStyle = '#ffd700';
            ctx.lineWidth = 1.5;
            ctx.stroke();

            // Pearls on circumference
            const pCount = c * 8;
            for (let p = 0; p < pCount; p++) {
                const angle = (p * Math.PI * 2) / pCount;
                const px = Math.cos(angle) * cr;
                const py = Math.sin(angle) * cr;
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(px, py, 2.5, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // Center ruby jewel
        const jewel = ctx.createRadialGradient(0, 0, 2, 0, 0, 28);
        jewel.addColorStop(0, '#ff80bf');
        jewel.addColorStop(0.5, '#e6005c');
        jewel.addColorStop(1, '#660029');
        ctx.fillStyle = jewel;
        ctx.beginPath();
        ctx.arc(0, 0, 28, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 4;
        ctx.stroke();

        ctx.restore();
    }

    // Process user uploaded image: crop center square & return dataUrl
    processUploadedImage(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const size = 800;
                    canvas.width = size;
                    canvas.height = size;
                    const ctx = canvas.getContext('2d');

                    // Center-crop square
                    const minDim = Math.min(img.width, img.height);
                    const sx = (img.width - minDim) / 2;
                    const sy = (img.height - minDim) / 2;

                    ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, size, size);
                    resolve(canvas.toDataURL('image/jpeg', 0.94));
                };
                img.onerror = reject;
                img.src = e.target.result;
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    // Numbers theme pattern (for purely numbered tiles)
    renderNumberBackground(size = 800) {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');

        // Clean solid flat texture (no gradients)
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        ctx.fillStyle = isDark ? '#1a2333' : '#f1f5f9';
        ctx.fillRect(0, 0, size, size);

        // Subtle clean grid
        ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';
        ctx.lineWidth = 1;
        const step = 40;
        for (let x = 0; x < size; x += step) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, size);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(0, x);
            ctx.lineTo(size, x);
            ctx.stroke();
        }

        return canvas.toDataURL('image/png');
    }
}

window.artPresets = new ArtPresets();
