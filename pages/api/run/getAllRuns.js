import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  const { threadId } = req.body;

  const runs = await openai.beta.threads.runs.list(threadId);

  console.log("run list", runs);
  res.status(200).json(runs);
}
