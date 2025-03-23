export class AIPlayer {
  private lastHit: [number, number] | null = null;
  private potentialTargets: [number, number][] = [];
  private shotHistory: Set<string> = new Set();

  constructor() {}

  placeShips(): number[][] {
    const board = Array(10)
      .fill(0)
      .map(() => Array(10).fill(0));
    const ships = [4, 3, 3, 2, 2, 2, 1]; // Ship sizes

    for (const size of ships) {
      let placed = false;
      while (!placed) {
        const horizontal = Math.random() < 0.5;
        const x = Math.floor(Math.random() * (horizontal ? 11 - size : 10));
        const y = Math.floor(Math.random() * (horizontal ? 10 : 11 - size));

        if (this.canPlaceShip(board, x, y, size, horizontal)) {
          this.placeShip(board, x, y, size, horizontal);
          placed = true;
        }
      }
    }

    return board;
  }

  private canPlaceShip(
    board: number[][],
    x: number,
    y: number,
    size: number,
    horizontal: boolean
  ): boolean {
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

  private placeShip(
    board: number[][],
    x: number,
    y: number,
    size: number,
    horizontal: boolean
  ): void {
    for (let i = 0; i < size; i++) {
      if (horizontal) {
        board[y][x + i] = size;
      } else {
        board[y + i][x] = size;
      }
    }
  }

  makeMove(playerBoard: number[][]): [number, number] {
    // If we have potential targets from a previous hit, try those first
    if (this.potentialTargets.length > 0) {
      const target = this.potentialTargets.pop()!;
      const [x, y] = target;

      if (!this.shotHistory.has(`${x},${y}`)) {
        this.shotHistory.add(`${x},${y}`);

        if (playerBoard[y][x] > 0) {
          this.lastHit = [x, y];
          this.addAdjacentTargets(x, y);
        }

        return target;
      }
    }

    // If no potential targets, try a random shot using a checkerboard pattern
    let attempts = 0;
    while (attempts < 100) {
      const x = Math.floor(Math.random() * 10);
      const y = Math.floor(Math.random() * 10);

      // Use checkerboard pattern
      if ((x + y) % 2 === 0 && !this.shotHistory.has(`${x},${y}`)) {
        this.shotHistory.add(`${x},${y}`);

        if (playerBoard[y][x] > 0) {
          this.lastHit = [x, y];
          this.addAdjacentTargets(x, y);
        }

        return [x, y];
      }
      attempts++;
    }

    // If checkerboard pattern is full, just find any available spot
    for (let y = 0; y < 10; y++) {
      for (let x = 0; x < 10; x++) {
        if (!this.shotHistory.has(`${x},${y}`)) {
          this.shotHistory.add(`${x},${y}`);
          return [x, y];
        }
      }
    }

    return [0, 0]; // Should never reach here
  }

  private addAdjacentTargets(x: number, y: number): void {
    const directions = [
      [0, 1],
      [1, 0],
      [0, -1],
      [-1, 0],
    ];

    for (const [dx, dy] of directions) {
      const newX = x + dx;
      const newY = y + dy;

      if (
        newX >= 0 &&
        newX < 10 &&
        newY >= 0 &&
        newY < 10 &&
        !this.shotHistory.has(`${newX},${newY}`)
      ) {
        this.potentialTargets.push([newX, newY]);
      }
    }
  }
}
