"use client";

import React, { useState, useRef, useEffect } from "react";
import Select from "react-select";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import location from "../../public/database/location.json";
import character from "../../public/database/character.json";
import object from "../../public/database/object.json";
import scene from "../../public/database/scene.json";
import {
  DndContext,
  useSensor,
  useSensors,
  MouseSensor,
  TouchSensor,
  KeyboardSensor,
} from "@dnd-kit/core";
import { Droppable } from "../../utils/client/dnd/Droppable";
import { Draggable } from "../../utils/client/dnd/Draggable";

export default function SceneContextModal({ setShowModal }) {
  const ref = useRef();
  const mouseSensor = useSensor(MouseSensor);
  //const touchSensor = useSensor(TouchSensor);
  const keyboardSensor = useSensor(KeyboardSensor);
  const sensors = useSensors(mouseSensor, keyboardSensor);

  const [editorText, setEditorText] = useState("");
  const [sceneName, setSceneName] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [isOver, setIsOver] = useState(false);

  const [selectedScene, setSelectedScene] = useState(null);

  const [contextList, setContextList] = useState([]);
  const [availableContext, setAvailableContext] = useState([
    ...location.map((loc) => {
      return {
        ...loc,
        type: "location",
      };
    }),
    ...character.map((char) => {
      return {
        ...char,
        type: "character",
      };
    }),
    ...object.map((obj) => {
      return {
        ...obj,
        type: "object",
      };
    }),
  ]);

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

  //load all scenes and add "new scene" to the list
  const handleGetScenes = () => {
    var allScenes = scene.map((scene) => {
      return {
        value: scene.key,
        label: scene.key,
      };
    });
    allScenes.unshift({
      value: "",
      label: "Neue Szene",
    });
    console.log(allScenes);
    return allScenes;
  };

  //handle selection of a scene
  const handleSelectScene = async (e) => {
    console.log(e.value);
    if (e.value === "") {
      clearEditor();
      return;
    }
    //get scene from database
    scene.forEach((scene) => {
      if (scene.key === e.value) {
        setSceneName(scene.key);
        setContextList(scene.context);

        //set available context to all context that are not in the scene
        const newAvailableContext = [
          ...location.map((loc) => {
            return {
              ...loc,
              type: "location",
            };
          }),
          ...character.map((char) => {
            return {
              ...char,
              type: "character",
            };
          }),
        ].filter((ctx) => {
          return !scene.context.some((sceneCtx) => sceneCtx.key === ctx.key);
        });
        setAvailableContext(newAvailableContext);
      }
    });
  };

  //creates or updates a location
  const saveScene = async () => {
    if (sceneName === "") {
      alert("Bitte einen Namen eingeben");
      return;
    }
    if (!contextList.length) {
      alert("Bitte Charaktere, Orte oder Objekte hinzufügen");
      return;
    }
    console.log(contextList);
    const scene = {
      key: sceneName,
      context: contextList,
      selectedScene: selectedScene?.value,
    };

    const sceneResponse = await fetch("/api/user/scene/upsertScene", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(scene),
    });
    const sceneData = await sceneResponse.json();
    console.log(sceneData);
    setSelectedScene("");
    clearEditor();
  };

  //deletes a location
  const deleteLocation = async (loc) => {
    const location = {
      key: sceneName ? sceneName : loc.key,
    };

    console.log(location);

    const locationResponse = await fetch("/api/user/location/deleteLocation", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(location),
    });
    const locationData = await locationResponse.json();
    console.log(locationData);
    clearEditor();
  };

  //clears the editor
  const clearEditor = async () => {
    setAvailableContext([
      ...location.map((loc) => {
        return {
          ...loc,
          type: "location",
        };
      }),
      ...character.map((char) => {
        return {
          ...char,
          type: "character",
        };
      }),
    ]);
    setContextList([]);
    setSceneName("");
    setEditorText("");
  };

  //adding a new context to the list
  const handleDragEnd = (event) => {
    const { active, over, delta } = event;
    if ((active.id === over?.id || !over) && delta?.y !== 0) {
      setIsDragging(false);
      setIsOver(false);
      return;
    }

    // if (!over && delta?.y !== 0) {
    //   console.log("over is null");
    //   setIsDragging(false);
    //   setIsOver(false);
    //   return;
    // }

    console.log(over);
    const newElement = availableContext.find((ctx) => ctx.key === active.id);
    console.log(newElement);
    setContextList([...contextList, newElement]);
    const newAvailableContext = availableContext.filter(
      (ctx) => ctx.key !== active.id
    );
    setAvailableContext(newAvailableContext);
    setIsDragging(false);
    setIsOver(false);
  };

  const handleDragStart = (event) => {
    console.log("handle drag start");
    console.log(event);
    setIsDragging(event.active.id);
    console.log(sensors);
  };

  const handleDragOver = (event) => {
    console.log("handle drag over");
    console.log(event);
    console.log(event.active?.id);
    !event.over ? setIsOver(false) : setIsOver(event.active?.id);
  };

  //remove a context from the list
  const removeContext = (key) => {
    console.log("remove context");
    console.log(key);
    const newContextList = contextList.filter((context) => context.key !== key);
    setContextList(newContextList);
    const newAvailableContext = availableContext.filter(
      (context) => context.key !== key
    );
    setAvailableContext(newAvailableContext);
    //add to available context

    const newElement = contextList.find((ctx) => ctx.key === key);
    console.log(newElement);
    setAvailableContext([...availableContext, newElement]);
  };

  return (
    <>
      <div
        ref={ref}
        className="flex justify-center items-center h-screen fixed inset-0  overflow-y-auto backdrop-blur-sm z-50 outline-none focus:outline-none "
      >
        <div className="absolute top-0  max-w-3xl py-4 px-2 ">
          <DndContext
            onDragEnd={handleDragEnd}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            sensors={sensors}
          >
            {/*content*/}
            <div className="border-0 rounded-lg shadow-lg relative flex flex-col w-full bg-white outline-none focus:outline-none">
              {/*header*/}
              <div className="flex items-center justify-between p-5 border-b border-solid border-slate-200 rounded-t">
                <div className="flex flex-col md:flex-row items-center gap-4">
                  <h3 className="text-xl font-semibold flex  items-center">
                    Wähle Szenen Kontext{" "}
                  </h3>
                  <Select
                    className=" m-2 py-1 px-6 text-sm rounded-lg w-64 md:w-72 cursor-pointer "
                    name="scene"
                    id=""
                    placeholder="Szene auswählen"
                    options={handleGetScenes()}
                    onChange={(e) => {
                      console.log(e.value);
                      setSelectedScene({
                        value: e.value,
                        label: e.value,
                      });
                      handleSelectScene(e);
                    }}
                    value={selectedScene}
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
                  placeholder="Name der Szene eingeben"
                  value={sceneName}
                  onChange={(e) => {
                    setSceneName(e.target.value);
                  }}
                />
              </div>
              <div className="relative px-6 pt-2 h-96">
                <div className=" h-72 w-full  ">
                  <Droppable items={contextList} removeTag={removeContext} />
                </div>

                <div
                  className="absolute bottom-10 right-10 md:bottom-5  text-sm px-4 py-1 uppercase border rounded-lg border-black hover:cursor-pointer hover:bg-black hover:text-white "
                  onClick={clearEditor}
                >
                  clear
                </div>
              </div>
              <div className="flex text-sm justify-center">
                Verfügbare Charaktere, Orte und Objekte
              </div>
              <div className="px-2 py-4 flex flex-wrap justify-center gap-6">
                {availableContext.map((ctx, index) => {
                  return (
                    <Draggable key={ctx.key} id={ctx.key}>
                      <div
                        key={index}
                        className={`relative text-sm bg-black text-white font-normal rounded-lg px-2 hover:cursor-pointer ${
                          isDragging === ctx.key && !isOver
                            ? "scale-110 rotate-12 "
                            : ""
                        } ${isOver === ctx.key ? " scale-150   " : ""}`}
                      >
                        <div>{ctx.key}</div>
                        {/* <div className="bg-red-500 text-white px-2 absolute -right-4 -top-2 rounded-full">
                          x
                        </div> */}
                      </div>
                    </Draggable>
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
                      saveScene();
                    }}
                  >
                    Speichern
                  </button>
                </div>
              </div>
            </div>
          </DndContext>
        </div>
      </div>
      <div className="opacity-25 fixed inset-0 z-40 bg-black"></div>
    </>
  );
}
