import * as cdk from 'aws-cdk-lib';
import {Construct} from 'constructs';
import {getMandatoryEnvVariable} from "../src/utils/getMandatoryEnvVariable";
import {Table} from "aws-cdk-lib/aws-dynamodb";
import {Certificate} from "aws-cdk-lib/aws-certificatemanager";
import {IHostedZone} from "aws-cdk-lib/aws-route53";
import {LambdaApi} from "./constructs/LambdaApi";

interface TelegramBotStackProps extends cdk.StackProps {
  ethKeysTable: Table;
  solKeysTable: Table;
  cname: string;
  certificate: Certificate;
  zone: IHostedZone;
}

export class TelegramBotStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: TelegramBotStackProps) {
    super(scope, id, props);
    const { ethKeysTable, solKeysTable, cname, certificate, zone } = props;

    const { lambda } = new LambdaApi(this, "TelegramApiLambda", {
      cname,
      certificate,
      zone,
      entryFile: "telegram.ts",
      lambda: {
        environment: {
          TELEGRAM_BOT_TOKEN: getMandatoryEnvVariable("TELEGRAM_BOT_TOKEN"),
          SOLANA_RPC_URL: getMandatoryEnvVariable("SOLANA_RPC_URL"),
          ETH_KEYS_TABLE: ethKeysTable.tableName,
          SOL_KEYS_TABLE: solKeysTable.tableName,
        },
        memorySize: 1024,
      },
      apiName: `TelegramApi`,
    });

    ethKeysTable.grantReadWriteData(lambda);
    solKeysTable.grantReadWriteData(lambda);
  }
}
