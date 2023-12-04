import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // defaults to process.env["OPENAI_API_KEY"]
});

export default async function handler(req, res) {
  const thread = await openai.beta.threads.create({
    messages: [
      {
        role: "user",
        content:
          "Erstelle mir einen kurzen Text über einen Charakter namens Peter",
      },
    ],
  });

  console.log("Thread created: ", thread);

  res.status(200).json({ thread: thread });
}
