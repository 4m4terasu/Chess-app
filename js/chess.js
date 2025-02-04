/* js/chess.js */

// Initial board layout (lowercase for black, uppercase for white)
const initialBoard = [
    ["r", "n", "b", "q", "k", "b", "n", "r"],
    ["p", "p", "p", "p", "p", "p", "p", "p"],
    ["",  "",  "",  "",  "",  "",  "",  "" ],
    ["",  "",  "",  "",  "",  "",  "",  "" ],
    ["",  "",  "",  "",  "",  "",  "",  "" ],
    ["",  "",  "",  "",  "",  "",  "",  "" ],
    ["P", "P", "P", "P", "P", "P", "P", "P"],
    ["R", "N", "B", "Q", "K", "B", "N", "R"]
  ];
  
  // Mapping pieces to Unicode chess symbols
  const pieceSymbols = {
    "r": "♜", "n": "♞", "b": "♝", "q": "♛", "k": "♚", "p": "♟",
    "R": "♖", "N": "♘", "B": "♗", "Q": "♕", "K": "♔", "P": "♙"
  };
  
  // Global board state (deep copy of initial layout)
  let boardState = JSON.parse(JSON.stringify(initialBoard));
  