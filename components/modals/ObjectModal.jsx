"use client";

import React, { useState, useRef, useEffect } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import object from "../../public/database/object.json";

export default function ObjectModal({ setShowModal }) {
  const ref = useRef();
  const [editorText, setEditorText] = useState("");
  const [objectName, setObjectName] = useState("");

  useEffect(() => {
    document.addEventListener("mousedown", checkIfClickedOutside);

    return () => {
      // Cleanup the event listener
      document.removeEventListener("mousedown", checkIfClickedOutside);
    };
  });

  const checkIfClickedOutside = async (e) => {
    // If the menu is open and the clicked target is not within the menu,
    // then close the menu

    if (e.target.contains(ref?.current)) {
      setShowModal(false);
    }
  };

  //creates or updates a object
  const saveObject = async () => {
    if (objectName === "") {
      alert("Bitte einen Namen eingeben");
      return;
    }
    if (editorText === "") {
      alert("Bitte einen Text eingeben");
      return;
    }
    const object = {
      key: objectName,
      description: editorText,
    };

    const objectResponse = await fetch("/api/user/object/upsertObject", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(object),
    });
    const objectData = await objectResponse.json();
    console.log(objectData);
  };

  //deletes a object
  const deleteObject = async (obj) => {
    const object = {
      key: objectName ? objectName : obj.key,
    };

    console.log(object);

    const objectResponse = await fetch("/api/user/object/deleteObject", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(object),
    });
    const objectData = await objectResponse.json();
    console.log(objectData);
    clearEditor();
  };

  //clears the editor
  const clearEditor = async () => {
    setEditorText("");
    setObjectName("");
  };

  return (
    <>
      <div
        ref={ref}
        className="justify-center items-center flex overflow-x-hidden overflow-y-auto fixed backdrop-blur-sm inset-0 z-50 outline-none focus:outline-none"
      >
        <div className="relative w-auto lg:w-[600px] my-6 mx-2 md:mx-auto max-w-3xl ">
          {/*content*/}
          <div className="border-0 rounded-lg shadow-lg relative flex flex-col w-full bg-white outline-none focus:outline-none">
            {/*header*/}
            <div className="flex items-center justify-between p-5 border-b border-solid border-slate-200 rounded-t">
              <h3 className="text-xl font-semibold flex items-center">
                Objekt Erstellung{" "}
              </h3>
              <button
                className="p-1 ml-auto bg-transparent border-0 text-black float-right text-3xl leading-none font-semibold outline-none focus:outline-none flex items-center"
                onClick={() => setShowModal(false)}
              >
                <span className="bg-transparent text-black h-6 w-6 text-2xl  outline-none focus:outline-none flex items-center">
                  ×
                </span>
              </button>
            </div>
            {/*body*/}
            <div className="flex px-6 py-2 ">
              <input
                className=" text-sm text-black font-normal h-12 w-full border-gray-300 border text-center"
                type="text"
                placeholder="Name des Objekts eingeben"
                value={objectName}
                onChange={(e) => {
                  setObjectName(e.target.value);
                }}
              />
            </div>
            <div className="relative px-6 pt-2 flex-auto h-96">
              <ReactQuill
                theme="snow"
                value={editorText}
                onChange={setEditorText}
                className=" h-72 w-full"
              />

              <div
                className="absolute -bottom-5 right-5 text-sm px-2 border rounded-lg border-black hover:cursor-pointer "
                onClick={() => {
                  setEditorText("");
                  setObjectName("");
                }}
              >
                clear
              </div>
            </div>
            <div className="flex text-sm justify-center">Objekt bearbeiten</div>
            <div className="px-2 py-4 flex flex-wrap justify-center gap-6">
              {object.map((obj, index) => {
                return (
                  <div
                    key={index}
                    className="relative text-sm bg-black text-white font-normal rounded-lg px-2 hover:cursor-pointer"
                    onClick={() => {
                      setEditorText(obj.description);
                      setObjectName(obj.key);
                    }}
                  >
                    {obj.key}
                    <div
                      className="bg-red-500 text-white px-2 absolute -right-4 -top-2 rounded-full"
                      onClick={() => deleteObject(obj)}
                    >
                      x
                    </div>
                  </div>
                );
              })}
            </div>

            {/*footer*/}
            <div className="flex flex-col-reverse gap-2 md:flex-row items-center md:justify-between p-6 border-t border-solid border-slate-200 rounded-b">
              <button
                className=" bg-red-500 text-white hover:bg-red-600 font-bold uppercase text-sm px-6 py-3 rounded shadow hover:shadow-lg outline-none focus:outline-none mr-1 mb-1 ease-linear transition-all duration-150"
                type="button"
                onClick={() => {
                  setShowModal(false);
                }}
              >
                Abbrechen
              </button>
              <div className="flex gap-2">
                <button
                  className="bg-green-500 text-white hover:bg-green-600 font-bold uppercase text-sm px-6 py-3 rounded shadow hover:shadow-lg outline-none focus:outline-none mr-1 mb-1 ease-linear transition-all duration-150"
                  type="button"
                  onClick={() => {
                    saveObject();
                  }}
                >
                  Speichern
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="opacity-25 fixed inset-0 z-40 bg-black"></div>
    </>
  );
}
