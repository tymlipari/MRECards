# Mixed Reality Extension Cards

## Prerequisites
* Install [Node.js 8.12](https://nodejs.org/download/release/v8.12.0/) or
newer, which includes NPM 6.4.1 or newer, from nodejs.org

## Testing the Solution Locally

## How to Build and Run MRE Cards
From command prompt:
* `git clone https://github.com/tymlipari/MRECards.git`
* Ensure `server` in `server.ts` under the `src` folder matches: 
```js
const server = new WebHost({
    baseUrl: 'http://localhost:3901',
    port: process.env.PORT,
    baseDir: resolvePath(__dirname, '../public')
});
```
* `npm install` This will install all dependent packages. (and will do very
little if there are no changes)
* `npm run build` This should not report any errors.
* `npm start` This should print "INF: Multi-peer Adapter listening on..."

## How to Build and Run MRE Cards with Others
While developing an MRE, you may want to test with other people, so you will
need to make the MRE's endpoint visible publicly. The easiest way is to use a
service like [ngrok](https://ngrok.com/), which gives new URL that will work 
for you and your friends. Using ngrok, a localhost URL would be rewritten to
something like this: `ws://c0bbc9c9.ngrok.io`. ngrok
itself is a command line utility. To run ngrok and connect it to your
experience:

On a command line
* cd to the folder where you unzipped ngrok.exe
* run the command `ngrok http 3901`

Note the forwarding address from the nkgrok command above. In order to properly serve assets, you will need to update the WebHost's baseUrl (in server.ts in the sample code) to match this forwarding address. For example:
```js
const server = new WebHost({
    baseUrl: 'http://<ngrok-id>.ngrok.io',
    port: process.env.PORT,
    baseDir: resolvePath(__dirname, '../public')
});
```

In AltspaceVR
* Go to your personal home
* Make sure you are signed in properly, not a guest
* Activate the World Editor
* Click Basics group
* Click on SDKApp
* For the URL field, enter `ws://localhost:3901` if running Altspace on PC or use the ngrok link (`ws://<ngrok-id>.ngrok.io`) otherwise
* Click Confirm
* If the app doesn't seem to load, click on the gear icon next the MRE object
in to the present objects list, and make sure "Is Playing" is checked.
* After the app has been placed, you will see the text "Cards". To hide the whitebox surround the MRE, uncheck "Edit Mode".

Congratulations, you have now deployed a Node.js server with the MRE SDK onto your local machine and connected to it from AltspaceVR.

## Deploying to Microsoft Azure

### Microsoft Azure

#### Sign up
Go to the [Azure website](https://azure.microsoft.com/en-us/free/)

#### Deploy Application 
1. Install and run [Visual Studio Code](https://code.visualstudio.com/)
2. Open the MRECards folder in VSCode 
3. Ensure `server` in `server.ts` under the `src` folder matches: 
```js
const server = new WebHost({
    baseUrl: 'https://mrecards.azurewebsites.net',
    port: process.env.PORT,
    baseDir: resolvePath(__dirname, '../public')
});
```
4. Push your changes to the repo.
5. Check if the deployment was successful by checking the logs under Deployment Center on the `mrecards` WebApp on [Azure Portal](https://portal.azure.com)
10. Use `ws://mrecards.azurewebsites.net` to test in MRETestBed or AltspaceVR.
11. You can manage the web app on [Azure portal](https://portal.azure.com)
