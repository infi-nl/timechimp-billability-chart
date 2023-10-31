import 'highcharts/css/highcharts.css';
import './style.css';
import { addBillabilityChart } from './add-billability-chart';

/**
 * Listens to when the week has changed, and if so updates the billability chart.
 */
chrome.runtime.onMessage.addListener(function (request, _, sendResponse) {
    const dateString = request['date'];
    const event = request['name'];
    if (dateString && (event === 'weekChanged' || event === 'userChanged')) {
        addBillabilityChart(new Date(dateString))
            .then(() => sendResponse())
            .catch((e) =>
                console.error(
                    'Error when adding billability chart after changing dates: ' +
                        e,
                ),
            );
    }
});

addBillabilityChart().catch((e) =>
    console.error('Error when adding billability chart: ' + e),
);
