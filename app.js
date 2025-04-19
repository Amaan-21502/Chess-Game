const express = require('express');
const socket = require('socket.io');
const http = require('http');
const { Chess } = require('chess.js');
const path = require('path'); //import path module to resolve paths

const app = express();
const server = http.createServer(app);
const io = socket(server /*,{
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
}*/);

const chess = new Chess(); //contains the chess game logic

let players = {}; //contains the players and their socket ids
let currentPlayer = "w";

app.set('view engine', 'ejs'); //set the view engine to ejs
app.use(express.static(path.join(__dirname, 'public'))); //set the public folder to serve static files

app.get('/', (req, res) => {
    res.render('index', {title: "Chess Game"}); //render the index.ejs file
});

io.on('connection', (uniqueSocket) => {
    console.log('A user just connected'); //log when a user connects

    // uniqueSocket.on("churan", ()=> {
    //     console.log("cookie received"); //log when the churan event is received
    //     io.emit("cookie bits"); //emit the churan paapdi event to all connected clients
    // }) use this to test the socket connection

    if(!players.white){ //if there is no white player
        players.white = uniqueSocket.id; //assign the white player to the socket id
        uniqueSocket.emit("playerRole", "w"); //emit the player event to the white player
    }
    else if(!players.black){ //if there is no black player
        players.black = uniqueSocket.id; //assign the black player to the socket id
        uniqueSocket.emit("playerRole", "b"); //emit the player event to the black player
    }
    else{ //if there are already two players
        uniqueSocket.emit("spectatorRole"); //emit the spectator event to the spectator
        console.log("A spectator just connected"); //log when a spectator connects
    }

    uniqueSocket.on("disconnect", () => {
        if(uniqueSocket.id === players.white){ //if the white player disconnects
            delete players.white; //remove the white player from the players object
            console.log("White player disconnected"); //log when the white player disconnects
        }else if(uniqueSocket.id === players.black){ //if the black player disconnects
            delete players.black; //remove the black player from the players object
            console.log("Black player disconnected"); //log when the black player disconnects
        }else
        console.log('A spectator just disconnected'); //log when a user disconnects
    });

    uniqueSocket.on("move", (move) => { //when a move is made
        try {
            if(chess.turn() === "w" && uniqueSocket.id !== players.white)return; //if the turn is white and the player is not white
            if(chess.turn() === "b" && uniqueSocket.id !== players.black)return; //if the turn is black and the player is not black
        
            const result = chess.move(move); //make the move in the chess game
            
            if(result){ //if the move is valid
                currentPlayer = chess.turn(); //set the current player to the turn of the chess game
                io.emit("move", move); //emit the move event to all connected clients
                io.emit("boardState", chess.fen()); //emit the board state event to all connected clients
            }else{ //if the move is invalid
                uniqueSocket.emit("Invalid move: ", move); //emit the invalid move event to the player who made the invalid move
                console.log("Invalid move: ", move); //log the invalid move
            }
        } catch (error) {
            console.log(error); //log the error if there is an error
            uniqueSocket.emit("Invalid move: ", move); //emit the invalid move event to the player who made the invalid move
        }
    });
}); //end of the connection event

server.listen(3000, () => {
    console.log('Server is running on port 3000'); //log the server is running
});