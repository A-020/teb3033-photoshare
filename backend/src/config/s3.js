const { S3Client } = require('@aws-sdk/client-s3');

// One shared S3 client for the whole API.
// No keys are written here. Locally the SDK reads AWS_ACCESS_KEY_ID and
// AWS_SECRET_ACCESS_KEY from .env. On EC2 the IAM role supplies credentials
// automatically (see guide 4.2).
module.exports = new S3Client({ region: process.env.AWS_REGION });
