import {
  MessageContentText,
  ThreadMessage,
} from "openai/resources/beta/threads/messages/messages";
import React, { useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";

//embedding message interface (similar to thread message from openai)
export interface EmbeddingMessage {
  /**
   * The role of the message. Either 'user' or 'assistant'.
   */
  role: "user" | "assistant";
  /**
   * The unique identifier of the message. (starting with msg_embedd_)
   */
  id: string;
  /**
   * The content of the message.
   */
  content: Array<MessageContentText>;
  /**
   * The timestamp of when the message was created.
   */
  created_at: number;
  /**
   * Set of 16 key-value pairs that can be attached to an object. This can be useful
   * for storing additional information about the object in a structured format. Keys
   * can be a maximum of 64 characters long and values can be a maxium of 512
   * characters long.
   */
  metadata: unknown | null;
  /**
   * The object type which is always 'embedding.message'.
   */
  object: "embedding.message";
}

const useEmbeddings = () => {
  const [messages, setMessages] = useState<
    Array<EmbeddingMessage | ThreadMessage>
  >([]);
  const [allEmbeddings, setAllEmbeddings] = useState<any>([]);
  const [activeEmbedding, setActiveEmbedding] = useState<any>(null);
  const [embeddingIsLoading, setEmbeddingIsLoading] = useState(false);

  useEffect(() => {
    getEmbeddings();
  }, []);

  // init embeddings
  const initEmbedding = async () => {
    const response = await fetch("/api/embedding/init", {
      headers: {
        "Content-Type": "application/json",
      },
    });
    const res = await response.json();
    getEmbeddings();
  };

  // get all embeddings
  const getEmbeddings = async () => {
    const response = await fetch("/api/embedding/getEmbeddings", {
      headers: {
        "Content-Type": "application/json",
      },
    });
    const res = await response.json();
    console.log(`all embeddings:`, res);
    setAllEmbeddings([...res]);
    setActiveEmbedding(res[0]);
    console.log(`active embedding: ${res[0]}`);
  };

  const getEmbeddingsResponse = async (
    prompt: string,
    messageHistory?: Array<EmbeddingMessage | ThreadMessage>
  ) => {
    setEmbeddingIsLoading(true);
    const question = prompt;

    const response = await fetch("/api/embedding/sendMessage", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        input: question,
        contextEmbeddingName: activeEmbedding,
      }),
    });
    const { embeddingResponse, generationResponse } = await response.json();

    //if output text starts with with /n/n, remove it
    if (embeddingResponse?.output_text?.startsWith("\n\n")) {
      embeddingResponse.output_text =
        embeddingResponse.output_text.substring(2);
    }

    //deactivate loading animation
    //setActiveRun(false);

    console.log("history", messageHistory);
    if (messageHistory) {
      setMessages(messageHistory);
    }

    const embeddedResponseMessage: EmbeddingMessage[] = [
      {
        role: "user",
        created_at: Math.floor(Date.now() / 1000),
        id: "msg_embedd_" + uuidv4(),
        content: [
          {
            text: {
              value: question,
              annotations: [],
            },
            type: "text",
          },
        ],
        metadata: null,
        object: "embedding.message",
      },
      {
        role: "assistant",
        created_at: Math.floor(Date.now() / 1000),
        metadata: null,
        object: "embedding.message",
        id: "msg_embedd_" + uuidv4(),
        content: embeddingResponse?.output_text
          ? [
              {
                text: { value: embeddingResponse.output_text, annotations: [] },
                type: "text",
              },
            ]
          : [
              {
                text: { value: generationResponse?.text, annotations: [] },
                type: "text",
              },
            ]
          ? [
              {
                text: { value: generationResponse?.text, annotations: [] },
                type: "text",
              },
            ]
          : [
              {
                text: { value: embeddingResponse?.text, annotations: [] },
                type: "text",
              },
            ],
      },
    ];

    //set messages
    setMessages([
      ...messages,
      // {
      //   role: "user",
      //   created_at: Math.floor(Date.now() / 1000),
      //   id: "msg_embedd_" + uuidv4(),
      //   content: [
      //     {
      //       text: {
      //         value: question,
      //         annotations: [],
      //       },
      //       type: "text",
      //     },
      //   ],
      //   metadata: null,
      //   object: "embedding.message",
      // },
      ...embeddedResponseMessage,
    ]);

    console.log("returning embedded response message", embeddedResponseMessage);
    //deactivate loading animation
    setEmbeddingIsLoading(false);
    return embeddedResponseMessage;
  };

  // prepaire embeddings for select
  const selectEmbeddingByName = (embeddingName: string) => {
    console.log(`selecting embedding: ${embeddingName}`);
    setActiveEmbedding(embeddingName);
  };

  return {
    initEmbedding,
    allEmbeddings,
    activeEmbedding,
    embeddingIsLoading,
    selectEmbeddingByName,
    getEmbeddingsResponse,
  };
};

export default useEmbeddings;
