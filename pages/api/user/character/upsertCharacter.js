import { promises as fs } from "fs";

export default async function handler(req, res) {
  const { key, characteristic } = req.body;
  if (!key || !characteristic) {
    return res.status(400).json({ error: "key or characteristic missing" });
  }
  const resp = await postCharacteristics(key, characteristic);
  return res.status(200).json(resp);
}

const postCharacteristics = async (key, characteristic) => {
  console.log("calling postCharacteristics");
  console.log("change characteristic for", key);
  const name = key.toLowerCase();

  const file = await fs.readFile(
    process.cwd() + "/public/database/character.json",
    "utf8"
  );
  var data = JSON.parse(file);

  //check if person already exists
  const personFound = data.find((person) => person.key === name);

  if (!personFound) {
    //adding person to database
    data.push({ key: name, characteristic: characteristic });
    console.log("character added");
  } else {
    data = data.map((person) => {
      if (person.key === name) {
        person.characteristic = characteristic;
        console.log("character changed");
      }
      return person;
    });
  }

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
