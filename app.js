// Require
var express = require("express");
var http = require("http");
const websocket = require("ws");
const fs = require("fs");


// Load text containing the rules of the game
var rulesHTML = "";
fs.readFile("./views/rules_text.html", 'utf8', function(err, data) 
{
  if (err) throw err;
  rulesHTML = data;
});


// Set app
var port = process.argv[2];
var app = express();


// Routes and views
app.set('view engine', 'ejs')
app.get("/", function(req, res) 
{
  res.sendFile("splash.html", { root: "./public" });
});
app.get("/play", function(req, res) 
{
  res.render("game.ejs", { rulesText : rulesHTML});
});
app.get("/rules", function(req, res) 
{
  res.render("rules.ejs", { rulesText : rulesHTML});
});
app.use(express.static(__dirname + "/public"));
const server = http.createServer(app);

app.get("/getStats", function(req, res) {
  getStats(req, res);
})



// Websocket behaviour
const wss = new websocket.Server({ server });
wss.on("connection", function (ws) 
{
  // Unique game ID
  ws.gameID = startedGames;

  // Queue is empty: create new game
  if(gameQueue == null)
  {
    gameQueue = new game(ws.gameID); 

    ws.playerID = 0;
    gameQueue.players[0] = ws;
  } 
  // Queue is not empty: join game and start
  else 
  {
    ws.playerID = 1;
    gameQueue.players[1] = ws;

    games[startedGames] = gameQueue;
    startedGames++;
    gameQueue = null;

    // Start game
    let currentGame = games[ws.gameID];
    if(currentGame != null)
    {
      currentGame.players[0].send("StartGame;Player:0;Turn:" + currentGame.turn);
      currentGame.players[1].send("StartGame;Player:1;Turn:" + currentGame.turn);
    }
  }

  // Incoming message
  ws.on("message", function (message) 
  {
    // If this websocket is attached to a game
    let currentGame = games[ws.gameID];
    if(currentGame != null)
    {
      // Send message to opponent
      currentGame.players[(this.playerID + 1) % 2].send(message);

      // End game
      if(message.startsWith("EndGame:"))
      {
        currentGame.players[0].close(1000);
        currentGame.players[1].close(1000);

        finishedGames++;
        delete games[ws.gameID];
      }
    }
  });
  
  // Websocked closed
  ws.on("close", function(code) 
  {
    // If still in queue, reset queue
    if(gameQueue != null && gameQueue.id == this.gameID)
    {
      gameQueue = null;
    }
    // If game started, stop and remove game
    else if(code > 1000 && ws.gameID in games)
    {
      // Inform opponent
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

// start server
server.listen(port);


// Game data
var gameQueue = null;
var games = {};
var startedGames = 0;
var finishedGames = 0;

// Game datastructure
var game = function(gameID) 
{
  this.id = gameID;
  this.players = [null, null];
  this.turn = 0;
  if(Math.random() > 0.5) { this.turn = 1; }
};


var getStats = function(req, res) {
  var runningGames = Object.keys(games).length;
  var playerCount = (gameQueue == null?0:1) + runningGames*2;

  var gameStats = {
    runningGames: runningGames,
    finishedGames: finishedGames,
    playerCount: playerCount
  }

  res.send(gameStats);
}
