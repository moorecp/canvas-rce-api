const EventEmitter = require('events')
const awsServerlessExpress = require('aws-serverless-express')

class AppEmitter extends EventEmitter {}
const emitter = new AppEmitter();

let appInstance;
let server;

const AWS = require('aws-sdk')
const region = "us-east-1"
const secretName = "canvas-rce-api"
const awsClient = new AWS.SecretsManager({
  region: region
});

new Promise((resolve, reject) => {
  awsClient.getSecretValue({SecretId: secretName}, function(err, data) {
    if (err) {
      if (err.code === 'DecryptionFailureException')
        // Secrets Manager can't decrypt the protected secret text using the provided KMS key.
        // Deal with the exception here, and/or rethrow at your discretion.
        reject(err);
      else if (err.code === 'InternalServiceErrorException')
        // An error occurred on the server side.
        // Deal with the exception here, and/or rethrow at your discretion.
        reject(err);
      else if (err.code === 'InvalidParameterException')
        // You provided an invalid value for a parameter.
        // Deal with the exception here, and/or rethrow at your discretion.
        reject(err);
      else if (err.code === 'InvalidRequestException')
        // You provided a parameter value that is not valid for the current state of the resource.
        // Deal with the exception here, and/or rethrow at your discretion.
        reject(err);
      else if (err.code === 'ResourceNotFoundException')
        // We can't find the resource that you asked for.
        // Deal with the exception here, and/or rethrow at your discretion.
        reject(err);
    } else {
      // Decrypts secret using the associated KMS CMK.
      // Depending on whether the secret is a string or binary, one of these fields will be populated.
      const secrets = JSON.parse(data.SecretString)
      process.env.ECOSYSTEM_KEY = secrets.ECOSYSTEM_KEY;
      process.env.ECOSYSTEM_SECRET = secrets.ECOSYSTEM_SECRET;
      resolve();
    }
  })
}).then(() => {
  appInstance = require('./app')
  const binaryMimeTypes = [
    'application/json',
  ];
  server = awsServerlessExpress.createServer(appInstance, null, binaryMimeTypes);

  emitter.emit('initialized');
})

const onInitialized = () =>
  new Promise((resolve, reject) => {
    emitter.on('initialized', () => {
      resolve();
    });
  });

const proxyEventToServer = (event, context) =>
  new Promise(resolve => {
    awsServerlessExpress.proxy(server, event, {
      ...context,
      succeed: process.env.IS_OFFLINE ? context.succeed : resolve,
    });
  });

const serverless = async (event, context) => {
  if (!appInstance) {
    await onInitialized();
  }

  // Sometimes we receive encoded stuff in the url.
  // So we need to decode this to get Express parsing things properly.
  // We used to run this through Elastic Beanstalk and then API Gateway, and they decoded it for us.
  // Now we are using more custom stuff and DIY is required.

  // this is the home for our parsed query data.
  const query = {};

  // merge the raw query into one object.
  // it can come from different sources depending on API Gateway or Application Load Balancer.
  const raw_query = {
    ...(event.query || {}),
    ...(event.queryStringParameters || {}),
  };

  // decode everything back into utf-8 text.
  for (const key in raw_query) {
    const formatted_key = decodeURIComponent(key);

    query[formatted_key] = decodeURIComponent(raw_query[key]);
  }

  // set the parsed query back onto the event.
  event.query = query;
  event.queryStringParameters = query;

  // return awsServerlessExpress.proxy(server, event, context, 'PROMISE').promise;
  return proxyEventToServer(event, context);
};

exports.handler = serverless
