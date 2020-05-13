/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as MRE from '@microsoft/mixed-reality-extension-sdk';
import { TexasHoldEmBoard } from "@rgerd/poker-rank";
import Card from './card';
import Table from './table';
import Deck from './deck';
import Cards from './app';

// https://en.wikipedia.org/wiki/Glossary_of_poker_terms#board
export default class Board {
	private cards: Card[] = [];
	public actor: MRE.Actor = null;
	public pot: number = 0; 
	
	public pushCard(newCard: Card) {
		if (!this.actor) { this.CreateActor(); }
		if (!newCard.actor) { newCard.CreateActor(); }
		this.cards.push(newCard);

		newCard.actor.parentId = this.actor.id;

		const cardScale = Deck.Scale;
		const cardWidth = Card.Dimensions.x * cardScale;
		const cardMargin = cardWidth / 2;
		const boardWidth = this.cards.length * cardWidth + (this.cards.length - 1) * cardMargin;

		this.cards.forEach((card, idx) => {
			const x = cardWidth / 2 - boardWidth / 2 + (cardWidth + cardMargin) * idx;
			card.actor.transform.local.rotation = MRE.Quaternion.FromEulerAngles(Math.PI / 2, 0, 0);
			card.actor.transform.local.scale = new MRE.Vector3(1, 1, 1).scaleInPlace(cardScale);
			card.actor.transform.local.position = new MRE.Vector3(x, 0, 0);
		});
	}

	public clearCards() {
		this.cards.forEach((card) => {
			card.actor.destroy();
		});
		this.cards = [];
	}

	public getFinalCards(): TexasHoldEmBoard {
		if (this.cards.length !== 5) {
			throw new Error("Board must have 5 cards before calling it final.");
		}
		return [this.cards[0], this.cards[1], this.cards[2], this.cards[3], this.cards[4]];
	}

	public CreateActor(): MRE.Actor {
		if (this.actor) { throw new Error("Actor already created! Access with .actor"); }

		this.actor = MRE.Actor.Create(Cards.AssetContainer.context);

		this.actor.transform.app.position = new MRE.Vector3(0, Table.Height, Deck.Offset);

		return this.actor;
	}
}
