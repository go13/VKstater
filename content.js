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
                var loadingImg = chrome.extension.getURL("loading.jpeg");

                $('#wk_likes_content').html(
                    '<canvas id="canvasChartCity" width="610" height="300">' +
                        'Your web-browser does not support the HTML 5 canvas element.' +
                    '</canvas>' +
                    '<img id="loadingGroupsImg" style="margin-left:100px; margin-bottom:50px" src="' + loadingImg + '"></img>' +
                    '<canvas id="canvasChartGroups" style="display:none" width="610" height="800">' +
                        'Your web-browser does not support the HTML 5 canvas element.' +
                    '</canvas>'
                    );

                var set = {};
                var withCities = 0;
                var ids = [];

                data.response.forEach(function(el){
                    if(typeof el.city != 'undefined'){
                        var title = el.city.title;

                        if(set[title]){
                            set[title].num++;
                            withCities++;
                        }else{
                            set[title]={title: title, num: 1};
                            withCities++;
                        }
                    }
                    ids.push(el.id);

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

                drawMyChartCity(data, labels);

                getUsersGroups(ids, function(data, likedNum){
                    var dataGrops = [];
                    var labelsGroups = [];

                    data.forEach(function(el){
                        //dataGrops.push(Math.round(100000 * el.num/likedNum)/1000);
                        dataGrops.push(el.num);
                        if(el.name){
                            labelsGroups.push(el.name);
                        }else{
                            labelsGroups.push(el.first_name + ' ' + el.last_name);
                        }
                    });

                    drawMyChartGroups(dataGrops, labelsGroups);
                });

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

function getUsersGroups(uids, callback){
    var step = 20;
    var composed = [];
    var ids = uids;
    var callCount = Math.ceil(ids.length / step);

    while(ids.length > 0){

        getUsersGroupsPortion(ids.slice(0, step), function(data){

            callCount--;
            composed = composed.concat(data.response);

            if(callCount == 0){
                var set = {};
                composed.forEach(function(el){
                    if(typeof el != 'undefined'){
                        var id = el.id;
                        if(set[id]){
                            set[id].num++;
                        }else{
                            set[id]=el;
                            set[id].num = 1;
                        }
                    }
                });

                var arr = [];

                for(var prop in set){
                    arr.push(set[prop]);
                }

                var arrSize = arr.length;

                arr.sort(function(a, b){
                    return a.num - b.num;
                });

                arr.splice(-arr.length, arr.length - 25);

                arr.sort(function(a, b){
                    return b.num - a.num;
                });

                callback(arr, uids.length);
            }
        });

        ids = ids.slice(step, ids.length);
    }
}

function getUsersGroupsPortion(portion, callback){
    $.post('https://api.vk.com/method/execute.findUserGroups?'+
        'access_token=' + vkAccessToken +
        '&uids=' + portion.toString(),
        {}
    ).done(function(data){
        callback(data);
    });
}

function loadScriptToPage(scriptName){
    var s = document.createElement('script');
    s.src = chrome.extension.getURL(scriptName);
    s.onload = function() {
        this.parentNode.removeChild(this);
    };
    (document.head||document.documentElement).appendChild(s);
}

function drawMyChartCity(data, labels){
        if(!!document.createElement('canvas').getContext){

            var mychart = new AwesomeChart('canvasChartCity');
            mychart.title = "Статистика лайков поста по городам, %";
            mychart.titleFontHeight = 14;
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
            mychart.proportionalSizes = false;
            mychart.draw();
        }
      }

function drawMyChartGroups(data, labels){
        if(!!document.createElement('canvas').getContext){

            var mychart = new AwesomeChart('canvasChartGroups');
            mychart.title = "Популярность групп среди тех, кто лайкнул";
            mychart.titleFontHeight = 14;
            mychart.data = data;
            mychart.labels = labels;
            mychart.barFillStyle = "#597BA5";
            mychart.barStrokeStyle = "#597BA5";
            mychart.barBorderWidth = 0;
            mychart.barShadowBlur = 0;
            mychart.barShadowColor = "#597BA5";
            mychart.labelFillStyle = "#000000";
            mychart.labelFontHeight = 14;
            mychart.marginLeft = -70;
            mychart.marginBottom = 100;
            mychart.marginRight = -70;
            mychart.barHGap = 5;
            mychart.chartType = "horizontal bars"
            mychart.proportionalSizes = false;
            mychart.draw();

            $('#loadingGroupsImg').hide();
            $('#canvasChartGroups').show();
        }
      }
