import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  const threadId = req.query.threadId;

  const myThread = await openai.beta.threads.retrieve(threadId);

  console.log(myThread);
  res.status(200).json(myThread);
}
