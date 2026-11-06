/**
 * Shashka (Checkers) Main Application Controller
 * Handles UI interactions, rendering, AI triggers, animations, and sound effects.
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
    isDarkSquare
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
    mode: 'ai', // 'ai' or 'pvp'
    aiDifficulty: 'medium', // 'easy', 'medium', 'hard'
    playerColor: PLAYER_WHITE, // human color in vs AI mode
    isBoardFlipped: false,
    selectedSquare: null, // { r, c }
    validDestinations: [], // array of moves
    hintMove: null, // { from, to }
    isAiThinking: false,
    historyDisplay: [] // { num, white, black }
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

  // Top Nav Buttons
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

  // Modals
  const settingsModal = document.getElementById('settingsModal');
  const btnCloseSettings = document.getElementById('btnCloseSettings');
  const rulesModal = document.getElementById('rulesModal');
  const btnCloseRules = document.getElementById('btnCloseRules');
  const winnerModal = document.getElementById('winnerModal');
  const winnerTitle = document.getElementById('winnerTitle');
  const winnerSubtitle = document.getElementById('winnerSubtitle');
  const winnerIcon = document.getElementById('winnerIcon');
  const btnPlayAgain = document.getElementById('btnPlayAgain');
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
   * row 0..7 -> 1..8, col 0..7 -> a..h
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
   * Initialize settings from LocalStorage if present
   */
  function loadSavedSettings() {
    try {
      const savedTheme = localStorage.getItem('shashka_theme');
      if (savedTheme) {
        setTheme(savedTheme);
      }
      const savedMode = localStorage.getItem('shashka_mode');
      if (savedMode) state.mode = savedMode;

      const savedDiff = localStorage.getItem('shashka_diff');
      if (savedDiff) state.aiDifficulty = savedDiff;

      const savedColor = localStorage.getItem('shashka_color');
      if (savedColor) {
        state.playerColor = savedColor === 'white' ? PLAYER_WHITE : PLAYER_BLACK;
        state.isBoardFlipped = state.playerColor === PLAYER_BLACK;
      }
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }
    updateSettingsUI();
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
    // Update theme segmented control
    themeSelect.querySelectorAll('.seg-btn').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-theme') === theme);
    });
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
    } else {
      difficultyGroup.style.display = 'block';
      colorGroup.style.display = 'block';
    }
  }

  /**
   * Update Coordinate labels around the board based on flip state
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

    // Show or hide mandatory capture alert
    const isCurrentTurnHuman = state.mode === 'pvp' || state.game.turn === state.playerColor;
    if (isCaptureForced && isCurrentTurnHuman && state.game.state === 'active') {
      forcedAlert.classList.remove('hidden');
    } else {
      forcedAlert.classList.add('hidden');
    }

    // Determine row and column iteration order based on board flip
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

    // Update names & roles
    if (state.mode === 'ai') {
      if (state.playerColor === PLAYER_WHITE) {
        playerWhiteTitle.textContent = "Siz (O'yinchi)";
        playerWhiteRole.textContent = "Oqlar";
        playerBlackTitle.textContent = `Kompyuter (${getDiffName(state.aiDifficulty)})`;
        playerBlackRole.textContent = "Qoralar (Bot)";
      } else {
        playerWhiteTitle.textContent = `Kompyuter (${getDiffName(state.aiDifficulty)})`;
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

    // Pill texts
    const whitePill = playerWhiteCard.querySelector('.turn-pill');
    const blackPill = playerBlackCard.querySelector('.turn-pill');
    if (state.game.state !== 'active') {
      whitePill.textContent = 'O\'yin tugadi';
      blackPill.textContent = 'O\'yin tugadi';
    } else if (isWhiteTurn) {
      whitePill.textContent = 'Yurish navbati';
      blackPill.textContent = 'Kutmoqda';
    } else {
      whitePill.textContent = 'Kutmoqda';
      blackPill.textContent = 'Yurish navbati';
    }

    turnCounter.textContent = `Yurish: ${state.game.turnCount}`;
  }

  function getDiffName(diff) {
    if (diff === 'easy') return 'Oson';
    if (diff === 'medium') return "O'rtacha";
    return 'Qiyin';
  }

  /**
   * Handle Board Square Click
   */
  function onSquareClicked(r, c) {
    if (state.game.state !== 'active' || state.isAiThinking) {
      return;
    }

    // Check if it's the player's turn in AI mode
    if (state.mode === 'ai' && state.game.turn !== state.playerColor) {
      return;
    }

    state.hintMove = null;

    const clickedPiece = state.game.board[r][c];
    const isPlayerPiece = (state.game.turn === PLAYER_WHITE && clickedPiece > 0) ||
                          (state.game.turn === PLAYER_BLACK && clickedPiece < 0);

    // Case 1: Mid multi-jump in progress
    if (state.game.multiJump) {
      // Must move the active piece to one of its valid destinations
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
        // Piece cannot move (e.g. captures are forced elsewhere or piece is blocked)
        sound.playInvalid();
        if (state.game.isCaptureForced()) {
          forcedAlert.classList.add('pulse-once');
          setTimeout(() => forcedAlert.classList.remove('pulse-once'), 600);
        }
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
    const isCapture = state.validDestinations.some(m => m.to.r === toR && m.to.c === toC && m.captured);
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
        // Check if AI should move next
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

    // Is it white move or black move?
    // Note: state.game.turn has already flipped to next player!
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
   * Trigger AI move if in AI mode and it's AI's turn
   */
  function checkTriggerAI() {
    if (state.mode !== 'ai' || state.game.state !== 'active') return;
    if (state.game.turn === state.playerColor) return;

    state.isAiThinking = true;
    renderBoard();

    // Natural delay so human can absorb previous move (350-500ms)
    setTimeout(() => {
      const bestMove = AI.getBestMove(state.game, state.aiDifficulty);
      if (!bestMove) {
        state.isAiThinking = false;
        renderBoard();
        return;
      }

      // Execute AI move steps with animation
      executeAIMoveSteps(bestMove.steps, 0);
    }, 450);
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
      // Next jump step after slight delay
      setTimeout(() => {
        executeAIMoveSteps(steps, index + 1);
      }, 350);
    } else {
      // Finished turn
      addMoveToHistory(state.game.lastMove);
      state.isAiThinking = false;
      renderBoard();

      if (result.gameOver) {
        handleGameOver(result.winner);
      }
    }
  }

  /**
   * Game Over handler
   */
  function handleGameOver(winner) {
    if (winner === 'draw' || state.game.state === 'draw') {
      winnerIcon.textContent = '🤝';
      winnerTitle.textContent = 'Durang!';
      winnerSubtitle.textContent = 'O\'yin durang natija bilan yakunlandi.';
    } else if (winner === PLAYER_WHITE) {
      const isHuman = state.mode === 'pvp' || state.playerColor === PLAYER_WHITE;
      if (isHuman) {
        winnerIcon.textContent = '🏆';
        winnerTitle.textContent = 'G\'alaba! Tabriklaymiz!';
        winnerSubtitle.textContent = 'Oqlar ajoyib g\'alabaga erishdi!';
        sound.playWin();
      } else {
        winnerIcon.textContent = '🤖';
        winnerTitle.textContent = 'Kompyuter g\'alaba qozondi!';
        winnerSubtitle.textContent = 'Oqlar (Bot) bu safar ustun keldi.';
        sound.playLose();
      }
    } else if (winner === PLAYER_BLACK) {
      const isHuman = state.mode === 'pvp' || state.playerColor === PLAYER_BLACK;
      if (isHuman) {
        winnerIcon.textContent = '🏆';
        winnerTitle.textContent = 'G\'alaba! Tabriklaymiz!';
        winnerSubtitle.textContent = 'Qoralar ajoyib g\'alabaga erishdi!';
        sound.playWin();
      } else {
        winnerIcon.textContent = '🤖';
        winnerTitle.textContent = 'Kompyuter g\'alaba qozondi!';
        winnerSubtitle.textContent = 'Qoralar (Bot) bu safar ustun keldi.';
        sound.playLose();
      }
    }

    setTimeout(() => {
      winnerModal.classList.add('active');
    }, 400);
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

    // If human selected Black, AI (White) makes the first move!
    if (state.mode === 'ai' && state.playerColor === PLAYER_BLACK) {
      checkTriggerAI();
    }
  }

  /**
   * Undo Move
   */
  function undoMove() {
    if (state.isAiThinking) return;

    if (state.mode === 'ai') {
      // In AI mode, undo 2 plies if AI moved, to bring turn back to human
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
      // In PvP mode, undo 1 turn
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

    // AI finds the best move for current player
    const bestMove = AI.getBestMove(state.game, 'hard');
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

    // Settings Modal
    btnSettings.addEventListener('click', () => {
      updateSettingsUI();
      settingsModal.classList.add('active');
    });

    btnCloseSettings.addEventListener('click', () => {
      settingsModal.classList.remove('active');
      saveSettings();
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
    [settingsModal, rulesModal].forEach(modal => {
      modal.addEventListener('click', e => {
        if (e.target === modal) modal.classList.remove('active');
      });
    });

    // Mode Selector
    modeSelect.addEventListener('click', e => {
      const btn = e.target.closest('.seg-btn');
      if (!btn) return;
      state.mode = btn.getAttribute('data-mode');
      updateSettingsUI();
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
        winnerModal.classList.remove('active');
      }
    });
  }

  // Initialization
  loadSavedSettings();
  setupEventListeners();
  updateCoordinates();
  renderBoard();

  // If human plays Black initially, trigger AI first move
  if (state.mode === 'ai' && state.playerColor === PLAYER_BLACK) {
    checkTriggerAI();
  }
})();
