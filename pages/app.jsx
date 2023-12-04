"use client";

import React, { useEffect, useState, useRef } from "react";
import { updateMessages } from "../utils/chat/updateMessages";
import typingAnimation from "../public/animations/typingAnimation.json";
import dynamic from "next/dynamic";
import Select from "react-select";
import Conversation from "../components/chatWindow/Conversation";
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
const Lottie = dynamic(() => import("lottie-react"), {
  ssr: false,
});

export default function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [embeddingNames, setEmbeddingNames] = useState([]);
  const [activeEmbedding, setActiveEmbedding] = useState(null);
  const [allAssistants, setAllAssistants] = useState(null);
  const [assistant, setAssistant] = useState(null);
  const [activeRun, setActiveRun] = useState(false);
  const [showCharacterModal, setShowCharacterModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showObjectModal, setShowObjectModal] = useState(false);
  const [showSceneContextModal, setShowSceneContextModal] = useState(false);

  const [thread, setThread] = useState({
    id: "-",
  });

  const [run, setRun] = useState({
    id: "-",
  });

  const [checkUseSimpleQuery, setCheckUseSimpleQuery] = useState(false);
  const [checkUseEmbeddings, setCheckUseEmbeddings] = useState(false);
  const [checkUseAssistant, setCheckUseAssistant] = useState(true);

  useEffect(() => {
    getEmbeddings();
    getAssistants();
  }, []);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // get all embeddings
  const getEmbeddings = async () => {
    const response = await fetch("/api/getEmbeddings", {
      headers: {
        "Content-Type": "application/json",
      },
    });
    const res = await response.json();
    console.log(`all embeddings:`, res);
    setEmbeddingNames([...res]);
    setActiveEmbedding(res[0]);
    console.log(`active embedding: ${res[0]}`);
  };

  // get all assistants
  const getAssistants = async () => {
    const response = await fetch("/api/assistant/getAllAssistants", {
      headers: {
        "Content-Type": "application/json",
      },
    });
    const res = await response.json();
    console.log(`all assistants:`, res.data);
    setAllAssistants([...res.data]);
    setAssistant(res.data[0]);
  };

  // init assistant (not used because only one assistant for each app)
  const initAssistant = async () => {
    const response = await fetch("/api/assistant/initAssistant", {
      headers: {
        "Content-Type": "application/json",
      },
    });
    const data = await response.json();
    console.log(`init assistant:`, data);
  };

  // calls run until it is completed
  const startRun = async (thread, run) => {
    await new Promise((done) => setTimeout(() => done(), 1000));
    console.log("debug thread", thread);
    console.log("debug run", run);

    //get all runs of thread
    var initRunListResponse = await fetch("/api/run/getAllRuns", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        threadId: thread.id,
      }),
    });

    var initRunList = await initRunListResponse.json();

    console.log("init run list", initRunList);

    //get all run steps of run
    var initResponse = await fetch("/api/run/getRunStepList", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        runId: run.id,
        threadId: thread.id,
      }),
    });
    const initRes = await initResponse.json();
    const initRunSteps = initRes.data;

    var response = initResponse;
    var res = initRes;
    var runSteps = initRunSteps;

    console.log("init run steps", initRes);

    while (
      runSteps?.length &&
      (runSteps[0].status === "in_progress" || runSteps[0].status === "queued")
    ) {
      //check for tool call
      if (runSteps[0].step_details.type === "tool_calls") {
        console.log("tool call");

        //check if step_details/tool_calls is empty
        //test function
        if (!runSteps[0].step_details.tool_calls.length) {
          await new Promise((done) => setTimeout(() => done(), 1000));
          response = await fetch("/api/run/getRunStepList", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              runId: run.id,
              threadId: thread.id,
            }),
          });
          res = await response.json();

          console.log("new rundata", res.data);
          runSteps = res.data;
          continue;
        }

        const toolCalls = runSteps[0].step_details.tool_calls;

        var toolCallResponse = await fetch("/api/tool/toolCall", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            toolCalls,
            threadId: thread.id,
            runId: runSteps[0].run_id,
          }),
        });
        const toolCallRes = await toolCallResponse.json();
        console.log("tool call response", toolCallRes);
      }

      console.log("run status is in progress or queued");
      console.log("run", res);
      await new Promise((done) => setTimeout(() => done(), 1000));
      response = await fetch("/api/run/getRunStepList", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          runId: run.id,
          threadId: thread.id,
        }),
      });
      res = await response.json();

      // get message ids
      var runSteps = res.data;
    }

    console.log("run status is completed");
    console.log("steps", res);

    // check if more than one run step
    if (runSteps.length > 1) {
      runSteps.shift();
    }
    return;
  };

  // submit question
  const handleSubmit = async (e, prompt) => {
    e.preventDefault();
    setActiveRun(true);

    if (!checkUseAssistant && !checkUseEmbeddings && !checkUseSimpleQuery) {
      alert("Bitte wähle eine Option aus.");
      setActiveRun(false);
      return;
    }

    if (!checkUseAssistant) {
      regularRequest(e, prompt);
    } else {
      assistantRequest(prompt);
    }
  };

  // assistant request
  const assistantRequest = async (prompt) => {
    const question = input !== "" ? input : prompt;
    setInput("");
    setMessages([
      ...messages,
      {
        role: "user",
        content: question,
      },
    ]);

    // get run (if no thread exists, create one)
    const response = await fetch("/api/assistant/sendMessage", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: question,
        assistantId: assistant.id,
        threadId: thread.id,
      }),
    });

    const runResponse = await response.json();
    setRun(runResponse);

    console.log("current context run: ", runResponse);

    //get thread
    const threadResponse = await fetch(
      `/api/thread/getThread/${runResponse.thread_id}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    const threadRes = await threadResponse.json();
    console.log(`thread response:`, threadRes);
    setThread(threadRes);

    // calls run until it is completed
    if (threadRes) {
      //start init run
      await startRun(threadRes, runResponse);

      //get all runs of thread
      var irunListResponse = await fetch("/api/run/getAllRuns", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          threadId: threadRes.id,
        }),
      });
      var runList = await irunListResponse.json();
      console.log("run list ", runList);

      //repeat start run until run is completed
      while (runList.data[0].status !== "completed") {
        //check if run failed
        if (runList.data[0].status === "failed") {
          console.log("run failed");
          console.log("cancel run");
          const cancelRunResponse = await fetch("/api/run/cancelRun", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              threadId: threadRes.id,
              runId: runList.data[0].id,
            }),
          });
          const cancelRunData = await cancelRunResponse.json();
          console.log("cancel run data", cancelRunData);
          break;
        }
        await new Promise((done) => setTimeout(() => done(), 1000));
        irunListResponse = await fetch("/api/run/getAllRuns", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            threadId: threadRes.id,
          }),
        });

        runList = await irunListResponse.json();
        console.log("run list after running", runList);

        //check if action is required
        if (runList.data[0].status === "requires_action") {
          await startRun(threadRes, runResponse);
        }
      }

      await new Promise((done) => setTimeout(() => done(), 1000));

      //deactivate loading animation
      setActiveRun(false);

      //updating messages (optional set function, returns messages history)
      await updateMessages(threadRes, messages, setMessages);
    }
  };

  // regular request without assistant
  const regularRequest = async (e) => {
    const question = input;
    setInput("");

    console.log(`input: ${input}`);
    setMessages([
      ...messages,
      {
        role: "user",
        content: question,
      },
    ]);

    const response = await fetch("/api/vectorquery", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        input,
        contextEmbeddingName: activeEmbedding,
        generative: checkUseSimpleQuery,
        embedding: checkUseEmbeddings,
      }),
    });
    const { embeddingResponse, generationResponse } = await response.json();

    //if output text starts with with /n/n, remove it
    if (embeddingResponse?.output_text?.startsWith("\n\n")) {
      embeddingResponse.output_text =
        embeddingResponse.output_text.substring(2);
    }

    //deactivate loading animation
    setActiveRun(false);

    //set messages
    setMessages([
      ...messages,
      {
        role: "user",
        content: question,
      },
      {
        role: "ai",
        content: embeddingResponse?.output_text
          ? embeddingResponse.output_text
          : generationResponse?.text
          ? generationResponse.text
          : embeddingResponse.text,
      },
    ]);
  };

  const initEmbedding = async () => {
    const response = await fetch("/api/init", {
      headers: {
        "Content-Type": "application/json",
      },
    });
    const res = await response.json();
    getEmbeddings();
  };

  // prepaire embeddings for select
  const handleGetEmbeddings = () => {
    var allEmbeddings = embeddingNames.map((emb) => {
      return {
        value: emb,
        label: emb,
      };
    });
    allEmbeddings.unshift({
      value: "Kein Embedding ausgewählt",
      label: "Kein Embedding ausgewählt",
    });
    return allEmbeddings;
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
              setActiveEmbedding(e.value);
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
          <select
            className=" m-2 py-1 px-4 text-sm rounded-lg w-64"
            name="embedding"
            id=""
            onChange={(e) => {
              console.log(e.target.value);
              const assistant = allAssistants.find(
                (assistant) => assistant.id === e.target.value
              );

              setAssistant(assistant);
            }}
          >
            {allAssistants &&
              allAssistants.map((assistant, index) => (
                <option key={index} value={assistant.id}>
                  {assistant.name}
                </option>
              ))}
          </select>

          <div className="flex flex-col gap-2">
            <div className="text-white text-sm uppercase flex justify-center">
              Assistant
            </div>
            {assistant && (
              <div className="flex flex-col gap-2">
                <div className="text-white text-xs">
                  NAME: {assistant?.name}
                </div>
                <div className="text-white text-xs">ID: {assistant?.id}</div>
                <div className="text-white text-xs">
                  MODEL: {assistant?.model}
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
            <label className=" text-white text-sm">Embeddings verwenden</label>
          </div>
          {/* Checkbox for switching between embeddings and passing context to prompt */}
          <div className=" flex gap-1  items-center">
            <input
              className=" rounded-lg h-4 w-4"
              type="checkbox"
              checked={checkUseSimpleQuery}
              onChange={(e) => {
                setCheckUseSimpleQuery(e.target.checked);
              }}
            />
            <label className=" text-white text-sm">Einfacher query</label>
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
        activeRun={activeRun}
        handleSubmit={handleSubmit}
        messagesEndRef={messagesEndRef}
      />
      {/* <div className="py-2 text-white text-sm font-normal flex flex-wrap gap-8 ">
        <div
          className="px-4 py-1 border border-white rounded-full hover:cursor-pointer hover:scale-105"
          onClick={(e) => {
            const prompt = "Ich möchte eine neue Szene erstellen.";
            setInput(prompt);
            handleSubmit(e, prompt);
          }}
        >
          Szene erstellen
        </div>
        <div
          className="px-4 py-1 border border-white rounded-full hover:cursor-pointer hover:scale-105"
          onClick={(e) => {
            const prompt =
              "Stelle dich vor. Was kannst du, was machst du und was ist deine Aufgabe?";
            setInput(prompt);
            handleSubmit(e, prompt);
          }}
        >
          Stell dich vor
        </div>
        <div
          className="px-4 py-1 border border-white rounded-full hover:cursor-pointer hover:scale-105"
          onClick={(e) => {
            const prompt =
              "Welche Charaktere von mir kennst du? Liste mir alle inklusive ihrer Eigenschaften auf.";
            setInput(prompt);
            handleSubmit(e, prompt);
          }}
        >
          Zeige Charaktere
        </div>
        <div
          className="px-4 py-1 border border-white rounded-full hover:cursor-pointer hover:scale-105"
          onClick={(e) => {
            const prompt =
              "Welche Orte von mir kennst du? Liste mir alle inklusive ihrer Beschreibung auf.";
            setInput(prompt);
            handleSubmit(e, prompt);
          }}
        >
          Zeige Orte
        </div>
      </div>
      <div className="w-full max-w-4xl h-5/6 overflow-scroll  ">
        <div className=" m-auto  h-full flex flex-col text-white  ">
          {messages.length
            ? messages.map((message, index) => (
                <div key={index}>
                  {message?.role === "user" ? (
                    <span className="text-sm text-blue-400">User: </span>
                  ) : (
                    <span className="text-sm text-green-400">AI: </span>
                  )}
                  <span className="font-normal text-sm ">
                    {message?.content.split("\n").map((str, index) => (
                      <p
                        className={
                          " m-1 p-1 border border-black  hover:rounded-lg " +
                          (message?.role === "user"
                            ? str !== ""
                              ? "hover:border-blue-400 hover:cursor-pointer "
                              : ""
                            : str !== ""
                            ? "hover:border-green-400 hover:cursor-pointer "
                            : "")
                        }
                        key={index}
                        onClick={() => {
                          // copy to clipboard
                          navigator.clipboard.writeText(str);
                        }}
                      >
                        {str}
                      </p>
                    ))}
                  </span>
                </div>
              ))
            : null}
          <div ref={messagesEndRef}></div>
          {activeRun && (
            <div className=" flex w-full justify-start">
              <Lottie
                animationData={typingAnimation}
                loop={true}
                className=" w-16"
              />
            </div>
          )}
        </div>
      </div> */}

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
