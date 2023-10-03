console.log('Adding billibility chart');
const addTimePanel = document.querySelector('.col-md-4');
console.log('hier');

(async function main() {
    console.log('Async');
    if (!addTimePanel || !addTimePanel.querySelector('form[name="addTimeForm"]')) {
        //console.log('Not found, ignoring');
    } else {
        console.log('Found, adding card body');
        const card= document.createElement("div");
        card.className = "card";
        const cardBody = document.createElement("div");
        cardBody.className = "card-body";
        cardBody.innerText = 'test123';
        card.appendChild(cardBody);
        addTimePanel.appendChild(card);
        charts(card);
        const response = await chrome.runtime.sendMessage({contentScriptQuery: "getHours"});
        console.log('GOT RESPONSE ' + JSON.stringify((response)));
    }
})();