var oShowTooltip = showTooltip;
showTooltip = nShowTooltip;

function nShowTooltip(a, b) {
    if(typeof b != 'undefined' && b.url == 'like.php'){
        var ref = b.params.object;

        b.onShowEnd = function(){
            $('#vkstater_' + ref).remove();

            $('#like_title_' + ref).parent()
                .append("<a id='vkstater_" + ref + "' href='#' style='margin-left: 30px;color:#FFFFFF'>" +

                "VKstater" +

                "</a>");

            $('#vkstater_' + ref).on('click', function(e){

                window.postMessage({ type: "OPEN_NEW_STAT_WINDOW", ref : ref }, "*");

                return false;
            });
        };

    }
    oShowTooltip(a, b);
}


function canvasToImage(divId){
    var canvas = document.getElementById(divId)
    var image = canvas.toDataURL("image/png").replace("image/png", "image/octet-stream").attr("download", "file-.png");
    window.location.href=image;
}
