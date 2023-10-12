function addBillibilityChart(element, timesGroupedByWeek) {
    console.log('Creating chart on basis of ' + JSON.stringify(timesGroupedByWeek));
    const billableHours = [];
    const nonBillableHours = [];
    const averageBillableHours = [];
    for (week of Object.keys(timesGroupedByWeek)) {
        const weekSummary = timesGroupedByWeek[week];
        billableHours.push(weekSummary.billableHoursPercentage);
        nonBillableHours.push(weekSummary.nonBillableHoursPercentage);
        averageBillableHours.push(weekSummary.averageBillableHours);
    }
    console.log('Billable hours ' + JSON.stringify(billableHours));
    console.log('Non billable hours ' + JSON.stringify(billableHours));
    element.innerHTML = '<figure class="highcharts-figure"><div id="container"></div></figure>';


    Highcharts.chart('container', {
        chart: {
            type: 'column'
        },
        title: {
            text: 'Facturabiliteit',
            align: 'left'
        },
        xAxis: {
            categories: Object.keys(timesGroupedByWeek),
            title: {
                text: 'Week'
            },
        },
        yAxis: {
            min: 0,
            max: 100,
            title: {
                text: 'Percentage'
            },
        },
        tooltip: {
            valueSuffix: '%'
        },
        plotOptions: {
            column: {
                stacking: 'normal'
            }
        },
        series: [{
            name: 'Facturabel',
            data: billableHours
        }, {
            name: 'Niet facturabel',
            data: nonBillableHours
        },
        {
            name: 'Gemiddelde facturabiliteit ',
            type: 'spline',
            data: averageBillableHours,
            tooltip: {
                valueSuffix: '% (afgelopen 5 weken)'
            }
        }]
    });

    return;
}


