"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

const Game = dynamic(() => import("../components/Game"), { ssr: false });

export default function Home() {
  const [username, setUsername] = useState("");
  const [gameStarted, setGameStarted] = useState(false);

  const handleStartGame = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim()) {
      setGameStarted(true);
    }
  };

  if (!gameStarted) {
    return (
      <div className="login-container">
        <form onSubmit={handleStartGame} className="login-form">
          <h1>Battleships 3D</h1>
          <input
            type="text"
            placeholder="Enter your name"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <button type="submit">Play Now</button>
        </form>
      </div>
    );
  }

  return <Game username={username} />;
}
