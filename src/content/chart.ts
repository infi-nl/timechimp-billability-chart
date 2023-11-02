import Highcharts from 'highcharts';
import { TimeSummaryByWeek } from './add-billability-chart';
import { hoursToClockNotation } from '../date';

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
    const totalHours: number[] = [];

    for (const weekSummary of Object.values(timesGroupedByWeek)) {
        billableHours.push(weekSummary.billableHoursPercentage);
        nonBillableHours.push(weekSummary.nonBillableHoursPercentage);
        averageBillableHours.push(weekSummary.averageBillableHours);
        totalHours.push(weekSummary.totalHours);
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
            labels: {
                style: textStyle,
                formatter: (label) => {
                    const weekNum = label.value;
                    const hours = hoursToClockNotation(
                        timesGroupedByWeek[weekNum].totalHours,
                    );
                    return `Week ${weekNum}<br><b>${hours}</b>`;
                },
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
                tooltip: {
                    valueSuffix: '%',
                    valueDecimals: 0,
                },
            },
            {
                name: 'Facturabel',
                type: 'column',
                data: billableHours,
                color: '#f36f21',
                tooltip: {
                    valueSuffix: '%',
                    valueDecimals: 0,
                },
            },
            {
                name: 'Gem. facturabiliteit',
                type: 'spline',
                data: averageBillableHours,
                color: '#12121c',
                lineWidth: 2,
                tooltip: {
                    valueSuffix: '% (afgelopen 5 weken)',
                    valueDecimals: 0,
                },
            },
            {
                name: 'Uren gewerkt',
                type: 'spline',
                data: totalHours,
                color: '#6d6d77',
                showInLegend: false,
                opacity: 0,
                tooltip: {
                    pointFormatter: function () {
                        const hours = hoursToClockNotation(this.y ?? 0);
                        const format = `<span style='color:{point.color}'>●</span> {series.name}: <b>${hours}</b><br/>`;
                        return this.tooltipFormatter.call(this, format);
                    },
                },
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
