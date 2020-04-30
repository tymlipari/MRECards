/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as MRE from '@microsoft/mixed-reality-extension-sdk';
import Deck from './deck';
import Table from './table';
import Player from './player';
import Board from './board';

/**
 * Cards Application
 */
export default class Cards {
	public static AssetContainer: MRE.AssetContainer = null;
	public static BaseUrl: string = null;
	private deck: Deck = null;
	private board: Board = null;
	private players = new Map<MRE.Guid, Player>();

	/**
	 * Constructs a new instance of this class.
	 * @param context The MRE SDK context.
	 * @param baseUrl The baseUrl to this project's `./public` folder.
	 */
	constructor(private context: MRE.Context, private baseUrl: string) {
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
	private started() {
		new Table().CreateActor();
		
		this.deck = new Deck();
		this.deck.CreateActor();

		this.board = new Board();
		this.board.CreateActor();
	}

	/**
	 * Called when a user joins the application.
	 * @param user The user that joined the building.
	 */
	private userJoined(user: MRE.User) {
		// Create and add a new player
		this.addPlayer(user);
	}

	/**
	 * Called when a user leaves the application (probably left the Altspace world where this app is running).
	 * @param user The user that left the building.
	 */
	private userLeft(user: MRE.User) {
		// Delete player who left
		this.removePlayer(user);
	}

	/**
	 * Create and add a new player
	 * @param user The user that left the building.
	 */
	private addPlayer(user: MRE.User) {
		const player = new Player(user.id);
		this.players.set(user.id, player);
		player.drawCards(this.deck, 2);
	}

	/**
	 * Removes player and cards attached to that player.
	 * @param user User to remove.
	 */
	private removePlayer(user: MRE.User) {
		const userId = user.id;
		if (this.players.has(userId)) {
			this.players.get(userId).removeCards();
			this.players.delete(userId);
		}
	}
}
