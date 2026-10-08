export const DIGITS = [1, 2, 3, 4, 5, 6, 7, 8, 9];
export const cloneBoard = (board) => board.map((row) => [...row]);
export const isBoardShape = (board) => Array.isArray(board) && board.length === 9 && board.every(
  (row) => Array.isArray(row) && row.length === 9 && row.every((value) => Number.isInteger(value) && value >= 0 && value <= 9),
);

export function isValidMove(board, row, col, value) {
  if (!isBoardShape(board) || !Number.isInteger(row) || !Number.isInteger(col) || row < 0 || row > 8 || col < 0 || col > 8 || !DIGITS.includes(value)) return false;
  for (let index = 0; index < 9; index++) {
    if (index !== col && board[row][index] === value) return false;
    if (index !== row && board[index][col] === value) return false;
  }
  const boxRow = Math.floor(row / 3) * 3;
  const boxCol = Math.floor(col / 3) * 3;
  for (let r = boxRow; r < boxRow + 3; r++) for (let c = boxCol; c < boxCol + 3; c++) {
    if ((r !== row || c !== col) && board[r][c] === value) return false;
  }
  return true;
}

export function isValidBoard(board) {
  if (!isBoardShape(board)) return false;
  return board.every((row, r) => row.every((value, c) => value === 0 || isValidMove(board, r, c, value)));
}

export const isComplete = (board) => isValidBoard(board) && board.every((row) => row.every((value) => value !== 0));
