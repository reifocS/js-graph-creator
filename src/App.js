import React from "react";
import "./styles.css";
import { nanoid as initialNanoid } from "nanoid";
import { draw, pointInCircle, getCoordinatesFromEvent } from "./draw";
import {
  ID_SIZE,
  RADIUS,
  DARK,
  LIGHT,
  DIRECTED,
  UNDIRECTED,
  DRAG,
  LINK,
  DEL,
  ADD,
  CONNECTOR,
  NODE,
  LOCAL_STORAGE_KEY
} from "./constant";
import EditModal from "./EditModal";
import GraphFromMatrix from "./GraphFromMatrix";
import useLocalStorage from "./useLocalStorage";
import { DFS, BFS } from "./algorithm";
import ChoseNodeModal from "./ChoseNodeModal";
//import useWindowSize from "./useWindowSize";

//TODO
// Resize canvas when resizing window
// add zoom
// handle auto link
// add label on link
// smart node positionning
// redo
// change layout for graph created
// visualization of DFS/BFS

const nanoid = () => initialNanoid(ID_SIZE);

const adjacency = [
  [0, 1, 0],
  [1, 0, 0],
  [0, 1, 0]
];
function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function createGraphFromState(state) {
  const nodes = state.filter((e) => e.type === NODE);
  const links = state.filter((e) => e.type === CONNECTOR);
  const graph = [];
  for (const node of nodes) {
    let n = {
      id: node.id,
      neighbours: [],
      name: node.name
    };
    for (const link of links) {
      const startNode = nodes.find((n) => n.id === link.start);
      const endNode = nodes.find((n) => n.id === link.end);

      if (startNode.id === node.id) {
        n.neighbours.push(endNode.id);
      }
    }
    graph.push(n);
  }

  return graph;
}

export function createStateFromMatrix(matrix) {
  //first create all the node
  const nodes = [];
  const links = [];
  const nbOfNodes = matrix.length;
  const h = window.innerHeight * 0.7;
  const w = window.innerWidth * 0.7;
  for (let i = 0; i < nbOfNodes; ++i) {
    nodes.push({
      type: NODE,
      x: getRandomInt(100, w),
      y: getRandomInt(100, h),
      id: nanoid(),
      name: (i + 1).toString()
    });
  }

  for (let i = 0; i < nbOfNodes; ++i) {
    for (let j = 0; j < nbOfNodes; ++j) {
      const hasLink = matrix[i][j];
      if (hasLink) {
        links.push({
          type: CONNECTOR,
          start: nodes[i].id,
          end: nodes[j].id,
          id: nanoid()
        });
      }
    }
  }
  return nodes.concat(links);
}

const initialElements = createStateFromMatrix(adjacency);
let id;
try {
  id =
    JSON.parse(
      window.localStorage.getItem(LOCAL_STORAGE_KEY)
    )?.elements?.filter((e) => e.type === NODE)?.length || adjacency.length;
} catch (e) {
  console.error(e);
  id = adjacency.length;
}

function App() {
  const canvasRef = React.useRef();
  const [appState, setAppState] = useLocalStorage(LOCAL_STORAGE_KEY, {
    elements: initialElements,
    draggingElement: null,
    selectedElementIds: [],
    selectedNode: null,
    graphType: DIRECTED
  });

  const [isDemo, setIsDemo] = React.useState(false);
  const [mode, setMode] = React.useState(DRAG);
  const [editingNode, setEditingNode] = React.useState(false);
  const [editingMatrix, setEditingMatrix] = React.useState(false);
  const [choseNode, setChosingNode] = React.useState(false);
  const [, forceUpdate] = React.useState(0);

  const defaultDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const [theme, setTheme] = useLocalStorage(
    "theme",
    defaultDark ? DARK : LIGHT
  );
  const [history, setHistory] = React.useState([]);

  const elemRef = React.useRef(appState);
  React.useLayoutEffect(() => {
    elemRef.current = appState;
  });

  React.useEffect(() => {
    draw(
      canvasRef.current.getContext("2d"),
      elemRef.current,
      canvasRef.current.width,
      canvasRef.current.height
    );
  }, []);

  React.useEffect(() => {
    function onResize() {
      forceUpdate(Math.random());
      draw(
        canvasRef.current.getContext("2d"),
        elemRef.current,
        canvasRef.current.width,
        canvasRef.current.height
      );
    }
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
    };
  }, []);

  const triggerAlgo = (type, node) => {
    let index = 0;
    let g;
    const graphFromState = createGraphFromState(appState.elements);
    const selectedNode = node
      ? graphFromState.find((n) => n.id === node.id)
      : null;
    if (type === "DFS") {
      g = DFS(graphFromState);
    } else if (type === "BFS") {
      g = BFS(graphFromState, selectedNode);
    }
    setIsDemo(true);
    let id = setInterval(() => {
      let node = g[index];
      if (!node) {
        setIsDemo(false);
        clearInterval(id);
        draw(
          canvasRef.current.getContext("2d"),
          { ...appState, selectedNode: null },
          canvasRef.current.width,
          canvasRef.current.height
        );
        return;
      }
      const newState = {
        ...appState,
        selectedNode: appState.elements.find((el) => el.id === node.id)
      };
      draw(
        canvasRef.current.getContext("2d"),
        newState,
        canvasRef.current.width,
        canvasRef.current.height
      );
      index++;
    }, 700);
  };

  const updateStateAndDraw = (newState) => {
    if (isDemo) return;
    const ctx = canvasRef.current?.getContext("2d");
    setHistory((prev) => [...prev, appState]);
    setAppState(newState);
    draw(ctx, newState, canvasRef.current.width, canvasRef.current.height);
  };

  const switchTheme = () => {
    const newTheme = theme === LIGHT ? DARK : LIGHT;
    setTheme(newTheme);
  };

  const handlePointerDown = (e) => {
    const [startX, startY] = getCoordinatesFromEvent(e, canvasRef.current);
    const el = doesItHit(startX, startY);
    if (mode === DRAG) {
      if (el !== appState.selectedNode) {
        updateStateAndDraw({
          ...appState,
          draggingElement: el,
          selectedNode: el
        });
      } else if (appState.draggingElement !== el) {
        updateStateAndDraw({
          ...appState,
          draggingElement: el
        });
      }
    }
  };

  const handlePointerUp = (e) => {
    if (appState.draggingElement && mode === DRAG) {
      const [mouseX, mouseY] = getCoordinatesFromEvent(e, canvasRef.current);

      const dragTarget = {
        ...appState.draggingElement,
        x: mouseX,
        y: mouseY
      };

      const newElems = appState.elements.map((e) => {
        if (e.id === dragTarget.id) {
          return dragTarget;
        }
        return e;
      });

      const newState = {
        ...appState,
        elements: newElems,
        draggingElement: null
      };
      setAppState(newState);
    }
  };

  const handlePointerMove = (e) => {
    if (!appState.draggingElement || mode !== DRAG) return;
    const ctx = canvasRef.current.getContext("2d");
    const startX = parseInt(appState.draggingElement.x, 10);
    const startY = parseInt(appState.draggingElement.y, 10);

    const [mouseX, mouseY] = getCoordinatesFromEvent(e, canvasRef.current);

    const dx = mouseX - startX;
    const dy = mouseY - startY;
    const dragTarget = {
      ...appState.draggingElement,
      x: parseInt(appState.draggingElement.x, 10) + dx,
      y: parseInt(appState.draggingElement.y, 10) + dy
    };

    const newElems = appState.elements.map((e) => {
      if (e.id === dragTarget.id) {
        return dragTarget;
      }
      return e;
    });

    draw(
      ctx,
      { ...appState, elements: newElems },
      canvasRef.current.width,
      canvasRef.current.height
    );
  };

  const handleClick = (e) => {
    const [startX, startY] = getCoordinatesFromEvent(e, canvasRef.current);
    const el = doesItHit(startX, startY);
    const link = doesItHitLink(startX, startY);
    if (mode === ADD) {
      addNewNode(e.clientX, e.clientY);
      return;
    }

    if (mode === DEL) {
      if (link) {
        const newElems = appState.elements.filter((e) => {
          return e.id !== link.id;
        });

        const newState = {
          ...appState,
          elements: newElems,
          selectedNode: null
        };

        updateStateAndDraw(newState);
      } else if (el) {
        const newElems = appState.elements.filter((e) => {
          return e.id !== el.id && e.start !== el.id && e.end !== el.id;
        });

        const newState = {
          ...appState,
          elements: newElems,
          selectedNode: null
        };
        updateStateAndDraw(newState);
      }
    }

    if (mode === LINK) {
      if (!el) {
        return;
      }
      const exists = appState.selectedElementIds.find((e) => e === el.id);
      let newSelected;
      let newElems = [...appState.elements];
      if (exists) {
        newSelected = appState.selectedElementIds.filter((e) => {
          return e !== el.id;
        });
      } else {
        newSelected = [...appState.selectedElementIds, el.id];
      }

      if (newSelected.length === 2) {
        const b = new Set([newSelected[0], newSelected[1]]);
        const linkExist = newElems.find((ne) => {
          if (ne.type !== CONNECTOR) return false;
          const a = [ne.start, ne.end];
          if (appState.graphType === DIRECTED) {
            return a[0] === newSelected[0] && a[1] === newSelected[1];
          }
          return [...a].every((value) => b.has(value));
        });
        if (!linkExist) {
          newElems.push({
            type: CONNECTOR,
            start: newSelected[0],
            end: newSelected[1],
            id: nanoid()
          });
        }
        newSelected = [];
      }

      const newState = {
        ...appState,
        elements: newElems,
        selectedElementIds: newSelected
      };

      updateStateAndDraw(newState);
    }
  };

  const doesItHit = (x, y) => {
    let { elements } = appState;
    elements = elements.filter((e) => e.type === NODE);
    let elem = null;
    for (const el of elements) {
      if (pointInCircle(x, y, el.x, el.y, RADIUS)) {
        elem = el;
      }
    }
    return elem;
  };

  const doesItHitLink = (x, y) => {
    let { elements } = appState;
    elements = elements.filter((e) => e.type === CONNECTOR);
    const ctx = canvasRef.current.getContext("2d");
    let elem = null;
    for (const el of elements) {
      const path = new Path2D();
      const start = appState.elements.find((e1) => e1.id === el.start);
      const end = appState.elements.find((e1) => e1.id === el.end);
      path.moveTo(start.x, start.y);
      path.lineTo(end.x, end.y);
      ctx.lineWidth = 20;
      if (ctx.isPointInStroke(path, x, y)) {
        elem = el;
      }
    }
    return elem;
  };

  function addNewNode(x, y) {
    const newElems = [
      ...appState.elements,
      {
        type: NODE,
        x,
        y,
        id: nanoid(ID_SIZE),
        name: ++id
      }
    ];

    const newState = {
      ...appState,
      elements: newElems
    };
    updateStateAndDraw(newState);
  }

  function renderCanvas() {
    const canvasWidth = window.innerWidth;
    const canvasHeight = window.innerHeight - 5;

    return (
      <canvas
        className="canvas"
        style={{
          width: canvasWidth,
          height: canvasHeight,
          cursor: getCursor()
        }}
        width={canvasWidth}
        height={canvasHeight}
        ref={canvasRef}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerDown={handlePointerDown}
        onClick={handleClick}
      >
        Zone de dessin
      </canvas>
    );
  }

  function getCursor() {
    switch (mode) {
      case DRAG:
        return "move";
      case DEL:
        return "crosshair";
      case ADD:
        return "cell";
      default:
        return "auto";
    }
  }

  function editNode(e) {
    e.preventDefault();
    setEditingNode(false);
    const newElem = {
      ...appState.selectedNode,
      name: e.target.label.value
    };
    const newAppState = {
      ...appState,
      elements: appState.elements.map((e) => {
        if (e.id === newElem.id) {
          return newElem;
        }
        return e;
      })
    };
    updateStateAndDraw(newAppState);
  }

  return (
    <div className="app" data-theme={theme}>
      <div className="toolbox">
        <select value={mode} onChange={(e) => setMode(e.target.value)}>
          <option value={DRAG}>drag</option>
          <option value={LINK}>link</option>
          <option value={ADD}>add</option>
          <option value={DEL}>delete</option>
        </select>
        <button
          onClick={() => setEditingNode(true)}
          disabled={appState.selectedNode === null}
          type="button"
        >
          edit
        </button>
        <button onClick={() => setEditingMatrix(true)} type="button">
          create
        </button>
        <button
          onClick={() => {
            const ctx = canvasRef.current?.getContext("2d");
            const lastState = [...history].pop();
            lastState.draggingElement = null;
            setHistory((prev) => prev.slice(0, -1));
            setAppState(lastState);
            draw(
              ctx,
              lastState,
              canvasRef.current.width,
              canvasRef.current.height
            );
          }}
          disabled={history.length === 0}
          type="button"
        >
          undo
        </button>
        <select
          value={appState.graphType}
          onChange={(e) => {
            updateStateAndDraw({ ...appState, graphType: e.target.value });
          }}
        >
          <option value={UNDIRECTED}>undirected</option>
          <option value={DIRECTED}>directed</option>
        </select>
        <button onClick={switchTheme}>switch theme</button>
        <button
          onClick={() => {
            const h = window.innerHeight * 0.8;
            const w = window.innerWidth * 0.8;
            const newState = {
              ...appState,
              elements: appState.elements.map((e) => ({
                ...e,
                x: getRandomInt(100, w),
                y: getRandomInt(100, h)
              }))
            };
            updateStateAndDraw(newState);
          }}
        >
          change layout
        </button>
        <button disabled={isDemo} onClick={() => triggerAlgo("DFS")}>
          DFS
        </button>
        <button disabled={isDemo} onClick={() => setChosingNode(true)}>
          BFS
        </button>
      </div>
      <div className="canvas-container">{renderCanvas()}</div>

      <EditModal
        toEdit={{ ...appState.selectedNode }}
        isOpen={editingNode}
        handleSubmit={editNode}
        close={() => setEditingNode(false)}
      />
      <GraphFromMatrix
        isOpen={editingMatrix}
        handleSubmit={(matrix) => {
          const newState = {
            ...appState,
            elements: createStateFromMatrix(matrix)
          };
          updateStateAndDraw(newState);
          setEditingMatrix(false);
        }}
        close={() => setEditingMatrix(false)}
      />
      <ChoseNodeModal
        isOpen={choseNode}
        handleSubmit={(node) => triggerAlgo("BFS", node)}
        close={() => setChosingNode(false)}
        nodes={appState.elements.filter((e) => e.type === NODE)}
      />
    </div>
  );
}

export default App;
