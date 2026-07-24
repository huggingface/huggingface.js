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
	 * Assign the collection to a resource group of the owning organization.
	 * Only valid for organization-owned collections. 24-character hexadecimal string.
	 */
	resourceGroupId?: string;
}
