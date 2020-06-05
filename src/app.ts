/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as MRE from '@microsoft/mixed-reality-extension-sdk';
import Deck from './deck';
import Table from './table';
import Player from './player';
import Board from './board';
import Game from './game';
import Menu from './menu';

/**
 * Cards Application
 */
export default class Cards 
{
    public static AssetContainer: MRE.AssetContainer = null;
    public static BaseUrl: string = null;
    private deck: Deck = null;
    private board: Board = null;
    private table: Table = null;
    private players = new Map<MRE.Guid, Player>();

    /**
     * Constructs a new instance of this class.
     * @param context The MRE SDK context.
     * @param baseUrl The baseUrl to this project's `./public` folder.
     */
    constructor(private context: MRE.Context, private baseUrl: string) 
    {
        Cards.AssetContainer = new MRE.AssetContainer(this.context);
        Cards.BaseUrl = this.baseUrl;

        // Hook the context events we're interested in.
        this.context.onStarted(() => this.started());
        this.context.onUserJoined(user => this.userJoined(user));
        this.context.onUserLeft(user => this.userLeft(user));
    }

    /**
     * Once the context is "started", initialize the app.
     */
    private started() 
    {
        this.table = new Table();
        this.table.CreateActor();

        this.createStartMenu();
    }

    public createStartMenu()
    {
        const menu = new Menu(this.context);
        const tablePosition = this.table.actor.transform.local.position;
        menu.createMenuBackground(
            'menu-background', 
            new MRE.Vector3(1, 0.53, 0.01), 
            tablePosition.add(new MRE.Vector3(0, 1.3, 0.01)));
        menu.createMenuText(
            'menu-text', 
            'Click Button Below to Start Game', 
            0.05, 
            tablePosition.add(new MRE.Vector3(0, 1.5, 0)));
        const button = menu.createButtonWithText(
            'start-button', 
            new MRE.Vector3(0.3, 0.15, 0.01), 
            tablePosition.add(new MRE.Vector3(0, 1.3, 0)),
            'Start',
            0.05);

        // Handle when start button is clicked
        button.setBehavior(MRE.ButtonBehavior).onClick(__ => 
        {
            if (this.players.size > 1) 
            {
                menu.destroy();
                this.startGame();
            }
            else
            {
                if (menu.parentActor.findChildrenByName('error-message', false).length === 0)
                {
                    menu.createMenuErrorText(
                        'error-message', 
                        'Need more than one player to start game', 
                        0.05, 
                        tablePosition.add(new MRE.Vector3(0, 1.1, 0)));
                }
            }
        });
    }

    private startGame() 
    {
        this.deck = new Deck();
        this.deck.CreateActor();

        this.board = new Board();
        this.board.CreateActor();

        const game = new Game(
            this,
            this.players, 
            this.board, 
            this.deck, 
            5, 
            10);
        game.playGame();
    }

    /**
     * Called when a user joins the application.
     * @param user The user that joined the building.
     */
    private userJoined(user: MRE.User) 
    {
        // Create and add a new player
        this.addPlayer(user);
    }

    /**
     * Called when a user leaves the application (probably left the Altspace world where this app is running).
     * @param user The user that left the building.
     */
    private userLeft(user: MRE.User) 
    {
        // Delete player who left
        this.removePlayer(user);
    }

    /**
     * Create and add a new player
     * @param user The user that left the building.
     */
    private addPlayer(user: MRE.User) 
    {
        const player = new Player(user);
        player.playerNumber = this.players.size;
        this.players.set(user.id, player);
    }

    /**
     * Removes player and cards attached to that player.
     * @param user User to remove.
     */
    private removePlayer(user: MRE.User) 
    {
        const userId = user.id;
        if (this.players.has(userId)) 
        {
            const removedPlayer = this.players.get(userId);
            this.players.delete(userId);

            removedPlayer.removeCards();
            const removedPlayerNumber = removedPlayer.playerNumber;
            this.players.forEach(player => 
            {
                if (player.playerNumber > removedPlayerNumber)
                {
                    player.playerNumber -= 1;
                }
            })
        }
    }
}
