import Highcharts from 'highcharts';
import { TimeSummaryByWeek } from './add-billability-chart';

// Ensure the requestAnimationFrame function is bound to the window.
// Without this, Highcharts animations won't work properly in Firefox because of strict mode.
window.requestAnimationFrame = window.requestAnimationFrame.bind(window);

const textStyle = {
    fontSize: '12px',
};

let chart: Highcharts.Chart;

export function createOrUpdateChart(
    element: HTMLElement,
    timesGroupedByWeek: TimeSummaryByWeek,
) {
    const billableHours: number[] = [];
    const nonBillableHours: number[] = [];
    const averageBillableHours: number[] = [];

    for (const week of Object.keys(timesGroupedByWeek)) {
        const weekSummary = timesGroupedByWeek[week];
        billableHours.push(weekSummary.billableHoursPercentage);
        nonBillableHours.push(weekSummary.nonBillableHoursPercentage);
        averageBillableHours.push(weekSummary.averageBillableHours);
    }

    const options: Highcharts.Options = {
        chart: {
            className: 'highcharts-light',
        },
        title: {
            text: 'Facturabiliteit',
        },
        xAxis: {
            categories: Object.keys(timesGroupedByWeek),
            title: {
                text: 'Week',
                style: textStyle,
            },
            labels: {
                style: textStyle,
            },
        },
        yAxis: {
            min: 0,
            max: 100,
            tickInterval: 25,
            title: {
                text: undefined,
            },
            labels: {
                format: '{text}%',
                style: textStyle,
            },
        },
        tooltip: {
            shared: true,
            valueSuffix: '%',
            valueDecimals: 0,
            headerFormat: 'Week {point.key}<br>',
            style: textStyle,
        },
        plotOptions: {
            column: {
                stacking: 'normal',
            },
        },
        series: [
            {
                name: 'Niet facturabel',
                type: 'column',
                data: nonBillableHours,
                color: '#e6e4e3',
            },
            {
                name: 'Facturabel',
                type: 'column',
                data: billableHours,
                color: '#f36f21',
            },
            {
                name: 'Gem. facturabiliteit',
                type: 'spline',
                data: averageBillableHours,
                tooltip: {
                    valueSuffix: '% (afgelopen 5 weken)',
                },
                color: '#12121c',
                lineWidth: 2,
            },
        ],
        accessibility: {
            enabled: false,
        },
        legend: {
            itemStyle: textStyle,
        },
    };

    if (chart) {
        console.debug('Updating existing chart');
        chart.update(options);
    } else {
        console.debug('Creating new chart');
        chart = Highcharts.chart(element, options);
    }
}
