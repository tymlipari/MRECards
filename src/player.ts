/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as MRE from '@microsoft/mixed-reality-extension-sdk';
import { Vector3, AttachPoint } from '@microsoft/mixed-reality-extension-sdk';
import { TexasHoldEmHand } from '@rgerd/poker-rank';
import Cards from './app';
import Card from './card';
import Deck from './deck';

export default class Player 
{
    public playerNumber: number;
    private userId: MRE.Guid;
    private mask: MRE.GroupMask;
    // Tracks cards in a player's hand
    private hand = new Array<Card>();
    private static defaultAttachHand: AttachPoint = 'right-hand';
    public bank: number = 200;
    
    constructor(private user: MRE.User, private attachHand = Player.defaultAttachHand) 
    {
        this.userId = user.id;

        // Create GroupMask unique to player
        this.mask = new MRE.GroupMask(Cards.AssetContainer.context, [this.userId.toString()]);
        user.groups = this.mask;
    }

    public selectBetAction(currentBet: number) 
    {
        // TO DO: Create a menu for the player to decide which bet action to pursue (raise, call, check, fold)

        const decision: [string, number] = ["Raise", 5];
        return decision;
    }

    public removeBetFromBank(bet: number) 
    {
        if (bet >= this.bank) 
        {
            this.bank -= bet; 
        }
    }
    
    public drawCards(
        deck: Deck,
        cardsToDraw: number) 
    {
        for (let i = 0; i < cardsToDraw; i++) 
        {
            const newCard = deck.drawCard();
            this.hand.push(newCard);
        }
        this.adjustCardsInHand();
    }

    public showHand() 
    {
        this.hand.forEach(card => 
        {
            const frontFaceActor = card.actor.findChildrenByName('Front Face', false);
            if (frontFaceActor.length === 1) 
            {
                const mask = new MRE.GroupMask(Cards.AssetContainer.context);
                this.user.groups = mask
                frontFaceActor[0].appearance.enabledFor = mask;
            }
        });
    }

    public getHand(): TexasHoldEmHand 
    {
        if (this.hand.length !== 2) 
        {
            throw new Error("Player must have two cards in their hand.");
        }
        return [ this.hand[0], this.hand[1] ];
    }

    private adjustCardsInHand() 
    {
        const handSwitch = this.attachHand === 'right-hand' ? 1 : -1;
        const range = Math.PI / 2;
        const initialAngle = handSwitch * -range / 2 - Math.PI / 2;
        const angleIncrement = handSwitch * range / this.hand.length;

        const leftCorner = new MRE.Vector3(0, 0, 0);
        const rightCorner = new MRE.Vector3(0, 0, 0.008);

        this.hand.forEach((card, cardIdx) => 
        {
            const cardActor = card.actor || card.CreateActor();
            if (!cardActor.attachment) 
            {
                cardActor.attach(this.userId, this.attachHand); 
            }

            /**
             * NOTE: Cards pivot about their bottom centers.
             */
            const cardAngle = cardIdx * angleIncrement;
            const rotationOffsetIncrement = initialAngle + cardAngle;
            const handOffsetRotation = MRE.Quaternion.FromEulerAngles(
                -Math.PI / 4, handSwitch * Math.PI / 4, handSwitch * -rotationOffsetIncrement);
            cardActor.transform.local.rotation = handOffsetRotation;

            const handOffsetPosition = new MRE.Vector3(handSwitch * -0.03, -0.04, 0.14);
            cardActor.transform.local.position = handOffsetPosition;

            // Move card position according to its desired location in the arc
            // We push the cards back along the z-axis to avoid z-fighting
            const cardPositionAdjustment = Vector3.Lerp(rightCorner, leftCorner, cardIdx / this.hand.length);
            cardActor.transform.local.position.addInPlace(cardPositionAdjustment)

            // Only allow card holder to see the front of the card
            const frontFaceActor = cardActor.findChildrenByName('Front Face', false);
            if (frontFaceActor.length === 1) 
            {
                frontFaceActor[0].appearance.enabledFor = this.mask;
            }
        });
    }

    public removeCards() 
    {
        this.hand.forEach(card => 
        {
            card.actor.destroy(); 
        });
    }
}
