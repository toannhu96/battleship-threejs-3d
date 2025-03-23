export type GameState = "placing" | "playing" | "gameOver";

export interface Ship {
  size: number;
  hits: number;
  sunk: boolean;
}

export interface GameBoard {
  cells: number[][];
  ships: Ship[];
}
