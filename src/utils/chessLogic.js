export function isValidMove(board, from, to, turn, moveHistory, skipCheck = false) {
    const piece = board[from.row][from.col];
    if (!piece) return false; // No piece to move
  
    const isWhite = piece === piece.toUpperCase();
    const isBlack = !isWhite;
  
    // Ensure correct player turn: white pieces (uppercase) only move on white's turn, black (lowercase) on black's turn.
    if ((turn === "white" && !isWhite) || (turn === "black" && !isBlack)) {
      return false;
    }
  
    const targetPiece = board[to.row][to.col];
    const isCapture = targetPiece !== "";
  
    // Prevent capturing your own pieces.
    if (isCapture) {
      const targetIsWhite = targetPiece === targetPiece.toUpperCase();
      if ((isWhite && targetIsWhite) || (isBlack && !targetIsWhite)) {
        return false;
      }
    }
  
    // Prevent moves that leave your king in check.
    if (!skipCheck && wouldMoveCauseCheck(board, from, to, turn)) {
      return false;
    }
  
    const rowDiff = Math.abs(to.row - from.row);
    const colDiff = Math.abs(to.col - from.col);
  
    // ───────────── PAWN MOVEMENT ─────────────
    if (piece.toLowerCase() === "p") {
      const direction = isWhite ? -1 : 1;
      const startRow = isWhite ? 6 : 1;
  
      // Standard one-step forward.
      if (to.row === from.row + direction && to.col === from.col && !targetPiece) {
        return true;
      }
  
      // Double move from starting position.
      if (
        from.row === startRow &&
        to.row === from.row + 2 * direction &&
        to.col === from.col &&
        !board[to.row][to.col] &&
        !board[from.row + direction][to.col]
      ) {
        return true;
      }
  
      // Capture diagonally.
      if (to.row === from.row + direction && Math.abs(to.col - from.col) === 1 && isCapture) {
        return true;
      }
  
      // En passant capture.
      if (moveHistory.length > 0) {
        const lastMove = moveHistory[moveHistory.length - 1];
        if (lastMove.piece.toLowerCase() === "p" && Math.abs(lastMove.from.row - lastMove.to.row) === 2) {
          if (
            to.row === lastMove.to.row + direction &&
            Math.abs(to.col - from.col) === 1 &&
            to.col === lastMove.to.col
          ) {
            return true;
          }
        }
      }
    }
  
    // ───────────── ROOK MOVEMENT ─────────────
    if (piece.toLowerCase() === "r") {
      if (from.row === to.row) {
        for (let col = Math.min(from.col, to.col) + 1; col < Math.max(from.col, to.col); col++) {
          if (board[from.row][col]) return false;
        }
        return true;
      }
      if (from.col === to.col) {
        for (let row = Math.min(from.row, to.row) + 1; row < Math.max(from.row, to.row); row++) {
          if (board[row][from.col]) return false;
        }
        return true;
      }
    }
  
    // ───────────── KNIGHT MOVEMENT ─────────────
    if (piece.toLowerCase() === "n") {
      if ((rowDiff === 2 && colDiff === 1) || (rowDiff === 1 && colDiff === 2)) {
        return true;
      }
    }
  
    // ───────────── BISHOP MOVEMENT ─────────────
    if (piece.toLowerCase() === "b") {
      if (rowDiff === colDiff) {
        let rowStep = to.row > from.row ? 1 : -1;
        let colStep = to.col > from.col ? 1 : -1;
        let row = from.row + rowStep;
        let col = from.col + colStep;
        while (row !== to.row && col !== to.col) {
          if (board[row][col]) return false;
          row += rowStep;
          col += colStep;
        }
        return true;
      }
    }
  
    // ───────────── QUEEN MOVEMENT ─────────────
    if (piece.toLowerCase() === "q") {
      // Rook-like movement.
      if (from.row === to.row) {
        for (let col = Math.min(from.col, to.col) + 1; col < Math.max(from.col, to.col); col++) {
          if (board[from.row][col]) return false;
        }
        return true;
      }
      if (from.col === to.col) {
        for (let row = Math.min(from.row, to.row) + 1; row < Math.max(from.row, to.row); row++) {
          if (board[row][from.col]) return false;
        }
        return true;
      }
      // Bishop-like movement.
      if (Math.abs(to.row - from.row) === Math.abs(to.col - from.col)) {
        let rowStep = to.row > from.row ? 1 : -1;
        let colStep = to.col > from.col ? 1 : -1;
        let row = from.row + rowStep;
        let col = from.col + colStep;
        while (row !== to.row && col !== to.col) {
          if (board[row][col]) return false;
          row += rowStep;
          col += colStep;
        }
        return true;
      }
      return false;
    }
  
    // ───────────── KING MOVEMENT ─────────────
    if (piece.toLowerCase() === "k") {
      // Normal king move: one square in any direction.
      if (rowDiff <= 1 && colDiff <= 1) {
        return true;
      }
  
      // When simulating moves (skipCheck true), do not allow castling.
      if (skipCheck) return false;
  
      // Castling: King moves two squares horizontally.
      if (rowDiff === 0 && colDiff === 2) {
        // Check that king is in its starting square.
        if (turn === "white" && (from.row !== 7 || from.col !== 4)) return false;
        if (turn === "black" && (from.row !== 0 || from.col !== 4)) return false;
  
        // Determine the rook's column and verify that the rook is in its starting position.
        const rookCol = to.col > from.col ? 7 : 0;
        if (turn === "white") {
          if (to.col > from.col) {
            if (board[7][7] !== "R") return false;
          } else {
            if (board[7][0] !== "R") return false;
          }
        } else {
          if (to.col > from.col) {
            if (board[0][7] !== "r") return false;
          } else {
            if (board[0][0] !== "r") return false;
          }
        }
  
        // Check that the squares between the king and the rook are empty.
        let betweenCols;
        if (to.col > from.col) {
          betweenCols = [from.col + 1, from.col + 2];
        } else {
          betweenCols = [from.col - 1, from.col - 2, from.col - 3];
        }
        for (let col of betweenCols) {
          if (board[from.row][col]) return false;
        }
  
        // Ensure the king does not pass through or land on a square that is attacked.
        const step = to.col > from.col ? 1 : -1;
        for (let i = 0; i <= 2; i++) {
          const intermediateCol = from.col + i * step;
          const simulatedBoard = board.map(row => row.slice());
          simulatedBoard[from.row][intermediateCol] = piece;
          simulatedBoard[from.row][from.col] = "";
          if (isKingInCheck(simulatedBoard, turn)) return false;
        }
        return true;
      }
    }
  
    return false;
  }
  
  /**
   * Helper function: Simulate the move and check if it leaves the king in check.
   */
  function wouldMoveCauseCheck(board, from, to, turn) {
    const newBoard = board.map((row) => row.slice());
    newBoard[to.row][to.col] = newBoard[from.row][from.col];
    newBoard[from.row][from.col] = "";
    return isKingInCheck(newBoard, turn);
  }
  
  /**
   * Checks if the king of the given turn is in check.
   * When checking, we call isValidMove with skipCheck=true to avoid recursion.
   */
  export function isKingInCheck(board, turn) {
    let kingPosition = null;
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        if (board[row][col] === (turn === "white" ? "K" : "k")) {
          kingPosition = { row, col };
          break;
        }
      }
      if (kingPosition) break;
    }
    if (!kingPosition) return false;
  
    // Check if any opponent piece can attack the king.
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = board[row][col];
        if (
          piece &&
          isValidMove(
            board,
            { row, col },
            kingPosition,
            turn === "white" ? "black" : "white",
            [],
            true // Skip king safety check to prevent recursion.
          )
        ) {
          return true;
        }
      }
    }
    return false;
  }
  
  /**
   * Determines if the game is over (checkmate or stalemate).
   */
  export function isGameOver(board, turn) {
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        if (
          board[row][col] &&
          ((turn === "white" && board[row][col] === board[row][col].toUpperCase()) ||
            (turn === "black" && board[row][col] === board[row][col].toLowerCase()))
        ) {
          for (let targetRow = 0; targetRow < 8; targetRow++) {
            for (let targetCol = 0; targetCol < 8; targetCol++) {
              if (isValidMove(board, { row, col }, { row: targetRow, col: targetCol }, turn, [])) {
                return false;
              }
            }
          }
        }
      }
    }
    return true;
  }
  