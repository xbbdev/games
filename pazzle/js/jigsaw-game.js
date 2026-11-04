// Pro Jigsaw Puzzle Studio with Physical Drag & Drop,
// Dedicated Piece Tray, Magnetic Snapping, Edge Filter, Zoom & Ghost Control.

class JigsawGame {
    constructor(container, onWinCallback, onMoveCallback, onProgressCallback) {
        this.container = container;
        this.onWin = onWinCallback;
        this.onMove = onMoveCallback;
        this.onProgress = onProgressCallback;

        this.canvas = null;
        this.ctx = null;
        this.image = null;
        this.size = 4; // 3x3 to 10x10
        this.pieces = [];
        this.draggedPiece = null;
        this.dragOffset = { x: 0, y: 0 };
        this.moves = 0;
        this.startTime = null;
        this.timerInterval = null;
        this.elapsedSeconds = 0;

        // Settings & Features
        this.allowRotation = false;
        this.showGhost = true;
        this.ghostOpacity = 0.25;
        this.filterEdgesOnly = false;
        this.trayScrollX = 0;
        this.maxTrayScrollX = 0;

        // Geometry bounds
        this.boardBounds = { x: 0, y: 0, width: 0, height: 0, tileSize: 0 };
        this.trayBounds = { x: 0, y: 0, width: 0, height: 0, itemSize: 0 };

        this.tabEdges = [];
        this.isDestroyed = false;
        this.sparkles = []; // In-canvas snap particle sparks!

        // Event handler references
        this.boundOnDown = null;
        this.boundOnMove = null;
        this.boundOnUp = null;
        this.boundWheel = null;
        this.boundResize = null;

        this.initCanvas();
    }

    initCanvas() {
        this.container.innerHTML = '';
        this.container.style.position = 'relative';
        this.container.style.overflow = 'hidden';

        this.canvas = document.createElement('canvas');
        this.canvas.className = 'jigsaw-canvas';
        this.canvas.style.display = 'block';
        this.canvas.style.width = '100%';
        this.canvas.style.height = '100%';
        this.canvas.style.cursor = 'grab';
        this.container.appendChild(this.canvas);
        this.ctx = this.canvas.getContext('2d');

        this.setupEvents();
    }

    init(size = 4, imageUrl = null, allowRotation = false) {
        this.size = size;
        this.allowRotation = allowRotation;
        this.moves = 0;
        this.elapsedSeconds = 0;
        this.filterEdgesOnly = false;
        this.trayScrollX = 0;
        this.stopTimer();

        this.loadImage(imageUrl).then(() => {
            if (this.isDestroyed) return;
            this.resize();
            this.generatePuzzlePieces();
            this.populateTray();
            this.startTimer();
            this.notifyProgress();
            this.render();
        });
    }

    loadImage(url) {
        return new Promise((resolve) => {
            this.image = new Image();
            this.image.crossOrigin = 'anonymous';
            this.image.onload = () => resolve();
            this.image.onerror = () => {
                window.artPresets.getImage('ancient_mosaic').then(fallback => {
                    this.image.src = fallback;
                });
            };
            this.image.src = url || window.artPresets.renderNumberBackground(800);
        });
    }

    startTimer() {
        this.stopTimer();
        this.startTime = Date.now();
        this.timerInterval = setInterval(() => {
            this.elapsedSeconds++;
            if (this.onMove) {
                this.onMove({ moves: this.moves, time: this.elapsedSeconds });
            }
        }, 1000);
    }

    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    resize() {
        if (!this.canvas || !this.container) return;
        const rect = this.container.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        const w = rect.width || 600;
        const h = rect.height || 640;

        this.canvas.width = w * dpr;
        this.canvas.height = h * dpr;
        this.canvas.style.width = `${w}px`;
        this.canvas.style.height = `${h}px`;
        this.ctx.scale(dpr, dpr);

        // Layout:
        // Top 72% area for Puzzle Board
        // Bottom 28% area for Dedicated Piece Tray (min 110px)
        const trayH = Math.max(110, Math.min(140, h * 0.24));
        const boardAreaH = h - trayH - 16;
        const boardAreaW = w - 24;

        const boardSize = Math.min(boardAreaW * 0.94, boardAreaH * 0.94, 520);
        this.boardBounds = {
            x: (w - boardSize) / 2,
            y: 12 + (boardAreaH - boardSize) / 2,
            width: boardSize,
            height: boardSize,
            tileSize: boardSize / this.size
        };

        this.trayBounds = {
            x: 10,
            y: h - trayH - 6,
            width: w - 20,
            height: trayH,
            itemSize: trayH * 0.68
        };

        this.updateTrayScrollBounds();
    }

    generateEdges() {
        this.tabEdges = [];
        for (let r = 0; r < this.size; r++) {
            this.tabEdges[r] = [];
            for (let c = 0; c < this.size; c++) {
                this.tabEdges[r][c] = {
                    top: r === 0 ? 0 : -this.tabEdges[r - 1][c].bottom,
                    right: c === this.size - 1 ? 0 : (Math.random() > 0.5 ? 1 : -1),
                    bottom: r === this.size - 1 ? 0 : (Math.random() > 0.5 ? 1 : -1),
                    left: c === 0 ? 0 : -this.tabEdges[r][c - 1].right
                };
            }
        }
    }

    generatePuzzlePieces() {
        this.generateEdges();
        this.pieces = [];
        const ts = this.boardBounds.tileSize;
        const tabSize = ts * 0.22;

        for (let r = 0; r < this.size; r++) {
            for (let c = 0; c < this.size; c++) {
                const targetX = this.boardBounds.x + c * ts;
                const targetY = this.boardBounds.y + r * ts;
                const edges = this.tabEdges[r][c];

                // Check if this is an outer border edge piece
                const isEdge = (edges.top === 0 || edges.right === 0 || edges.bottom === 0 || edges.left === 0);

                const pieceCanvas = document.createElement('canvas');
                const pad = tabSize * 2.2;
                const pieceW = ts + pad * 2;
                const pieceH = ts + pad * 2;
                pieceCanvas.width = pieceW;
                pieceCanvas.height = pieceH;
                const pCtx = pieceCanvas.getContext('2d');

                // Draw clipped image
                pCtx.save();
                pCtx.translate(pad, pad);
                this.tracePiecePath(pCtx, 0, 0, ts, edges);
                pCtx.clip();

                const imgTileW = this.image.width / this.size;
                const imgTileH = this.image.height / this.size;
                const imgPadX = (imgTileW / ts) * pad;
                const imgPadY = (imgTileH / ts) * pad;

                pCtx.drawImage(
                    this.image,
                    c * imgTileW - imgPadX,
                    r * imgTileH - imgPadY,
                    imgTileW + imgPadX * 2,
                    imgTileH + imgPadY * 2,
                    -pad,
                    -pad,
                    pieceW,
                    pieceH
                );

                pCtx.restore();

                // 3D Bevel highlight & shadow stroke
                pCtx.save();
                pCtx.translate(pad, pad);
                this.tracePiecePath(pCtx, 0, 0, ts, edges);
                pCtx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
                pCtx.lineWidth = 2.5;
                pCtx.stroke();

                pCtx.strokeStyle = 'rgba(0, 0, 0, 0.45)';
                pCtx.lineWidth = 1.2;
                pCtx.stroke();
                pCtx.restore();

                this.pieces.push({
                    id: `${r}_${c}`,
                    row: r,
                    col: c,
                    edges,
                    isEdge,
                    canvas: pieceCanvas,
                    pad,
                    width: pieceW,
                    height: pieceH,
                    x: 0,
                    y: 0,
                    targetX,
                    targetY,
                    rotation: 0,
                    isLocked: false,
                    state: 'tray', // 'tray', 'table', 'locked'
                    trayIndex: r * this.size + c,
                    zIndex: 1
                });
            }
        }
    }

    tracePiecePath(ctx, x, y, size, edges) {
        const tab = size * 0.22;
        ctx.beginPath();
        ctx.moveTo(x, y);

        // TOP
        if (edges.top === 0) {
            ctx.lineTo(x + size, y);
        } else {
            const dir = edges.top;
            ctx.lineTo(x + size * 0.36, y);
            ctx.bezierCurveTo(
                x + size * 0.35, y - tab * 0.7 * dir,
                x + size * 0.42, y - tab * 1.05 * dir,
                x + size * 0.5, y - tab * 1.05 * dir
            );
            ctx.bezierCurveTo(
                x + size * 0.58, y - tab * 1.05 * dir,
                x + size * 0.65, y - tab * 0.7 * dir,
                x + size * 0.64, y
            );
            ctx.lineTo(x + size, y);
        }

        // RIGHT
        if (edges.right === 0) {
            ctx.lineTo(x + size, y + size);
        } else {
            const dir = edges.right;
            ctx.lineTo(x + size, y + size * 0.36);
            ctx.bezierCurveTo(
                x + size + tab * 0.7 * dir, y + size * 0.35,
                x + size + tab * 1.05 * dir, y + size * 0.42,
                x + size + tab * 1.05 * dir, y + size * 0.5
            );
            ctx.bezierCurveTo(
                x + size + tab * 1.05 * dir, y + size * 0.58,
                x + size + tab * 0.7 * dir, y + size * 0.65,
                x + size, y + size * 0.64
            );
            ctx.lineTo(x + size, y + size);
        }

        // BOTTOM
        if (edges.bottom === 0) {
            ctx.lineTo(x, y + size);
        } else {
            const dir = edges.bottom;
            ctx.lineTo(x + size * 0.64, y + size);
            ctx.bezierCurveTo(
                x + size * 0.65, y + size + tab * 0.7 * dir,
                x + size * 0.58, y + size + tab * 1.05 * dir,
                x + size * 0.5, y + size + tab * 1.05 * dir
            );
            ctx.bezierCurveTo(
                x + size * 0.42, y + size + tab * 1.05 * dir,
                x + size * 0.35, y + size + tab * 0.7 * dir,
                x + size * 0.36, y + size
            );
            ctx.lineTo(x, y + size);
        }

        // LEFT
        if (edges.left === 0) {
            ctx.closePath();
        } else {
            const dir = edges.left;
            ctx.lineTo(x, y + size * 0.64);
            ctx.bezierCurveTo(
                x - tab * 0.7 * dir, y + size * 0.65,
                x - tab * 1.05 * dir, y + size * 0.58,
                x - tab * 1.05 * dir, y + size * 0.5
            );
            ctx.bezierCurveTo(
                x - tab * 1.05 * dir, y + size * 0.42,
                x - tab * 0.7 * dir, y + size * 0.35,
                x, y + size * 0.36
            );
            ctx.closePath();
        }
    }

    populateTray() {
        // Randomize order in tray
        const shuffled = [...this.pieces];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }

        shuffled.forEach((p, idx) => {
            p.state = 'tray';
            p.isLocked = false;
            p.trayIndex = idx;
            p.rotation = this.allowRotation ? [0, 90, 180, 270][Math.floor(Math.random() * 4)] : 0;
        });

        this.updateTrayPositions();
    }

    updateTrayScrollBounds() {
        const tb = this.trayBounds;
        const visiblePieces = this.getTrayPieces();
        const slotWidth = tb.itemSize * 1.25;
        const totalContentWidth = visiblePieces.length * slotWidth + 40;
        this.maxTrayScrollX = Math.max(0, totalContentWidth - tb.width);
        this.trayScrollX = Math.max(0, Math.min(this.trayScrollX, this.maxTrayScrollX));
    }

    getTrayPieces() {
        return this.pieces.filter(p => p.state === 'tray' && (!this.filterEdgesOnly || p.isEdge));
    }

    updateTrayPositions() {
        const tb = this.trayBounds;
        const slotWidth = tb.itemSize * 1.25;
        const visiblePieces = this.getTrayPieces();

        visiblePieces.forEach((p, idx) => {
            if (p !== this.draggedPiece) {
                p.x = tb.x + 20 + idx * slotWidth - this.trayScrollX;
                p.y = tb.y + (tb.height - this.boardBounds.tileSize) / 2;
            }
        });
        this.updateTrayScrollBounds();
    }

    render() {
        if (!this.canvas || !this.ctx) return;
        const w = this.canvas.width / (window.devicePixelRatio || 1);
        const h = this.canvas.height / (window.devicePixelRatio || 1);
        this.ctx.clearRect(0, 0, w, h);

        const bb = this.boardBounds;
        const tb = this.trayBounds;
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

        // 1. BOARD TABLE MAT (SOLID FLAT COLORS, NO GRADIENTS)
        this.ctx.save();
        this.ctx.fillStyle = isDark ? '#131b2e' : '#f8fafc';
        this.ctx.strokeStyle = isDark ? '#27354f' : '#cbd5e1';
        this.ctx.lineWidth = 1.5;

        // Rounded rect board mat
        this.roundRect(this.ctx, bb.x - 6, bb.y - 6, bb.width + 12, bb.height + 12, 12);
        this.ctx.fill();
        this.ctx.stroke();

        // Ghost image preview on board
        if (this.showGhost && this.image) {
            this.ctx.globalAlpha = this.ghostOpacity;
            this.ctx.drawImage(this.image, bb.x, bb.y, bb.width, bb.height);
            this.ctx.globalAlpha = 1.0;
        }

        // Target grid slots outline
        this.ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.07)';
        this.ctx.lineWidth = 1;
        for (let i = 1; i < this.size; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(bb.x + i * bb.tileSize, bb.y);
            this.ctx.lineTo(bb.x + i * bb.tileSize, bb.y + bb.height);
            this.ctx.stroke();

            this.ctx.beginPath();
            this.ctx.moveTo(bb.x, bb.y + i * bb.tileSize);
            this.ctx.lineTo(bb.x + bb.width, bb.y + i * bb.tileSize);
            this.ctx.stroke();
        }
        this.ctx.restore();

        // 2. PIECE TRAY (SOLID FLAT COLOR, NO GRADIENTS)
        this.ctx.save();
        this.ctx.fillStyle = isDark ? '#0b0f19' : '#f1f5f9';
        this.ctx.strokeStyle = isDark ? '#27354f' : '#cbd5e1';
        this.ctx.lineWidth = 1.5;

        this.roundRect(this.ctx, tb.x, tb.y, tb.width, tb.height, 12);
        this.ctx.fill();
        this.ctx.stroke();

        // Tray Title & Count Badge
        this.ctx.fillStyle = isDark ? '#94a3b8' : '#475569';
        this.ctx.font = '600 11px -apple-system, BlinkMacSystemFont, sans-serif';
        const trayPieces = this.getTrayPieces();
        this.ctx.fillText(`JAVON: ${trayPieces.length} BOʻLAK QOLDI`, tb.x + 16, tb.y + 18);

        // Tray Scroll Indicators (if scrollable)
        const accentCol = isDark ? '#3b82f6' : '#2563eb';
        if (this.trayScrollX > 5) {
            this.ctx.fillStyle = accentCol;
            this.ctx.fillText('◀', tb.x + tb.width - 45, tb.y + 18);
        }
        if (this.trayScrollX < this.maxTrayScrollX - 5) {
            this.ctx.fillStyle = accentCol;
            this.ctx.fillText('▶', tb.x + tb.width - 25, tb.y + 18);
        }

        // Clip tray contents so scrolled pieces don't leak outside tray border
        this.ctx.beginPath();
        this.roundRect(this.ctx, tb.x + 4, tb.y + 24, tb.width - 8, tb.height - 28, 12);
        this.ctx.clip();

        // Draw Tray Pieces
        trayPieces.forEach(p => {
            if (p !== this.draggedPiece) {
                this.drawPiece(p, false, 0.9);
            }
        });
        this.ctx.restore();

        // 3. TABLE PIECES & LOCKED BOARD PIECES
        // Locked pieces first
        this.pieces.filter(p => p.state === 'locked').forEach(p => {
            this.drawPiece(p, false, 1.0);
        });

        // Loose table pieces
        this.pieces.filter(p => p.state === 'table' && p !== this.draggedPiece).forEach(p => {
            this.drawPiece(p, true, 1.0);
        });

        // 4. CURRENTLY DRAGGED PIECE
        if (this.draggedPiece) {
            const dist = Math.hypot(this.draggedPiece.x - this.draggedPiece.targetX, this.draggedPiece.y - this.draggedPiece.targetY);
            if (dist < bb.tileSize * 0.45) {
                this.ctx.save();
                this.ctx.strokeStyle = isDark ? '#3b82f6' : '#2563eb';
                this.ctx.lineWidth = 2;
                this.ctx.strokeRect(this.draggedPiece.targetX, this.draggedPiece.targetY, bb.tileSize, bb.tileSize);
                this.ctx.restore();
            }

            this.drawPiece(this.draggedPiece, true, 1.05);
        }

        // 5. DRAW SPARKLE PARTICLES
        this.updateAndDrawSparkles();
    }

    drawPiece(p, hasShadow = false, scale = 1.0) {
        this.ctx.save();
        const ts = this.boardBounds.tileSize;
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

        // Position
        this.ctx.translate(p.x, p.y);

        if (scale !== 1.0) {
            this.ctx.translate(ts / 2, ts / 2);
            this.ctx.scale(scale, scale);
            this.ctx.translate(-ts / 2, -ts / 2);
        }

        if (p.rotation !== 0) {
            this.ctx.translate(ts / 2, ts / 2);
            this.ctx.rotate((p.rotation * Math.PI) / 180);
            this.ctx.translate(-ts / 2, -ts / 2);
        }

        if (hasShadow) {
            this.ctx.shadowColor = isDark ? 'rgba(0, 0, 0, 0.45)' : 'rgba(0, 0, 0, 0.12)';
            this.ctx.shadowBlur = (p === this.draggedPiece) ? 12 : 6;
            this.ctx.shadowOffsetX = 0;
            this.ctx.shadowOffsetY = (p === this.draggedPiece) ? 6 : 2;
        }

        this.ctx.drawImage(p.canvas, -p.pad, -p.pad);
        this.ctx.restore();
    }

    roundRect(ctx, x, y, width, height, radius) {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
    }

    setupEvents() {
        const getPos = (e) => {
            const rect = this.canvas.getBoundingClientRect();
            let clientX, clientY;
            if (e.touches && e.touches.length > 0) {
                clientX = e.touches[0].clientX;
                clientY = e.touches[0].clientY;
            } else if (e.changedTouches && e.changedTouches.length > 0) {
                clientX = e.changedTouches[0].clientX;
                clientY = e.changedTouches[0].clientY;
            } else {
                clientX = e.clientX;
                clientY = e.clientY;
            }
            return {
                x: clientX - rect.left,
                y: clientY - rect.top
            };
        };

        this.boundOnDown = (e) => {
            const pos = getPos(e);
            const ts = this.boardBounds.tileSize;
            const tb = this.trayBounds;

            // 1. Check if clicking unplaced table pieces first (highest z-order)
            const tablePieces = this.pieces.filter(p => p.state === 'table');
            for (let i = tablePieces.length - 1; i >= 0; i--) {
                const p = tablePieces[i];
                if (pos.x >= p.x && pos.x <= p.x + ts && pos.y >= p.y && pos.y <= p.y + ts) {
                    this.pickUpPiece(p, pos);
                    return;
                }
            }

            // 2. Check if clicking a piece inside the tray
            if (pos.y >= tb.y && pos.y <= tb.y + tb.height) {
                const trayPieces = this.getTrayPieces();
                for (let i = trayPieces.length - 1; i >= 0; i--) {
                    const p = trayPieces[i];
                    if (pos.x >= p.x && pos.x <= p.x + ts && pos.y >= p.y && pos.y <= p.y + ts) {
                        this.pickUpPiece(p, pos);
                        p.state = 'table';
                        this.updateTrayPositions();
                        return;
                    }
                }
            }
        };

        this.boundOnMove = (e) => {
            if (!this.draggedPiece) return;
            const pos = getPos(e);
            this.draggedPiece.x = pos.x - this.dragOffset.x;
            this.draggedPiece.y = pos.y - this.dragOffset.y;
            this.render();
        };

        this.boundOnUp = () => {
            if (!this.draggedPiece) return;
            const p = this.draggedPiece;
            this.draggedPiece = null;
            this.canvas.style.cursor = 'grab';
            this.moves++;

            const ts = this.boardBounds.tileSize;
            const tb = this.trayBounds;

            // Magnetic snap check
            const dist = Math.hypot(p.x - p.targetX, p.y - p.targetY);
            const snapThreshold = ts * 0.42;

            if (dist < snapThreshold && p.rotation % 360 === 0) {
                // MAGNETIC SNAP SUCCESS!
                p.x = p.targetX;
                p.y = p.targetY;
                p.state = 'locked';
                p.isLocked = true;
                window.soundEngine.playSnap();

                // Spawn victory sparkle burst at snap point
                this.spawnSnapSparkles(p.targetX + ts / 2, p.targetY + ts / 2);
                this.notifyProgress();
                this.checkVictory();
            } else if (p.y + ts * 0.5 > tb.y) {
                // Dropped back into the tray area!
                p.state = 'tray';
                window.soundEngine.playClick();
                this.updateTrayPositions();
            } else {
                // Dropped onto table area
                p.state = 'table';
                window.soundEngine.playSlide();
            }

            this.render();
        };

        // Tray mouse wheel horizontal scroll
        this.boundWheel = (e) => {
            const pos = getPos(e);
            const tb = this.trayBounds;
            if (pos.y >= tb.y && pos.y <= tb.y + tb.height) {
                e.preventDefault();
                this.trayScrollX += (e.deltaY || e.deltaX) * 0.8;
                this.updateTrayPositions();
                this.render();
            }
        };

        // Right-click or double-click to rotate
        this.canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            if (!this.allowRotation) return;
            const pos = getPos(e);
            const ts = this.boardBounds.tileSize;
            const p = this.pieces.find(pc => pc.state !== 'locked' && pos.x >= pc.x && pos.x <= pc.x + ts && pos.y >= pc.y && pos.y <= pc.y + ts);
            if (p) {
                p.rotation = (p.rotation + 90) % 360;
                window.soundEngine.playRotate();
                this.render();
            }
        });

        this.canvas.addEventListener('mousedown', this.boundOnDown);
        window.addEventListener('mousemove', this.boundOnMove);
        window.addEventListener('mouseup', this.boundOnUp);
        this.canvas.addEventListener('wheel', this.boundWheel, { passive: false });

        this.canvas.addEventListener('touchstart', this.boundOnDown, { passive: false });
        window.addEventListener('touchmove', this.boundOnMove, { passive: false });
        window.addEventListener('touchend', this.boundOnUp);

        this.boundResize = () => {
            this.resize();
            this.updateTrayPositions();
            this.render();
        };
        window.addEventListener('resize', this.boundResize);
    }

    pickUpPiece(p, pos) {
        this.draggedPiece = p;
        this.dragOffset.x = pos.x - p.x;
        this.dragOffset.y = pos.y - p.y;
        this.canvas.style.cursor = 'grabbing';
        window.soundEngine.playClick();
        this.render();
    }

    spawnSnapSparkles(x, y) {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        const colors = isDark ? ['#3b82f6', '#f59e0b', '#22c55e'] : ['#2563eb', '#d97706', '#16a34a'];
        for (let i = 0; i < 16; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 2 + Math.random() * 4;
            this.sparkles.push({
                x,
                y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                color: colors[Math.floor(Math.random() * colors.length)],
                size: 2 + Math.random() * 2.5,
                alpha: 1,
                decay: 0.04 + Math.random() * 0.02
            });
        }
    }

    updateAndDrawSparkles() {
        if (this.sparkles.length === 0) return;

        for (let i = this.sparkles.length - 1; i >= 0; i--) {
            const s = this.sparkles[i];
            s.x += s.vx;
            s.y += s.vy;
            s.alpha -= s.decay;

            if (s.alpha <= 0) {
                this.sparkles.splice(i, 1);
                continue;
            }

            this.ctx.save();
            this.ctx.globalAlpha = Math.max(0, s.alpha);
            this.ctx.fillStyle = s.color;
            this.ctx.beginPath();
            this.ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();
        }

        if (this.sparkles.length > 0) {
            requestAnimationFrame(() => this.render());
        }
    }
            this.ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();
        }

        if (this.sparkles.length > 0) {
            requestAnimationFrame(() => this.render());
        }
    }

    // Toggle Edge pieces only in tray
    toggleEdgeFilter() {
        this.filterEdgesOnly = !this.filterEdgesOnly;
        this.trayScrollX = 0;
        this.updateTrayPositions();
        this.render();
        return this.filterEdgesOnly;
    }

    // Send all loose table pieces back to the tray
    cleanupToTray() {
        this.pieces.forEach(p => {
            if (p.state === 'table') {
                p.state = 'tray';
            }
        });
        this.updateTrayPositions();
        this.render();
    }

    setGhostOpacity(val) {
        this.ghostOpacity = Math.max(0, Math.min(1, val));
        this.showGhost = this.ghostOpacity > 0.02;
        this.render();
    }

    scrollTray(delta) {
        this.trayScrollX += delta;
        this.updateTrayPositions();
        this.render();
    }

    hint() {
        const unplaced = this.pieces.filter(p => p.state !== 'locked');
        if (unplaced.length === 0) return;

        // Pick first unplaced piece and magnetically fly it home
        const p = unplaced[0];
        p.state = 'locked';
        p.isLocked = true;
        this.updateTrayPositions();

        this.animatePieceTo(p, p.targetX, p.targetY, 0, () => {
            window.soundEngine.playSnap();
            this.spawnSnapSparkles(p.targetX + this.boardBounds.tileSize / 2, p.targetY + this.boardBounds.tileSize / 2);
            this.notifyProgress();
            this.checkVictory();
        });
    }

    autoSolve() {
        const unplaced = this.pieces.filter(p => p.state !== 'locked');
        if (unplaced.length === 0) return;

        let idx = 0;
        const interval = setInterval(() => {
            if (this.isDestroyed || idx >= unplaced.length) {
                clearInterval(interval);
                return;
            }
            const p = unplaced[idx];
            p.state = 'locked';
            p.isLocked = true;
            p.x = p.targetX;
            p.y = p.targetY;
            p.rotation = 0;
            this.moves++;
            window.soundEngine.playSnap();
            this.spawnSnapSparkles(p.targetX + this.boardBounds.tileSize / 2, p.targetY + this.boardBounds.tileSize / 2);
            this.updateTrayPositions();
            this.notifyProgress();
            this.render();
            idx++;

            if (idx >= unplaced.length) {
                clearInterval(interval);
                this.checkVictory();
            }
        }, 150);
    }

    animatePieceTo(piece, targetX, targetY, targetRot, onComplete) {
        const startX = piece.x;
        const startY = piece.y;
        const startRot = piece.rotation;
        const startTime = performance.now();
        const duration = 380;

        const step = (now) => {
            if (this.isDestroyed) return;
            const elapsed = now - startTime;
            const progress = Math.min(1, elapsed / duration);
            const ease = 1 - Math.pow(1 - progress, 3);

            piece.x = startX + (targetX - startX) * ease;
            piece.y = startY + (targetY - startY) * ease;
            piece.rotation = startRot + (targetRot - startRot) * ease;

            this.render();

            if (progress < 1) {
                requestAnimationFrame(step);
            } else {
                piece.x = targetX;
                piece.y = targetY;
                piece.rotation = targetRot;
                this.render();
                if (onComplete) onComplete();
            }
        };
        requestAnimationFrame(step);
    }

    notifyProgress() {
        const lockedCount = this.pieces.filter(p => p.state === 'locked').length;
        const total = this.pieces.length;
        const percent = Math.round((lockedCount / total) * 100);

        if (this.onProgress) {
            this.onProgress({
                locked: lockedCount,
                total,
                percent
            });
        }
    }

    checkVictory() {
        const allLocked = this.pieces.every(p => p.state === 'locked');
        if (allLocked) {
            this.stopTimer();
            window.soundEngine.playWin();
            window.particleEngine.fireVictoryConfetti();
            if (this.onWin) {
                this.onWin({
                    mode: 'jigsaw',
                    size: this.size,
                    moves: this.moves,
                    time: this.elapsedSeconds
                });
            }
        }
    }

    destroy() {
        this.isDestroyed = true;
        this.stopTimer();
        if (this.boundOnDown && this.canvas) {
            this.canvas.removeEventListener('mousedown', this.boundOnDown);
            this.canvas.removeEventListener('touchstart', this.boundOnDown);
            this.canvas.removeEventListener('wheel', this.boundWheel);
        }
        if (this.boundOnMove) {
            window.removeEventListener('mousemove', this.boundOnMove);
            window.removeEventListener('mouseup', this.boundOnUp);
            window.removeEventListener('touchmove', this.boundOnMove);
            window.removeEventListener('touchend', this.boundOnUp);
        }
        if (this.boundResize) {
            window.removeEventListener('resize', this.boundResize);
        }
    }
}

window.JigsawGame = JigsawGame;
