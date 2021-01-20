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
    setInterval(getStats, 5000);
});


function getStats ()
{
    console.log("getStats");

    axios.get('/getStats')
        .then( function(res){
            //success
            console.log(res.status);
            console.log(res.data);
            
            let playerCount = res.data.playerCount; 
            let spanPlayerCount = document.getElementById('statPlayerCount'); 
            spanPlayerCount.innerText = playerCount; 
            
            document.getElementById('statPlayingCount').innerText= res.data.runningGames;
            document.getElementById('statPlayedCount').innerText= res.data.finishedGames;
            
            
        })
        .catch(function(err){
            //error
            console.log(err);
        });
}

