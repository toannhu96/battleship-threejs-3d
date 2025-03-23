import { useRef, useState, useEffect } from "react";
import { ThreeElements, useFrame } from "@react-three/fiber";
import { Mesh, Group, Vector3 } from "three";
import { canPlaceShip } from "../utils/ShipPlacement";

interface ShipProps {
  size: number;
  position: [number, number, number];
  orientation: "horizontal" | "vertical";
  color?: string;
}

// Enhanced 3D Ship component with better visualization
function Ship({ size, position, orientation, color = "gray" }: ShipProps) {
  const shipWidth = orientation === "horizontal" ? size : 1;
  const shipLength = orientation === "horizontal" ? 1 : size;

  // Ship type colors based on size
  const getShipColors = () => {
    if (color !== "gray") return { hull: color, deck: color, details: color };

    switch (size) {
      case 4: // Battleship - purple theme (instead of red)
        return { hull: "#7b2cbf", deck: "#9146cf", details: "#5a189a" };
      case 3: // Cruiser/Submarine - dark maroon/burgundy theme
        return { hull: "#8B5A2B", deck: "#A67C52", details: "#6F4518" };
      case 2: // Destroyer/Frigate - green theme
        return { hull: "#2a8a4b", deck: "#34a85c", details: "#1d6334" };
      case 1: // Raft - rich burgundy theme
        return { hull: "#800020", deck: "#9a1750", details: "#560319" };
      default:
        return { hull: "#555", deck: "#666", details: "#444" };
    }
  };

  const shipColors = getShipColors();

  return (
    <group position={position}>
      {/* Ship hull - larger and with distinct color */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[0.85 * shipWidth, 0.18, 0.85 * shipLength]} />
        <meshStandardMaterial color={shipColors.hull} />
      </mesh>

      {/* Ship deck */}
      <mesh position={[0, 0.12, 0]}>
        <boxGeometry args={[0.75 * shipWidth, 0.08, 0.75 * shipLength]} />
        <meshStandardMaterial color={shipColors.deck} />
      </mesh>

      {/* Command tower for ships of size > 1 */}
      {size > 1 && (
        <mesh
          position={[
            orientation === "horizontal" ? -0.2 * (shipWidth - 1) : 0,
            0.25,
            orientation === "vertical" ? -0.2 * (shipLength - 1) : 0,
          ]}
        >
          <boxGeometry args={[0.35, 0.2, 0.35]} />
          <meshStandardMaterial color={shipColors.details} />
        </mesh>
      )}

      {/* Cannon for battleships (size 4) */}
      {size === 4 && (
        <mesh
          position={[
            orientation === "horizontal" ? 0.3 * shipWidth : 0,
            0.18,
            orientation === "vertical" ? 0.3 * shipLength : 0,
          ]}
          rotation={[0, orientation === "horizontal" ? 0 : Math.PI / 2, 0]}
        >
          <cylinderGeometry args={[0.06, 0.08, 0.6, 8]} />
          <meshStandardMaterial color="#333" metalness={0.7} roughness={0.3} />
        </mesh>
      )}

      {/* Small details for larger ships */}
      {size > 1 &&
        Array.from({ length: Math.min(size, 4) }).map((_, i) => (
          <mesh
            key={i}
            position={[
              orientation === "horizontal"
                ? -0.3 * (shipWidth - 1) + i * ((0.6 * shipWidth) / (size - 1))
                : 0,
              0.21,
              orientation === "vertical"
                ? -0.3 * (shipLength - 1) +
                  i * ((0.6 * shipLength) / (size - 1))
                : 0,
            ]}
          >
            <boxGeometry args={[0.12, 0.06, 0.12]} />
            <meshStandardMaterial
              color="#ddd"
              metalness={0.5}
              roughness={0.5}
            />
          </mesh>
        ))}
    </group>
  );
}

interface HitEffectProps {
  position: [number, number, number];
}

// Hit effect animation
function HitEffect({ position }: HitEffectProps) {
  const ref = useRef<Group>(null);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setVisible(false);
    }, 1000);

    return () => clearTimeout(timeout);
  }, []);

  useFrame((state) => {
    if (ref.current && visible) {
      ref.current.rotation.y += 0.2;
      ref.current.scale.x = Math.max(ref.current.scale.x - 0.02, 0);
      ref.current.scale.y = Math.max(ref.current.scale.y - 0.02, 0);
      ref.current.scale.z = Math.max(ref.current.scale.z - 0.02, 0);
    }
  });

  if (!visible) return null;

  return (
    <group ref={ref} position={position}>
      <mesh>
        <sphereGeometry args={[0.5, 16, 16]} />
        <meshStandardMaterial
          color="#ff0000" /* Using bright red instead of purple */
          emissive="#ff3333"
          emissiveIntensity={2}
        />
      </mesh>
    </group>
  );
}

interface GameBoardProps {
  position: [number, number, number];
  board: number[][];
  onClick: (x: number, y: number) => void;
  isPlayerBoard: boolean;
  currentShipSize?: number;
  isHorizontal?: boolean;
  isPlacementPhase?: boolean;
  boardColor?: string;
  hitPositions?: Array<{ x: number; y: number }>;
}

export default function GameBoard({
  position,
  board,
  onClick,
  isPlayerBoard,
  currentShipSize = 0,
  isHorizontal = true,
  isPlacementPhase = false,
  boardColor = "lightblue",
  hitPositions = [],
}: GameBoardProps) {
  const groupRef = useRef<Group>(null);
  const [hoverCell, setHoverCell] = useState<[number, number] | null>(null);
  const [shipCoordinates, setShipCoordinates] = useState<
    Map<number, { x: number; y: number; horizontal: boolean; size: number }>
  >(new Map());

  // Extract ship positions from the board
  useEffect(() => {
    const newShipCoords = new Map<
      number,
      { x: number; y: number; horizontal: boolean; size: number }
    >();

    // Find all ships and their orientations
    for (let y = 0; y < board.length; y++) {
      for (let x = 0; x < board[y].length; x++) {
        const cell = board[y][x];
        if (cell > 0) {
          if (!newShipCoords.has(cell)) {
            // Check horizontal orientation
            let isHorizontal = false;
            let shipSize = 1;

            if (x + 1 < 10 && board[y][x + 1] === cell) {
              isHorizontal = true;
              // Count size
              for (let i = 1; x + i < 10 && board[y][x + i] === cell; i++) {
                shipSize++;
              }
            } else if (y + 1 < 10 && board[y + 1][x] === cell) {
              isHorizontal = false;
              // Count size
              for (let i = 1; y + i < 10 && board[y + i][x] === cell; i++) {
                shipSize++;
              }
            }

            newShipCoords.set(cell, {
              x,
              y,
              horizontal: isHorizontal,
              size: shipSize,
            });
          }
        }
      }
    }

    setShipCoordinates(newShipCoords);
  }, [board]);

  const getColor = (value: number): string => {
    switch (value) {
      case -2: // Hit - using bright red for visibility
        return "#ff0000";
      case -1: // Miss - using teal instead of blue
        return "#0aa3b4";
      case 0: // Water
        return boardColor;
      default: // Ship
        return isPlayerBoard ? "gray" : boardColor;
    }
  };

  const getPreviewColor = (x: number, y: number): string => {
    if (!hoverCell || !isPlacementPhase || currentShipSize === 0)
      return boardColor;

    const [hoverX, hoverY] = hoverCell;
    if (isHorizontal) {
      if (x >= hoverX && x < hoverX + currentShipSize && y === hoverY) {
        return canPlaceShip(
          board,
          hoverX,
          hoverY,
          currentShipSize,
          isHorizontal
        )
          ? "rgba(76, 175, 80, 0.7)" /* Medium green with alpha - slightly darker */
          : "rgba(231, 111, 81, 0.7)" /* Orange with alpha instead of red */;
      }
    } else {
      if (y >= hoverY && y < hoverY + currentShipSize && x === hoverX) {
        return canPlaceShip(
          board,
          hoverX,
          hoverY,
          currentShipSize,
          isHorizontal
        )
          ? "rgba(76, 175, 80, 0.7)" /* Medium green with alpha - slightly darker */
          : "rgba(231, 111, 81, 0.7)" /* Orange with alpha instead of red */;
      }
    }
    return boardColor;
  };

  const handlePointerOver = (x: number, y: number) => {
    if (isPlacementPhase && isPlayerBoard) {
      setHoverCell([x, y]);
    }
  };

  const handlePointerOut = () => {
    setHoverCell(null);
  };

  return (
    <group ref={groupRef} position={position}>
      {/* Water grid */}
      {board.map((row, y) =>
        row.map((cell, x) => (
          <mesh
            key={`${x}-${y}`}
            position={[x - 4.5, 0, y - 4.5]}
            onClick={(e) => {
              e.stopPropagation();
              onClick(x, y);
            }}
            onPointerOver={(e) => {
              e.stopPropagation();
              handlePointerOver(x, y);
            }}
            onPointerOut={handlePointerOut}
          >
            <boxGeometry args={[0.9, 0.1, 0.9]} />
            <meshStandardMaterial
              color={
                cell === 0 && isPlayerBoard && isPlacementPhase
                  ? getPreviewColor(x, y)
                  : getColor(cell)
              }
              transparent={isPlacementPhase && hoverCell !== null}
              opacity={
                isPlacementPhase &&
                hoverCell !== null &&
                getPreviewColor(x, y) !== boardColor
                  ? 0.7
                  : 1
              }
            />
          </mesh>
        ))
      )}

      {/* Render the ships for player board */}
      {isPlayerBoard &&
        Array.from(shipCoordinates.entries()).map(([shipId, shipData]) => {
          // Don't render hit ships (they're rendered as red markers)
          const allCellsHit = Array.from({ length: shipData.size }, (_, i) => {
            const checkX = shipData.horizontal ? shipData.x + i : shipData.x;
            const checkY = shipData.horizontal ? shipData.y : shipData.y + i;
            return board[checkY][checkX] === -2;
          }).every(Boolean);

          if (allCellsHit) return null;

          return (
            <Ship
              key={`ship-${shipId}`}
              size={shipData.size}
              position={[
                shipData.x -
                  4.5 +
                  (shipData.horizontal ? (shipData.size - 1) / 2 : 0),
                0.2,
                shipData.y -
                  4.5 +
                  (!shipData.horizontal ? (shipData.size - 1) / 2 : 0),
              ]}
              orientation={shipData.horizontal ? "horizontal" : "vertical"}
            />
          );
        })}

      {/* Render hit effects */}
      {hitPositions.map((pos, index) => (
        <HitEffect
          key={`hit-${index}`}
          position={[pos.x - 4.5, 0.5, pos.y - 4.5]}
        />
      ))}

      {/* Grid lines */}
      {Array(11)
        .fill(0)
        .map((_, i) => (
          <group key={`grid-${i}`}>
            {/* Horizontal lines */}
            <mesh position={[0, 0, i - 5]}>
              <boxGeometry args={[10, 0.05, 0.05]} />
              <meshStandardMaterial color="white" />
            </mesh>
            {/* Vertical lines */}
            <mesh position={[i - 5, 0, 0]}>
              <boxGeometry args={[0.05, 0.05, 10]} />
              <meshStandardMaterial color="white" />
            </mesh>
          </group>
        ))}
    </group>
  );
}
