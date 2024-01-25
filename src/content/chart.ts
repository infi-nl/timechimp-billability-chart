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

// The default TimeChimp "blurple" color.
const TC_BLURPLE = '#6559d2';

export function createOrUpdateChart(
    rollingStats: RollingStats[],
    billableColor?: string,
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
            softMax: 100,
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
                    pointFormatter: function () {
                        const hours =
                            rollingStats.find(
                                (s) => s.week === Number(this.category),
                            )?.nonBillableHours ?? 0;

                        return this.tooltipFormatter(
                            formatTooltip(
                                `${Math.round(
                                    this.y ?? 0,
                                )}% (${hoursToClockNotation(hours)})`,
                            ),
                        );
                    },
                },
            },
            {
                name: 'Facturabel',
                type: 'column',
                data: rollingStats.map((s) => s.billableHoursPercentage),
                color: billableColor ?? TC_BLURPLE,
                tooltip: {
                    pointFormatter: function () {
                        const hours =
                            rollingStats.find(
                                (s) => s.week === Number(this.category),
                            )?.billableHours ?? 0;

                        return this.tooltipFormatter(
                            formatTooltip(
                                `${Math.round(
                                    this.y ?? 0,
                                )}% (${hoursToClockNotation(hours)})`,
                            ),
                        );
                    },
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
                name: 'Verlof',
                type: 'spline',
                data: rollingStats.map((s) => s.leaveHours),
                color: '#efd722',
                showInLegend: false,
                opacity: 0,
                tooltip: {
                    pointFormatter: function () {
                        return this.tooltipFormatter(
                            formatTooltip(hoursToClockNotation(this.y ?? 0)),
                        );
                    },
                },
            },
            {
                name: 'Totaal',
                type: 'spline',
                data: rollingStats.map((s) => s.totalHours),
                color: '#6d6d77',
                showInLegend: false,
                opacity: 0,
                tooltip: {
                    pointFormatter: function () {
                        return this.tooltipFormatter(
                            formatTooltip(hoursToClockNotation(this.y ?? 0)),
                        );
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

function formatTooltip(value: string) {
    return `<span style='color:{point.color}'>●</span> {series.name}: <b>${value}</b><br/>`;
}
