const target = document.getElementById("hello");
const socket = new WebSocket("ws://localhost:6969");
socket.onmessage = function(event){
    target.innerHTML = event.data;
};

socket.onopen = function(){
    socket.send("Hello from the client!");
    target.innerHTML = "Sending a first message to the server ...";
};
