/* js/app.js */

document.addEventListener('DOMContentLoaded', () => {
    const boardElement = document.getElementById('chess-board');
    renderBoard(boardElement, boardState);
  
    boardElement.addEventListener('click', handleBoardClick);
  });
  
  function renderBoard(boardElement, board) {
    boardElement.innerHTML = ''; // Clear previous content
  
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const cell = document.createElement('div');
        cell.classList.add('cell');
        
        // Alternate cell colors: light if (row+col) is even, dark otherwise
        cell.classList.add((row + col) % 2 === 0 ? 'light' : 'dark');
        
        cell.dataset.row = row;
        cell.dataset.col = col;
        
        const piece = board[row][col];
        if (piece && pieceSymbols[piece]) {
          cell.innerText = pieceSymbols[piece];
        }
        
        boardElement.appendChild(cell);
      }
    }
  }
  
  let selectedCell = null;
  
  function handleBoardClick(event) {
    // Get the clicked cell (if click occurred inside a cell)
    const cell = event.target.closest('.cell');
    if (!cell) return;
  
    const row = parseInt(cell.dataset.row);
    const col = parseInt(cell.dataset.col);
  
    // If no piece is currently selected, select one if it contains a piece
    if (!selectedCell) {
      if (boardState[row][col] !== "") {
        selectedCell = { row, col };
        cell.classList.add('selected');
      }
    } else {
      // Move the piece from the selected cell to the clicked cell
      movePiece(selectedCell, { row, col });
      selectedCell = null;
      // Re-render board to update the new state
      const boardElement = document.getElementById('chess-board');
      renderBoard(boardElement, boardState);
    }
  }
  
  function movePiece(from, to) {
    // Basic move logic (without legal move validation)
    boardState[to.row][to.col] = boardState[from.row][from.col];
    boardState[from.row][from.col] = "";
  }
  