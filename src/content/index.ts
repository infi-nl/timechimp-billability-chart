import 'highcharts/css/highcharts.css';
import './style.css';
import { addBillabilityChart } from './add-billability-chart';
import { Message } from '../message';
import setDefaultOptions from 'date-fns/setDefaultOptions';

let currentDate = new Date();

// Default date-fns options.
setDefaultOptions({
    // Weeks start on Monday.
    weekStartsOn: 1,
    // Week number 1 should contain the 4th on January.
    firstWeekContainsDate: 4,
});

/**
 * Listens to incoming messages, and update the billability chart.
 */
chrome.runtime.onMessage.addListener(async (msg: Message) => {
    console.debug(`Received message: ${JSON.stringify(msg)}`);

    if (msg.date) {
        currentDate = new Date(msg.date);
    }

    await addBillabilityChart(currentDate);
});

addBillabilityChart(currentDate);
