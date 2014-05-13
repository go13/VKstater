chrome.browserAction.onClicked.addListener(function(tab) {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {

        var vkCLientId           = '4346186',
            vkRequestedScopes    = '',
            vkAuthenticationUrl  = 'https://oauth.vk.com/authorize?client_id=' + vkCLientId +
                '&scope=' + vkRequestedScopes +
                '&redirect_uri=http%3A%2F%2Fvk.com' +
                '&display=page' +
                '&response_type=token';

        chrome.tabs.create({url: vkAuthenticationUrl, selected: true}, function (tab) {

            var tabUpdateListener = function(tabid, changeInfo, tab){
                if(tabid == tab.id && changeInfo.url !== undefined
                        && changeInfo.status === "loading" && changeInfo.url.indexOf('api.vk.com/blank.html') > -1){

                    var vkAccessToken = getUrlParameterValue(changeInfo.url, 'access_token')

                    //chrome.storage.local.set({'vkAccessToken': vkAccessToken}, function() {});

                    localStorage["vkAccessToken"] = vkAccessToken;

                    chrome.tabs.onUpdated.removeListener(tabUpdateListener);

                    chrome.tabs.remove(tabid);
                }
            }

            chrome.tabs.onUpdated.addListener(tabUpdateListener);

        });
   });
});

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.method == "getLocalStorage"){
        var vkAccessToken = localStorage["vkAccessToken"];
        sendResponse({'vkAccessToken' : vkAccessToken});
    }else
      sendResponse({}); // snub them.
});

function getUrlParameterValue(url, parameterName) {
    "use strict";

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