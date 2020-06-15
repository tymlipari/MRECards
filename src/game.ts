/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as MRE from '@microsoft/mixed-reality-extension-sdk';
import * as PokerRank from "@rgerd/poker-rank";
import Player from './player';
import Board from './board';
import Deck from './deck';
import Cards from './app';
import Menu from './menu';

export default class Game 
{
    private currentPlayers: Player[];
    private currentPlayerIndex: number = 0;
    private dealer: Player;
    private currentBet: number;
    private smallBlindPlayer: Player;
    private bigBlindPlayer: Player;
    private betPerPlayer: Map<Player, [number, boolean]>;
    private winnerMenu: Menu;

    constructor(
        private app: Cards,
        private originalPlayers: Map<MRE.Guid, Player>, 
        private board: Board, 
        private deck: Deck,
        private smallBlindBet: number, 
        private bigBlindBet: number) 
    {
        this.currentPlayers = new Array<Player>(originalPlayers.size);        
        originalPlayers.forEach(player => 
        {
            this.currentPlayers[player.playerNumber] = player; 
        });
    }

    public playGame() 
    {
        // Place bets based on blinds
        this.placeBlindBets();

        // Deal Hole
        this.dealHole();

        // Round of Betting starts with player after big blind
        this.initializeBetRound(this.nextPlayer());
    }

    public handleBetAction(currentPlayer: Player, action: string)
    {
        const storedBet = this.betPerPlayer.get(currentPlayer)[0];

        switch(action) 
        {
        case 'Fold':
            currentPlayer.showHand();
            this.betPerPlayer.delete(currentPlayer);
            this.currentPlayers.splice(this.currentPlayers.indexOf(currentPlayer), 1);
            this.currentPlayerIndex = 
                this.currentPlayerIndex === 0 ? this.currentPlayers.length - 1 : this.currentPlayerIndex - 1;
            break;
        case 'Check':
            this.betPerPlayer.set(currentPlayer, [storedBet, true]);
            break;
        case 'Call':
            this.spendBet(currentPlayer, this.currentBet - storedBet);
            this.betPerPlayer.set(currentPlayer, [this.currentBet, true]);
            break;
        case 'Raise':
            this.currentBet += currentPlayer.raiseAmount;
            this.spendBet(currentPlayer, this.currentBet - storedBet);
            this.betPerPlayer.set(currentPlayer, [this.currentBet, true]);
            break;
        }

        currentPlayer.raiseAmount = 0;

        // Betting ends when all players have had a chance to act and all players who haven't folded yet 
        // have bet the same amount of money
        if (this.checkBettingComplete())
        {
            this.playNextGameStep();
        }
        else 
        {
            const nextPlayer = this.nextPlayer();
            nextPlayer.selectBetAction(this, this.currentBet, this.betPerPlayer.get(nextPlayer)[0]);
        }
    }

    private playNextGameStep()
    {
        if (this.checkForWinner()) 
        {
            this.handleGameOver();
            return;
        }

        const cardsOnBoard = this.board.cards.length;
        if (cardsOnBoard === 0)
        {
            this.dealFlop();
        }
        else if (cardsOnBoard === 3 || cardsOnBoard === 4)
        {
            // Deal Turn or River
            this.dealCommunityCard();
        }

        if (cardsOnBoard === 5)
        {
            // Determine Winner
            this.evaluateWinner();

            // Request another round of the game
            this.handleGameOver();      
        }
        else
        {
            // Round of Betting starts with player after dealer
            this.initializeBetRound(this.findPlayerAfterDealer());
        }
    }

    private dealHole() 
    {
        // Deal each player one card, then deal another one to each
        this.currentPlayers.forEach(player => 
        {
            player.drawCards(this.deck, 1); 
        })
        this.currentPlayers.forEach(player => 
        {
            player.drawCards(this.deck, 1); 
        })
    }

    private dealFlop() 
    {
        // Burn a card
        this.deck.drawCard();

        // Flop cards
        this.board.pushCard(this.deck.drawCard());
        this.board.pushCard(this.deck.drawCard());
        this.board.pushCard(this.deck.drawCard());  
    }

    private dealCommunityCard() 
    {
        // Burn a card
        this.deck.drawCard();

        // Add card to board
        this.board.pushCard(this.deck.drawCard());
    }

    private placeBlindBets() 
    {
        // Skip dealer
        this.dealer = this.currentPlayers[this.currentPlayerIndex];

        // Place bet for Small Blind
        this.smallBlindPlayer = this.nextPlayer();
        this.spendBet(this.smallBlindPlayer, this.smallBlindBet);

        // Place bet for Big Blind
        this.bigBlindPlayer = this.nextPlayer();
        this.spendBet(this.bigBlindPlayer, this.bigBlindBet);
    }

    private initializeBetRound(currentPlayer: Player)
    {
        this.betPerPlayer = new Map<Player, [number, boolean]>();

        // If the hole has been dealt, but not the flop, set current bet to big blind instead of 0
        // Initialize each player with false in the tuple to indicate they have not had a chance to act yet
        if (this.board.cards.length === 0)
        {
            this.currentBet = this.bigBlindBet;
            this.currentPlayers.forEach(player => 
            {
                if (player === this.smallBlindPlayer) 
                {
                    this.betPerPlayer.set(player, [this.smallBlindBet, false]);
                }
                else if (player === this.bigBlindPlayer)
                {
                    this.betPerPlayer.set(player, [this.bigBlindBet, false]);
                }
                else 
                {
                    this.betPerPlayer.set(player, [0, false]);
                }
            });
        }
        // Initialize normally if flop has been dealt
        else 
        {
            this.currentBet = 0;
            this.currentPlayers.forEach(player => 
            {
                this.betPerPlayer.set(player, [0, false]); 
            });
        } 

        currentPlayer.selectBetAction(this, this.currentBet, this.betPerPlayer.get(currentPlayer)[0]); 
    }

    private checkBettingComplete() 
    {
        if (this.currentPlayers.length === 1) 
        {
            return true; 
        }
        for(const [, [bet, actionMade]] of this.betPerPlayer)
        {
            if (!actionMade)
            {
                return false;
            }
            if (bet !== this.currentBet) 
            {
                return false;
            }
        }
        return true;
    }

    private spendBet(currentPlayer: Player, bet: number) 
    {
        currentPlayer.removeBetFromBank(bet);
        this.board.pot += bet;
    }

    private checkForWinner() 
    {
        if (this.currentPlayers.length === 1) 
        {
            this.distributePot(this.currentPlayers);
            return true;
        }
        return false;
    }

    private evaluateWinner() 
    {
        const handRankings = PokerRank.rankHands(
            this.currentPlayers.map((player) => player.getHand()), 
            this.board.getFinalCards());
        
        // We want the players whose hands are ranked #1. This means they 
        // share an index of 0 in the rankings array returned by PokerRank.
        const winner = this.currentPlayers.filter((_, index) => handRankings[index] === 0);
        this.currentPlayers = winner;
        this.distributePot(winner);
    }

    private distributePot(winner: Player[]) 
    {
        winner.forEach(player => 
        {
            player.bank += this.board.pot/winner.length 
        });
    }

    private findPlayerAfterDealer() 
    {
        if (this.currentPlayers.includes(this.dealer)) 
        {
            this.currentPlayerIndex = 1;
        }
        else 
        {
            this.currentPlayerIndex = 0;
        }
        return this.currentPlayers[this.currentPlayerIndex];
    }
    
    private nextPlayer() 
    {
        this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.currentPlayers.length;
        return this.currentPlayers[this.currentPlayerIndex];
    }

    public removeGameActors()
    {
        this.originalPlayers.forEach(player => player.removeCards());
        this.board.actor.destroy();
        this.winnerMenu.destroy();
    }

    private handleGameOver()
    {
        // Display winner(s) names 
        let winnerNames = '';
        this.currentPlayers.forEach(player => 
        {
            winnerNames += player.name + ' ';
        });
        this.winnerMenu = new Menu(Cards.AssetContainer.context);
        this.winnerMenu.createMenuText(
            'winner-text',
            winnerNames + 'Wins!',
            0.05,
            this.deck.actor.transform.local.position.add(new MRE.Vector3(0, 0.7, 0)));

        // Ensure every player can show their hand
        this.originalPlayers.forEach(player => 
        {
            player.showHand() 
        });
        this.deck.actor.destroy();
        this.app.createStartMenu();
    }
}
