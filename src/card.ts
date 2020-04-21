/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as MRE from '@microsoft/mixed-reality-extension-sdk';

export enum Suit {
    Hearts = "h",
    Clubs = "c",
    Spades = "s",
    Diamonds = "d"
}

export default class Card {
    public actor: MRE.Actor = null;

    constructor(public readonly value: number, public readonly suit: Suit) {
    }

    public CreateActor(
        assetContainer: MRE.AssetContainer,
        baseUrl: string,
        userId: MRE.Guid,
        attachPoint: MRE.AttachPoint): MRE.Actor {
        if (this.actor !== null)
            throw new Error("Actor already created! Access with .actor");

        const cardScale = { x: 0.002, y: 0.002, z: 0.002 };
        const cardRotation = MRE.Quaternion.FromEulerAngles(0, Math.PI, Math.PI / 2);

        this.actor = MRE.Actor.CreateFromGltf(assetContainer, {
            uri: `${baseUrl}/cards/${this.value}-${this.suit}.glb`,
            actor: {
                name: 'Card',
                attachment: {
                    attachPoint,
                    userId
                },
                transform: {
                    local: { scale: cardScale, rotation: cardRotation }
                }
            }
        });

        return this.actor;
    }
}
