import { createOrUpdateChart } from './chart';
import { Time, TimeChimpApi } from '../TimeChimpApi';
import { toIsoDate } from '../date';
import { endOfWeek, getWeek, startOfWeek, subWeeks } from 'date-fns';

const api = new TimeChimpApi();

export type TimeSummaryByWeek = Record<string, WeekSummary>;

interface WeekSummary {
    times: Time[];
    billableHours: number;
    nonBillableHours: number;
    totalHours: number;
    billableHoursPercentage: number;
    nonBillableHoursPercentage: number;
    averageBillableHours: number;
}

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
    const times = await getTimes(storageObject.timeChimpUserId, date);
    generateBillabilityChart(times, chartContainer as HTMLElement);
}

function createBillabilityCard() {
    const card = document.createElement('div');
    card.className = 'card billability-card';
    card.id = 'billability-card';
    return card;
}

/**
 * Adds metrics billable, non-billable and total hours.
 */
function addHoursMetrics(weekSummary: WeekSummary) {
    weekSummary.billableHours = 0;
    weekSummary.nonBillableHours = 0;
    weekSummary.totalHours = 0;
    weekSummary.times.forEach((time) => {
        const hoursType = time.billable ? 'billableHours' : 'nonBillableHours';
        weekSummary[hoursType] += time.hours;
        weekSummary.totalHours += time.hours;
    });
}

/**
 * Adds for metrics billable, non-billable and total hours the percentages.
 */
function addHoursPercentages(weekSummary: WeekSummary) {
    weekSummary.billableHoursPercentage =
        (100 * weekSummary.billableHours) / weekSummary.totalHours;
    weekSummary.nonBillableHoursPercentage =
        100 - weekSummary.billableHoursPercentage;
}

/**
 * Group times by week, add times within a new object's "times" attribute.
 */
function groupTimesByWeek(times: Time[]) {
    return times.reduce<TimeSummaryByWeek>((acc, time) => {
        const week = getWeek(new Date(time.date));
        acc[week] = acc[week] ?? { times: [] };
        acc[week].times.push(time);
        return acc;
    }, {});
}

function isLeaveOnlyWeek(weekSummary: WeekSummary) {
    return !weekSummary.times.some(
        (time) => time.taskName != 'Verlof' && time.taskName != 'Feestdag',
    );
}

/**
 * Adds averages for the last 5 weeks. Skips leave only weeks when calculating the averages.
 */
function enrichWithAverages(timesGroupedByWeek: TimeSummaryByWeek) {
    const weeks = Object.keys(timesGroupedByWeek).reverse().map(Number);

    // Calculate averages for first 5 weeks, only for the latest weeks.
    const weeksShown = 5;
    const weeksToDisplay = weeks.slice(
        0,
        weeks.length < weeksShown ? weeks.length : weeksShown,
    );
    const enrichedWithAverages: TimeSummaryByWeek = {};

    for (const week of weeksToDisplay) {
        const weekSummary = timesGroupedByWeek[week];
        const leaveOnlyWeek = isLeaveOnlyWeek(weekSummary) ? 'leave only ' : '';

        let weeksAdded = 0;
        let billableHoursLastWeeks = [];
        const weeksNumbers = []; // For logging only
        for (let j = week - 1; weeksAdded < 4 && weeks.includes(j); j--) {
            const weekSummary = timesGroupedByWeek[j];
            // Only add if there are any billable hours
            if (weeksToDisplay.includes(j) || !isLeaveOnlyWeek(weekSummary)) {
                billableHoursLastWeeks.push(
                    weekSummary.billableHoursPercentage,
                );
                weeksNumbers.push(j);
                weeksAdded++;
            } else {
                console.debug(`Skipping leave only week ${j}`);
            }
        }

        // Sum total billable hours
        const billableHoursTotal = billableHoursLastWeeks.reduce(
            (acc, value) => acc + value,
            0,
        );
        // Calculate average and prevent divide by zero
        let averageBillableHours = billableHoursTotal
            ? billableHoursTotal / billableHoursLastWeeks.length
            : 0;
        weekSummary.averageBillableHours = averageBillableHours;
        console.debug(
            `Adding ${leaveOnlyWeek}week ${week} with ${averageBillableHours} average billable hours. ` +
                `Calculated On basis of ${billableHoursLastWeeks.length} values ` +
                `${JSON.stringify(
                    billableHoursLastWeeks,
                )}, from weeks ${JSON.stringify(weeksNumbers)}`,
        );
        enrichedWithAverages[week] = weekSummary;
    }
    return enrichedWithAverages;
}

// Add metrics billable, non-billable and total hours, and associated percentages.
function enrichWithMetrics(timesGroupedByWeek: TimeSummaryByWeek) {
    for (const weekSummary of Object.values(timesGroupedByWeek)) {
        addHoursMetrics(weekSummary);
        addHoursPercentages(weekSummary);
    }
}

/**
 * Gets times from TimeChimp for the given weeks in the past, and filters out the ones for the given user id.
 * Optionally a date can be provided, by default it will get times for the current date.
 */
async function getTimes(userId: number, date: Date) {
    console.debug(
        `Getting times for ${toIsoDate(date)} in week ${getWeek(date)}`,
    );

    // Get 10 past weeks in order to skip weeks with only leave.
    const startDate = toIsoDate(subWeeks(startOfWeek(date), 10));
    const endDate = toIsoDate(endOfWeek(date));

    console.debug(`Getting all times from ${startDate} to ${endDate}`);
    const times = await api.getTimesDateRange(startDate, endDate);
    return times.filter((e) => e.userId === userId);
}

/**
 * Generates a billability for the given times within the container provided.
 */
function generateBillabilityChart(times: Time[], chartContainer: HTMLElement) {
    const timesGroupedByWeek = groupTimesByWeek(times);
    enrichWithMetrics(timesGroupedByWeek);
    const timesGroupedWithAverages = enrichWithAverages(timesGroupedByWeek);
    createOrUpdateChart(chartContainer, timesGroupedWithAverages);
}
