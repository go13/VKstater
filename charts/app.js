var vkAccessToken = null;

$(window).ready(function(){
    chrome.runtime.sendMessage({method: "getLocalStorage"}, function(response) {
            vkAccessToken = response.vkAccessToken;
            if(vkAccessToken){
                var link = 'http://vk.com/feed?w=likes%2Fwall-33393308_332719';

                var matches = link.match(/(wall|wall_reply|photo|photo_comment|video|video_comment|note|audio|topic_comment)(-?\d+)_(\d+)/);

                getUsersCities(matches[2], matches[3], matches[1], function(data){

                    var cf = crossfilter(data.response);

                    drawCityChart(cf, "#chart-city");

                    drawGroupChart(cf, "#chart-groups");

                    drawGenderChart(cf, "#chart-gender");


                    dc.renderAll();

                });
            }
    });
});

function drawCityChart(cf, divId){
    var cities = cf.dimension(function(d){
        if(typeof d.city == "undefined"){
            return 'Город не задан';
        }else{
            return d.city.title;
        }
    });

    //cities.top(50);

    var cityGroup = getTopGroup(cities.group(), 30);
    //var cityGroup = cities.group();

    dc.barChart(divId)
    .width(1000).height(400)
    .gap(3)
    .dimension(cities)
    .group(cityGroup)
    //.data(function(chart){return chart;})
    /*.label(function(d) {
        return d.key + ' (' + d.value + ')';
    })*/
    //.ordering(function(d) { return -1.0 * +d.value; })
    .on("postRender", function(chart){
        chart.svg()
            .selectAll('.axis.x text')
            .style("text-anchor","start")
            .attr("dx",function(d){return"0.6em";})
            .attr("dy",function(d){return"-5px";})
            .attr("transform", function(d) {
                     return "rotate(-90)"
                 });;

    })
    .xUnits(dc.units.ordinal)
    .x(d3.scale.ordinal());
}

function getTopGroup(group, top){
    return {
       all : function () {

        var g = [];
        var all = group.all();

        all.sort(function(a, b){
            return a.value - b.value;
        });

        for(var i = all.length - 1 - top; i < all.length - 1 && i >= 0; i++){
            var d = all[i];
            g.push({key : d.key, value : d.value})
        }

        return g;
       }
     };
}


function drawGroupChart(cf, divId){

    var authors = cf.dimension(function(d){
        if(typeof d.city == "undefined"){
            return 'Город не задан';
        }else{
            return d.city.title;
        }
    });
    var authorsGroup = authors.group();

    var authorChart = dc.rowChart(divId);
    authorChart
    .width(600)
    .height(1300)
    .ordinalColors(['rgb(49, 130, 189)','rgb(198, 219, 239)'])
    .gap(2)
    .cap(50)
    .ordering(function(d) { return -1.0 * +d.value; })
    .dimension(authors)
    .group(authorsGroup)
    .elasticX(true)
    .label(function(d) {
        return d.key + ' (' + d.value + ')';
    })
    .othersLabel("Другие")
    .xAxis().tickFormat(d3.format("d"));
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

    var NameGender = { 1 : "Мужчины", 2 : "Женщины" , "" : "Пол не задан" };

    var SymbolGender = {1:"\u2642",2:"\u2640","":""};

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
        error_callback("Произошла ошибка: Не удалось соединиться с сервером Вконтакте");
    });
}