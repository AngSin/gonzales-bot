#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { TelegramBotStack } from '../lib/TelegramBotStack';
import {DatabaseStack} from "../lib/DatabaseStack";
import {Environment} from "aws-cdk-lib";
import {getMandatoryEnvVariable} from "../src/utils/getMandatoryEnvVariable";
import {CertificateStack} from "../lib/CertificateStack";

const config = {
    account: getMandatoryEnvVariable('AWS_ACCOUNT_ID'),
    region: getMandatoryEnvVariable('AWS_REGION'),
}

const env: Environment = {
    account: config.account,
    region: config.region,
};

const app = new cdk.App();

const assetsCname = 'assets'
const telegramCname = 'telegram';
const adminCname = 'admin';
const actionsCname = 'actions';
const apiCname = 'api';

const isDev = process.env.DEPLOYMENT_ENV === 'development';

const certificateStack = new CertificateStack(app, `${isDev ? 'Dev' : ''}GonzalezCertificate`, {
    env: {
        ...env,
        region: 'us-east-1', // certificate must be in us-east-1
    },
    domain: `${isDev ? 'dev.' : ''}gonzalesbot.com`,
    crossRegionReferences: true,
})

const databaseStack = new DatabaseStack(app, `${isDev ? 'Dev' : ''}GonzalezDatabase`);

new TelegramBotStack(app, `${isDev ? 'Dev' : ''}GonzalezTelegram`, {
    env,
    ethKeysTable: databaseStack.ethKeysTable,
    solKeysTable: databaseStack.solKeysTable,
    cname: telegramCname,
    certificate: certificateStack.certificate,
    zone: certificateStack.zone,
    crossRegionReferences: true,
});