import { ChatOpenAI } from "langchain/chat_models/openai";
import { CallbackManager } from "langchain/callbacks";
import {
  OpenAIStream,
  StreamingTextResponse,
  Message,
  LangChainStream,
} from "ai";
import { TextLoader } from "langchain/document_loaders/fs/text";
import { DocxLoader } from "langchain/document_loaders/fs/docx";
import { HNSWLib } from "langchain/vectorstores/hnswlib";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import {
  PromptTemplate,
  ChatPromptTemplate,
  SystemMessagePromptTemplate,
  HumanMessagePromptTemplate,
} from "langchain/prompts";
import {
  VectorDBQAChain,
  loadQAStuffChain,
  loadQARefineChain,
  LLMChain,
  RetrievalQAChain,
} from "langchain/chains";
import { PineconeStore } from "langchain/vectorstores/pinecone";
import * as fs from "fs";
import path from "path";
import { Pinecone } from "@pinecone-database/pinecone";
import { OpenAI } from "langchain/llms/openai";

const FILENAME = "data";
const DOCTYPE = "txt";

export default async function handler(req, res) {
  try {
    const { input, contextEmbeddingName, generative, embedding } = req.body;
    console.log(input);
    console.log(contextEmbeddingName);

    if (embedding) {
      const embeddingResponse = await embeddingsRequest(
        input,
        contextEmbeddingName
      );
      res.status(200).json({ embeddingResponse });
    }
    if (generative) {
      const generationResponse = await generativeRequest(input);
      res.status(200).json({ generationResponse });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).send();
  }
}

//generative prompts with context of a specific file (chapter)
const generativeRequest = async (input) => {
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

//embedding prompt with unlimited context possibility but here with a specific file (chapter)
const embeddingsRequest = async (input, contextEmbeddingName) => {
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
