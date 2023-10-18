/**
 * Listens to the login cookie being set, and if so get the username from TimeChimp and puts it in local storage.
 */
chrome.cookies.onChanged.addListener(function(changeInfo) {
    console.log('Listening');
    if (changeInfo.cookie.name === '.AspNet.ApplicationCookie' && !changeInfo.removed) {
        const url = "https://app.timechimp.com/api/user/current";
        fetch(url).then(response => response.json())
            .then(responseJson => {
                console.debug('Logged in with user id ' + responseJson.id);
                chrome.storage.local.set({timeChimpUserId: responseJson.id});
            }).catch(error => console.log(error));
    }
});

/**
 * Detects that the week has changed and the billability should be recalculated, on basis of requests to TimeChimp.
 */
chrome.webRequest.onCompleted.addListener(async (request) => {
        // Gets the id based on the userName
        async function getUserId(userName) {
            const users = await fetch('https://app.timechimp.com/api/user').then(response => response.json());
            return users.find((u) => u.userName === userName).id;
        }

        // Get the date and the user email from the request to TimeCimp
        const matches = request.url.match('.*/time/week/([^/]+)/(.*)');
        if (matches.length == 3) {
            let event = 'weekChanged';
            const userIdNew = await getUserId(decodeURIComponent(matches[1]));
            const userIdFromStorage = await chrome.storage.local.get(["timeChimpUserId"]);
            if (userIdFromStorage.timeChimpUserId != userIdNew) {
                console.log('Switching to user ' + userIdNew);
                event = 'userChanged';
                await chrome.storage.local.set({timeChimpUserId: userIdNew});
            }

            const date = matches[2];
            return chrome.tabs.sendMessage(request.tabId, {name: event, date: date})
                .catch(() => console.log('Contents script not loaded yet. No issue, we can use the current date for the initial page load.'));
        }
        return;
    }, {
        // Limit to requests that indicate a week change
        urls: ['https://app.timechimp.com/api/time/week/*']
    }
)