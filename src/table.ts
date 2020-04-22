/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as MRE from '@microsoft/mixed-reality-extension-sdk';

export default class Table {
	public static readonly Height = 1.32;
	public actor: MRE.Actor = null;

	public CreateActor(assetContainer: MRE.AssetContainer, baseUrl: string): MRE.Actor {
		if (this.actor !== null)
			throw new Error("Actor already created! Access with .actor");

		const tableScale = { x: 0.16, y: 0.18, z: 0.08 };
		
		this.actor = MRE.Actor.CreateFromGltf(assetContainer, {
			uri: `${baseUrl}/table.glb`,
			actor: {
				name: 'Table',
				transform: {
					local: { scale: tableScale, position: { x: 0, y: 0, z: 0 } }
				}
			}
		});

		return this.actor;
	}
}
