import OpenAI from "openai";
import { promises as fs } from "fs";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  const { toolCalls, threadId, runId } = req.body;

  console.log("calling object tools");
  console.log(toolCalls);

  // determine which function to call

  var outputs = [];

  for (const toolCall of toolCalls) {
    let fktArguments = JSON.parse(toolCall.function.arguments);

    if (toolCall.function.name === "getObject") {
      const object = await getObject(fktArguments.name);

      outputs.push({
        tool_call_id: toolCall.id,
        output: object,
      });
    }

    if (toolCall.function.name === "postObject") {
      const location = await addObject(
        fktArguments.name,
        fktArguments.object_description
      );

      outputs.push({
        tool_call_id: toolCall.id,
        output: location,
      });
    }

    // delete objects deleteCharacteristics
    if (toolCall.function.name === "deleteObject") {
      const location = await deleteObject(fktArguments.name);

      outputs.push({
        tool_call_id: toolCall.id,
        output: location,
      });
    }

    // get all locations
    if (toolCall.function.name === "getAvailableObjects") {
      const location = await getAllObjects();

      outputs.push({
        tool_call_id: toolCall.id,
        output: location,
      });
    }
  }

  console.log("outputs", outputs);

  const run = await openai.beta.threads.runs.submitToolOutputs(
    threadId,
    runId,
    {
      tool_outputs: outputs,
    }
  );

  return res.status(200).json(run);
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
  return object;
};

// edit object to database
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

// add new  object to database
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
    const postData = await postObject(key, description);
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

// delete  object from database
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
    return "Ort nicht gefunden";
  }

  // delete  with object from database
  data = data.filter((object) => object.key !== name);

  const resp = await fs
    .writeFile(
      process.cwd() + "/public/database/object.json",
      JSON.stringify(data)
    )
    .then(() => {
      return "Ort erfolgreich gelöscht";
    });

  return resp;
};

// get all objects from database
const getAllObjects = async () => {
  console.log("calling getAllObjects");

  const file = await fs.readFile(
    process.cwd() + "/public/database/object.json",
    "utf8"
  );
  const data = JSON.parse(file);

  return data;
};
