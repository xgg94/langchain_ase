import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  const { message, assistantId, threadId } = req.body;

  console.log(threadId);
  if (!threadId.includes("thread")) {
    const run = await openai.beta.threads.createAndRun({
      assistant_id: assistantId,
      thread: {
        messages: [{ role: "user", content: message }],
      },
    });

    return res.status(200).json(run);
  } else {
    const threadMessages = await openai.beta.threads.messages.create(threadId, {
      role: "user",
      content: message,
    });

    const run = await openai.beta.threads.runs.create(threadId, {
      assistant_id: assistantId,
    });

    return res.status(200).json(run);
  }

  // const run = await openai.beta.threads.createAndRun({
  //     assistant_id: assistantId,
  //     thread: {
  //       messages: [
  //         { role: "user", content: message },
  //       ],
  //     },
  //   });
}
