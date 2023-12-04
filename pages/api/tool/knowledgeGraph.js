import OpenAI from "openai";
import { promises as fs } from "fs";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  const { toolCall, threadId, runId } = req.body;

  console.log("calling knowledge graph tool");
  console.log(toolCall);
  const fktArguments = JSON.parse(toolCall.function.arguments);
  // determine which function to call

  if (toolCall.function.name === "KnowledgeGraph") {
    const kg = await createKnowledgeGraph(
      fktArguments.startNodes,
      fktArguments.relations,
      fktArguments.endNodes
    );
    console.log(kg);
    const run = await openai.beta.threads.runs.submitToolOutputs(
      threadId,
      runId,
      {
        tool_outputs: [
          {
            tool_call_id: toolCall.id,
            output: kg,
          },
        ],
      }
    );

    console.log(run);

    return res.status(200).json(run);
  }

  if (toolCall.function.name === "getKnowledgeGraphData") {
    const kg = await getKnowledgeGraph();
    console.log(kg);
    const run = await openai.beta.threads.runs.submitToolOutputs(
      threadId,
      runId,
      {
        tool_outputs: [
          {
            tool_call_id: toolCall.id,
            output: kg,
          },
        ],
      }
    );

    console.log(run);

    return res.status(200).json(run);
  }
}

const createKnowledgeGraph = async (startNodes, relations, endNodes) => {
  var kg = [];
  startNodes.forEach((startNode, index) => {
    kg.push({
      startNode: startNode,
      relation: relations[index],
      endNode: endNodes[index],
    });
  });

  const resp = await fs
    .writeFile(
      process.cwd() + "/public/database/knowledgegraph.json",
      JSON.stringify(kg)
    )
    .then(() => {
      return "Änderungen erfolgreich gespeichert";
    });

  return resp;
};

const getKnowledgeGraph = async () => {
  const file = await fs.readFile(
    process.cwd() + "/public/database/knowledgegraph.json",
    "utf8"
  );
  const kg = JSON.parse(file);
  return JSON.stringify(kg);
};
