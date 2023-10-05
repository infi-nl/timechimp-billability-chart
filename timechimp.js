chrome.cookies.onChanged.addListener(function(changeInfo) {
    console.log('Listening');
    if (changeInfo.cookie.name === '.AspNet.ApplicationCookie' && !changeInfo.removed) {
        const url = "https://app.timechimp.com/api/user/current";
        fetch(url).then(response => response.json())
            .then(responseJson => {
                console.log('Logged in with user id ' + responseJson.id);
                chrome.storage.local.set({timeChimpUserId: responseJson.id});
            }).catch(error => console.log(error));
    }
});

chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    if (message.contentScriptQuery == "getTimes") {
        console.log('Getting times');
        const pastWeeks = message.pastWeeks ? message.pastWeeks : 5;
        const weekMs = 1000 * 60 * 60 * 24 * 7;
        const startDate = new Date().setTime(new Date() - (pastWeeks * weekMs));
        const startDateString = toTimeChimpApiDate(startDate);
        const endDateString = toTimeChimpApiDate(new Date());

        const url = `https://app.timechimp.com/api/time/daterange/${startDateString}/${endDateString}`;
        console.log(`Getting times from url: ${url}`);
        fetch(url).then(response => response.json()).then()
            .then(json => json.filter(e => e.userId === message.userId)).then(json => sendResponse(json))
            .catch(error => console.log(error));
        return true; // Dummy return, will respond asynchronously.
    }
});

function toTimeChimpApiDate(startDate) {
    return new Date(startDate).toISOString().slice(0, 10);
}