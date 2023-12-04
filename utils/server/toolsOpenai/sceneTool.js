import OpenAI from "openai";
import { promises as fs } from "fs";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function sceneTool(toolCall) {
  console.log("calling sceneTool tool");
  console.log(toolCall);

  // determine which function to call

  var returnOutput = null;

  let fktArguments = JSON.parse(toolCall.function.arguments);

  if (toolCall.function.name === "getAvailableScenes") {
    const scenes = await getAllScenes();

    returnOutput = {
      tool_call_id: toolCall.id,
      output: scenes,
    };
  }

  if (toolCall.function.name === "getScene") {
    const context = await getScene(fktArguments?.name);

    returnOutput = {
      tool_call_id: toolCall.id,
      output: context,
    };
  }

  console.log("output", returnOutput);

  return returnOutput;
}

// get characteristic from database
const getScene = async (key) => {
  console.log("calling getScene");
  const name = key.toLowerCase();

  const file = await fs.readFile(
    process.cwd() + "/public/database/scene.json",
    "utf8"
  );
  const data = JSON.parse(file);
  const scene = data.find((scene) => scene.key === name);
  if (!scene) {
    return "Scene nicht gefunden";
  }
  console.log(`found scene for ${name}`, scene);
  return JSON.stringify(scene.context);
};

// get all characteristics from database
const getAllScenes = async () => {
  console.log("calling getAllScenes");

  const file = await fs.readFile(
    process.cwd() + "/public/database/scene.json",
    "utf8"
  );
  const data = JSON.parse(file);

  return JSON.stringify(data);
};
