$(window).ready(function(){

    if(window.location.host == "vk.com"){
        loadScriptToPage('script.js');

        loadScriptToPage('jquery.js');

        window.addEventListener("message", function(event) {
          if (event.data.type && (event.data.type == "OPEN_NEW_STAT_WINDOW")) {
            chrome.runtime.sendMessage({method: "OPEN_NEW_STAT_WINDOW", ref : event.data.ref},
                function(response) {});
          }
        }, false);

    }

});

function loadScriptToPage(scriptName){
    var s = document.createElement('script');
    s.src = chrome.extension.getURL(scriptName);
    s.onload = function() {
        this.parentNode.removeChild(this);
    };
    (document.head||document.documentElement).appendChild(s);
}