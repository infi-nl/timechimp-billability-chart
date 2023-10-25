import Highcharts from 'highcharts';

export const charts = (function () {
    function addContainer(element) {
        const figure = document.createElement('figure');
        figure.className = 'highcharts-figure';
        const cardBody = document.createElement('div');
        cardBody.id = 'billability-container';
        figure.appendChild(cardBody);
        element.appendChild(figure);
        return cardBody;
    }

    function show(element, timesGroupedByWeek, showAnimation = true) {
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
        const chart = {
            chart: {
                type: 'column',
                className: 'highcharts-light',
            },
            title: {
                text: 'Facturabiliteit',
                align: 'left',
            },
            xAxis: {
                categories: Object.keys(timesGroupedByWeek),
                title: {
                    text: 'Week',
                },
            },
            yAxis: {
                min: 0,
                max: 100,
                title: {
                    text: 'Percentage',
                    style: {
                        textTransform: 'none',
                    },
                },
            },
            tooltip: {
                valueSuffix: '%',
            },
            plotOptions: {
                column: {
                    stacking: 'normal',
                },
            },
            series: [
                {
                    name: 'Niet facturabel',
                    data: nonBillableHours,
                    color: '#e6e4e3',
                },
                {
                    name: 'Facturabel',
                    data: billableHours,
                    color: '#f36f21',
                },
                {
                    name: 'Gemiddelde facturabiliteit ',
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
        };

        // Disable all animation when configured so
        if (!showAnimation) {
            chart.series = chart.series.map((s) => {
                s['animation'] = showAnimation;
                return s;
            });
            chart.plotOptions['series'] = {
                events: {
                    legendItemClick: function () {
                        return showAnimation;
                    },
                },
                enableMouseTracking: showAnimation,
                states: {
                    inactive: {
                        opacity: 1,
                    },
                    hover: {
                        enabled: showAnimation,
                    },
                },
            };
        }

        Highcharts.chart(element, chart);
    }

    return {
        addContainer: addContainer,
        show: show,
    };
})();
