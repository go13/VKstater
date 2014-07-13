var vkAccessToken = null;

var laddaBtn = null;

$(window).ready(function(){
    chrome.runtime.sendMessage({method: "getLocalStorage"}, function(response) {
            vkAccessToken = response.vkAccessToken;
            if(vkAccessToken){
                var link = $("#reference").val();

                var params = window.location.hash.substring(1).split('&');

                for(var i = 0; i < params.length; i++){
                    var vals = params[i].split("=");

                    if(vals[0] == "ref"){
                        link = vals[1];
                        break;
                    }

                }

                analize(link);
            }
    });

    $("#go-btn").click(function(){

        var link = $("#reference").val();

        link = extractContentId(link);

        analize(link);

    });

    $("#reference").keypress(function(event) {
        if (event.keyCode == 13) {
            var link = $("#reference").val();

            link = extractContentId(link);

            analize(link);
        }
    });

    $("#reference").focus(function() {
        $(this).select().mouseup(function (e) {e.preventDefault(); });
    } );

});

function extractContentId(link){
    var matches = link.match(/(wall|wall_reply|photo|photo_comment|video|video_comment|note|audio|topic_comment)(-?\d+)_(\d+)/);
    return matches[1] + matches[2] + "_" + matches[3];
}

function analize(reference){

    $("#reference").val(reference);

    window.location.hash = "ref=" + reference;

    hideContent();

    var matches = reference.match(/(wall|wall_reply|photo|photo_comment|video|video_comment|note|audio|topic_comment)(-?\d+)_(\d+)/);

    getUsersCities(matches[2], matches[3], matches[1], function(data){

        var cf1 = crossfilter(data.response);

        drawCityChart(cf1, "#chart-city");
        drawGenderChart(cf1, "#chart-gender");

        var ids = extractUserIds(data.response);

        getUsersGroups(ids, function(data) {

            var cf2 = crossfilter(data);

            var map = {};
            for(var i = 0; i < data.length; i++){
                var el = data[i];
                var fname = getGroupName(el);
                map[fname] = el;
            }

            drawGroupChart(cf2, "#chart-groups", map);

            dc.renderAll();

            showContent();

        }, function(error) {
            showError(error);
        });
    }, function(error) {
        showError(error);
    });

}

function showError(error){
    $("#error").css("display", "block");
    $("#spinner").hide();
    $("#go-btn").removeAttr('disabled');
    $("#go-btn").html("Поехали!");
    $("#reference").removeAttr('disabled');
    $("#error_msg").html("Описание: " + error.statusText);
}

function showContent(){
    $("#content").show();
    $("#spinner").hide();
    $("#go-btn").removeAttr('disabled');
    $("#go-btn").html("Поехали!");
    $("#reference").removeAttr('disabled');
}

function hideContent(){
    $("#error").css("display", "none");
    $("#content").hide();
    $("#spinner").show();
    $("#go-btn").attr('disabled','disabled');
    $("#go-btn").html("Грузим...");
    $("#reference").attr('disabled','disabled');
}


function drawCityChart(cf, divId){
    var citiesToShow = 50;
    var groups = cf.dimension(function(d){
        if(typeof d.city == "undefined"){
            return 'Город не задан';
        }else{
            return d.city.title;
        }
    });
    var chartGroup = groups.group();

    var groupChart = dc.rowChart(divId);
    groupChart
    .width(500)
    .height(1300)
    .ordinalColors(['rgb(49, 130, 189)','rgb(198, 219, 239)'])
    .gap(2)
    .cap(citiesToShow)
    .ordering(function(d) { return -1.0 * +d.value; })
    .dimension(groups)
    .group(chartGroup)
    .elasticX(true)
    .label(function(d) {
        return d.key + ' (' + d.value + ')';
    })
    .othersLabel("Другие")
    .xAxis().tickFormat(d3.format("d"));

    $("#chart-cities-label").html("Города (ТОП " + (chartGroup.size() < citiesToShow ? chartGroup.size() : citiesToShow) + ")");
}

function getGroupName(d){
    if(d){
        if(typeof d.name == "undefined"){
            return (d.first_name + ' ' + d.last_name);
        }else{
            return d.name;
        }
    }else{
        return "";
    }
}

function drawGroupChart(cf, divId, map){
    var groupsToShow = 50;

    var groups = cf.dimension(getGroupName);
    var chartGroup = groups.group();

    var groupChart = dc.rowChart(divId);
    groupChart
    .width(500)
    .height(1300)
    .ordinalColors(['rgb(49, 130, 189)','rgb(198, 219, 239)'])
    .gap(2)
    .cap(groupsToShow)
    .ordering(function(d) { return -1.0 * +d.value; })
    .dimension(groups)
    .group(chartGroup)
    .elasticX(true)
    .label(function(d) {
        return d.key + ' (' + d.value + ')';
    })
    .othersGrouper(false)
    .xAxis().tickFormat(d3.format("d"));

    $("#chart-groups-label").html("Группы (ТОП " + (chartGroup.size() < groupsToShow ? chartGroup.size() : groupsToShow) + ")");

    groupChart.onClick = function(d){
        var fname = d.key;
        var screen_name = map[fname].screen_name;
        var link = "http://vk.com/" + screen_name;
        window.open(link);
    };
}

function drawGenderChart(cf, divId){
    var pie_gender = dc.pieChart(divId).radius(70);

    var gender = cf.dimension(function(d){
        if(typeof d.sex == "undefined"){
            return "";
        }else{
            return d.sex;
        }
    });

    var groupGender = gender.group().reduceSum(function(d){
        return 1;
    });

    var NameGender = { 2 : "Мужчины", 1 : "Женщины" , "" : "Пол не задан" };

    var SymbolGender = {2:"\u2642",1:"\u2640","":""};

    pie_gender
    .width(140)
    .height(140)
    .dimension(gender)
    .label(function(d){
        return SymbolGender[d.key];
    })
    .title(function(d){
        return NameGender[d.key] + ": " + d.value;
    })
    .group(groupGender);
}

function getTopGroup(group, top, undefinedName){
    return {
       all : function() {

        var g = [];
        var all = group.all();

        all.sort(function(a, b){
            return a.value - b.value;
        });

        for(var i = all.length - 1 - top; i < all.length - 1 && i >= 0; i++){
            var d = all[i];
            g.push({key : d.key, value : d.value})
        }

        var sum = all.length - 1 - top;

        if(sum > 0){
            g.push({key : undefinedName, value : sum})
        }


        return g;
       }
     };
}

function getUsersCities(owner_id, item_id, content_type, callback, error_callback){
    $.post('https://api.vk.com/method/execute.findUserCities?'+
        'access_token=' + vkAccessToken +
        '&owner_id=' + owner_id +
        '&item_id=' + item_id +
        '&content_type=' + content_type,
    {}).done(function(data){
        if(data.error){
            if(data.error.error_code == 6){
                error_callback("Вы отправляете запросы очень часто");
            }else{
                error_callback("Произошла ошибка: " + data.error.error_msg);
            }
        }else{
            callback(data);
        }
    }).fail(function(error) {
        error_callback(error);
    });
}

function extractUserIds(response){
    var arr = [];
    for(var i = 0; i < response.length; i++){
        arr.push(response[i].id);
    }
    return arr;
}


function getUsersGroups(uids, callback, error_callback){
    var step = 20;
    var composed = [];
    var ids = uids;
    var callCount = Math.ceil(ids.length / step);
    var toBreak = false;

    while(ids.length > 0 && !toBreak){

        getUsersGroupsPortion(ids.slice(0, step), function(data){
            callCount--;
            composed = composed.concat(data.response);

            if(callCount == 0){
                callback(composed);
            }
        }, function(error){
            toBreak = true;
            error_callback(error);
        });

        ids = ids.slice(step, ids.length);
    }
}

function getUsersGroupsPortion(portion, callback, error_callback){
    $.post('https://api.vk.com/method/execute.findUserGroups?'+
        'access_token=' + vkAccessToken +
        '&uids=' + portion.toString(),
        {}
    ).done(function(data){
        callback(data);
    }).fail(function(error) {
        error_callback(error);
     });
}