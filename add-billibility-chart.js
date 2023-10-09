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

    function enrichWithAverages(timesGroupedByWeek) {
        const weeks = Object.keys(timesGroupedByWeek).reverse();
        const enrichedWithAverages = {};
        for (let i = 0; i < weeks.length && i < 5; i++) {
            const week = weeks[i];
            const weekSummary = timesGroupedByWeek[week];
            let weekNumber = parseInt(week);

            weekNumber++;
            let currentWeek = 0;
            let weeksAdded = 0;
            let billableHoursLastWeeks = [];
            while (weeksAdded <= 4 && weekNumber in timesGroupedByWeek) {
                const weekSummary = timesGroupedByWeek[weekNumber];
                billableHoursLastWeeks.push(weekSummary.billableHoursPercentage);
                weeksAdded++;
            }
            const billableHoursTotal = billableHoursLastWeeks.reduce((acc, value) => acc + value, 0);
            weekSummary['averageBillableHours'] = billableHoursTotal / billableHoursLastWeeks.length;
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
                const timesGroupedWithAvgs = enrichWithAverages(timesGroupedWithMetrics);
                addBillibilityChart(card, timesGroupedWithAvgs);
                return timesGroupedWithMetrics;
            });
    });
})();