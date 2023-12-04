import { promises as fs } from "fs";

export default async function handler(req, res) {
  const { key } = req.body;
  if (!key) {
    return res.status(400).json({ error: "key missing" });
  }
  const personDeleted = await deleteCharacteristics(key);

  if (!personDeleted) {
    return res
      .status(400)
      .json({ error: "Person konnte nicht gelöscht werden" });
  } else {
    return res.status(200).json(`deleted ${key} from database`);
  }
}

const deleteCharacteristics = async (key) => {
  console.log("calling deleteCharacteristics");
  console.log("delete characteristic for", key);
  const name = key.toLowerCase();

  const file = await fs.readFile(
    process.cwd() + "/public/database/character.json",
    "utf8"
  );
  var data = JSON.parse(file);

  //check if person can be found
  const personFound = data.find((person) => person.key === name);

  if (!personFound) {
    //return person can not be deleted
    return false;
  } else {
    //delete person from database
    data = data.filter((person) => person.key !== name);
  }

  const resp = await fs
    .writeFile(
      process.cwd() + "/public/database/character.json",
      JSON.stringify(data)
    )
    .then(() => {
      return "Änderungen erfolgreich gespeichert";
    });

  return true;
};
