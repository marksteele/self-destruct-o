const AWS = require('aws-sdk'); 
const crypto = require('crypto');
const uuidv4 = require('uuid/v4');

const ALGO = 'aes256';
const KeyId = process.env.ENCRYPTION_KEY_ID;
const TableName = process.env.DYNAMODB_TABLE;

class EnvelopeEncrypt {
    saveData(secretData) { 
        const kms = new AWS.KMS();
        return kms.generateDataKey({ KeyId, KeySpec: 'AES_256' }).promise()
          .then((dataKey) => {
            Object.assign(secretData,{
                dataKey: dataKey.CiphertextBlob,
                secret: this.encrypt(dataKey.Plaintext, secretData.secret),
                secretId: uuidv4(),
                ttl: (Math.floor(Date.now()/1000) + (86400 * 7)) // 7 days from now
            });
            const params = {
                TableName,
                Item: secretData,
            };
            const dynamodb = new AWS.DynamoDB.DocumentClient();
            return dynamodb.put(params).promise()
                .then(res => {
                    return secretData.secretId;
                });
          });
    }

  loadData(secretId) {
    const dynamodb = new AWS.DynamoDB.DocumentClient();
    const params = {
      TableName,
      Key: { secretId },
    };
    return dynamodb.get(params).promise()
      .then((record) => {
        if (record.Item !== undefined) {
          const kms = new AWS.KMS();
          return kms.decrypt({ CiphertextBlob: Buffer.from(record.Item.dataKey, 'base64') }).promise()
            .then((dataKey) => {
              Object.assign(record.Item, { secret: this.decrypt(dataKey.Plaintext.toString('base64'), record.Item.secret) });
              return dynamodb
                .delete({TableName, Key: {secretId}})
                .promise()
                .then(res => {
                    return {"secret": record.Item.secret};
                });
            });
        }
        throw new Error('Not found');
      });
  }

  encrypt(keyBase64, payload) {
    const cipher = crypto.createCipher(ALGO, Buffer.from(keyBase64, 'base64'));
    return (Buffer.concat([cipher.update(payload, 'utf8'), cipher.final()])).toString('base64');
  }

  decrypt(keyBase64, payload) {
    const cipher = crypto.createDecipher(ALGO, Buffer.from(keyBase64, 'base64'));
    return (Buffer.concat([cipher.update(payload, 'base64'), cipher.final()])).toString('utf8');
  }
}

module.exports = EnvelopeEncrypt;