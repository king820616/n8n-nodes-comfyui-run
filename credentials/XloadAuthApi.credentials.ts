import type { 
  ICredentialType, 
  INodeProperties, 
  ICredentialDataDecryptedObject,
  IHttpRequestOptions,
  ICredentialTestFunctions 
} from 'n8n-workflow';

export class XloadAuthApi implements ICredentialType {
	name = 'xloadAuthApi';
	displayName = 'Xload Authentication API';
	documentationUrl = 'https://your-api-docs.com';
	helpers: ICredentialTestFunctions;
	properties: INodeProperties[] = [
		{
			displayName: 'API URL',
			name: 'apiUrl',
			type: 'string',
			default: 'https://api.xload.com',
			required: true,
		},
	];

	async authenticate(
		credentials: ICredentialDataDecryptedObject,
		requestOptions: IHttpRequestOptions
	): Promise<IHttpRequestOptions> {
		return {
			...requestOptions,
			headers: {
				...requestOptions.headers,
				'Authorization': `Bearer ${credentials.tokenId}`,
				'X-API-URL': credentials.apiUrl
			},
			url: credentials.apiUrl as string
		};
	}

}
