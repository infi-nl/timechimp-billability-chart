import Highcharts from 'highcharts';
import { hoursToClockNotation } from '../date';
import { RollingStats } from './stats';

// Ensure the requestAnimationFrame function is bound to the window.
// Without this, Highcharts animations won't work properly in Firefox because of strict mode.
window.requestAnimationFrame = window.requestAnimationFrame.bind(window);

const textStyle = {
    fontSize: '12px',
};

let chart: Highcharts.Chart | undefined;

export function createOrUpdateChart(
    rollingStats: RollingStats[],
    element?: HTMLElement,
) {
    const options: Highcharts.Options = {
        chart: {
            className: 'highcharts-light',
        },
        title: {
            text: 'Facturabiliteit',
        },
        xAxis: {
            categories: rollingStats.map((s) => s.week.toString()),
            labels: {
                style: textStyle,
                formatter: (label) => {
                    const weekNum = label.value;
                    const statsForWeek = rollingStats.find(
                        (s) => s.week.toString() === weekNum.toString(),
                    )!;
                    const hours = hoursToClockNotation(statsForWeek.totalHours);
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
                data: rollingStats.map((s) => s.nonBillableHoursPercentage),
                color: '#e6e4e3',
                tooltip: {
                    valueSuffix: '%',
                    valueDecimals: 0,
                },
            },
            {
                name: 'Facturabel',
                type: 'column',
                data: rollingStats.map((s) => s.billableHoursPercentage),
                color: '#f36f21',
                tooltip: {
                    valueSuffix: '%',
                    valueDecimals: 0,
                },
            },
            {
                name: 'Gem. facturabiliteit',
                type: 'spline',
                data: rollingStats.map((s) => s.averageBillablePercentage),
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
                data: rollingStats.map((s) => s.totalHours),
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

    if (element) {
        console.debug('Creating new chart.');
        chart = Highcharts.chart(element, options);
    } else if (chart) {
        console.debug('Updating existing chart.');
        chart.update(options);
    } else {
        console.error('No chart container given and no existing chart set.');
    }
}
