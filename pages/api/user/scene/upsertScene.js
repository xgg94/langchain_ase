import { promises as fs } from "fs";

export default async function handler(req, res) {
  const { key, context, selectedScene } = req.body;
  console.log("key", key);
  console.log("context", context);
  console.log("selectedScene", selectedScene);
  if (!key || !context) {
    return res.status(400).json({ error: "key or context missing" });
  }
  const resp = await postScene(key, context, selectedScene);
  return res.status(200).json(resp);
}

const postScene = async (key, context, selectedScene) => {
  console.log("calling postScene");
  console.log("change scene for", key);
  const name = key.toLowerCase();

  const file = await fs.readFile(
    process.cwd() + "/public/database/scene.json",
    "utf8"
  );
  var data = JSON.parse(file);

  //check if scene already exists
  const sceneFound = data.find(
    (scene) => scene.key === name || scene.key === selectedScene?.toLowerCase()
  );

  console.log("sceneFound", sceneFound);

  if (!sceneFound) {
    //adding scene to database
    data.push({ key: name, context: context });
    console.log("scene added");
  } else {
    data = data.map((scene) => {
      if (scene.key === name) {
        scene.context = context;
        console.log("scene changed");
      }
      return scene;
    });
  }

  //change data with new scene
  data = data.map((scene) => {
    if (scene.key === selectedScene?.toLowerCase()) {
      scene.context = context;
      scene.key = name;
      console.log("scene changed");
    }
    return scene;
  });

  const resp = await fs
    .writeFile(
      process.cwd() + "/public/database/scene.json",
      JSON.stringify(data)
    )
    .then(() => {
      return "Änderungen erfolgreich gespeichert";
    });

  return resp;
};
