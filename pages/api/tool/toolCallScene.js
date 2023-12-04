import OpenAI from "openai";
import { promises as fs } from "fs";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  const { toolCalls, threadId, runId } = req.body;

  console.log("calling scene tools");
  console.log(toolCalls);

  // determine which function to call

  var outputs = [];

  for (const toolCall of toolCalls) {
    let fktArguments = JSON.parse(toolCall.function.arguments);

    if (toolCall.function.name === "getScene") {
      const scene = await getScene(fktArguments.name);

      outputs.push({
        tool_call_id: toolCall.id,
        output: scene,
      });
    }

    // get all scenes
    if (toolCall.function.name === "getAllScenes") {
      const scenes = await getAllScenes();

      outputs.push({
        tool_call_id: toolCall.id,
        output: scenes,
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

// get scene from database
const getScene = async (key) => {
  console.log("calling getScene");
  const name = key.toLowerCase();

  const file = await fs.readFile(
    process.cwd() + "/public/database/scene.json",
    "utf8"
  );
  const data = JSON.parse(file);
  const scene = data.find((location) => location.key === name);
  if (!scene) {
    return "Scene nicht gefunden";
  }
  console.log(`found scene for ${name}`, scene);
  return scene;
};

// get all scenes from database
const getAllScenes = async () => {
  console.log("calling getAllScenes");

  const file = await fs.readFile(
    process.cwd() + "/public/database/scene.json",
    "utf8"
  );
  const data = JSON.parse(file);

  return data;
};
