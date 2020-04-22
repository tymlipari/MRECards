/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as MRE from '@microsoft/mixed-reality-extension-sdk';
import Card, { Suit } from './card';
import Table from './table';

/**
 * https://stackoverflow.com/q/6274339
 * Modern version of the Fisher–Yates shuffle algorithm:
 * Shuffles array in place.
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
	public static readonly Height = 0.1;
	private cards: Card[] = [];
	private topOfDeck = 0;
	public actor: MRE.Actor = null;

	constructor() {
		for (let i = 1; i <= 13; i++) {
			this.cards.push(new Card(i, Suit.Hearts));
			this.cards.push(new Card(i, Suit.Diamonds));
			this.cards.push(new Card(i, Suit.Clubs));
			this.cards.push(new Card(i, Suit.Spades));
		}
		this.Shuffle();
	}

	public Shuffle(): void {
		shuffle(this.cards);
		this.topOfDeck = 0;
	}

	public DrawCard(): Card {
		return this.topOfDeck < this.cards.length
			? this.cards[this.topOfDeck++]
			: null;
	}

	public CreateActor(assetContainer: MRE.AssetContainer, baseUrl: string): MRE.Actor {
		if (this.actor !== null) { throw new Error("Actor already created! Access with .actor"); }

		const deckScale = { x: 0.002, y: 0.002, z: 0.002 };
		const deckRotation = MRE.Quaternion.FromEulerAngles(-Math.PI / 2, 0, 0);

		this.actor = MRE.Actor.CreateFromGltf(assetContainer, {
			uri: `${baseUrl}/cards/deck.glb`,
			actor: {
				name: 'Deck',
				transform: {
					// Need to translate along x & z to account for the baked-in position of the 
					// meshes in the gltf model we're using.
					app: { position: { x: -0.75, y: Table.Height + Deck.Height, z: 0.1 } },
					local: { scale: deckScale, rotation: deckRotation }
				}
			}
		});

		return this.actor;
	}
}
