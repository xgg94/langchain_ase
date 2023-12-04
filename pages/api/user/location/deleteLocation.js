import { promises as fs } from "fs";

export default async function handler(req, res) {
  const { key } = req.body;
  if (!key) {
    return res.status(400).json({ error: "key missing" });
  }
  const locationDeleted = await deleteLocation(key);

  if (!locationDeleted) {
    return res.status(400).json({ error: "Ort konnte nicht gelöscht werden" });
  } else {
    return res.status(200).json(`deleted ${key} from database`);
  }
}

const deleteLocation = async (key) => {
  console.log("calling deleteLocation");
  console.log("delete location for", key);
  const name = key.toLowerCase();

  const file = await fs.readFile(
    process.cwd() + "/public/database/location.json",
    "utf8"
  );
  var data = JSON.parse(file);

  //check if location can be found
  const locationFound = data.find((location) => location.key === name);

  if (!locationFound) {
    //return person can not be deleted
    return false;
  } else {
    //delete person from database
    data = data.filter((location) => location.key !== name);
  }

  const resp = await fs
    .writeFile(
      process.cwd() + "/public/database/location.json",
      JSON.stringify(data)
    )
    .then(() => {
      return "Änderungen erfolgreich gespeichert";
    });

  return true;
};
