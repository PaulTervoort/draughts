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
  console.log("Connection state: " + ws.readyState);
  ws.send("StartGame");
  ws.close();
  console.log("Connection state: " + ws.readyState);

  ws.on("message", function incoming(message) {
      console.log("[LOG] " + message);
  });
});

server.listen(port);


var games = [];
var finishedGames = 0;

var game = function(gameID) 
{
  this.id = gameID;
  this.players = [null, null];
  this.turn = 0;
  if(Math.random() > 0.5) { turn = 1; }
};