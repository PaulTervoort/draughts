document.addEventListener("DOMContentLoaded", (event) => game());

function game()
{
    const messagePopUp = new popUp();
    const labelTurnPlayer = document.getElementById("TurnPlayer");
    const labelTurnOpponent = document.getElementById("TurnOpponent");
    const endTurnButton = document.getElementById("EndTurnButton");

    document.getElementById("RuleButton").onclick = function()
    {
        messagePopUp.showRulesPopUp();
    };

    var playerID = 0;
    var turnPlayer = 0;

    const socket = new WebSocket("ws://localhost:6969");

    socket.onmessage = function(event)
    {
        let message = event.data;
        if(message.startsWith("StartGame;"))
        {
            messagePopUp.startGamePopUp();

            playerID = parseInt(message.slice(17, 18));
            turnPlayer = parseInt(message.slice(24, 25));

            if(playerID != turnPlayer)
            {
                labelTurnPlayer.style.display = "none";
                labelTurnOpponent.style.display = "inherit";
                endTurnButton.disabled = true;
            }
        }
        else if(message.startsWith("EndGame:"))
        {
            messagePopUp.endGamePopUp(message.slice(8));
        }

    };

    socket.onclose = function(event)
    {
        if(event.code > 1001)
        {
            messagePopUp.endGamePopUp("Connection");
        }
    };
}


var popUp = function() 
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


    let gameStarted = false;
    let gameFinished = false;
    let infoOpen = false;

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
};