import OpenAI from "openai";
import { promises as fs } from "fs";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function locationTool(toolCall) {
  console.log("calling location tool");
  console.log(toolCall);

  // determine which function to call

  var returnOutput = null;

  let fktArguments = JSON.parse(toolCall.function.arguments);

  if (toolCall.function.name === "getAvailableLocations") {
    const location = await getAllLocations();

    returnOutput = {
      tool_call_id: toolCall.id,
      output: location,
    };
  }

  if (toolCall.function.name === "getLocation") {
    const description = await getLocation(fktArguments?.name);

    returnOutput = {
      tool_call_id: toolCall.id,
      output: description,
    };
  }

  if (toolCall.function.name === "postLocation") {
    const location = await addLocation(
      fktArguments.name,
      fktArguments.location_description
    );

    returnOutput = {
      tool_call_id: toolCall.id,
      output: location,
    };
  }

  // delete characteristic deleteCharacteristics
  if (toolCall.function.name === "deleteLocation") {
    const location = await deleteLocation(fktArguments?.name);

    returnOutput = {
      tool_call_id: toolCall.id,
      output: location,
    };
  }

  // get all characteristics and all persons
  if (toolCall.function.name === "getAllLocations") {
    const location = await getAllLocations();

    returnOutput = {
      tool_call_id: toolCall.id,
      output: location,
    };
  }

  console.log("output", returnOutput);

  return returnOutput;
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
    return "Ort nicht gefunden";
  }
  console.log(`found location for ${name}`, location);
  return location.description;
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

  return JSON.stringify(data);
};
