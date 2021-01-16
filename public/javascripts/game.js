const popup = document.getElementById("PopUp");


const socket = new WebSocket("ws://localhost:6969");

socket.onmessage = function(event){
    if(event.data == "StartGame"){
        popup.style.display = "none";
    }
};

socket.onopen = function(){
    socket.send("Hello from the client!");
    target.innerHTML = "Sending a first message to the server ...";
};


