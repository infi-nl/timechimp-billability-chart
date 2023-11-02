import { TimeChimpApi } from '../TimeChimpApi';
import { Message } from '../message';

const api = new TimeChimpApi();

/**
 * Listens to the login cookie being set, and if so get the username from TimeChimp and puts it in local storage.
 */
chrome.cookies.onChanged.addListener((changeInfo) => {
    if (
        changeInfo.cookie.name === '.AspNet.ApplicationCookie' &&
        !changeInfo.removed
    ) {
        api.getCurrentUser().then((user) => {
            console.debug('Logged in with user id ' + user.id);
            chrome.storage.local.set({ timeChimpUserId: user.id });
        });
    }
});

/**
 * Detects that the week has changed and the billability should be recalculated, on basis of requests to TimeChimp.
 */
chrome.webRequest.onCompleted.addListener(
    async (request) => {
        /**
         * Gets the user id based on the username.
         * Note that this is an admin-only endpoint,
         * so this will return undefined if called by an unauthorized user.
         */
        async function tryGetUserId(userName: string) {
            try {
                const users = await api.getUsers();
                return users.find((u) => u.userName === userName)!.id;
            } catch (e) {
                return undefined;
            }
        }

        // Get the date and the user email from the request to TimeChimp
        const matches = request.url.match('.*/time/week/([^/]+)/(.*)');
        if (matches?.length === 3) {
            let event = 'weekChanged';

            const userIdNew = await tryGetUserId(
                decodeURIComponent(matches[1]),
            );
            const userIdFromStorage = await chrome.storage.local.get([
                'timeChimpUserId',
            ]);

            if (userIdNew && userIdFromStorage.timeChimpUserId != userIdNew) {
                console.debug('Switching to user ' + userIdNew);
                event = 'userChanged';
                await chrome.storage.local.set({ timeChimpUserId: userIdNew });
            }

            const date = matches[2];
            await sendMessage(request.tabId, { type: event, date: date });
        }
    },
    {
        // Limit to requests that indicate a week change
        urls: ['https://app.timechimp.com/api/time/week/*'],
    },
);

/**
 * Listen for API calls related to time entries.
 */
chrome.webRequest.onCompleted.addListener(
    (request) => sendMessage(request.tabId, { type: 'refresh' }),
    {
        urls: [
            'https://app.timechimp.com/api/time',
            'https://app.timechimp.com/api/time/put',
            'https://app.timechimp.com/api/time/delete?*',
        ],
    },
);

async function sendMessage(tabId: number, msg: Message) {
    await chrome.tabs
        .sendMessage(tabId, msg)
        .catch(() =>
            console.debug(
                'Failed to send message to tab, content script is likely not loaded yet.',
            ),
        );
}
