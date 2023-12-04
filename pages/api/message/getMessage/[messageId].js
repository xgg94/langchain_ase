import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  const messageId = req.query.messageId;
  const { threadId } = req.body;
  console.log("message id", messageId);
  const message = await openai.beta.threads.messages.retrieve(
    threadId,
    messageId
  );

  console.log(message);

  res.status(200).json(message);
}
