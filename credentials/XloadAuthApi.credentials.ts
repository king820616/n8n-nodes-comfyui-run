import type { ICredentialType, INodeProperties } from 'n8n-workflow';

export class XloadAuthApi implements ICredentialType {
	name = 'xloadAuthApi';
	displayName = 'Xload Authentication API';
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
			headers: {
				'Authorization': `Bearer ${credentials.tokenId}`,
				'X-API-URL': credentials.apiUrl
			}
		};
	}

	async loadOptions() {
		return {
			getTokens: async () => {
				const credentials = await this.getCredentials('xloadAuthApi');
				const response = await fetch(`${credentials.apiUrl}/tokens/list`);
				return response.json();
			}
		};
	}
}
