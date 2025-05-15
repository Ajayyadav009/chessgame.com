const socket = io();
const chess = new Chess();
const boardElement = document.querySelector(".chessboard");

let draggedPiece = null;
let sourceSquare = null;
let playerRole = null;

// Function to render the chessboard
const renderBoard = function () {
    const board = chess.board();
    boardElement.innerHTML = "";
    board.forEach((row, rowIndex) => {
        row.forEach((square, squareIndex) => {
            const squareElement = document.createElement("div");
            squareElement.classList.add(
                "square",
                (rowIndex + squareIndex) % 2 === 0 ? "light" : "dark"
            );
            squareElement.dataset.row = rowIndex;
            squareElement.dataset.col = squareIndex;

            if (square) {
                const pieceElement = document.createElement("div");
                pieceElement.classList.add(
                    "piece",
                    square.color === "w" ? "white" : "black"
                );
                pieceElement.innerText = getPieceUnicode(square.type, square.color);
                pieceElement.draggable = playerRole === square.color;
                pieceElement.addEventListener("dragstart", (e) => {
                    if (pieceElement.draggable) {
                        draggedPiece = pieceElement;
                        sourceSquare = { row: rowIndex, col: squareIndex };
                        e.dataTransfer.setData("text/plain", "");
                    }
                });
                squareElement.appendChild(pieceElement);
            }

            squareElement.addEventListener("dragover", function (e) {
                e.preventDefault();
            });

            squareElement.addEventListener("drop", function () {
                if (draggedPiece) {
                    const targetSquare = {
                        row: parseInt(squareElement.dataset.row),
                        col: parseInt(squareElement.dataset.col),
                    };
                    handleMove(sourceSquare, targetSquare);
                }
            });

            boardElement.appendChild(squareElement);
        });
    });
    if(playerRole === 'b'){
        boardElement.classList.add("flipped");
    }
    else{
         boardElement.classList.remove("flipped");
    }
};

// Function to handle moves
const handleMove = function (source, target) {
    const sourceSquare = `${String.fromCharCode(97 + source.col)}${8 - source.row}`;
    const targetSquare = `${String.fromCharCode(97 + target.col)}${8 - target.row}`;
    const move = chess.move({ from: sourceSquare, to: targetSquare });

    if (move) {
        socket.emit("move", move);
        renderBoard();
    } else {
        alert("Invalid move!");
        renderBoard(); // Re-render to reset piece positions
    }

    // Reset drag state
    draggedPiece = null;
    sourceSquare = null;
};

// Function to get the Unicode character for a chess piece
const getPieceUnicode = function (type, color) {
    const pieces = {
        p: "\u265F",
        r: "\u265C",
        n: "\u265E",
        b: "\u265D",
        q: "\u265B",
        k: "\u265A",
    };
    return color === "w" ? pieces[type].toUpperCase() : pieces[type];
};

// Socket event listeners
socket.on("playerRole", (role) => {
    playerRole = role;
    renderBoard();
});

socket.on("spectatorRole", function(){
    playerRole = null;
    renderBoard();
});

socket.on("boardState", function(fen){
    chess.load(fen);
    renderBoard();
});

socket.on("move", (move) => {
    chess.move(move);
    renderBoard();
});

// Initial rendering of the board
renderBoard();