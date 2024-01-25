import { createOrUpdateChart } from './chart';
import { TimeChimpApi, User } from '../TimeChimpApi';
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
export async function addBillabilityChart(date: Date, user: User) {
    await doAddBillabilityChart(date, user).catch((e) =>
        console.error(`Error when adding billability chart: ${e}`),
    );
}

async function doAddBillabilityChart(date: Date, user: User) {
    const addTimePanel = document.querySelector('.col-md-4');
    if (!addTimePanel?.querySelector('form[name="addTimeForm"]')) {
        console.debug('Add time form not found, returning');
        return;
    }

    // Check if the chart container already exists.
    // If not, create a new element which can be used as the chart parent.
    let chartContainer: HTMLElement | undefined;
    if (!addTimePanel.querySelector('#billability-card')) {
        chartContainer = addTimePanel.appendChild(createBillabilityCard());
    }

    const [times, company] = await Promise.all([
        getTimes(user.id, date, GET_TIMES_WEEKS),
        api.getCompany(),
    ]);

    // TODO: Only set this when that setting is enabled.
    const contractHours = user.contractHours;

    const stats = calculateTimeStats(
        times,
        contractHours,
        SHOW_WEEKS,
        ROLLING_AVG_WEEKS,
    );
    createOrUpdateChart(
        stats,
        !!contractHours,
        company.theme?.mainColor,
        chartContainer,
    );
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
        `Getting times for user ${userId}, ${toIsoDate(date)} in week ${getWeek(
            date,
        )}`,
    );

    const startDate = toIsoDate(subWeeks(startOfWeek(date), weeks));
    const endDate = toIsoDate(endOfWeek(date));

    console.debug(`Getting all times from ${startDate} to ${endDate}`);
    const times = await api.getTimesDateRange(startDate, endDate);
    return times.filter((e) => e.userId === userId);
}
