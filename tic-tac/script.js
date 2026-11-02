// O'yin sozlamalari va holati
const gameState = {
  board: Array(9).fill(''),
  currentPlayer: 'X',
  gameActive: true,
  mode: 'pvp', // 'pvp' yoki 'ai'
  aiDifficulty: 'hard', // 'easy' yoki 'hard'
  scores: {
    X: 0,
    O: 0,
    draw: 0
  },
  soundEnabled: true
};

// G'alaba kombinatsiyalari
const WINNING_COMBINATIONS = [
  [0, 1, 2], // Yuqori qator
  [3, 4, 5], // O'rta qator
  [6, 7, 8], // Quyi qator
  [0, 3, 6], // Chap ustun
  [1, 4, 7], // O'rta ustun
  [2, 5, 8], // O'ng ustun
  [0, 4, 8], // Asosiy diagonal
  [2, 4, 6]  // Yordamchi diagonal
];

// DOM elementlari
const cells = document.querySelectorAll('.cell');
const statusMessage = document.getElementById('statusMessage');
const scoreXElement = document.getElementById('scoreX');
const scoreOElement = document.getElementById('scoreO');
const scoreDrawElement = document.getElementById('scoreDraw');
const scoreCardX = document.getElementById('scoreCardX');
const scoreCardO = document.getElementById('scoreCardO');
const restartBtn = document.getElementById('restartBtn');
const resetScoreBtn = document.getElementById('resetScoreBtn');
const soundToggleBtn = document.getElementById('soundToggleBtn');
const pvpModeBtn = document.getElementById('pvpModeBtn');
const aiModeBtn = document.getElementById('aiModeBtn');
const aiDifficultyContainer = document.getElementById('aiDifficultyContainer');
const aiDifficultySelect = document.getElementById('aiDifficulty');

// Web Audio API yordamida tovush effektlari
let audioCtx = null;

function getAudioContext() {
  if (!audioCtx) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) {
      audioCtx = new AudioContext();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

function playTone(freq, type = 'sine', duration = 0.15) {
  if (!gameState.soundEnabled) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);

    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch (e) {
    // Audio brauzer tomonidan bloklangan bo'lsa xatolik bermaydi
  }
}

function playWinSound() {
  if (!gameState.soundEnabled) return;
  const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
  notes.forEach((freq, index) => {
    setTimeout(() => {
      playTone(freq, 'triangle', 0.2);
    }, index * 120);
  });
}

function playDrawSound() {
  if (!gameState.soundEnabled) return;
  const notes = [400, 350, 300];
  notes.forEach((freq, index) => {
    setTimeout(() => {
      playTone(freq, 'sawtooth', 0.18);
    }, index * 130);
  });
}

// Boshlang'ich sozlamalar
function initGame() {
  // Kataklar uchun hodisalar
  cells.forEach(cell => {
    cell.addEventListener('click', handleCellClick);
  });

  // Rejim tugmalari
  pvpModeBtn.addEventListener('click', () => setMode('pvp'));
  aiModeBtn.addEventListener('click', () => setMode('ai'));

  // AI Qiyinligi
  aiDifficultySelect.addEventListener('change', (e) => {
    gameState.aiDifficulty = e.target.value;
    restartGame();
  });

  // Boshqaruv tugmalari
  restartBtn.addEventListener('click', restartGame);
  resetScoreBtn.addEventListener('click', resetScores);
  soundToggleBtn.addEventListener('click', toggleSound);

  updateTurnDisplay();
}

// Rejimni o'zgartirish
function setMode(newMode) {
  if (gameState.mode === newMode) return;
  gameState.mode = newMode;

  if (newMode === 'pvp') {
    pvpModeBtn.classList.add('active');
    aiModeBtn.classList.remove('active');
    aiDifficultyContainer.classList.add('hidden');
    document.querySelector('#scoreCardO .player-name').textContent = "O'yinchi O";
  } else {
    aiModeBtn.classList.add('active');
    pvpModeBtn.classList.remove('active');
    aiDifficultyContainer.classList.remove('hidden');
    document.querySelector('#scoreCardO .player-name').textContent = "Robot O";
  }

  restartGame();
}

// Katak bosilganda
function handleCellClick(e) {
  const cell = e.target;
  const cellIndex = parseInt(cell.getAttribute('data-index'));

  // Agar katak band bo'lsa yoki o'yin tugagan bo'lsa
  if (gameState.board[cellIndex] !== '' || !gameState.gameActive) {
    return;
  }

  // Agar AI navbati bo'lsa foydalanuvchi bosa olmaydi
  if (gameState.mode === 'ai' && gameState.currentPlayer === 'O') {
    return;
  }

  makeMove(cellIndex, gameState.currentPlayer);

  // Agar AI rejimida bo'lsa va o'yin davom etayotgan bo'lsa
  if (gameState.mode === 'ai' && gameState.gameActive && gameState.currentPlayer === 'O') {
    // Robot o'ylayotgandek tuyulishi uchun kichik kechikish
    setTimeout(makeAiMove, 350);
  }
}

// Harakatni amalga oshirish
function makeMove(index, player) {
  gameState.board[index] = player;
  const cell = cells[index];
  cell.classList.add(player.toLowerCase(), 'taken');

  // Tovush chiqarish
  if (player === 'X') {
    playTone(587.33, 'sine', 0.1); // D5
  } else {
    playTone(440.00, 'sine', 0.1); // A4
  }

  // Natijani tekshirish
  const winCombo = checkWin(gameState.board, player);

  if (winCombo) {
    handleWin(player, winCombo);
  } else if (isBoardFull(gameState.board)) {
    handleDraw();
  } else {
    // Navbatni almashtirish
    gameState.currentPlayer = gameState.currentPlayer === 'X' ? 'O' : 'X';
    updateTurnDisplay();
  }
}

// G'alabani tekshirish
function checkWin(board, player) {
  for (const combination of WINNING_COMBINATIONS) {
    const [a, b, c] = combination;
    if (board[a] === player && board[b] === player && board[c] === player) {
      return combination;
    }
  }
  return null;
}

// Maydon to'lganligini tekshirish
function isBoardFull(board) {
  return board.every(cell => cell !== '');
}

// G'alaba holati
function handleWin(winner, winningIndices) {
  gameState.gameActive = false;
  gameState.scores[winner]++;
  updateScores();

  // Yutuq kataklarini belgilash
  winningIndices.forEach(idx => {
    cells[idx].classList.add('winning-cell');
  });

  const winnerName = (gameState.mode === 'ai' && winner === 'O') ? 'Robot (O)' : `O'yinchi ${winner}`;
  statusMessage.innerHTML = `🎉 <span class="${winner.toLowerCase()}-color">${winnerName}</span> g'alaba qozondi!`;

  playWinSound();
}

// Durang holati
function handleDraw() {
  gameState.gameActive = false;
  gameState.scores.draw++;
  updateScores();

  statusMessage.innerHTML = `🤝 Do'stlik g'alaba qozondi (Durang)!`;
  playDrawSound();
}

// Navbat ko'rsatkichini yangilash
function updateTurnDisplay() {
  if (!gameState.gameActive) return;

  const current = gameState.currentPlayer;
  const isX = current === 'X';

  scoreCardX.classList.toggle('active-turn', isX);
  scoreCardO.classList.toggle('active-turn', !isX);

  let turnText = '';
  if (gameState.mode === 'ai') {
    turnText = isX ? "Sizning navbatingiz (X)" : "Robot o'ylamoqda (O)...";
  } else {
    turnText = `Navbat: <span class="turn-highlight ${isX ? 'x-color' : 'o-color'}">${current}</span>`;
  }

  statusMessage.innerHTML = turnText;
}

// Hisoblarni yangilash
function updateScores() {
  scoreXElement.textContent = gameState.scores.X;
  scoreOElement.textContent = gameState.scores.O;
  scoreDrawElement.textContent = gameState.scores.draw;
}

// Yangi raund
function restartGame() {
  gameState.board = Array(9).fill('');
  gameState.currentPlayer = 'X';
  gameState.gameActive = true;

  cells.forEach(cell => {
    cell.className = 'cell';
  });

  updateTurnDisplay();
}

// Hisobni tozalash
function resetScores() {
  gameState.scores = { X: 0, O: 0, draw: 0 };
  updateScores();
  restartGame();
}

// Ovozni yoqish / o'chirish
function toggleSound() {
  gameState.soundEnabled = !gameState.soundEnabled;
  soundToggleBtn.textContent = gameState.soundEnabled ? '🔊' : '🔇';
  soundToggleBtn.title = gameState.soundEnabled ? "Ovozni o'chirish" : "Ovozni yoqish";
}

// =======================
// AI (KOMPYUTER) MANTIG'I
// =======================

function makeAiMove() {
  if (!gameState.gameActive) return;

  let moveIndex;

  if (gameState.aiDifficulty === 'easy') {
    // 70% tasodifiy, 30% eng yaxshi harakat
    if (Math.random() < 0.7) {
      moveIndex = getRandomMove();
    } else {
      moveIndex = getBestMove(gameState.board);
    }
  } else {
    // Hard rejim: Minimax (yengib bo'lmaydi)
    moveIndex = getBestMove(gameState.board);
  }

  if (moveIndex !== null && moveIndex !== undefined) {
    makeMove(moveIndex, 'O');
  }
}

// Tasodifiy bo'sh katakni tanlash
function getRandomMove() {
  const emptyIndices = [];
  gameState.board.forEach((val, idx) => {
    if (val === '') emptyIndices.push(idx);
  });

  if (emptyIndices.length === 0) return null;
  const randomIndex = Math.floor(Math.random() * emptyIndices.length);
  return emptyIndices[randomIndex];
}

// Minimax algoritmi yordamida eng yaxshi harakatni topish
function getBestMove(board) {
  let bestScore = -Infinity;
  let move = null;

  for (let i = 0; i < 9; i++) {
    if (board[i] === '') {
      board[i] = 'O'; // AI
      let score = minimax(board, 0, false);
      board[i] = ''; // Orqaga qaytarish

      if (score > bestScore) {
        bestScore = score;
        move = i;
      }
    }
  }

  return move;
}

function minimax(board, depth, isMaximizing) {
  if (checkWin(board, 'O')) return 10 - depth;
  if (checkWin(board, 'X')) return depth - 10;
  if (isBoardFull(board)) return 0;

  if (isMaximizing) {
    let maxEval = -Infinity;
    for (let i = 0; i < 9; i++) {
      if (board[i] === '') {
        board[i] = 'O';
        let evaluation = minimax(board, depth + 1, false);
        board[i] = '';
        maxEval = Math.max(maxEval, evaluation);
      }
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (let i = 0; i < 9; i++) {
      if (board[i] === '') {
        board[i] = 'X';
        let evaluation = minimax(board, depth + 1, true);
        board[i] = '';
        minEval = Math.min(minEval, evaluation);
      }
    }
    return minEval;
  }
}

// O'yinni ishga tushirish
document.addEventListener('DOMContentLoaded', initGame);
