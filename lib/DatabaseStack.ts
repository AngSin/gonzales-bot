import * as cdk from 'aws-cdk-lib'
import {Stack} from 'aws-cdk-lib'
import {AttributeType, BillingMode, Table, TableEncryption} from 'aws-cdk-lib/aws-dynamodb'
import {Construct} from 'constructs'

interface DatabaseStackProps extends cdk.StackProps {
    ethTableName: string;
    solTableName: string;
}

export class DatabaseStack extends Stack {
    readonly ethKeysTable: Table;
    readonly solKeysTable: Table;
    constructor(scope: Construct, id: string, { ethTableName, solTableName }: DatabaseStackProps) {
        super(scope, id);

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