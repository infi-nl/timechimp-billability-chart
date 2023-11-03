import { createOrUpdateChart } from './chart';
import { TimeChimpApi } from '../TimeChimpApi';
import { toIsoDate } from '../date';
import { endOfWeek, getWeek, startOfWeek, subWeeks } from 'date-fns';
import { calculateTimeStats } from './stats';

const api = new TimeChimpApi();

// How many weeks to show in the chart.
const SHOW_WEEKS = 5;
// How many weeks to use in the rolling average.
const ROLLING_AVG_WEEKS = 5;
// How many weeks to retrieve time entries from.
// Get some extra to account for any leave-only weeks we need to skip.
const GET_TIMES_WEEKS = SHOW_WEEKS + ROLLING_AVG_WEEKS * 2;

/**
 * Adds a billability chart on basis of times for the given date from TimeChimp.
 */
export async function addBillabilityChart(date: Date) {
    await doAddBillabilityChart(date).catch((e) =>
        console.error(`Error when adding billability chart: ${e}`),
    );
}

async function doAddBillabilityChart(date: Date) {
    const addTimePanel = document.querySelector('.col-md-4');
    if (!addTimePanel?.querySelector('form[name="addTimeForm"]')) {
        console.debug('Add time form not found, returning');
        return;
    }

    let chartContainer = addTimePanel.querySelector('#billability-card');
    if (!chartContainer) {
        chartContainer = addTimePanel.appendChild(createBillabilityCard());
    }

    const storageObject = await chrome.storage.local.get(['timeChimpUserId']);
    const times = await getTimes(
        storageObject.timeChimpUserId,
        date,
        GET_TIMES_WEEKS,
    );

    const stats = calculateTimeStats(times, SHOW_WEEKS, ROLLING_AVG_WEEKS);
    createOrUpdateChart(chartContainer as HTMLElement, stats);
}

function createBillabilityCard() {
    const card = document.createElement('div');
    card.className = 'card billability-card';
    card.id = 'billability-card';
    return card;
}

/**
 * Gets times from TimeChimp for the given weeks in the past, and filters out the ones for the given user id.
 * Optionally a date can be provided, by default it will get times for the current date.
 */
async function getTimes(userId: number, date: Date, weeks: number) {
    console.debug(
        `Getting times for ${toIsoDate(date)} in week ${getWeek(date)}`,
    );

    const startDate = toIsoDate(subWeeks(startOfWeek(date), weeks));
    const endDate = toIsoDate(endOfWeek(date));

    console.debug(`Getting all times from ${startDate} to ${endDate}`);
    const times = await api.getTimesDateRange(startDate, endDate);
    return times.filter((e) => e.userId === userId);
}
