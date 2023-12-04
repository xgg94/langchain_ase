import { promises as fs } from "fs";

export default async function handler(req, res) {
  const { key, description } = req.body;
  if (!key || !description) {
    return res.status(400).json({ error: "key or description missing" });
  }
  const resp = await postLocation(key, description);
  return res.status(200).json(resp);
}

const postLocation = async (key, description) => {
  console.log("calling postLocation");
  console.log("change location for", key);
  const name = key.toLowerCase();

  const file = await fs.readFile(
    process.cwd() + "/public/database/location.json",
    "utf8"
  );
  var data = JSON.parse(file);

  //check if location already exists
  const locationFound = data.find((location) => location.key === name);

  if (!locationFound) {
    //adding location to database
    data.push({ key: name, description: description });
    console.log("character added");
  } else {
    data = data.map((location) => {
      if (location.key === name) {
        location.description = description;
        console.log("location changed");
      }
      return location;
    });
  }

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
