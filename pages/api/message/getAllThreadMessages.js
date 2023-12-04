import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  const { threadId } = req.body;
  console.log("thread id", threadId);
  const messages = await openai.beta.threads.messages.list(threadId);

  console.log(messages);

  res.status(200).json(messages);
}
