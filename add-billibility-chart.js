(async function main() {
    function createCard() {
        const card = document.createElement("div");
        card.className = "card";
        const cardBody = document.createElement("div");
        cardBody.className = "card-body";
        card.appendChild(cardBody);
        return card;
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
    chrome.storage.local.get(["userName"])
            .then(result => result.userName)
            .then((userName) => {

        console.log('Got username ' + userName);
        chrome.runtime.sendMessage(
            {contentScriptQuery: "getHours", userName: userName},
            hours =>
                console.log('Received hours ' + JSON.stringify(hours)));
    });
})();