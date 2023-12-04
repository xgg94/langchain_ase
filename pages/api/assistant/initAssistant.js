import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // defaults to process.env["OPENAI_API_KEY"]
});

export default async function handler(req, res) {
  // create an assistant
  const assistant = await openai.beta.assistants.create({
    name: "Author Assistant test",
    instructions:
      "Du bist ein Assistent für Autoren und hilfst ihnen bei sämtlichen Aufgaben bei der Manuskripterstellung",
    model: "gpt-3.5-turbo-1106",
    tools: [
      {
        type: "function",
        function: {
          name: "getCharacteristics",
          description:
            "Returniert die Charakteristiken eines Charakters, welche in einem Text vorkommt",
          parameters: {
            type: "object",
            properties: {
              name: {
                type: "string",
                description:
                  "Der Name des Charakters von dem die Charakteristiken zurückgegeben werden sollen",
              },
            },
            required: ["location"],
          },
        },
      },
      {
        type: "function",
        function: {
          name: "postCharacteristics",
          description:
            "Speichert die Charakteristiken eines Charakters in einer externen Datenbank ab",
          parameters: {
            type: "object",
            properties: {
              name: {
                type: "string",
                description:
                  "Der Name des Charakters von dem die Charakteristiken gespeichert werden sollen",
              },
              char_description: {
                type: "string",
                description:
                  "Die Charakteristiken des Charakters, welche gespeichert werden sollen",
              },
            },
            required: ["location"],
          },
        },
      },
    ],
  });

  return res.status(200).json("ok");
}
