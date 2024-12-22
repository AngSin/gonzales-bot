#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { GonzalezBotStack } from '../lib/gonzalez-bot-stack';
import {DatabaseStack} from "../lib/database-stack";
import {Environment} from "aws-cdk-lib";
import {getMandatoryEnvVariable} from "../src/utils/getMandatoryEnvVariable";

const config = {
    account: getMandatoryEnvVariable('AWS_ACCOUNT_ID'),
    region: getMandatoryEnvVariable('AWS_REGION'),
}

const assetCname = 'assets'

const env: Environment = {
    account: config.account,
    region: config.region,
};

const app = new cdk.App();

const databaseStack = new DatabaseStack(app, 'keysData');

new GonzalezBotStack(app, 'GonzalezBotStack', {
    env,
    ethKeysTable: databaseStack.ethKeysTable,
    solKeysTable: databaseStack.solKeysTable,
});