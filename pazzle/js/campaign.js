// Campaign / Progression Mode: "Oddiydan Mukammallikkacha" (Beginner to Grandmaster)
// 10 progressively challenging, beautifully designed levels with star ratings & unlocks

class CampaignManager {
    constructor() {
        this.storageKey = 'puzzle_campaign_progress_v1';
        this.levels = [
            {
                id: 1,
                name: '1-Bosqich: Birinchi Qadam',
                name_en: 'Level 1: First Steps',
                name_ru: 'Уровень 1: Первые шаги',
                mode: 'sliding',
                size: 3,
                art: 'numbers',
                diff: 'easy',
                desc: '3x3 Oson suriluvchi raqamlar (Boshlovchilar uchun)',
                targetMoves: [25, 45, 80],
                targetTime: [40, 80, 150]
            },
            {
                id: 2,
                name: '2-Bosqich: Registon Naqshlari',
                name_en: 'Level 2: Samarkand Mosaic',
                name_ru: 'Уровень 2: Узоры Регистана',
                mode: 'jigsaw',
                size: 3,
                art: 'ancient_mosaic',
                diff: 'easy',
                desc: '3x3 Mozaika boʻlaklarini birlashtirish',
                targetMoves: [15, 25, 50],
                targetTime: [50, 90, 180]
            },
            {
                id: 3,
                name: '3-Bosqich: Klassik 15-Pazl',
                name_en: 'Level 3: Classic 15-Puzzle',
                name_ru: 'Уровень 3: Классические Пятнашки',
                mode: 'sliding',
                size: 4,
                art: 'numbers',
                diff: 'medium',
                desc: 'Dunyoga mashhur 4x4 klassik raqamlar',
                targetMoves: [80, 140, 250],
                targetTime: [90, 180, 360]
            },
            {
                id: 4,
                name: '4-Bosqich: Fazoviy Galaktika',
                name_en: 'Level 4: Cosmic Nebula',
                name_ru: 'Уровень 4: Космическая Туманность',
                mode: 'sliding',
                size: 3,
                art: 'galaxy',
                diff: 'hard',
                desc: '3x3 Koinot surati boʻlaklarini yigʻish',
                targetMoves: [35, 60, 100],
                targetTime: [60, 120, 240]
            },
            {
                id: 5,
                name: '5-Bosqich: Togʻ Quyosh Botishi',
                name_en: 'Level 5: Mountain Dusk',
                name_ru: 'Уровень 5: Закат в горах',
                mode: 'swap',
                size: 4,
                art: 'sunset_mountain',
                diff: 'medium',
                desc: '4x4 Boʻlaklarni almashtirish pazli',
                targetMoves: [24, 38, 60],
                targetTime: [70, 130, 240]
            },
            {
                id: 6,
                name: '6-Bosqich: Sehrli Zumrad Oʻrmon',
                name_en: 'Level 6: Enchanted Forest',
                name_ru: 'Уровень 6: Волшебный лес',
                mode: 'jigsaw',
                size: 4,
                art: 'nature_forest',
                diff: 'hard',
                desc: '4x4 Haqiqiy qulflanuvchi mozaika',
                targetMoves: [28, 45, 80],
                targetTime: [100, 180, 320]
            },
            {
                id: 7,
                name: '7-Bosqich: Kiberpank Neon Shahar',
                name_en: 'Level 7: Cyberpunk Metropolis',
                name_ru: 'Уровень 7: Неоновый Киберпанк',
                mode: 'sliding',
                size: 4,
                art: 'cyber_city',
                diff: 'hard',
                desc: '4x4 Murakkab kiberpank manzarasi',
                targetMoves: [90, 160, 280],
                targetTime: [120, 240, 420]
            },
            {
                id: 8,
                name: '8-Bosqich: 24-Pazl Qiyin Sinov',
                name_en: 'Level 8: 24-Puzzle Challenge',
                name_ru: 'Уровень 8: Испытание 24-Пазл',
                mode: 'sliding',
                size: 5,
                art: 'numbers',
                diff: 'hard',
                desc: '5x5 Katta oʻlchamli suriluvchi raqamlar',
                targetMoves: [160, 260, 450],
                targetTime: [180, 360, 600]
            },
            {
                id: 9,
                name: '9-Bosqich: Grossmeyster Mozaikasi',
                name_en: 'Level 9: Grandmaster Mosaic',
                name_ru: 'Уровень 9: Мозаика Гроссмейстера',
                mode: 'jigsaw',
                size: 5,
                art: 'geometric_mandala',
                diff: 'hard',
                desc: '5x5 Oltin Mandala mozaikasi',
                targetMoves: [45, 75, 130],
                targetTime: [180, 320, 550]
            },
            {
                id: 10,
                name: '10-Bosqich: Afsonaviy Mukammallik (Extreme)',
                name_en: 'Level 10: Legendary Masterpiece',
                name_ru: 'Уровень 10: Легендарное Совершенство',
                mode: 'sliding',
                size: 6,
                art: 'ancient_mosaic',
                diff: 'hard',
                desc: '6x6 Yuqori darajadagi eng qiyin sinov!',
                targetMoves: [240, 400, 700],
                targetTime: [300, 600, 1000]
            }
        ];

        this.progress = this.loadProgress();
    }

    loadProgress() {
        try {
            const data = localStorage.getItem(this.storageKey);
            if (data) return JSON.parse(data);
        } catch (e) {
            console.error('Storage error', e);
        }
        // Default: Level 1 unlocked with 0 stars
        return {
            unlockedLevel: 1,
            stars: {}, // { levelId: 1..3 }
            bestMoves: {},
            bestTimes: {}
        };
    }

    saveProgress() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.progress));
        } catch (e) {
            console.error('Storage save error', e);
        }
    }

    isUnlocked(levelId) {
        return levelId <= this.progress.unlockedLevel;
    }

    getLevel(levelId) {
        return this.levels.find(l => l.id === levelId);
    }

    recordWin(levelId, moves, time) {
        const lvl = this.getLevel(levelId);
        if (!lvl) return { stars: 1, isNewUnlock: false };

        // Calculate stars
        let stars = 1;
        if (moves <= lvl.targetMoves[0] && time <= lvl.targetTime[0]) {
            stars = 3;
        } else if (moves <= lvl.targetMoves[1] && time <= lvl.targetTime[1]) {
            stars = 2;
        }

        // Save best
        const prevStars = this.progress.stars[levelId] || 0;
        if (stars > prevStars) {
            this.progress.stars[levelId] = stars;
        }

        if (!this.progress.bestMoves[levelId] || moves < this.progress.bestMoves[levelId]) {
            this.progress.bestMoves[levelId] = moves;
        }
        if (!this.progress.bestTimes[levelId] || time < this.progress.bestTimes[levelId]) {
            this.progress.bestTimes[levelId] = time;
        }

        // Unlock next level
        let isNewUnlock = false;
        if (levelId === this.progress.unlockedLevel && levelId < this.levels.length) {
            this.progress.unlockedLevel++;
            isNewUnlock = true;
        }

        this.saveProgress();
        return { stars, isNewUnlock, nextLevelId: levelId < this.levels.length ? levelId + 1 : null };
    }

    getTotalStars() {
        return Object.values(this.progress.stars).reduce((sum, s) => sum + s, 0);
    }
}

window.campaignManager = new CampaignManager();
