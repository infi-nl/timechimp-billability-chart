import { createOrUpdateChart } from './chart';
import { TimeChimpApi, User } from '../TimeChimpApi';
import { toIsoDate } from '../date';
import { endOfWeek, getWeek, startOfWeek, subWeeks } from 'date-fns';
import { calculateTimeStats } from './stats';
import { getSettings, updateSettings } from './settings';

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
        chartContainer = createBillabilityCard(addTimePanel);
    }

    updateLoadingState(true);
    const [times, company] = await Promise.all([
        getTimes(user.id, date, GET_TIMES_WEEKS),
        api.getCompany(),
    ]);
    updateLoadingState(false);

    const settings = getSettings();

    const stats = calculateTimeStats(
        times,
        settings.relativeToContractHours ? user.contractHours : undefined,
        SHOW_WEEKS,
        ROLLING_AVG_WEEKS,
    );
    createOrUpdateChart(
        stats,
        settings.relativeToContractHours,
        company.theme?.mainColor,
        chartContainer,
    );
}

function createBillabilityCard(addTimePanel: Element) {
    const card = document.createElement('div');
    card.className = 'card billability-card';
    card.id = 'billability-card';

    const chartContainer = document.createElement('div');
    chartContainer.className = 'chart';
    card.appendChild(chartContainer);

    const actions = document.createElement('div');
    card.appendChild(actions);
    actions.className = 'actions';

    const spinner = document.createElement('tc-spinner');
    actions.appendChild(spinner);
    spinner.className = 'title-date-spinner';
    const spinnerIcon = document.createElement('i');
    spinner.appendChild(spinnerIcon);
    spinnerIcon.id = 'billability-loading';
    spinnerIcon.className = 'fa fa-circle-o-notch fa-spin hidden';

    const toggleViewBtn = document.createElement('button');

    const setBtnText = () => {
        toggleViewBtn.textContent = `Relatief aan: ${
            getSettings().relativeToContractHours
                ? 'contracturen'
                : 'uren gewerkt'
        }`;
    };
    setBtnText();

    actions.appendChild(toggleViewBtn);
    toggleViewBtn.className = 'btn btn-timechimp-border';
    toggleViewBtn.addEventListener('click', () => {
        updateSettings({
            relativeToContractHours: !getSettings().relativeToContractHours,
        });
        setBtnText();
    });

    addTimePanel.appendChild(card);
    return chartContainer;
}

function updateLoadingState(loading: boolean) {
    const spinner = document.getElementById('billability-loading');
    if (spinner) {
        loading
            ? spinner.classList.remove('hidden')
            : spinner.classList.add('hidden');
    }
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
