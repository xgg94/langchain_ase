import { promises as fs } from "fs";

export default async function handler(req, res) {
  const { key } = req.body;
  if (!key) {
    return res.status(400).json({ error: "key missing" });
  }
  const objectDeleted = await deleteObject(key);

  if (!objectDeleted) {
    return res
      .status(400)
      .json({ error: "Objekt konnte nicht gelöscht werden" });
  } else {
    return res.status(200).json(`deleted ${key} from database`);
  }
}

const deleteObject = async (key) => {
  console.log("calling deleteObject");
  console.log("delete object for", key);
  const name = key.toLowerCase();

  const file = await fs.readFile(
    process.cwd() + "/public/database/object.json",
    "utf8"
  );
  var data = JSON.parse(file);

  //check if object can be found
  const objectFound = data.find((object) => object.key === name);

  if (!objectFound) {
    //return object can not be deleted
    return false;
  } else {
    //delete object from database
    data = data.filter((object) => object.key !== name);
  }

  const resp = await fs
    .writeFile(
      process.cwd() + "/public/database/object.json",
      JSON.stringify(data)
    )
    .then(() => {
      return "Änderungen erfolgreich gespeichert";
    });

  return true;
};
