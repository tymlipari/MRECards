/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { WebHost } from '@microsoft/mixed-reality-extension-sdk';
import dotenv from 'dotenv';
import { resolve as resolvePath } from 'path';
import App from './app';

/* eslint-disable no-console */
process.on('uncaughtException', err => console.log('uncaughtException', err));
process.on('unhandledRejection', reason => console.log('unhandledRejection', reason));
/* eslint-enable no-console */

// Read .env if file exists
dotenv.config();

// Start listening for connections, and serve static files
const server = new WebHost({
    // Uncomment below to deploy locally (PC only)
    // baseUrl: 'http://localhost:3901',

    // Uncomment below to deploy locally (All Platforms)
    baseUrl: 'http://cf3e13770795.ngrok.io',
    
    // Uncomment below to deploy to Azure
    // baseUrl: 'https://mrecards.azurewebsites.net',
    
    port: process.env.PORT,
    baseDir: resolvePath(__dirname, '../public')
});

// Handle new application sessions
server.adapter.onConnection(context => new App(context, server.baseUrl));
