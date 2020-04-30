/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as MRE from '@microsoft/mixed-reality-extension-sdk';

export enum Suit {
	Clubs = "c",
	Diamonds = "d",
	Hearts = "h",
	Spades = "s",
}

export default class Card {
	public actor: MRE.Actor = null;
	private static materials: { [id: string]: MRE.Material } = null;
	private static readonly cardDimensions = { x: 0.063, y: 1.0, z: 0.087 };
	private static readonly primitiveDefinition = {
		shape: MRE.PrimitiveShape.Plane,
		dimensions: Card.cardDimensions,
		uSegments: 1,
		vSegments: 1,
	};

	public static LoadMaterials(assetContainer: MRE.AssetContainer, baseUrl: string) {
		if (this.materials !== null) {
			return;
		}

		this.materials = {};

		for (let i = 1; i <= 13; i++) {
			Object.values(Suit).forEach((suit) =>
			{
				const textureName = `${i}-${suit}`;
				const texture = assetContainer.createTexture(textureName, {
					uri: `${baseUrl}/cards/${textureName}.jpeg`
				});
				this.materials[textureName] = assetContainer.createMaterial(textureName, {
					mainTextureId: texture.id,
					mainTextureScale: { x: -1, y: 1 }
				});
			});
		}

		{
			const backTexture = assetContainer.createTexture('back', {
				uri: `${baseUrl}/cards/card-back.jpeg`
			});
			this.materials['back'] = assetContainer.createMaterial('back', {
				mainTextureId: backTexture.id
			});
		}
	}

	constructor(public readonly value: number, public readonly suit: Suit) {
	}

	public CreateActor(
		assetContainer: MRE.AssetContainer,
		baseUrl: string,
		userId: MRE.Guid,
		attachPoint: MRE.AttachPoint): MRE.Actor {
		if (this.actor !== null) { throw new Error("Actor already created! Access with .actor"); }

		Card.LoadMaterials(assetContainer, baseUrl); // Load materials for the cards if we haven't already.

		this.actor = MRE.Actor.Create(assetContainer.context, {
			actor: {
				name: `${this.value} of ${this.suit}`,
				attachment: {
					attachPoint,
					userId
				}
			}
		});

		const pivotOffset = {x: 0, y: Card.cardDimensions.z / 2, z: 0 };

		MRE.Actor.CreatePrimitive(assetContainer, {
			definition: Card.primitiveDefinition,
			actor: {
				name: 'Front face',
				parentId: this.actor.id,
				appearance: {
					materialId: Card.materials[`${this.value}-${this.suit}`].id,
					enabled: true,
				},
				transform: {
					local: { 
						rotation: MRE.Quaternion.FromEulerAngles(Math.PI / 2, 0, Math.PI), 
						position: pivotOffset,
					}
				}
			}
		});

		MRE.Actor.CreatePrimitive(assetContainer, {
			definition: Card.primitiveDefinition,
			actor: {
				name: 'Back face',
				parentId: this.actor.id,
				appearance: {
					materialId: Card.materials['back'].id,
					enabled: true,
				},
				transform: {
					local: { 
						rotation: MRE.Quaternion.FromEulerAngles(Math.PI / 2, 0, 0), 
						position: pivotOffset,
					}
				}
			}
		});

		return this.actor;
	}
}
