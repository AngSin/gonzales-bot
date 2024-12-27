import { StackProps } from "aws-cdk-lib";
import {
    Certificate,
    CertificateValidation,
} from "aws-cdk-lib/aws-certificatemanager";
import { IHostedZone, PublicHostedZone } from "aws-cdk-lib/aws-route53";
import { Construct } from "constructs";
import * as cdk from "aws-cdk-lib";

export interface CertificateStackProps extends StackProps {
    domain: string;
}

export class CertificateStack extends cdk.Stack {
    readonly certificate: Certificate;
    readonly zone: IHostedZone;

    constructor(scope: Construct, id: string, props: CertificateStackProps) {
        super(scope, id, props);

        const { domain } = props;

        this.zone = PublicHostedZone.fromLookup(this, "Zone", {
            domainName: domain,
        });

        this.certificate = new Certificate(this, 'Cert', {
            domainName: domain,
            subjectAlternativeNames: [`*.${domain}`],
            validation: CertificateValidation.fromDns(this.zone),
        });
    }
}
