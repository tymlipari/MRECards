/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as MRE from '@microsoft/mixed-reality-extension-sdk';
import Cards from './app';

export default class Table 
{
    public static readonly Height = 1.04;
    public actor: MRE.Actor = null;

    public CreateActor(): MRE.Actor 
    {
        if (this.actor) 
        {
            throw new Error("Actor already created! Access with .actor"); 
        }

        const tableScale = { x: 0.12, y: 0.13, z: 0.06 };

        this.actor = MRE.Actor.CreateFromGltf(Cards.AssetContainer, {
            uri: `${Cards.BaseUrl}/table.glb`,
            actor: {
                name: 'Table',
                transform: {
                    local: { scale: tableScale, position: { x: 0, y: 0, z: 0 } }
                }
            }
        });

        this.actor.setCollider(MRE.ColliderType.Box, false);

        return this.actor;
    }
}
