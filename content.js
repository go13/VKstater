var vkAccessToken = null;

$(window).ready(function(){

    loadScriptToPage('script.js');

    loadScriptToPage('jquery.js');

    window.addEventListener("message", function(event) {
      if (event.data.type && (event.data.type == "GET_LIKES_DATA")) {

        chrome.runtime.sendMessage({method: "getLocalStorage"}, function(response) {

            var href = window.location.href;

            var matches = href.match(/(wall|wall_reply|photo|photo_comment|video|video_comment|note|audio|topic_comment)(-?\d+)_(\d+)/);

            vkAccessToken = response.vkAccessToken;

            getUsersCities(matches[2], matches[3], matches[1], function(data){

                    $('#wk_likes_content').html('<canvas id="canvasChart" width="610" height="300">' +
                            'Your web-browser does not support the HTML 5 canvas element.' +
                        '</canvas>');

                    var set = {};
                    var withCities = 0;

                    data.response.forEach(function(el){
                        if(el.city){
                            var title = el.city.title;

                            if(set[title]){
                                set[title].num++;
                                withCities++;
                            }else{
                                set[title]={title: title, num: 1};
                                withCities++;
                            }
                        }

                    });

                    var arr = [];

                    for(var prop in set){
                        arr.push(set[prop]);
                    }

                    arr.sort(function(a, b){
                        return a.num - b.num;
                    });


                    var barNum = 10;

                    arr.splice(-arr.length, arr.length - barNum);

                    var data = [];
                    var labels = [];

                    arr.forEach(function(el){
                        data.push(Math.round(100 * el.num/withCities));
                        labels.push(el.title);
                    });

                    drawMyChart(data, labels);

            });
        });
      }
    }, false);

});

function getUsersCities(owner_id, item_id, content_type, callback){
    $.post('https://api.vk.com/method/execute.findUserCities?'+
        'access_token=' + vkAccessToken +
        '&owner_id=' + owner_id +
        '&item_id=' + item_id +
        '&content_type=' + content_type,
        {}
    ).done(callback);
}

function loadScriptToPage(scriptName){
    var s = document.createElement('script');
    s.src = chrome.extension.getURL(scriptName);
    s.onload = function() {
        this.parentNode.removeChild(this);
    };
    (document.head||document.documentElement).appendChild(s);
}

function drawMyChart(data, labels){
        if(!!document.createElement('canvas').getContext){

            var mychart = new AwesomeChart('canvasChart');
            mychart.title = "Статистика лайков поста по городам, %";
            mychart.titleFontHeight = 20;
            mychart.data = data;
            mychart.labels = labels;
            mychart.barFillStyle = "#597BA5";
            mychart.barStrokeStyle = "#597BA5";
            mychart.barBorderWidth = 0;
            mychart.barShadowBlur = 0;
            mychart.barShadowColor = "#597BA5";
            mychart.labelFillStyle = "#000000";
            mychart.labelFontHeight = 14;
            mychart.marginLeft = 20;
            mychart.barHGap = 5;
            mychart.draw();
        }
      }


