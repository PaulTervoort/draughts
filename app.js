var express = require("express");
var http = require("http");
const websocket = require("ws");


var port = process.argv[2];
var app = express();

app.get("/", function(req, res) 
{
  res.sendFile("splash.html", { root: "./public" });
});
app.get("/play", function(req, res) 
{
  res.sendFile("game.html", { root: "./public" });
});

app.use(express.static(__dirname + "/public"));
const server = http.createServer(app);


const wss = new websocket.Server({ server });

wss.on("connection", function (ws) 
{
  ws.gameID = startedGames;

  if(gameQueue == null)
  {
    gameQueue = new game(ws.gameID); 

    ws.playerID = 0;
    gameQueue.players[0] = ws;
  } 
  else 
  {
    ws.playerID = 1;
    gameQueue.players[1] = ws;

    games[startedGames] = gameQueue;
    startedGames++;
    gameQueue = null;

    let currentGame = games[ws.gameID];
    if(currentGame != null)
    {
      currentGame.players[0].send("StartGame;Player:0;Turn:" + currentGame.turn);
      currentGame.players[1].send("StartGame;Player:1;Turn:" + currentGame.turn);
    }
  }

  ws.on("message", function (message) 
  {
    let currentGame = games[ws.gameID];
    if(currentGame != null)
    {
      currentGame.players[(this.playerID + 1) % 2].send(message);

      if(message.startsWith("EndGame:"))
      {
        currentGame.players[0].close(1000);
        currentGame.players[1].close(1000);

        finishedGames++;
        delete games[ws.gameID];
      }
    }
  });
  
  ws.on("close", function(code) 
  {
    if(gameQueue != null && gameQueue.id == this.gameID)
    {
      gameQueue = null;
    }
    else if(code > 1000 && ws.gameID in games)
    {
      let otherPlayer = games[ws.gameID].players[(this.playerID + 1) % 2];
      if(otherPlayer != null)
      {
        otherPlayer.send("EndGame:ConnectionLost");
        otherPlayer.close(1000);
      }

      delete games[this.gameID];
    }
  });
});

server.listen(port);


var gameQueue = null;
var games = {};
var startedGames = 0;
var finishedGames = 0;

var game = function(gameID) 
{
  this.id = gameID;
  this.players = [null, null];
  this.turn = 0;
  if(Math.random() > 0.5) { this.turn = 1; }
};