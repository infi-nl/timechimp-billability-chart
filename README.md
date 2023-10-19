# TimeChimp billability extension

Shows your billability of the last 5 weeks, on basis of the hours within TimeChimp.

Each week includes the average billability of the 4 weeks before. Whenever a week only has days booked on leave or public holidays, a week earlier is used for the average calculation.

## Running this extension

1. Clone the main branch of this repository.
2. Install the dependencies.
```
npm install
```
3. Currently Chrome and Firefox are supported. Only for FireFox change the manifest.json file as follows:

```
  "background": {
      // "service_worker": "timechimp.js"
     "scripts": ["timechimp.js"]
  },
```
 
4. Load this directory as an unpacked extension in [Chrome](https://developer.chrome.com/docs/extensions/mv3/getstarted/development-basics/#load-unpacked) or [FireFox](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Your_first_WebExtension#installing).
5. Click the extension icon right next to the address bar and check whether it displays: _Billability charts are now added to the TimeChimp hours page_

![Extension icon](extension-icon.png)

6. Open the TimeChimp [hours page](https://app.timechimp.com/#/registration/time/day). 
7. Billability charts should now be represented just beneath the section where you can add hours:

![Example](example.png)