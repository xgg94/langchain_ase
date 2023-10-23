async function createPineconeIndex(client, indexName, dimension) {
  try {
    const existingIndexes = await client.list_indexes();
    if (existingIndexes.indexes.includes(indexName)) {
      console.log(`Index ${indexName} already exists`);
      return;
    }
    const response = await client.create_index({
      name: indexName,
      dimension: dimension,
      metric: "cosine",
    });
    console.log(`Index ${indexName} created with dimension ${dimension}`);
    return response;
  } catch (error) {
    console.error(`Error creating index ${indexName}: ${error}`);
  }
}
