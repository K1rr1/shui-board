import { QueryCommand } from "@aws-sdk/lib-dynamodb";
import { ddb, TABLE } from "../db";

// GET /messages?username=max&sort=asc|desc
export const handler = async (evt: any) => {
  try {
    const username = evt.queryStringParameters?.username;
    const sort = (evt.queryStringParameters?.sort ?? "desc").toLowerCase();
    const forward = sort === "asc";

    const params = username
      ? {
          IndexName: "GSI_ByUser",
          KeyConditionExpression: "username = :u",
          ExpressionAttributeValues: { ":u": username },
        }
      : {
          IndexName: "GSI_All",
          KeyConditionExpression: "gsiAllPK = :a",
          ExpressionAttributeValues: { ":a": "ALL" },
        };

    const out = await ddb.send(
      new QueryCommand({ TableName: TABLE, ...params, ScanIndexForward: forward })
    );

    return res(200, out.Items ?? []);
  } catch (err) {
    console.error("getMessages error:", err);
    return res(500, { message: "Server error" });
  }
};

const res = (statusCode: number, body: any) => ({
  statusCode,
  headers: {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  },
  body: JSON.stringify(body),
});
