import React, { useEffect, useState, useRef } from "react";

export default function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [embeddingNames, setEmbeddingNames] = useState([]);
  const [activeEmbedding, setActiveEmbedding] = useState(null);
  const [isChecked, setIsChecked] = useState(false);

  useEffect(() => {
    getEmbeddings();
  }, []);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
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
        generative: isChecked,
      }),
    });
    const { chainResponse, genResponse } = await response.json();

    setMessages([
      ...messages,
      {
        role: "user",
        content: question,
      },
      {
        role: "ai",
        content: chainResponse?.output_text
          ? chainResponse.output_text
          : genResponse?.text
          ? genResponse.text
          : chainResponse.text,
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

  return (
    <main className="bg-black flex h-screen flex-col items-center justify-between p-24 text-2xl font-bold ">
      <div className=" text-white">Langchain - Custom Knowledge Base</div>
      {/* Embedding initialization */}
      <button
        className=" bg-green-600 rounded-lg uppercase text-white px-2 py-1 text-sm hover:bg-green-700"
        onClick={initEmbedding}
      >
        init embedding
      </button>

      {/* Embedding context selection */}
      <select
        className=" m-2 py-1 px-4 text-sm rounded-lg"
        name="embedding"
        id=""
        onChange={(e) => {
          setActiveEmbedding(e.target.value);
        }}
      >
        {embeddingNames.map((embeddingName, index) => (
          <option key={index} value={embeddingName}>
            {embeddingName}
          </option>
        ))}
      </select>

      {/* Chat history*/}
      <div className="border-t border-white border-opacity-40 w-screen"></div>
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
                  <span className="font-normal text-sm">
                    {message.content.split("\n").map((str, index) => (
                      <p key={index}>{str}</p>
                    ))}
                  </span>
                </div>
              ))
            : null}
          <div ref={messagesEndRef}></div>
        </div>
      </div>

      {/* Text input */}
      <div className="border-t border-white border-opacity-40 w-screen"></div>
      <form
        onSubmit={handleSubmit}
        className=" flex w-full justify-center fixed bottom-20 "
      >
        <div className="  fixed b-0 flex w-full justify-center gap-4">
          <input
            className="text-sm font-semibold border-2 border-red-700 p-2 w-full max-w-md rounded text-black"
            type="text"
            placeholder="Stelle deine Frage..."
            onChange={(e) => setInput(e.target.value)}
            value={input}
          />
          {/* Checkbox for switching between embeddings and passing context to prompt */}
          <div className=" flex gap-1 justify-center items-center">
            <input
              className=" rounded-lg h-4 w-4"
              type="checkbox"
              checked={isChecked}
              onChange={(e) => {
                setIsChecked(e.target.checked);
              }}
            />
            <label className=" text-white text-sm">
              Check for not using embeddings
            </label>
          </div>
        </div>
      </form>
    </main>
  );
}
