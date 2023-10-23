This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

Insert API KEY:

- create .env file and add **OPENAI_API_KEY**

## Add new files

To add new files, place them in the public folder (txt or docx files)

### init.js

- provide in **init.js** FILENAME, DOCTYPE, VECTORSTORE_NAME
- **FILENAME:** filename of the file you want to embed WITHOUT suffix
- **DOCTYPE** only txt or docx possible
- **VECTORSTORE_NAME** provide a name under which the embeding should be stored

### vectorquery.js

only necessary for generative text, not for Embedding Q&A

- provide in **vectorquery.js** FILENAME, DOCTYPE
- **FILENAME:** filename of the file you want to embed WITHOUT suffix
- **DOCTYPE** only txt or docx possible

## Embed files

After providing the described files and namings click **INIT EMBEDDING**
Under **/vectorStore** a new folder with vectors should appear

## Usage of app

- select a embedding from dropdown
- past your prompt into the input field
- tick checkbox if you want to past the whole text file within the prompt (all as context)
- **attention:** embeddings are cheap - when ticking the checkbox it's getting expensive fast
