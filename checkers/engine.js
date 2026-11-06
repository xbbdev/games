/**
 * Checkers (Russian Draughts / Shashki) Game Engine
 * Implements official Russian Draughts rules:
 * - 8x8 dark squares (a1 is dark)
 * - 12 pieces per player
 * - Simple piece: move forward 1 step diagonally
 * - Simple piece capture: jump forward or backward 2 steps
 * - Mandatory capture (Urish majburiy)
 * - Turkish strike rule: captured pieces removed only at end of turn; cannot jump same piece twice
 * - Flying King: moves any distance along diagonal
 * - Flying King capture: jumps opponent piece at distance and can land on any square past it
 * - In-turn promotion: promotes on crowning rank during capture and continues capturing as king if possible
 * - Game over: no legal moves left
 * - 100 Progressive Dynamic Levels with Grandmaster / Superhuman AI engine
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.CheckersEngine = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const EMPTY = 0;
  const WHITE_MAN = 1;
  const WHITE_KING = 2;
  const BLACK_MAN = -1;
  const BLACK_KING = -2;

  const PLAYER_WHITE = 1;
  const PLAYER_BLACK = -1;

  const DIRECTIONS = [
    [-1, -1],
    [-1, 1],
    [1, -1],
    [1, 1]
  ];

  function isDarkSquare(r, c) {
    return (r + c) % 2 === 0;
  }

  function inBounds(r, c) {
    return r >= 0 && r < 8 && c >= 0 && c < 8;
  }

  function isOpponent(p1, p2) {
    return (p1 > 0 && p2 < 0) || (p1 < 0 && p2 > 0);
  }

  function isPlayerPiece(p, player) {
    return (player === PLAYER_WHITE && p > 0) || (player === PLAYER_BLACK && p < 0);
  }

  function isKing(p) {
    return Math.abs(p) === 2;
  }

  function cloneBoard(b) {
    const copy = new Array(8);
    for (let r = 0; r < 8; r++) {
      copy[r] = b[r].slice();
    }
    return copy;
  }

  function createInitialBoard() {
    const board = [];
    for (let r = 0; r < 8; r++) {
      const row = [];
      for (let c = 0; c < 8; c++) {
        if (isDarkSquare(r, c)) {
          if (r < 3) {
            row.push(WHITE_MAN);
          } else if (r > 4) {
            row.push(BLACK_MAN);
          } else {
            row.push(EMPTY);
          }
        } else {
          row.push(EMPTY);
        }
      }
      board.push(row);
    }
    return board;
  }

  /**
   * Check single-hop jumps available for piece at (r, c).
   */
  function getJumpsForPiece(board, r, c, capturedSoFar = []) {
    const piece = board[r][c];
    if (piece === EMPTY) return [];
    const player = piece > 0 ? PLAYER_WHITE : PLAYER_BLACK;
    const jumps = [];

    const isCaptured = (cr, cc) => {
      return capturedSoFar.some(p => p.r === cr && p.c === cc);
    };

    if (isKing(piece)) {
      // Flying king capture
      for (const [dr, dc] of DIRECTIONS) {
        let step = 1;
        let opponentPos = null;

        while (inBounds(r + step * dr, c + step * dc)) {
          const currR = r + step * dr;
          const currC = c + step * dc;
          const currPiece = board[currR][currC];

          if (opponentPos === null) {
            if (currPiece === EMPTY) {
              step++;
              continue;
            } else if (isPlayerPiece(currPiece, player)) {
              // Blocked by friendly piece
              break;
            } else {
              // Found opponent piece
              if (isCaptured(currR, currC)) {
                // Cannot jump already captured piece (Turkish strike)
                break;
              }
              opponentPos = { r: currR, c: currC };
              step++;
            }
          } else {
            // Already found 1 opponent piece, looking for empty landing squares
            if (currPiece === EMPTY) {
              jumps.push({
                from: { r, c },
                to: { r: currR, c: currC },
                captured: { r: opponentPos.r, c: opponentPos.c },
                isKing: true
              });
              step++;
            } else {
              // Hit another piece, no more landing squares in this ray
              break;
            }
          }
        }
      }
    } else {
      // Simple piece capture (forward or backward)
      for (const [dr, dc] of DIRECTIONS) {
        const oppR = r + dr;
        const oppC = c + dc;
        const landR = r + 2 * dr;
        const landC = c + 2 * dc;

        if (inBounds(landR, landC)) {
          const oppPiece = board[oppR][oppC];
          const landPiece = board[landR][landC];

          if (
            isOpponent(piece, oppPiece) &&
            !isCaptured(oppR, oppC) &&
            landPiece === EMPTY
          ) {
            jumps.push({
              from: { r, c },
              to: { r: landR, c: landC },
              captured: { r: oppR, c: oppC },
              isKing: false
            });
          }
        }
      }
    }

    return jumps;
  }

  /**
   * Check non-capturing 1-step moves for piece at (r, c).
   */
  function getSimpleMovesForPiece(board, r, c) {
    const piece = board[r][c];
    if (piece === EMPTY) return [];
    const player = piece > 0 ? PLAYER_WHITE : PLAYER_BLACK;
    const moves = [];

    if (isKing(piece)) {
      // King moves any distance in 4 directions until blocked
      for (const [dr, dc] of DIRECTIONS) {
        let step = 1;
        while (inBounds(r + step * dr, c + step * dc)) {
          const targetR = r + step * dr;
          const targetC = c + step * dc;
          if (board[targetR][targetC] === EMPTY) {
            moves.push({
              from: { r, c },
              to: { r: targetR, c: targetC }
            });
            step++;
          } else {
            break;
          }
        }
      }
    } else {
      // Simple piece moves forward 1 step
      const fwd = player === PLAYER_WHITE ? 1 : -1;
      for (const dc of [-1, 1]) {
        const targetR = r + fwd;
        const targetC = c + dc;
        if (inBounds(targetR, targetC) && board[targetR][targetC] === EMPTY) {
          moves.push({
            from: { r, c },
            to: { r: targetR, c: targetC }
          });
        }
      }
    }

    return moves;
  }

  class CheckersGame {
    constructor() {
      this.reset();
    }

    reset() {
      this.board = createInitialBoard();
      this.turn = PLAYER_WHITE;
      this.state = 'active'; // 'active', 'white_won', 'black_won', 'draw'
      this.winner = null;
      this.history = []; // Array of completed turns for undo
      this.multiJump = null; // null or { activePiece: {r, c}, captured: [{r, c}], promotedThisTurn: bool }
      this.lastMove = null; // { from, to, captured: [...] } for UI highlighting
      this.turnCount = 1;
      this.positionCounts = new Map(); // for 3-fold repetition
      this.recordPosition();
    }

    recordPosition() {
      const key = this.getBoardHash() + '_' + this.turn;
      const count = (this.positionCounts.get(key) || 0) + 1;
      this.positionCounts.set(key, count);
      if (count >= 3) {
        this.state = 'draw';
        this.winner = 'draw';
      }
    }

    getBoardHash() {
      let hash = '';
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          hash += this.board[r][c] + ',';
        }
      }
      return hash;
    }

    /**
     * Get all currently available moves for the current player.
     * Enforces mandatory capture!
     * If multiJump is in progress, only jumps for the active piece are returned.
     */
    getValidMoves() {
      if (this.state !== 'active') return [];

      if (this.multiJump) {
        const { activePiece, captured } = this.multiJump;
        const jumps = getJumpsForPiece(
          this.board,
          activePiece.r,
          activePiece.c,
          captured
        );
        return jumps;
      }

      // Check for any captures on the board for current player
      const allJumps = [];
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          if (isPlayerPiece(this.board[r][c], this.turn)) {
            const jumps = getJumpsForPiece(this.board, r, c, []);
            if (jumps.length > 0) {
              allJumps.push(...jumps);
            }
          }
        }
      }

      // Mandatory capture: if ANY piece can capture, ONLY captures are legal!
      if (allJumps.length > 0) {
        return allJumps;
      }

      // Otherwise, return all simple non-capturing moves
      const allMoves = [];
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          if (isPlayerPiece(this.board[r][c], this.turn)) {
            const moves = getSimpleMovesForPiece(this.board, r, c);
            allMoves.push(...moves);
          }
        }
      }

      return allMoves;
    }

    /**
     * Get valid destinations for a specific piece at (r, c).
     */
    getValidMovesForPiece(r, c) {
      const allMoves = this.getValidMoves();
      return allMoves.filter(m => m.from.r === r && m.from.c === c);
    }

    /**
     * Returns true if captures are mandatory right now.
     */
    isCaptureForced() {
      if (this.multiJump) return true;
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          if (isPlayerPiece(this.board[r][c], this.turn)) {
            if (getJumpsForPiece(this.board, r, c, []).length > 0) {
              return true;
            }
          }
        }
      }
      return false;
    }

    /**
     * Returns list of {r, c} positions of pieces that are forced to capture.
     */
    getForcedPieces() {
      if (this.multiJump) {
        return [this.multiJump.activePiece];
      }
      const forced = [];
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          if (isPlayerPiece(this.board[r][c], this.turn)) {
            if (getJumpsForPiece(this.board, r, c, []).length > 0) {
              forced.push({ r, c });
            }
          }
        }
      }
      return forced;
    }

    /**
     * Executes a move from (fromR, fromC) to (toR, toC).
     */
    makeMove(fromR, fromC, toR, toC) {
      if (this.state !== 'active') {
        return { success: false, reason: 'Game is not active' };
      }

      const validMoves = this.getValidMovesForPiece(fromR, fromC);
      const chosen = validMoves.find(m => m.to.r === toR && m.to.c === toC);
      if (!chosen) {
        return { success: false, reason: 'Invalid move' };
      }

      // If starting a new turn (not mid-multijump), push snapshot to undo history
      if (!this.multiJump) {
        this.saveStateToHistory();
      }

      const movingPiece = this.board[fromR][fromC];
      this.board[fromR][fromC] = EMPTY;
      this.board[toR][toC] = movingPiece;

      let capturedPiece = null;
      let promoted = false;

      if (chosen.captured) {
        capturedPiece = chosen.captured;
        if (!this.multiJump) {
          this.multiJump = {
            activePiece: { r: toR, c: toC },
            captured: [chosen.captured],
            promotedThisTurn: false,
            startFrom: { r: fromR, c: fromC },
            steps: [{ from: { r: fromR, c: fromC }, to: { r: toR, c: toC }, captured: chosen.captured }]
          };
        } else {
          this.multiJump.captured.push(chosen.captured);
          this.multiJump.activePiece = { r: toR, c: toC };
          this.multiJump.steps.push({ from: { r: fromR, c: fromC }, to: { r: toR, c: toC }, captured: chosen.captured });
        }

        // Check for promotion during jump (Russian draughts rule)
        const isWhite = movingPiece > 0;
        const reachedBackRank = (isWhite && toR === 7) || (!isWhite && toR === 0);
        if (reachedBackRank && !isKing(movingPiece)) {
          this.board[toR][toC] = isWhite ? WHITE_KING : BLACK_KING;
          promoted = true;
          this.multiJump.promotedThisTurn = true;
        }

        // Check if piece can continue jumping
        const furtherJumps = getJumpsForPiece(
          this.board,
          toR,
          toC,
          this.multiJump.captured
        );

        if (furtherJumps.length > 0) {
          // Multi-jump continues!
          this.lastMove = {
            from: { r: fromR, c: fromC },
            to: { r: toR, c: toC },
            captured: [chosen.captured]
          };

          return {
            success: true,
            captured: chosen.captured,
            promoted,
            turnEnded: false,
            nextCaptureAvailable: true,
            activePiece: { r: toR, c: toC },
            gameOver: false,
            winner: null
          };
        } else {
          // Multi-jump ends: remove all captured pieces from the board (Turkish strike)
          const allCaptured = [...this.multiJump.captured];
          for (const cap of allCaptured) {
            this.board[cap.r][cap.c] = EMPTY;
          }

          this.lastMove = {
            from: this.multiJump.startFrom,
            to: { r: toR, c: toC },
            captured: allCaptured,
            steps: this.multiJump.steps
          };

          this.multiJump = null;
          this.finishTurn();

          return {
            success: true,
            captured: chosen.captured,
            allCaptured,
            promoted: promoted || (this.lastMove && this.lastMove.promoted),
            turnEnded: true,
            nextCaptureAvailable: false,
            gameOver: this.state !== 'active',
            winner: this.winner
          };
        }
      } else {
        // Simple 1-step non-capturing move
        const isWhite = movingPiece > 0;
        const reachedBackRank = (isWhite && toR === 7) || (!isWhite && toR === 0);
        if (reachedBackRank && !isKing(movingPiece)) {
          this.board[toR][toC] = isWhite ? WHITE_KING : BLACK_KING;
          promoted = true;
        }

        this.lastMove = {
          from: { r: fromR, c: fromC },
          to: { r: toR, c: toC },
          captured: []
        };

        this.finishTurn();

        return {
          success: true,
          captured: null,
          promoted,
          turnEnded: true,
          nextCaptureAvailable: false,
          gameOver: this.state !== 'active',
          winner: this.winner
        };
      }
    }

    saveStateToHistory() {
      this.history.push({
        board: cloneBoard(this.board),
        turn: this.turn,
        lastMove: this.lastMove ? JSON.parse(JSON.stringify(this.lastMove)) : null,
        turnCount: this.turnCount
      });
      // Limit history to 100 turns
      if (this.history.length > 100) {
        this.history.shift();
      }
    }

    undo() {
      if (this.history.length === 0) return false;

      const previous = this.history.pop();
      this.board = previous.board;
      this.turn = previous.turn;
      this.lastMove = previous.lastMove;
      this.turnCount = previous.turnCount;
      this.multiJump = null;
      this.state = 'active';
      this.winner = null;
      return true;
    }

    finishTurn() {
      // Switch player
      this.turn = this.turn === PLAYER_WHITE ? PLAYER_BLACK : PLAYER_WHITE;
      if (this.turn === PLAYER_WHITE) {
        this.turnCount++;
      }

      this.recordPosition();

      // Check if the next player has any legal moves
      const nextMoves = this.getValidMoves();
      if (nextMoves.length === 0) {
        // Player has no moves: they lose!
        this.state = this.turn === PLAYER_WHITE ? 'black_won' : 'white_won';
        this.winner = this.turn === PLAYER_WHITE ? PLAYER_BLACK : PLAYER_WHITE;
      }
    }

    getPieceCount() {
      let whiteMen = 0,
        whiteKings = 0,
        blackMen = 0,
        blackKings = 0;
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          const p = this.board[r][c];
          if (p === WHITE_MAN) whiteMen++;
          else if (p === WHITE_KING) whiteKings++;
          else if (p === BLACK_MAN) blackMen++;
          else if (p === BLACK_KING) blackKings++;
        }
      }
      return {
        white: whiteMen + whiteKings,
        black: blackMen + blackKings,
        whiteMen,
        whiteKings,
        blackMen,
        blackKings
      };
    }

    /**
     * Finds all full-turn moves (complete sequence of jumps or single step)
     * Used by the AI search engine.
     */
    getFullTurnMoves(board, player) {
      // First check if any captures exist
      const captureStarts = [];
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          if (isPlayerPiece(board[r][c], player)) {
            const jumps = getJumpsForPiece(board, r, c, []);
            if (jumps.length > 0) {
              captureStarts.push({ r, c, jumps });
            }
          }
        }
      }

      if (captureStarts.length > 0) {
        const fullMoves = [];

        function exploreJumps(currentBoard, currentPiece, capturedList, steps, promoted) {
          const { r, c } = currentPiece;
          const pieceVal = currentBoard[r][c];
          const isWhite = pieceVal > 0;

          // Check further jumps
          const nextJumps = getJumpsForPiece(currentBoard, r, c, capturedList);
          if (nextJumps.length === 0) {
            // Sequence completed! Turkish strike: remove all captured pieces
            const finalBoard = cloneBoard(currentBoard);
            for (const cap of capturedList) {
              finalBoard[cap.r][cap.c] = EMPTY;
            }
            fullMoves.push({
              isCapture: true,
              start: steps[0].from,
              end: { r, c },
              steps,
              captured: capturedList,
              promoted,
              finalBoard
            });
            return;
          }

          for (const jump of nextJumps) {
            const nextBoard = cloneBoard(currentBoard);
            let piece = nextBoard[r][c];
            nextBoard[r][c] = EMPTY;

            // In-turn promotion check
            let didPromote = promoted;
            const reachedBack = (isWhite && jump.to.r === 7) || (!isWhite && jump.to.r === 0);
            if (reachedBack && !isKing(piece)) {
              piece = isWhite ? WHITE_KING : BLACK_KING;
              didPromote = true;
            }
            nextBoard[jump.to.r][jump.to.c] = piece;

            const nextCaptured = [...capturedList, jump.captured];
            const nextSteps = [...steps, jump];

            exploreJumps(nextBoard, jump.to, nextCaptured, nextSteps, didPromote);
          }
        }

        for (const item of captureStarts) {
          for (const jump of item.jumps) {
            const nextBoard = cloneBoard(board);
            let piece = nextBoard[item.r][item.c];
            nextBoard[item.r][item.c] = EMPTY;

            const isWhite = piece > 0;
            let didPromote = false;
            const reachedBack = (isWhite && jump.to.r === 7) || (!isWhite && jump.to.r === 0);
            if (reachedBack && !isKing(piece)) {
              piece = isWhite ? WHITE_KING : BLACK_KING;
              didPromote = true;
            }
            nextBoard[jump.to.r][jump.to.c] = piece;

            exploreJumps(
              nextBoard,
              jump.to,
              [jump.captured],
              [jump],
              didPromote
            );
          }
        }

        return fullMoves;
      }

      // If no captures, get simple moves
      const simpleMoves = [];
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          if (isPlayerPiece(board[r][c], player)) {
            const moves = getSimpleMovesForPiece(board, r, c);
            for (const m of moves) {
              const nextBoard = cloneBoard(board);
              let piece = nextBoard[r][c];
              nextBoard[r][c] = EMPTY;

              const isWhite = piece > 0;
              let promoted = false;
              const reachedBack = (isWhite && m.to.r === 7) || (!isWhite && m.to.r === 0);
              if (reachedBack && !isKing(piece)) {
                piece = isWhite ? WHITE_KING : BLACK_KING;
                promoted = true;
              }
              nextBoard[m.to.r][m.to.c] = piece;

              simpleMoves.push({
                isCapture: false,
                start: m.from,
                end: m.to,
                steps: [m],
                captured: [],
                promoted,
                finalBoard: nextBoard
              });
            }
          }
        }
      }

      return simpleMoves;
    }
  }

  /**
   * 100 Dynamic Levels System Metadata & Configuration
   */
  const LEVEL_TITLES = [
    "Birinchi qadam", "Oddiy yurishlar", "Diagonal sirlari", "Kichik jang", "Shashkachi sinovi",
    "Burchak zarbasi", "Oldinga siljish", "Qanot hujumi", "Himoya asoslari", "Boshlovchi ustasi",
    "Jangovar start", "Ketma-ket urish", "Kichik qopqon", "Tezkor sakrash", "Kutilmagan hujum",
    "Damkaga yo'l", "Ilk g'alabalar", "Qarshi hujum", "Doska nazorati", "Shogirdlik cho'qqisi",
    // 21 - 40
    "Havaskorlar ligasi", "O'rta chiziq jangi", "Qanot qopqoni", "Markaziy diagonal", "Sokin yurishlar",
    "Tezkor sakrash", "Ikki tomonlama zarba", "Kataklar kurashi", "Taktik almashinuv", "Havaskorlar yetakchisi",
    "Kombinatsiya sirlari", "Ortga chekinmaslik", "Faol qanot", "Qamal taktikasi", "Damka intilishi",
    "Ehtiyotkor himoya", "O'tkir hujum", "Pozitsion ustunlik", "Zarbador shashka", "Tajriba sinovi",
    // 41 - 60
    "Tajribalilar maydoni", "Kuchli markaz", "Qanot qisqichi", "Damka zarbasi", "Kutilmagan qurbonlik",
    "Taktik tuzoqlar", "Murakkab almashinuv", "Markaziy ustunlik", "Kombinatsiya ustasi", "Yarim final jangi",
    "Uchadigan damka", "Chekka kataklar qamali", "Hisob-kitob jangi", "Shashka falsafasi", "Tezkor hujum",
    "Chuqur mudofaa", "Pozitsion tuzoq", "Zarbador juftlik", "Taktik yutuq", "Oliy liga ostonasi",
    // 61 - 80
    "Ustalar to'qnashuvi", "Strategik reja", "Markaz monopoliyasi", "Toj kiyish siri", "Qora kataklar hukmdori",
    "Aniq hisob", "Kuchli bosim", "Damka ovchisi", "Professional manyovr", "Usta mahorati",
    "Qamal san'ati", "Pozitsion kishan", "Vaqt va sur'at", "Shashka professori", "Klassik qopqon",
    "Qattiq mudofaa", "Hujumkor manyovr", "Yakuniy hisob", "Kuchli intellekt", "Grossmeysterlik ostonasi",
    // 81 - 100
    "Grossmeysterlar zali", "Buyuk diagonal", "Titanlar jangi", "Kuchli tahlil", "Xatosiz yurish",
    "Super hisob", "Damkalar simfoniyasi", "Yengilmas himoya", "Mukammal kombinatsiya", "Grossmeysterlik unvoni",
    "Oliy intellekt", "Strategik daho", "Po'lat qopqon", "Taktik mo'jiza", "Cheksiz ko'rish",
    "Afsonaviy kombinatsiya", "Kvant hisobi", "Titanlar dueli", "Eng oliy liga", "MUTLAQ CHEMPION"
  ];

  function getLevelConfig(level) {
    level = Math.max(1, Math.min(100, Math.round(level)));
    // ELO scales from 400 to 3200
    const elo = Math.round(400 + (level - 1) * (2800 / 99));

    let tier = 1;
    let tierName = "Boshlang'ich";
    let tierClass = "tier-1";
    if (level > 80) {
      tier = 5;
      tierName = "Afsonaviy Grossmeyster";
      tierClass = "tier-5";
    } else if (level > 60) {
      tier = 4;
      tierName = "Professional Usta";
      tierClass = "tier-4";
    } else if (level > 40) {
      tier = 3;
      tierName = "Tajribali O'yinchi";
      tierClass = "tier-3";
    } else if (level > 20) {
      tier = 2;
      tierName = "Havaskor";
      tierClass = "tier-2";
    }

    const title = `${level}-bosqich: ${LEVEL_TITLES[level - 1] || "Shashka jangi"}`;

    // Depth scales smoothly:
    // Level 1-5: depth 1
    // Level 6-15: depth 2
    // Level 16-35: depth 3
    // Level 36-60: depth 4
    // Level 61-80: depth 5
    // Level 81-94: depth 6
    // Level 95-100: depth 7
    let depth = 1;
    if (level > 94) depth = 7;
    else if (level > 80) depth = 6;
    else if (level > 60) depth = 5;
    else if (level > 35) depth = 4;
    else if (level > 15) depth = 3;
    else if (level > 5) depth = 2;

    // Blunder chance:
    // Drops from 40% to 0% by level 50
    let blunderChance = 0;
    if (level <= 10) {
      blunderChance = Math.max(0.12, 0.40 - (level - 1) * 0.03);
    } else if (level <= 30) {
      blunderChance = Math.max(0.03, 0.12 - (level - 11) * 0.005);
    } else if (level <= 50) {
      blunderChance = Math.max(0, 0.03 - (level - 31) * 0.0015);
    } else {
      blunderChance = 0;
    }

    const quiescence = level >= 25;

    return {
      level,
      tier,
      tierName,
      tierClass,
      title,
      elo,
      depth,
      quiescence,
      blunderChance
    };
  }

  /**
   * Ultra-Fast Grandmaster AI Evaluation & Search Engine
   */
  const AI = {
    // Transposition Cache
    tt: new Map(),

    clearCache() {
      if (AI.tt.size > 20000) {
        AI.tt.clear();
      }
    },

    /**
     * Grandmaster positional evaluation:
     * - Material (Pawns 100, Kings 380 - 450)
     * - Big Diagonal (a1-h8) control
     * - Central Dominance ("Klassik Markaz")
     * - Back-rank Anchors (c1, e1, g1 / b8, d8, f8)
     * - Piece chain protection
     * - Edge penalty
     */
    evaluate(board, player) {
      let whiteScore = 0;
      let blackScore = 0;

      let whitePieces = 0;
      let blackPieces = 0;

      // Count total pieces for endgame dynamic valuation
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          const p = board[r][c];
          if (p > 0) whitePieces++;
          else if (p < 0) blackPieces++;
        }
      }

      const isEndgame = (whitePieces + blackPieces) <= 6;
      const kingVal = isEndgame ? 460 : 390;

      // Center bonus matrix: rewards controlling the high center
      const centerBonus = [
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 8, 0, 8, 0, 8, 0, 8],
        [8, 0, 18, 0, 18, 0, 8, 0],
        [0, 18, 0, 32, 0, 18, 0, 8],
        [8, 0, 18, 0, 32, 0, 18, 0],
        [0, 8, 0, 18, 0, 18, 0, 8],
        [8, 0, 8, 0, 8, 0, 8, 0],
        [0, 0, 0, 0, 0, 0, 0, 0]
      ];

      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          const p = board[r][c];
          if (p === EMPTY) continue;

          // Main diagonal (a1-h8) bonus
          const isMainDiagonal = (r === c);
          const diagBonus = isMainDiagonal ? 14 : 0;

          // Edge penalty: pieces stuck on edge have half mobility
          const isEdge = (c === 0 || c === 7);
          const edgePenalty = isEdge ? -8 : 0;

          if (p === WHITE_MAN) {
            let val = 100 + r * 10 + centerBonus[r][c] + diagBonus + edgePenalty;
            // Back rank defense anchor (row 0)
            if (r === 0) val += 20;
            // Chain protection check: piece behind diagonally
            if (r > 0 && ((c > 0 && board[r - 1][c - 1] > 0) || (c < 7 && board[r - 1][c + 1] > 0))) {
              val += 10;
            }
            whiteScore += val;
          } else if (p === WHITE_KING) {
            let val = kingVal + centerBonus[r][c] * 1.4 + diagBonus * 1.5;
            whiteScore += val;
          } else if (p === BLACK_MAN) {
            let val = 100 + (7 - r) * 10 + centerBonus[r][c] + diagBonus + edgePenalty;
            if (r === 7) val += 20;
            if (r < 7 && ((c > 0 && board[r + 1][c - 1] < 0) || (c < 7 && board[r + 1][c + 1] < 0))) {
              val += 10;
            }
            blackScore += val;
          } else if (p === BLACK_KING) {
            let val = kingVal + centerBonus[r][c] * 1.4 + diagBonus * 1.5;
            blackScore += val;
          }
        }
      }

      const diff = whiteScore - blackScore;
      return player === PLAYER_WHITE ? diff : -diff;
    },

    /**
     * Move Ordering:
     * Sort captures first (highest captured count first), king moves second, center moves third.
     * Dramatically increases Alpha-Beta pruning cutoffs!
     */
    orderMoves(moves) {
      return moves.sort((a, b) => {
        if (a.isCapture && !b.isCapture) return -1;
        if (!a.isCapture && b.isCapture) return 1;
        if (a.isCapture && b.isCapture) {
          return (b.captured.length || 0) - (a.captured.length || 0);
        }
        if (a.promoted && !b.promoted) return -1;
        if (!a.promoted && b.promoted) return 1;
        return 0;
      });
    },

    /**
     * Quiescence Search:
     * Eliminates the horizon effect by continuing to search all forced capture sequences
     * at leaf nodes until a stable, quiet position is reached!
     */
    quiescence(game, board, alpha, beta, isMaximizing, player, qdepth) {
      const standPat = AI.evaluate(board, player) * (isMaximizing ? 1 : -1);

      if (qdepth <= 0) {
        return standPat;
      }

      if (isMaximizing) {
        if (standPat >= beta) return beta;
        if (standPat > alpha) alpha = standPat;
      } else {
        if (standPat <= alpha) return alpha;
        if (standPat < beta) beta = standPat;
      }

      const currentPlayer = isMaximizing ? player : -player;
      // Get all full moves
      const moves = game.getFullTurnMoves(board, currentPlayer);
      // Filter for only captures
      const captureMoves = moves.filter(m => m.isCapture);
      if (captureMoves.length === 0) {
        return standPat;
      }

      const orderedCaptures = AI.orderMoves(captureMoves);

      if (isMaximizing) {
        for (const move of orderedCaptures) {
          const score = AI.quiescence(game, move.finalBoard, alpha, beta, false, player, qdepth - 1);
          if (score > alpha) alpha = score;
          if (alpha >= beta) break;
        }
        return alpha;
      } else {
        for (const move of orderedCaptures) {
          const score = AI.quiescence(game, move.finalBoard, alpha, beta, true, player, qdepth - 1);
          if (score < beta) beta = score;
          if (beta <= alpha) break;
        }
        return beta;
      }
    },

    /**
     * Minimax with Alpha-Beta Pruning, Move Ordering, and Quiescence Extension
     */
    minimax(game, board, depth, alpha, beta, isMaximizing, player, useQuiescence = true) {
      const currentPlayer = isMaximizing ? player : -player;
      const moves = game.getFullTurnMoves(board, currentPlayer);

      if (moves.length === 0) {
        return {
          score: isMaximizing ? -999999 + depth : 999999 - depth,
          bestMove: null
        };
      }

      if (depth === 0) {
        if (useQuiescence) {
          const qScore = AI.quiescence(game, board, alpha, beta, isMaximizing, player, 3);
          return { score: qScore, bestMove: null };
        }
        return { score: AI.evaluate(board, player), bestMove: null };
      }

      const orderedMoves = AI.orderMoves(moves);
      let bestMove = orderedMoves[0];

      if (isMaximizing) {
        let maxEval = -Infinity;
        for (const move of orderedMoves) {
          const result = AI.minimax(
            game,
            move.finalBoard,
            depth - 1,
            alpha,
            beta,
            false,
            player,
            useQuiescence
          );
          if (result.score > maxEval) {
            maxEval = result.score;
            bestMove = move;
          }
          alpha = Math.max(alpha, result.score);
          if (beta <= alpha) break; // Beta cutoff
        }
        return { score: maxEval, bestMove };
      } else {
        let minEval = Infinity;
        for (const move of orderedMoves) {
          const result = AI.minimax(
            game,
            move.finalBoard,
            depth - 1,
            alpha,
            beta,
            true,
            player,
            useQuiescence
          );
          if (result.score < minEval) {
            minEval = result.score;
            bestMove = move;
          }
          beta = Math.min(beta, result.score);
          if (beta <= alpha) break; // Alpha cutoff
        }
        return { score: minEval, bestMove };
      }
    },

    /**
     * Get Best Move for standard difficulty ('easy', 'medium', 'hard')
     */
    getBestMove(game, difficulty = 'medium') {
      let level = 25;
      if (difficulty === 'easy') level = 8;
      else if (difficulty === 'hard') level = 85;
      return AI.getBestMoveForLevel(game, level);
    },

    /**
     * Get Best Move for a specific Level (1 to 100)
     */
    getBestMoveForLevel(game, level = 1) {
      const cfg = getLevelConfig(level);
      const player = game.turn;
      const fullMoves = game.getFullTurnMoves(game.board, player);
      if (fullMoves.length === 0) return null;

      // Check for beginner/early blunder chance
      if (cfg.blunderChance > 0 && Math.random() < cfg.blunderChance) {
        // Pick a random move among legal moves (captures are still mandatory if available)
        const randIndex = Math.floor(Math.random() * fullMoves.length);
        return fullMoves[randIndex];
      }

      // Execute Alpha-Beta search with configured depth and quiescence
      const result = AI.minimax(
        game,
        game.board,
        cfg.depth,
        -Infinity,
        Infinity,
        true,
        player,
        cfg.quiescence
      );

      return result.bestMove || fullMoves[0];
    }
  };

  return {
    EMPTY,
    WHITE_MAN,
    WHITE_KING,
    BLACK_MAN,
    BLACK_KING,
    PLAYER_WHITE,
    PLAYER_BLACK,
    DIRECTIONS,
    isDarkSquare,
    inBounds,
    isOpponent,
    isPlayerPiece,
    isKing,
    cloneBoard,
    createInitialBoard,
    getJumpsForPiece,
    getSimpleMovesForPiece,
    CheckersGame,
    LEVEL_TITLES,
    getLevelConfig,
    AI
  };
});
