import moment from 'moment';
import { createChart } from './charts';
import { Time, TimeChimpApi } from '../TimeChimpApi';

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

const billabilityChart = (function () {
    function createCard() {
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
            const hoursType = time.billable
                ? 'billableHours'
                : 'nonBillableHours';
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

    function getWeek(date: string | Date) {
        return moment(date).format('W');
    }

    /**
     * Group times by week, add times within a new object's "times" attribute.
     */
    function enrichWithWeeks(times: Time[]) {
        return times.reduce<TimeSummaryByWeek>((acc, time) => {
            const week = getWeek(time.date);
            acc[week] = acc[week] ?? { times: [] };
            acc[week]['times'].push(time);
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
            const leaveOnlyWeek = isLeaveOnlyWeek(weekSummary)
                ? 'leave only '
                : '';

            let weeksAdded = 0;
            let billableHoursLastWeeks = [];
            const weeksNumbers = []; // For logging only
            for (let j = week - 1; weeksAdded < 4 && weeks.includes(j); j--) {
                const weekSummary = timesGroupedByWeek[j];
                // Only add if there are any billable hours
                if (
                    weeksToDisplay.includes(j) ||
                    !isLeaveOnlyWeek(weekSummary)
                ) {
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

    function toIsoDate(date: number | Date) {
        return new Date(date).toISOString().slice(0, 10);
    }

    /**
     * Gets times from TimeChimp for the given weeks in the past, and filters out the ones for the given user id.
     * Optionally a date can be provided, by default it will get times for the current date.
     */
    async function getTimes(pastWeeks: number, userId: number, date: Date) {
        // Gets 5 weeks which is the current week plus four weeks in the past
        const weeks = pastWeeks ?? 5;
        // Additional 4 weeks to calculate the average. Get 2 times 4 weeks in order to skip weeks with only leave
        console.log(`Getting times for date ${date} in week ${getWeek(date)}`);
        const extraWeeksForAverage = 4 * 2;
        const weekMs = 1000 * 60 * 60 * 24 * 7;
        const startDate = new Date().setTime(
            date.getTime() - (weeks + extraWeeksForAverage) * weekMs,
        );
        const startDateString = toIsoDate(startDate);
        const endDateString = toIsoDate(date);

        const times = await api.getTimesDateRange(
            startDateString,
            endDateString,
        );
        return times.filter((e) => e.userId === userId);
    }

    /**
     * Generates a billability for the given times within the container provided.
     */
    function generateBillabilityChart(
        times: Time[],
        chartContainer: HTMLElement,
    ) {
        const timesGroupedByWeek = enrichWithWeeks(times);
        enrichWithMetrics(timesGroupedByWeek);
        const timesGroupedWithAverages = enrichWithAverages(timesGroupedByWeek);
        createChart(chartContainer, timesGroupedWithAverages);
    }

    /**
     * Adds a billability chart on basis of times for the given date from TimeChimp.
     */
    async function addBillabilityChart(date?: Date) {
        const addTimePanel = document.querySelector('.col-md-4');
        if (!addTimePanel?.querySelector('form[name="addTimeForm"]')) {
            console.log('Add time form not found, returning');
            return;
        }

        let chartContainer = addTimePanel.querySelector('#billability-card');
        if (!chartContainer) {
            chartContainer = addTimePanel.appendChild(createCard());
        }

        const storageObject = await chrome.storage.local.get([
            'timeChimpUserId',
        ]);
        const times = await getTimes(
            5,
            storageObject.timeChimpUserId,
            date ?? new Date(),
        );
        generateBillabilityChart(times, chartContainer as HTMLElement);
    }

    return {
        add: addBillabilityChart,
    };
})();

/**
 * Listens to when the week has changed, and if so renews and replaces the billability chard.
 */
chrome.runtime.onMessage.addListener(function (request, _, sendResponse) {
    const dateString = request['date'];
    const event = request['name'];
    if (dateString && (event === 'weekChanged' || event === 'userChanged')) {
        const date = moment.utc(dateString).toDate();
        billabilityChart
            .add(date)
            .then(() => sendResponse())
            .catch((e) =>
                console.error(
                    'Error when adding billability chart after changing dates: ' +
                        e,
                ),
            );
    }
});

billabilityChart
    .add()
    .catch((e) => console.error('Error when adding billability chart: ' + e));
