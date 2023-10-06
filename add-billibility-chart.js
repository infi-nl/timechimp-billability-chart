(function main() {
    function createCard() {
        const card = document.createElement("div");
        card.className = "card";
        const cardBody = document.createElement("div");
        cardBody.className = "card-body";
        card.appendChild(cardBody);
        return card;
    }

    function enrichForChart(times) {
        // Add week numbers
        const timesWithWeeks = times.map(time => {
            time.week = moment(time["date"]).format('W');
            return time;
        });
        // Group by week
        const timesGroupedByWeek = Object.groupBy(timesWithWeeks, ({ week }) => week);

        // Move times within time attribute
        for (const week in timesGroupedByWeek) {
            timesGroupedByWeek[week] = {"times": timesGroupedByWeek[week]};
        }

        for (const week in timesGroupedByWeek) {
            const weekSummary = timesGroupedByWeek[week];
            weekSummary['billableHours'] = 0;
            weekSummary['nonBillableHours'] = 0;
            weekSummary['totalHours'] = 0;
            weekSummary.times.forEach(time => {
                const hoursType = time.billable ? 'billableHours' : 'nonBillableHours';
                weekSummary[hoursType] += time.hours;
                weekSummary['totalHours'] += time.hours;
                return;
            });
            weekSummary['billableHoursPercentage'] = (100 * weekSummary['billableHours']) / weekSummary['totalHours'];
            weekSummary['nonBillableHoursPercentage'] = 100 - weekSummary['billableHoursPercentage'];
            weekSummary['totalHoursPercentage'] = 100;
        }

        //billable
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
    charts(card);
    chrome.storage.local.get(["timeChimpUserId"])
            .then(result => result.timeChimpUserId)
            .then((userId) => {

        console.log('Got user id ' + userId);
        chrome.runtime.sendMessage(
            {contentScriptQuery: "getTimes", userId: userId},
            times => {
                times = enrichForChart(times);
                console.log(`Received ${times.length} times ` + JSON.stringify(times));
                return times;
            });
    });
})();