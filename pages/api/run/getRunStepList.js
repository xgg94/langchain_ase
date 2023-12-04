import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  const { runId, threadId } = req.body;

  var runStep = await openai.beta.threads.runs.steps.list(threadId, runId);
  console.log(runStep);
  while (runStep.data.length == 0) {
    console.log("try again getting run step list");
    await new Promise((done) => setTimeout(() => done(), 1000));
    runStep = await openai.beta.threads.runs.steps.list(threadId, runId);
  }

  console.log("run step", runStep);
  res.status(200).json(runStep);
}
