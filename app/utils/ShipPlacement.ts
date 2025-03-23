export interface Ship {
  id: number;
  size: number;
  placed: boolean;
  orientation: "horizontal" | "vertical";
}

export const SHIP_SIZES = [4, 3, 3, 2, 2, 1, 1];

export const SHIP_NAMES: { [key: number]: string } = {
  1: "Battleship", // Size 4
  2: "Cruiser", // Size 3
  3: "Submarine", // Size 3
  4: "Destroyer", // Size 2
  5: "Frigate", // Size 2
  6: "Raft 1", // Size 1
  7: "Raft 2", // Size 1
};

export function canPlaceShip(
  board: number[][],
  x: number,
  y: number,
  size: number,
  horizontal: boolean
): boolean {
  // Check if the ship would go off the board
  if (horizontal && x + size > 10) return false;
  if (!horizontal && y + size > 10) return false;

  // Check if there's another ship in the way or too close
  for (let i = -1; i <= size; i++) {
    for (let j = -1; j <= 1; j++) {
      const checkX = horizontal ? x + i : x + j;
      const checkY = horizontal ? y + j : y + i;

      if (checkX >= 0 && checkX < 10 && checkY >= 0 && checkY < 10) {
        if (board[checkY][checkX] !== 0) return false;
      }
    }
  }
  return true;
}

export function placeShip(
  board: number[][],
  x: number,
  y: number,
  size: number,
  shipId: number,
  horizontal: boolean
): number[][] {
  const newBoard = [...board.map((row) => [...row])];

  for (let i = 0; i < size; i++) {
    if (horizontal) {
      newBoard[y][x + i] = shipId;
    } else {
      newBoard[y + i][x] = shipId;
    }
  }

  return newBoard;
}

export function autoPlaceShips(): number[][] {
  const board = Array(10)
    .fill(0)
    .map(() => Array(10).fill(0));

  let shipId = 1;
  for (const size of SHIP_SIZES) {
    let placed = false;
    while (!placed) {
      const horizontal = Math.random() < 0.5;
      const x = Math.floor(Math.random() * (horizontal ? 11 - size : 10));
      const y = Math.floor(Math.random() * (horizontal ? 10 : 11 - size));

      if (canPlaceShip(board, x, y, size, horizontal)) {
        for (let i = 0; i < size; i++) {
          if (horizontal) {
            board[y][x + i] = shipId;
          } else {
            board[y + i][x] = shipId;
          }
        }
        placed = true;
        shipId++;
      }
    }
  }

  return board;
}
