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
import Game from './game';

export default class Player 
{
    public name: string;
    public playerNumber: number;
    public bank: number = 200;
    public raiseAmount: number = 0;
    private userId: MRE.Guid;
    private mask: MRE.GroupMask;
    private game: Game;
    private menu: Menu = null;
    // Tracks cards in a player's hand
    private hand = new Array<Card>();
    private static defaultAttachHand: AttachPoint = 'right-hand';
    
    constructor(user: MRE.User, private attachHand = Player.defaultAttachHand) 
    {
        this.userId = user.id;
        this.name = user.name;

        // Create GroupMask unique to player
        this.mask = new MRE.GroupMask(Cards.AssetContainer.context, [this.userId.toString()]);
        user.groups = this.mask;
    }

    public selectBetAction(game: Game, currentBet: number, storedBet: number)
    {
        this.game = game;
        if (this.menu === null)
        {
            this.createPlayerMenu();
        }
        else
        {
            this.updateAmountTexts();
            this.menu.parentActor.appearance.enabled = true;
        }

        // Hide/Show check and call options on the menu if the action is possible
        if (currentBet > storedBet)
        {
            this.updateMenuOptionAppearance('Check', false);
            this.updateMenuOptionAppearance('Call', true);
        }
        else
        {
            this.updateMenuOptionAppearance('Call', false);
            this.updateMenuOptionAppearance('Check', true);
        }
    }
    
    private updateAmountTexts()
    {
        const bankAmountText = this.menu.parentActor.findChildrenByName('bank-amount', false);
        if (bankAmountText.length === 1)
        {
            bankAmountText[0].text.contents = 'My Bank: ' + this.bank.toString();
        }
        const raiseAmountText = this.menu.parentActor.findChildrenByName('raise-amount-number', false);
        if (raiseAmountText.length === 1)
        {
            raiseAmountText[0].text.contents = this.raiseAmount.toString();
        }
    }

    private updateMenuOptionAppearance(option: string, enabled: boolean)
    {
        const text = this.menu.parentActor.findChildrenByName(option + '-text', false);
        if (text.length === 1)
        {
            text[0].appearance.enabled = enabled;
        }
        const button = this.menu.parentActor.findChildrenByName(option + '-button', false);
        if (button.length === 1)
        {
            button[0].appearance.enabled = enabled;
        }
    }

    private createPlayerMenu()
    {
        // Attach parent menu to head
        this.menu = new Menu(Cards.AssetContainer.context);
        this.menu.parentActor.attach(this.userId, 'head');
        const distanceFromHead = 1.2;

        // Set up menu background
        this.menu.createMenuBackground(
            'menu-background', 
            new MRE.Vector3(1, 0.8, 0.01), 
            new MRE.Vector3(0, 0, distanceFromHead + 0.01));
        this.menu.createMenuText(
            'heading', 
            'Select Betting Action',
            0.05,
            new MRE.Vector3(0, 0.3, distanceFromHead));

        this.drawBetActionTextAndButtons(distanceFromHead);
    }

    private drawBetActionTextAndButtons(distanceFromHead: number)
    {
        let y = 0.2
        const actionNames = ['Fold', 'Check', 'Call', 'Raise'];
        actionNames.forEach(name => 
        {
            const button = this.menu.createButton(
                name + '-button',
                new MRE.Vector3(0.065, 0.065, 0.01),
                new MRE.Vector3(-0.4, y, distanceFromHead)
            );
            this.menu.createMenuText(
                name + '-text',
                name,
                0.05,
                new MRE.Vector3(-0.3, y, distanceFromHead),
                MRE.TextAnchorLocation.MiddleLeft
            );
            y -= 0.1

            switch(name)
            {
            case 'Fold':
                button.setBehavior(MRE.ButtonBehavior).onClick(__ => this.handleFold());
                break;
            case 'Call':
                button.setBehavior(MRE.ButtonBehavior).onClick(__ => this.handleCall());
                break;
            case 'Check':
                button.setBehavior(MRE.ButtonBehavior).onClick(__ => this.handleCheck());
                break;
            case 'Raise':
                this.handleRaiseAmount(distanceFromHead, y);
                button.setBehavior(MRE.ButtonBehavior).onClick(__ => this.handleRaise());
                break;
            }
        });

        this.drawBankAmount(y - 0.1, distanceFromHead);
    }

    private drawBankAmount(y: number, distanceFromHead: number)
    {
        this.menu.createMenuText(
            'bank-amount', 
            'My Bank: ' + this.bank.toString(),
            0.05,
            new MRE.Vector3(0, y, distanceFromHead));
    }

    private handleFold()
    {
        this.menu.parentActor.appearance.enabled = false;
        this.game.handleBetAction(this, 'Fold');
    }

    private handleCall()
    {
        this.menu.parentActor.appearance.enabled = false;
        this.game.handleBetAction(this, 'Call');
    }

    private handleCheck()
    {
        this.menu.parentActor.appearance.enabled = false;
        this.game.handleBetAction(this, 'Check');
    }

    private handleRaise()
    {
        this.menu.parentActor.appearance.enabled = false;
        this.game.handleBetAction(this, 'Raise');
    }

    private handleRaiseAmount(distanceFromHead: number, y: number)
    {
        // Handle text and buttons for adjusting raise amount
        const raiseAmountY = y + 0.04;
        this.menu.createMenuText(
            'raise-amount-text',
            'Raise Amount:',
            0.04,
            new MRE.Vector3(-0.3, raiseAmountY, distanceFromHead),
            MRE.TextAnchorLocation.MiddleLeft
        )
        const raiseAmountText = this.menu.createMenuText(
            'raise-amount-number',
            this.raiseAmount.toString(),
            0.04,
            new MRE.Vector3(0, raiseAmountY, distanceFromHead)
        )

        const addButton = this.menu.createButtonWithText(
            'add-amount',
            new MRE.Vector3(0.05, 0.05, 0.01),
            new MRE.Vector3(0.05, raiseAmountY + 0.03, distanceFromHead),
            '+',
            0.04
        )
        addButton.setBehavior(MRE.ButtonBehavior).onClick(__ => 
        {
            if (this.raiseAmount < this.bank)
            {
                this.raiseAmount += 1;
                raiseAmountText.text.contents = this.raiseAmount.toString();
            }
        });

        const subtractButton = this.menu.createButtonWithText(
            'subtract-amount',
            new MRE.Vector3(0.05, 0.05, 0.01),
            new MRE.Vector3(0.05, raiseAmountY - 0.03, distanceFromHead),
            '-',
            0.04
        )
        subtractButton.setBehavior(MRE.ButtonBehavior).onClick(__ => 
        {
            if (this.raiseAmount > 0)
            {
                this.raiseAmount -= 1;
                raiseAmountText.text.contents = this.raiseAmount.toString();
            }
        });
    }

    public removeBetFromBank(bet: number) 
    {
        if (bet <= this.bank) 
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
                frontFaceActor[0].appearance.enabled = true;
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
        this.hand = new Array<Card>();
    }
}
