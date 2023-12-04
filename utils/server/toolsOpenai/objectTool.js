import OpenAI from "openai";
import { promises as fs } from "fs";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function objectTool(toolCall) {
  console.log("calling object tool");
  console.log(toolCall);

  // determine which function to call

  var returnOutput = null;

  let fktArguments = JSON.parse(toolCall.function.arguments);

  if (toolCall.function.name === "getAvailableObjects") {
    const object = await getAllObjects();

    returnOutput = {
      tool_call_id: toolCall.id,
      output: object,
    };
  }

  if (toolCall.function.name === "getObject") {
    const description = await getObject(fktArguments?.name);

    returnOutput = {
      tool_call_id: toolCall.id,
      output: description,
    };
  }

  if (toolCall.function.name === "postObject") {
    const object = await addObject(
      fktArguments.name,
      fktArguments.object_description
    );

    returnOutput = {
      tool_call_id: toolCall.id,
      output: object,
    };
  }

  // delete object deleteCharacteristics
  if (toolCall.function.name === "deleteObject") {
    const object = await deleteObject(fktArguments?.name);

    returnOutput = {
      tool_call_id: toolCall.id,
      output: object,
    };
  }

  // get all object and all persons
  if (toolCall.function.name === "getAllObjects") {
    const object = await getAllObjects();

    returnOutput = {
      tool_call_id: toolCall.id,
      output: object,
    };
  }

  console.log("output", returnOutput);

  return returnOutput;
}

// get object from database
const getObject = async (key) => {
  console.log("calling getObject");
  const name = key.toLowerCase();

  const file = await fs.readFile(
    process.cwd() + "/public/database/object.json",
    "utf8"
  );
  const data = JSON.parse(file);
  const object = data.find((object) => object.key === name);
  if (!object) {
    return "Objekt nicht gefunden";
  }
  console.log(`found object for ${name}`, object);
  return object.description;
};

// edit characteristic to database
const postObject = async (key, description) => {
  console.log("calling postObject");
  console.log("change object for", key);
  const name = key.toLowerCase();

  const file = await fs.readFile(
    process.cwd() + "/public/database/object.json",
    "utf8"
  );
  var data = JSON.parse(file);

  data = data.map((object) => {
    if (object.key === name) {
      object.description = description;
    }
    return object;
  });

  console.log("changed to");
  console.log(data);
  const resp = await fs
    .writeFile(
      process.cwd() + "/public/database/object.json",
      JSON.stringify(data)
    )
    .then(() => {
      return "Änderungen erfolgreich gespeichert";
    });

  return resp;
};

// add new object characteristic to database
const addObject = async (key, description) => {
  console.log("calling addObject");
  console.log("add object description for", key);
  const name = key.toLowerCase();

  const file = await fs.readFile(
    process.cwd() + "/public/database/object.json",
    "utf8"
  );
  var data = JSON.parse(file);

  const objectFound = data.find((object) => object.key === name);
  if (objectFound) {
    console.log("object already exists");
    const postData = await postOb(key, description);
    return postData;
  }

  data.push({ key: name, description: description });

  const resp = await fs
    .writeFile(
      process.cwd() + "/public/database/object.json",
      JSON.stringify(data)
    )
    .then(() => {
      return "Objekt erfolgreich hinzugefügt";
    });

  return resp;
};

// delete person characteristic from database
const deleteObject = async (key) => {
  console.log("calling deleteObject");
  console.log("delete object description for", key);
  const name = key.toLowerCase();

  const file = await fs.readFile(
    process.cwd() + "/public/database/object.json",
    "utf8"
  );
  var data = JSON.parse(file);

  const objectFound = data.find((object) => object.key === name);
  if (!objectFound) {
    console.log("object not found");
    return "Objekt nicht gefunden";
  }

  // delete person with characteristic from database
  data = data.filter((object) => object.key !== name);

  const resp = await fs
    .writeFile(
      process.cwd() + "/public/database/object.json",
      JSON.stringify(data)
    )
    .then(() => {
      return "Objekt erfolgreich gelöscht";
    });

  return resp;
};

// get all characteristics from database
const getAllObjects = async () => {
  console.log("calling getAllObjects");

  const file = await fs.readFile(
    process.cwd() + "/public/database/object.json",
    "utf8"
  );
  const data = JSON.parse(file);

  return JSON.stringify(data);
};
