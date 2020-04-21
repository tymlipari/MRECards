/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import * as MRE from '@microsoft/mixed-reality-extension-sdk';
/**
 * Cards Application - Attaches a cube to each avatar's hand.
 */
export default class Cards {
    private context;
    private baseUrl;
    private text;
    private attachedCubes;
    /**
     * Constructs a new instance of this class.
     * @param context The MRE SDK context.
     * @param baseUrl The baseUrl to this project's `./public` folder.
     */
    constructor(context: MRE.Context, baseUrl: string);
    /**
     * Once the context is "started", initialize the app.
     */
    private started;
    /**
     * Called when a user joins the application.
     * @param user The user that joined the building.
     */
    private userJoined;
    /**
     * Called when a user leaves the application (probably left the Altspace world where this app is running).
     * @param user The user that left the building.
     */
    private userLeft;
    /**
     * Attaches cubes to a user's hand.
     * @param user User to attach cubes to.
     */
    private attachCubes;
    /**
     * Removes attached cubes from a user's hand.
     * @param user User to remove cubes from.
     */
    private removeCubes;
}
//# sourceMappingURL=app.d.ts.map