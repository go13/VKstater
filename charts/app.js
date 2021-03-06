var vkAccessToken = null;

$(window).ready(function(){

    hideContent();

    var link = $("#reference").val();

    link = parseLink(link);

    analize(link);

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

function getToken(callback, failure){

    if(typeof vkAccessToken == "undefined" || vkAccessToken == null) {

        chrome.runtime.sendMessage({method: "getLocalStorage"}, function (response) {
            vkAccessToken = response.vkAccessToken;

            if (vkAccessToken) {

                callback(vkAccessToken);

            } else {

                chrome.runtime.sendMessage({method: "RELOGIN"}, function (response) {
                    if (failure) {
                        failure();
                    }
                });

            }
        });
    }else{
        callback(vkAccessToken);
    }

}

function parseLink(link) {
    var params = window.location.hash.substring(1).split('&');

    for(var i = 0; i < params.length; i++){
        var vals = params[i].split("=");

        if(vals[0] == "ref"){
            link = vals[1];
            break;
        }

    }

    return link;
}

function extractContentId(link){
    var matches = link.match(/(wall|wall_reply|photo|photo_comment|video|video_comment|note|audio|topic_comment)(-?\d+)_(\d+)/);
    return matches[1] + matches[2] + "_" + matches[3];
}

function analize(reference){

        $("#reference").val(reference);

        window.location.hash = "ref=" + reference;

        getToken(function(token) {

            vkAccessToken = token;

            hideContent();

            var matches = reference.match(/(wall|wall_reply|photo|photo_comment|video|video_comment|note|audio|topic_comment)(-?\d+)_(\d+)/);

            var owner_id = matches[2];

            getOwnerById(owner_id, function(owner){
                if(typeof owner.uid == 'undefined') {
                    $('#owner_id').attr('src', owner.photo_big);
                    $('#owner_id_ref').attr('href', 'http://vk.com/' + owner.screen_name);
                    $('#owner_id_ref_name').attr('href', 'http://vk.com/' + owner.screen_name);
                }else{
                    $('#owner_id').attr('src', owner.photo_max);
                    $('#owner_id_ref').attr('href', 'http://vk.com/id' + owner.uid);
                    $('#owner_id_ref_name').attr('href', 'http://vk.com/id' + owner.uid);
                }
                $('#owner_id_ref_name').text(getGroupName(owner));
            });

            getUsersCities(owner_id, matches[3], matches[1], function (data) {

                $("#loaded-number").html("Загруженно пользователей - " + data.response.users.length + " из общего количества лайков - "+ data.response.count);

                var cf1 = crossfilter(data.response.users);

                drawCityChart(cf1, "#chart-city");

                drawGenderChart(cf1, "#chart-gender");

                drawAgeChart(cf1, "#chart-age");

                var ids = extractUserIds(data.response.users);

                getUsersGroups(ids, function (data) {

                    var cf2 = crossfilter(data);

                    var map = {};
                    for (var i = 0; i < data.length; i++) {
                        var el = data[i];
                        var fname = getGroupName(el);
                        map[fname] = el;
                    }

                    drawGroupChart(cf2, "#chart-groups", map);

                    dc.renderAll();

                    showContent();

                }, function (error) {
                    showError({"statusText": error});
                });
            }, function (error) {
                showError({"statusText": error});
            });

        }, function(){

            hideContentNoLoading();

    });
}

function showError(error){
    $("#error").css("display", "block");
    $("#spinner").hide();
    $("#go-btn").removeAttr('disabled');
    $("#go-btn").html("Поехали!");
    $("#reference").removeAttr('disabled');
    $("#error_msg").html("Описание: " + error.statusText);
    $("#loaded-number").hide();
}

function showContent(){
    $("#content").show();
    $("#spinner").hide();
    $("#go-btn").removeAttr('disabled');
    $("#go-btn").html("Поехали!");
    $("#reference").removeAttr('disabled');
    $("#loaded-number").show();
}

function hideContent(){
    $("#error").css("display", "none");
    $("#content").hide();
    $("#spinner").show();
    $("#go-btn").attr('disabled','disabled');
    $("#go-btn").html("Ждите...");
    $("#reference").attr('disabled','disabled');
    $("#loaded-number").hide();
}


function hideContentNoLoading(){
    $("#error").css("display", "none");
    $("#content").hide();
    $("#spinner").hide();
    $("#go-btn").removeAttr('disabled','disabled');
    $("#go-btn").html("Поехали!");
    $("#reference").removeAttr('disabled','disabled');
    $("#loaded-number").hide();
}

function drawAgeChart(cf, divId){
    var groups = cf.dimension(function(d){
        if(typeof d.bdate == "undefined"){
            return 'Возраст не определен';
        }else{
            var bdate = d.bdate;
            var par = bdate.match(/(\d+)\.(\d+)\.(\d+)/);

            if(par != null){
                var year = parseInt(par[3]);
                var currentYear = new Date().getFullYear();
                var r = currentYear - year;
                return r.toString();
            }else{
                return 'Возраст не определен';
            }
        }
    });

    var chartGroup = groups.group();
    var groupChart = dc.barChart(divId);

    groupChart
    .width(600)
    .height(200)
    .gap(5)
    .dimension(groups)
    .group({
        all: function() {
            var g = [];
            var all = chartGroup.all();
            all.forEach(function(d, i) {
                if(d.key != 'Возраст не определен') {
                    g.push({key: d.key, value: d.value});
                }
            });
            return g;
        }
    })
    .elasticY(true)
    .x(d3.scale.ordinal())
    .xUnits(dc.units.ordinal);

    $(divId + "-label").html("Возраст");
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

    $(divId + "-label").html("Города (ТОП " + (chartGroup.size() < citiesToShow ? chartGroup.size() : citiesToShow) + ")");
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

    $(divId + "-label").html("Группы (ТОП " + (chartGroup.size() < groupsToShow ? chartGroup.size() : groupsToShow) + ")");

    groupChart.onClick = function(d){
        var fname = d.key;
        var el = map[fname];
        if(el.type == 'profile'){
            var link = "http://vk.com/id" + el.id;
            window.open(link);
        }else{
            var screen_name = el.screen_name;
            var link = "http://vk.com/" + screen_name;
            window.open(link);
        }
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

function getUsersCities(owner_id, item_id, content_type, callback, error_callback){
    $.post('https://api.vk.com/method/execute.findUserCitiesNew?'+
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

function getOwnerById(id, callback){

    id = parseInt(id);

    if(id > 0){
        getUserById(id, callback, function(error){

        });
    }else{
        getGroupById(-id, callback, function(error){

        });
    }
}

function getUserById(uid, callback, error_callback){
    $.post('https://api.vk.com/method/users.get?'+
        'access_token=' + vkAccessToken +
        '&user_ids=' + uid,
        '&fields=photo_max',
        {}
    ).done(function(data){
        if(typeof data.response != "undefined"){
            callback(data.response[0]);
        }else{
            error_callback(data);
        }
    }).fail(function(error) {
        error_callback(error);
    });
}

function getGroupById(gid, callback, error_callback){
    $.post('https://api.vk.com/method/groups.getById?'+
        'access_token=' + vkAccessToken +
        '&group_ids=' + gid,
        {}
    ).done(function(data){

        if(typeof data.response != "undefined"){
            callback(data.response[0]);
        }else{
            error_callback(data);
        }
    }).fail(function(error) {
        error_callback(error);
    });
}