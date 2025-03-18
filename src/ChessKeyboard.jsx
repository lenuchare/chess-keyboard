import { useState } from "react";
import "./styles.css";

const pieces = ["K", "Q", "B", "N", "R"];
const letters = ["a", "b", "c", "d", "e", "f", "g", "h"];
const numbers = ["1", "2", "3", "4", "5", "6", "7", "8"];
const specialKeys = ["x", "+", "#", "Enter", "Backspace"];

export default function ChessKeyboard() {
  const [currentMove, setCurrentMove] = useState("");
  const [moves, setMoves] = useState([]);
  const [gameOver, setGameOver] = useState(false);

  const handleKeyPress = (key) => {
    if (gameOver) return; // Stop input after checkmate

    if (key === "Enter") {
      if (currentMove.trim() !== "") {
        const newMoves = [...moves];
        
        if (newMoves.length === 0 || newMoves[newMoves.length - 1].length === 2) {
          // Start a new round if it's the first move or last round is complete
          newMoves.push([currentMove]);
        } else {
          // Add black's move to the current round
          newMoves[newMoves.length - 1].push(currentMove);
        }

        setMoves(newMoves);
        
        // Check for checkmate
        if (currentMove.includes("#")) {
          setGameOver(true);
        }
        
        setCurrentMove("");
      }
    } else if (key === "Backspace") {
      setCurrentMove((prev) => prev.slice(0, -1));
    } else {
      setCurrentMove((prev) => prev + key);
    }
  };

  const deleteLastMove = () => {
    if (moves.length === 0) return;
    
    const newMoves = [...moves];
    if (newMoves[newMoves.length - 1].length === 2) {
      // Remove black move
      newMoves[newMoves.length - 1].pop();
    } else {
      // Remove white move (and entire round if alone)
      newMoves.pop();
    }
    
    // Make sure to remove gameOver state if we delete a checkmate move
    if (gameOver) {
      setGameOver(false);
    }
    
    setMoves(newMoves);
  };

  const resetGame = () => {
    setMoves([]);
    setCurrentMove("");
    setGameOver(false);
  };

  return (
    <div className="flex flex-row items-start p-4 space-x-8">
      {/* Keyboard Section */}
      <div className="keyboard-container">
        <div className="keyboard-grid">
          {/* Column 1: Piece Keys */}
          <div className="key-column">
            {pieces.map((piece) => (
              <button 
                key={piece} 
                className="btn" 
                onClick={() => handleKeyPress(piece)}
                disabled={gameOver}
              >
                {piece}
              </button>
            ))}
          </div>

          {/* Column 2: Letter Keys */}
          <div className="key-column">
            {letters.map((letter) => (
              <button 
                key={letter} 
                className="btn" 
                onClick={() => handleKeyPress(letter)}
                disabled={gameOver}
              >
                {letter}
              </button>
            ))}
          </div>

          {/* Column 3: Number Keys */}
          <div className="key-column">
            {numbers.map((number) => (
              <button 
                key={number} 
                className="btn" 
                onClick={() => handleKeyPress(number)}
                disabled={gameOver}
              >
                {number}
              </button>
            ))}
          </div>

          {/* Column 4: Special Keys */}
          <div className="key-column">
            {specialKeys.map((key) => (
              <button 
                key={key} 
                className="btn" 
                onClick={() => handleKeyPress(key)}
                disabled={gameOver && key !== "Backspace"}
              >
                {key}
              </button>
            ))}
          </div>
        </div>

        {/* Display Current Move */}
        <div className="current-input">
          Current Move: {currentMove}
          {gameOver && <span className="ml-2 text-red-500">(Checkmate)</span>}
        </div>

        {/* Control Buttons */}
        <button onClick={deleteLastMove} className="reset-btn bg-blue-500">
          Delete Last Move
        </button>
        <button onClick={resetGame} className="reset-btn">
          Reset Game
        </button>
      </div>

      {/* Move List Display */}
      <div className="move-list">
        <div className="move-title">Moves</div>
        {moves.map((round, index) => (
          <div key={index} className="move-row">
            <span>{index + 1}.</span>
            <span>{round[0] || "-"}</span>
            <span>{round[1] || "-"}</span>
          </div>
        ))}
        {gameOver && <div className="text-red-500 mt-2 font-bold">Checkmate!</div>}
      </div>
    </div>
  );
}
