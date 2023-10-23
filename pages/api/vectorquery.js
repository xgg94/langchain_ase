import { ChatOpenAI } from "langchain/chat_models/openai";
import { CallbackManager } from "langchain/callbacks";
import {
  OpenAIStream,
  StreamingTextResponse,
  Message,
  LangChainStream,
} from "ai";
import { AIChatMessage, HumanChatMessage } from "langchain/schema";
import { TextLoader } from "langchain/document_loaders/fs/text";
import { DocxLoader } from "langchain/document_loaders/fs/docx";
import { HNSWLib } from "langchain/vectorstores";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { OpenAIEmbeddings } from "langchain/embeddings";
import {
  PromptTemplate,
  ChatPromptTemplate,
  SystemMessagePromptTemplate,
  HumanMessagePromptTemplate,
} from "langchain/prompts";
import {
  VectorDBQAChain,
  RetrievalQAChain,
  loadQARefineChain,
  loadSummarizationChain,
  LLMChain,
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
    const { input, contextEmbeddingName, generative } = req.body;
    console.log(input);
    console.log(contextEmbeddingName);

    //init pinecone
    // const pineconeIndexName = "buch1";
    // const vectorDimension = 1536;
    // const pinecone = new Pinecone();
    // const pineconeIndex = pinecone.Index("buch1");

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

    if (generative) {
      //generative prompts with context of a specific file (chapter)
      console.log("generative prompt");
      const dir = path.resolve(`./public/${FILENAME}.${DOCTYPE}`);
      const context = fs.readFileSync(dir, "utf8");
      const template =
        "Du hast folgendes Kapitel eines Buchs zur Verfügung und hilfst dem Autor bei seinen Aufgaben. Kapitel: {chapterText}.";
      const systemMessagePrompt =
        SystemMessagePromptTemplate.fromTemplate(template);
      const humanTemplate = "{humanText}";
      const humanMessagePrompt =
        HumanMessagePromptTemplate.fromTemplate(humanTemplate);

      const chatPrompt = ChatPromptTemplate.fromPromptMessages([
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
      res.status(200).json({ genResponse });
    } else {
      //chain with embeddings
      console.log("embeddings prompt");
      //create a chain
      const chain = VectorDBQAChain.fromLLM(llm, vectorStore);

      //manually add a message
      const chainResponse = await chain.call({
        query: input,
      });

      console.log({ chainResponse });
      res.status(200).json({ chainResponse });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).send();
  }
}

//vector store via pinecone
//   const vectorStore = await PineconeStore.PineconeStore.fromExistingIndex(
//     embeddings,
//     { pineconeIndex }
//   );
