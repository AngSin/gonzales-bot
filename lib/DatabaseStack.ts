import {Stack} from 'aws-cdk-lib'
import {AttributeType, BillingMode, Table, TableEncryption} from 'aws-cdk-lib/aws-dynamodb'
import {Construct} from 'constructs'

export class DatabaseStack extends Stack {
    readonly ethKeysTable: Table;
    readonly solKeysTable: Table;
    constructor(scope: Construct, id: string) {
        super(scope, id);

        const ethTableName = 'EthKeysTable';
        const solTableName = 'SolKeysTable';

        this.ethKeysTable = new Table(this, ethTableName, {
            tableName: ethTableName,
            partitionKey: {
                type: AttributeType.STRING,
                name: 'key',
            },
            encryption: TableEncryption.AWS_MANAGED,
            writeCapacity: 12,
            readCapacity: 12,
            billingMode: BillingMode.PROVISIONED,
            timeToLiveAttribute: 'ttl',
        });

        this.solKeysTable = new Table(this, solTableName, {
            tableName: solTableName,
            partitionKey: {
                type: AttributeType.STRING,
                name: 'key',
            },
            encryption: TableEncryption.AWS_MANAGED,
            writeCapacity: 12,
            readCapacity: 12,
            billingMode: BillingMode.PROVISIONED,
            timeToLiveAttribute: 'ttl',
        });
    }
}