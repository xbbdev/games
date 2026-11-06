/**
 * Shashka (Checkers) Main Application Controller
 * Handles 100-Level Campaign, UI interactions, rendering, AI triggers, animations, and sound effects.
 */

(function () {
  'use strict';

  const {
    CheckersGame,
    AI,
    PLAYER_WHITE,
    PLAYER_BLACK,
    WHITE_MAN,
    WHITE_KING,
    BLACK_MAN,
    BLACK_KING,
    EMPTY,
    isDarkSquare,
    getLevelConfig
  } = window.CheckersEngine;

  // Sound Synthesizer
  const sound = new window.SoundManager();

  // SVG Crown for Kings
  const CROWN_SVG = `
    <svg class="crown-icon" viewBox="0 0 24 24">
      <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1z"/>
    </svg>
  `;

  // Application State
  const state = {
    game: new CheckersGame(),
    mode: 'campaign', // 'campaign', 'ai', 'pvp'
    aiDifficulty: 'medium', // for free 'ai' mode: 'easy', 'medium', 'hard'
    playerColor: PLAYER_WHITE,
    isBoardFlipped: false,
    selectedSquare: null, // { r, c }
    validDestinations: [], // array of moves
    hintMove: null, // { from, to }
    isAiThinking: false,
    historyDisplay: [], // { num, white, black }

    // 100-Level Campaign State
    campaign: {
      currentLevel: 1,
      unlockedLevel: 1,
      stars: {}, // { levelNum: 1..3 }
      selectedTierTab: 1
    }
  };

  // DOM Elements
  const boardEl = document.getElementById('board');
  const playerWhiteCard = document.getElementById('playerWhiteCard');
  const playerBlackCard = document.getElementById('playerBlackCard');
  const playerWhiteTitle = document.getElementById('playerWhiteTitle');
  const playerBlackTitle = document.getElementById('playerBlackTitle');
  const playerWhiteRole = document.getElementById('playerWhiteRole');
  const playerBlackRole = document.getElementById('playerBlackRole');
  const whitePiecesCount = document.getElementById('whitePiecesCount');
  const blackPiecesCount = document.getElementById('blackPiecesCount');
  const whiteKingsCount = document.getElementById('whiteKingsCount');
  const blackKingsCount = document.getElementById('blackKingsCount');
  const forcedAlert = document.getElementById('forcedAlert');
  const historyList = document.getElementById('historyList');
  const turnCounter = document.getElementById('turnCounter');

  // Campaign HUD Elements
  const campaignBar = document.getElementById('campaignBar');
  const campaignLevelNum = document.getElementById('campaignLevelNum');
  const campaignLevelTitle = document.getElementById('campaignLevelTitle');
  const campaignTierTag = document.getElementById('campaignTierTag');
  const campaignEloTag = document.getElementById('campaignEloTag');
  const campaignStarsCount = document.getElementById('campaignStarsCount');
  const campaignProgressBar = document.getElementById('campaignProgressBar');
  const campaignProgressPct = document.getElementById('campaignProgressPct');
  const btnSelectLevel = document.getElementById('btnSelectLevel');

  // Mode Selector Pills
  const btnModeCampaign = document.getElementById('btnModeCampaign');
  const btnModeFree = document.getElementById('btnModeFree');

  // Top Nav Buttons
  const btnOpenLevels = document.getElementById('btnOpenLevels');
  const btnNewGame = document.getElementById('btnNewGame');
  const btnUndo = document.getElementById('btnUndo');
  const btnHint = document.getElementById('btnHint');
  const btnSound = document.getElementById('btnSound');
  const soundIcon = document.getElementById('soundIcon');
  const btnSettings = document.getElementById('btnSettings');
  const btnRules = document.getElementById('btnRules');
  const btnFlip = document.getElementById('btnFlip');
  const btnOfferDraw = document.getElementById('btnOfferDraw');
  const btnResign = document.getElementById('btnResign');

  // Coordinates
  const coordHTop = document.getElementById('coordHTop');
  const coordHBottom = document.getElementById('coordHBottom');
  const coordVLeft = document.getElementById('coordVLeft');
  const coordVRight = document.getElementById('coordVRight');

  // 100-Levels Modal
  const levelsModal = document.getElementById('levelsModal');
  const btnCloseLevels = document.getElementById('btnCloseLevels');
  const modalTotalStars = document.getElementById('modalTotalStars');
  const modalUnlockedCount = document.getElementById('modalUnlockedCount');
  const modalRankName = document.getElementById('modalRankName');
  const tierTabs = document.getElementById('tierTabs');
  const levelsGrid = document.getElementById('levelsGrid');

  // Settings Modal
  const settingsModal = document.getElementById('settingsModal');
  const btnCloseSettings = document.getElementById('btnCloseSettings');
  const rulesModal = document.getElementById('rulesModal');
  const btnCloseRules = document.getElementById('btnCloseRules');
  const winnerModal = document.getElementById('winnerModal');
  const winnerTitle = document.getElementById('winnerTitle');
  const winnerSubtitle = document.getElementById('winnerSubtitle');
  const winnerIcon = document.getElementById('winnerIcon');
  const winnerStars = document.getElementById('winnerStars');
  const btnPlayAgain = document.getElementById('btnPlayAgain');
  const btnNextLevel = document.getElementById('btnNextLevel');
  const btnCloseWinner = document.getElementById('btnCloseWinner');

  // Segmented controls
  const modeSelect = document.getElementById('modeSelect');
  const diffSelect = document.getElementById('diffSelect');
  const colorSelect = document.getElementById('colorSelect');
  const themeSelect = document.getElementById('themeSelect');
  const difficultyGroup = document.getElementById('difficultyGroup');
  const colorGroup = document.getElementById('colorGroup');

  /**
   * Draughts notation conversion
   */
  function toSquareNotation(r, c) {
    const colName = String.fromCharCode(97 + c);
    const rowName = (r + 1).toString();
    return colName + rowName;
  }

  function formatMoveNotation(from, to, isCapture) {
    const sep = isCapture ? ':' : '-';
    return `${toSquareNotation(from.r, from.c)}${sep}${toSquareNotation(to.r, to.c)}`;
  }

  /**
   * Calculate total stars earned in Campaign
   */
  function getTotalStars() {
    let total = 0;
    for (const lvl in state.campaign.stars) {
      total += state.campaign.stars[lvl] || 0;
    }
    return total;
  }

  /**
   * Load saved campaign & app settings from localStorage
   */
  function loadSavedData() {
    try {
      const savedTheme = localStorage.getItem('shashka_theme');
      if (savedTheme) setTheme(savedTheme);

      const savedMode = localStorage.getItem('shashka_mode');
      if (savedMode) state.mode = savedMode;

      const savedDiff = localStorage.getItem('shashka_diff');
      if (savedDiff) state.aiDifficulty = savedDiff;

      const savedColor = localStorage.getItem('shashka_color');
      if (savedColor) {
        state.playerColor = savedColor === 'white' ? PLAYER_WHITE : PLAYER_BLACK;
        state.isBoardFlipped = state.playerColor === PLAYER_BLACK;
      }

      // Campaign data
      const savedCampaign = localStorage.getItem('shashka_campaign_data');
      if (savedCampaign) {
        const parsed = JSON.parse(savedCampaign);
        if (parsed.currentLevel) state.campaign.currentLevel = Math.max(1, Math.min(100, parsed.currentLevel));
        if (parsed.unlockedLevel) state.campaign.unlockedLevel = Math.max(1, Math.min(100, parsed.unlockedLevel));
        if (parsed.stars) state.campaign.stars = parsed.stars;
      }
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }
    updateModePillsUI();
    renderCampaignBar();
    updateSettingsUI();
  }

  function saveCampaignData() {
    try {
      localStorage.setItem('shashka_campaign_data', JSON.stringify({
        currentLevel: state.campaign.currentLevel,
        unlockedLevel: state.campaign.unlockedLevel,
        stars: state.campaign.stars
      }));
    } catch (e) {}
  }

  function saveSettings() {
    try {
      localStorage.setItem('shashka_mode', state.mode);
      localStorage.setItem('shashka_diff', state.aiDifficulty);
      localStorage.setItem('shashka_color', state.playerColor === PLAYER_WHITE ? 'white' : 'black');
    } catch (e) {}
  }

  function setTheme(theme) {
    document.body.setAttribute('data-theme', theme);
    try {
      localStorage.setItem('shashka_theme', theme);
    } catch (e) {}
    themeSelect.querySelectorAll('.seg-btn').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-theme') === theme);
    });
  }

  function updateModePillsUI() {
    const isCampaign = state.mode === 'campaign';
    btnModeCampaign.classList.toggle('active', isCampaign);
    btnModeFree.classList.toggle('active', !isCampaign);
    campaignBar.classList.toggle('hidden', !isCampaign);
  }

  function updateSettingsUI() {
    modeSelect.querySelectorAll('.seg-btn').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-mode') === state.mode);
    });
    diffSelect.querySelectorAll('.seg-btn').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-diff') === state.aiDifficulty);
    });
    colorSelect.querySelectorAll('.seg-btn').forEach(btn => {
      const col = btn.getAttribute('data-color') === 'white' ? PLAYER_WHITE : PLAYER_BLACK;
      btn.classList.toggle('active', col === state.playerColor);
    });

    if (state.mode === 'pvp') {
      difficultyGroup.style.display = 'none';
      colorGroup.style.display = 'none';
    } else if (state.mode === 'campaign') {
      difficultyGroup.style.display = 'none';
      colorGroup.style.display = 'block';
    } else {
      difficultyGroup.style.display = 'block';
      colorGroup.style.display = 'block';
    }
  }

  /**
   * Render Campaign Top HUD Bar
   */
  function renderCampaignBar() {
    if (state.mode !== 'campaign') {
      campaignBar.classList.add('hidden');
      return;
    }
    campaignBar.classList.remove('hidden');

    const cfg = getLevelConfig(state.campaign.currentLevel);
    campaignLevelNum.textContent = `${cfg.level}-bosqich`;
    campaignLevelTitle.textContent = cfg.title;
    campaignTierTag.textContent = cfg.tierName;
    campaignTierTag.className = 'elo-tag ' + cfg.tierClass;
    campaignEloTag.textContent = `${cfg.elo} ELO`;

    const starsTotal = getTotalStars();
    campaignStarsCount.textContent = `⭐ ${starsTotal} / 300`;

    const progressPct = Math.round((state.campaign.unlockedLevel / 100) * 100);
    campaignProgressBar.style.width = `${progressPct}%`;
    campaignProgressPct.textContent = `${progressPct}% (${state.campaign.unlockedLevel}/100)`;
  }

  /**
   * Render the 100 Levels Grid Modal
   */
  function openLevelsModal(tier = 1) {
    state.campaign.selectedTierTab = tier;

    // Header stats
    const totalStars = getTotalStars();
    modalTotalStars.textContent = `⭐ ${totalStars} / 300`;
    modalUnlockedCount.textContent = `${state.campaign.unlockedLevel} / 100`;

    const currentCfg = getLevelConfig(state.campaign.currentLevel);
    modalRankName.textContent = currentCfg.tierName;

    // Update active tab buttons
    tierTabs.querySelectorAll('.tier-tab-btn').forEach(btn => {
      const t = parseInt(btn.getAttribute('data-tier'), 10);
      btn.classList.toggle('active', t === tier);
    });

    // Render 20 level cards for the selected tier
    const startLvl = (tier - 1) * 20 + 1;
    const endLvl = tier * 20;

    levelsGrid.innerHTML = '';

    for (let lvl = startLvl; lvl <= endLvl; lvl++) {
      const cfg = getLevelConfig(lvl);
      const isUnlocked = lvl <= state.campaign.unlockedLevel;
      const isCurrent = lvl === state.campaign.currentLevel;
      const stars = state.campaign.stars[lvl] || 0;

      const card = document.createElement('div');
      card.className = `level-card ${cfg.tierClass}` + (isUnlocked ? '' : ' locked') + (isCurrent ? ' current-playing' : '');

      let starsHtml = '';
      if (isUnlocked) {
        for (let s = 1; s <= 3; s++) {
          if (s <= stars) {
            starsHtml += '⭐';
          } else {
            starsHtml += '☆';
          }
        }
      } else {
        starsHtml = '🔒';
      }

      card.innerHTML = `
        <div class="level-num-circle">${lvl}</div>
        <div class="level-card-name">${cfg.title.replace(`${lvl}-bosqich: `, '')}</div>
        <div class="level-card-elo">${cfg.elo} ELO</div>
        <div class="level-card-stars ${stars === 0 ? 'empty' : ''}">${starsHtml}</div>
      `;

      if (isUnlocked) {
        card.addEventListener('click', () => {
          state.campaign.currentLevel = lvl;
          saveCampaignData();
          renderCampaignBar();
          levelsModal.classList.remove('active');
          startNewGame();
        });
      }

      levelsGrid.appendChild(card);
    }

    levelsModal.classList.add('active');
  }

  /**
   * Update Coordinate labels around board
   */
  function updateCoordinates() {
    const cols = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
    const rows = ['1', '2', '3', '4', '5', '6', '7', '8'];

    const displayedCols = state.isBoardFlipped ? [...cols].reverse() : cols;
    const displayedRows = state.isBoardFlipped ? rows : [...rows].reverse();

    coordHTop.innerHTML = displayedCols.map(c => `<span>${c}</span>`).join('');
    coordHBottom.innerHTML = displayedCols.map(c => `<span>${c}</span>`).join('');
    coordVLeft.innerHTML = displayedRows.map(r => `<span>${r}</span>`).join('');
    coordVRight.innerHTML = displayedRows.map(r => `<span>${r}</span>`).join('');
  }

  /**
   * Render the 8x8 Board
   */
  function renderBoard() {
    boardEl.innerHTML = '';

    const board = state.game.board;
    const forcedPieces = state.game.getForcedPieces();
    const isCaptureForced = state.game.isCaptureForced();

    const isCurrentTurnHuman = state.mode === 'pvp' || state.game.turn === state.playerColor;
    if (isCaptureForced && isCurrentTurnHuman && state.game.state === 'active') {
      forcedAlert.classList.remove('hidden');
    } else {
      forcedAlert.classList.add('hidden');
    }

    const rowIndices = state.isBoardFlipped
      ? [0, 1, 2, 3, 4, 5, 6, 7]
      : [7, 6, 5, 4, 3, 2, 1, 0];
    const colIndices = state.isBoardFlipped
      ? [7, 6, 5, 4, 3, 2, 1, 0]
      : [0, 1, 2, 3, 4, 5, 6, 7];

    for (const r of rowIndices) {
      for (const c of colIndices) {
        const square = document.createElement('div');
        square.className = 'square ' + (isDarkSquare(r, c) ? 'dark' : 'light');
        square.dataset.r = r;
        square.dataset.c = c;

        // Last move highlight
        if (state.game.lastMove) {
          if (state.game.lastMove.from.r === r && state.game.lastMove.from.c === c) {
            square.classList.add('last-move-from');
          }
          if (state.game.lastMove.to.r === r && state.game.lastMove.to.c === c) {
            square.classList.add('last-move-to');
          }
        }

        // Hint highlight
        if (state.hintMove) {
          if (state.hintMove.from.r === r && state.hintMove.from.c === c) {
            square.style.boxShadow = 'inset 0 0 0 3px #00e5ff';
          }
          if (state.hintMove.to.r === r && state.hintMove.to.c === c) {
            square.style.boxShadow = 'inset 0 0 0 3px #00e5ff';
          }
        }

        const pieceVal = board[r][c];
        if (pieceVal !== EMPTY) {
          const pieceEl = document.createElement('div');
          const isWhite = pieceVal > 0;
          pieceEl.className = 'piece ' + (isWhite ? 'white' : 'black');

          // Crown for King
          if (Math.abs(pieceVal) === 2) {
            pieceEl.innerHTML = CROWN_SVG;
          }

          // Selected piece highlight
          if (state.selectedSquare && state.selectedSquare.r === r && state.selectedSquare.c === c) {
            pieceEl.classList.add('selected');
          }

          // Forced capture piece glow
          const isForced = forcedPieces.some(p => p.r === r && p.c === c);
          if (isForced && isCurrentTurnHuman) {
            pieceEl.classList.add('forced-to-capture');
          }

          square.appendChild(pieceEl);
        }

        // Move destination indicators
        const matchingMove = state.validDestinations.find(m => m.to.r === r && m.to.c === c);
        if (matchingMove) {
          const destMarker = document.createElement('div');
          if (matchingMove.captured) {
            destMarker.className = 'capture-dest-indicator';
          } else {
            destMarker.className = 'move-dest-indicator';
          }
          square.appendChild(destMarker);
        }

        // Square Click Listener
        square.addEventListener('click', () => onSquareClicked(r, c));

        boardEl.appendChild(square);
      }
    }

    updatePlayerCards();
  }

  /**
   * Update Player Cards with piece counts and active turn indicators
   */
  function updatePlayerCards() {
    const counts = state.game.getPieceCount();
    whitePiecesCount.textContent = counts.white;
    blackPiecesCount.textContent = counts.black;
    whiteKingsCount.textContent = counts.whiteKings;
    blackKingsCount.textContent = counts.blackKings;

    const isWhiteTurn = state.game.turn === PLAYER_WHITE;
    playerWhiteCard.classList.toggle('active-turn', isWhiteTurn && state.game.state === 'active');
    playerBlackCard.classList.toggle('active-turn', !isWhiteTurn && state.game.state === 'active');

    if (state.mode === 'campaign') {
      const cfg = getLevelConfig(state.campaign.currentLevel);
      if (state.playerColor === PLAYER_WHITE) {
        playerWhiteTitle.textContent = "Siz (O'yinchi)";
        playerWhiteRole.textContent = "Oqlar";
        playerBlackTitle.textContent = `Bot (${cfg.level}-bosqich)`;
        playerBlackRole.textContent = `${cfg.elo} ELO • ${cfg.tierName}`;
      } else {
        playerWhiteTitle.textContent = `Bot (${cfg.level}-bosqich)`;
        playerWhiteRole.textContent = `${cfg.elo} ELO • ${cfg.tierName}`;
        playerBlackTitle.textContent = "Siz (O'yinchi)";
        playerBlackRole.textContent = "Qoralar";
      }
    } else if (state.mode === 'ai') {
      const diffName = state.aiDifficulty === 'easy' ? 'Oson' : (state.aiDifficulty === 'medium' ? "O'rtacha" : 'Qiyin');
      if (state.playerColor === PLAYER_WHITE) {
        playerWhiteTitle.textContent = "Siz (O'yinchi)";
        playerWhiteRole.textContent = "Oqlar";
        playerBlackTitle.textContent = `Kompyuter (${diffName})`;
        playerBlackRole.textContent = "Qoralar (Bot)";
      } else {
        playerWhiteTitle.textContent = `Kompyuter (${diffName})`;
        playerWhiteRole.textContent = "Oqlar (Bot)";
        playerBlackTitle.textContent = "Siz (O'yinchi)";
        playerBlackRole.textContent = "Qoralar";
      }
    } else {
      playerWhiteTitle.textContent = "1-O'yinchi";
      playerWhiteRole.textContent = "Oqlar";
      playerBlackTitle.textContent = "2-O'yinchi";
      playerBlackRole.textContent = "Qoralar";
    }

    const whitePill = playerWhiteCard.querySelector('.turn-pill');
    const blackPill = playerBlackCard.querySelector('.turn-pill');
    if (state.game.state !== 'active') {
      whitePill.textContent = "O'yin tugadi";
      blackPill.textContent = "O'yin tugadi";
    } else if (isWhiteTurn) {
      whitePill.textContent = 'Yurish navbati';
      blackPill.textContent = 'Kutmoqda';
    } else {
      whitePill.textContent = 'Kutmoqda';
      blackPill.textContent = 'Yurish navbati';
    }

    turnCounter.textContent = `Yurish: ${state.game.turnCount}`;
  }

  /**
   * Handle Board Square Click
   */
  function onSquareClicked(r, c) {
    if (state.game.state !== 'active' || state.isAiThinking) {
      return;
    }

    // Check if it's the player's turn against Bot
    if (state.mode !== 'pvp' && state.game.turn !== state.playerColor) {
      return;
    }

    state.hintMove = null;

    const clickedPiece = state.game.board[r][c];
    const isPlayerPiece = (state.game.turn === PLAYER_WHITE && clickedPiece > 0) ||
                          (state.game.turn === PLAYER_BLACK && clickedPiece < 0);

    // Case 1: Mid multi-jump in progress
    if (state.game.multiJump) {
      const validMoves = state.game.getValidMoves();
      const chosenMove = validMoves.find(m => m.to.r === r && m.to.c === c);
      if (chosenMove) {
        executeHumanMove(chosenMove.from.r, chosenMove.from.c, r, c);
      } else {
        sound.playInvalid();
      }
      return;
    }

    // Case 2: Destination clicked for already selected piece
    if (state.selectedSquare) {
      const chosenMove = state.validDestinations.find(m => m.to.r === r && m.to.c === c);
      if (chosenMove) {
        executeHumanMove(state.selectedSquare.r, state.selectedSquare.c, r, c);
        return;
      }
    }

    // Case 3: Selecting a piece of the current player
    if (isPlayerPiece) {
      const pieceMoves = state.game.getValidMovesForPiece(r, c);
      if (pieceMoves.length > 0) {
        state.selectedSquare = { r, c };
        state.validDestinations = pieceMoves;
        sound.playMove();
        renderBoard();
      } else {
        sound.playInvalid();
      }
      return;
    }

    // Case 4: Clicked empty or enemy square without valid move
    if (state.selectedSquare) {
      state.selectedSquare = null;
      state.validDestinations = [];
      renderBoard();
    }
  }

  /**
   * Execute human move
   */
  function executeHumanMove(fromR, fromC, toR, toC) {
    const result = state.game.makeMove(fromR, fromC, toR, toC);

    if (!result.success) {
      sound.playInvalid();
      return;
    }

    // Audio effects
    if (result.promoted) {
      sound.playPromotion();
    } else if (result.captured) {
      sound.playCapture();
    } else {
      sound.playMove();
    }

    if (result.nextCaptureAvailable) {
      // Multi-jump continues!
      state.selectedSquare = result.activePiece;
      state.validDestinations = state.game.getValidMoves();
      renderBoard();
    } else {
      // Turn ended
      state.selectedSquare = null;
      state.validDestinations = [];
      addMoveToHistory(state.game.lastMove);
      renderBoard();

      // Check game over
      if (result.gameOver) {
        handleGameOver(result.winner);
      } else {
        checkTriggerAI();
      }
    }
  }

  /**
   * Add completed turn move to history log
   */
  function addMoveToHistory(moveRecord) {
    if (!moveRecord) return;

    let notation = '';
    if (moveRecord.steps && moveRecord.steps.length > 1) {
      const parts = [toSquareNotation(moveRecord.steps[0].from.r, moveRecord.steps[0].from.c)];
      for (const step of moveRecord.steps) {
        parts.push(toSquareNotation(step.to.r, step.to.c));
      }
      notation = parts.join(':');
    } else {
      notation = formatMoveNotation(moveRecord.from, moveRecord.to, moveRecord.captured && moveRecord.captured.length > 0);
    }

    const wasWhite = state.game.turn === PLAYER_BLACK;

    if (wasWhite) {
      state.historyDisplay.push({
        num: state.historyDisplay.length + 1,
        white: notation,
        black: ''
      });
    } else {
      if (state.historyDisplay.length > 0) {
        state.historyDisplay[state.historyDisplay.length - 1].black = notation;
      } else {
        state.historyDisplay.push({ num: 1, white: '...', black: notation });
      }
    }

    renderHistory();
  }

  function renderHistory() {
    historyList.innerHTML = '';
    state.historyDisplay.forEach((item, idx) => {
      const row = document.createElement('div');
      row.className = 'history-row' + (idx === state.historyDisplay.length - 1 ? ' latest' : '');
      row.innerHTML = `
        <span class="history-num">${item.num}.</span>
        <span class="history-white">${item.white}</span>
        <span class="history-black">${item.black}</span>
      `;
      historyList.appendChild(row);
    });
    historyList.scrollTop = historyList.scrollHeight;
  }

  /**
   * Trigger AI move if in campaign or AI mode
   */
  function checkTriggerAI() {
    if (state.mode === 'pvp' || state.game.state !== 'active') return;
    if (state.game.turn === state.playerColor) return;

    state.isAiThinking = true;
    renderBoard();

    // Natural calculation delay
    setTimeout(() => {
      let bestMove = null;
      if (state.mode === 'campaign') {
        bestMove = AI.getBestMoveForLevel(state.game, state.campaign.currentLevel);
      } else {
        bestMove = AI.getBestMove(state.game, state.aiDifficulty);
      }

      if (!bestMove) {
        state.isAiThinking = false;
        renderBoard();
        return;
      }

      executeAIMoveSteps(bestMove.steps, 0);
    }, 400);
  }

  /**
   * Animate AI multi-jump steps sequentially
   */
  function executeAIMoveSteps(steps, index) {
    if (index >= steps.length) {
      state.isAiThinking = false;
      renderBoard();
      return;
    }

    const step = steps[index];
    const result = state.game.makeMove(step.from.r, step.from.c, step.to.r, step.to.c);

    if (result.promoted) {
      sound.playPromotion();
    } else if (result.captured) {
      sound.playCapture();
    } else {
      sound.playMove();
    }

    renderBoard();

    if (result.nextCaptureAvailable) {
      setTimeout(() => {
        executeAIMoveSteps(steps, index + 1);
      }, 350);
    } else {
      addMoveToHistory(state.game.lastMove);
      state.isAiThinking = false;
      renderBoard();

      if (result.gameOver) {
        handleGameOver(result.winner);
      }
    }
  }

  /**
   * Game Over handler with 100-Level Campaign victory and stars progression
   */
  function handleGameOver(winner) {
    winnerStars.innerHTML = '';

    if (winner === 'draw' || state.game.state === 'draw') {
      winnerIcon.textContent = '🤝';
      winnerTitle.textContent = 'Durang!';
      winnerSubtitle.textContent = "O'yin durang natija bilan yakunlandi.";
      btnNextLevel.style.display = 'none';
    } else if (winner === state.playerColor) {
      // Human WON!
      winnerIcon.textContent = '🏆';
      sound.playWin();

      if (state.mode === 'campaign') {
        const curLvl = state.campaign.currentLevel;
        const cfg = getLevelConfig(curLvl);

        // Calculate stars
        const counts = state.game.getPieceCount();
        const playerRemaining = state.playerColor === PLAYER_WHITE ? counts.white : counts.black;

        let starsEarned = 1; // 1 star for victory
        if (playerRemaining >= 6 || state.game.turnCount <= 32) {
          starsEarned = 3;
        } else if (playerRemaining >= 4) {
          starsEarned = 2;
        }

        // Save stars
        const prevStars = state.campaign.stars[curLvl] || 0;
        state.campaign.stars[curLvl] = Math.max(prevStars, starsEarned);

        // Unlock next level if currently at highest unlocked
        if (state.campaign.unlockedLevel === curLvl && curLvl < 100) {
          state.campaign.unlockedLevel = curLvl + 1;
        }
        saveCampaignData();
        renderCampaignBar();

        winnerTitle.textContent = `Tabriklaymiz! ${curLvl}-bosqich Zabt Etildi!`;
        winnerSubtitle.textContent = `${cfg.title} (${cfg.elo} ELO) ustidan to'liq g'alaba qozondingiz!`;

        // Render animated stars
        let starsHtml = '';
        for (let s = 1; s <= 3; s++) {
          if (s <= starsEarned) {
            starsHtml += `<span class="star-pop" style="animation-delay: ${s * 0.2}s">⭐</span>`;
          } else {
            starsHtml += '<span class="star-empty">☆</span>';
          }
        }
        winnerStars.innerHTML = starsHtml;

        if (curLvl < 100) {
          btnNextLevel.style.display = 'inline-flex';
          btnNextLevel.onclick = () => {
            winnerModal.classList.remove('active');
            state.campaign.currentLevel = curLvl + 1;
            saveCampaignData();
            renderCampaignBar();
            startNewGame();
          };
        } else {
          btnNextLevel.style.display = 'none';
          winnerSubtitle.textContent = "SIZ 100-BOSQICHNI YUTIB, MUTLAQ GROSSMEYSTER BO'LDINGIZ! 👑";
        }
      } else {
        winnerTitle.textContent = "G'alaba! Tabriklaymiz!";
        winnerSubtitle.textContent = "Siz ajoyib g'alabaga erishdingiz!";
        btnNextLevel.style.display = 'none';
      }
    } else {
      // Bot WON
      winnerIcon.textContent = '🤖';
      sound.playLose();
      btnNextLevel.style.display = 'none';

      if (state.mode === 'campaign') {
        const cfg = getLevelConfig(state.campaign.currentLevel);
        winnerTitle.textContent = 'Mag\'lubiyat!';
        winnerSubtitle.textContent = `${cfg.title} (${cfg.elo} ELO) bu safar ustun keldi. Qayta urinib ko'ring!`;
      } else {
        winnerTitle.textContent = 'Kompyuter g\'alaba qozondi!';
        winnerSubtitle.textContent = 'Bu safar bot ustun keldi. Yana bir urinib ko\'ring!';
      }
    }

    setTimeout(() => {
      winnerModal.classList.add('active');
    }, 450);
  }

  /**
   * Start New Game
   */
  function startNewGame() {
    state.game.reset();
    state.selectedSquare = null;
    state.validDestinations = [];
    state.hintMove = null;
    state.isAiThinking = false;
    state.historyDisplay = [];
    renderHistory();
    updateCoordinates();
    renderBoard();
    renderCampaignBar();

    // If human selected Black, Bot (White) makes the first move!
    if (state.mode !== 'pvp' && state.playerColor === PLAYER_BLACK) {
      checkTriggerAI();
    }
  }

  /**
   * Undo Move
   */
  function undoMove() {
    if (state.isAiThinking) return;

    if (state.mode !== 'pvp') {
      if (state.game.history.length === 0) return;

      if (state.game.turn === state.playerColor) {
        state.game.undo(); // Undo AI
        state.game.undo(); // Undo Human
        if (state.historyDisplay.length > 0) {
          state.historyDisplay.pop();
        }
      } else {
        state.game.undo(); // Undo Human
        if (state.historyDisplay.length > 0) {
          state.historyDisplay[state.historyDisplay.length - 1].white = '';
        }
      }
    } else {
      if (!state.game.undo()) return;
      if (state.historyDisplay.length > 0) {
        const last = state.historyDisplay[state.historyDisplay.length - 1];
        if (last.black !== '') {
          last.black = '';
        } else {
          state.historyDisplay.pop();
        }
      }
    }

    state.selectedSquare = null;
    state.validDestinations = [];
    state.hintMove = null;
    sound.playMove();
    renderHistory();
    renderBoard();
  }

  /**
   * Hint / Maslahat
   */
  function showHint() {
    if (state.game.state !== 'active' || state.isAiThinking) return;

    // Use Level 95 Grandmaster search for hints
    const bestMove = AI.getBestMoveForLevel(state.game, 95);
    if (!bestMove) return;

    const firstStep = bestMove.steps[0];
    state.hintMove = { from: firstStep.from, to: firstStep.to };
    state.selectedSquare = firstStep.from;
    state.validDestinations = state.game.getValidMovesForPiece(firstStep.from.r, firstStep.from.c);

    sound.playHint();
    renderBoard();
  }

  /**
   * Event Listeners Setup
   */
  function setupEventListeners() {
    btnNewGame.addEventListener('click', startNewGame);
    btnPlayAgain.addEventListener('click', () => {
      winnerModal.classList.remove('active');
      startNewGame();
    });
    btnCloseWinner.addEventListener('click', () => {
      winnerModal.classList.remove('active');
    });

    btnUndo.addEventListener('click', undoMove);
    btnHint.addEventListener('click', showHint);

    btnSound.addEventListener('click', () => {
      const enabled = sound.toggleSound();
      soundIcon.textContent = enabled ? '🔊' : '🔇';
    });

    btnFlip.addEventListener('click', () => {
      state.isBoardFlipped = !state.isBoardFlipped;
      updateCoordinates();
      renderBoard();
    });

    btnOfferDraw.addEventListener('click', () => {
      if (state.game.state !== 'active') return;
      if (confirm('Durang taklif qilmoqchimisiz?')) {
        state.game.state = 'draw';
        handleGameOver('draw');
      }
    });

    btnResign.addEventListener('click', () => {
      if (state.game.state !== 'active') return;
      if (confirm('Taslim bo\'lmoqchimisiz?')) {
        const winner = state.game.turn === PLAYER_WHITE ? PLAYER_BLACK : PLAYER_WHITE;
        state.game.state = winner === PLAYER_WHITE ? 'white_won' : 'black_won';
        state.game.winner = winner;
        handleGameOver(winner);
      }
    });

    // 100-Level Modal Listeners
    btnOpenLevels.addEventListener('click', () => {
      const curTier = Math.ceil(state.campaign.currentLevel / 20);
      openLevelsModal(curTier);
    });

    btnSelectLevel.addEventListener('click', () => {
      const curTier = Math.ceil(state.campaign.currentLevel / 20);
      openLevelsModal(curTier);
    });

    btnCloseLevels.addEventListener('click', () => {
      levelsModal.classList.remove('active');
    });

    tierTabs.addEventListener('click', e => {
      const btn = e.target.closest('.tier-tab-btn');
      if (!btn) return;
      const tier = parseInt(btn.getAttribute('data-tier'), 10);
      openLevelsModal(tier);
    });

    // Mode Selector Pills in Navbar
    btnModeCampaign.addEventListener('click', () => {
      state.mode = 'campaign';
      updateModePillsUI();
      renderCampaignBar();
      updateSettingsUI();
      startNewGame();
    });

    btnModeFree.addEventListener('click', () => {
      state.mode = 'ai';
      updateModePillsUI();
      renderCampaignBar();
      updateSettingsUI();
      startNewGame();
    });

    // Settings Modal
    btnSettings.addEventListener('click', () => {
      updateSettingsUI();
      settingsModal.classList.add('active');
    });

    btnCloseSettings.addEventListener('click', () => {
      settingsModal.classList.remove('active');
      saveSettings();
      updateModePillsUI();
      renderCampaignBar();
      startNewGame();
    });

    // Rules Modal
    btnRules.addEventListener('click', () => {
      rulesModal.classList.add('active');
    });

    btnCloseRules.addEventListener('click', () => {
      rulesModal.classList.remove('active');
    });

    // Modal background close
    [settingsModal, rulesModal, levelsModal].forEach(modal => {
      modal.addEventListener('click', e => {
        if (e.target === modal) modal.classList.remove('active');
      });
    });

    // Settings Mode Selector
    modeSelect.addEventListener('click', e => {
      const btn = e.target.closest('.seg-btn');
      if (!btn) return;
      state.mode = btn.getAttribute('data-mode');
      updateSettingsUI();
      updateModePillsUI();
    });

    // Difficulty Selector
    diffSelect.addEventListener('click', e => {
      const btn = e.target.closest('.seg-btn');
      if (!btn) return;
      state.aiDifficulty = btn.getAttribute('data-diff');
      updateSettingsUI();
    });

    // Color Selector
    colorSelect.addEventListener('click', e => {
      const btn = e.target.closest('.seg-btn');
      if (!btn) return;
      state.playerColor = btn.getAttribute('data-color') === 'white' ? PLAYER_WHITE : PLAYER_BLACK;
      state.isBoardFlipped = state.playerColor === PLAYER_BLACK;
      updateSettingsUI();
    });

    // Theme Selector
    themeSelect.addEventListener('click', e => {
      const btn = e.target.closest('.seg-btn');
      if (!btn) return;
      const theme = btn.getAttribute('data-theme');
      setTheme(theme);
    });

    // Keyboard shortcuts
    window.addEventListener('keydown', e => {
      if (e.key === 'z' && (e.ctrlKey || e.metaKey)) {
        undoMove();
      } else if (e.key === 'h' || e.key === 'H') {
        showHint();
      } else if (e.key === 'n' || e.key === 'N') {
        startNewGame();
      } else if (e.key === 'Escape') {
        settingsModal.classList.remove('active');
        rulesModal.classList.remove('active');
        levelsModal.classList.remove('active');
        winnerModal.classList.remove('active');
      }
    });
  }

  // Initialization
  loadSavedData();
  setupEventListeners();
  updateCoordinates();
  renderBoard();

  if (state.mode !== 'pvp' && state.playerColor === PLAYER_BLACK) {
    checkTriggerAI();
  }
})();
