import { Message } from '../message';

/**
 * The time registration form is an iframe in the webpage,
 * so we need to wait for that to load, and store the frame id per tab.
 * While unlikely, it is possible that someone has multiple TimeChimp tabs open.
 */
const frameByTab: Record<number, number> = {};
chrome.webRequest.onCompleted.addListener(
    (details) => {
        if (details.type === 'sub_frame') {
            frameByTab[details.tabId] = details.frameId;
        }
    },
    { urls: ['https://angular.timechimp.com/*'] },
);

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
        urls: ['https://web.timechimp.com/api/time/week/*'],
    },
);

/**
 * Listen for API calls related to time entries.
 */
chrome.webRequest.onCompleted.addListener(
    (request) => sendMessage(request.tabId, { type: 'refresh' }),
    {
        urls: [
            'https://web.timechimp.com/api/time',
            'https://web.timechimp.com/api/time/put',
            'https://web.timechimp.com/api/time/delete?*',
        ],
    },
);

async function sendMessage(tabId: number, msg: Message) {
    await chrome.tabs
        .sendMessage(tabId, msg, { frameId: frameByTab[tabId] })
        .catch(() =>
            console.debug(
                'Failed to send message to tab, content script is likely not loaded yet.',
            ),
        );
}
