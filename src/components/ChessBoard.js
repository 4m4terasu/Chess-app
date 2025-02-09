import React, { useState, useEffect, useRef } from 'react';
import { initialBoard, pieceSymbols } from '../utils/chess';
import { isValidMove, isGameOver, isKingInCheck } from '../utils/chessLogic';
import './ChessBoard.css';

const promotionOptions = ["q", "r", "b", "n"];

const ChessBoard = () => {
  // Load persisted state from localStorage or use defaults.
  const [board, setBoard] = useState(() => {
    const saved = localStorage.getItem('chessBoard');
    return saved ? JSON.parse(saved) : initialBoard;
  });
  const [turn, setTurn] = useState(() => {
    const saved = localStorage.getItem('chessTurn');
    return saved ? JSON.parse(saved) : "white";
  });
  const [gameOver, setGameOver] = useState(() => {
    const saved = localStorage.getItem('chessGameOver');
    return saved ? JSON.parse(saved) : false;
  });
  const [gameMessage, setGameMessage] = useState(() => {
    const saved = localStorage.getItem('chessGameMessage');
    return saved ? JSON.parse(saved) : "";
  });
  const [promotion, setPromotion] = useState(() => {
    const saved = localStorage.getItem('chessPromotion');
    return saved ? JSON.parse(saved) : null;
  });
  const [flipBoard, setFlipBoard] = useState(() => {
    const saved = localStorage.getItem('chessFlipBoard');
    return saved ? JSON.parse(saved) : false;
  });
  const [history, setHistory] = useState(() => {
    const saved = localStorage.getItem('chessHistory');
    return saved ? JSON.parse(saved) : [];
  });
  const [selectedCell, setSelectedCell] = useState(null);
  const [availableMoves, setAvailableMoves] = useState([]);
  const [showRestartConfirm, setShowRestartConfirm] = useState(false);

  // Audio refs for sound effects.
  const moveCheckSoundRef = useRef(new Audio('/sounds/move-check.mp3'));
  const moveSelfSoundRef = useRef(new Audio('/sounds/move-self.mp3'));
  const captureSoundRef = useRef(new Audio('/sounds/capture.mp3'));
  const castleSoundRef = useRef(new Audio('/sounds/castle.mp3'));
  const promotionSoundRef = useRef(new Audio('/sounds/promotion.mp3'));
  const notifySoundRef = useRef(new Audio('/sounds/notify.mp3'));

  // Persist game state to localStorage.
  useEffect(() => {
    localStorage.setItem('chessBoard', JSON.stringify(board));
    localStorage.setItem('chessTurn', JSON.stringify(turn));
    localStorage.setItem('chessGameOver', JSON.stringify(gameOver));
    localStorage.setItem('chessGameMessage', JSON.stringify(gameMessage));
    localStorage.setItem('chessPromotion', JSON.stringify(promotion));
    localStorage.setItem('chessFlipBoard', JSON.stringify(flipBoard));
    localStorage.setItem('chessHistory', JSON.stringify(history));
  }, [board, turn, gameOver, gameMessage, promotion, flipBoard, history]);

  // Helper: Play sound if available.
  const playSound = (soundRef) => {
    if (soundRef.current && soundRef.current.src) {
      if (soundRef.current.error) return;
      try {
        soundRef.current.currentTime = 0;
        soundRef.current.play().catch(err => console.error("Audio play error:", err));
      } catch (err) {
        console.error("Audio playback error:", err);
      }
    }
  };

  // Compute available moves when a piece is selected.
  useEffect(() => {
    if (selectedCell) {
      const moves = [];
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          if (isValidMove(board, selectedCell, { row: r, col: c }, turn, [])) {
            moves.push({ row: r, col: c });
          }
        }
      }
      setAvailableMoves(moves);
    } else {
      setAvailableMoves([]);
    }
  }, [selectedCell, board, turn]);

  // Check game status.
  useEffect(() => {
    if (isGameOver(board, turn)) {
      if (isKingInCheck(board, turn)) {
        const winner = turn === "white" ? "Black" : "White";
        setGameMessage(`Checkmate! ${winner} wins!`);
      } else {
        setGameMessage("Stalemate! It's a draw!");
      }
      playSound(notifySoundRef);
      setGameOver(true);
    }
  }, [board, turn]);

  // Transform displayed coordinates to board coordinates if flipped.
  const transformCoordinates = (row, col) => {
    if (!flipBoard) return { row, col };
    return { row: 7 - row, col };
  };

  // Utilities for move notation.
  const fileLetter = (col) => String.fromCharCode(97 + col);
  const rankNumber = (row) => 8 - row;
  const recordMove = (from, to, movingPiece, isCapture, isCastle = false) => {
    let moveStr = "";
    if (isCastle) {
      moveStr = to.col > from.col ? "O-O" : "O-O-O";
    } else {
      if (movingPiece.toLowerCase() !== "p") {
        moveStr += movingPiece.toUpperCase();
      }
      if (isCapture && movingPiece.toLowerCase() === "p") {
        moveStr += fileLetter(from.col) + "x";
      } else if (isCapture) {
        moveStr += "x";
      }
      moveStr += fileLetter(to.col) + rankNumber(to.row);
    }
    const newBoard = board.map(r => r.slice());
    newBoard[to.row][to.col] = movingPiece;
    newBoard[from.row][from.col] = "";
    if (isKingInCheck(newBoard, turn === "white" ? "black" : "white")) {
      moveStr += "+";
    }
    return moveStr;
  };

  // Click handler for moves.
  const handleCellClick = (displayRow, displayCol) => {
    if (gameOver || promotion || showRestartConfirm) return;
    const { row, col } = transformCoordinates(displayRow, displayCol);
    if (selectedCell && availableMoves.some(move => move.row === row && move.col === col)) {
      const newBoard = board.map(r => [...r]);
      const movingPiece = board[selectedCell.row][selectedCell.col];
      newBoard[selectedCell.row][selectedCell.col] = "";
      const isCapture = newBoard[row][col] !== "";
      let isCastle = false;
      if (movingPiece.toLowerCase() === "k" && Math.abs(col - selectedCell.col) === 2) {
        isCastle = true;
        if (col > selectedCell.col) {
          newBoard[selectedCell.row][7] = "";
          newBoard[selectedCell.row][5] = turn === "white" ? "R" : "r";
        } else {
          newBoard[selectedCell.row][0] = "";
          newBoard[selectedCell.row][3] = turn === "white" ? "R" : "r";
        }
      }
      if (movingPiece.toLowerCase() === "p" && ((turn === "white" && row === 0) || (turn === "black" && row === 7))) {
        newBoard[row][col] = movingPiece;
        setPromotion({ row, col, color: turn, piece: movingPiece });
        setHistory(prev => [...prev, recordMove(selectedCell, { row, col }, movingPiece, isCapture, isCastle)]);
      } else {
        newBoard[row][col] = movingPiece;
        setHistory(prev => [...prev, recordMove(selectedCell, { row, col }, movingPiece, isCapture, isCastle)]);
      }
      if (isCastle) {
        playSound(castleSoundRef);
      } else if (isCapture) {
        playSound(captureSoundRef);
      } else {
        const nextTurn = turn === "white" ? "black" : "white";
        if (isKingInCheck(newBoard, nextTurn)) {
          playSound(moveCheckSoundRef);
        } else {
          playSound(moveSelfSoundRef);
        }
      }
      setBoard(newBoard);
      if (!(movingPiece.toLowerCase() === "p" && ((turn === "white" && row === 0) || (turn === "black" && row === 7)))) {
        setTurn(turn === "white" ? "black" : "white");
      }
      setSelectedCell(null);
      return;
    }
    if (!selectedCell) {
      if (board[row][col] !== "") {
        setSelectedCell({ row, col });
      }
      return;
    }
    if (
      board[row][col] !== "" &&
      ((turn === "white" && board[row][col] === board[row][col].toUpperCase()) ||
       (turn === "black" && board[row][col] === board[row][col].toLowerCase()))
    ) {
      setSelectedCell({ row, col });
      return;
    }
    setSelectedCell(null);
  };

  const handlePromotionChoice = (choice) => {
    const newBoard = board.map(r => [...r]);
    const { row, col, color } = promotion;
    const promotedPiece = color === "white" ? choice.toUpperCase() : choice.toLowerCase();
    newBoard[row][col] = promotedPiece;
    playSound(promotionSoundRef);
    setBoard(newBoard);
    setPromotion(null);
    setTurn(turn === "white" ? "black" : "white");
  };

  const handleRestart = () => {
    setShowRestartConfirm(true);
    playSound(notifySoundRef);
  };

  const confirmRestart = (confirm) => {
    if (confirm) {
      setBoard(initialBoard);
      setTurn("white");
      setSelectedCell(null);
      setAvailableMoves([]);
      setGameOver(false);
      setGameMessage("");
      setPromotion(null);
      setHistory([]);
    }
    setShowRestartConfirm(false);
  };

  const handleSwitchSide = () => {
    setFlipBoard(!flipBoard);
  };

  const exportPGN = () => {
    const pgn = history.join(" ");
    navigator.clipboard.writeText(pgn).then(() => {
      alert("PGN copied to clipboard:\n" + pgn);
    }).catch(() => {
      alert("Failed to copy PGN.");
    });
  };

  return (
    <div className="main-container">
      <div className="board-container">
        <div className="controls">
          <button onClick={handleRestart}>Restart Match</button>
          <button onClick={handleSwitchSide}>Switch Side</button>
        </div>
        <div className="chess-board">
          {flipBoard
            ? [...board].reverse().map((rowData, displayRow) =>
                rowData.map((cellData, displayCol) => {
                  const { row, col } = { row: 7 - displayRow, col: displayCol };
                  const isLight = (row + col) % 2 === 0;
                  let cellClass = `cell ${isLight ? 'light' : 'dark'}`;
                  if (selectedCell && selectedCell.row === row && selectedCell.col === col) {
                    cellClass += " selected";
                  }
                  if (availableMoves.some(move => move.row === row && move.col === col)) {
                    cellClass += " available";
                  }
                  return (
                    <div
                      key={`${row}-${col}`}
                      className={cellClass}
                      onClick={() => handleCellClick(displayRow, displayCol)}
                    >
                      {cellData && (
                        <span
                          className={cellData === cellData.toUpperCase() ? "white-piece" : "black-piece"}
                        >
                          {pieceSymbols[cellData]}
                        </span>
                      )}
                    </div>
                  );
                })
              )
            : board.map((rowData, displayRow) =>
                rowData.map((cellData, displayCol) => {
                  const { row, col } = { row: displayRow, col: displayCol };
                  const isLight = (row + col) % 2 === 0;
                  let cellClass = `cell ${isLight ? 'light' : 'dark'}`;
                  if (selectedCell && selectedCell.row === row && selectedCell.col === col) {
                    cellClass += " selected";
                  }
                  if (availableMoves.some(move => move.row === row && move.col === col)) {
                    cellClass += " available";
                  }
                  return (
                    <div
                      key={`${row}-${col}`}
                      className={cellClass}
                      onClick={() => handleCellClick(displayRow, displayCol)}
                    >
                      {cellData && (
                        <span
                          className={cellData === cellData.toUpperCase() ? "white-piece" : "black-piece"}
                        >
                          {pieceSymbols[cellData]}
                        </span>
                      )}
                    </div>
                  );
                })
              )}
        </div>
        <div className="status">
          {!gameOver ? (
            <p>Turn: {turn.charAt(0).toUpperCase() + turn.slice(1)}</p>
          ) : (
            <div>
              <p>{gameMessage}</p>
            </div>
          )}
        </div>
      </div>
      <button onClick={exportPGN} className="export-btn">Export PGN</button>
      <div className="history-panel">
        <h3>Move History</h3>
        <div className="history-list">
          {history.map((move, index) => (
            <div key={index} className="history-move">
              {index + 1}. {move}
            </div>
          ))}
        </div>
      </div>

      {promotion && (
        <div className="promotion-modal">
          <div className="promotion-content">
            <p>Promote Pawn:</p>
            {promotionOptions.map((option) => (
              <button key={option} onClick={() => handlePromotionChoice(option)}>
                {pieceSymbols[promotion.color === "white" ? option.toUpperCase() : option.toLowerCase()]}
              </button>
            ))}
          </div>
        </div>
      )}

      {showRestartConfirm && (
        <div className="confirm-modal">
          <div className="confirm-content">
            <p>Are you sure you want to restart the match?</p>
            <button onClick={() => confirmRestart(true)}>Yes</button>
            <button onClick={() => confirmRestart(false)}>No</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChessBoard;
