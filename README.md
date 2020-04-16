# Mixed Reality Extension Cards

## Prerequisites
* Install [Node.js 8.12](https://nodejs.org/download/release/v8.12.0/) or
newer, which includes NPM 6.4.1 or newer, from nodejs.org

## Testing the Solution Locally

## How to Build and Run the Hello World sample
From command prompt:
* `git clone https://github.com/tymlipari/MRECards.git`
* `cd MRECards/hello-world`
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

In AltspaceVR
* Go to your personal home
* Make sure you are signed in properly, not a guest
* Activate the World Editor
* Click Basics group
* Click on SDKApp
* For the URL field, enter `ws://localhost:3901`
* Click Confirm
* If the app doesn't seem to load, click on the gear icon next the MRE object
in to the present objects list, and make sure "Is Playing" is checked.
* After the app has been placed, you will see the MRE Anchor (the white box
with red/green/blue spikes on it), rendering on top of the MRE. You can use the
anchor to move the MRE around. To hide the anchor, uncheck "Edit Mode".

You should now see the words "Hello World" above a spinning cube.
Congratulations, you have now deployed a Node.js server with the MRE SDK onto
your local machine and connected to it from AltspaceVR.

## Deploying to an Enterprise Grade Cloud Service

### Microsoft Azure

#### Sign up
Go to the [Azure website](https://azure.microsoft.com/en-us/free/)

#### Create a new application and deploy with VSCode 
1. Install and run [Visual Studio Code](https://code.visualstudio.com/)
2. Install VSCode extension 'Azure App Service'  [ms-azuretools.vscode-azureappservice](https://marketplace.visualstudio.com/items?itemName=ms-azuretools.vscode-azureappservice)
3. Open the MRECards folder in VSCode 
4. Ensure `server` in `server.ts` under the `src` folder matches: 
```js
const server = new WebHost({
    baseUrl: 'https://mrecards.azurewebsites.net',
    port: process.env.PORT,
    baseDir: resolvePath(__dirname, '../public')
});
```
5. Build your MRE application
6. Open Azure tab in VSCode and sign in with your Azure account
7. Click Deploy to WebApp
8. Pick `mrecards` to deploy to under the Visual Studio Enterprise subscription.
9. Pick the `hello-world` folder as the folder to package.
10. Use `ws://mrecards.azurewebsites.net` to test in MRETestBed or AltspaceVR.
11. You can manage the web app on [Azure portal](https://portal.azure.com)
