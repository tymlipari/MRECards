/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as MRE from '@microsoft/mixed-reality-extension-sdk';
import { CardSuit, CardDefinition } from "@rgerd/poker-rank";
import Cards from './app';

export default class Card implements CardDefinition {
	public actor: MRE.Actor = null;
	public static Materials: { [id: string]: MRE.Material } = null;
	public static readonly Dimensions = { x: 0.08, y: 1.0, z: 0.11 };
	public static readonly PrimitiveDefinition = {
		shape: MRE.PrimitiveShape.Plane,
		dimensions: Card.Dimensions,
		uSegments: 1,
		vSegments: 1,
	};

	public static loadMaterials() {
		if (this.Materials !== null) {
			return;
		}

		this.Materials = {};

		for (let i = 1; i <= 13; i++) {
			Object.values(CardSuit).forEach((suit) => {
				const textureName = `${i}-${suit}`;
				const texture = Cards.AssetContainer.createTexture(textureName, {
					uri: `${Cards.BaseUrl}/cards/${textureName}.jpeg`
				});
				this.Materials[textureName] = Cards.AssetContainer.createMaterial(textureName, {
					mainTextureId: texture.id,
					mainTextureScale: { x: -1, y: 1 }
				});
			});
		}

		{
			const backTexture = Cards.AssetContainer.createTexture('back', {
				uri: `${Cards.BaseUrl}/cards/card-back.jpeg`
			});
			this.Materials['back'] = Cards.AssetContainer.createMaterial('back', {
				mainTextureId: backTexture.id,
				mainTextureScale: { x: -1, y: -1 }
			});
		}

		{
			const blankTexture = Cards.AssetContainer.createTexture('blank', {
				uri: `${Cards.BaseUrl}/cards/blank-card.jpeg`
			});
			this.Materials['blank'] = Cards.AssetContainer.createMaterial('blank', {
				mainTextureId: blankTexture.id
			});
		}
	}

	constructor(public readonly value: number, public readonly suit: CardSuit) {
	}

	public CreateActor(): MRE.Actor {
		if (this.actor) { throw new Error("Actor already created! Access with .actor"); }

		Card.loadMaterials(); // Load materials for the cards if we haven't already.

		const actorDefinition: Partial<MRE.ActorLike> = {
			name: `${this.value} of ${this.suit}`
		};

		this.actor = MRE.Actor.Create(Cards.AssetContainer.context, {
			actor: actorDefinition
		});

		const pivotOffset = { x: 0, y: Card.Dimensions.z / 2, z: 0 };

		MRE.Actor.CreatePrimitive(Cards.AssetContainer, {
			definition: Card.PrimitiveDefinition,
			actor: {
				name: 'Front face',
				parentId: this.actor.id,
				appearance: {
					materialId: Card.Materials[`${this.value}-${this.suit}`].id,
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

		MRE.Actor.CreatePrimitive(Cards.AssetContainer, {
			definition: Card.PrimitiveDefinition,
			actor: {
				name: 'Back face',
				parentId: this.actor.id,
				appearance: {
					materialId: Card.Materials['back'].id,
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
