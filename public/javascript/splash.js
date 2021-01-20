document.addEventListener("DOMContentLoaded", function() 
{
    document.getElementById("play").onclick = function()
    {
        window.location.href="/play";
    };
    document.getElementById("rules").onclick = function()
    {
        window.location.href="/rules";
    };

    getStats();
    setInterval(getStats, 1000);
});


function getStats ()
{
    fetch('/getStats').then(res => res.json()).then( function(res)
    {
        //success
        document.getElementById('statPlayerCount').innerText = res.playerCount;
        document.getElementById('statPlayingCount').innerText= res.runningGames;
        document.getElementById('statPlayedCount').innerText= res.finishedGames;            
    })
    .catch(function(err)
    {
        //error
        console.log(err);
    });
}