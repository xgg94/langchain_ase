import { NextApiRequest, NextApiResponse } from "next";
import OpenAI from "openai";
import { ThreadMessagesPage } from "openai/resources/beta/threads/messages/messages";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { threadId } = req.body;
  console.log("thread id", threadId);
  const messages: ThreadMessagesPage = await openai.beta.threads.messages.list(
    threadId
  );
  console.log(messages);

  res.status(200).json(messages);
}
