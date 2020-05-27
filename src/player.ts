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
import Menu from './menu';

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
        const decision: [string, number] = null;
        this.createPlayerMenu();
        
        return decision;
    }

    private createPlayerMenu()
    {
        const distanceFromHead = 1.2;

        const menu = new Menu(Cards.AssetContainer.context);
        menu.parentMenu.attach(this.userId, 'head');

        menu.createMenuBackground(
            'menu-background', 
            new MRE.Vector3(1, 0.8, 0.01), 
            new MRE.Vector3(0, 0, distanceFromHead));
        menu.createMenuText(
            'heading', 
            'Select Betting Action',
            0.05,
            new MRE.Vector3(0, 0.3, distanceFromHead));

        this.drawActionNamesAndButtons(menu, distanceFromHead);
    }

    private drawActionNamesAndButtons(menu: Menu, distanceFromHead: number)
    {
        let y = 0.2

        const actionNames = ['Fold', 'Check', 'Call', 'Raise'];
        actionNames.forEach(name => 
        {
            menu.createButton(
                name + '-button',
                new MRE.Vector3(0.065, 0.065, 0.01),
                new MRE.Vector3(-0.4, y, distanceFromHead)
            );
            menu.createMenuText(
                name + '-text',
                name,
                0.05,
                new MRE.Vector3(-0.3, y, distanceFromHead),
                MRE.TextAnchorLocation.MiddleLeft
            );
            y -= 0.1
        });

        // Handle text and buttons for adjusting raise amount
        const raiseAmountY = y + 0.04;
        const raiseAmount = 0;
        menu.createMenuText(
            'Raise-amount-text',
            'Raise Amount:',
            0.04,
            new MRE.Vector3(-0.3, raiseAmountY, distanceFromHead),
            MRE.TextAnchorLocation.MiddleLeft
        )
        menu.createMenuText(
            'Raise-amount-number',
            raiseAmount.toString(),
            0.04,
            new MRE.Vector3(0, raiseAmountY, distanceFromHead)
        )
        menu.createButtonWithText(
            'add-amount',
            new MRE.Vector3(0.05, 0.05, 0.01),
            new MRE.Vector3(0.05, raiseAmountY + 0.03, distanceFromHead),
            '+',
            0.04
        )
        menu.createButtonWithText(
            'deduct-amount',
            new MRE.Vector3(0.05, 0.05, 0.01),
            new MRE.Vector3(0.05, raiseAmountY - 0.03, distanceFromHead),
            '-',
            0.04
        )
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
            const frontFaceActor = card.actor.findChildrenByName('front-face', false);
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
            const frontFaceActor = cardActor.findChildrenByName('front-face', false);
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
