// src/handlers/createMessage.ts
import { PutCommand } from "@aws-sdk/lib-dynamodb";
import { randomUUID } from "node:crypto";
import { ddb, TABLE } from "../db";

function parseBody(evt: any) {
  if (!evt?.body) return {};

  try {
    // Om body redan är JSON (API Gateway HTTP API v2)
    return JSON.parse(evt.body);
  } catch (e) {
    try {
      // Om body är Base64
      const decoded = Buffer.from(evt.body, "base64").toString("utf-8");
      return JSON.parse(decoded);
    } catch (e2) {
      console.error("parseBody error:", e2);
      return {};
    }
  }
}


export const handler = async (evt: any) => {
  console.log("createMessage invoked", {
    isBase64Encoded: evt?.isBase64Encoded,
    contentType: evt?.headers?.["content-type"] || evt?.headers?.["Content-Type"],
  });

  try {
    const { username, text } = parseBody(evt);

    if (!username || !text) {
      console.warn("Validation failed", { username, text });
      return res(400, { message: "username and text required" });
    }

    const item = {
      id: randomUUID(),
      username,
      text,
      createdAt: new Date().toISOString(),
      gsiAllPK: "ALL",
    };

    await ddb.send(new PutCommand({ TableName: TABLE, Item: item }));
    console.log("Put OK", { id: item.id });
    return res(200, item);
  } catch (err: any) {
    console.error("createMessage error:", err);
    return res(500, { message: "Server error", error: err?.message ?? String(err) });
  }
};

const res = (statusCode: number, body: any) => ({
  statusCode,
  headers: {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  },
  body: JSON.stringify(body),
});
