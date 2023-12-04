import { promises as fs } from "fs";

export default async function handler(req, res) {
  const { key, description } = req.body;
  if (!key || !description) {
    return res.status(400).json({ error: "key or description missing" });
  }
  const resp = await postObject(key, description);
  return res.status(200).json(resp);
}

const postObject = async (key, description) => {
  console.log("calling postObject");
  console.log("change object for", key);
  const name = key.toLowerCase();

  const file = await fs.readFile(
    process.cwd() + "/public/database/object.json",
    "utf8"
  );
  var data = JSON.parse(file);

  //check if object already exists
  const objectFound = data.find((object) => object.key === name);

  if (!objectFound) {
    //adding object to database
    data.push({ key: name, description: description });
    console.log("object added");
  } else {
    data = data.map((object) => {
      if (object.key === name) {
        object.description = description;
        console.log("object changed");
      }
      return object;
    });
  }

  const resp = await fs
    .writeFile(
      process.cwd() + "/public/database/object.json",
      JSON.stringify(data)
    )
    .then(() => {
      return "Änderungen erfolgreich gespeichert";
    });

  return resp;
};
