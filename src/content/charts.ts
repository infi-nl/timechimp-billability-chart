import Highcharts from 'highcharts';

// Ensure the requestAnimationFrame function is bound to the window.
// Without this, Highcharts animations won't work properly in Firefox because of strict mode.
window.requestAnimationFrame = window.requestAnimationFrame.bind(window);

const textStyle = {
    fontSize: '12px',
};

export const charts = (function () {
    function show(element, timesGroupedByWeek) {
        console.log('Creating billability chart');
        const billableHours = [];
        const nonBillableHours = [];
        const averageBillableHours = [];
        for (const week of Object.keys(timesGroupedByWeek)) {
            const weekSummary = timesGroupedByWeek[week];
            billableHours.push(weekSummary.billableHoursPercentage);
            nonBillableHours.push(weekSummary.nonBillableHoursPercentage);
            averageBillableHours.push(weekSummary.averageBillableHours);
        }
        console.debug('Billable hours ' + JSON.stringify(billableHours));
        console.debug('Non billable hours ' + JSON.stringify(billableHours));
        const chart: Highcharts.Options = {
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

        Highcharts.chart(element, chart);
    }

    return {
        show,
    };
})();
