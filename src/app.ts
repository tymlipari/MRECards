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
        const tablePosition = this.table.actor.transform.local.position;

        // Create a parent object for all the menu items.
        const menu = MRE.Actor.Create(this.context, {});

        const menuMesh = Cards.AssetContainer.createBoxMesh('Start Menu', 1, 0.6, 0.01);
        MRE.Actor.Create(this.context, 
            {
                actor:
                {
                    name: 'Menu Background',
                    parentId: menu.id,
                    appearance: { meshId: menuMesh.id },
                    transform:
                    {
                        local: { position: tablePosition.add(new MRE.Vector3(0, 1.3, 0.01)) }
                    }
                }
            });

        // Create menu button
        const buttonMesh = Cards.AssetContainer.createBoxMesh('Button', 0.3, 0.15, 0.01);
        const button = MRE.Actor.Create(this.context, 
            {
                actor: 
                {
                    name: 'Start Button',
                    parentId: menu.id,
                    appearance: { meshId: buttonMesh.id },
                    collider: { geometry: { shape: MRE.ColliderType.Auto } },
                    transform: 
                    { 
                        local: { position: tablePosition.add(new MRE.Vector3(0, 1.3, 0)) } 
                    }
                }
            });

        MRE.Actor.Create(this.context,
            {
                actor:
                {
                    name: 'Start Button Text',
                    parentId: menu.id,
                    text: 
                    {
                        contents: 'Start',
                        height: 0.05,
                        anchor: MRE.TextAnchorLocation.MiddleCenter
                    },
                    transform:
                    {
                        local: { position: tablePosition.add(new MRE.Vector3(0, 1.3, -0.02)) }
                    }
                }
            });

        // Create a label for the menu entry.
        MRE.Actor.Create(this.context, 
            {
                actor: 
                {
                    parentId: menu.id,
                    name: 'Start Menu Text',
                    text: 
                    {
                        contents: 'Click Button Below to Start Game',
                        anchor: MRE.TextAnchorLocation.MiddleCenter,
                        height: 0.05
                    },
                    transform: 
                    {
                        local: { position: tablePosition.add(new MRE.Vector3(0, 1.5, -0.01)) }
                    }
                }
            });

        // Set a click handler on the button.
        button.setBehavior(MRE.ButtonBehavior).onClick(__ => 
        {
            if (this.players.size > 1) 
            {
                menu.children.forEach(child => child.destroy());
                menu.destroy();
                this.startGame(); 
            }
            else
            {
                if (menu.findChildrenByName('Error Message', false).length === 0)
                {
                    MRE.Actor.Create(this.context, 
                        {
                            actor: 
                            {
                                parentId: menu.id,
                                name: 'Error Message',
                                text: 
                                {
                                    contents: "Need more than one player to start game",
                                    anchor: MRE.TextAnchorLocation.MiddleCenter,
                                    height: 0.05,
                                    color: new MRE.Color3(1, 0, 0)
                                },
                                transform: 
                                {
                                    local: { position: tablePosition.add(new MRE.Vector3(0, 1.1, -0.01)) }
                                }
                            }
                        });
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

        const game = new Game(this.players, this.board, this.deck, 5, 10);
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
            this.players.get(userId).removeCards();
            this.players.delete(userId);
        }
    }
}
