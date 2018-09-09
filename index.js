'use strict';
const EnvelopeEncrypt = require('./lib/EnvelopeEncrypt.js');
const encryptor = new EnvelopeEncrypt();
const fs = require('fs');
const path = require('path');

module.exports.get = (event, context, callback) => {
    encryptor.loadData(event.pathParameters.id)
    .then((payload) => {
        callback(null,{
            "statusCode": 200,
            "body": JSON.stringify(payload)
        });              
    })
    .catch((err) => {
        callback(null,{
            "statusCode": 404,
            "body": 'Not found'
        });              
    });
};

module.exports.create = (event, context, callback) => {
    encryptor.saveData(JSON.parse(event.body))
    .then((res) => {
        callback(null,{
            "statusCode": 200,
            "body": '{"status":"ok","uuid":"'+res+'"}'
        });              
    })
    .catch((err) => {
        callback(null,{
            "statusCode": 500,
            "body": JSON.stringify(err)
        });              
    });
};

module.exports.index = (event, context, callback) => {
    callback(null,{
        "statusCode": 200,
        "headers": {"content-type": "text/html"},
        "body": fs.readFileSync(
            path.resolve(
                process.env.LAMBDA_TASK_ROOT, 
                '_optimize', 
                process.env.AWS_LAMBDA_FUNCTION_NAME, 
                "ui/index.html"
            )
            ).toString()
    }); 
};