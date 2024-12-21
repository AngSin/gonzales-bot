#!/bin/bash
source .env
# Variables
REPOSITORY_NAME="gonzalez-bot"
ECR_URI="$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com"

# Check if the repository exists; if not, create it
REPO_CHECK=$(aws ecr describe-repositories --repository-names $REPOSITORY_NAME --profile $AWS_PROFILE --region $AWS_REGION 2>/dev/null)

if [ $? -ne 0 ]; then
  echo "Repository $REPOSITORY_NAME does not exist. Creating it now..."
  aws ecr create-repository --repository-name $REPOSITORY_NAME --profile $AWS_PROFILE --region $AWS_REGION
else
  echo "Repository $REPOSITORY_NAME already exists, using it."
fi

echo "Building Docker image..."
docker buildx build --platform linux/amd64,linux/arm64 -t $REPOSITORY_NAME --push .

echo "Authenticating Docker to ECR..."
aws ecr get-login-password --profile $AWS_PROFILE --region $AWS_REGION | docker login --username AWS --password-stdin $ECR_URI

echo "Tagging Docker image..."
docker tag $REPOSITORY_NAME:latest $ECR_URI/$REPOSITORY_NAME:latest

echo "Pushing Docker image to ECR..."
docker push $ECR_URI/$REPOSITORY_NAME:latest

IMAGE_URI="$ECR_URI/$REPOSITORY_NAME:latest"

echo "Image successfully pushed to ECR: $IMAGE_URI"

# Pass the IMAGE_URI as an environment variable to the CDK deploy command
IMAGE_URI=$IMAGE_URI npx cdk deploy --profile $AWS_PROFILE --region $AWS_REGION