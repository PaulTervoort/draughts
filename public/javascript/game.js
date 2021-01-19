document.addEventListener("DOMContentLoaded", (event) => game());

function game()
{
    const messagePopUp = new popUp();
    const board = new gameBoard();

    const labelTurnPlayer = document.getElementById("TurnPlayer");
    const labelTurnOpponent = document.getElementById("TurnOpponent");
    const timeDisplay = document.getElementById("Time");

    const endTurnButton = document.getElementById("EndTurnButton");

    endTurnButton.onclick = function()
    {
        if(board.hasValidTurn())
        {
            socket.send("Move:" + board.getTurnString());

            disableTurn();
            board.disable();
        }
    };
    document.getElementById("RuleButton").onclick = function()
    {
        messagePopUp.showRulesPopUp();
    };


    const socket = new WebSocket("ws://" + window.location.hostname + ":6969");

    socket.onmessage = async function(event)
    {
        let message = event.data;
        if(message.startsWith("StartGame;"))
        {
            messagePopUp.startGamePopUp();

            timeDisplay.start = new Date().getTime();
            setInterval(function() 
            {
                let ms = new Date().getTime() - timeDisplay.start;
                timeDisplay.innerHTML = new Date(ms).toISOString().slice(12, 19);
            }, 1000);

            let playerID = parseInt(message.slice(17, 18));
            let turnPlayer = parseInt(message.slice(24, 25));

            if(playerID == turnPlayer)
            {
                board.enable();
            }
            else
            {
                disableTurn()
            }
        }
        else if(message.startsWith("EndGame:"))
        {
            messagePopUp.endGamePopUp(message.slice(8));
        }
        else if(message.startsWith("Move:"))
        {
            await board.executeOpponentMoveString(message.slice(5));

            if(board.hasOpponentWon())
            {
                socket.send("EndGame:Win");
                messagePopUp.endGamePopUp("Lose");
            }
            else
            {
                board.enable();
                enableTurn();
            }
        }
    };

    socket.onclose = function(event)
    {
        if(event.code > 1001)
        {
            messagePopUp.endGamePopUp("Connection");
        }
    };


    function enableTurn()
    {
        labelTurnPlayer.style.display = "inherit";
        labelTurnOpponent.style.display = "none";
        endTurnButton.disabled = false;
    }

    function disableTurn()
    {
        labelTurnPlayer.style.display = "none";
        labelTurnOpponent.style.display = "inherit";
        endTurnButton.disabled = true;
    }
}



function gameBoard()
{
    const board = new boardInterface();

    this.hasValidTurn = function() { return board.isValidMove(); }

    this.hasOpponentWon = function() { return board.getOpponentScore() >= 20; }

    this.getTurnString = function(){ return board.turnString(); }

    var enabled = false;
    this.enable = function()
    {
        if(!enabled)
        {
            enabled = true;
            board.clearMoves();
            enableMovablePieces();
        }
    }

    this.disable = function()
    {
        if(enabled)
        {
            enabled = false;
            lastPiece = null;

            for(let i = 0; i < 20; i++)
            {
                let piece = board.allies["a"+i];
                piece.possibleTurn = false;
                setPieceColor(piece, "Yellow");

                if(piece.newKing != null) { delete piece.newKing; }
            }
        }
    }

    this.executeOpponentMoveString = async function(string)
    {
        let splitString = string.split(":");
        let piece = board.opponents[splitString[0].replace("a", "o")];
        let moveString = splitString[1];
        if(piece != null && moveString != null)
        {
            var moves = moveString.split(";");
            for(let i = 0; i < moves.length; i++)
            {
                let moveParts = moves[i].split("-");
                if(moveParts[0].length == 5)
                {
                    let x = 9 - parseInt(moveParts[0][1]);
                    let y = 9 - parseInt(moveParts[0][3]);
                    piece.setPosition(x, y);
                }
                else if(moveParts[0] == "King")
                {
                    piece.king = true;
                    piece.src = "/Images/Spooky_King.png"
                }

                if(moveParts[1] != null && moveParts[1].startsWith("Kill="))
                {
                    board.killPiece(moveParts[1].slice(5).replace("o", "a"));
                }

                await delay(200);
            }
        }

        function delay(time)
        {
            return new Promise(resolve => { setTimeout(() => { resolve(); }, time); });
        }
    }

    var lastPiece = null;
    function pieceClick(piece)
    {
        if(enabled && piece.possibleTurn)
        {
            resetLastClick();

            piece.lastSrc = piece.src;
            setPieceColor(piece, "Red");
            lastPiece = piece;

            let moves = piece.moves;
            for(let i = 0; i < moves.collection.length; i++)
            {
                let currentMove = moves.collection[i];
                board.placeOptionDot(piece, currentMove.x, currentMove.y, currentMove)
            }
        }
    }

    function enableMovablePieces()
    {
        let maxImportance = 0;
        for(let i = 0; i < 20; i++)
        {
            let piece = board.allies["a"+i];
            if(piece.alive)
            {
                let importance = new validMovesCollection(piece).importance;
                if(importance > maxImportance) { maxImportance = importance; }   
            }
        }
        for(let i = 0; i < 20; i++)
        {
            let piece = board.allies["a"+i];
            if(piece.alive)
            {
                let moves = new validMovesCollection(piece);
                if(moves.importance == maxImportance)
                {
                    piece.possibleTurn = true;
                    piece.moves = moves;

                    setPieceColor(piece, "Orange");
                }
            }
        }
    }

    
    function validMovesCollection(piece, xPos, yPos, removed)
    {
        if(removed == null) { removed = []; }

        let x = piece.xMatrix;
        let y = piece.yMatrix;

        this.xStart = x;
        this.yStart = y;

        if(xPos != null) { x = xPos; }
        if(yPos != null) { y = yPos; }

        this.collection = [];
        this.importance = 0;


        this.checkMoveNormal = function(xPositive)
        {
            let xDir = xPositive?1:-1;

            if(x > -1-xDir && x < 10-xDir && y > 0 && board.boardMatrix[y-1][x+xDir] == null)
            {
                if(this.importance <= 1)
                {
                    this.importance = 1;
                    this.collection.push(new move(piece.id, x+xDir, y-1, null, null))
                }
            }
        }

        this.checkKillNormal = function(xPositive, yPositive)
        {
            let xDir = xPositive?1:-1;
            let yDir = yPositive?1:-1;
    
            if(x > 0-xDir && x < 9-xDir && y > 0-yDir && y < 9-yDir && board.boardMatrix[y+yDir][x+xDir] != null)
            {
                let killID = board.boardMatrix[y+yDir][x+xDir];
                let xMove = x+2*xDir;
                let yMove = y+2*yDir;

                if(!removed.includes(killID) && killID.startsWith("o") && board.boardMatrix[yMove][xMove] == null)
                {
                    removed.push(killID);
                    let nextMove = new validMovesCollection(piece, xMove, yMove, removed);
                    let thisMoveImportance = nextMove.importance + 1;
                    if(thisMoveImportance <= 2)
                    {
                        thisMoveImportance = 2;
                        nextMove = null;
                    }

                    if(this.importance <= thisMoveImportance)
                    {
                        if(this.importance < thisMoveImportance)
                        {
                            this.collection = [];
                            this.importance = thisMoveImportance;
                        }

                        this.collection.push(new move(piece.id, xMove, yMove, killID, nextMove))
                    }
                }
            }
        }

        this.checkMoveKing = function(xPositive, yPositive)
        {
            let xDir = xPositive?1:-1;
            let yDir = yPositive?1:-1;

            let emptySpace = true;
            let range = 1;
            while(emptySpace)
            {
                let xMove = x + range * xDir;
                let yMove = y + range * yDir;
    
                emptySpace = xMove >= 0 && xMove <= 9 && yMove >= 0 && yMove <= 9 && board.boardMatrix[yMove][xMove] == null;
                if(emptySpace)
                {
                    if(this.importance <= 1)
                    {
                        this.importance = 1;
                        this.collection.push(new move(piece.id, xMove, yMove, null, null))
                    }
                }

                range++;
            }
        }

        this.checkKillKing = function(xPositive, yPositive)
        {
            let xDir = xPositive?1:-1;
            let yDir = yPositive?1:-1;

            let searchNext = true;
            let range = 1;
            while(searchNext)
            {
                let xMove = x + range * xDir;
                let yMove = y + range * yDir;

                range++;

                searchNext = xMove >= 0 && xMove <= 9 && yMove >= 0 && yMove <= 9;
                if(searchNext && board.boardMatrix[yMove][xMove] != null)
                {
                    searchNext = false;

                    let killID = board.boardMatrix[yMove][xMove];

                    xMove = xMove + xDir;
                    yMove = yMove + yDir;
                    let emptySpace = xMove >= 0 && xMove <= 9 && yMove >= 0 && yMove <= 9 && board.boardMatrix[yMove][xMove] == null;
                    if(!removed.includes(killID) && killID.startsWith("o") && emptySpace)
                    {
                        removed.push(killID);

                        while(emptySpace)
                        {
                            xMove = x + range * xDir;
                            yMove = y + range * yDir;
                
                            emptySpace = xMove >= 0 && xMove <= 9 && yMove >= 0 && yMove <= 9 && board.boardMatrix[yMove][xMove] == null;
                            if(emptySpace)
                            {
                                let nextMove = new validMovesCollection(piece, xMove, yMove, removed);
                                let thisMoveImportance = nextMove.importance + 1;
                                if(thisMoveImportance <= 2)
                                {
                                    thisMoveImportance = 2;
                                    nextMove = null;
                                }
            
                                if(this.importance <= thisMoveImportance)
                                {
                                    if(this.importance < thisMoveImportance)
                                    {
                                        this.collection = [];
                                        this.importance = thisMoveImportance;
                                    }
            
                                    this.collection.push(new move(piece.id, xMove, yMove, killID, nextMove))
                                }
                            }
            
                            range++;
                        }
                    }
                }
            }
        }


        if(piece.king)
        {
            if(removed.length == 0)
            {
                this.checkMoveKing(false, false);
                this.checkMoveKing(false, true);
                this.checkMoveKing(true, false);
                this.checkMoveKing(true, true);
            }

            this.checkKillKing(false, false);
            this.checkKillKing(false, true);
            this.checkKillKing(true, false);
            this.checkKillKing(true, true);
        }
        else
        {
            this.checkMoveNormal(false);
            this.checkMoveNormal(true);

            this.checkKillNormal(false, false);
            this.checkKillNormal(false, true);
            this.checkKillNormal(true, false);
            this.checkKillNormal(true, true);
        }
    }

    function move(id, x, y, kill, next)
    {
        this.id = id
        this.x = x;
        this.y = y;
        this.kill = kill;
        this.next = next;
    }

    function setPieceColor(piece, color)
    {
        if(piece.king)
        {
            piece.src = "/Images/PacMan_" + color + "_King.png";
        } else {
            piece.src = "/Images/PacMan_" + color + ".png";
        }
    }

    function resetLastClick()
    {
        if(lastPiece != null) 
        { 
            unDoKills(lastPiece.moves);

            function unDoKills(move)
            {
                if(move != null) 
                { 
                    lastPiece.setPosition(move.xStart, move.yStart); 
    
                    for(let i = 0; i < move.collection.length; i++)
                    {
                        let subMove = move.collection[i];
                        if(subMove.kill != null)
                        {
                            board.revivePiece(subMove.kill);
                        }
                        unDoKills(subMove.next);
                    }
                }
            }


            lastPiece.src = lastPiece.lastSrc; 
            delete lastPiece.lastSrc;

            if(lastPiece.newKing != null)
            {
                lastPiece.king = false;
                delete lastPiece.newKing;
            }
        }

        board.clearMoves();
        
        board.removeOptionDots();
    }



    function boardInterface()
    {
        const board = document.getElementById("PlaySpace");
        const allyDOM = document.getElementById("Allies").children;
        const opponentDOM = document.getElementById("Opponents").children;

        var playerScore = 0;
        const playerScoreDisplay = document.getElementById("PlayerScore");
        var opponentScore = 0;
        const opponentScoreDisplay = document.getElementById("OpponentScore");

        this.getOpponentScore = function() { return opponentScore; }


        this.allies = {};
        this.opponents = {};
        this.boardMatrix = {0:{}, 1:{}, 2:{}, 3:{}, 4:{}, 5:{}, 6:{}, 7:{}, 8:{}, 9:{}};
    
        var validMove = false;
        this.isValidMove = function() { return validMove; }

        var moveQueue = [];
        this.turnString = function()
        {
            let moveString = moveQueue[0].id + ":";
            for(let i = 0; i < moveQueue.length; i++)
            {
                let move = moveQueue[i];
                moveString += "(" + move.x + "," + move.y + ")";
                if(move.kill != null) { moveString += "-Kill=" + move.kill; }
                moveString += ";"
            }

            let lastMove = moveQueue[moveQueue.length-1];
            if(lastMove != null && lastMove.y == 0)
            {
                moveString += "King";
            }

            return moveString;
        }
        this.clearMoves = function()
        {
            validMove = false;
            moveQueue = [];
        }

        this.killPiece = function(pieceID)
        {
            let killedPiece = null;        
            if(pieceID.startsWith("o"))
            {
                killedPiece = this.opponents[pieceID];

                playerScore++;
                playerScoreDisplay.innerHTML = (playerScore<10?"0":"") + playerScore;
            } else {
                killedPiece = this.allies[pieceID];

                opponentScore++;
                opponentScoreDisplay.innerHTML = (opponentScore<10?"0":"") + opponentScore;
            }
            
            killedPiece.alive = false;
            killedPiece.style.display = "none";
            delete this.boardMatrix[killedPiece.yMatrix][killedPiece.xMatrix];
        }
        this.revivePiece = function(pieceID)
        {
            let killedPiece = null;        
            if(pieceID != null && pieceID.startsWith("o"))
            {
                killedPiece = this.opponents[pieceID];

                if(!killedPiece.alive) { playerScore--; }
                playerScoreDisplay.innerHTML = (playerScore<10?"0":"") + playerScore;
            } else {
                killedPiece = this.allies[pieceID];

                if(!killedPiece.alive) { opponentScore--; }
                opponentScoreDisplay.innerHTML = (opponentScore<10?"0":"") + opponentScore;
            }

            killedPiece.alive = true;
            killedPiece.style.display = "inherit";
            this.boardMatrix[killedPiece.yMatrix][killedPiece.xMatrix] = killedPiece.id;
        }


        var optionDots = [];
        this.placeOptionDot = function(piece, x, y, currentOption)
        {
            let dot = document.createElement("img");
            dot.classList.add("BoardPiece");
            dot.src = "/Images/Option_Dot.png";
            dot.style.left = (x * 10) + "%";
            dot.style.top = (y * 10) + "%";
            dot.onclick = () => dotClick(dot, piece, this);

            dot.xPos = x;
            dot.yPos = y;

            dot.option = currentOption;

            board.appendChild(dot);
            optionDots.push(dot);
        }
        function dotClick(dot, piece, gameBoard)
        {
            gameBoard.removeOptionDots();

            piece.setPosition(dot.xPos, dot.yPos)

            moveQueue.push(dot.option);

            if(dot.option.kill != null)
            {
                gameBoard.killPiece(dot.option.kill);
            }

            let moves = dot.option.next;
            if(moves == null)
            {
                validMove = true;

                if(dot.yPos == 0 && !piece.king) 
                {
                    piece.king = true; 
                    piece.newKing = true;
                    piece.src = "/Images/PacMan_Red_King.png"
                }
            }
            else
            {
                for(let i = 0; i < moves.collection.length; i++)
                {
                    let currentMove = moves.collection[i];
                    gameBoard.placeOptionDot(piece, currentMove.x, currentMove.y, currentMove)
                }
            }
        }
    
        this.removeOptionDots = function()
        {
            for(let i = 0; i < optionDots.length; i++)
            {
                optionDots[i].remove();
            }
            optionDots = [];
        }

    
        for(let i = 0; i < 20; i++)
        {
            let y = 9 - Math.floor(i / 5);
            let x = 2 * (i % 5) + ((y + 1) % 2);
            let piece = allyDOM[i];
            initializePiece(piece, this.allies, this.boardMatrix, x, y);

            piece.possibleTurn = false;
            piece.onclick = () => pieceClick(piece);
        }
        for(let i = 0; i < 20; i++)
        {
            let y = Math.floor(i / 5);
            let x = 9 - (2 * (i % 5) + (y % 2));
            initializePiece(opponentDOM[i], this.opponents, this.boardMatrix, x, y);
        }
       
    
        function initializePiece(piece, dest, matrix, x, y)
        {
            piece.alive = true;
            piece.king = false;
            piece.xMatrix = x;
            piece.yMatrix = y;

            piece.setPosition = function(x, y)
            {
                delete matrix[this.yMatrix][this.xMatrix];
                matrix[y][x] = this.id;

                this.xMatrix = x;
                this.yMatrix = y;

                this.style.left = (x * 10) + "%";
                this.style.top = (y * 10) + "%";
            }

            let id = piece.id;
            dest[id] = piece;
    
            matrix[y][x] = id;
        }
    }
}


function popUp() 
{
    const popUpWindow = document.getElementById("PopUp");
    const popUpWait = document.getElementsByClassName("WaitPopUp");
    const popUpRules = document.getElementsByClassName("RulesPopUp");
    const popUpWin = document.getElementsByClassName("WinPopUp");
    const popUpLose = document.getElementsByClassName("LosePopUp");
    const popUpDraw = document.getElementsByClassName("DrawPopUp");
    const popUpDropOut = document.getElementsByClassName("DropOutPopUp");
    const popUpConnection = document.getElementsByClassName("ConnectionPopUp");

    document.getElementById("ClosePopUpButton").onclick = function()
    {
        popUpWindow.style.display = "none";
        disableInfo();
    };
    document.getElementById("HomePageButton").onclick = function()
    {
        window.location.replace("/")
    };


    var gameStarted = false;
    var gameFinished = false;
    var infoOpen = false;

    this.startGamePopUp = function() 
    {
        popUpWindow.style.display = "none";
        disableInfo();

        gameStarted = true;
    };

    this.showRulesPopUp = function() 
    {
        for (let element of popUpRules) { element.style.display = "inherit"; }
        popUpWindow.style.display = "inherit";

        infoOpen = true;
    };

    this.endGamePopUp = function(message) 
    {
        if(!gameFinished)
        {
            disableInfo();

            gameFinished = true;
            popUpWindow.style.display = "inherit";

            if(message == "Connection")
            {
                for (let element of popUpConnection) { element.style.display = "inherit"; }
            }
            else if(message == "ConnectionLost")
            {
                for (let element of popUpDropOut) { element.style.display = "inherit"; }
            }
            else if(message == "Lose")
            {
                for (let element of popUpLose) { element.style.display = "inherit"; }
            }
            else if(message == "Win")
            {
                for (let element of popUpWin) { element.style.display = "inherit"; }
            }
            else if(message == "Draw")
            {
                for (let element of popUpDraw) { element.style.display = "inherit"; }
            }
            else
            {
                gameFinished = false;
                popUpWindow.style.display = "none";
            }
        }
    };


    function disableInfo()
    {
        if(!gameStarted) 
        {
            for (let element of popUpWait) { element.style.display = "none"; }
        }
        if(infoOpen) 
        {
            infoOpen = false;
            for (let element of popUpRules) { element.style.display = "none"; }
        }
    }
}