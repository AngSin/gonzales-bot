import { CfnOutput, Duration, Stack } from "aws-cdk-lib";
import {
  NodejsFunction,
  NodejsFunctionProps,
} from "aws-cdk-lib/aws-lambda-nodejs";
import { Architecture, Runtime } from "aws-cdk-lib/aws-lambda";
import * as path from "path";
import { RetentionDays } from "aws-cdk-lib/aws-logs";
import {
  AllowedMethods,
  CachePolicy,
  Distribution,
  HttpVersion,
  OriginProtocolPolicy,
  OriginRequestPolicy,
  PriceClass,
  SecurityPolicyProtocol,
  ViewerProtocolPolicy,
} from "aws-cdk-lib/aws-cloudfront";
import { HttpOrigin } from "aws-cdk-lib/aws-cloudfront-origins";
import { HttpApi, PayloadFormatVersion } from "aws-cdk-lib/aws-apigatewayv2";
import { HttpLambdaIntegration } from "aws-cdk-lib/aws-apigatewayv2-integrations";
import { Certificate } from "aws-cdk-lib/aws-certificatemanager";
import { ARecord, IHostedZone, RecordTarget } from "aws-cdk-lib/aws-route53";
import { CloudFrontTarget } from "aws-cdk-lib/aws-route53-targets";
import {getMandatoryEnvVariable} from "../../src/utils/getMandatoryEnvVariable";

export type LambdaApiProps = {
  zone: IHostedZone;
  certificate: Certificate;
  cname: string;
  entryFile: string;
  lambda: Omit<NodejsFunctionProps, "entry">;
  apiName: string;
};

export class LambdaApi {
  readonly lambda: NodejsFunction;
  readonly distribution: Distribution;
  readonly api: HttpApi;
  readonly aRecord: ARecord;

  constructor(scope: Stack, id: string, props: LambdaApiProps) {
    const { lambda, entryFile, zone, certificate, cname, apiName } = props;

    const domainName = `${cname}.${zone.zoneName}`;

    this.lambda = new NodejsFunction(scope, `${apiName}Handler`, {
      runtime: Runtime.NODEJS_22_X,
      timeout: Duration.seconds(5),
      architecture: Architecture.ARM_64,
      description: `Handler function for the ${id} api`,
      memorySize: 256,
      entry: path.join(__dirname, `../../src/handlers/${entryFile}`),
      logRetention: RetentionDays.TWO_WEEKS,
      handler: "handler",
      bundling: {
        externalModules: ["@aws-sdk"],
        minify: true,
      },
      ...lambda,
    });

    this.api = new HttpApi(scope, "HttpApi", {
      apiName,
      defaultIntegration: new HttpLambdaIntegration(
        `${id}ApiIntegration`,
        this.lambda,
        {
          payloadFormatVersion: PayloadFormatVersion.VERSION_2_0,
        },
      ),
    });

    this.distribution = new Distribution(scope, `Distribution`, {
      certificate,
      domainNames: [domainName],
      comment: `${id} distribution to serve API`,
      defaultBehavior: {
        origin: new HttpOrigin(
          `${this.api.apiId}.execute-api.${getMandatoryEnvVariable('AWS_REGION')}.amazonaws.com`,
          {
            protocolPolicy: OriginProtocolPolicy.HTTPS_ONLY,
            readTimeout: Duration.minutes(1),
          },
        ),
        cachePolicy: CachePolicy.CACHING_DISABLED,
        allowedMethods: AllowedMethods.ALLOW_ALL,
        viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        originRequestPolicy: OriginRequestPolicy.fromOriginRequestPolicyId(
          scope,
          "OriginRequestPolicy",
          "b689b0a8-53d0-40ab-baf2-68738e2966ac",
        ),
        compress: false,
      },
      httpVersion: HttpVersion.HTTP2_AND_3,
      priceClass: PriceClass.PRICE_CLASS_100,
      minimumProtocolVersion: SecurityPolicyProtocol.TLS_V1_2_2021,
    });

    this.aRecord = new ARecord(scope, `ApiARecord`, {
      zone,
      recordName: cname,
      target: RecordTarget.fromAlias(new CloudFrontTarget(this.distribution)),
      ttl: Duration.hours(12),
    });

    new CfnOutput(scope, "ApiUrl", {
      value: this.aRecord.domainName,
      exportName: `${id}:Api:Url`,
      description: `${id} api url`,
    });
  }
}
