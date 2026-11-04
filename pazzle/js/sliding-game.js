// Sliding Puzzle Game Controller with Continuous Physical Pointer Drag & Drop,
// Keyboard Arrow Controls, Multi-Tile Push, Undo, and A* Auto-Solver

class SlidingGame {
    constructor(container, onWinCallback, onMoveCallback) {
        this.container = container;
        this.onWin = onWinCallback;
        this.onMove = onMoveCallback;

        this.size = 4;
        this.grid = [];
        this.moves = 0;
        this.startTime = null;
        this.timerInterval = null;
        this.elapsedSeconds = 0;
        this.isSolving = false;
        this.autoSolveTimer = null;
        this.history = [];
        this.imageUrl = null;
        this.showNumbers = true;
        this.difficulty = 'hard';

        // Dragging state
        this.isDragging = false;
        this.dragTileIndex = null;
        this.dragTileElement = null;
        this.dragStartX = 0;
        this.dragStartY = 0;
        this.dragDirection = null; // 'x' or 'y'
        this.dragDelta = 0;
        this.dragLimit = 0;
        this.blankIndex = null;

        this.keyHandler = null;
        this.boundPointerMove = null;
        this.boundPointerUp = null;

        this.setupKeyboard();
        this.setupPointerDragging();
    }

    init(size = 4, imageUrl = null, difficulty = 'hard') {
        this.stopAutoSolve();
        this.size = size;
        this.difficulty = difficulty;
        this.imageUrl = imageUrl;
        this.moves = 0;
        this.history = [];
        this.elapsedSeconds = 0;
        this.stopTimer();

        this.grid = SlidingSolver.generateSolvableGrid(this.size, this.difficulty);
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

    render() {
        this.container.innerHTML = '';
        this.container.className = `puzzle-grid size-${this.size}`;
        this.container.style.gridTemplateColumns = `repeat(${this.size}, 1fr)`;
        this.container.style.gridTemplateRows = `repeat(${this.size}, 1fr)`;

        this.grid.forEach((value, index) => {
            const tile = document.createElement('div');
            tile.className = 'puzzle-tile';
            tile.dataset.index = index;
            tile.dataset.value = value;

            if (value === 0) {
                tile.classList.add('empty');
            } else {
                if (value === index + 1) {
                    tile.classList.add('in-place');
                }

                if (this.imageUrl) {
                    tile.classList.add('has-image');
                    const targetIdx = value - 1;
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
                label.textContent = value;
                if (!this.showNumbers && this.imageUrl) {
                    label.style.display = 'none';
                }
                tile.appendChild(label);
            }

            this.container.appendChild(tile);
        });

        if (this.onMove) {
            this.onMove({ moves: this.moves, time: this.elapsedSeconds });
        }
    }

    // Physical continuous drag & drop
    setupPointerDragging() {
        const onPointerDown = (e) => {
            if (this.isSolving) return;
            const targetTile = e.target.closest('.puzzle-tile');
            if (!targetTile || targetTile.classList.contains('empty')) return;

            const index = parseInt(targetTile.dataset.index, 10);
            const blankIdx = this.grid.indexOf(0);
            if (blankIdx === -1) return;

            const tileRow = Math.floor(index / this.size);
            const tileCol = index % this.size;
            const blankRow = Math.floor(blankIdx / this.size);
            const blankCol = blankIdx % this.size;

            // Check if movable (same row or same col as blank)
            if (tileRow !== blankRow && tileCol !== blankCol) {
                window.soundEngine.playError();
                this.shakeTile(index);
                return;
            }

            this.isDragging = true;
            this.dragTileIndex = index;
            this.dragTileElement = targetTile;
            this.blankIndex = blankIdx;
            this.dragStartX = e.clientX || (e.touches && e.touches[0].clientX);
            this.dragStartY = e.clientY || (e.touches && e.touches[0].clientY);
            this.dragDelta = 0;

            const rect = targetTile.getBoundingClientRect();
            if (tileRow === blankRow) {
                this.dragDirection = 'x';
                // Drag distance limit is the gap to the blank
                const colsDist = blankCol - tileCol;
                this.dragLimit = colsDist * (rect.width + 6); // tile size + gap
            } else {
                this.dragDirection = 'y';
                const rowsDist = blankRow - tileRow;
                this.dragLimit = rowsDist * (rect.height + 6);
            }

            targetTile.style.transition = 'none';
            targetTile.style.zIndex = '10';
        };

        this.boundPointerMove = (e) => {
            if (!this.isDragging || !this.dragTileElement) return;

            const currentX = e.clientX || (e.touches && e.touches[0].clientX);
            const currentY = e.clientY || (e.touches && e.touches[0].clientY);

            if (this.dragDirection === 'x') {
                let dx = currentX - this.dragStartX;
                if (this.dragLimit > 0) {
                    dx = Math.max(0, Math.min(dx, this.dragLimit));
                } else {
                    dx = Math.min(0, Math.max(dx, this.dragLimit));
                }
                this.dragDelta = dx;
                this.dragTileElement.style.transform = `translate3d(${dx}px, 0, 0) scale(1.03)`;
            } else {
                let dy = currentY - this.dragStartY;
                if (this.dragLimit > 0) {
                    dy = Math.max(0, Math.min(dy, this.dragLimit));
                } else {
                    dy = Math.min(0, Math.max(dy, this.dragLimit));
                }
                this.dragDelta = dy;
                this.dragTileElement.style.transform = `translate3d(0, ${dy}px, 0) scale(1.03)`;
            }
        };

        this.boundPointerUp = () => {
            if (!this.isDragging || !this.dragTileElement) return;

            const tileEl = this.dragTileElement;
            const index = this.dragTileIndex;
            const ratio = Math.abs(this.dragDelta) / (Math.abs(this.dragLimit) || 1);

            this.isDragging = false;
            this.dragTileElement = null;

            // If dragged more than 35% towards blank (or tapped with minimal movement)
            if (ratio >= 0.35 || Math.abs(this.dragDelta) < 6) {
                tileEl.style.transform = '';
                tileEl.style.transition = '';
                tileEl.style.zIndex = '';
                this.handleTileClick(index);
            } else {
                // Spring back
                tileEl.style.transition = 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)';
                tileEl.style.transform = 'translate3d(0, 0, 0)';
                setTimeout(() => {
                    tileEl.style.transition = '';
                    tileEl.style.zIndex = '';
                }, 200);
            }
        };

        this.container.addEventListener('mousedown', onPointerDown);
        window.addEventListener('mousemove', this.boundPointerMove);
        window.addEventListener('mouseup', this.boundPointerUp);

        this.container.addEventListener('touchstart', onPointerDown, { passive: false });
        window.addEventListener('touchmove', this.boundPointerMove, { passive: false });
        window.addEventListener('touchend', this.boundPointerUp);
    }

    handleTileClick(index) {
        const blankIdx = this.grid.indexOf(0);
        if (blankIdx === -1) return;

        const tileRow = Math.floor(index / this.size);
        const tileCol = index % this.size;
        const blankRow = Math.floor(blankIdx / this.size);
        const blankCol = blankIdx % this.size;

        if (tileRow === blankRow) {
            const step = tileCol < blankCol ? 1 : -1;
            this.pushLineHorizontal(tileRow, blankCol, tileCol, step);
        } else if (tileCol === blankCol) {
            const step = tileRow < blankRow ? 1 : -1;
            this.pushLineVertical(tileCol, blankRow, tileRow, step);
        } else {
            window.soundEngine.playError();
            this.shakeTile(index);
        }
    }

    pushLineHorizontal(row, blankCol, targetCol, step) {
        this.history.push([...this.grid]);
        let currCol = blankCol;
        while (currCol !== targetCol) {
            const nextCol = currCol - step;
            const idx1 = row * this.size + currCol;
            const idx2 = row * this.size + nextCol;
            this.grid[idx1] = this.grid[idx2];
            currCol = nextCol;
        }
        this.grid[row * this.size + targetCol] = 0;
        this.onSuccessfulMove();
    }

    pushLineVertical(col, blankRow, targetRow, step) {
        this.history.push([...this.grid]);
        let currRow = blankRow;
        while (currRow !== targetRow) {
            const nextRow = currRow - step;
            const idx1 = currRow * this.size + col;
            const idx2 = nextRow * this.size + col;
            this.grid[idx1] = this.grid[idx2];
            currRow = nextRow;
        }
        this.grid[targetRow * this.size + col] = 0;
        this.onSuccessfulMove();
    }

    onSuccessfulMove() {
        this.moves++;
        window.soundEngine.playSlide();
        this.render();

        if (SlidingSolver.isSolved(this.grid)) {
            this.handleVictory();
        }
    }

    undo() {
        if (this.history.length === 0 || this.isSolving) return false;
        this.grid = this.history.pop();
        this.moves = Math.max(0, this.moves - 1);
        window.soundEngine.playSlide();
        this.render();
        return true;
    }

    shakeTile(index) {
        const tile = this.container.children[index];
        if (tile) {
            tile.classList.add('shake');
            setTimeout(() => tile.classList.remove('shake'), 300);
        }
    }

    hint() {
        if (this.isSolving) return;
        const bestIdx = SlidingSolver.getNextBestMove(this.grid, this.size);
        if (bestIdx !== null && bestIdx !== undefined) {
            const tile = this.container.children[bestIdx];
            if (tile) {
                tile.classList.add('hint-glow');
                window.soundEngine.playSnap();
                setTimeout(() => tile.classList.remove('hint-glow'), 1200);
            }
        }
    }

    autoSolve() {
        if (this.isSolving) {
            this.stopAutoSolve();
            return;
        }

        if (this.size > 4) {
            this.isSolving = true;
            this.stepHeuristicSolve();
            return;
        }

        this.isSolving = true;
        const solutionMoves = SlidingSolver.solveAStar3x3(this.grid);

        if (solutionMoves && solutionMoves.length > 0) {
            let step = 0;
            const intervalTime = Math.max(120, 320 - solutionMoves.length * 5);
            this.autoSolveTimer = setInterval(() => {
                if (step >= solutionMoves.length || !this.isSolving) {
                    this.stopAutoSolve();
                    return;
                }
                const move = solutionMoves[step];
                const blankIdx = this.grid.indexOf(0);
                const tileIdx = this.grid.indexOf(move.tileValue);

                if (tileIdx !== -1) {
                    this.grid[blankIdx] = move.tileValue;
                    this.grid[tileIdx] = 0;
                    this.moves++;
                    window.soundEngine.playSlide();
                    this.render();
                }

                step++;
                if (SlidingSolver.isSolved(this.grid)) {
                    this.stopAutoSolve();
                    this.handleVictory();
                }
            }, intervalTime);
        } else {
            this.stepHeuristicSolve();
        }
    }

    stepHeuristicSolve() {
        let maxSteps = 120;
        let count = 0;
        this.autoSolveTimer = setInterval(() => {
            if (!this.isSolving || count >= maxSteps || SlidingSolver.isSolved(this.grid)) {
                this.stopAutoSolve();
                if (SlidingSolver.isSolved(this.grid)) {
                    this.handleVictory();
                }
                return;
            }

            const bestIdx = SlidingSolver.getNextBestMove(this.grid, this.size);
            if (bestIdx !== null) {
                const blankIdx = this.grid.indexOf(0);
                this.grid[blankIdx] = this.grid[bestIdx];
                this.grid[bestIdx] = 0;
                this.moves++;
                window.soundEngine.playSlide();
                this.render();
            } else {
                this.stopAutoSolve();
            }
            count++;
        }, 180);
    }

    stopAutoSolve() {
        this.isSolving = false;
        if (this.autoSolveTimer) {
            clearInterval(this.autoSolveTimer);
            this.autoSolveTimer = null;
        }
    }

    handleVictory() {
        this.stopTimer();
        window.soundEngine.playWin();
        window.particleEngine.fireVictoryConfetti();

        if (this.imageUrl) {
            const lastTile = this.container.querySelector('.puzzle-tile.empty');
            if (lastTile) {
                lastTile.classList.remove('empty');
                lastTile.classList.add('has-image', 'in-place');
                lastTile.style.backgroundImage = `url(${this.imageUrl})`;
                lastTile.style.backgroundSize = `${this.size * 100}% ${this.size * 100}%`;
                lastTile.style.backgroundPosition = `100% 100%`;
            }
        }

        if (this.onWin) {
            this.onWin({
                mode: 'sliding',
                size: this.size,
                moves: this.moves,
                time: this.elapsedSeconds
            });
        }
    }

    toggleNumbers() {
        this.showNumbers = !this.showNumbers;
        const numbers = this.container.querySelectorAll('.tile-number');
        numbers.forEach(num => {
            num.style.display = (this.showNumbers || !this.imageUrl) ? 'flex' : 'none';
        });
        return this.showNumbers;
    }

    setupKeyboard() {
        this.keyHandler = (e) => {
            if (this.isSolving || this.container.offsetParent === null) return;
            const blankIdx = this.grid.indexOf(0);
            if (blankIdx === -1) return;

            const blankRow = Math.floor(blankIdx / this.size);
            const blankCol = blankIdx % this.size;
            let targetIdx = null;

            switch (e.key) {
                case 'ArrowUp':
                case 'w':
                case 'W':
                    if (blankRow < this.size - 1) targetIdx = (blankRow + 1) * this.size + blankCol;
                    break;
                case 'ArrowDown':
                case 's':
                case 'S':
                    if (blankRow > 0) targetIdx = (blankRow - 1) * this.size + blankCol;
                    break;
                case 'ArrowLeft':
                case 'a':
                case 'A':
                    if (blankCol < this.size - 1) targetIdx = blankRow * this.size + (blankCol + 1);
                    break;
                case 'ArrowRight':
                case 'd':
                case 'D':
                    if (blankCol > 0) targetIdx = blankRow * this.size + (blankCol - 1);
                    break;
            }

            if (targetIdx !== null) {
                e.preventDefault();
                this.handleTileClick(targetIdx);
            }
        };
        window.addEventListener('keydown', this.keyHandler);
    }

    destroy() {
        this.stopTimer();
        this.stopAutoSolve();
        if (this.keyHandler) {
            window.removeEventListener('keydown', this.keyHandler);
        }
        if (this.boundPointerMove) {
            window.removeEventListener('mousemove', this.boundPointerMove);
            window.removeEventListener('mouseup', this.boundPointerUp);
            window.removeEventListener('touchmove', this.boundPointerMove);
            window.removeEventListener('touchend', this.boundPointerUp);
        }
    }
}

window.SlidingGame = SlidingGame;
