const {
  CheckersGame,
  AI,
  PLAYER_WHITE,
  PLAYER_BLACK,
  WHITE_MAN,
  WHITE_KING,
  BLACK_MAN,
  BLACK_KING,
  EMPTY
} = require('./engine.js');

let testsPassed = 0;
let testsFailed = 0;

function assert(cond, name) {
  if (cond) {
    console.log(`  ✓ ${name}`);
    testsPassed++;
  } else {
    console.error(`  ✗ FAIL: ${name}`);
    testsFailed++;
  }
}

console.log('--- 1. Testing Initial Board Setup ---');
const game = new CheckersGame();
const counts = game.getPieceCount();
assert(counts.white === 12, 'White has 12 pieces');
assert(counts.black === 12, 'Black has 12 pieces');
assert(game.turn === PLAYER_WHITE, 'White starts first');
const initialMoves = game.getValidMoves();
assert(initialMoves.length === 7, `White has 7 opening moves (actual: ${initialMoves.length})`);
assert(!game.isCaptureForced(), 'No captures forced initially');

console.log('\n--- 2. Testing Simple Moves ---');
// White moves c3-d4 (from row 2 col 2 to row 3 col 3)
const res1 = game.makeMove(2, 2, 3, 3);
assert(res1.success && res1.turnEnded, 'Move c3-d4 succeeded and ended turn');
assert(game.turn === PLAYER_BLACK, 'Turn switched to Black');
assert(game.board[2][2] === EMPTY, 'Old square is empty');
assert(game.board[3][3] === WHITE_MAN, 'New square has White man');

console.log('\n--- 3. Testing Mandatory Capture & Backward Capture for Men ---');
// Set up a custom position:
// White man at d4 (3, 3), Black man at e5 (4, 4)
// White man at b2 (1, 1) also exists
const customGame = new CheckersGame();
// Clear board
for (let r = 0; r < 8; r++) {
  for (let c = 0; c < 8; c++) customGame.board[r][c] = EMPTY;
}
customGame.board[3][3] = WHITE_MAN; // d4
customGame.board[1][1] = WHITE_MAN; // b2
customGame.board[4][4] = BLACK_MAN; // e5

assert(customGame.isCaptureForced(), 'Capture is forced when opponent piece is adjacent and square behind is free');
const forcedMoves = customGame.getValidMoves();
assert(forcedMoves.length === 1, 'Only 1 capture move is available');
assert(forcedMoves[0].from.r === 3 && forcedMoves[0].from.c === 3, 'Piece at d4 must capture');
assert(forcedMoves[0].to.r === 5 && forcedMoves[0].to.c === 5, 'Must jump to f6 (5, 5)');

// Execute the jump
const jumpRes = customGame.makeMove(3, 3, 5, 5);
assert(jumpRes.success && jumpRes.turnEnded, 'Jump to f6 succeeded');
assert(customGame.board[4][4] === EMPTY, 'Captured piece at e5 removed');
assert(customGame.board[5][5] === WHITE_MAN, 'White man landed at f6');

console.log('\n--- 4. Testing Backward Capture for Simple Man ---');
// Simple White man at f6 (5, 5), Black man behind it at e5 (4, 4), d4 (3, 3) is empty
customGame.board[5][5] = WHITE_MAN;
customGame.board[4][4] = BLACK_MAN;
customGame.board[3][3] = EMPTY;
customGame.turn = PLAYER_WHITE;
customGame.state = 'active';
const backJumps = customGame.getValidMoves();
const hasBackJump = backJumps.some(m => m.from.r === 5 && m.from.c === 5 && m.to.r === 3 && m.to.c === 3);
assert(hasBackJump, 'Simple man can capture backwards');

console.log('\n--- 5. Testing Multi-Jump Sequence ---');
// Custom multi-jump:
// White man at a1 (0, 0)
// Black pieces at b2 (1, 1) and d4 (3, 3)
// Empty at c3 (2, 2) and e5 (4, 4)
for (let r = 0; r < 8; r++) {
  for (let c = 0; c < 8; c++) customGame.board[r][c] = EMPTY;
}
customGame.board[0][0] = WHITE_MAN;
customGame.board[1][1] = BLACK_MAN;
customGame.board[3][3] = BLACK_MAN;
customGame.turn = PLAYER_WHITE;
customGame.state = 'active';
customGame.multiJump = null;

// First jump: 0,0 -> 2,2
const step1 = customGame.makeMove(0, 0, 2, 2);
assert(step1.success, 'First jump succeeded');
assert(!step1.turnEnded, 'Turn did not end because second jump is available');
assert(step1.nextCaptureAvailable, 'Next capture is available');
assert(customGame.multiJump !== null, 'MultiJump is in progress');
assert(customGame.board[1][1] === BLACK_MAN, 'Turkish strike: piece at (1, 1) still on board during multi-jump');

// Second jump: 2,2 -> 4,4
const step2 = customGame.makeMove(2, 2, 4, 4);
assert(step2.success && step2.turnEnded, 'Second jump completed the turn');
assert(customGame.board[1][1] === EMPTY, 'First captured piece removed at end of turn');
assert(customGame.board[3][3] === EMPTY, 'Second captured piece removed at end of turn');
assert(customGame.board[4][4] === WHITE_MAN, 'Piece landed at e5');
assert(customGame.turn === PLAYER_BLACK, 'Turn switched to Black');

console.log('\n--- 6. Testing In-Turn Promotion During Multi-Jump ---');
// White man at b6 (5, 1)
// Black man at c7 (6, 2) -> jump lands on d8 (7, 3) = PROMOTION RANK!
// Black man at f6 (5, 5) -> from d8 (7, 3), king can jump to g5 (4, 6) or h4 (3, 7)!
for (let r = 0; r < 8; r++) {
  for (let c = 0; c < 8; c++) customGame.board[r][c] = EMPTY;
}
customGame.board[5][1] = WHITE_MAN;
customGame.board[6][2] = BLACK_MAN;
customGame.board[5][5] = BLACK_MAN;
customGame.turn = PLAYER_WHITE;
customGame.state = 'active';
customGame.multiJump = null;

const promoStep1 = customGame.makeMove(5, 1, 7, 3);
assert(promoStep1.success, 'Jumped to back rank');
assert(promoStep1.promoted, 'Piece promoted to King upon reaching back rank');
assert(customGame.board[7][3] === WHITE_KING, 'Piece is now WHITE_KING on board');
assert(!promoStep1.turnEnded, 'Turn continues as King capture is available');

// From (7, 3), king jumps over (5, 5) along diagonal:
// (7,3) -> (6,4) empty -> (5,5) opponent -> (4,6) and (3,7) empty!
const kingJumps = customGame.getValidMoves();
assert(kingJumps.length >= 2, `King can land on either (4, 6) or (3, 7) (actual: ${kingJumps.length})`);
const promoStep2 = customGame.makeMove(7, 3, 3, 7);
assert(promoStep2.success && promoStep2.turnEnded, 'Flying king completed jump and landed at (3, 7)');
assert(customGame.board[6][2] === EMPTY, 'First piece removed');
assert(customGame.board[5][5] === EMPTY, 'Second piece removed');
assert(customGame.board[3][7] === WHITE_KING, 'King at (3, 7)');

console.log('\n--- 7. Testing Flying King Moves & Captures ---');
// King at a1 (0, 0), empty board except King
for (let r = 0; r < 8; r++) {
  for (let c = 0; c < 8; c++) customGame.board[r][c] = EMPTY;
}
customGame.board[0][0] = WHITE_KING;
customGame.turn = PLAYER_WHITE;
customGame.state = 'active';
customGame.multiJump = null;

const kingMoves = customGame.getValidMoves();
// Diagonal from (0,0) has 7 squares: (1,1), (2,2), (3,3), (4,4), (5,5), (6,6), (7,7)
assert(kingMoves.length === 7, `King has 7 moves along main diagonal (actual: ${kingMoves.length})`);

// King jump over distant piece:
// Black piece at e5 (4, 4), White King at a1 (0, 0)
// King can fly, jump e5, and land on f6 (5, 5), g7 (6, 6), or h8 (7, 7)
customGame.board[4][4] = BLACK_MAN;
const distantKingJumps = customGame.getValidMoves();
assert(distantKingJumps.length === 3, `King can land on 3 squares after jumping (actual: ${distantKingJumps.length})`);
const kJumpRes = customGame.makeMove(0, 0, 7, 7);
assert(kJumpRes.success && kJumpRes.turnEnded, 'King jumped to h8');
assert(customGame.board[4][4] === EMPTY, 'Enemy piece at e5 captured');

console.log('\n--- 8. Testing Turkish Strike (Cannot jump same piece twice) ---');
// Set up a loop where jumping the same piece twice would be possible if it were removed,
// but illegal while it's still physically on the board.
for (let r = 0; r < 8; r++) {
  for (let c = 0; c < 8; c++) customGame.board[r][c] = EMPTY;
}
customGame.board[2][2] = WHITE_KING;
customGame.board[3][3] = BLACK_MAN;
customGame.turn = PLAYER_WHITE;
customGame.state = 'active';
customGame.multiJump = null;

// King jumps over (3, 3) to (4, 4)
customGame.makeMove(2, 2, 4, 4);
// From (4, 4), can King jump backwards over (3, 3) again? NO!
const nextJumpsTurkish = customGame.getValidMoves();
const reJump = nextJumpsTurkish.some(j => j.captured.r === 3 && j.captured.c === 3);
assert(!reJump, 'Turkish strike: cannot jump over same piece twice in one turn');

console.log('\n--- 9. Testing Undo ---');
const undoGame = new CheckersGame();
undoGame.makeMove(2, 2, 3, 3);
const beforeUndoTurn = undoGame.turn;
const undoRes = undoGame.undo();
assert(undoRes, 'Undo returned true');
assert(undoGame.turn === PLAYER_WHITE, 'Undo reverted turn back to White');
assert(undoGame.board[2][2] === WHITE_MAN, 'Undo restored piece at (2, 2)');
assert(undoGame.board[3][3] === EMPTY, 'Undo cleared piece at (3, 3)');

console.log('\n--- 10. Testing AI ---');
const aiGame = new CheckersGame();
const aiMoveEasy = AI.getBestMove(aiGame, 'easy');
assert(aiMoveEasy !== null && aiMoveEasy.start, 'AI Easy produced valid move');
const aiMoveMed = AI.getBestMove(aiGame, 'medium');
assert(aiMoveMed !== null && aiMoveMed.start, 'AI Medium produced valid move');
const aiMoveHard = AI.getBestMove(aiGame, 'hard');
assert(aiMoveHard !== null && aiMoveHard.start, 'AI Hard produced valid move');

console.log(`\n================================`);
console.log(`Total tests: ${testsPassed + testsFailed}`);
console.log(`Passed: ${testsPassed}`);
console.log(`Failed: ${testsFailed}`);
console.log(`================================`);
if (testsFailed > 0) process.exit(1);
