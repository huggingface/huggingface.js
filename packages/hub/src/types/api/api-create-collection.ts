export interface ApiCreateCollectionPayload {
	/**
	 * Title of the collection to create.
	 */
	title: string;
	/**
	 * Namespace of the collection to create (username or org).
	 */
	namespace: string;
	/**
	 * Description of the collection to create.
	 */
	description?: string;
	/**
	 * Whether the collection should be private or not. Defaults to False (i.e. public collection).
	 * @default false
	 */
	private?: boolean;
	/**
	 * First item to add to the collection upon creation.
	 */
	item?: {
		type: "paper" | "collection" | "space" | "model" | "dataset";
		id: string;
	};
}
