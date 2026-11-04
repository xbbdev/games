// Picture / Tile Swap Puzzle Engine with Interactive Drag & Drop and Click Support

class SwapGame {
    constructor(container, onWinCallback, onMoveCallback) {
        this.container = container;
        this.onWin = onWinCallback;
        this.onMove = onMoveCallback;

        this.size = 4;
        this.grid = [];
        this.selectedTileIdx = null;
        this.moves = 0;
        this.startTime = null;
        this.timerInterval = null;
        this.elapsedSeconds = 0;
        this.imageUrl = null;
        this.showNumbers = true;

        // Dragging state
        this.draggedTileIdx = null;
        this.draggedTileElement = null;
        this.hoveredTileIdx = null;

        this.boundPointerMove = null;
        this.boundPointerUp = null;

        this.setupDragAndDrop();
    }

    init(size = 4, imageUrl = null) {
        this.size = size;
        this.imageUrl = imageUrl;
        this.moves = 0;
        this.selectedTileIdx = null;
        this.elapsedSeconds = 0;
        this.stopTimer();

        const total = size * size;
        this.grid = Array.from({ length: total }, (_, i) => i);

        do {
            for (let i = this.grid.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [this.grid[i], this.grid[j]] = [this.grid[j], this.grid[i]];
            }
        } while (this.isSolved());

        this.render();
        this.startTimer();
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

    isSolved() {
        return this.grid.every((val, idx) => val === idx);
    }

    render() {
        this.container.innerHTML = '';
        this.container.className = `puzzle-grid swap-grid size-${this.size}`;
        this.container.style.gridTemplateColumns = `repeat(${this.size}, 1fr)`;
        this.container.style.gridTemplateRows = `repeat(${this.size}, 1fr)`;

        this.grid.forEach((targetIdx, currentIdx) => {
            const tile = document.createElement('div');
            tile.className = 'puzzle-tile swap-tile';
            tile.dataset.index = currentIdx;

            const isCorrect = (targetIdx === currentIdx);
            if (isCorrect) {
                tile.classList.add('in-place');
            }

            if (this.selectedTileIdx === currentIdx) {
                tile.classList.add('selected');
            }

            if (this.imageUrl) {
                tile.classList.add('has-image');
                const targetRow = Math.floor(targetIdx / this.size);
                const targetCol = targetIdx % this.size;

                tile.style.backgroundImage = `url(${this.imageUrl})`;
                tile.style.backgroundSize = `${this.size * 100}% ${this.size * 100}%`;
                const bgX = (targetCol / (this.size - 1)) * 100;
                const bgY = (targetRow / (this.size - 1)) * 100;
                tile.style.backgroundPosition = `${bgX}% ${bgY}%`;
            }

            const label = document.createElement('span');
            label.className = 'tile-number';
            label.textContent = targetIdx + 1;
            if (!this.showNumbers && this.imageUrl) {
                label.style.display = 'none';
            }
            tile.appendChild(label);

            this.container.appendChild(tile);
        });

        if (this.onMove) {
            this.onMove({ moves: this.moves, time: this.elapsedSeconds });
        }
    }

    setupDragAndDrop() {
        let startX = 0, startY = 0;
        let isDragStarted = false;

        const onDown = (e) => {
            const tile = e.target.closest('.swap-tile');
            if (!tile) return;

            const index = parseInt(tile.dataset.index, 10);
            this.draggedTileIdx = index;
            this.draggedTileElement = tile;
            startX = e.clientX || (e.touches && e.touches[0].clientX);
            startY = e.clientY || (e.touches && e.touches[0].clientY);
            isDragStarted = false;
        };

        this.boundPointerMove = (e) => {
            if (this.draggedTileIdx === null || !this.draggedTileElement) return;

            const curX = e.clientX || (e.touches && e.touches[0].clientX);
            const curY = e.clientY || (e.touches && e.touches[0].clientY);
            const dx = curX - startX;
            const dy = curY - startY;

            if (!isDragStarted && Math.hypot(dx, dy) > 8) {
                isDragStarted = true;
                this.draggedTileElement.style.zIndex = '100';
                this.draggedTileElement.style.transition = 'none';
                this.draggedTileElement.classList.add('selected');
                window.soundEngine.playClick();
            }

            if (isDragStarted) {
                this.draggedTileElement.style.transform = `translate3d(${dx}px, ${dy}px, 0) scale(1.08)`;

                // Hit test tile under cursor
                const elUnder = document.elementFromPoint(curX, curY);
                const targetTile = elUnder ? elUnder.closest('.swap-tile') : null;

                document.querySelectorAll('.swap-tile.drop-hover').forEach(el => el.classList.remove('drop-hover'));

                if (targetTile && targetTile !== this.draggedTileElement) {
                    targetTile.classList.add('drop-hover');
                    this.hoveredTileIdx = parseInt(targetTile.dataset.index, 10);
                } else {
                    this.hoveredTileIdx = null;
                }
            }
        };

        this.boundPointerUp = () => {
            if (this.draggedTileIdx === null) return;

            const srcIdx = this.draggedTileIdx;
            const destIdx = this.hoveredTileIdx;
            const el = this.draggedTileElement;

            document.querySelectorAll('.swap-tile.drop-hover').forEach(el => el.classList.remove('drop-hover'));

            if (isDragStarted && destIdx !== null && destIdx !== srcIdx) {
                // Drop and Swap!
                if (el) {
                    el.style.transform = '';
                    el.style.zIndex = '';
                    el.classList.remove('selected');
                }
                this.executeSwap(srcIdx, destIdx);
            } else if (isDragStarted) {
                // Cancel drag spring back
                if (el) {
                    el.style.transition = 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)';
                    el.style.transform = 'translate3d(0, 0, 0)';
                    setTimeout(() => {
                        el.style.transition = '';
                        el.style.zIndex = '';
                        el.classList.remove('selected');
                    }, 200);
                }
            } else {
                // Simple Click Toggle
                this.handleClick(srcIdx);
            }

            this.draggedTileIdx = null;
            this.draggedTileElement = null;
            this.hoveredTileIdx = null;
            isDragStarted = false;
        };

        this.container.addEventListener('mousedown', onDown);
        window.addEventListener('mousemove', this.boundPointerMove);
        window.addEventListener('mouseup', this.boundPointerUp);

        this.container.addEventListener('touchstart', onDown, { passive: false });
        window.addEventListener('touchmove', this.boundPointerMove, { passive: false });
        window.addEventListener('touchend', this.boundPointerUp);
    }

    handleClick(index) {
        if (this.selectedTileIdx === null) {
            this.selectedTileIdx = index;
            window.soundEngine.playClick();
            this.render();
        } else if (this.selectedTileIdx === index) {
            this.selectedTileIdx = null;
            window.soundEngine.playClick();
            this.render();
        } else {
            const idx1 = this.selectedTileIdx;
            const idx2 = index;
            this.selectedTileIdx = null;
            this.executeSwap(idx1, idx2);
        }
    }

    executeSwap(idx1, idx2) {
        [this.grid[idx1], this.grid[idx2]] = [this.grid[idx2], this.grid[idx1]];
        this.moves++;
        window.soundEngine.playSlide();
        this.render();

        if (this.isSolved()) {
            this.stopTimer();
            window.soundEngine.playWin();
            window.particleEngine.fireVictoryConfetti();
            if (this.onWin) {
                this.onWin({
                    mode: 'swap',
                    size: this.size,
                    moves: this.moves,
                    time: this.elapsedSeconds
                });
            }
        }
    }

    hint() {
        if (this.isSolved()) return;
        for (let i = 0; i < this.grid.length; i++) {
            if (this.grid[i] !== i) {
                const targetHome = this.grid.indexOf(i);
                const t1 = this.container.children[i];
                const t2 = this.container.children[targetHome];
                if (t1 && t2) {
                    t1.classList.add('hint-glow');
                    t2.classList.add('hint-glow');
                    window.soundEngine.playSnap();
                    setTimeout(() => {
                        t1.classList.remove('hint-glow');
                        t2.classList.remove('hint-glow');
                    }, 1200);
                }
                break;
            }
        }
    }

    autoSolve() {
        if (this.isSolved()) return;

        const interval = setInterval(() => {
            let swapped = false;
            for (let i = 0; i < this.grid.length; i++) {
                if (this.grid[i] !== i) {
                    const targetHome = this.grid.indexOf(i);
                    [this.grid[i], this.grid[targetHome]] = [this.grid[targetHome], this.grid[i]];
                    this.moves++;
                    window.soundEngine.playSlide();
                    this.render();
                    swapped = true;
                    break;
                }
            }

            if (!swapped || this.isSolved()) {
                clearInterval(interval);
                this.stopTimer();
                window.soundEngine.playWin();
                window.particleEngine.fireVictoryConfetti();
                if (this.onWin) {
                    this.onWin({
                        mode: 'swap',
                        size: this.size,
                        moves: this.moves,
                        time: this.elapsedSeconds
                    });
                }
            }
        }, 200);
    }

    toggleNumbers() {
        this.showNumbers = !this.showNumbers;
        this.render();
        return this.showNumbers;
    }

    destroy() {
        this.stopTimer();
        if (this.boundPointerMove) {
            window.removeEventListener('mousemove', this.boundPointerMove);
            window.removeEventListener('mouseup', this.boundPointerUp);
            window.removeEventListener('touchmove', this.boundPointerMove);
            window.removeEventListener('touchend', this.boundPointerUp);
        }
    }
}

window.SwapGame = SwapGame;
