// Next.js API route support: https://nextjs.org/docs/api-routes/introduction

import { AIChatMessage, HumanChatMessage } from "langchain/schema";
import { TextLoader } from "langchain/document_loaders/fs/text";
import { DocxLoader } from "langchain/document_loaders/fs/docx";
import { HNSWLib } from "langchain/vectorstores/hnswlib";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { VectorDBQAChain } from "langchain/chains";
import { PineconeStore } from "langchain/vectorstores/pinecone";
import * as fs from "fs";
import path from "path";
import { Pinecone } from "@pinecone-database/pinecone";
import { Document } from "langchain/document";

const FILENAME = "data";
const DOCTYPE = "txt";
const VECTORSTORE_NAME = "der_kleine_prinz";

export default async function handler(req, res) {
  try {
    console.log("starting with indexing");
    DOCTYPE === "docx" ? await initWordDocs() : await initTextDocs();

    return res.status(200).json("ok");
  } catch (error) {
    console.log("something went wrong while initializing");
    console.log(error);
    return res.status(500).send(error);
  }
}

/* init from docx file*/
const initWordDocs = async () => {
  const loader = new DocxLoader(path.resolve(`./public/${FILENAME}.docx`));

  const wordDocs = await loader.load();

  const wordSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
  });
  const docx = await wordSplitter.splitDocuments(wordDocs);

  console.log(docx);

  //init llm
  const embeddings = new OpenAIEmbeddings();

  //vector store via local memorey HNSWLib
  const vectorStore = await HNSWLib.fromDocuments(docx, embeddings);

  vectorStore.save(`vectorStore/${VECTORSTORE_NAME}`);

  console.log("finished indexing");
};

/* init from plain text file*/
const initTextDocs = async () => {
  const dir = path.resolve(`./public/${FILENAME}.txt`);
  const text = fs.readFileSync(dir, "utf8");
  const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
  });
  const docs = await textSplitter.createDocuments([text]);

  //init llm
  const embeddings = new OpenAIEmbeddings();

  //vector store via local memorey HNSWLib
  const vectorStore = await HNSWLib.fromDocuments(docs, embeddings);

  //save embeddings
  vectorStore.save(`vectorStore/${VECTORSTORE_NAME}`);
};

//init pinecone
// const pineconeIndexName = "pineconeIndex";
// const vectorDimension = 1536;
// const pinecone = new Pinecone();
// const pineconeIndex = pinecone.Index("pineconeIndex");

//vector store via pinecone
// const vectorStore = await PineconeStore.fromDocuments(docs, embeddings, {
//   pineconeIndex,
//   maxConcurrency: 5,
// });
