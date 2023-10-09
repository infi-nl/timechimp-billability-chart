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
        // Gets 5 weeks which is the current week plus four weeks in the past
        const pastWeeks = message.pastWeeks ? message.pastWeeks : 5;
        // Additional 4 weeks to calculate the average. Get 2 times 4 weeks in order to skip weeks with only leave
        //const extraWeeksForAverage = 4 * 2;
        const extraWeeksForAverage = 4 * 2;
        const weekMs = 1000 * 60 * 60 * 24 * 7;
        const startDate = new Date().setTime(new Date() - ((pastWeeks + extraWeeksForAverage) * weekMs));
        const startDateString = toTimeChimpApiDate(startDate);
        const endDateString = toTimeChimpApiDate(new Date());

        const url = `https://app.timechimp.com/api/time/daterange/${startDateString}/${endDateString}`;
        console.log(`Getting times from url: ${url}`);
        fetch(url).then(response => response.json()).then()
            .then(json => json.filter(e => e.userId === message.userId))
            .then(json => sendResponse(json))
            .catch(error => console.log(error));
        return true; // Dummy return, will respond asynchronously.
    }
});

function toTimeChimpApiDate(startDate) {
    return new Date(startDate).toISOString().slice(0, 10);
}