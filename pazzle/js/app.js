// Main Application Controller & UI Orchestrator
// Coordinates Drag & Drop Jigsaw Studio, Sliding Puzzle, Swap Puzzle, and Level Progression.
// Automatically advances to the NEXT LEVEL upon puzzle completion without replaying!

class App {
    constructor() {
        this.lang = 'uz';
        this.currentMode = 'jigsaw'; // Default flagship mode: Drag & Drop Jigsaw

        // Mode Level Trackers (saved in localStorage)
        this.jigsawLevel = parseInt(localStorage.getItem('pazzle_jigsaw_level') || '1', 10);
        this.slidingLevel = parseInt(localStorage.getItem('pazzle_sliding_level') || '1', 10);
        this.swapLevel = parseInt(localStorage.getItem('pazzle_swap_level') || '1', 10);
        this.currentCampaignLevel = window.campaignManager.progress.unlockedLevel || 1;

        this.currentSize = 2;
        this.currentArtId = 'ancient_mosaic';
        this.currentImageUrl = null;
        this.activeGame = null;

        // Auto-advance timer
        this.autoAdvanceTimer = null;
        this.nextLevelToPlay = null;

        // Progressive Jigsaw Levels Ladder
        this.jigsawLevels = [
            { level: 1, size: 2, art: 'ancient_mosaic', name: '1-Bosqich: Registon Mozaikasi (2x2)', name_en: 'Level 1: Samarkand Mosaic (2x2)', name_ru: 'Уровень 1: Мозаика Регистана (2x2)' },
            { level: 2, size: 3, art: 'galaxy', name: '2-Bosqich: Fazoviy Galaktika (3x3)', name_en: 'Level 2: Cosmic Galaxy (3x3)', name_ru: 'Уровень 2: Галактика (3x3)' },
            { level: 3, size: 3, art: 'sunset_mountain', name: '3-Bosqich: Togʻ va Quyosh (3x3)', name_en: 'Level 3: Mountain Sunset (3x3)', name_ru: 'Уровень 3: Закат в горах (3x3)' },
            { level: 4, size: 4, art: 'nature_forest', name: '4-Bosqich: Zumrad Oʻrmon (4x4)', name_en: 'Level 4: Emerald Forest (4x4)', name_ru: 'Уровень 4: Изумрудный лес (4x4)' },
            { level: 5, size: 4, art: 'cyber_city', name: '5-Bosqich: Kiber Neon Shahar (4x4)', name_en: 'Level 5: Cyber Neon City (4x4)', name_ru: 'Уровень 5: Кибер Город (4x4)' },
            { level: 6, size: 5, art: 'geometric_mandala', name: '6-Bosqich: Oltin Mandala (5x5)', name_en: 'Level 6: Golden Mandala (5x5)', name_ru: 'Уровень 6: Золотая Мандала (5x5)' },
            { level: 7, size: 5, art: 'ancient_mosaic', name: '7-Bosqich: Tarixiy Naqshlar (5x5)', name_en: 'Level 7: Ancient Patterns (5x5)', name_ru: 'Уровень 7: Древние узоры (5x5)' },
            { level: 8, size: 6, art: 'galaxy', name: '8-Bosqich: Koinot Mozaikasi (6x6)', name_en: 'Level 8: Nebula Master (6x6)', name_ru: 'Уровень 8: Космический мастер (6x6)' },
            { level: 9, size: 6, art: 'cyber_city', name: '9-Bosqich: Grossmeyster Neon (6x6)', name_en: 'Level 9: Grandmaster Neon (6x6)', name_ru: 'Уровень 9: Гроссмейстер Неон (6x6)' },
            { level: 10, size: 8, art: 'geometric_mandala', name: '10-Bosqich: Afsonaviy Daho (8x8)', name_en: 'Level 10: Legendary Master (8x8)', name_ru: 'Уровень 10: Легендарный Гений (8x8)' }
        ];

        this.translations = {
            uz: {
                app_title: "PAZZLE MASTER",
                app_subtitle: "DRAG & DROP MUKAMMALLIK",
                tab_jigsaw: "Mozaika (Drag & Drop)",
                tab_campaign: "Bosqichlar",
                tab_sliding: "Suriluvchi Pazl",
                tab_swap: "Almashtirish",
                hud_level: "Bosqich",
                hud_moves: "Qadamlar",
                hud_time: "Vaqt",
                hud_stars: "Yulduzlar",
                btn_restart: "Qayta boshlash",
                btn_hint: "Maslahat",
                btn_solve: "Avto-yechish",
                btn_preview: "Asl rasm",
                btn_numbers: "Raqamlar",
                btn_undo: "Qaytish",
                btn_image: "Rasm tanlash",
                btn_levels: "Bosqichlar",
                ghost_opacity: "Shaffoflik:",
                btn_edge_filter: "Faqat qirralar",
                btn_tray_clean: "Javonga yigʻish",
                victory_title: "GʻALABA! MUKAMMAL!",
                victory_msg: "Pazl muvaffaqiyatli yigʻildi!",
                victory_next: "Keyingi bosqich ➔",
                victory_replay: "Qayta oʻynash",
                auto_advance_msg: "Keyingi bosqich {s} soniyada boshlanadi...",
                modal_choose_art: "Pazl uchun rasm tanlang",
                upload_prompt: "Oʻz suratingizni yuklang (JPG/PNG)",
                size_label: "Oʻlcham:",
                locked: "Qulflangan",
                quick_preview_hint: "Qoʻyib yuboring (Yashirish uchun)",
                tap_place_hint: "Boʻlak tanlandi! Doskadagi kerakli katakni bosing",
                shortcuts_title: "Klaviatura Tezkor Tugmalari",
                sc_hint: "Aqlli maslahat (Bitta bo'lakni o'z joyiga uchirish)",
                sc_preview: "Asl rasmni koʻrish (Bosib turganda bir zumda koʻrinadi)",
                sc_restart: "Pazlni qayta boshlash",
                sc_music: "Tinchlantiruvchi meditatsion musiqani yoqish/oʻchirish",
                sc_sound: "Ovoz effektlarini yoqish/oʻchirish",
                sc_fullscreen: "Toʻliq ekran rejimiga oʻtish",
                sc_modes: "Oʻyin rejimlarini tanlash (1: Mozaika, 2: Bosqichlar, 3: Suriluvchi, 4: Almashtirish)",
                sc_escape: "Oynalarni yopish / Tanlangan bo'lakni bekor qilish",
                btn_close: "Yopish",
                btn_got_it: "Tushundim",
                star_target_tip: "🎯 3★: {m} qadam, {t}s"
            },
            en: {
                app_title: "PUZZLE MASTER",
                app_subtitle: "DRAG & DROP PERFECTION",
                tab_jigsaw: "Jigsaw (Drag & Drop)",
                tab_campaign: "Campaign",
                tab_sliding: "Sliding Puzzle",
                tab_swap: "Tile Swap",
                hud_level: "Level",
                hud_moves: "Moves",
                hud_time: "Time",
                hud_stars: "Stars",
                btn_restart: "Restart",
                btn_hint: "Hint",
                btn_solve: "AI Solve",
                btn_preview: "Preview",
                btn_numbers: "Numbers",
                btn_undo: "Undo",
                btn_image: "Change Art",
                btn_levels: "Levels",
                ghost_opacity: "Ghost:",
                btn_edge_filter: "Edges Only",
                btn_tray_clean: "Send to Tray",
                victory_title: "VICTORY! PERFECT!",
                victory_msg: "Puzzle solved successfully!",
                victory_next: "Next Level ➔",
                victory_replay: "Play Again",
                auto_advance_msg: "Next level in {s}s...",
                modal_choose_art: "Select Puzzle Artwork",
                upload_prompt: "Upload your custom photo (JPG/PNG)",
                size_label: "Size:",
                locked: "Locked",
                quick_preview_hint: "Release to hide preview",
                tap_place_hint: "Piece selected! Tap board slot to place",
                shortcuts_title: "Keyboard Shortcuts",
                sc_hint: "Smart Hint (Fly one piece to its place)",
                sc_preview: "Quick Preview (Hold to peek artwork)",
                sc_restart: "Restart current puzzle",
                sc_music: "Toggle ambient zen music",
                sc_sound: "Toggle sound FX",
                sc_fullscreen: "Toggle fullscreen mode",
                sc_modes: "Game modes (1: Jigsaw, 2: Campaign, 3: Sliding, 4: Swap)",
                sc_escape: "Close modals / Deselect piece",
                btn_close: "Close",
                btn_got_it: "Got it",
                star_target_tip: "🎯 3★: {m} moves, {t}s"
            },
            ru: {
                app_title: "МАСТЕР ПАЗЛОВ",
                app_subtitle: "DRAG & DROP СОВЕРШЕНСТВО",
                tab_jigsaw: "Мозаика (Drag & Drop)",
                tab_campaign: "Кампания",
                tab_sliding: "Пятнашки",
                tab_swap: "Обмен плиток",
                hud_level: "Уровень",
                hud_moves: "Ходы",
                hud_time: "Время",
                hud_stars: "Звёзды",
                btn_restart: "Заново",
                btn_hint: "Подсказка",
                btn_solve: "Авто-сборка",
                btn_preview: "Образец",
                btn_numbers: "Цифры",
                btn_undo: "Назад",
                btn_image: "Выбрать арт",
                btn_levels: "Уровни",
                ghost_opacity: "Образец:",
                btn_edge_filter: "Только края",
                btn_tray_clean: "Собрать в лоток",
                victory_title: "ПОБЕДА! ВЕЛИКОЛЕПНО!",
                victory_msg: "Головоломка успешно решена!",
                victory_next: "Следующий уровень ➔",
                victory_replay: "Играть снова",
                auto_advance_msg: "Следующий уровень через {s}с...",
                modal_choose_art: "Выберите изображение",
                upload_prompt: "Загрузить своё фото (JPG/PNG)",
                size_label: "Размер:",
                locked: "Закрыто",
                quick_preview_hint: "Отпустите, чтобы скрыть",
                tap_place_hint: "Элемент выбран! Нажмите на поле для установки",
                shortcuts_title: "Горячие клавиши",
                sc_hint: "Подсказка (Установить один элемент)",
                sc_preview: "Быстрый просмотр (Удерживайте для просмотра)",
                sc_restart: "Начать уровень заново",
                sc_music: "Вкл/выкл медитативную музыку",
                sc_sound: "Вкл/выкл звуковые эффекты",
                sc_fullscreen: "Полноэкранный режим",
                sc_modes: "Режимы игры (1: Мозаика, 2: Кампания, 3: Пятнашки, 4: Обмен)",
                sc_escape: "Закрыть окна / Снять выделение",
                btn_close: "Закрыть",
                btn_got_it: "Понятно",
                star_target_tip: "🎯 3★: {m} ходов, {t}с"
            }
        };
    }

    t(key) {
        return (this.translations[this.lang] && this.translations[this.lang][key]) || key;
    }

    init() {
        this.cacheDOMElements();
        this.bindEvents();
        this.setupKeyboardShortcuts();
        this.applyLanguage();
        this.setupTheme();

        // Start directly with the user's current Jigsaw level
        this.startJigsawLevel(this.jigsawLevel);
    }

    cacheDOMElements() {
        this.boardContainer = document.getElementById('board-container');
        this.hudLevel = document.getElementById('hud-level-val');
        this.hudMoves = document.getElementById('hud-moves-val');
        this.hudTime = document.getElementById('hud-time-val');
        this.hudStarsContainer = document.getElementById('hud-stars');
        this.hudStarsGroup = document.getElementById('hud-stars-group');
        this.hudStarTarget = document.getElementById('hud-star-target');

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

        // Top Controls
        this.btnSound = document.getElementById('btn-sound');
        this.btnMusic = document.getElementById('btn-music');
        this.btnFullscreen = document.getElementById('btn-fullscreen');
        this.btnShortcuts = document.getElementById('btn-shortcuts');
        this.btnTheme = document.getElementById('btn-theme');
        this.themeIcon = document.getElementById('theme-icon');
        this.langSelect = document.getElementById('lang-select');
        this.sizeSelect = document.getElementById('size-select');

        // In-board preview & banner
        this.boardPreviewCard = document.getElementById('board-preview-card');
        this.boardPreviewImg = document.getElementById('board-preview-img');
        this.quickPreviewOverlay = document.getElementById('quick-preview-overlay');
        this.quickPreviewImg = document.getElementById('quick-preview-img');
        this.tapPlaceBanner = document.getElementById('tap-place-banner');

        // Modals
        this.levelModal = document.getElementById('level-modal');
        this.artModal = document.getElementById('art-modal');
        this.victoryModal = document.getElementById('victory-modal');
        this.autoAdvanceText = document.getElementById('auto-advance-text');
        this.previewModal = document.getElementById('preview-modal');
        this.shortcutsModal = document.getElementById('shortcuts-modal');
        this.imageUploadInput = document.getElementById('image-upload-input');
        this.previewImageLarge = document.getElementById('preview-image-large');
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
            this.btnSound.innerHTML = enabled ? '<i class="ph-bold ph-speaker-high"></i>' : '<i class="ph-bold ph-speaker-slash"></i>';
        });

        this.btnMusic.addEventListener('click', () => {
            const enabled = window.soundEngine.toggleMusic();
            this.btnMusic.classList.toggle('active', enabled);
            this.btnMusic.innerHTML = enabled ? '<i class="ph-fill ph-music-note"></i>' : '<i class="ph-bold ph-music-note"></i>';
        });

        this.btnFullscreen.addEventListener('click', () => this.toggleFullscreen());

        if (this.btnShortcuts) {
            this.btnShortcuts.addEventListener('click', () => this.showShortcutsModal());
        }

        if (this.btnTheme) {
            this.btnTheme.addEventListener('click', () => this.toggleTheme());
        }

        this.langSelect.addEventListener('change', (e) => {
            this.lang = e.target.value;
            this.applyLanguage();
        });

        this.sizeSelect.addEventListener('change', (e) => {
            this.currentSize = parseInt(e.target.value, 10);
            this.startCurrentModeGame();
        });

        // Hold-to-preview & Click-to-preview on Quick Preview
        const btnPrev = document.getElementById('btn-preview');
        btnPrev.addEventListener('mousedown', (e) => {
            if (e.button === 0) this.showQuickPreview();
        });
        btnPrev.addEventListener('mouseup', () => this.hideQuickPreview());
        btnPrev.addEventListener('mouseleave', () => this.hideQuickPreview());
        btnPrev.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.showQuickPreview();
        }, { passive: false });
        btnPrev.addEventListener('touchend', () => this.hideQuickPreview());

        if (this.boardPreviewCard) {
            this.boardPreviewCard.addEventListener('mousedown', (e) => {
                if (e.button === 0) this.showQuickPreview();
            });
            this.boardPreviewCard.addEventListener('mouseup', () => this.hideQuickPreview());
            this.boardPreviewCard.addEventListener('mouseleave', () => this.hideQuickPreview());
            this.boardPreviewCard.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.showQuickPreview();
            }, { passive: false });
            this.boardPreviewCard.addEventListener('touchend', () => this.hideQuickPreview());
        }

        if (this.quickPreviewOverlay) {
            this.quickPreviewOverlay.addEventListener('click', () => this.hideQuickPreview());
        }

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
                if (modal) {
                    if (this.autoAdvanceTimer) {
                        clearInterval(this.autoAdvanceTimer);
                        this.autoAdvanceTimer = null;
                    }
                    modal.classList.remove('active');
                }
            });
        });

        document.querySelectorAll('.modal-overlay').forEach(overlay => {
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    if (this.autoAdvanceTimer) {
                        clearInterval(this.autoAdvanceTimer);
                        this.autoAdvanceTimer = null;
                    }
                    overlay.classList.remove('active');
                }
            });
        });
    }

    applyLanguage() {
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.dataset.i18n;
            el.textContent = this.t(key);
        });

        this.updateHUDLevelTitle();
    }

    updateHUDLevelTitle() {
        if (this.currentMode === 'jigsaw') {
            const cfg = this.getJigsawConfig(this.jigsawLevel);
            const nameKey = this.lang === 'en' ? 'name_en' : (this.lang === 'ru' ? 'name_ru' : 'name');
            this.hudLevel.textContent = cfg[nameKey] || cfg.name;
        } else if (this.currentMode === 'campaign') {
            const lvl = window.campaignManager.getLevel(this.currentCampaignLevel);
            if (lvl) {
                const nameKey = this.lang === 'en' ? 'name_en' : (this.lang === 'ru' ? 'name_ru' : 'name');
                this.hudLevel.textContent = lvl[nameKey] || lvl.name;
            }
        } else if (this.currentMode === 'sliding') {
            this.hudLevel.textContent = `${this.slidingLevel}-Bosqich (Suriluvchi ${this.currentSize}x${this.currentSize})`;
        } else if (this.currentMode === 'swap') {
            this.hudLevel.textContent = `${this.swapLevel}-Bosqich (Almashtirish ${this.currentSize}x${this.currentSize})`;
        }
    }

    setupTheme() {
        this.theme = localStorage.getItem('pazzle_theme') || 'light';
        this.applyTheme();
    }

    applyTheme() {
        document.documentElement.setAttribute('data-theme', this.theme);
        if (this.themeIcon) {
            this.themeIcon.className = (this.theme === 'dark') ? 'ph-bold ph-moon' : 'ph-bold ph-sun';
        }
        if (this.activeGame && this.activeGame.render) {
            this.activeGame.render();
        }
    }

    toggleTheme() {
        this.theme = (this.theme === 'light') ? 'dark' : 'light';
        localStorage.setItem('pazzle_theme', this.theme);
        this.applyTheme();
    }

    showQuickPreview() {
        if (!this.currentImageUrl) return;
        if (this.quickPreviewImg) this.quickPreviewImg.src = this.currentImageUrl;
        if (this.quickPreviewOverlay) this.quickPreviewOverlay.classList.add('active');
    }

    hideQuickPreview() {
        if (this.quickPreviewOverlay) this.quickPreviewOverlay.classList.remove('active');
    }

    showShortcutsModal() {
        if (this.shortcutsModal) {
            this.shortcutsModal.classList.add('active');
        }
    }

    closeAllModals() {
        document.querySelectorAll('.modal-overlay.active').forEach(modal => {
            modal.classList.remove('active');
        });
        if (this.autoAdvanceTimer) {
            clearInterval(this.autoAdvanceTimer);
            this.autoAdvanceTimer = null;
        }
    }

    setupKeyboardShortcuts() {
        window.addEventListener('keydown', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA') return;

            const key = e.key.toLowerCase();
            if (key === 'h') {
                if (this.activeGame && this.activeGame.hint) this.activeGame.hint();
            } else if (key === 'r') {
                this.startCurrentModeGame();
            } else if (key === 'm') {
                this.btnMusic.click();
            } else if (key === 's') {
                this.btnSound.click();
            } else if (key === 'f') {
                this.toggleFullscreen();
            } else if (key === ' ' || key === 'p') {
                if (!e.repeat) {
                    this.showQuickPreview();
                }
            } else if (key === '1') {
                this.switchMode('jigsaw');
            } else if (key === '2') {
                this.switchMode('campaign');
            } else if (key === '3') {
                this.switchMode('sliding');
            } else if (key === '4') {
                this.switchMode('swap');
            } else if (key === '?' || key === '/') {
                this.showShortcutsModal();
            } else if (key === 'escape') {
                this.closeAllModals();
                this.hideQuickPreview();
                if (this.activeGame && this.activeGame.deselectPiece) {
                    this.activeGame.deselectPiece();
                }
            }
        });

        window.addEventListener('keyup', (e) => {
            const key = e.key.toLowerCase();
            if (key === ' ' || key === 'p') {
                this.hideQuickPreview();
            }
        });
    }

    calculateStars(mode, size, moves, time) {
        const totalTiles = size * size;
        let targetMoves3, targetMoves2, targetTime3, targetTime2;

        if (mode === 'jigsaw') {
            targetMoves3 = Math.round(totalTiles * 1.5);
            targetMoves2 = Math.round(totalTiles * 2.5);
            targetTime3 = Math.round(totalTiles * 5.5) + 15;
            targetTime2 = Math.round(totalTiles * 10) + 30;
        } else if (mode === 'sliding') {
            targetMoves3 = Math.round(totalTiles * 3.5);
            targetMoves2 = Math.round(totalTiles * 7.0);
            targetTime3 = Math.round(totalTiles * 8.0) + 20;
            targetTime2 = Math.round(totalTiles * 16.0) + 40;
        } else { // swap
            targetMoves3 = Math.round(totalTiles * 1.2);
            targetMoves2 = Math.round(totalTiles * 2.2);
            targetTime3 = Math.round(totalTiles * 4.5) + 10;
            targetTime2 = Math.round(totalTiles * 8.0) + 20;
        }

        if (moves <= targetMoves3 && time <= targetTime3) return 3;
        if (moves <= targetMoves2 && time <= targetTime2) return 2;
        return 1;
    }

    updateStarTargetBadge(mode, size) {
        if (!this.hudStarTarget) return;
        const totalTiles = size * size;
        let m3, t3;
        if (mode === 'jigsaw') {
            m3 = Math.round(totalTiles * 1.5);
            t3 = Math.round(totalTiles * 5.5) + 15;
        } else if (mode === 'sliding') {
            m3 = Math.round(totalTiles * 3.5);
            t3 = Math.round(totalTiles * 8.0) + 20;
        } else {
            m3 = Math.round(totalTiles * 1.2);
            t3 = Math.round(totalTiles * 4.5) + 10;
        }
        const text = this.t('star_target_tip').replace('{m}', m3).replace('{t}', t3);
        this.hudStarTarget.textContent = text;
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
        this.hudStarsGroup.style.display = 'flex';

        if (mode === 'jigsaw') {
            this.startJigsawLevel(this.jigsawLevel);
        } else if (mode === 'campaign') {
            this.startCampaignLevel(this.currentCampaignLevel);
        } else if (mode === 'sliding') {
            this.startSlidingLevel(this.slidingLevel);
        } else if (mode === 'swap') {
            this.startSwapLevel(this.swapLevel);
        }
    }

    getJigsawConfig(lvl) {
        if (lvl <= this.jigsawLevels.length) {
            return this.jigsawLevels[lvl - 1];
        }
        // Endless progression beyond level 10
        const artList = ['ancient_mosaic', 'galaxy', 'sunset_mountain', 'nature_forest', 'cyber_city', 'geometric_mandala'];
        const art = artList[(lvl - 1) % artList.length];
        const sizes = [3, 4, 4, 5, 5, 6, 8];
        const size = sizes[(lvl - 1) % sizes.length];
        return {
            level: lvl,
            size,
            art,
            name: `${lvl}-Bosqich: Master Mozaika (${size}x${size})`,
            name_en: `Level ${lvl}: Master Jigsaw (${size}x${size})`,
            name_ru: `Уровень ${lvl}: Мастер Мозаика (${size}x${size})`
        };
    }

    async startJigsawLevel(lvlNum) {
        this.jigsawLevel = lvlNum;
        localStorage.setItem('pazzle_jigsaw_level', lvlNum);

        const cfg = this.getJigsawConfig(lvlNum);
        this.currentSize = cfg.size;
        this.sizeSelect.value = cfg.size.toString();
        this.updateHUDLevelTitle();
        this.updateStarTargetBadge('jigsaw', cfg.size);
        this.updateHUDStars(0);

        let imgUrl = null;
        if (this.currentArtId === 'custom' && this.currentImageUrl) {
            imgUrl = this.currentImageUrl;
        } else {
            this.currentArtId = cfg.art;
            imgUrl = await window.artPresets.getImage(cfg.art);
            this.currentImageUrl = imgUrl;
        }

        if (this.boardPreviewImg) this.boardPreviewImg.src = imgUrl || '';

        if (this.activeGame && this.activeGame.destroy) {
            this.activeGame.destroy();
        } else if (this.activeGame && this.activeGame.stopTimer) {
            this.activeGame.stopTimer();
        }

        const onWin = (res) => this.handleJigsawWin(res);
        const onMove = (stats) => this.updateHUD(stats);
        const onProgress = (prog) => this.updateProgress(prog);

        this.activeGame = new JigsawGame(this.boardContainer, onWin, onMove, onProgress);
        this.activeGame.onPieceSelected = (piece) => {
            if (this.tapPlaceBanner) {
                this.tapPlaceBanner.classList.toggle('active', !!piece);
            }
        };
        this.activeGame.init(this.currentSize, imgUrl, false);
        this.btnEdgeFilter.classList.remove('active');
    }

    async startSlidingLevel(lvlNum) {
        this.slidingLevel = lvlNum;
        localStorage.setItem('pazzle_sliding_level', lvlNum);

        const sizes = [3, 3, 4, 4, 5, 5, 6, 8];
        const artList = ['numbers', 'ancient_mosaic', 'galaxy', 'sunset_mountain', 'nature_forest', 'cyber_city', 'geometric_mandala'];
        const size = sizes[(lvlNum - 1) % sizes.length] || 4;
        const art = artList[(lvlNum - 1) % artList.length];

        this.currentSize = size;
        this.sizeSelect.value = size.toString();
        this.updateHUDLevelTitle();
        this.updateStarTargetBadge('sliding', size);
        this.updateHUDStars(0);

        let imgUrl = null;
        if (art !== 'numbers') {
            imgUrl = await window.artPresets.getImage(art);
        }
        this.currentImageUrl = imgUrl;
        if (this.boardPreviewImg) this.boardPreviewImg.src = imgUrl || '';

        if (this.activeGame && this.activeGame.destroy) {
            this.activeGame.destroy();
        } else if (this.activeGame && this.activeGame.stopTimer) {
            this.activeGame.stopTimer();
        }

        const onWin = (res) => this.handleSlidingWin(res);
        const onMove = (stats) => this.updateHUD(stats);

        this.activeGame = new SlidingGame(this.boardContainer, onWin, onMove);
        this.activeGame.init(size, imgUrl, 'hard');
    }

    async startSwapLevel(lvlNum) {
        this.swapLevel = lvlNum;
        localStorage.setItem('pazzle_swap_level', lvlNum);

        const sizes = [3, 4, 4, 5, 5, 6];
        const artList = ['sunset_mountain', 'galaxy', 'ancient_mosaic', 'nature_forest', 'cyber_city', 'geometric_mandala'];
        const size = sizes[(lvlNum - 1) % sizes.length] || 4;
        const art = artList[(lvlNum - 1) % artList.length];

        this.currentSize = size;
        this.sizeSelect.value = size.toString();
        this.updateHUDLevelTitle();
        this.updateStarTargetBadge('swap', size);
        this.updateHUDStars(0);

        const imgUrl = await window.artPresets.getImage(art);
        this.currentImageUrl = imgUrl;
        if (this.boardPreviewImg) this.boardPreviewImg.src = imgUrl || '';

        if (this.activeGame && this.activeGame.destroy) {
            this.activeGame.destroy();
        } else if (this.activeGame && this.activeGame.stopTimer) {
            this.activeGame.stopTimer();
        }

        const onWin = (res) => this.handleSwapWin(res);
        const onMove = (stats) => this.updateHUD(stats);

        this.activeGame = new SwapGame(this.boardContainer, onWin, onMove);
        this.activeGame.init(size, imgUrl);
    }

    async startCampaignLevel(levelId) {
        const lvl = window.campaignManager.getLevel(levelId);
        if (!lvl) return;

        this.currentCampaignLevel = levelId;
        this.updateHUDLevelTitle();
        this.updateStarTargetBadge(lvl.mode, lvl.size);

        let imgUrl = null;
        if (lvl.art !== 'numbers') {
            imgUrl = await window.artPresets.getImage(lvl.art);
        }
        this.currentImageUrl = imgUrl;
        if (this.boardPreviewImg) this.boardPreviewImg.src = imgUrl || '';

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
            this.activeGame.onPieceSelected = (piece) => {
                if (this.tapPlaceBanner) {
                    this.tapPlaceBanner.classList.toggle('active', !!piece);
                }
            };
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

    // WIN HANDLERS WITH AUTOMATIC LEVEL ADVANCEMENT
    handleJigsawWin(res) {
        const nextLvl = this.jigsawLevel + 1;
        const stars = this.calculateStars('jigsaw', this.currentSize, res.moves, res.time);
        this.showVictoryModalWithAutoAdvance({
            completedTitle: `${this.jigsawLevel}-Bosqich yakunlandi!`,
            nextLevelName: `${nextLvl}-Bosqichga oʻtish ➔`,
            moves: res.moves,
            time: res.time,
            stars: stars,
            onAdvance: () => this.startJigsawLevel(nextLvl)
        });
    }

    handleSlidingWin(res) {
        const nextLvl = this.slidingLevel + 1;
        const stars = this.calculateStars('sliding', this.currentSize, res.moves, res.time);
        this.showVictoryModalWithAutoAdvance({
            completedTitle: `${this.slidingLevel}-Bosqich yakunlandi!`,
            nextLevelName: `${nextLvl}-Bosqichga oʻtish ➔`,
            moves: res.moves,
            time: res.time,
            stars: stars,
            onAdvance: () => this.startSlidingLevel(nextLvl)
        });
    }

    handleSwapWin(res) {
        const nextLvl = this.swapLevel + 1;
        const stars = this.calculateStars('swap', this.currentSize, res.moves, res.time);
        this.showVictoryModalWithAutoAdvance({
            completedTitle: `${this.swapLevel}-Bosqich yakunlandi!`,
            nextLevelName: `${nextLvl}-Bosqichga oʻtish ➔`,
            moves: res.moves,
            time: res.time,
            stars: stars,
            onAdvance: () => this.startSwapLevel(nextLvl)
        });
    }

    handleCampaignWin(levelId, res) {
        const result = window.campaignManager.recordWin(levelId, res.moves, res.time);
        const nextLvl = result.nextLevelId || 1;

        this.showVictoryModalWithAutoAdvance({
            completedTitle: `${levelId}-Bosqich yakunlandi!`,
            nextLevelName: `${nextLvl}-Bosqichga oʻtish ➔`,
            moves: res.moves,
            time: res.time,
            stars: result.stars,
            onAdvance: () => this.startCampaignLevel(nextLvl)
        });
    }

    startCurrentModeGame() {
        if (this.currentMode === 'jigsaw') {
            this.startJigsawLevel(this.jigsawLevel);
        } else if (this.currentMode === 'sliding') {
            this.startSlidingLevel(this.slidingLevel);
        } else if (this.currentMode === 'swap') {
            this.startSwapLevel(this.swapLevel);
        } else {
            this.startCampaignLevel(this.currentCampaignLevel);
        }
    }

    updateProgress({ locked, total, percent }) {
        this.hudProgressText.textContent = `${locked}/${total} (${percent}%)`;
        this.hudProgressFill.style.width = `${percent}%`;
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
            const icon = document.createElement('i');
            icon.className = (i <= count) ? 'ph-fill ph-star star-filled' : 'ph-bold ph-star';
            this.hudStarsContainer.appendChild(icon);
        }
    }

    // VICTORY MODAL WITH AUTOMATIC 3-SECOND ADVANCE COUNTDOWN
    showVictoryModalWithAutoAdvance({ completedTitle, nextLevelName, moves, time, stars, onAdvance }) {
        if (this.autoAdvanceTimer) {
            clearInterval(this.autoAdvanceTimer);
            this.autoAdvanceTimer = null;
        }

        const starsBox = document.getElementById('victory-stars-box');
        starsBox.innerHTML = '';
        for (let i = 1; i <= 3; i++) {
            const s = document.createElement('i');
            s.className = (i <= stars) ? 'ph-fill ph-star star-filled' : 'ph-bold ph-star';
            starsBox.appendChild(s);
        }

        document.getElementById('victory-moves-val').textContent = moves;
        const mins = Math.floor(time / 60);
        const secs = time % 60;
        document.getElementById('victory-time-val').textContent = `${mins}:${secs.toString().padStart(2, '0')}`;

        const nextBtn = document.getElementById('btn-victory-next');
        nextBtn.style.display = 'inline-flex';
        nextBtn.textContent = nextLevelName;

        const replayBtn = document.getElementById('btn-victory-replay');

        // Countdown timer: 3 seconds to next level!
        let countdown = 3;
        const updateCountdown = () => {
            const template = this.t('auto_advance_msg');
            this.autoAdvanceText.textContent = template.replace('{s}', countdown);
        };
        updateCountdown();

        this.autoAdvanceTimer = setInterval(() => {
            countdown--;
            if (countdown <= 0) {
                clearInterval(this.autoAdvanceTimer);
                this.autoAdvanceTimer = null;
                this.victoryModal.classList.remove('active');
                onAdvance();
            } else {
                updateCountdown();
            }
        }, 1000);

        // Immediate click advance
        nextBtn.onclick = () => {
            if (this.autoAdvanceTimer) {
                clearInterval(this.autoAdvanceTimer);
                this.autoAdvanceTimer = null;
            }
            this.victoryModal.classList.remove('active');
            onAdvance();
        };

        // Replay current level
        replayBtn.onclick = () => {
            if (this.autoAdvanceTimer) {
                clearInterval(this.autoAdvanceTimer);
                this.autoAdvanceTimer = null;
            }
            this.victoryModal.classList.remove('active');
            this.startCurrentModeGame();
        };

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
                        <i class="${stars >= 1 ? 'ph-fill ph-star star-filled' : 'ph-bold ph-star'}"></i>
                        <i class="${stars >= 2 ? 'ph-fill ph-star star-filled' : 'ph-bold ph-star'}"></i>
                        <i class="${stars >= 3 ? 'ph-fill ph-star star-filled' : 'ph-bold ph-star'}"></i>
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
                <div style="margin-bottom: 12px;"><i class="ph-bold ph-hash" style="font-size: 40px; color: var(--accent-gold);"></i></div>
                <h4 style="font-size: 18px; color: var(--accent-gold); margin-bottom: 8px;">Klassik Raqamlar Tartibi</h4>
                <p style="color: var(--text-secondary); font-size: 14px; line-height: 1.6;">
                    Raqamlarni 1 dan boshlab ketma-ketlikda oʻsish tartibida joylashtiring.<br>
                    Oxirgi oʻng pastki katakcha boʻsh (0) holatda qolishi kerak!
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
