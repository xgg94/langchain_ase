import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  const { stepIds, threadId, runId } = req.body;

  const stepPromises = stepIds.map(async (stepId) => {
    return openai.beta.threads.runs.steps.retrieve(threadId, runId, stepId);
  });

  const runSteps = await Promise.all(stepPromises);
  console.log("runSteps", runSteps);

  res.status(200).json(runSteps);
}
