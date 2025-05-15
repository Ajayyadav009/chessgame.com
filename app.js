const express = require("express");
const socket = require("socket.io");
const http = require("http");
const { Chess } = require("chess.js");
const path = require("path");

//  create another http server for socket and then link the http server with the express server and socket will handlke the http server

const app = express();
const server = http.createServer(app);
const io = socket(server);

const chess = new Chess();
let players = {};
let currentPlayer = "W";

app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));

app.get("/", function (req, res) {
  res.render("index", { title: "Chess game" });
});

io.on("connection", function (uniquesocket) {
  console.log("Connected");

  if (!players.white) {
    players.white = uniquesocket.id;
    uniquesocket.emit("playerRole", "w");
  } else if (!players.black) {
    players.black = uniquesocket.id;
    uniquesocket.emit("playerRole", "b");
  } else {
    uniquesocket.emit("spectatorRole");
  }
  uniquesocket.on("disconnect", function () {
    if (uniquesocket.id === players.white) {
      delete players.white;
    } 
    else if (uniquesocket.id === players.black) {
      delete players.black;
    }
  });
  uniquesocket.on("move", function(move){
    try{
      if(chess.turn === 'W' && uniquesocket.id !== players.white) return;
      if(chess.turn === 'b' && uniquesocket.id !== players.black) return;

    const result = chess.move(move);
     if(result){
      currentPlayer = chess.turn();
      io.emit("move", move);
      io.emit("boardState", chess.fen());

     }
     else{
      console.log("Invalid move:", move);
      uniquesocket.emit("Invalid move", move);
     }
  }
    catch(err){
      console.log(err);
      uniquesocket.emit("Invalid moce", move);

    }
  })
});
server.listen(3000, function (req, res) {
  console.log("Server is running");
});
