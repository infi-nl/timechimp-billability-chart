(function main() {
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
        return !weekSummary.times.some(time => time.taskName != 'Verlof');
    }

    function enrichWithAverages(timesGroupedByWeek) {
        const weeks = Object.keys(timesGroupedByWeek).reverse();

        // Calculate averages for first 5 weeks, only for the latest weeks.
        console.log("Enriching weeks" + JSON.stringify(weeks));
        const weeksToDisplay = weeks.slice(0, weeks.length < 5 ? weeks.length : 5);
        console.log("Enriching weeks to display" + JSON.stringify(weeksToDisplay));
        console.log(JSON.stringify(timesGroupedByWeek["16"]));
        console.log(JSON.stringify(timesGroupedByWeek["17"]));
        const enrichedWithAverages = {};

        for (let i = 0; i < weeksToDisplay.length; i++) {
            const week = weeksToDisplay[i];
            const weekSummary = timesGroupedByWeek[week];
            let weekNumber = parseInt(week) - 1;

            let weeksAdded = 0;
            let billableHoursLastWeeks = [];
            const weeksNumbers = []; // For logging only
            console.log(weeksAdded + ' ' + weekNumber + ' ' + ' ' + JSON.stringify(weeks) + '  ' + weeks.includes(weekNumber.toString()));
            while (weeksAdded < 4 && weeks.includes(weekNumber.toString())) {
                console.log('Week ' + weekNumber);
                const weekSummary = timesGroupedByWeek[weekNumber];
                // Only add if there are any billable hours
                if (weeksToDisplay.includes(weekNumber.toString()) || !isLeaveOnlyWeek(weekSummary)) {
                    billableHoursLastWeeks.push(weekSummary.billableHoursPercentage);
                    weeksNumbers.push(weekNumber);
                } else {
                    console.log(`Skipping leave only week ${weekNumber}: ${JSON.stringify(weekSummary)}`);
                }
                weeksAdded++;
                weekNumber--;
            }

            // Sum total billable hours
            const billableHoursTotal = billableHoursLastWeeks.reduce((acc, value) => acc + value, 0);
            // Calculate average and prevent divide by zero
            const averageBillableHours = billableHoursTotal ? billableHoursTotal / billableHoursLastWeeks.length: 0;
            weekSummary['averageBillableHours'] = averageBillableHours;
            console.log(`Adding week ${week} with ${averageBillableHours} average hours`);
            console.log(`Calculated on basis of ${billableHoursLastWeeks.length} values ${JSON.stringify(billableHoursLastWeeks)}, from weeks ${JSON.stringify(weeksNumbers)}`);
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

    console.log('Starting extension');
    const addTimePanel = document.querySelector('.col-md-4');
    if (!addTimePanel || !addTimePanel.querySelector('form[name="addTimeForm"]')) {
        console.log('Not found, returning');
        return;
    }

    console.log('Add time form found, adding charts');
    const card = createCard();
    addTimePanel.appendChild(card);
    chrome.storage.local.get(["timeChimpUserId"])
            .then(result => result.timeChimpUserId)
            .then((userId) => {

        console.log('Got user id ' + userId);
        chrome.runtime.sendMessage(
            {contentScriptQuery: "getTimes", userId: userId},
            times => {
                const timesGroupedByWeek = enrichWithWeeks(times);
                const timesGroupedWithMetrics = enrichWithMetrics(timesGroupedByWeek);
                const timesGroupedWithAverages = enrichWithAverages(timesGroupedWithMetrics);
                addBillibilityChart(card, timesGroupedWithAverages);
                return timesGroupedWithMetrics;
            });
    });
})();