const socket = io(); //connect to the socket server

// socket.emit("cookie")
// socket.on("cookie bits", () => {
//     console.log("cookie bits event received"); //log when the churan paapdi event is received
// }); //use this to test the socket connection

const chess = new Chess(); //create a new chess game instance
const boardElement = document.querySelector(".chessboard"); //get the board element from the HTML

let draggedPiece = null; //variable to store the dragged piece
let sourceSquare = null; //variable to store the source square
let playerRole = null; //variable to store the player role

const renderBoard = () => { //function to render the chess board

    const board = chess.board(); //render the chess board
    boardElement.innerHTML = ""; //clear the board element for any previous board
    
    board.forEach((row, rowIndex) => { //loop through each row of the board
        row.forEach((square, squareIndex) => { //loop through each square of the row
            
            const squareElement = document.createElement("div"); //create a new div element for the square
            squareElement.classList.add("square", //add the square class to the div element
                (rowIndex + squareIndex) % 2 === 0 ? "light" : "dark" //add the light or dark class to the square element
            ); 

            squareElement.dataset.row = rowIndex; //set the row index as a data attribute of the square element
            squareElement.dataset.col = squareIndex; //set the column index as a data attribute of the square element

            if(square) { //if the square is not empty
                const pieceElement = document.createElement("div"); //create a new div element for the piece
                pieceElement.classList.add("piece", square.color === "w" ? "white" : "black"); //add the piece class and color class to the piece element
                
                pieceElement.innerText = getPieceUnicode(square); //set the inner HTML of the piece element to the unicode of the piece
                pieceElement.draggable = playerRole === square.color; //set the draggable attribute of the piece element based on the player role
                
                pieceElement.addEventListener("dragstart", (e) => { //add an event listener for the dragstart event
                    if(pieceElement.draggable) { //if the piece is draggable
                        draggedPiece = pieceElement; //set the dragged piece to the piece element
                        sourceSquare = {row: rowIndex, col: squareIndex}; //set the source square to the square element
                        e.dataTransfer.setData("text/plain", ""); //set the data transfer object to an empty string to allow dragging
                    }
                });

                pieceElement.addEventListener("dragend", (e) => { //add an event listener for the dragend event
                    draggedPiece = null; //set the dragged piece to null
                    sourceSquare = null; //set the source square to null
                });

                squareElement.appendChild(pieceElement); //append the piece element to the square element
            };

            squareElement.addEventListener("dragover", (e) => { //add an event listener for the dragover event
                e.preventDefault(); //prevent the default behavior of the dragover event
            });

            squareElement.addEventListener("drop", (e) => { //add an event listener for the drop event
                e.preventDefault(); //prevent the default behavior of the drop event
                if(draggedPiece){
                    const targetSquare = {row: parseInt(squareElement.dataset.row),col: parseInt(squareElement.dataset.col)}; //get the target square from the data attributes of the square element
                    handleMove(sourceSquare, targetSquare); //call the handleMove function to handle the move of the piece
                }
        });
        boardElement.appendChild(squareElement); //append the square element to the board element
    });
}); 

    if(playerRole === "b"){
        boardElement.classList.add("flipped"); //add the flipped class to the board element if the player is black
    }else{
        boardElement.classList.remove("flipped"); //remove the flipped class from the board element if the player is white
    }
};

const handleMove = (sourceSquare, targetSquare) => { //function to handle the move of a piece
    const move = {
        from: `${String.fromCharCode(97+sourceSquare.col)}${8-sourceSquare.row}`, //convert the source square to algebraic notation
        to: `${String.fromCharCode(97+targetSquare.col)}${8-targetSquare.row}`, //convert the target square to algebraic notation
        promotion: "q" //promote the piece to a queen by default  
    };

    const moveResult = chess.move(move);
    if(moveResult) {
        socket.emit("move", move); // valid move — send to server
        renderBoard(); // update board locally
    if (chess.game_over()) {
        alert("Game Over");
    }else if(chess.in_check()) {
        alert("Check!");
    }
} else {
    alert("Invalid Move!");
}

};

const getPieceUnicode = (piece) => { //function to get the unicode of a piece
    const unicodePieces = {
        "p": "♟",
        "r": "♜",
        "n": "♞",
        "b": "♝",
        "q": "♛",
        "k": "♚",
        "P": "♙",
        "R": "♖",
        "N": "♘",
        "B": "♗",
        "Q": "♕",
        "K": "♔"
    };

    return unicodePieces[piece.type] || ""; //return the unicode of the piece based on the type of the piece
};

socket.on("playerRole", (role) => { 
    playerRole = role; //set the player role to the role received from the server
    renderBoard();
});

socket.on("spectatorRole", () => {
    playerRole = null; //set the player role to the role received from the server
    renderBoard();
});

socket.on("boardState", (fen) => {
    chess.load(fen); //load the board state from the FEN string received from the server
    renderBoard(); //call the renderBoard function to render the chess board
});

socket.on("move", (move) => {
    chess.move(move); //move the piece on the board based on the move received from the server
    renderBoard(); //call the renderBoard function to render the chess board
})

renderBoard(); //call the renderBoard function to render the chess board