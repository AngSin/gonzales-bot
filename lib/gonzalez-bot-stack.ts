import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import { getMandatoryEnvVariable } from "../src/utils/getMandatoryEnvValue";

export class GonzalezBotStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const vpc = new ec2.Vpc(this, 'GonzalezBotVpc', {
      maxAzs: 2, // Availability Zones
    });

    const cluster = new ecs.Cluster(this, 'GonzalezBotCluster', {
      vpc,
    });

    // Create a task execution role with the required policies
    const taskExecutionRole = new iam.Role(this, 'GonzalezBotTaskExecutionRole', {
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
    });

    taskExecutionRole.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonECSTaskExecutionRolePolicy'));

    const taskDefinition = new ecs.FargateTaskDefinition(this, 'GonzalezBotTask', {
      memoryLimitMiB: 512,
      cpu: 256,
      executionRole: taskExecutionRole, // Attach the execution role
    });

    taskDefinition.addContainer('GonzalezBotContainer', {
      image: ecs.ContainerImage.fromRegistry(getMandatoryEnvVariable("IMAGE_URI")),
      logging: ecs.LogDrivers.awsLogs({ streamPrefix: 'GonzalezBot' }),
      environment: {
        Gonzalez_TOKEN: '<your-Gonzalez-bot-token>',
      },
    });

    new ecs.FargateService(this, 'GonzalezBotService', {
      cluster,
      taskDefinition,
      desiredCount: 1,
    });
  }
}
