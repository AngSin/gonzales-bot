import { Logger } from '@aws-lambda-powertools/logger';
import { DynamoDBClient, GetItemCommand, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { Keypair } from '@solana/web3.js';
import { Key } from '../types';
import {getMandatoryEnvVariable} from "../utils/getMandatoryEnvVariable";

export class SolanaKeyService {
    private readonly logger = new Logger({ serviceName: 'KeyService' });
    private readonly dynamoDb = new DynamoDBClient();
    private readonly tableName = getMandatoryEnvVariable('SOL_KEYS_TABLE');

    generateNewKey = async (name: string): Promise<Key> => {
        try {
            const { publicKey, secretKey } = Keypair.generate()
            const publicKeyValue = publicKey.toBase58()
            const key: Key = {
                privateKey: secretKey,
                publicKey: publicKeyValue,
                name,
            }
            await this.saveKey(key)
            return key
        } catch (e) {
            this.logger.error(`Failed to generate keypair for name ${name}`, { error: e, name });
            throw e;
        }
    }

    private saveKey = async ({ name, privateKey, publicKey }: Key) => {
        try {
            const privateKeyValue = JSON.stringify(Array.from(privateKey))
            await this.dynamoDb.send(new PutItemCommand({
                Item: marshall({
                    name,
                    privateKey: privateKeyValue,
                    publicKey,
                    key: name,
                    createdAt: new Date().toISOString(),
                }),
                TableName: this.tableName,
                ConditionExpression: 'attribute_not_exists(#key)',
                ExpressionAttributeNames: {
                    '#key': 'key',
                },
            }));
        } catch (e) {
            this.logger.error(`Failed to store key for name ${name}`, { name, error: e });
        }
    }

    getKey = async (name: string): Promise<Key | null> => {
        try {
            const response = await this.dynamoDb.send(new GetItemCommand({
                Key: marshall({ key: name }),
                TableName: this.tableName,
            }))
            if (!response.Item) {
               this.logger.info(`No item found for ${name}`);
               return null;
            }
            const body = unmarshall(response.Item)
            return {
                name,
                privateKey: Uint8Array.from(JSON.parse(body.privateKey) as Array<number>),
                publicKey: body.publicKey,
            }
        } catch (e) {
            this.logger.error(`Failed to find key for name ${name}`, { error: e, name });
            return null;
        }
    }
}