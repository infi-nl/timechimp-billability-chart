# TimeChimp billability extension

Shows your billability of the last 5 weeks, on basis of the hours within TimeChimp.

Each week includes the average billability of the 4 weeks before. Whenever a week only has days booked on leave or public holidays, a week earlier is used for the average calculation.

## Chrome or Firefox?
Chrome runs this extension without any changes. Firefox however has some limitations that need some code changes. So if you like to run FireFox use the [firefox branch](https://gitlab.com/infi-projects/nijmegen/intern/timechimp-billabilty-extension/-/tree/firefox) instead. 

## Running this extension

1. Clone the main branch of this repository, or the [firefox branch](https://gitlab.com/infi-projects/nijmegen/intern/timechimp-billabilty-extension/-/tree/firefox).
2. Install the dependencies.
```
npm install
```
3. Load this directory in Chrome as an [unpacked extension](https://developer.chrome.com/docs/extensions/mv3/getstarted/development-basics/#load-unpacked).
3. Click the extension icon and check whether it displays "Billability charts are now added to the TimeChimp hours page".
4. Open the TimeChimp hours page.
5. Billability charts should now be represented just beneath the section where you can add hours:

![Example](example.png)