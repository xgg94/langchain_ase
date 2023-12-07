import { ChatOpenAI } from "langchain/chat_models/openai";
import {
  ChatPromptTemplate,
  SystemMessagePromptTemplate,
  HumanMessagePromptTemplate,
} from "langchain/prompts";
import { LLMChain } from "langchain/chains";
import * as fs from "fs";
import path from "path";
import { NextApiRequest, NextApiResponse } from "next";

const FILENAME = "data";
const DOCTYPE = "txt";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const { input, contextEmbeddingName } = req.body;
    console.log(input);
    console.log(contextEmbeddingName);

    const generationResponse = await generativeRequest(input);
    res.status(200).json({ generationResponse });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .send({ message: "Error while creating generation message" });
  }
}

//generative prompts with context of a specific file (chapter)
const generativeRequest = async (input: string) => {
  console.log("generative prompt");
  const dir = path.resolve(`./public/${FILENAME}.${DOCTYPE}`);
  const context = fs.readFileSync(dir, "utf8");
  const template =
    "Du hast folgendes Kapitel eines Buchs zur Verfügung und hilfst beantwortest dem Autor seine Fragen. Wenn du etwas nicht beantworten kannst sagst du dass du leider keine Informationen darüber findest. Du antwortest immer auf Deutsch  Kapiteltext: {chapterText}.";
  const systemMessagePrompt =
    SystemMessagePromptTemplate.fromTemplate(template);
  const humanTemplate = "{humanText}";
  const humanMessagePrompt =
    HumanMessagePromptTemplate.fromTemplate(humanTemplate);

  const chatPrompt = ChatPromptTemplate.fromMessages([
    systemMessagePrompt,
    humanMessagePrompt,
  ]);
  //init 16k model
  const model16k = new ChatOpenAI({
    openAIApiKey: process.env.OPENAI_API_KEY,
    temperature: 0.9,
    modelName: "gpt-3.5-turbo-16k",
  });

  const chain = new LLMChain({
    llm: model16k,
    prompt: chatPrompt,
  });

  const genResponse = await chain.call({
    chapterText: context,
    humanText: input,
  });
  console.log({ genResponse });

  return genResponse;
};
