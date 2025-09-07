import type { ICredentialType, INodeProperties } from 'n8n-workflow';

export class XloadAuth implements ICredentialType {
	name = 'xloadAuth';
	displayName = 'Xload Authentication';
	documentationUrl = 'https://your-api-docs.com';
	properties: INodeProperties[] = [
		{
			displayName: 'API URL',
			name: 'apiUrl',
			type: 'string',
			default: 'https://api.xload.com',
			required: true,
		},
		{
			displayName: 'Token ID',
			name: 'tokenId',
			type: 'options',
			typeOptions: {
				loadOptionsMethod: 'getTokens',
			},
			default: '',
			required: true,
			description: 'Select an API token from Xload service',
		},
	];

	async authenticate(credentials: ICredentialDataDecryptedObject) {
		return { 
			apiUrl: credentials.apiUrl as string,
			tokenId: credentials.tokenId as string
		};
	}
}
