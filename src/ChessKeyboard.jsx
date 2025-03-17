import "./styles.css";
import { useState } from "react";

const pieces = ["K", "Q", "B", "N", "R"];
const letters = ["a", "b", "c", "d", "e", "f", "g", "h"];
const numbers = ["1", "2", "3", "4", "5", "6", "7", "8"];
const specialKeys = ["x", "+", "#", "Enter"];

export default function ChessKeyboard() {
  const [currentMove, setCurrentMove] = useState("");
  const [moves, setMoves] = useState([]);

  const handleKeyPress = (key) => {
    if (key === "Enter") {
      if (currentMove.trim() !== "") {
        const newMoves = [...moves];
        if (newMoves.length % 2 === 0) {
          newMoves.push([currentMove]); // New round
        } else {
          newMoves[newMoves.length - 1].push(currentMove); // Add to last round
        }
        setMoves(newMoves);
        setCurrentMove("");
      }
    } else {
      setCurrentMove((prev) => prev + key);
    }
  };

  const resetGame = () => {
    setMoves([]);
    setCurrentMove("");
  };

  return (
    <div className="flex flex-col items-center p-4 space-y-4">
      <div className="grid grid-cols-4 gap-4">
        {/* Column 1: Piece Keys */}
        <div className="flex flex-col space-y-2">
          {pieces.map((piece) => (
            <button key={piece} className="btn" onClick={() => handleKeyPress(piece)}>
              {piece}
            </button>
          ))}
        </div>

        {/* Column 2: Letter Keys */}
        <div className="flex flex-col space-y-2">
          {letters.map((letter) => (
            <button key={letter} className="btn" onClick={() => handleKeyPress(letter)}>
              {letter}
            </button>
          ))}
        </div>

        {/* Column 3: Number Keys */}
        <div className="flex flex-col space-y-2">
          {numbers.map((number) => (
            <button key={number} className="btn" onClick={() => handleKeyPress(number)}>
              {number}
            </button>
          ))}
        </div>

        {/* Column 4: Special Keys */}
        <div className="flex flex-col space-y-2">
          {specialKeys.map((key) => (
            <button key={key} className="btn" onClick={() => handleKeyPress(key)}>
              {key}
            </button>
          ))}
        </div>
      </div>

      {/* Display Current Move */}
      <div className="text-lg font-bold">Current Move: {currentMove}</div>

      {/* Display Moves History */}
      <div className="text-left text-lg">
        {moves.map((round, index) => (
          <div key={index} className="flex gap-4">
            <span>{index + 1}:</span>
            <span>{round[0] || "-"}</span>
            <span>{round[1] || "-"}</span>
          </div>
        ))}
      </div>

      {/* Reset Button */}
      <button onClick={resetGame} className="btn bg-red-500 text-white mt-4">
        Reset Game
      </button>
    </div>
  );
}