import { AssumeRoleCommand, STSClient } from '@aws-sdk/client-sts';
import { EVER_API, S3_BUCKET } from '@hey/data/constants';
import logger from '@hey/lib/logger';
import catchedError from '@utils/catchedError';
import type { Handler } from 'express';

const params = {
  DurationSeconds: 900,
  Policy: `{
    "Version": "2012-10-17",
    "Statement": [
      {
        "Effect": "Allow",
        "Action": [
          "s3:PutObject",
          "s3:GetObject",
          "s3:AbortMultipartUpload"
        ],
        "Resource": [
          "arn:aws:s3:::${S3_BUCKET.HEY_MEDIA}/*"
        ]
      }
    ]
  }`
};

export const get: Handler = async (req, res) => {
  try {
    const accessKeyId = process.env.EVER_ACCESS_KEY as string;
    const secretAccessKey = process.env.EVER_ACCESS_SECRET as string;
    const stsClient = new STSClient({
      endpoint: EVER_API,
      region: 'us-west-2',
      credentials: { accessKeyId, secretAccessKey }
    });
    const command = new AssumeRoleCommand({
      ...params,
      RoleArn: undefined,
      RoleSessionName: undefined
    });
    const { Credentials: credentials } = await stsClient.send(command);
    logger.info('STS token generated');

    return res.status(200).json({
      success: true,
      accessKeyId: credentials?.AccessKeyId,
      secretAccessKey: credentials?.SecretAccessKey,
      sessionToken: credentials?.SessionToken
    });
  } catch (error) {
    return catchedError(res, error);
  }
};
