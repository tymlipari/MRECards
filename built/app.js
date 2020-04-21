"use strict";
/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const MRE = __importStar(require("@microsoft/mixed-reality-extension-sdk"));
/**
 * Cards Application - Attaches a cube to each avatar's hand.
 */
class Cards {
    /**
     * Constructs a new instance of this class.
     * @param context The MRE SDK context.
     * @param baseUrl The baseUrl to this project's `./public` folder.
     */
    constructor(context, baseUrl) {
        this.context = context;
        this.baseUrl = baseUrl;
        this.text = null;
        // Container for all cubes attached to avatars' hands
        this.attachedCubes = new Map();
        // Hook the context events we're interested in.
        this.context.onStarted(() => this.started());
        this.context.onUserJoined(user => this.userJoined(user));
        this.context.onUserLeft(user => this.userLeft(user));
    }
    /**
     * Once the context is "started", initialize the app.
     */
    started() {
        // Add some text to the scene
        this.text = MRE.Actor.Create(this.context, {
            actor: {
                name: 'Text',
                transform: {
                    app: { position: { x: 0, y: 0.5, z: 0 } }
                },
                text: {
                    contents: "Cards",
                    anchor: MRE.TextAnchorLocation.MiddleCenter,
                    color: { r: 30 / 255, g: 206 / 255, b: 213 / 255 },
                    height: 0.3
                }
            }
        });
    }
    /**
     * Called when a user joins the application.
     * @param user The user that joined the building.
     */
    userJoined(user) {
        // Attach cubes to the user's hands
        this.attachCubes(user);
    }
    /**
     * Called when a user leaves the application (probably left the Altspace world where this app is running).
     * @param user The user that left the building.
     */
    userLeft(user) {
        // Delete cubes attached to user's hands
        this.removeCubes(user);
    }
    /**
     * Attaches cubes to a user's hand.
     * @param user User to attach cubes to.
     */
    attachCubes(user) {
        const userID = user.id;
        // Load a glTF model
        const leftHandCube = MRE.Actor.CreateFromGltf(new MRE.AssetContainer(this.context), {
            // at the given URL
            uri: `${this.baseUrl}/altspace-cube.glb`,
            actor: {
                name: 'Left Cube',
                transform: { local: { scale: { x: 0.05, y: 0.05, z: 0.05 } } },
                attachment: {
                    attachPoint: "left-hand",
                    userId: userID
                }
            }
        });
        const rightHandCube = MRE.Actor.CreateFromGltf(new MRE.AssetContainer(this.context), {
            uri: `${this.baseUrl}/altspace-cube.glb`,
            actor: {
                name: 'Right Cube',
                transform: { local: { scale: { x: 0.05, y: 0.05, z: 0.05 } } },
                attachment: {
                    attachPoint: "right-hand",
                    userId: userID
                }
            }
        });
        this.attachedCubes.set(userID, [leftHandCube, rightHandCube]);
    }
    /**
     * Removes attached cubes from a user's hand.
     * @param user User to remove cubes from.
     */
    removeCubes(user) {
        if (this.attachedCubes.has(user.id)) {
            this.attachedCubes.get(user.id).forEach(element => { element.destroy(); });
        }
        this.attachedCubes.delete(user.id);
    }
}
exports.default = Cards;
//# sourceMappingURL=app.js.map