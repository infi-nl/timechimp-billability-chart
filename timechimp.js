chrome.runtime.onMessage.addListener(
    function(message, sender, sendResponse) {
        if (message.contentScriptQuery == "getHours") {
            const url = "https://api.timechimp.com/v1/time/user/204552";
            fetch(url)
                .then(response => response.json())
                .then(json => sendResponse(json))
                .catch(error => console.log(error));
            return true;  // Will respond asynchronously.
        }
    });