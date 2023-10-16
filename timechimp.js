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
chrome.webRequest.onCompleted.addListener((request) => {
        const url = request.url;
        if (url.match('.*/time/week/[^/]+/.*')) {
            const lastSlashIndex = url.lastIndexOf('/')
            const date = url.substring(lastSlashIndex + 1);
            return chrome.tabs.sendMessage(request.tabId, {name: 'weekChanged', date: date})
                .catch(() => console.log('Contents script not loaded yet. No issue, we can use the current date for the initial page load.'));
        }
        return;
    }, {
        // Limit to requests that indicate a week change
        urls: ['https://app.timechimp.com/api/time/week/*']
    }
)