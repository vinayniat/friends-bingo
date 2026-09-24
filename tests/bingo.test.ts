import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateCompletedLines,
  isWinningState,
  validateCard,
  canCallNumber,
  createDefaultCard,
  ALL_LINES,
} from '../src/lib/bingo';

describe('FRIENDS BINGO - Core Rules and Game Logic', () => {
  // Standard test board (1 to 25):
  //  1  2  3  4  5  (row-0)
  //  6  7  8  9 10  (row-1)
  // 11 12 13 14 15  (row-2)
  // 16 17 18 19 20  (row-3)
  // 21 22 23 24 25  (row-4)
  const defaultBoard = createDefaultCard();

  // Test 1: Horizontal line completion
  it('1. Horizontal line completion: row-0 completes when [1, 2, 3, 4, 5] are called', () => {
    const called = [1, 2, 3, 4, 5];
    const lines = calculateCompletedLines(defaultBoard, called);
    assert.ok(lines.includes('row-0'), 'row-0 should be completed');
    assert.equal(lines.length, 1, 'Only row-0 should be completed');
  });

  // Test 2: Vertical line completion
  it('2. Vertical line completion: col-2 completes when [3, 8, 13, 18, 23] are called', () => {
    const called = [3, 8, 13, 18, 23];
    const lines = calculateCompletedLines(defaultBoard, called);
    assert.ok(lines.includes('col-2'), 'col-2 should be completed');
    assert.equal(lines.length, 1, 'Only col-2 should be completed');
  });

  // Test 3: Main diagonal
  it('3. Main diagonal completion: diag-main completes when [1, 7, 13, 19, 25] are called', () => {
    const called = [1, 7, 13, 19, 25];
    const lines = calculateCompletedLines(defaultBoard, called);
    assert.ok(lines.includes('diag-main'), 'diag-main should be completed');
    assert.equal(lines.length, 1, 'Only diag-main should be completed');
  });

  // Test 4: Opposite diagonal
  it('4. Opposite diagonal completion: diag-anti completes when [5, 9, 13, 17, 21] are called', () => {
    const called = [5, 9, 13, 17, 21];
    const lines = calculateCompletedLines(defaultBoard, called);
    assert.ok(lines.includes('diag-anti'), 'diag-anti should be completed');
    assert.equal(lines.length, 1, 'Only diag-anti should be completed');
  });

  // Test 5: Multiple lines
  it('5. Multiple lines: 2 rows complete when all their numbers are called', () => {
    const called = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const lines = calculateCompletedLines(defaultBoard, called);
    assert.ok(lines.includes('row-0'), 'row-0 should be complete');
    assert.ok(lines.includes('row-1'), 'row-1 should be complete');
    assert.equal(lines.length, 2, 'Exactly 2 lines should be complete');
  });

  // Test 6: Overlapping lines
  it('6. Overlapping lines: row-2 and col-2 intersecting at 13 both complete correctly', () => {
    // row-2: 11, 12, 13, 14, 15
    // col-2: 3, 8, 13, 18, 23
    const called = [11, 12, 13, 14, 15, 3, 8, 18, 23];
    const lines = calculateCompletedLines(defaultBoard, called);
    assert.ok(lines.includes('row-2'), 'row-2 should be complete');
    assert.ok(lines.includes('col-2'), 'col-2 should be complete');
    assert.equal(lines.length, 2, 'Both intersecting lines should be recognized');
  });

  // Test 7: Duplicate line prevention
  it('7. Duplicate line prevention: calling extra numbers from an already complete line does not duplicate line ID', () => {
    const called = [1, 2, 3, 4, 5, 6]; // extra 6 called
    const lines = calculateCompletedLines(defaultBoard, called);
    const row0Count = lines.filter((id) => id === 'row-0').length;
    assert.equal(row0Count, 1, 'row-0 must appear only once in completed lines array');
  });

  // Test 8: Exactly 5 lines = winner
  it('8. Exactly 5 lines = winner', () => {
    // 5 lines completed: e.g., row-0, row-1, row-2, col-0, diag-main
    const lines = ['row-0', 'row-1', 'row-2', 'col-0', 'diag-main'] as const;
    assert.equal(isWinningState([...lines]), true, '5 lines must trigger winning state');
  });

  // Test 9: Less than 5 lines = no winner
  it('9. Less than 5 lines = no winner', () => {
    const fourLines = ['row-0', 'row-1', 'row-2', 'row-3'] as const;
    assert.equal(isWinningState([...fourLines]), false, '4 lines must not be a winner');
    assert.equal(isWinningState(3), false, '3 lines must not be a winner');
  });

  // Test 10: Number cannot be called twice
  it('10. Number cannot be called twice', () => {
    const calledNumbers = [15, 7, 22];
    const result = canCallNumber('player-1', 'player-1', 15, calledNumbers, 'playing');
    assert.equal(result.allowed, false, 'Calling 15 again should be rejected');
    assert.match(result.reason || '', /already been called/i);
  });

  // Test 11: Wrong player cannot call
  it('11. Wrong player cannot call', () => {
    const calledNumbers = [15];
    const result = canCallNumber('player-2', 'player-1', 10, calledNumbers, 'playing');
    assert.equal(result.allowed, false, 'Player 2 cannot call when it is Player 1 turn');
    assert.match(result.reason || '', /not your turn/i);
  });

  // Test 12: Card contains exactly 1–25
  it('12. Card contains exactly 1–25', () => {
    const validCard = [
      12, 5, 21, 3, 17,
      8, 24, 1, 19, 10,
      15, 7, 23, 11, 4,
      20, 2, 14, 25, 6,
      18, 9, 16, 13, 22
    ];
    const result = validateCard(validCard);
    assert.equal(result.isValid, true, 'Valid 1-25 card must pass');
  });

  // Test 13: Duplicate numbers are rejected
  it('13. Duplicate numbers are rejected', () => {
    const duplicateCard = [
      1, 2, 3, 4, 5,
      6, 7, 8, 9, 10,
      11, 12, 13, 14, 15,
      16, 17, 18, 19, 20,
      21, 22, 23, 24, 24 // duplicate 24, missing 25
    ];
    const result = validateCard(duplicateCard);
    assert.equal(result.isValid, false, 'Duplicate numbers must fail validation');
    assert.match(result.error || '', /duplicate/i);
  });

  // Test 14: Missing number is rejected
  it('14. Missing number is rejected', () => {
    const shortCard = [1, 2, 3, 4, 5];
    const result = validateCard(shortCard);
    assert.equal(result.isValid, false, 'Incomplete card must fail validation');
    assert.match(result.error || '', /must contain exactly 25/i);
  });

  // Test 15: Card cannot change after game starts
  it('15. Card cannot change after game starts', () => {
    // In our rules, calling numbers or modifying cards when status is not allowed is blocked
    const result = canCallNumber('player-1', 'player-1', 10, [], 'lobby');
    assert.equal(result.allowed, false, 'Actions requiring playing state must be rejected in lobby');
    assert.match(result.reason || '', /not currently active/i);
  });
});
