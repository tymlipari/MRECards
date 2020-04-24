/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as MRE from '@microsoft/mixed-reality-extension-sdk';
import Card from './card';
import Deck from './deck';
import { int } from '@microsoft/mixed-reality-extension-sdk/built/math/types';
import { Vector3 } from '@microsoft/mixed-reality-extension-sdk';

export default class Player {
	// Tracks cards in a player's hand
	private hand = new Array<Card>();
	
	constructor(private userId: MRE.Guid) {
	}
	
	public drawCards(assetContainer: MRE.AssetContainer, baseUrl: string, deck: Deck, cardsToDraw: int) {
		const initialAngle = -Math.PI / 4;

		const range = Math.PI / 2;
		const increment = range / cardsToDraw;

		const leftCorner = new MRE.Vector3(0, 0, 0);
		const rightCorner = new MRE.Vector3(0.02, 0.15, 0);
		for (let angle = 0; angle < range; angle += increment) {
			const cardActor = deck.DrawCard().CreateActor(assetContainer, baseUrl, this.userId, 'left-hand');
			
			/**
			 * Because of the weird rotation stuff we have to do to get the cards into a reasonable orientation,
			 * the offsets for the cards in x, y, z translate to up, left, and forward respectively.
			 * the rotations in euler angles are x = pitch, y = yaw, z = roll
			 */
			const rotationOffsetIncrement = initialAngle + angle;
			const handOffsetRotation = MRE.Quaternion.FromEulerAngles(
				-Math.PI / 8, -Math.PI / 6, Math.PI / 10 + rotationOffsetIncrement);
			cardActor.transform.local.rotation.multiplyInPlace(handOffsetRotation);

			const handOffsetPosition = new MRE.Vector3(0.05, -0.1, 0.13);
			cardActor.transform.local.position.addInPlace(handOffsetPosition);

			// Move card position according to its desired location in the arc
			const cardPositionAdjustment = Vector3.Lerp(rightCorner, leftCorner, angle / range);
			cardActor.transform.local.position.addInPlace(cardPositionAdjustment)
		}
	}

	public removeCards() {
		this.hand.forEach(card => { card.actor.destroy(); });
	}
}
