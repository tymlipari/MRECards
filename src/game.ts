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

export default class Game 
{
    private currentPlayers: Player[];
    private currentPlayerIndex: number = 0;
    private dealer: Player;
    private currentBet: number;
    private betPerPlayer: Map<Player, number>;

    constructor(private app: Cards,
        players: Map<MRE.Guid, Player>, 
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
        this.initializeBetRound(this.nextPlayer());
    }

    public handleBetAction(currentPlayer: Player, action: string)
    {
        if (this.betPerPlayer.get(currentPlayer) === -1)
        {
            this.betPerPlayer.set(currentPlayer, 0);
        }

        switch(action) 
        {
        case 'Raise':
            this.currentBet += currentPlayer.raiseAmount;
            this.spendBet(currentPlayer, this.currentBet - this.betPerPlayer.get(currentPlayer));
            this.betPerPlayer.set(currentPlayer, this.currentBet);
            break;
        case 'Call':
            this.spendBet(currentPlayer, this.currentBet - this.betPerPlayer.get(currentPlayer));
            this.betPerPlayer.set(currentPlayer, this.currentBet);
            break;
        case 'Fold':
            currentPlayer.showHand();
            this.betPerPlayer.delete(currentPlayer);
            this.currentPlayers.splice(this.currentPlayers.indexOf(currentPlayer), 1); 
            break;
        case 'Check':
            break;
        }

        // Betting ends when all players have had a chance to act and all players who haven't folded yet 
        // have bet the same amount of money
        if (this.checkBettingComplete())
        {
            this.playNextGameStep();
        }
        else 
        {
            this.nextPlayer().selectBetAction(this, this.currentBet);
        }
    }

    private playNextGameStep()
    {
        if (this.checkForWinner()) 
        {
            this.startNewGame();
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
            this.startNewGame();      
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
        this.spendBet(this.nextPlayer(), this.smallBlindBet);

        // Place bet for Big Blind
        this.spendBet(this.nextPlayer(), this.bigBlindBet);
    }

    private initializeBetRound(currentPlayer: Player)
    {
        this.currentBet = 0;

        this.betPerPlayer = new Map<Player, number>();
        this.currentPlayers.forEach(player => 
        {
            // Initialize each player with -1 to indicate they have not had a chance to act yet
            this.betPerPlayer.set(player, -1) 
        });

        currentPlayer.selectBetAction(this, this.currentBet); 
    }

    private checkBettingComplete() 
    {
        if (this.currentPlayers.length === 1) 
        {
            return true; 
        }
        this.betPerPlayer.forEach(bet => 
        {
            if (bet !== this.currentBet) 
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

    private startNewGame()
    {
        this.deck.actor.destroy();
        this.board.actor.destroy();
        this.app.createStartMenu();
    }
}
