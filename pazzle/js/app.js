// Main Application Controller & UI Orchestrator
// Coordinates Drag & Drop Jigsaw Studio, Sliding Puzzle, Swap Puzzle, and Campaign engines.

class App {
    constructor() {
        this.lang = 'uz';
        this.currentMode = 'jigsaw'; // Flagship default: Jigsaw Drag & Drop!
        this.currentSize = 4;
        this.currentArtId = 'ancient_mosaic';
        this.currentImageUrl = null;
        this.currentCampaignLevel = 1;
        this.activeGame = null;

        this.translations = {
            uz: {
                app_title: "PAZZLE MASTER",
                app_subtitle: "DRAG & DROP MUKAMMALLIK",
                tab_jigsaw: "🧩 Mozaika (Drag & Drop)",
                tab_campaign: "🏆 Bosqichlar",
                tab_sliding: "🔲 Suriluvchi Pazl",
                tab_swap: "🔄 Almashtirish",
                hud_level: "Rejim",
                hud_moves: "Qadamlar",
                hud_time: "Vaqt",
                hud_stars: "Yulduzlar",
                btn_restart: "🔄 Qayta boshlash",
                btn_hint: "💡 Maslahat",
                btn_solve: "🤖 Avto-yechish",
                btn_preview: "👁️ Asl rasm",
                btn_numbers: "🔢 Raqamlar",
                btn_undo: "↩️ Qaytish",
                btn_image: "🖼️ Rasm tanlash",
                btn_levels: "🏆 Bosqichlar",
                ghost_opacity: "👁️ Shaffoflik:",
                btn_edge_filter: "🧩 Faqat qirralar",
                btn_tray_clean: "📥 Javonga yigʻish",
                victory_title: "GʻALABA! MUKAMMAL!",
                victory_msg: "Pazl muvaffaqiyatli yigʻildi!",
                victory_next: "Keyingi bosqich ➔",
                victory_replay: "Qayta oʻynash",
                modal_choose_art: "Pazl uchun rasm tanlang",
                upload_prompt: "Oʻz suratingizni yuklang (JPG/PNG)",
                size_label: "Oʻlcham:",
                locked: "Qulflangan"
            },
            en: {
                app_title: "PUZZLE MASTER",
                app_subtitle: "DRAG & DROP PERFECTION",
                tab_jigsaw: "🧩 Jigsaw (Drag & Drop)",
                tab_campaign: "🏆 Campaign",
                tab_sliding: "🔲 Sliding Puzzle",
                tab_swap: "🔄 Tile Swap",
                hud_level: "Mode",
                hud_moves: "Moves",
                hud_time: "Time",
                hud_stars: "Stars",
                btn_restart: "🔄 Restart",
                btn_hint: "💡 Hint",
                btn_solve: "🤖 AI Solve",
                btn_preview: "👁️ Preview",
                btn_numbers: "🔢 Numbers",
                btn_undo: "↩️ Undo",
                btn_image: "🖼️ Change Art",
                btn_levels: "🏆 Levels",
                ghost_opacity: "👁️ Ghost:",
                btn_edge_filter: "🧩 Edges Only",
                btn_tray_clean: "📥 Send to Tray",
                victory_title: "VICTORY! PERFECT!",
                victory_msg: "Puzzle solved successfully!",
                victory_next: "Next Level ➔",
                victory_replay: "Play Again",
                modal_choose_art: "Select Puzzle Artwork",
                upload_prompt: "Upload your custom photo (JPG/PNG)",
                size_label: "Size:",
                locked: "Locked"
            },
            ru: {
                app_title: "МАСТЕР ПАЗЛОВ",
                app_subtitle: "DRAG & DROP СОВЕРШЕНСТВО",
                tab_jigsaw: "🧩 Мозаика (Drag & Drop)",
                tab_campaign: "🏆 Кампания",
                tab_sliding: "🔲 Пятнашки",
                tab_swap: "🔄 Обмен плиток",
                hud_level: "Режим",
                hud_moves: "Ходы",
                hud_time: "Время",
                hud_stars: "Звёзды",
                btn_restart: "🔄 Заново",
                btn_hint: "💡 Подсказка",
                btn_solve: "🤖 Авто-сборка",
                btn_preview: "👁️ Образец",
                btn_numbers: "🔢 Цифры",
                btn_undo: "↩️ Назад",
                btn_image: "🖼️ Выбрать арт",
                btn_levels: "🏆 Уровни",
                ghost_opacity: "👁️ Образец:",
                btn_edge_filter: "🧩 Только края",
                btn_tray_clean: "📥 Собрать в лоток",
                victory_title: "ПОБЕДА! ВЕЛИКОЛЕПНО!",
                victory_msg: "Головоломка успешно решена!",
                victory_next: "Следующий уровень ➔",
                victory_replay: "Играть снова",
                modal_choose_art: "Выберите изображение",
                upload_prompt: "Загрузить своё фото (JPG/PNG)",
                size_label: "Размер:",
                locked: "Закрыто"
            }
        };
    }

    t(key) {
        return (this.translations[this.lang] && this.translations[this.lang][key]) || key;
    }

    init() {
        this.cacheDOMElements();
        this.bindEvents();
        this.applyLanguage();
        this.setupTheme();

        // Start directly with Flagship Jigsaw mode
        this.switchMode('jigsaw');
    }

    cacheDOMElements() {
        this.boardContainer = document.getElementById('board-container');
        this.hudLevel = document.getElementById('hud-level-val');
        this.hudMoves = document.getElementById('hud-moves-val');
        this.hudTime = document.getElementById('hud-time-val');
        this.hudStarsContainer = document.getElementById('hud-stars');
        this.hudStarsGroup = document.getElementById('hud-stars-group');

        // Progress meter
        this.hudProgressWrap = document.getElementById('hud-progress-wrap');
        this.hudProgressText = document.getElementById('hud-progress-text');
        this.hudProgressFill = document.getElementById('hud-progress-fill');

        // Jigsaw sub-toolbar
        this.jigsawSubBar = document.getElementById('jigsaw-sub-bar');
        this.ghostSlider = document.getElementById('ghost-opacity-slider');
        this.ghostValText = document.getElementById('ghost-opacity-val');
        this.btnEdgeFilter = document.getElementById('btn-edge-filter');
        this.btnTrayClean = document.getElementById('btn-tray-clean');
        this.btnTrayLeft = document.getElementById('btn-tray-left');
        this.btnTrayRight = document.getElementById('btn-tray-right');

        // Controls
        this.btnSound = document.getElementById('btn-sound');
        this.btnMusic = document.getElementById('btn-music');
        this.btnFullscreen = document.getElementById('btn-fullscreen');
        this.langSelect = document.getElementById('lang-select');
        this.themeSelect = document.getElementById('theme-select');
        this.sizeSelect = document.getElementById('size-select');

        // Modals
        this.levelModal = document.getElementById('level-modal');
        this.artModal = document.getElementById('art-modal');
        this.victoryModal = document.getElementById('victory-modal');
        this.previewModal = document.getElementById('preview-modal');
        this.imageUploadInput = document.getElementById('image-upload-input');
    }

    bindEvents() {
        // Mode Tabs
        document.querySelectorAll('.mode-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const mode = e.currentTarget.dataset.mode;
                this.switchMode(mode);
            });
        });

        // Top Actions
        this.btnSound.addEventListener('click', () => {
            const enabled = window.soundEngine.toggleSound();
            this.btnSound.classList.toggle('active', enabled);
            this.btnSound.textContent = enabled ? '🔊' : '🔇';
        });

        this.btnMusic.addEventListener('click', () => {
            const enabled = window.soundEngine.toggleMusic();
            this.btnMusic.classList.toggle('active', enabled);
        });

        this.btnFullscreen.addEventListener('click', () => this.toggleFullscreen());

        this.langSelect.addEventListener('change', (e) => {
            this.lang = e.target.value;
            this.applyLanguage();
        });

        this.themeSelect.addEventListener('change', (e) => {
            document.documentElement.setAttribute('data-theme', e.target.value);
        });

        this.sizeSelect.addEventListener('change', (e) => {
            this.currentSize = parseInt(e.target.value, 10);
            this.startCurrentModeGame();
        });

        // Jigsaw Toolbar events
        this.ghostSlider.addEventListener('input', (e) => {
            const val = parseInt(e.target.value, 10);
            this.ghostValText.textContent = `${val}%`;
            if (this.activeGame && this.activeGame.setGhostOpacity) {
                this.activeGame.setGhostOpacity(val / 100);
            }
        });

        this.btnEdgeFilter.addEventListener('click', () => {
            if (this.activeGame && this.activeGame.toggleEdgeFilter) {
                const isEdge = this.activeGame.toggleEdgeFilter();
                this.btnEdgeFilter.classList.toggle('active', isEdge);
            }
        });

        this.btnTrayClean.addEventListener('click', () => {
            if (this.activeGame && this.activeGame.cleanupToTray) {
                this.activeGame.cleanupToTray();
            }
        });

        this.btnTrayLeft.addEventListener('click', () => {
            if (this.activeGame && this.activeGame.scrollTray) {
                this.activeGame.scrollTray(-160);
            }
        });

        this.btnTrayRight.addEventListener('click', () => {
            if (this.activeGame && this.activeGame.scrollTray) {
                this.activeGame.scrollTray(160);
            }
        });

        // Game Controls
        document.getElementById('btn-restart').addEventListener('click', () => this.startCurrentModeGame());
        document.getElementById('btn-hint').addEventListener('click', () => {
            if (this.activeGame && this.activeGame.hint) this.activeGame.hint();
        });
        document.getElementById('btn-solve').addEventListener('click', () => {
            if (this.activeGame && this.activeGame.autoSolve) this.activeGame.autoSolve();
        });
        document.getElementById('btn-numbers').addEventListener('click', () => {
            if (this.activeGame && this.activeGame.toggleNumbers) this.activeGame.toggleNumbers();
        });
        document.getElementById('btn-undo').addEventListener('click', () => {
            if (this.activeGame && this.activeGame.undo) this.activeGame.undo();
        });
        document.getElementById('btn-preview').addEventListener('click', () => this.showPreviewModal());
        document.getElementById('btn-image').addEventListener('click', () => this.showArtModal());
        document.getElementById('btn-levels-modal').addEventListener('click', () => this.showLevelModal());

        // File upload
        this.imageUploadInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (file) {
                try {
                    const dataUrl = await window.artPresets.processUploadedImage(file);
                    this.currentImageUrl = dataUrl;
                    this.currentArtId = 'custom';
                    this.hideArtModal();
                    this.startCurrentModeGame();
                } catch (err) {
                    console.error('Image load error', err);
                }
            }
        });

        // Close modal buttons and backdrop clicks
        document.querySelectorAll('.modal-close-btn, .modal-backdrop-close').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal-overlay');
                if (modal) modal.classList.remove('active');
            });
        });

        document.querySelectorAll('.modal-overlay').forEach(overlay => {
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    overlay.classList.remove('active');
                }
            });
        });

        // Victory Next Level button
        document.getElementById('btn-victory-next').addEventListener('click', () => {
            this.victoryModal.classList.remove('active');
            if (this.nextLevelToPlay) {
                this.startCampaignLevel(this.nextLevelToPlay);
            } else {
                this.startCurrentModeGame();
            }
        });

        document.getElementById('btn-victory-replay').addEventListener('click', () => {
            this.victoryModal.classList.remove('active');
            this.startCurrentModeGame();
        });
    }

    applyLanguage() {
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.dataset.i18n;
            el.textContent = this.t(key);
        });

        if (this.currentMode === 'campaign') {
            const lvl = window.campaignManager.getLevel(this.currentCampaignLevel);
            if (lvl) {
                const nameKey = this.lang === 'en' ? 'name_en' : (this.lang === 'ru' ? 'name_ru' : 'name');
                this.hudLevel.textContent = lvl[nameKey] || lvl.name;
            }
        } else {
            this.hudLevel.textContent = this.t('tab_' + this.currentMode);
        }
    }

    setupTheme() {
        document.documentElement.setAttribute('data-theme', 'default');
    }

    switchMode(mode) {
        this.currentMode = mode;
        document.querySelectorAll('.mode-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.mode === mode);
        });

        const isJigsaw = (mode === 'jigsaw' || (mode === 'campaign' && window.campaignManager.getLevel(this.currentCampaignLevel).mode === 'jigsaw'));

        this.jigsawSubBar.style.display = isJigsaw ? 'flex' : 'none';
        this.hudProgressWrap.style.display = isJigsaw ? 'flex' : 'none';
        this.sizeSelect.style.display = (mode === 'campaign') ? 'none' : 'inline-block';
        document.getElementById('btn-levels-modal').style.display = (mode === 'campaign') ? 'inline-flex' : 'none';
        document.getElementById('btn-undo').style.display = (mode === 'sliding') ? 'inline-flex' : 'none';
        document.getElementById('btn-numbers').style.display = (mode === 'sliding' || mode === 'swap') ? 'inline-flex' : 'none';
        this.hudStarsGroup.style.display = (mode === 'campaign') ? 'flex' : 'none';

        if (mode === 'campaign') {
            this.startCampaignLevel(this.currentCampaignLevel);
        } else {
            this.hudLevel.textContent = this.t('tab_' + mode);
            this.startCurrentModeGame();
        }
    }

    async startCurrentModeGame() {
        if (this.activeGame && this.activeGame.destroy) {
            this.activeGame.destroy();
        } else if (this.activeGame && this.activeGame.stopTimer) {
            this.activeGame.stopTimer();
        }

        const size = this.currentSize;
        let imgUrl = this.currentImageUrl;

        if (!imgUrl && this.currentArtId !== 'numbers') {
            imgUrl = await window.artPresets.getImage(this.currentArtId);
            this.currentImageUrl = imgUrl;
        }

        const onWin = (res) => this.handleWin(res);
        const onMove = (stats) => this.updateHUD(stats);
        const onProgress = (prog) => this.updateProgress(prog);

        if (this.currentMode === 'jigsaw') {
            this.activeGame = new JigsawGame(this.boardContainer, onWin, onMove, onProgress);
            this.activeGame.init(size, imgUrl, false);
            this.btnEdgeFilter.classList.remove('active');
        } else if (this.currentMode === 'sliding') {
            this.activeGame = new SlidingGame(this.boardContainer, onWin, onMove);
            this.activeGame.init(size, imgUrl, 'hard');
        } else if (this.currentMode === 'swap') {
            this.activeGame = new SwapGame(this.boardContainer, onWin, onMove);
            this.activeGame.init(size, imgUrl);
        }
    }

    async startCampaignLevel(levelId) {
        const lvl = window.campaignManager.getLevel(levelId);
        if (!lvl) return;

        this.currentCampaignLevel = levelId;
        const nameKey = this.lang === 'en' ? 'name_en' : (this.lang === 'ru' ? 'name_ru' : 'name');
        this.hudLevel.textContent = lvl[nameKey] || lvl.name;

        let imgUrl = null;
        if (lvl.art !== 'numbers') {
            imgUrl = await window.artPresets.getImage(lvl.art);
        }
        this.currentImageUrl = imgUrl;

        if (this.activeGame && this.activeGame.destroy) {
            this.activeGame.destroy();
        } else if (this.activeGame && this.activeGame.stopTimer) {
            this.activeGame.stopTimer();
        }

        const onWin = (res) => this.handleCampaignWin(levelId, res);
        const onMove = (stats) => this.updateHUD(stats);
        const onProgress = (prog) => this.updateProgress(prog);

        const isJigsaw = (lvl.mode === 'jigsaw');
        this.jigsawSubBar.style.display = isJigsaw ? 'flex' : 'none';
        this.hudProgressWrap.style.display = isJigsaw ? 'flex' : 'none';

        if (lvl.mode === 'jigsaw') {
            this.activeGame = new JigsawGame(this.boardContainer, onWin, onMove, onProgress);
            this.activeGame.init(lvl.size, imgUrl, false);
            this.btnEdgeFilter.classList.remove('active');
        } else if (lvl.mode === 'sliding') {
            this.activeGame = new SlidingGame(this.boardContainer, onWin, onMove);
            this.activeGame.init(lvl.size, imgUrl, lvl.diff || 'hard');
        } else if (lvl.mode === 'swap') {
            this.activeGame = new SwapGame(this.boardContainer, onWin, onMove);
            this.activeGame.init(lvl.size, imgUrl);
        }

        this.updateHUDStars(window.campaignManager.progress.stars[levelId] || 0);
    }

    updateProgress({ locked, total, percent }) {
        this.hudProgressText.textContent = `${locked}/${total} (${percent}%)`;
        this.hudProgressFill.style.width = `${percent}%`;
    }

    handleCampaignWin(levelId, res) {
        const result = window.campaignManager.recordWin(levelId, res.moves, res.time);
        this.nextLevelToPlay = result.nextLevelId;

        this.showVictoryModal({
            stars: result.stars,
            moves: res.moves,
            time: res.time,
            hasNext: !!result.nextLevelId
        });
    }

    handleWin(res) {
        this.nextLevelToPlay = null;
        this.showVictoryModal({
            stars: 3,
            moves: res.moves,
            time: res.time,
            hasNext: false
        });
    }

    updateHUD(stats) {
        this.hudMoves.textContent = stats.moves;
        const mins = Math.floor(stats.time / 60);
        const secs = stats.time % 60;
        this.hudTime.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    updateHUDStars(count) {
        this.hudStarsContainer.innerHTML = '';
        for (let i = 1; i <= 3; i++) {
            const span = document.createElement('span');
            span.textContent = '★';
            if (i <= count) span.className = 'star-filled';
            this.hudStarsContainer.appendChild(span);
        }
    }

    showVictoryModal({ stars, moves, time, hasNext }) {
        const starsBox = document.getElementById('victory-stars-box');
        starsBox.innerHTML = '';
        for (let i = 1; i <= 3; i++) {
            const s = document.createElement('span');
            s.textContent = '★';
            if (i <= stars) s.className = 'star-filled';
            starsBox.appendChild(s);
        }

        document.getElementById('victory-moves-val').textContent = moves;
        const mins = Math.floor(time / 60);
        const secs = time % 60;
        document.getElementById('victory-time-val').textContent = `${mins}:${secs.toString().padStart(2, '0')}`;

        const nextBtn = document.getElementById('btn-victory-next');
        nextBtn.style.display = hasNext ? 'inline-flex' : 'none';

        this.victoryModal.classList.add('active');
    }

    showLevelModal() {
        const grid = document.getElementById('level-select-grid');
        grid.innerHTML = '';

        window.campaignManager.levels.forEach(lvl => {
            const isUnlocked = window.campaignManager.isUnlocked(lvl.id);
            const stars = window.campaignManager.progress.stars[lvl.id] || 0;
            const bestMove = window.campaignManager.progress.bestMoves[lvl.id];
            const bestTime = window.campaignManager.progress.bestTimes[lvl.id];

            const card = document.createElement('div');
            card.className = `level-card ${isUnlocked ? '' : 'locked'}`;

            const nameKey = this.lang === 'en' ? 'name_en' : (this.lang === 'ru' ? 'name_ru' : 'name');
            const levelTitle = lvl[nameKey] || lvl.name;

            card.innerHTML = `
                <div class="level-card-top">
                    <span class="level-num">#${lvl.id}</span>
                    <div class="level-stars">
                        <span class="${stars >= 1 ? 'star-filled' : ''}">★</span>
                        <span class="${stars >= 2 ? 'star-filled' : ''}">★</span>
                        <span class="${stars >= 3 ? 'star-filled' : ''}">★</span>
                    </div>
                </div>
                <div class="level-title">${levelTitle}</div>
                <div class="level-desc">${lvl.desc} (${lvl.size}x${lvl.size})</div>
                <div class="level-best">
                    <span>${this.t('hud_moves')}: ${bestMove !== undefined ? bestMove : '-'}</span>
                    <span>${this.t('hud_time')}: ${bestTime !== undefined ? bestTime + 's' : '-'}</span>
                </div>
            `;

            if (isUnlocked) {
                card.addEventListener('click', () => {
                    this.levelModal.classList.remove('active');
                    this.switchMode('campaign');
                    this.startCampaignLevel(lvl.id);
                });
            }

            grid.appendChild(card);
        });

        this.levelModal.classList.add('active');
    }

    async showArtModal() {
        const grid = document.getElementById('art-gallery-grid');
        grid.innerHTML = '';

        const numCard = document.createElement('div');
        numCard.className = `gallery-item ${this.currentArtId === 'numbers' ? 'active' : ''}`;
        numCard.style.background = '#1e2430';
        numCard.style.display = 'flex';
        numCard.style.alignItems = 'center';
        numCard.style.justifyContent = 'center';
        numCard.innerHTML = `<span style="font-size: 28px; font-weight: 800; color: #ffb703;">1 2 3</span><div class="gallery-item-label">${this.t('btn_numbers')}</div>`;
        numCard.addEventListener('click', () => {
            this.currentArtId = 'numbers';
            this.currentImageUrl = null;
            this.hideArtModal();
            this.startCurrentModeGame();
        });
        grid.appendChild(numCard);

        for (const preset of window.artPresets.presets) {
            const dataUrl = await window.artPresets.getImage(preset.id, 200);
            const item = document.createElement('div');
            item.className = `gallery-item ${this.currentArtId === preset.id ? 'active' : ''}`;
            item.style.backgroundImage = `url(${dataUrl})`;
            item.innerHTML = `<div class="gallery-item-label">${preset.name}</div>`;

            item.addEventListener('click', async () => {
                this.currentArtId = preset.id;
                this.currentImageUrl = await window.artPresets.getImage(preset.id, 800);
                this.hideArtModal();
                this.startCurrentModeGame();
            });

            grid.appendChild(item);
        }

        this.artModal.classList.add('active');
    }

    hideArtModal() {
        this.artModal.classList.remove('active');
    }

    showPreviewModal() {
        const img = document.getElementById('preview-image-large');
        const container = img.parentElement;
        let numPreview = document.getElementById('preview-numbers-info');

        if (this.currentImageUrl) {
            img.src = this.currentImageUrl;
            img.style.display = 'block';
            if (numPreview) numPreview.style.display = 'none';
        } else {
            img.style.display = 'none';
            if (!numPreview) {
                numPreview = document.createElement('div');
                numPreview.id = 'preview-numbers-info';
                numPreview.style.cssText = 'padding: 24px; text-align: center; background: rgba(255,255,255,0.06); border-radius: 12px; border: 1px solid var(--border-color); width: 100%;';
                container.appendChild(numPreview);
            }
            numPreview.style.display = 'block';
            numPreview.innerHTML = `
                <div style="font-size: 36px; margin-bottom: 12px;">🔢</div>
                <h4 style="font-size: 18px; color: var(--accent-gold); margin-bottom: 8px;">Klassik Raqamlar Tartibi</h4>
                <p style="color: var(--text-secondary); font-size: 14px; line-height: 1.6;">
                    Raqamlarni 1 dan boshlab ketma-ketlikda o'sish tartibida joylashtiring.<br>
                    Oxirgi o'ng pastki katakcha bo'sh (0) holatda qolishi kerak!
                </p>
            `;
        }
        this.previewModal.classList.add('active');
    }

    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(() => {});
        } else {
            document.exitFullscreen().catch(() => {});
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
    window.app.init();
});
