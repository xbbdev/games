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
   * @param {number[][]} board
   * @param {number} r
   * @param {number} c
   * @param {Array<{r:number, c:number}>} capturedSoFar - list of pieces captured earlier in this same turn
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
      this.halfMovesWithoutCaptureOrKing = 0; // for 50-move draw rule
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
     * Returns an object detailing what occurred:
     * {
     *   success: boolean,
     *   captured: {r, c} | null,
     *   promoted: boolean,
     *   turnEnded: boolean,
     *   nextCaptureAvailable: boolean,
     *   gameOver: boolean,
     *   winner: number | null
     * }
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
      // If multi-jump is in progress, cancel mid-turn and restore state at start of turn
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
   * AI Evaluation Function & Minimax with Alpha-Beta Pruning
   */
  const AI = {
    evaluate(board, player) {
      let whiteScore = 0;
      let blackScore = 0;

      // Positional weights: Center control bonus, back rank defense, king mobility
      const centerBonus = [
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 10, 0, 10, 0, 10, 0, 10],
        [10, 0, 20, 0, 20, 0, 10, 0],
        [0, 20, 0, 30, 0, 20, 0, 10],
        [10, 0, 20, 0, 30, 0, 20, 0],
        [0, 10, 0, 20, 0, 20, 0, 10],
        [10, 0, 10, 0, 10, 0, 10, 0],
        [0, 0, 0, 0, 0, 0, 0, 0]
      ];

      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          const p = board[r][c];
          if (p === EMPTY) continue;

          if (p === WHITE_MAN) {
            // Base piece value: 100
            // Advancement bonus: r * 8 (moving closer to promotion)
            // Back rank defense bonus (row 0): 15
            let val = 100 + r * 10 + centerBonus[r][c];
            if (r === 0) val += 15;
            whiteScore += val;
          } else if (p === WHITE_KING) {
            // King value: 350 + center control
            let val = 350 + centerBonus[r][c] * 1.5;
            whiteScore += val;
          } else if (p === BLACK_MAN) {
            let val = 100 + (7 - r) * 10 + centerBonus[r][c];
            if (r === 7) val += 15;
            blackScore += val;
          } else if (p === BLACK_KING) {
            let val = 350 + centerBonus[r][c] * 1.5;
            blackScore += val;
          }
        }
      }

      const diff = whiteScore - blackScore;
      return player === PLAYER_WHITE ? diff : -diff;
    },

    minimax(game, board, depth, alpha, beta, isMaximizing, player) {
      const currentPlayer = isMaximizing ? player : -player;
      const moves = game.getFullTurnMoves(board, currentPlayer);

      if (moves.length === 0) {
        // No moves: currentPlayer loses
        return { score: isMaximizing ? -999999 + depth : 999999 - depth, bestMove: null };
      }

      if (depth === 0) {
        return { score: AI.evaluate(board, player), bestMove: null };
      }

      let bestMove = moves[0];

      if (isMaximizing) {
        let maxEval = -Infinity;
        for (const move of moves) {
          const result = AI.minimax(
            game,
            move.finalBoard,
            depth - 1,
            alpha,
            beta,
            false,
            player
          );
          if (result.score > maxEval) {
            maxEval = result.score;
            bestMove = move;
          }
          alpha = Math.max(alpha, result.score);
          if (beta <= alpha) break; // Pruning
        }
        return { score: maxEval, bestMove };
      } else {
        let minEval = Infinity;
        for (const move of moves) {
          const result = AI.minimax(
            game,
            move.finalBoard,
            depth - 1,
            alpha,
            beta,
            true,
            player
          );
          if (result.score < minEval) {
            minEval = result.score;
            bestMove = move;
          }
          beta = Math.min(beta, result.score);
          if (beta <= alpha) break; // Pruning
        }
        return { score: minEval, bestMove };
      }
    },

    getBestMove(game, difficulty = 'medium') {
      const player = game.turn;
      const fullMoves = game.getFullTurnMoves(game.board, player);
      if (fullMoves.length === 0) return null;

      // Easy: random move, but captures when forced
      if (difficulty === 'easy') {
        const randIndex = Math.floor(Math.random() * fullMoves.length);
        return fullMoves[randIndex];
      }

      // Medium: depth 3
      // Hard: depth 5
      let depth = 3;
      if (difficulty === 'hard') depth = 5;

      const result = AI.minimax(
        game,
        game.board,
        depth,
        -Infinity,
        Infinity,
        true,
        player
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
    AI
  };
});
