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

const certificateStack = new CertificateStack(app, 'GonzalezCertificate', {
    env,
    domain: 'gonzalesbot.com',
    crossRegionReferences: true,
})

const databaseStack = new DatabaseStack(app, 'GonzalezDatabase');

new TelegramBotStack(app, 'GonzalezTelegram', {
    env,
    ethKeysTable: databaseStack.ethKeysTable,
    solKeysTable: databaseStack.solKeysTable,
    cname: telegramCname,
    certificate: certificateStack.certificate,
    zone: certificateStack.zone,
    crossRegionReferences: true,
});