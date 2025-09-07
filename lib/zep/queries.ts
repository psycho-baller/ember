import { Zep } from "@getzep/zep-cloud";
import { client } from "./client";

export async function searchPeople(opts: {
  query: string;
  k?: number;
  minSimilarity?: number
  keyword?: string | null;
}): Promise<Zep.EntityNode[]> {
  const { query, k = 8, minSimilarity = 0.3, keyword = null } = opts;

  const results = await client.graph.search({
    graphId: "all_users",
    query: query,
    scope: "nodes",
    searchFilters: {
      nodeLabels: ["Student"], // Only return user nodes
    },
    limit: k,

    // minScore
    // Optionally, you can add reranker or edge_types if you want more control
  });

  console.log("Search results:", results);

  // remove the node that has a score of 1 because that's the user
  results.nodes = results.nodes?.filter((node) => node.score !== 1);

  return results.nodes ?? [];
}