/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as MRE from '@microsoft/mixed-reality-extension-sdk';
import Deck from './deck';
import Table from './table';

/**
 * Cards Application - Attaches a cube to each avatar's hand.
 */
export default class Cards {
	private assetContainer: MRE.AssetContainer = null;
	private deck: Deck = null;
	// Container for all cubes attached to avatars' hands
	private attachedCubes = new Map<MRE.Guid, MRE.Actor[]>();

	/**
	 * Constructs a new instance of this class.
	 * @param context The MRE SDK context.
	 * @param baseUrl The baseUrl to this project's `./public` folder.
	 */
	constructor(private context: MRE.Context, private baseUrl: string) {
		this.assetContainer = new MRE.AssetContainer(this.context);

		// Hook the context events we're interested in.
		this.context.onStarted(() => this.started());
		this.context.onUserJoined(user => this.userJoined(user));
		this.context.onUserLeft(user => this.userLeft(user));
	}

	/**
	 * Once the context is "started", initialize the app.
	 */
	private started() {
		new Table().CreateActor(this.assetContainer, this.baseUrl);
		this.deck = new Deck();
		this.deck.CreateActor(this.assetContainer, this.baseUrl);
	}

	/**
	 * Called when a user joins the application.
	 * @param user The user that joined the building.
	 */
	private userJoined(user: MRE.User) {
		// Attach cubes to the user's hands
		this.attachCubes(user);
	}

	/**
	 * Called when a user leaves the application (probably left the Altspace world where this app is running).
	 * @param user The user that left the building.
	 */
	private userLeft(user: MRE.User) {
		// Delete cubes attached to user's hands
		this.removeCubes(user);
	}

	/**
	 * Attaches cubes to a user's hand.
	 * @param user User to attach cubes to.
	 */
	private attachCubes(user: MRE.User) {
		const userID = user.id;

		// Load a glTF model
		const leftHandCube = MRE.Actor.CreateFromGltf(new MRE.AssetContainer(this.context), {
			// at the given URL
			uri: `${this.baseUrl}/altspace-cube.glb`,
			actor: {
				name: 'Left Cube',
				transform: { local: { scale: { x: 0.05, y: 0.05, z: 0.05 } } },
				attachment: {
					attachPoint: "left-hand",
					userId: userID
				}
			}
		});

		const rightHandCube = MRE.Actor.CreateFromGltf(new MRE.AssetContainer(this.context), {
			uri: `${this.baseUrl}/altspace-cube.glb`,
			actor: {
				name: 'Right Cube',
				transform: { local: { scale: { x: 0.05, y: 0.05, z: 0.05 } } },
				attachment: {
					attachPoint: "right-hand",
					userId: userID
				}
			}
		});

		const cardActor = this.deck.DrawCard().CreateActor(this.assetContainer, this.baseUrl, userID, 'left-hand');
		// Because of the weird rotation stuff we have to do to get the cards into a reasonable orientation,
		// the offsets for the cards in x, y, z translate to up, left, and forward respectively.
		// the rotations in euler angles are x = pitch, y = yaw, z = roll
		const handOffsetRotation = MRE.Quaternion.FromEulerAngles(-Math.PI / 8, -Math.PI / 6, Math.PI / 10);
		const handOffsetPosition = new MRE.Vector3(0.05, -0.05, 0.15);
		cardActor.transform.local.rotation.multiplyInPlace(handOffsetRotation);
		cardActor.transform.local.position.addInPlace(handOffsetPosition);

		this.attachedCubes.set(userID, [leftHandCube, rightHandCube, cardActor]);
	}

	/**
	 * Removes attached cubes from a user's hand.
	 * @param user User to remove cubes from.
	 */
	private removeCubes(user: MRE.User) {
		if (this.attachedCubes.has(user.id)) {
			this.attachedCubes.get(user.id).forEach(element => { element.destroy(); })
		}
		this.attachedCubes.delete(user.id);
	}
}
