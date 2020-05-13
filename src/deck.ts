/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as MRE from '@microsoft/mixed-reality-extension-sdk';
import { CardSuit } from "@rgerd/poker-rank";
import Card from './card';
import Table from './table';
import Cards from './app';

/**
 * https://stackoverflow.com/q/6274339
 * Modern version of the Fisher–Yates shuffle algorithm:
 * shuffles array in place.
 * @param {Array} a items An array containing the items.
 */
function shuffle(a: Card[]) {
	let j, x, i;
	for (i = a.length - 1; i > 0; i--) {
		j = Math.floor(Math.random() * (i + 1));
		x = a[i];
		a[i] = a[j];
		a[j] = x;
	}
	return a;
}

export default class Deck {
	public static readonly Height = 0.03;
	public static readonly Offset = 0.2;
	public static readonly Scale = 1.3;
	private cards: Card[] = [];
	private topOfDeck = 0;
	public actor: MRE.Actor = null;

	constructor() {
		for (let i = 1; i <= 13; i++) {
			this.cards.push(new Card(i, CardSuit.Clubs));
			this.cards.push(new Card(i, CardSuit.Diamonds));
			this.cards.push(new Card(i, CardSuit.Hearts));
			this.cards.push(new Card(i, CardSuit.Spades));
		}
		this.shuffle();
	}

	public shuffle(): void {
		shuffle(this.cards);
		this.topOfDeck = 0;
	}

	public drawCard(): Card {
		return this.topOfDeck < this.cards.length
			? this.cards[this.topOfDeck++]
			: null;
	}

	public CreateActor(): MRE.Actor {
		if (this.actor) { throw new Error("Actor already created! Access with .actor"); }

		this.actor = MRE.Actor.Create(Cards.AssetContainer.context, {
			actor: {
				transform: {
					app: { position: { y: Table.Height, z: -Deck.Offset } },
					local: { scale: { x: Deck.Scale, y: Deck.Scale, z: Deck.Scale } }
				}
			}
		});
		
		this.actor.setCollider(
			MRE.ColliderType.Box, 
			false, 
			{ x: Card.Dimensions.x, y: Deck.Height, z: Card.Dimensions.z });

		Card.loadMaterials(); // Load materials for the cards if we haven't already.
		for (let i = 0; i < 28; i++) {
			MRE.Actor.CreatePrimitive(Cards.AssetContainer, {
				definition: Card.PrimitiveDefinition,
				actor: {
					name: 'Blank card',
					parentId: this.actor.id,
					appearance: {
						materialId: Card.Materials[i === 0 ? 'back' : 'blank'].id,
						enabled: true,
					},
					transform: {
						local: {
							rotation: MRE.Quaternion.FromEulerAngles(0, 0, 0),
							position: { y: Deck.Height * (1. - i / 28.), z: Card.Dimensions.z / 2 },
						}
					}
				}
			});
		}

		return this.actor;
	}
}
