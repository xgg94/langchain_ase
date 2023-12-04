import OpenAI from "openai";
import { promises as fs } from "fs";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  const { toolCalls, threadId, runId } = req.body;

  console.log("calling location tools");
  console.log(toolCalls);

  // determine which function to call

  var outputs = [];

  for (const toolCall of toolCalls) {
    let fktArguments = JSON.parse(toolCall.function.arguments);

    if (toolCall.function.name === "getLocation") {
      const location = await getLocation(fktArguments.name);

      outputs.push({
        tool_call_id: toolCall.id,
        output: location,
      });
    }

    if (toolCall.function.name === "postLocation") {
      const location = await addLocation(
        fktArguments.name,
        fktArguments.location_description
      );

      outputs.push({
        tool_call_id: toolCall.id,
        output: location,
      });
    }

    // delete characteristic deleteCharacteristics
    if (toolCall.function.name === "deleteLocation") {
      const location = await deleteLocation(fktArguments.name);

      outputs.push({
        tool_call_id: toolCall.id,
        output: location,
      });
    }

    // get all locations
    if (toolCall.function.name === "getAvailableLocations") {
      const location = await getAllLocations();

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

// get characteristic from database
const getLocation = async (key) => {
  console.log("calling getLocation");
  const name = key.toLowerCase();

  const file = await fs.readFile(
    process.cwd() + "/public/database/location.json",
    "utf8"
  );
  const data = JSON.parse(file);
  const location = data.find((location) => location.key === name);
  if (!location) {
    return "Person nicht gefunden";
  }
  console.log(`found location for ${name}`, location);
  return location;
};

// edit characteristic to database
const postLocation = async (key, description) => {
  console.log("calling postLocation");
  console.log("change location for", key);
  const name = key.toLowerCase();

  const file = await fs.readFile(
    process.cwd() + "/public/database/location.json",
    "utf8"
  );
  var data = JSON.parse(file);

  data = data.map((location) => {
    if (location.key === name) {
      location.description = description;
    }
    return location;
  });

  console.log("changed to");
  console.log(data);
  const resp = await fs
    .writeFile(
      process.cwd() + "/public/database/location.json",
      JSON.stringify(data)
    )
    .then(() => {
      return "Änderungen erfolgreich gespeichert";
    });

  return resp;
};

// add new person characteristic to database
const addLocation = async (key, description) => {
  console.log("calling addLocation");
  console.log("add location description for", key);
  const name = key.toLowerCase();

  const file = await fs.readFile(
    process.cwd() + "/public/database/location.json",
    "utf8"
  );
  var data = JSON.parse(file);

  const locationFound = data.find((location) => location.key === name);
  if (locationFound) {
    console.log("location already exists");
    const postData = await postLocation(key, description);
    return postData;
  }

  data.push({ key: name, description: description });

  const resp = await fs
    .writeFile(
      process.cwd() + "/public/database/location.json",
      JSON.stringify(data)
    )
    .then(() => {
      return "Person erfolgreich hinzugefügt";
    });

  return resp;
};

// delete person characteristic from database
const deleteLocation = async (key) => {
  console.log("calling deleteLocation");
  console.log("delete location description for", key);
  const name = key.toLowerCase();

  const file = await fs.readFile(
    process.cwd() + "/public/database/location.json",
    "utf8"
  );
  var data = JSON.parse(file);

  const locationFound = data.find((location) => location.key === name);
  if (!locationFound) {
    console.log("location not found");
    return "Ort nicht gefunden";
  }

  // delete person with characteristic from database
  data = data.filter((location) => location.key !== name);

  const resp = await fs
    .writeFile(
      process.cwd() + "/public/database/location.json",
      JSON.stringify(data)
    )
    .then(() => {
      return "Ort erfolgreich gelöscht";
    });

  return resp;
};

// get all characteristics from database
const getAllLocations = async () => {
  console.log("calling getAllLocations");

  const file = await fs.readFile(
    process.cwd() + "/public/database/location.json",
    "utf8"
  );
  const data = JSON.parse(file);

  return data;
};
