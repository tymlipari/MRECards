/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as MRE from '@microsoft/mixed-reality-extension-sdk';
import Cards from './app';

export default class Menu
{
    public parentMenu: MRE.Actor = null;

    constructor(private context: MRE.Context, private tablePosition: MRE.Vector3)
    {
        // Create a parent object for all the menu items.
        this.parentMenu = MRE.Actor.Create(this.context, {});
    }

    public createMenuBackground(name: string, dimensions: MRE.Vector3, position: MRE.Vector3)
    {
        const primitiveDefinition = {
            shape: MRE.PrimitiveShape.Plane,
            // y and z are swapped since the texture has been rotated
            dimensions: { x: dimensions.x, y: dimensions.z, z: dimensions.y }
        };

        const texture = Cards.AssetContainer.createTexture('background', {
            uri: `${Cards.BaseUrl}/menu-background.jpg`
        });
        const material = Cards.AssetContainer.createMaterial('background-material', { mainTextureId: texture.id });

        MRE.Actor.CreatePrimitive(Cards.AssetContainer, {
            definition: primitiveDefinition,
            actor: {
                name: name,
                parentId: this.parentMenu.id,
                appearance: { materialId: material.id },
                transform: {
                    local: {
                        position: this.tablePosition.add(position),
                        rotation: MRE.Quaternion.FromEulerAngles(-Math.PI / 2, 0, 0),
                    }
                }
            }
        });
    }

    public createMenuText(name: string, contents: string, height: number, position: MRE.Vector3)
    {
        MRE.Actor.Create(this.context, 
            {
                actor: 
                {
                    parentId: this.parentMenu.id,
                    name: name,
                    text: 
                    {
                        contents: contents,
                        anchor: MRE.TextAnchorLocation.MiddleCenter,
                        height: height
                    },
                    transform: 
                    {
                        local: { position: this.tablePosition.add(position) }
                    }
                }
            });
    }

    public createMenuErrorText(name: string, contents: string, height: number, position: MRE.Vector3)
    {
        MRE.Actor.Create(this.context, 
            {
                actor: 
                {
                    parentId: this.parentMenu.id,
                    name: name,
                    text: 
                    {
                        contents: contents,
                        anchor: MRE.TextAnchorLocation.MiddleCenter,
                        height: height,
                        color: new MRE.Color3(1, 0, 0)
                    },
                    transform: 
                    {
                        local: { position: this.tablePosition.add(position) }
                    }
                }
            });
    }

    public createButton(name: string, dimensions: MRE.Vector3, position: MRE.Vector3)
    {
        const buttonMesh = Cards.AssetContainer.createBoxMesh(name + '-mesh', dimensions.x, dimensions.y, dimensions.z);
        return MRE.Actor.Create(this.context, 
            {
                actor: 
                {
                    name: name,
                    parentId: this.parentMenu.id,
                    appearance: { meshId: buttonMesh.id },
                    collider: { geometry: { shape: MRE.ColliderType.Auto } },
                    transform: 
                    { 
                        local: { position: this.tablePosition.add(position) } 
                    }
                }
            });
    }

    public createButtonWithText(
        name: string, 
        dimensions: MRE.Vector3, 
        position: MRE.Vector3, 
        contents: string, 
        height: number)
    {   
        const button = this.createButton(name, dimensions, position);
        MRE.Actor.Create(this.context,
            {
                actor:
                {
                    name: name + '-text',
                    parentId: this.parentMenu.id,
                    text: 
                    {
                        contents: contents,
                        height: height,
                        anchor: MRE.TextAnchorLocation.MiddleCenter
                    },
                    transform:
                    {
                        local: { position: this.tablePosition.add(
                            new MRE.Vector3(position.x, position.y, -position.z - 0.01)) }
                    }
                }
            });

        return button;
    }
}
