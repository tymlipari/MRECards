/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as MRE from '@microsoft/mixed-reality-extension-sdk';
import * as PokerRank from "@rgerd/poker-rank";
import Player from './player';
import Board from './board';
import Deck from './deck';

export default class Game 
{
    private currentPlayers: Player[];
    private currentPlayerIndex: number = 0;
    private dealer: Player;

    constructor(players: Map<MRE.Guid, Player>, 
                private board: Board, 
                private deck: Deck,
                private smallBlindBet: number, 
                private bigBlindBet: number) 
    {
        this.currentPlayers = new Array<Player>(players.size);        
        players.forEach(player => 
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
        this.placeBets(this.nextPlayer());
        if (this.checkForWinner()) 
        {
            return; 
        }

        // Deal Flop
        this.dealFlop();

        // Round of Betting starts with player after dealer
        this.placeBets(this.findPlayerAfterDealer());
        if (this.checkForWinner()) 
        {
            return; 
        }
        
        // Deal Turn
        this.dealCommunityCard();

        // Round of Betting starts with player after dealer
        this.placeBets(this.findPlayerAfterDealer());
        if (this.checkForWinner()) 
        {
            return; 
        }

        // Deal River
        this.dealCommunityCard();

        // Round of Betting starts with player after dealer
        this.placeBets(this.findPlayerAfterDealer());
        if (this.checkForWinner()) 
        {
            return; 
        }

        // Determine Winner
        this.evaluateWinner();

        // TO DO: Create menu to play another round of the game
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

        this.board.pushCard(this.deck.drawCard());
    }

    private placeBlindBets() 
    {
        // Skip dealer
        this.dealer = this.currentPlayers[this.currentPlayerIndex];

        // Place bet for Small Blind
        this.spendBet(this.nextPlayer(), this.smallBlindBet);

        // Place bet for Big Blind
        this.spendBet(this.nextPlayer(), this.bigBlindBet);
    }

    private placeBets(currentPlayer: Player) 
    {
        let currentBet = 0;

        // Track how much each player has bet in total throughout the round
        const betPerPlayer = new Map<Player, number>();
        this.currentPlayers.forEach(player => 
        {
            betPerPlayer.set(player, currentBet) 
        });

        let foldedPlayers = new Array<Player>();
        
        let bettingComplete = false;
        // Perform rounds of betting until criteria to end betting is met
        while(!bettingComplete) 
        {
            for(let i = 0; i < this.currentPlayers.length; i += 1) 
            {
                const [action, bet] = currentPlayer.selectBetAction(currentBet);
                switch(action) 
                {
                case "Raise":
                    currentBet += bet;
                    this.spendBet(currentPlayer, currentBet - betPerPlayer.get(currentPlayer));
                    betPerPlayer.set(currentPlayer, currentBet);
                    break;
                case "Call":
                    this.spendBet(currentPlayer, currentBet - betPerPlayer.get(currentPlayer));
                    betPerPlayer.set(currentPlayer, currentBet);
                    break;
                case "Fold":
                    currentPlayer.showHand();
                    betPerPlayer.delete(currentPlayer);
                    foldedPlayers.push(currentPlayer);
                    break;
                case "Check":
                    break;
                }
                currentPlayer = this.nextPlayer();
            }

            // Remove folded players from current players
            foldedPlayers.forEach( player => 
            { 
                this.currentPlayers.splice(this.currentPlayers.indexOf(player), 1); 
            });
            foldedPlayers = [];

            /*
             * Betting ends when all players have had a chance to act and all players who haven't folded yet 
             * have bet the same amount of money
             */
            bettingComplete = this.updateBettingStatus(betPerPlayer, currentBet)     
        }
    }

    private updateBettingStatus(betPerPlayer: Map<Player, number>, currentBet: number) 
    {
        if (this.currentPlayers.length === 1) 
        {
            return true; 
        }
        betPerPlayer.forEach(bet => 
        {
            if (bet !== currentBet) 
            {
                return false; 
            }
        });
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
        }
        return true;
    }

    private evaluateWinner() 
    {
        this.currentPlayers.forEach(player => 
        {
            player.showHand() 
        });
        
        const handRankings = PokerRank.rankHands(
            this.currentPlayers.map((player) => player.getHand()), 
            this.board.getFinalCards());
        
        // We want the players whose hands are ranked #1. This means they 
        // share an index of 0 in the rankings array returned by PokerRank.
        const winner = this.currentPlayers.filter((_, index) => handRankings[index] === 0);
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
}
