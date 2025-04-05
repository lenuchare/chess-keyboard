import { useState, useEffect } from "react";
import { Chess } from "chess.js";
import "./styles.css";

const pieces = ["K", "Q", "B", "N", "R"];
const letters = ["a", "b", "c", "d", "e", "f", "g", "h"];
const numbers = ["1", "2", "3", "4", "5", "6", "7", "8"];
const specialKeys = ["O-O", "O-O-O", "e.p.", "=", "x", "+", "#", "Enter", "Backspace"];

export default function ChessKeyboard() {
  const [currentMove, setCurrentMove] = useState("");
  const [moves, setMoves] = useState([]);
  const [gameOver, setGameOver] = useState(false);
  const [gameResult, setGameResult] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [chess, setChess] = useState(new Chess());
  const [suggestedCorrection, setSuggestedCorrection] = useState("");
  const [currentPlayer, setCurrentPlayer] = useState("white");
  const [playerColor, setPlayerColor] = useState(null);
  const [showColorSelector, setShowColorSelector] = useState(false);
  const [gameId, setGameId] = useState(null);
  const [colorLocked, setColorLocked] = useState(false);
  const [singlePlayerMode, setSinglePlayerMode] = useState(false);

  // Initialize game state or join existing game
  useEffect(() => {
    const savedColor = localStorage.getItem('chessPlayerColor');
    const savedGameId = localStorage.getItem('chessGameId');
    const savedGame = localStorage.getItem('chessGameState');
    const savedColorLocked = localStorage.getItem('chessColorLocked');
    const savedSinglePlayerMode = localStorage.getItem('chessSinglePlayerMode');

    if (savedColorLocked === 'true') {
      setColorLocked(true);
    }

    if (savedSinglePlayerMode === 'true') {
      setSinglePlayerMode(true);
    }

    if (savedGameId) {
      setGameId(savedGameId);
    } else {
      // Generate a unique game ID if none exists
      const newGameId = `game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      setGameId(newGameId);
      localStorage.setItem('chessGameId', newGameId);
    }

    if (!savedColor) {
      setShowColorSelector(true);
    } else {
      setPlayerColor(savedColor);
      setShowColorSelector(false);
    }

    if (savedGame) {
      try {
        const { fen, moves: savedMoves, currentPlayer: savedCurrentPlayer, gameStatus, gameResult: savedResult } = JSON.parse(savedGame);
        const newChess = new Chess(fen);
        setChess(newChess);
        setMoves(savedMoves);
        setCurrentPlayer(savedCurrentPlayer);
        
        if (gameStatus === "over") {
          setGameOver(true);
          setGameResult(savedResult || "");
        }
      } catch (error) {
        console.error("Error loading saved game:", error);
        resetGame();
      }
    }

    const handleStorageChange = (e) => {
      if (e.key === 'chessGameState') {
        try {
          const { fen, moves: newMoves, currentPlayer: newCurrentPlayer, gameId: storedGameId, gameStatus, gameResult: newResult } = JSON.parse(e.newValue);
          
          // Only update if it's the same game
          if (storedGameId === savedGameId) {
            const newChess = new Chess(fen);
            setChess(newChess);
            setMoves(newMoves);
            setCurrentPlayer(newCurrentPlayer);
            setCurrentMove("");
            
            if (gameStatus === "over") {
              setGameOver(true);
              setGameResult(newResult || "");
            }
          }
        } catch (error) {
          console.error("Error processing storage event:", error);
        }
      } else if (e.key === 'chessColorLocked') {
        setColorLocked(e.newValue === 'true');
      } else if (e.key === 'chessSinglePlayerMode') {
        setSinglePlayerMode(e.newValue === 'true');
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Save game state to localStorage whenever it changes
  useEffect(() => {
    if (chess && moves && gameId) {
      const gameState = {
        fen: chess.fen(),
        moves: moves,
        currentPlayer: currentPlayer,
        gameId: gameId,
        gameStatus: gameOver ? "over" : "active",
        gameResult: gameResult
      };
      localStorage.setItem('chessGameState', JSON.stringify(gameState));
    }
  }, [chess, moves, currentPlayer, gameId, gameOver, gameResult]);

  // Save color locked state whenever it changes
  useEffect(() => {
    localStorage.setItem('chessColorLocked', colorLocked);
  }, [colorLocked]);

  // Save single player mode whenever it changes
  useEffect(() => {
    localStorage.setItem('chessSinglePlayerMode', singlePlayerMode);
  }, [singlePlayerMode]);

  // Find all possible source squares for a piece that can move to a target square
  const findPossibleSourceSquares = (piece, targetSquare) => {
    const moves = chess.moves({ verbose: true });
    return moves
      .filter(move => 
        move.piece.toUpperCase() === piece && 
        move.to === targetSquare && 
        !move.promotion)
      .map(move => move.from);
  };

  // Determine if a move needs disambiguation and what form it should take
  const getDisambiguationNotation = (piece, sourceSquares, selectedSource) => {
    if (sourceSquares.length <= 1) {
      return '';
    }
    
    // Check if pieces are on the same rank
    const sameRank = sourceSquares.some(sq => 
      sq !== selectedSource && sq.charAt(1) === selectedSource.charAt(1)
    );
    
    // Check if pieces are on the same file
    const sameFile = sourceSquares.some(sq => 
      sq !== selectedSource && sq.charAt(0) === selectedSource.charAt(0)
    );
    
    // If pieces are on different ranks and files, prefer file disambiguation
    if (!sameRank && !sameFile) {
      return selectedSource.charAt(0);
    }
    
    // If pieces are on the same file but different ranks, use rank
    if (sameFile) {
      return selectedSource.charAt(1);
    }
    
    // If pieces are on the same rank but different files, use file
    if (sameRank) {
      return selectedSource.charAt(0);
    }
    
    // If pieces are on the same rank and file (shouldn't happen in chess)
    // but just in case, return the full source square
    return selectedSource;
  };

  const formatProperNotation = (moveObject) => {
    if (!moveObject) return null;
    
    // Handle castling
    if (moveObject.san === 'O-O' || moveObject.san === 'O-O-O') {
      return moveObject.san;
    }
    
    const piece = moveObject.piece.toUpperCase();
    const capture = moveObject.flags.includes('c') ? 'x' : '';
    const targetSquare = moveObject.to;
    
    // For pawns captures, we need the starting file
    if (piece === 'P' && capture) {
      return moveObject.from.charAt(0) + capture + targetSquare + (moveObject.promotion ? '=' + moveObject.promotion.toUpperCase() : '');
    }
    
    // For simple pawn moves
    if (piece === 'P' && !capture) {
      return targetSquare + (moveObject.promotion ? '=' + moveObject.promotion.toUpperCase() : '');
    }
    
    // For pieces, we may need disambiguation
    const possibleSources = findPossibleSourceSquares(piece, targetSquare);
    const disambiguation = getDisambiguationNotation(piece, possibleSources, moveObject.from);
    
    // Don't include piece symbol for pawns
    const pieceSymbol = piece === 'P' ? '' : piece;
    
    let notation = pieceSymbol + disambiguation + capture + targetSquare;
    
    // Add promotion if necessary
    if (moveObject.promotion) {
      notation += '=' + moveObject.promotion.toUpperCase();
    }
    
    // Add check or checkmate
    if (moveObject.san.includes('+')) {
      notation += '+';
    } else if (moveObject.san.includes('#')) {
      notation += '#';
    }
    
    return notation;
  };

  const validateMove = (moveString) => {
    const tempChess = new Chess(chess.fen());
    
    try {
      // Try to execute the move using sloppy parsing (more permissive)
      const moveResult = tempChess.move(moveString, { sloppy: true });
      
      if (!moveResult) {
        return { valid: false, message: "Illegal move!", corrected: null };
      }
      
      // Generate the correct notation for this move
      const properNotation = formatProperNotation(moveResult);
      
      // If the provided notation is correct, return valid
      if (moveString === properNotation) {
        return { valid: true, move: moveResult };
      }
      
      // Determine what's missing or incorrect
      let message = "Notation needs correction";
      
      if (moveResult.san.includes('x') && !moveString.includes('x')) {
        message = "Missing capture notation 'x'";
      } else if (moveResult.san.includes('+') && !moveString.includes('+')) {
        message = "Missing check notation '+'";
      } else if (moveResult.san.includes('#') && !moveString.includes('#')) {
        message = "Missing checkmate notation '#'";
      } else if ((moveResult.san === "O-O" && moveString !== "O-O") || 
               (moveResult.san === "O-O-O" && moveString !== "O-O-O")) {
        message = "Incorrect castling notation";
      } else if (moveResult.san.includes('=') && !moveString.includes('=')) {
        message = "Missing promotion notation '='";
      } else if (properNotation.length !== moveString.length) {
        // This might be a disambiguation issue
        message = "Ambiguous move needs clarification";
      }
      
      return { 
        valid: false, 
        message: message, 
        corrected: properNotation 
      };
      
    } catch (e) {
      console.error("Move error:", e);
      return { valid: false, message: "Invalid move!", corrected: null };
    }
  };

  const handleKeyPress = (key) => {
    if (gameOver) return;
    
    if (!singlePlayerMode && playerColor !== currentPlayer) {
      setErrorMessage("Wait for your opponent's move!");
      setTimeout(() => setErrorMessage(""), 2500);
      return;
    }

    if (key === "Enter") {
      if (currentMove.trim() !== "") {
        const validation = validateMove(currentMove);
        
        if (validation.valid) {
          const validMove = chess.move(currentMove);
          const newMoves = [...moves];
          
          if (newMoves.length === 0 || newMoves[newMoves.length - 1].length === 2) {
            newMoves.push([currentMove]);
          } else {
            newMoves[newMoves.length - 1].push(currentMove);
          }

          setMoves(newMoves);
          setCurrentPlayer(currentPlayer === "white" ? "black" : "white");
          
          if (chess.isCheckmate()) {
            setGameOver(true);
            setGameResult(currentPlayer === "white" ? "1-0" : "0-1");
          } else if (chess.isDraw()) {
            setGameOver(true);
            setGameResult("1/2-1/2");
          }
          
          setCurrentMove("");
          setSuggestedCorrection("");
        } else {
          setErrorMessage(validation.message);
          
          if (validation.corrected) {
            setSuggestedCorrection(validation.corrected);
            setTimeout(() => {
              setCurrentMove(validation.corrected);
              setSuggestedCorrection("");
            }, 2000);
          }
          
          setTimeout(() => {
            setErrorMessage("");
          }, 2500);
        }
      }
    } else if (key === "Backspace") {
      setCurrentMove((prev) => prev.slice(0, -1));
      setSuggestedCorrection("");
    } else {
      setCurrentMove((prev) => prev + key);
    }
  };

  const deleteLastMove = () => {
    if (moves.length === 0) return;
    
    // Only allow deleting your own last move when not in single player mode
    if (!singlePlayerMode) {
      const lastMoveColor = currentPlayer === "white" ? "black" : "white";
      if (lastMoveColor !== playerColor) {
        setErrorMessage("You can only take back your own move!");
        setTimeout(() => setErrorMessage(""), 2500);
        return;
      }
    }
    
    const newMoves = [...moves];
    chess.undo();
    
    if (newMoves[newMoves.length - 1].length === 2) {
      newMoves[newMoves.length - 1].pop();
      setCurrentPlayer("black");
    } else {
      newMoves.pop();
      setCurrentPlayer("white");
    }
    
    if (gameOver) {
      setGameOver(false);
      setGameResult("");
    }
    
    setMoves(newMoves);
  };

  const selectColor = (color) => {
    // No restrictions on color selection
    localStorage.setItem('chessPlayerColor', color);
    setPlayerColor(color);
    setShowColorSelector(false);
  };

  const requestColorChange = () => {
    if (colorLocked) {
      setErrorMessage("Color changes are locked until the game is reset!");
      setTimeout(() => setErrorMessage(""), 2500);
      return;
    }
    setShowColorSelector(true);
  };

  const toggleColorLock = () => {
    const newLockedState = !colorLocked;
    setColorLocked(newLockedState);
    localStorage.setItem('chessColorLocked', newLockedState);
    
    setErrorMessage(newLockedState 
      ? "Colors are now locked until the game is reset!" 
      : "Colors can now be changed again!");
    setTimeout(() => setErrorMessage(""), 2500);
  };

  const toggleSinglePlayerMode = () => {
    const newMode = !singlePlayerMode;
    setSinglePlayerMode(newMode);
    localStorage.setItem('chessSinglePlayerMode', newMode);
    
    setErrorMessage(newMode 
      ? "Single-player mode enabled - you can record moves for both sides!" 
      : "Two-player mode enabled!");
    setTimeout(() => setErrorMessage(""), 2500);
  };

  const resetGame = () => {
    if (confirm("Are you sure you want to reset the game? This will affect both players.")) {
      const newChess = new Chess();
      setMoves([]);
      setCurrentMove("");
      setGameOver(false);
      setGameResult("");
      setErrorMessage("");
      setSuggestedCorrection("");
      setChess(newChess);
      setCurrentPlayer("white");
      setColorLocked(false);
      localStorage.setItem('chessColorLocked', false);
      
      // Generate a new game ID
      const newGameId = `game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      setGameId(newGameId);
      localStorage.setItem('chessGameId', newGameId);
      
      // Clear game state but keep player color
      localStorage.removeItem('chessGameState');
      
      // If the player wants to change color too, show the selector
      if (confirm("Do you want to change your color as well?")) {
        localStorage.removeItem('chessPlayerColor');
        setShowColorSelector(true);
      }
    }
  };

  const offerDraw = () => {
    if (gameOver) return;
    
    if (confirm("Offer a draw to your opponent?")) {
      if (confirm("Does your opponent accept the draw offer?")) {
        setGameOver(true);
        setGameResult("1/2-1/2");
        setErrorMessage("Game ended by agreement: Draw");
        setTimeout(() => setErrorMessage(""), 2500);
      } else {
        setErrorMessage("Draw offer declined");
        setTimeout(() => setErrorMessage(""), 2500);
      }
    }
  };

  const resignGame = () => {
    if (gameOver) return;
    
    if (!singlePlayerMode && confirm("Are you sure you want to resign?")) {
      setGameOver(true);
      setGameResult(playerColor === "white" ? "0-1" : "1-0");
      setErrorMessage(`${playerColor} resigns. ${playerColor === "white" ? "Black" : "White"} wins!`);
      setTimeout(() => setErrorMessage(""), 3500);
    } else if (singlePlayerMode && confirm("Which player is resigning?")) {
      const resigningColor = confirm("Is white resigning? (Cancel for black)") ? "white" : "black";
      setGameOver(true);
      setGameResult(resigningColor === "white" ? "0-1" : "1-0");
      setErrorMessage(`${resigningColor} resigns. ${resigningColor === "white" ? "Black" : "White"} wins!`);
      setTimeout(() => setErrorMessage(""), 3500);
    }
  };

  const copyGameLink = () => {
    // Create a shareable link with the game ID
    const gameLink = `${window.location.origin}${window.location.pathname}?gameId=${gameId}`;
    navigator.clipboard.writeText(gameLink)
      .then(() => {
        setErrorMessage("Game link copied to clipboard!");
        setTimeout(() => setErrorMessage(""), 2500);
      })
      .catch(err => {
        console.error('Failed to copy: ', err);
        setErrorMessage("Failed to copy game link!");
        setTimeout(() => setErrorMessage(""), 2500);
      });
  };

  // Join game via URL parameter
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlGameId = params.get('gameId');
    
    if (urlGameId && urlGameId !== gameId) {
      if (confirm("Join the shared game?")) {
        setGameId(urlGameId);
        localStorage.setItem('chessGameId', urlGameId);
        localStorage.removeItem('chessPlayerColor');
        setShowColorSelector(true);
        
        // Try to load the game state if it exists
        const existingGame = localStorage.getItem('chessGameState');
        if (existingGame) {
          try {
            const { fen, moves: savedMoves, currentPlayer: savedCurrentPlayer, gameId: storedGameId, gameStatus, gameResult: savedResult } = JSON.parse(existingGame);
            if (storedGameId === urlGameId) {
              const newChess = new Chess(fen);
              setChess(newChess);
              setMoves(savedMoves);
              setCurrentPlayer(savedCurrentPlayer);
              
              if (gameStatus === "over") {
                setGameOver(true);
                setGameResult(savedResult || "");
              }
            }
          } catch (error) {
            console.error("Error loading shared game:", error);
          }
        }
      }
    }
  }, []);

  return (
    <div className="flex flex-col items-center p-4">
      <h1 className="text-2xl font-bold mb-4">Chess Notation Keyboard</h1>
      <div className="game-id mb-4">
        Game ID: <span className="font-mono">{gameId}</span>
        <button 
          onClick={copyGameLink} 
          className="ml-2 px-2 py-1 bg-blue-500 text-white rounded"
        >
          Share Game
        </button>
      </div>
      
      <div className="flex flex-row items-start space-x-8">
        {/* Player Section */}
        <div className="player-section">
          {showColorSelector ? (
            <div className="color-selector">
              <h3>Select Your Color</h3>
              <div className="color-options">
                <button 
                  className="color-btn bg-white" 
                  onClick={() => selectColor("white")}
                >
                  White
                </button>
                <button 
                  className="color-btn bg-black text-white" 
                  onClick={() => selectColor("black")}
                >
                  Black
                </button>
              </div>
            </div>
          ) : (
            <div className="player-indicator">
              <div>
                You are playing as: <span className={`font-bold ${playerColor === "white" ? "text-white" : "text-black"}`}>
                  {playerColor}
                </span>
              </div>
              <div className="current-turn">
                Current turn: <span className={`font-bold ${currentPlayer === "white" ? "text-white" : "text-black"}`}>
                  {currentPlayer}
                </span>
              </div>
              <div className="single-player-toggle mt-2">
                <label className="toggle-switch">
                  <input 
                    type="checkbox" 
                    checked={singlePlayerMode}
                    onChange={toggleSinglePlayerMode}
                  />
                  <span className="toggle-slider"></span>
                </label>
                <span className="ml-2">Single-player mode</span>
              </div>
              <button 
                onClick={requestColorChange}
                className="change-color-btn"
                disabled={colorLocked}
              >
                Change Color
              </button>
              <button 
                onClick={toggleColorLock}
                className={`color-lock-btn mt-2 ${colorLocked ? 'bg-red-500' : 'bg-green-500'}`}
              >
                {colorLocked ? 'Unlock Colors' : 'Lock Colors'}
              </button>
            </div>
          )}
        </div>

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
                  disabled={gameOver || (!singlePlayerMode && playerColor !== currentPlayer)}
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
                  disabled={gameOver || (!singlePlayerMode && playerColor !== currentPlayer)}
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
                  disabled={gameOver || (!singlePlayerMode && playerColor !== currentPlayer)}
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
                  disabled={(gameOver && key !== "Backspace") || (!singlePlayerMode && playerColor !== currentPlayer && key !== "Backspace")}
                >
                  {key}
                </button>
              ))}
            </div>
          </div>

          {/* Display Current Move */}
          <div className="current-input">
            Current Move: {currentMove}
            {gameOver && gameResult && <span className="ml-2 text-red-500">(Game Over: {gameResult})</span>}
            {suggestedCorrection && 
              <span className="ml-2 text-green-500">
                (Correcting to: {suggestedCorrection})
              </span>
            }
          </div>
          
          {/* Error Message */}
          {errorMessage && 
            <div className="error-message">
              {errorMessage}
            </div>
          }

          {/* Game Control Buttons */}
          <div className="control-buttons">
            <button onClick={deleteLastMove} className="control-btn bg-blue-500">
              Delete Last Move
            </button>
            <button onClick={offerDraw} className="control-btn bg-yellow-500" disabled={gameOver}>
              Draw (=)
            </button>
            <button onClick={resignGame} className="control-btn bg-red-500" disabled={gameOver}>
              Resign
            </button>
            <button onClick={resetGame} className="control-btn bg-gray-500">
              Reset Game
            </button>
          </div>
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
          {gameOver && gameResult && (
            <div className="game-result mt-2 font-bold">
              Result: {gameResult}
              {gameResult === "1-0" && " (White wins)"}
              {gameResult === "0-1" && " (Black wins)"}
              {gameResult === "1/2-1/2" && " (Draw)"}
            </div>
          )}
          
          {/* Current board position */}
          <div className="board-status mt-4">
            <div className="text-sm font-medium mb-2">Current Position:</div>
            <pre className="board-ascii">{chess.ascii()}</pre>
          </div>
        </div>
      </div>
    </div>
  );
}