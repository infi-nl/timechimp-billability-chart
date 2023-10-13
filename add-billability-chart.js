const billabilityChart = (function main() {
    function createCard() {
        const card = document.createElement("div");
        card.className = "card";
        const cardBody = document.createElement("div");
        cardBody.className = "card-body";
        card.appendChild(cardBody);
        return card;
    }

    function toFloatTwoDigits(number) {
        return parseFloat(number.toFixed(2));
    }

    // Add metrics billable, non billable and total hours
    function addHoursMetrics(weekSummary) {
        weekSummary['billableHours'] = 0;
        weekSummary['nonBillableHours'] = 0;
        weekSummary['totalHours'] = 0;
        weekSummary.times.forEach(time => {
            const hoursType = time.billable ? 'billableHours' : 'nonBillableHours';
            weekSummary[hoursType] += time.hours;
            weekSummary['totalHours'] += time.hours;
            return;
        });
    }

    // Add for metrics billable, non billable and total hours, the percentages
    function addHoursPercentages(weekSummary) {
        const billableHoursPercentage = (100 * weekSummary['billableHours']) / weekSummary['totalHours'];
        weekSummary['billableHoursPercentage'] = toFloatTwoDigits(billableHoursPercentage);
        weekSummary['nonBillableHoursPercentage'] = toFloatTwoDigits(100 - weekSummary['billableHoursPercentage']);
        weekSummary['totalHoursPercentage'] = 100;
    }

    function getWeek(date) {
        return moment(date).format('W');
    }

    // Group by week, add times within a new object's "times" attribute.
    function enrichWithWeeks(times) {
        return times.reduce((acc, time) => {
            const week = getWeek(time.date);
            acc[week] = acc[week] ?? {'times' : []};
            acc[week]['times'].push(time);
            return acc;
        }, {});
    }

    function isLeaveOnlyWeek(weekSummary) {
        return !weekSummary.times.some(time => time.taskName != 'Verlof' && time.taskName != 'Feestdag');
    }

    function enrichWithAverages(timesGroupedByWeek) {
        const weeks = Object.keys(timesGroupedByWeek).reverse();

        // Calculate averages for first 5 weeks, only for the latest weeks.
        const weeksToDisplay = weeks.slice(0, weeks.length < 5 ? weeks.length : 5);
        const enrichedWithAverages = {};

        for (let i = 0; i < weeksToDisplay.length; i++) {
            const week = weeksToDisplay[i];
            const weekSummary = timesGroupedByWeek[week];
            const leaveOnlyWeek = isLeaveOnlyWeek(weekSummary) ? 'leave only ' : '';
            let weekNumber = parseInt(week) - 1;

            let weeksAdded = 0;
            let billableHoursLastWeeks = [];
            const weeksNumbers = []; // For logging only
            while (weeksAdded < 4 && weeks.includes(weekNumber.toString())) {
                const weekSummary = timesGroupedByWeek[weekNumber];
                // Only add if there are any billable hours
                if (weeksToDisplay.includes(weekNumber.toString()) && !isLeaveOnlyWeek(weekSummary)) {
                    billableHoursLastWeeks.push(weekSummary.billableHoursPercentage);
                    weeksNumbers.push(weekNumber);
                    weeksAdded++;
                } else {
                    console.log(`Skipping leave only week ${weekNumber}`);
                }
                weekNumber--;
            }

            // Sum total billable hours
            const billableHoursTotal = billableHoursLastWeeks.reduce((acc, value) => acc + value, 0);
            // Calculate average and prevent divide by zero
            let averageBillableHours = billableHoursTotal ? billableHoursTotal / billableHoursLastWeeks.length: 0;
            averageBillableHours = parseFloat(averageBillableHours.toFixed(2));
            weekSummary['averageBillableHours'] = averageBillableHours;
            console.log(`Adding ${leaveOnlyWeek}week ${week} with ${averageBillableHours} average billable hours. ` +
                `Calculated On basis of of ${billableHoursLastWeeks.length} values ` +
                `${JSON.stringify(billableHoursLastWeeks)}, from weeks ${JSON.stringify(weeksNumbers)}`);
            enrichedWithAverages[week] = weekSummary;
        }
        return enrichedWithAverages;
    }

    // Add metrics billable, non billable and total hours, and associated percentages.
    function enrichWithMetrics(timesGroupedByWeek) {
        // Add metrics billable, non billable and total hours, and associated percentages.
        for (const weekSummary of Object.values(timesGroupedByWeek)) {
            addHoursMetrics(weekSummary);
            addHoursPercentages(weekSummary);
        }
        return timesGroupedByWeek;
    }

    function addBillabilityChart(date) {
        console.log('Starting extension');
        const addTimePanel = document.querySelector('.col-md-4');
        if (!addTimePanel || !addTimePanel.querySelector('form[name="addTimeForm"]')) {
            console.log('Not found, returning');
            return;
        }

        console.log('Add time form found, adding charts');
        let chartContainer = addTimePanel.querySelector('#highcharts-container');
        let card = createCard();
        if (!chartContainer) {
            console.log('No existing billability chard, adding one');
            chartContainer = addBillabilityContainer(addTimePanel);
        }

        chrome.storage.local.get(["timeChimpUserId"])
            .then((result) => result.timeChimpUserId)
            .then((userId) => {
                console.log('Got user id ' + userId);
                chrome.runtime.sendMessage(
                    {contentScriptQuery: "getTimes", userId: userId, date: date},
                    times => {
                        const timesGroupedByWeek = enrichWithWeeks(times);
                        const timesGroupedWithMetrics = enrichWithMetrics(timesGroupedByWeek);
                        const timesGroupedWithAverages = enrichWithAverages(timesGroupedWithMetrics);
                        showBillabilityChart(chartContainer, timesGroupedWithAverages);
                        return timesGroupedWithMetrics;
                    });
            });
    }
    addBillabilityChart();
    return {
        add: addBillabilityChart
    }
})();

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    const date = new Date(request['args']);
    console.log('Changed weeks. Date currently selected: ' + date);
    billabilityChart.add(date);
    sendResponse();
    return true;
});