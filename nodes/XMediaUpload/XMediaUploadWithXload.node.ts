import { IExecuteFunctions, INodeType, INodeTypeDescription, NodeOperationError, NodeApiError, INodeExecutionData } from 'n8n-workflow';
import { N8nApiClient } from './apiClient';
import { EUploadMimeType, TwitterApi } from 'twitter-api-v2';
import { Base64InputProvider, BinaryInputProvider, UrlInputProvider } from './inputProviders';
import { XloadAuthApi } from '../credentials/XloadAuth.credentials';

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
				name: 'xloadAuthApi',
				required: true,
			},
		],
		inputs: ['main'],
		outputs: ['main'],
		properties: [
			{
				displayName: 'Input Type',
				name: 'inputType',
				type: 'options',
				options: [
					{ name: 'URL', value: 'url' },
					{ name: 'Base64', value: 'base64' },
					{ name: 'Binary', value: 'binary' }
				],
				default: 'url',
				required: true,
			},
			{
				displayName: 'Media Source',
				name: 'inputMedia',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						inputType: ['url', 'base64'],
					},
				},
				description: 'URL or base64 data of the media file',
			},
			{
				displayName: 'Binary Property',
				name: 'binaryPropertyName',
				type: 'string',
				default: 'data',
				required: true,
				displayOptions: {
					show: {
						inputType: ['binary'],
					},
				},
				description: 'Name of the binary property containing the media file',
			},
			{
				displayName: 'Media Type',
				name: 'mediaType',
				type: 'options',
				default: EUploadMimeType.Mp4.toString(),
				options: [
					{ name: 'Image/PNG', value: EUploadMimeType.Png },
					{ name: 'Image/JPEG', value: EUploadMimeType.Jpeg },
					{ name: 'Image/GIF', value: EUploadMimeType.Gif },
					{ name: 'Video/MP4', value: EUploadMimeType.Mp4 },
					{ name: 'Video/MOV', value: EUploadMimeType.Mov },
				],
				description: 'Type of media being uploaded',
			},
			{
				displayName: 'Create Tweet',
				name: 'createTweet',
				type: 'boolean',
				default: false,
				description: 'Whether to immediately create a tweet with this media',
			},
			{
				displayName: 'Tweet Text',
				name: 'tweetText',
				type: 'string',
				default: '',
				displayOptions: {
					show: {
						createTweet: [true],
					},
				},
				description: 'Text content for the tweet',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const api = new N8nApiClient(this.helpers);
		
		const credentials = await this.getCredentials('xloadAuthApi');
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

		try {
			const me = await appOnlyClient.v2.me();

			// Choose input strategy
			const inputType = this.getNodeParameter('inputType', 0) as string;
			let provider;

			if (inputType === 'url') {
				const inputMedia = this.getNodeParameter('inputMedia', 0) as string;
				provider = new UrlInputProvider(api, inputMedia);
			} else if (inputType === 'base64') {
				const inputMedia = this.getNodeParameter('inputMedia', 0) as string;
				provider = new Base64InputProvider(inputMedia);
			} else {
				const binaryPropertyName = this.getNodeParameter('binaryPropertyName', 0) as string;
				provider = new BinaryInputProvider(this.helpers, binaryPropertyName, this.getInputData());
			}

			const buffer = await provider.getBuffer();

			const mediaType = this.getNodeParameter('mediaType', 0) as EUploadMimeType;
			const createTweet = this.getNodeParameter('createTweet', 0) as boolean;

			// Validate media type matches file format
			if (mediaType === EUploadMimeType.Mp4 && !buffer.slice(0, 4).equals(Buffer.from('66747970', 'hex'))) {
				throw new NodeOperationError(this.getNode(), 'File does not appear to be a valid MP4 file');
			}

			const uploadMedia = await appOnlyClient.v2.uploadMedia(buffer, {
				media_type: mediaType,
				additional_owners: [me.data.id],
			});

			const result: any = {
				mediaId: uploadMedia,
				mediaUrl: `https://twitter.com/${me.data.username}/status/${uploadMedia}`,
				userId: me.data.id
			};

			if (createTweet) {
				const tweetText = this.getNodeParameter('tweetText', 0) as string;
				const tweet = await appOnlyClient.v2.tweet(tweetText, {
					media: { media_ids: [uploadMedia] }
				});
				result.tweetId = tweet.data.id;
				result.tweetUrl = `https://twitter.com/${me.data.username}/status/${tweet.data.id}`;
			}

			return [this.helpers.returnJsonArray(result)];

		} catch (err: any) {
			throw new NodeApiError(this.getNode(), {
				message: `${err.message}: ${JSON.stringify(credentials)}`
			});
		}
	}
}
