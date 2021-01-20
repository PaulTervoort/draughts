document.addEventListener("DOMContentLoaded", function()
{
    var hoverSound = document.createElement("audio");
    hoverSound.src = "/Audio/Button_Hover.flac";
    document.body.appendChild(hoverSound);

    var buttons = document.getElementsByClassName("ButtonSound");
    for(let i = 0; i < buttons.length; i++)
    {
        buttons[i].onmouseenter = function()
        {
            hoverSound.play();
        };   
    }
});
