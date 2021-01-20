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
<<<<<<< HEAD
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
=======
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

>>>>>>> 20f2b9b8a1e98270dcb163f48383cbd6aee5fde4
