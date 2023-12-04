import React, { useEffect } from "react";
import { useDroppable } from "@dnd-kit/core";

export function Droppable(props) {
  const { isOver, setNodeRef } = useDroppable({
    id: "sceneDroppable",
  });

  return (
    <div
      ref={setNodeRef}
      // className={`w-full h-full text-black px-2 py-4 flex flex-wrap justify-center gap-6 ${
      //   isOver ? " bg-green-700" : ""
      // }`}
      className={`w-full h-full text-black border-2 border-dotted  ${
        isOver
          ? " bg-green-300 opacity-50 border-green-900 scale-[103%] duration-300"
          : " border-black"
      }`}
    >
      <div className="h-full w-full gap-4 md:gap-0 grid grid-cols-1 md:grid-cols-3 md:divide-x overflow-scroll">
        <div className=" col-span-1 ">
          <div className="flex py-1 justify-center border-b border-gray-300 text-lg bg-black text-white ">
            Charaktere
          </div>
          <div className="pt-4 w-full md:h-60 flex flex-col gap-4 px-6 items-center md:overflow-scroll">
            {props.items
              .filter((elem) => elem.type === "character")
              .reverse()
              .map((item, index) => {
                return (
                  <div key={`${item}-${index}`}>
                    <div
                      key={index}
                      className=" text-center w-42 relative text-sm bg-black text-white font-normal rounded-lg px-4 hover:cursor-pointer "
                    >
                      {item.key}
                      <div
                        className="bg-red-500 text-white px-2 absolute -right-4 -top-2 rounded-full"
                        onClick={() => {
                          props.removeTag(item.key);
                        }}
                      >
                        x
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        <div className=" col-span-1 ">
          <div className="flex py-1 justify-center border-b border-gray-300 text-lg bg-black text-white ">
            Orte
          </div>
          <div className="pt-4 w-full md:h-60 flex flex-col gap-4 px-6 items-center md:overflow-scroll">
            {props.items
              .filter((elem) => elem.type === "location")
              .reverse()
              .map((item, index) => {
                return (
                  <div key={`${item}-${index}`}>
                    <div
                      key={index}
                      className=" text-center w-42 relative text-sm bg-black text-white font-normal rounded-lg px-4 hover:cursor-pointer "
                    >
                      {item.key}
                      <div
                        className="bg-red-500 text-white px-2 absolute -right-4 -top-2 rounded-full"
                        onClick={() => {
                          props.removeTag(item.key);
                        }}
                      >
                        x
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
        <div className=" col-span-1 ">
          <div className="flex py-1 justify-center border-b border-gray-300 text-lg bg-black text-white ">
            Objekte
          </div>
          <div className="pt-4 w-full md:h-60 flex flex-col gap-4 px-6 items-center md:overflow-scroll">
            {props.items
              .filter((elem) => elem.type === "object")
              .reverse()
              .map((item, index) => {
                return (
                  <div key={`${item}-${index}`}>
                    <div
                      key={index}
                      className=" text-center w-42 relative text-sm bg-black text-white font-normal rounded-lg px-4 hover:cursor-pointer "
                    >
                      {item.key}
                      <div
                        className="bg-red-500 text-white px-2 absolute -right-4 -top-2 rounded-full"
                        onClick={() => {
                          props.removeTag(item.key);
                        }}
                      >
                        x
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>
      {/* {props.items.length ? (
        props.items.map((item, index) => {
          return (
            <div key={`${item}-${index}`}>
              <div
                key={index}
                className="relative text-sm bg-black text-white font-normal rounded-lg px-2 hover:cursor-pointer"
              >
                {item.key}
                <div
                  className="bg-red-500 text-white px-2 absolute -right-4 -top-2 rounded-full"
                  onClick={() => {
                    props.removeTag(item.key);
                  }}
                >
                  x
                </div>
              </div>
            </div>
          );
        })
      ) : (
        <div
          className=" flex justify-center items-center text-center "
          style={{ color: "black", opacity: "0.5", fontSize: "1rem" }}
        >
          Ziehe hier die Charaktere, Orte oder Gegenstände hin, die in dieser
          Szene vorkommen sollen
        </div>
      )} */}
    </div>
  );
}
