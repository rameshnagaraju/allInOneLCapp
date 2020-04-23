"use strict";

const AWS = require("aws-sdk");

const TRAININGS_TABLE = "myTrainingTable";
const AWS_DEPLOY_REGION = "us-east-1";
const dynamoDb = new AWS.DynamoDB.DocumentClient({
  api_version: "2012-08-10",
  region: AWS_DEPLOY_REGION,
});

module.exports.handler = async (event) => {
  switch (event.httpMethod) {
    case "POST":
      let parsedJsonobj;
      parsedJsonobj = JSON.parse(event.body);
      const {
        trainingId,
        trainingName,
        trainingDescription,
        resourceName,
      } = parsedJsonobj;

      const postparams = {
        TableName: TRAININGS_TABLE,
        Item: {
          trainingId,
          trainingName,
          trainingDescription,
          resourceName,
        },
      };

      try {
        const data = await dynamoDb.put(postparams).promise();
        console.log(`createTraining data=${JSON.stringify(data)}`);
        return {
          statusCode: 200,
          body: JSON.stringify(postparams.Item.trainingId),
        };
      } catch (error) {
        console.log(`createTraining ERROR=${error.stack}`);
        return {
          statusCode: 400,
          body: JSON.stringify("Failed to put to Dynamo DB" + error.s),
        };
      }
      break;

    case "GET":
      const getparams = {
        TableName: TRAININGS_TABLE,
        Key: { trainingId: event.queryStringParameters.trainingId },
      };

      try {
        const data = await dynamoDb.get(getparams).promise();
        if (!data || typeof data === "undefined" || !data.Item) {
          console.log(
            `getMessage did not find trainingId=${event.queryStringParameters.trainingId}`
          );
          return {
            statusCode: 404,
            error: `Could not find message for trainingId: ${event.queryStringParameters.trainingId}`,
          };
        } else {
          console.log(`getMessage data=${JSON.stringify(data.Item)}`);
          return { statusCode: 200, body: JSON.stringify(data.Item) };
        }
      } catch (error) {
        console.log(`getTraining ERROR=${error.stack}`);
        return {
          statusCode: 400,
          error: `Could not retrieve Training: ${error.stack}`,
        };
      }

      break;

    case "PUT":
      // Validate that the body has parameters to update
      let putparsedJsonobj;
      try {
        putparsedJsonobj = JSON.parse(event.body);
      } catch (err) {
        console.error(
          `Could not parse requested JSON ${event.body}: ${err.stack}`
        );
        return {
          statusCode: 400,
          error: `Could not find parameters to update : ${err.stack}`,
        };
      }

      //  Get the parameter name and parameter value to be updated

      const paramName = putparsedJsonobj.paramName;
      const paramValue = putparsedJsonobj.paramValue;
      const puttrainingId = event.pathParameters.trainingId;

      console.log("update key value is " + puttrainingId);
      console.log("type of key is " + typeof puttrainingId);

      const putparams = {
        TableName: TRAININGS_TABLE,
        Key: { trainingId: puttrainingId },
        ConditionExpression: "attribute_exists(trainingId)",
        UpdateExpression: "set " + paramName + " = :v",
        ExpressionAttributeValues: {
          ":v": paramValue,
        },
        ReturnValues: "ALL_NEW",
      };

      try {
        const putdata = await dynamoDb.update(putparams).promise();
        return { statusCode: 200, body: JSON.stringify(putdata) };
      } catch (err) {
        console.log(`update Training ERROR=${err.stack}`);
        return {
          statusCode: 400,
          error: `Could not update Training: ${err.stack}`,
        };
      }
      break;

    case "DELETE":
      // We have valid input, Now prepare the params for Database delete operation
      const delparams = {
        TableName: TRAININGS_TABLE,
        Key: { trainingId: event.pathParameters.trainingId },
      };

      // Delete from DB
      try {
        const ddata = await dynamoDb.delete(delparams).promise();
        return { statusCode: 200, body: JSON.stringify("Training  Deleted") };
      } catch (error) {
        console.log(`delete Training ERROR=${error.stack}`);
        return {
          statusCode: 400,
          error: `Could not delete Training: ${error.stack}`,
        };
      }
      break;

    default:
      console.log("Unknown HTTP method");
  }
};
