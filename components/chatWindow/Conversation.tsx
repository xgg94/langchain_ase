"use client";

import typingAnimation from "../../public/animations/typingAnimation.json";
import dynamic from "next/dynamic";
const Lottie = dynamic(() => import("lottie-react"), {
  ssr: false,
});

export default function Conversation({
  setInput,
  handleSubmit,
  messages,
  isLoading,
  messagesEndRef,
}: {
  setInput: any;
  handleSubmit: any;
  messages: any;
  isLoading: Boolean;
  messagesEndRef: any;
}) {
  return (
    <>
      <div className="py-2 text-white text-sm font-normal flex flex-wrap gap-8 ">
        <div
          className="px-4 py-1 border border-white rounded-full hover:cursor-pointer hover:scale-105"
          onClick={(e) => {
            const prompt = "Ich möchte eine neue Szene erstellen.";
            // setInput(prompt);
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
            // setInput(prompt);
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
            // setInput(prompt);
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
            // setInput(prompt);
            handleSubmit(e, prompt);
          }}
        >
          Zeige Orte
        </div>
      </div>
      <div className="w-full max-w-4xl h-5/6 overflow-scroll  ">
        <div className=" m-auto  h-full flex flex-col text-white  ">
          {messages.length
            ? messages.map((message: any, index: any) => (
                <div key={index}>
                  {message?.role === "user" ? (
                    <span className="text-sm text-blue-400">User: </span>
                  ) : (
                    <span className="text-sm text-green-400">Assistant: </span>
                  )}
                  <span className="font-normal text-sm ">
                    {message?.content[0]?.text?.value
                      .split("\n")
                      .map((str: any, index: any) => (
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
          {isLoading && (
            <div className=" flex w-full justify-start">
              <Lottie
                animationData={typingAnimation}
                loop={true}
                className=" w-16"
              />
            </div>
          )}
        </div>
      </div>
    </>
  );
}
