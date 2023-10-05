chrome.cookies.onChanged.addListener(function(changeInfo) {
    console.log('Listening');
    if (changeInfo.cookie.name === '.AspNet.ApplicationCookie' && !changeInfo.removed) {
        const url = "https://app.timechimp.com/api/user/current";
        fetch(url).then(response => response.json())
            .then(responseJson => {
                console.log('Logged in with username ' + responseJson.userName);
                chrome.storage.local.set({userName: responseJson.userName});
            }).catch(error => console.log(error));
    }
});

chrome.runtime.onMessage.addListener(
    function(message, sender, sendResponse) {

        console.log('Getting hours');
        if (message.contentScriptQuery == "getHours") {
            const url = `https://app.timechimp.com/api/time/week/${message.userName}/2023-10-02`;
            console.log("Getting hours from url: " + url);
            fetch(url).then(response => response.json())
                .then(json => sendResponse(json))
                .catch(error => console.log(error));
            return true;  // Will respond asynchronously.
        }
    });