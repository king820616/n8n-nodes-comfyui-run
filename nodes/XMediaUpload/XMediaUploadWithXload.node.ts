import { IExecuteFunctions, INodeType, INodeTypeDescription, NodeOperationError, NodeApiError, INodeExecutionData } from 'n8n-workflow';
import { N8nApiClient } from './apiClient';
import { EUploadMimeType, TwitterApi } from 'twitter-api-v2';
import { Base64InputProvider, BinaryInputProvider, UrlInputProvider } from './inputProviders';
import { XloadAuth } from '../credentials/XloadAuth.credentials';

export class XMediaUploadWithXload implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'X/Twitter Media Upload (via Xload)',
		name: 'xMediaUploadWithXload',
		icon: 'file:comfyui.svg',
		group: ['output'],
		version: 1,
		description: 'Upload media to X/Twitter using Xload token service',
		defaults: {
			name: 'X/Twitter Media Upload via Xload',
		},
		credentials: [
			{
				name: 'xloadAuth',
				required: true,
			},
		],
		inputs: ['main'],
		outputs: ['main'],
		properties: [
			// Keep same properties as XMediaUpload.node.ts
			// ... (same property definitions as original XMediaUpload)
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const api = new N8nApiClient(this.helpers);
		
		const credentials = await this.getCredentials('xloadAuth');
		const apiUrl = credentials.apiUrl as string;
		const tokenId = credentials.tokenId as string;

		// Get token list from Xload service
		const tokens = await this.helpers.request({
			method: 'GET',
			url: `${apiUrl}/tokens/list`,
			json: true,
		});

		// Find selected token
		const token = tokens.find((t: any) => t.id === tokenId);
		if (!token) {
			throw new NodeOperationError(this.getNode(), `No token found with ID ${tokenId}`);
		}

		const appOnlyClient = new TwitterApi(token.accessToken);

		// Rest of the execute function remains same as original XMediaUpload
		// ... (same execution logic as original XMediaUpload)
	}
}
