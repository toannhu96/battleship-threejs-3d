import { useEffect, useState, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import {
  OrbitControls,
  PerspectiveCamera,
  useTexture,
} from "@react-three/drei";
import GameBoard from "./GameBoard";
import { GameState } from "../types/game";
import { AIPlayer } from "../utils/AIPlayer";
import {
  SHIP_SIZES,
  SHIP_NAMES,
  autoPlaceShips,
  canPlaceShip,
  placeShip,
} from "../utils/ShipPlacement";

interface GameProps {
  username: string;
}

// Background ocean component
function Ocean() {
  const texture = useTexture("/textures/water.jpg");

  return (
    <mesh position={[0, -2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[100, 100]} />
      <meshStandardMaterial map={texture} />
    </mesh>
  );
}

// Sound effect manager
function useSoundEffect() {
  const canonFireRef = useRef<HTMLAudioElement | null>(null);
  const hitShipRef = useRef<HTMLAudioElement | null>(null);
  const hitWaterRef = useRef<HTMLAudioElement | null>(null);
  const sinkingRef = useRef<HTMLAudioElement | null>(null);
  const soundtrackRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    try {
      canonFireRef.current = new Audio("/sound/effects/canonFire.mp3");
      hitShipRef.current = new Audio("/sound/effects/hitShip.mp3");
      hitWaterRef.current = new Audio("/sound/effects/splash.mp3");
      sinkingRef.current = new Audio("/sound/effects/sinking.mp3");
      soundtrackRef.current = new Audio("/sound/soundtrack/waiting theme.mp3");

      if (soundtrackRef.current) {
        soundtrackRef.current.loop = true;
        soundtrackRef.current.volume = 0.3;
        soundtrackRef.current
          .play()
          .catch((err) => console.log("Error playing soundtrack:", err));
      }
    } catch (error) {
      console.error("Error loading audio files:", error);
    }

    return () => {
      if (soundtrackRef.current) {
        soundtrackRef.current.pause();
      }
    };
  }, []);

  return {
    playCanonFire: () => {
      try {
        return canonFireRef.current?.play();
      } catch (err) {
        console.log("Error playing canon fire sound:", err);
      }
    },
    playHitShip: () => {
      try {
        return hitShipRef.current?.play();
      } catch (err) {
        console.log("Error playing hit ship sound:", err);
      }
    },
    playHitWater: () => {
      try {
        return hitWaterRef.current?.play();
      } catch (err) {
        console.log("Error playing water splash sound:", err);
      }
    },
    playSinking: () => {
      try {
        return sinkingRef.current?.play();
      } catch (err) {
        console.log("Error playing sinking sound:", err);
      }
    },
  };
}

export default function Game({ username }: GameProps) {
  const [gameState, setGameState] = useState<GameState>("placing");
  const [playerBoard, setPlayerBoard] = useState<number[][]>(
    Array(10)
      .fill(0)
      .map(() => Array(10).fill(0))
  );
  const [aiBoard, setAiBoard] = useState<number[][]>(
    Array(10)
      .fill(0)
      .map(() => Array(10).fill(0))
  );
  const [currentShip, setCurrentShip] = useState<number>(1); // Start with ship ID 1
  const [isPlayerTurn, setIsPlayerTurn] = useState<boolean>(true);
  const [isHorizontal, setIsHorizontal] = useState<boolean>(true);
  const [shipSizes, setShipSizes] = useState<{ [key: number]: number }>({
    1: 4, // Ship ID 1 is size 4
    2: 3, // Ship ID 2 is size 3
    3: 3, // Ship ID 3 is size 3
    4: 2, // Ship ID 4 is size 2
    5: 2, // Ship ID 5 is size 2
    6: 1, // Ship ID 6 is size 1 (Raft 1)
    7: 1, // Ship ID 7 is size 1 (Raft 2)
  });
  const [placedShips, setPlacedShips] = useState<Set<number>>(new Set());
  const [gameResult, setGameResult] = useState<"won" | "lost" | null>(null);
  const [hitEffects, setHitEffects] = useState<Array<{ x: number; y: number }>>(
    []
  );

  const ai = useRef(new AIPlayer());
  const soundEffects = useSoundEffect();

  useEffect(() => {
    // Initialize AI board
    const initialAiBoard = ai.current.placeShips();
    setAiBoard(initialAiBoard);
  }, []);

  // Check for win/lose conditions
  useEffect(() => {
    if (gameState !== "playing") return;

    // Check if all AI ships are hit
    let allAiShipsHit = true;
    for (let y = 0; y < 10; y++) {
      for (let x = 0; x < 10; x++) {
        if (aiBoard[y][x] > 0) {
          allAiShipsHit = false;
          break;
        }
      }
      if (!allAiShipsHit) break;
    }

    // Check if all player ships are hit
    let allPlayerShipsHit = true;
    for (let y = 0; y < 10; y++) {
      for (let x = 0; x < 10; x++) {
        if (playerBoard[y][x] > 0) {
          allPlayerShipsHit = false;
          break;
        }
      }
      if (!allPlayerShipsHit) break;
    }

    if (allAiShipsHit) {
      setGameResult("won");
      soundEffects.playSinking();
    } else if (allPlayerShipsHit) {
      setGameResult("lost");
      soundEffects.playSinking();
    }
  }, [playerBoard, aiBoard, gameState]);

  const handlePlaceShip = (x: number, y: number) => {
    if (gameState !== "placing" || placedShips.has(currentShip)) return;

    const shipSize = shipSizes[currentShip];
    if (canPlaceShip(playerBoard, x, y, shipSize, isHorizontal)) {
      const newBoard = placeShip(
        playerBoard,
        x,
        y,
        shipSize,
        currentShip,
        isHorizontal
      );
      setPlayerBoard(newBoard);

      // Mark the ship as placed
      const newPlacedShips = new Set(placedShips);
      newPlacedShips.add(currentShip);
      setPlacedShips(newPlacedShips);

      // Select next unplaced ship
      selectNextAvailableShip(newPlacedShips);
    }
  };

  const selectNextAvailableShip = (placedShipsSet: Set<number>) => {
    for (let id = 1; id <= 7; id++) {
      if (!placedShipsSet.has(id)) {
        setCurrentShip(id);
        return;
      }
    }
    // All ships placed
    setCurrentShip(0);
  };

  const handleSelectShip = (shipId: number) => {
    if (!placedShips.has(shipId) && gameState === "placing") {
      setCurrentShip(shipId);
    }
  };

  const handleAutoPlace = () => {
    if (gameState === "placing") {
      const autoBoard = autoPlaceShips();
      setPlayerBoard(autoBoard);
      // Mark all ships as placed
      const allShips = new Set([1, 2, 3, 4, 5, 6, 7]);
      setPlacedShips(allShips);
      setCurrentShip(0);
    }
  };

  const handleResetShips = () => {
    if (gameState === "placing") {
      // Clear the board
      setPlayerBoard(
        Array(10)
          .fill(0)
          .map(() => Array(10).fill(0))
      );
      // Reset placed ships
      setPlacedShips(new Set());
      // Reset to first ship
      setCurrentShip(1);
    }
  };

  const handleRotateShip = () => {
    if (gameState === "placing") {
      setIsHorizontal(!isHorizontal);
    }
  };

  const handleReady = () => {
    if (placedShips.size === 7 && gameState === "placing") {
      setGameState("playing");
    }
  };

  const handlePlayerShot = (x: number, y: number) => {
    if (!isPlayerTurn || gameState !== "playing" || gameResult) return;

    // Play canon fire sound
    soundEffects.playCanonFire();

    const newAiBoard = [...aiBoard];

    // Wait for a short time to simulate the shot flying
    setTimeout(() => {
      if (newAiBoard[y][x] === 0) {
        newAiBoard[y][x] = -1; // Miss
        soundEffects.playHitWater();
      } else if (newAiBoard[y][x] > 0) {
        newAiBoard[y][x] = -2; // Hit
        soundEffects.playHitShip();
        // Add hit effect
        setHitEffects((prev) => [...prev, { x, y }]);
      }

      setAiBoard(newAiBoard);
      setIsPlayerTurn(false);

      // AI turn
      setTimeout(() => {
        const [aiX, aiY] = ai.current.makeMove(playerBoard);
        const newPlayerBoard = [...playerBoard];

        soundEffects.playCanonFire();

        setTimeout(() => {
          if (newPlayerBoard[aiY][aiX] === 0) {
            newPlayerBoard[aiY][aiX] = -1; // Miss
            soundEffects.playHitWater();
          } else if (newPlayerBoard[aiY][aiX] > 0) {
            newPlayerBoard[aiY][aiX] = -2; // Hit
            soundEffects.playHitShip();
          }

          setPlayerBoard(newPlayerBoard);
          setIsPlayerTurn(true);
        }, 500);
      }, 1000);
    }, 300);
  };

  const handleRestart = () => {
    // Reset the game
    setGameState("placing");
    setPlayerBoard(
      Array(10)
        .fill(0)
        .map(() => Array(10).fill(0))
    );
    setAiBoard(
      Array(10)
        .fill(0)
        .map(() => Array(10).fill(0))
    );
    setCurrentShip(1);
    setIsPlayerTurn(true);
    setIsHorizontal(true);
    setPlacedShips(new Set());
    setGameResult(null);

    // Initialize new AI board
    const initialAiBoard = ai.current.placeShips();
    setAiBoard(initialAiBoard);
  };

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        backgroundImage: "url('/textures/background.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <Canvas>
        <PerspectiveCamera makeDefault position={[0, 12, 12]} />
        <OrbitControls />
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} />

        {/* Scene background */}
        <Ocean />

        {/* Player's board */}
        <GameBoard
          position={[-6, 0, 0]}
          board={playerBoard}
          onClick={handlePlaceShip}
          isPlayerBoard={true}
          currentShipSize={currentShip > 0 ? shipSizes[currentShip] : 0}
          isHorizontal={isHorizontal}
          isPlacementPhase={gameState === "placing"}
          boardColor="lightblue"
        />

        {/* AI's board */}
        <GameBoard
          position={[6, 0, 0]}
          board={aiBoard}
          onClick={handlePlayerShot}
          isPlayerBoard={false}
          boardColor="#ffc0cb"
          hitPositions={hitEffects}
        />
      </Canvas>

      {/* Game UI */}
      <div
        style={{
          position: "absolute",
          top: 20,
          left: 20,
          color: "white",
          background: "rgba(0,0,0,0.7)",
          padding: "10px",
          borderRadius: "5px",
        }}
      >
        {gameState === "placing" ? (
          <div>
            <div>Place your ships!</div>
            {currentShip > 0 && (
              <div>
                Current ship: {SHIP_NAMES[currentShip]} (Size:{" "}
                {shipSizes[currentShip]}, Orientation:{" "}
                {isHorizontal ? "Horizontal" : "Vertical"})
              </div>
            )}
            <div style={{ marginTop: "10px" }}>
              <button
                onClick={handleRotateShip}
                style={{ marginRight: "10px", padding: "5px 10px" }}
              >
                Rotate Ship
              </button>
              <button
                onClick={handleAutoPlace}
                style={{ padding: "5px 10px", marginRight: "10px" }}
              >
                Auto Place
              </button>
              <button
                onClick={handleResetShips}
                style={{ padding: "5px 10px" }}
                disabled={placedShips.size === 0}
              >
                Reset
              </button>
            </div>
            <div
              style={{
                marginTop: "10px",
                display: "flex",
                flexWrap: "wrap",
                gap: "5px",
              }}
            >
              {Object.entries(shipSizes).map(([id, size]) => (
                <button
                  key={id}
                  onClick={() => handleSelectShip(Number(id))}
                  style={{
                    padding: "5px",
                    background:
                      Number(id) === currentShip
                        ? "#2a8a4b"
                        : placedShips.has(Number(id))
                        ? "#ccc"
                        : "#087f8c",
                    opacity: placedShips.has(Number(id)) ? 0.5 : 1,
                    cursor: placedShips.has(Number(id))
                      ? "not-allowed"
                      : "pointer",
                    border: "none",
                    borderRadius: "3px",
                    color: "white",
                    fontSize: "12px",
                    minWidth: "30px",
                  }}
                  disabled={placedShips.has(Number(id))}
                >
                  {SHIP_NAMES[Number(id)]}
                </button>
              ))}
            </div>
            <div style={{ marginTop: "10px" }}>
              <button
                onClick={handleReady}
                style={{
                  padding: "8px 15px",
                  background: placedShips.size === 7 ? "#2a8a4b" : "#ccc",
                  cursor: placedShips.size === 7 ? "pointer" : "not-allowed",
                  border: "none",
                  borderRadius: "3px",
                  color: "white",
                  fontWeight: "bold",
                }}
                disabled={placedShips.size !== 7}
              >
                Ready
              </button>
            </div>
          </div>
        ) : (
          <div>{isPlayerTurn ? "Your turn!" : "AI's turn..."}</div>
        )}
      </div>

      {/* Win/Lose popup */}
      {gameResult && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.8)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              width: "80%",
              maxWidth: "500px",
              padding: "30px",
              backgroundColor: "rgba(255,255,255,0.2)",
              backdropFilter: "blur(10px)",
              borderRadius: "10px",
              textAlign: "center",
              color: "white",
              backgroundImage: `url('/${
                gameResult === "won" ? "win" : "lost"
              }.jpg')`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              boxShadow: "0 0 20px rgba(0,0,0,0.5)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "space-between",
              minHeight: "300px",
            }}
          >
            <h1 style={{ fontSize: "2.5rem", marginBottom: "20px" }}>
              {gameResult === "won" ? "Victory!" : "Defeated!"}
            </h1>
            <p
              style={{
                fontSize: "1.2rem",
                margin: "20px 0",
                backgroundColor: "rgba(0,0,0,0.6)",
                padding: "10px",
                borderRadius: "5px",
              }}
            >
              {gameResult === "won"
                ? `Congratulations ${username}! You've defeated the enemy fleet!`
                : `Too bad, ${username}! Your fleet was destroyed!`}
            </p>
            <button
              onClick={handleRestart}
              style={{
                padding: "10px 20px",
                backgroundColor: "#2a8a4b",
                color: "white",
                border: "none",
                borderRadius: "5px",
                fontSize: "1.2rem",
                cursor: "pointer",
                marginTop: "20px",
                transition: "all 0.2s",
              }}
            >
              Play Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
