import OpenAI from "openai";
import { promises as fs } from "fs";
import locationTool from "../../../utils/server/toolsOpenai/locationTool";
import objectTool from "../../../utils/server/toolsOpenai/objectTool";
import sceneTool from "../../../utils/server/toolsOpenai/sceneTool";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  const { toolCalls, threadId, runId } = req.body;
  // if tool call throws error, cancel run
  try {
    console.log("calling tools");
    console.log(toolCalls);

    // determine which function to call

    var outputs = [];

    for (const toolCall of toolCalls) {
      let fktArguments = JSON.parse(toolCall?.function?.arguments);

      //get all persons
      if (toolCall?.function?.name === "getAvailableCharacters") {
        const characteristic = await getAllCharacteristics();

        outputs.push({
          tool_call_id: toolCall.id,
          output: characteristic,
        });
      }

      // get specific person
      if (toolCall?.function.name === "getCharacteristics") {
        const characteristic = await getCharacteristic(fktArguments?.name);

        outputs.push({
          tool_call_id: toolCall.id,
          output: characteristic,
        });
      }

      if (toolCall.function.name === "postCharacteristics") {
        const characteristic = await addCharacteristics(
          fktArguments.name,
          fktArguments.char_description
        );

        outputs.push({
          tool_call_id: toolCall.id,
          output: characteristic,
        });
      }

      // delete characteristic deleteCharacteristics
      if (toolCall.function.name === "deleteCharacteristics") {
        const characteristic = await deleteCharacteristics(fktArguments?.name);

        outputs.push({
          tool_call_id: toolCall.id,
          output: characteristic,
        });
      }

      // get all characteristics and all persons
      if (toolCall.function.name === "getAllCharacteristics") {
        const characteristic = await getAllCharacteristics();

        outputs.push({
          tool_call_id: toolCall.id,
          output: characteristic,
        });
      }

      // location tools
      if (
        toolCall.function.name === "getLocation" ||
        toolCall.function.name === "postLocation" ||
        toolCall.function.name === "deleteLocation" ||
        toolCall.function.name === "getAvailableLocations"
      ) {
        const toolOutput = await locationTool(toolCall);
        outputs.push(toolOutput);
      }

      // object tools
      if (
        toolCall.function.name === "getObject" ||
        toolCall.function.name === "postObject" ||
        toolCall.function.name === "deleteObject" ||
        toolCall.function.name === "getAvailableObjects"
      ) {
        const toolOutput = await objectTool(toolCall);
        outputs.push(toolOutput);
      }

      // scene tools
      if (
        toolCall.function.name === "getScene" ||
        toolCall.function.name === "getAvailableScenes"
      ) {
        const toolOutput = await sceneTool(toolCall);
        outputs.push(toolOutput);
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
  } catch (error) {
    console.log("error in toolCall", error);

    const run = await openai.beta.threads.runs.retrieve(threadId, runId);
    if (run?.status === "cancelled") {
      return res.status(500).json("run cancelled");
    } else if (run?.status === "failed") {
      return res.status(500).json("run failed");
    } else {
      return res.status(500).json("error in toolCall");
    }
  }
}

// get characteristic from database
const getCharacteristic = async (key) => {
  console.log("calling getCharacteristic");
  const name = key.toLowerCase();

  const file = await fs.readFile(
    process.cwd() + "/public/database/character.json",
    "utf8"
  );
  const data = JSON.parse(file);
  const person = data.find((characteristic) => characteristic.key === name);
  if (!person) {
    return "Person nicht gefunden";
  }
  console.log(`found characteristic for ${name}`, person);
  return person.characteristic;
};

// edit characteristic to database
const postCharacteristics = async (key, characteristic) => {
  console.log("calling postCharacteristics");
  console.log("change characteristic for", key);
  const name = key.toLowerCase();

  const file = await fs.readFile(
    process.cwd() + "/public/database/character.json",
    "utf8"
  );
  var data = JSON.parse(file);

  data = data.map((person) => {
    if (person.key === name) {
      person.characteristic = characteristic;
    }
    return person;
  });

  console.log("changed to");
  console.log(data);
  const resp = await fs
    .writeFile(
      process.cwd() + "/public/database/character.json",
      JSON.stringify(data)
    )
    .then(() => {
      return "Änderungen erfolgreich gespeichert";
    });

  return resp;
};

// add new person characteristic to database
const addCharacteristics = async (key, characteristic) => {
  console.log("calling addCharacteristics");
  console.log("add characteristic for", key);
  const name = key.toLowerCase();

  const file = await fs.readFile(
    process.cwd() + "/public/database/character.json",
    "utf8"
  );
  var data = JSON.parse(file);

  const personFound = data.find((person) => person.key === name);
  if (personFound) {
    console.log("person already exists");
    const postData = await postCharacteristics(key, characteristic);
    return postData;
  }

  // add new person with characteristic to database
  data.push({ key: name, characteristic: characteristic });

  const resp = await fs
    .writeFile(
      process.cwd() + "/public/database/character.json",
      JSON.stringify(data)
    )
    .then(() => {
      return "Person erfolgreich hinzugefügt";
    });

  return resp;
};

// delete person characteristic from database
const deleteCharacteristics = async (key) => {
  console.log("calling deleteCharacteristics");
  console.log("delete characteristic for", key);
  const name = key.toLowerCase();

  const file = await fs.readFile(
    process.cwd() + "/public/database/character.json",
    "utf8"
  );
  var data = JSON.parse(file);

  const personFound = data.find((person) => person.key === name);
  if (!personFound) {
    console.log("person not found");
    return "Person nicht gefunden";
  }

  // delete person with characteristic from database
  data = data.filter((person) => person.key !== name);

  const resp = await fs
    .writeFile(
      process.cwd() + "/public/database/character.json",
      JSON.stringify(data)
    )
    .then(() => {
      return "Person erfolgreich gelöscht";
    });

  return resp;
};

// get all characteristics from database
const getAllCharacteristics = async () => {
  console.log("calling getAllCharacteristics");

  const file = await fs.readFile(
    process.cwd() + "/public/database/character.json",
    "utf8"
  );
  const data = JSON.parse(file);

  return JSON.stringify(data);
};
