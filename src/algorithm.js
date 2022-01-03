export function DFS(graph) {
  const visited = new Set();
  const listInOrder = [];
  for (const node of graph) {
    if (!visited.has(node.id)) explore(node, visited, graph, listInOrder);
  }
  return listInOrder;
}

function explore(node, visited, graph, list) {
  visited.add(node.id);
  list.push(node);
  for (const n of node.neighbours) {
    const fullNeigh = graph.find((el) => el.id === n);
    if (!visited.has(n)) {
      explore(fullNeigh, visited, graph, list);
    }
  }
}

export function BFS(graph, node) {
  if (!node) {
    node = graph[0];
  }
  const marked = new Set();
  const toVisit = [];
  const nodeInOrder = [];
  toVisit.push(node);
  marked.add(node.id);
  nodeInOrder.push(node);
  console.log(graph, node);
  while (toVisit.length > 0) {
    const n = toVisit.shift();
    for (const neigh of n.neighbours) {
      const fullNeigh = graph.find((el) => el.id === neigh);
      if (!marked.has(neigh)) {
        marked.add(neigh);
        toVisit.push(fullNeigh);
        nodeInOrder.push(fullNeigh);
      }
    }
  }
  return nodeInOrder;
}
