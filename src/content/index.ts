import 'highcharts/css/highcharts.css';
import './style.css';
import { addBillabilityChart } from './add-billability-chart';
import { Message } from '../message';
import setDefaultOptions from 'date-fns/setDefaultOptions';
import { TimeChimpApi, User } from '../TimeChimpApi';

// Default date-fns options.
setDefaultOptions({
    // Weeks start on Monday.
    weekStartsOn: 1,
    // Week number 1 should contain the 4th on January.
    firstWeekContainsDate: 4,
});

const api = new TimeChimpApi();

let currentDate = new Date();
let currentUser: User;

/**
 * Listens to incoming messages, and update the billability chart.
 */
chrome.runtime.onMessage.addListener(async (msg: Message) => {
    console.debug(`Received message: ${JSON.stringify(msg)}`);

    if (msg.date) {
        currentDate = new Date(msg.date);
    }

    if (msg.userName && msg.userName !== currentUser?.userName) {
        await updateUserInfo(msg.userName);
    }

    await addBillabilityChart(currentDate, currentUser?.id);
});

/**
 * Get and store user info based on a userName.
 * If no userName is given, or if this user is not allowed to list all users,
 * the user data for the current user is used.
 */
async function updateUserInfo(userName?: string) {
    if (userName) {
        console.debug(`Getting user info for: ${userName}`);
        currentUser = await api
            .getUserByUserName(userName)
            .catch(() => api.getCurrentUser());
    } else {
        console.debug('Getting current user.');
        currentUser = await api.getCurrentUser();
    }
}
