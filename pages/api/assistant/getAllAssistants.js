import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  const myAssistants = await openai.beta.assistants.list({
    order: "desc",
    limit: "20",
  });

  res.status(200).json(myAssistants);
}
