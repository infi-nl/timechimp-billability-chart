import { Message } from '../message';

const API_URL = 'https://web.timechimp.com';

/**
 * Detects that the week has changed and the billability should be recalculated, on basis of requests to TimeChimp.
 */
chrome.webRequest.onCompleted.addListener(
    async (request) => {
        // Get the date and the user email from the request to TimeChimp
        const matches = request.url.match('.*/time/week/([^/]+)/(.*)');

        if (matches?.length === 3) {
            await sendMessage(request.tabId, {
                type: 'weekChanged',
                date: decodeURIComponent(matches[2]),
                userName: decodeURIComponent(matches[1]),
            });
        } else {
            console.warn(`Failed to match URL: ${request.url}`);
        }
    },
    {
        // Limit to requests that indicate a week change
        urls: [`${API_URL}/api/time/week/*`],
    },
);

/**
 * Listen for API calls related to time entries.
 */
chrome.webRequest.onCompleted.addListener(
    function (request) {
        if (request.method === 'GET') {
            // Exclude GET requests as that could trigger endless loops
            console.trace('abort sending message because of ' + request.method + ' ' + request.url);
            return;
        }

        console.debug('Sending refresh triggered by ' + request.method + ' ' + request.url + ' to tabId: ' + request.tabId);
        return sendMessage(request.tabId, { type: 'refresh' });
    },
    {
        urls: [
            `${API_URL}/api/time`, // Using POST method when adding a new entry
            `${API_URL}/api/time/*`, // Using DELETE or PUT method when deleting or updating an entry
            `${API_URL}/api/time/copy/*`, // Using POST method when copying entry
        ],
    },
);

async function sendMessage(tabId: number, msg: Message) {
    await chrome.tabs
        .sendMessage(tabId, msg)
        .catch((error) => {
                console.error(
                    'Failed to send message to tab (' + tabId + '), content script is likely not loaded yet. ' + error
                );
            },
        );
}
