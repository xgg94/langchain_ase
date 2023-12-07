"use client";

import React, { useEffect, useState, useRef } from "react";
import { v4 as uuidv4 } from "uuid";
import { updateMessages } from "../utils/chat/updateMessages";
import typingAnimation from "../public/animations/typingAnimation.json";
import dynamic from "next/dynamic";
import Select from "react-select";
import Conversation from "../components/chatWindow/Conversation";
import useAssistant from "../hooks/openai/useAssistant";
import useEmbeddings from "../hooks/openai/useEmbeddings";
const CharacterModal = dynamic(
  () => import("../components/modals/CharacterModal"),
  {
    ssr: false,
  }
);
const LocationModal = dynamic(
  () => import("../components/modals/LocationModal"),
  {
    ssr: false,
  }
);
const ObjectModal = dynamic(() => import("../components/modals/ObjectModal"), {
  ssr: false,
});
const SceneContextModal = dynamic(
  () => import("../components/modals/SceneContextModal"),
  {
    ssr: false,
  }
);

export default function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  const [assistant, setAssistant] = useState(null);

  const [showCharacterModal, setShowCharacterModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showObjectModal, setShowObjectModal] = useState(false);
  const [showSceneContextModal, setShowSceneContextModal] = useState(false);

  const [checkUseEmbeddings, setCheckUseEmbeddings] = useState(false);
  const [checkUseAssistant, setCheckUseAssistant] = useState(true);

  //assistant hook init
  const {
    allAssistants,
    activeAssistant,
    setAssistantById,
    getAssistantResponse,
    assistantIsLoading,
    thread,
    run,
  } = useAssistant();

  //embeddings hook init
  const {
    initEmbedding,
    allEmbeddings,
    activeEmbedding,
    selectEmbeddingByName,
    getEmbeddingsResponse,
    embeddingIsLoading,
  } = useEmbeddings();

  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // init assistant (not used because only one assistant for each app)
  // const initAssistant = async () => {
  //   const response = await fetch("/api/assistant/initAssistant", {
  //     headers: {
  //       "Content-Type": "application/json",
  //     },
  //   });
  //   const data = await response.json();
  //   console.log(`init assistant:`, data);
  // };

  // submit question
  const handleSubmit = async (e, prompt) => {
    e.preventDefault();

    if (input !== "") {
      prompt = input;
      setInput("");
    }

    if (!checkUseAssistant && !checkUseEmbeddings) {
      alert("Bitte wähle eine Option aus.");
      //setActiveRun(false);
      return;
    }

    if (!checkUseAssistant) {
      embeddingRequest();
    } else {
      assistantRequest(prompt);
    }
  };

  // assistant request
  const assistantRequest = async (prompt) => {
    console.log("assistant request", messages);
    const question = prompt;
    setMessages([
      ...messages,
      {
        role: "user",
        content: [{ text: { value: question } }],
      },
    ]);

    const chatHistory = await getAssistantResponse(question, messages);

    console.log("chat", chatHistory);
    setMessages(chatHistory);
    return chatHistory;
  };

  // embedding request
  const embeddingRequest = async () => {
    const question = input;
    setInput("");

    console.log(`input: ${input}`);
    setMessages([
      ...messages,
      {
        role: "user",
        id: "msg_embedd_" + uuidv4(),
        content: [{ text: { value: question } }],
      },
    ]);
    console.log("messages", messages);
    const embeddedQAResponse = await getEmbeddingsResponse(question, messages);
    console.log("embedded response", embeddedQAResponse);
    console.log("messages", messages);
    setMessages([...messages, ...embeddedQAResponse]);
  };

  // prepaire embeddings for select component
  const handleGetEmbeddings = () => {
    var embeddingList = allEmbeddings?.map((emb) => {
      return {
        value: emb,
        label: emb,
      };
    });
    embeddingList.unshift({
      value: "Kein Embedding ausgewählt",
      label: "Kein Embedding ausgewählt",
    });
    return embeddingList;
  };

  // prepaire asisstants for select component
  const handleGetAssistants = () => {
    var assistantList = allAssistants?.map((ass) => {
      return {
        value: ass?.id,
        label: ass?.name,
      };
    });
    assistantList?.unshift({
      value: "Kein Assistent ausgewählt",
      label: "Kein Assistent ausgewählt",
    });
    return assistantList;
  };

  return (
    <main className="bg-black flex h-screen flex-col items-center justify-between p-24 text-2xl font-bold ">
      <div className=" text-white pb-10">Author Assistant</div>

      <div className="flex flex-wrap gap-12 pb-4">
        {/* Embedding settings */}
        <div className="flex flex-col gap-2">
          {/* Embedding initialization */}
          <button
            className=" bg-green-600 rounded-lg uppercase text-white px-2 py-2 text-sm hover:bg-green-700"
            onClick={initEmbedding}
          >
            init embedding
          </button>

          {/* Embedding context selection */}

          <Select
            className=" m-2 py-1 text-sm rounded-lg w-64 md:w-64 cursor-pointer "
            name="embedding_select"
            placeholder="Embedding auswählen"
            options={handleGetEmbeddings()}
            onChange={(e) => {
              console.log(e.value);
              //setActiveEmbedding(e.value);
              selectEmbeddingByName(e.value);
            }}
            value={{
              value: activeEmbedding,
              label: activeEmbedding,
            }}
            styles={{
              option: (styles, state) => ({
                ...styles,
                cursor: "pointer",
              }),
              control: (styles) => ({
                ...styles,
                cursor: "pointer",
              }),
            }}
          />
        </div>

        {/* Assistant settings */}
        <div className="flex flex-col gap-2">
          {/* list all assistants */}
          <div className="text-white text-sm uppercase flex justify-center">
            Assistant
          </div>
          <Select
            className=" m-2 py-1 text-sm rounded-lg w-64 md:w-64 cursor-pointer "
            name="assistant_select"
            placeholder="Assistenten auswählen"
            options={handleGetAssistants()}
            onChange={(e) => {
              setAssistantById(e.value);
            }}
            value={{
              value: activeAssistant?.id,
              label: activeAssistant?.name,
            }}
            styles={{
              option: (styles, state) => ({
                ...styles,
                cursor: "pointer",
              }),
              control: (styles) => ({
                ...styles,
                cursor: "pointer",
              }),
            }}
          />

          <div className="flex flex-col gap-2">
            {activeAssistant && (
              <div className="flex flex-col gap-2">
                <div className="text-white text-xs">
                  NAME: {activeAssistant?.name}
                </div>
                <div className="text-white text-xs">
                  ID: {activeAssistant?.id}
                </div>
                <div className="text-white text-xs">
                  MODEL: {activeAssistant?.model}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Infos */}
        <div className="flex flex-col gap-2 min-w-[200px]">
          {/* Thread infos */}
          <div className="flex flex-col gap-2">
            <div className="text-white text-sm uppercase flex justify-center">
              Thread
            </div>
            {thread && (
              <div className="flex flex-col gap-2">
                <div className="text-white text-xs">ID: {thread?.id}</div>
              </div>
            )}
          </div>

          {/* Run infos */}
          <div className="flex flex-col gap-2">
            <div className="text-white text-sm uppercase flex justify-center">
              Run
            </div>
            {run && (
              <div className="flex flex-col gap-2">
                <div className="text-white text-xs">ID: {run?.id}</div>
              </div>
            )}
          </div>
        </div>

        {/* Response settings */}
        <div className="flex flex-col gap-2">
          <div className="text-white text-sm text-center">Art wählen</div>
          {/* activate embeddings (default) */}
          <div className=" flex gap-1  items-center">
            <input
              className=" rounded-lg h-4 w-4"
              type="checkbox"
              checked={checkUseEmbeddings}
              onChange={(e) => {
                setCheckUseEmbeddings(e.target.checked);
              }}
            />
            <label className=" text-white text-sm">Embeddings API</label>
          </div>

          {/* Checkbox for switching to assistant api */}
          <div className=" flex gap-1  items-center">
            <input
              className=" rounded-lg h-4 w-4"
              type="checkbox"
              checked={checkUseAssistant}
              onChange={(e) => {
                setCheckUseAssistant(e.target.checked);
              }}
            />
            <label className=" text-white text-sm">Assistant API</label>
          </div>
        </div>
      </div>
      {/* editor menu for character and locations */}
      <div className="flex my-2 w-full gap-4 justify-center">
        <button
          className=" bg-yellow-500 rounded-lg uppercase text-white px-2 py-1 text-sm hover:bg-yellow-600"
          onClick={() => setShowCharacterModal(true)}
        >
          Charaktere bearbeiten
        </button>
        <button
          className=" bg-yellow-500 rounded-lg uppercase text-white px-2 py-1 text-sm hover:bg-yellow-600"
          onClick={() => setShowLocationModal(true)}
        >
          Orte bearbeiten
        </button>
        <button
          className=" bg-yellow-500 rounded-lg uppercase text-white px-2 py-1 text-sm hover:bg-yellow-600"
          onClick={() => setShowObjectModal(true)}
        >
          Objekte bearbeiten
        </button>
        <button
          className=" bg-orange-500 rounded-lg uppercase text-white px-2 py-1 text-sm hover:bg-orange-600"
          onClick={() => setShowSceneContextModal(true)}
        >
          Szenen Kontext
        </button>
      </div>

      {showCharacterModal && (
        <CharacterModal setShowModal={setShowCharacterModal} />
      )}
      {showLocationModal && (
        <LocationModal setShowModal={setShowLocationModal} />
      )}
      {showObjectModal && <ObjectModal setShowModal={setShowObjectModal} />}
      {showSceneContextModal && (
        <SceneContextModal setShowModal={setShowSceneContextModal} />
      )}

      {/* Chat history*/}
      <div className="border-t border-white border-opacity-40 w-screen" />
      <Conversation
        messages={messages}
        setInput={setInput}
        isLoading={assistantIsLoading || embeddingIsLoading}
        handleSubmit={handleSubmit}
        messagesEndRef={messagesEndRef}
      />

      {/* Text input */}
      <div className="mt-4 border-t border-white border-opacity-40 w-screen"></div>
      <form
        onSubmit={handleSubmit}
        className=" flex w-full justify-center fixed bottom-20 "
      >
        <div className="  fixed b-0 flex w-full justify-center gap-4">
          <input
            className="text-sm font-semibold border-2 border-yellow-600 p-2 w-full max-w-md rounded text-black"
            type="text"
            placeholder="Stelle deine Frage..."
            onChange={(e) => setInput(e.target.value)}
            value={input}
          />
        </div>
      </form>
    </main>
  );
}
