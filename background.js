var vkCLientId           = '4346186',
    vkRequestedScopes    = '',
    vkAuthenticationUrl  = 'https://oauth.vk.com/authorize?client_id=' + vkCLientId +
        '&scope=' + vkRequestedScopes +
        '&redirect_uri=http%3A%2F%2Fvk.com' +
        '&display=page' +
        '&response_type=token';

function relogin(){

    chrome.tabs.create({url: vkAuthenticationUrl, selected: false}, function (tab) {

        var tabUpdateListener = function(tabid, changeInfo, tab){
            if(tabid == tab.id && changeInfo.url !== undefined
                    && changeInfo.status === "loading" && changeInfo.url.indexOf('api.vk.com/blank.html') > -1){

                localStorage["vkAccessToken"] = getUrlParameterValue(changeInfo.url, 'access_token');

                chrome.tabs.onUpdated.removeListener(tabUpdateListener);

                chrome.tabs.remove(tabid, function() { });

            }
        };

        chrome.tabs.onUpdated.addListener(tabUpdateListener);

    });
}

function login(){
    chrome.tabs.create({url: vkAuthenticationUrl, selected: true}, function (tab) {

        var tabUpdateListener = function(tabid, changeInfo, tab){
            if(tabid == tab.id && changeInfo.url !== undefined
                    && changeInfo.status === "loading" && changeInfo.url.indexOf('api.vk.com/blank.html') > -1){

                localStorage["vkAccessToken"] = getUrlParameterValue(changeInfo.url, 'access_token');

                chrome.tabs.onUpdated.removeListener(tabUpdateListener);

                var homeUrl = chrome.extension.getURL("home.html");

                chrome.tabs.update(tabid, {url: homeUrl});

            }
        };

        chrome.tabs.onUpdated.addListener(tabUpdateListener);

    });
}

chrome.browserAction.onClicked.addListener(function(tab) {

    login();

});

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.method == "getLocalStorage"){

        var vkAccessToken = localStorage["vkAccessToken"];
        sendResponse({'vkAccessToken' : vkAccessToken});

    } else if (request.method == "OPEN_NEW_STAT_WINDOW"){

        var homeUrl = chrome.extension.getURL("home.html") + "#ref=" + request.ref;

        chrome.tabs.create({url: homeUrl, selected: true}, function (tab) { });

        sendResponse({}); // snub them.

    } if (request.method == "RELOGIN"){

        relogin();

        sendResponse({}); // snub them.

    } else {

        sendResponse({}); // snub them.

    }
});

function getUrlParameterValue(url, parameterName) {

    var urlParameters  = url.substr(url.indexOf("#") + 1),
        parameterValue = "",
        index,
        temp;

    urlParameters = urlParameters.split("&");

    for (index = 0; index < urlParameters.length; index += 1) {
        temp = urlParameters[index].split("=");

        if (temp[0] === parameterName) {
            return temp[1];
        }
    }

    return parameterValue;
}