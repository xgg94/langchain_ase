import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  const { threadId, runId } = req.body;

  const run = await openai.beta.threads.runs.cancel(threadId, runId);

  console.log("cancel run", run);
  res.status(200).json(run);
}
