import { defineBackend } from '@aws-amplify/backend';
import { FunctionUrlAuthType, HttpMethod } from 'aws-cdk-lib/aws-lambda';
import './loadEnv.js';
import { purgeTrash } from './functions/purge-trash/resource.js';

const backend = defineBackend({
  purgeTrash,
});

const purgeTrashUrl = backend.purgeTrash.resources.lambda.addFunctionUrl({
  authType: FunctionUrlAuthType.NONE,
  cors: {
    allowedOrigins: ['*'],
    allowedMethods: [HttpMethod.POST],
    allowedHeaders: ['content-type', 'authorization'],
  },
});

backend.addOutput({
  custom: {
    purgeTrashUrl: purgeTrashUrl.url,
  },
});
