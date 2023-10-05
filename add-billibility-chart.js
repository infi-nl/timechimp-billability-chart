(function main() {
    function createCard() {
        const card = document.createElement("div");
        card.className = "card";
        const cardBody = document.createElement("div");
        cardBody.className = "card-body";
        card.appendChild(cardBody);
        return card;
    }

    function groupByWeek(times) {
        // Add week numbers
        const timesWithWeeks = times.map(time => {
            time.week = moment(time["date"]).format('W');
            return time;
        });
        // Group by week
        const timesGroupedByWeek = Object.groupBy(timesWithWeeks, ({ week }) => week);
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
                times = groupByWeek(times);
                console.log(`Received ${times.length} times ` + JSON.stringify(times));
                return times;
            });
    });
})();