import { GetCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { ddb, TABLE } from "../db";

function parseBody(evt: any) {
  if (!evt?.body) return {};
  try { return JSON.parse(evt.body); }
  catch {
    try {
      const decoded = Buffer.from(evt.body, "base64").toString("utf-8");
      return JSON.parse(decoded);
    } catch { return {}; }
  }
}

// PATCH /messages/{id}  body: { "text": "ny text" }
export const handler = async (evt: any) => {
  try {
    const id = evt.pathParameters?.id;
    const { text } = parseBody(evt);

    if (!id || !text) {
      return res(400, { message: "id and text required" });
    }

    // 404-koll
    const found = await ddb.send(new GetCommand({ TableName: TABLE, Key: { id } }));
    if (!found.Item) return res(404, { message: "Message not found" });

    await ddb.send(
      new UpdateCommand({
        TableName: TABLE,
        Key: { id },
        UpdateExpression: "SET #t = :t",
        ExpressionAttributeNames: { "#t": "text" },
        ExpressionAttributeValues: { ":t": text },
      })
    );

    return res(200, { id, text });
  } catch (err) {
    console.error("updateMessage error:", err);
    return res(500, { message: "Server error" });
  }
};

const res = (statusCode: number, body: any) => ({
  statusCode,
  headers: {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "PATCH,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  },
  body: JSON.stringify(body),
});
