# Self-destruct-o

A serverless service for posting/retrieving secrets that self destruct from the backend on read.

Secrets are stored in DynamoDB with a 7 day TTL.

DynamoDB stores the data at rest encrypted via DynamoDB server side encryption.

Individual items are encrypted using envelope encryption with per-item encryption keys.

The master key is stored in AWS KMS and only accessible to the root AWS account, and the Lambda function that reads from DynamoDB.

# Installation

First, you need to provision a KMS key.

```
aws kms create-key --region us-east-1 --description 'self-destruct-o'
```

Take note of that KSM key id. Setup a SSM parameter for the key id:

```
aws ssm put-parameter --region us-east-1 \
--name "/self-destruct-o/kms-key-id" \
--value "YOURKEYIDHERE" --type SecureString
```

Setup dependancies

```
npm i serverless -g
npm i
```

Deploy the code to AWS. This will create a DynamoDB table, setup the API Gateway endpoint, upload the Lambda.

```
sls deploy -s dev --region us-east-1
```

This command should output the three API gateway endpoints. To hit the one with the UI, look for the GET endpoint that doesn't have a parameter.

Enjoy your newly created password sharing system.