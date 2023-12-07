import { ChatOpenAI } from "langchain/chat_models/openai";
import { CallbackManager } from "langchain/callbacks";
import { LangChainStream } from "ai";
import { HNSWLib } from "langchain/vectorstores/hnswlib";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { loadQARefineChain, RetrievalQAChain } from "langchain/chains";
import { OpenAI } from "langchain/llms/openai";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const { input, contextEmbeddingName } = req.body;
    console.log(input);
    console.log(contextEmbeddingName);

    const embeddingResponse = await embeddingsRequest(
      input,
      contextEmbeddingName
    );
    res.status(200).json({ embeddingResponse });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .send({ message: "Error while creating embedding message" });
  }
}

//embedding prompt with unlimited context possibility but here with a specific file (chapter)
const embeddingsRequest = async (
  input: string,
  contextEmbeddingName: string
) => {
  console.log("embeddings prompt");
  //init llm
  const { stream, handlers } = LangChainStream();

  const llm = new ChatOpenAI({
    streaming: true,
    callbacks: CallbackManager.fromHandlers(handlers),
  });
  const model = new OpenAI({
    openAIApiKey: process.env.OPENAI_API_KEY,
    temperature: 0,
  });

  const embeddings = new OpenAIEmbeddings();

  //vector store via local memory HNSWLib
  const vectorStore = await HNSWLib.load(
    `vectorStore/${contextEmbeddingName}`,
    embeddings
  );
  //create a chain
  const chain = new RetrievalQAChain({
    combineDocumentsChain: loadQARefineChain(model),
    retriever: vectorStore.asRetriever(),
  });

  //manually add a message
  const chainResponse = await chain.call({
    query: input,
  });

  console.log({ chainResponse });
  return chainResponse;
};
