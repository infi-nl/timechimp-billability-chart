import 'highcharts/css/highcharts.css';
import './style.css';
import { addBillabilityChart } from './add-billability-chart';
import { Message } from '../message';
import setDefaultOptions from 'date-fns/setDefaultOptions';
import { TimeChimpApi, User } from '../TimeChimpApi';
import { settingsUpdateEvent } from './settings';

// Default date-fns options.
setDefaultOptions({
    // Weeks start on Monday.
    weekStartsOn: 1,
    // Week number 1 should contain the 4th of January.
    firstWeekContainsDate: 4,
});

const api = new TimeChimpApi();

let currentDate = new Date();
let currentUser: User | undefined;

settingsUpdateEvent.addListener(() => render());

/**
 * Listens to incoming messages, and update the billability chart.
 */
chrome.runtime.onMessage.addListener(async (msg: Message) => {
    console.debug(`Received message: ${JSON.stringify(msg)}`);

    if (msg.date) {
        currentDate = new Date(msg.date);
    }

    await render(msg.userName);
});

async function render(userName?: string) {
    if (!currentUser || (userName && userName !== currentUser.userName)) {
        currentUser = await getUser(userName);
    }

    await addBillabilityChart(currentDate, currentUser);
}

/**
 * Get the user info based on a userName.
 * If no userName is given, or if this user is not allowed to list all users,
 * the user data for the current user is returned.
 */
function getUser(userName?: string) {
    if (userName) {
        console.debug(`Getting user info for: ${userName}`);
        return api
            .getUserByUserName(userName)
            .catch(() => api.getCurrentUser());
    } else {
        console.debug('Getting current user.');
        return api.getCurrentUser();
    }
}

setTimeout(async () => {
    await render();
}, 1000);
