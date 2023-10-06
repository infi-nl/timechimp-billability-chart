function addBillibilityChart(element) {
    console.log('Creating chart');
    element.innerHTML = '<figure class="highcharts-figure"><div id="container"></div> <p class="highcharts-description">A basic column chart.</p></figure>';

    Highcharts.chart('container', {
        chart: {
            type: 'column'
        },
        title: {
            text: 'Facturabiliteit',
            align: 'left'
        },
        xAxis: {
            categories: ['USA', 'China', 'Brazil', 'EU', 'India', 'Russia'],
            crosshair: true,
            accessibility: {
                description: 'Countries'
            }
        },
        yAxis: {
            min: 0
        },
        tooltip: {
            valueSuffix: ' (1000 MT)'
        },
        plotOptions: {
            column: {
                pointPadding: 0.2,
                borderWidth: 0
            }
        },
        series: [
            {
                name: 'Corn',
                data: [406292, 260000, 107000, 68300, 27500, 14500]
            },
            {
                name: 'Wheat',
                data: [51086, 136000, 5500, 141000, 107180, 77000]
            }
        ]
    });

    return;
}


