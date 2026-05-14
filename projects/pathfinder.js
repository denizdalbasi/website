// --- 1. Configuration & Core State ---
const canvas = document.getElementById("visualizer-canvas");
const ctx = canvas.getContext("2d");

// Constants for Node States (like an Enum)
const NODE_TYPES = { EMPTY: 0, WALL: 1, START: 2, END: 3, VISITED: 4, PATH: 5 };
const COLORS = {
  [NODE_TYPES.EMPTY]: "#ffffff08", // faint background grid
  [NODE_TYPES.WALL]: "#ff3c3c", // bright red wall
  [NODE_TYPES.START]: "#4caf50", // green start
  [NODE_TYPES.END]: "#2196f3", // blue end
  [NODE_TYPES.VISITED]: "#ffb70340", // translucent gold
  [NODE_TYPES.PATH]: "#ffb703", // full gold path
};

let grid = []; // The core 2D array
let GRID_SIZE = 25; // Default grid dimension (e.g., 25x25)
let CELL_SIZE = 0; // Size of a single node (calculated)

let startNode = { row: 5, col: 5 }; // Default start
let endNode = { row: 20, col: 20 }; // Default end
let isDrawing = false; // For mouse drag support

// --- 2. Grid Management ---

// A helper to initialize/re-initialize the data structure
function createGridData() {
  grid = Array.from({ length: GRID_SIZE }, (_, r) =>
    Array.from({ length: GRID_SIZE }, (_, c) => ({
      row: r,
      col: c,
      type: NODE_TYPES.EMPTY,
      weight: 1, // Will be used for "The Engineering Twist" later
      gScore: Infinity, // Cost from start to this node
      previousNode: null, // For backtracing the final path
    }))
  );
  grid[startNode.row][startNode.col].type = NODE_TYPES.START;
  grid[startNode.row][startNode.col].gScore = 0;
  grid[endNode.row][endNode.col].type = NODE_TYPES.END;
}

function resetGrid() {
  GRID_SIZE = parseInt(document.getElementById("grid-size").value);
  // Re-calculate the cell size based on the new size
  // Ensure the canvas takes up most of the view, but not too much
  const maxDim = Math.min(window.innerWidth - 60, window.innerHeight - 200);
  canvas.width = maxDim;
  canvas.height = maxDim;
  CELL_SIZE = maxDim / GRID_SIZE;

  createGridData();
  updateTelemetry();
  requestAnimationFrame(drawGrid);
}

// Clear only visual path/visited states, keep walls
function clearGrid() {
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      const node = grid[row][col];
      // Keep Wall, Start, and End types
      if (node.type === NODE_TYPES.VISITED || node.type === NODE_TYPES.PATH) {
        node.type = NODE_TYPES.EMPTY;
      }
      // Reset algorithm state
      node.gScore = Infinity;
      node.previousNode = null;
    }
  }
  // Reset Start node Gscore
  grid[startNode.row][startNode.col].gScore = 0;
  requestAnimationFrame(drawGrid);
}

// --- 3. The Draw/Render Loop ---

function drawGrid() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      const node = grid[row][col];
      ctx.fillStyle = COLORS[node.type];
      
      // Draw a rectangle for the node
      ctx.fillRect(col * CELL_SIZE, row * CELL_SIZE, CELL_SIZE, CELL_SIZE);
      
      // Draw a subtle border around the node
      ctx.strokeStyle = "#ffffff05"; // very subtle lines
      ctx.lineWidth = 1;
      ctx.strokeRect(col * CELL_SIZE, row * CELL_SIZE, CELL_SIZE, CELL_SIZE);
    }
  }
}

// --- 4. User Interaction & Mouse Events ---

function handleMouseDown(e) {
  isDrawing = true;
  handleMouseMove(e); // Trigger immediately on click
}

function handleMouseUp() {
  isDrawing = false;
}

function handleMouseMove(e) {
  if (!isDrawing) return;

  // Calculate grid coordinates from mouse event
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  const col = Math.floor(x / CELL_SIZE);
  const row = Math.floor(y / CELL_SIZE);

  // Safety check to ensure we are within grid bounds
  if (row < 0 || row >= GRID_SIZE || col < 0 || col >= GRID_SIZE) return;

  const node = grid[row][col];
  const mode = document.getElementById("draw-mode").value;

  // Basic validation (don't draw wall over start, etc.)
  if (mode === "wall" && node.type === NODE_TYPES.EMPTY) {
    node.type = NODE_TYPES.WALL;
  } else if (mode === "start" && node.type === NODE_TYPES.EMPTY) {
    // Need to reset the OLD start node first
    grid[startNode.row][startNode.col].type = NODE_TYPES.EMPTY;
    // Set NEW start
    startNode = { row, col };
    node.type = NODE_TYPES.START;
    node.gScore = 0;
  } else if (mode === "end" && node.type === NODE_TYPES.EMPTY) {
    // Need to reset the OLD end node first
    grid[endNode.row][endNode.col].type = NODE_TYPES.EMPTY;
    // Set NEW end
    endNode = { row, col };
    node.type = NODE_TYPES.END;
  }

  updateTelemetry();
  requestAnimationFrame(drawGrid);
}

// --- 5. Initial Startup ---
canvas.addEventListener("mousedown", handleMouseDown);
window.addEventListener("mouseup", handleMouseUp); // global listener for safety
canvas.addEventListener("mousemove", handleMouseMove);

function updateTelemetry(visited = 0, state = "IDLE") {
    document.getElementById("sys-state").innerText = state;
    document.getElementById("start-coord").innerText = `${startNode.col},${startNode.row}`;
    document.getElementById("end-coord").innerText = `${endNode.col},${endNode.row}`;
    document.getElementById("visited-count").innerText = visited;
}
async function startVisualizer() {
    updateTelemetry(0, "SEARCHING...");
    let visitedCount = 0;
    
    // 1. Get all nodes into a flat list (The Unvisited Set)
    let unvisitedNodes = [];
    for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
            unvisitedNodes.push(grid[r][c]);
        }
    }

    while (unvisitedNodes.length > 0) {
        // 2. Sort to find the node with the lowest distance (Standard Dijkstra)
        unvisitedNodes.sort((a, b) => a.gScore - b.gScore);
        let closestNode = unvisitedNodes.shift();

        // If we hit a wall, skip it
        if (closestNode.type === NODE_TYPES.WALL) continue;
        
        // If the closest node is at Infinity, we are trapped!
        if (closestNode.gScore === Infinity) {
            updateTelemetry(visitedCount, "NO PATH FOUND");
            return;
        }

        // 3. Mark as visited (unless it's start/end)
        if (closestNode.type === NODE_TYPES.EMPTY) {
            closestNode.type = NODE_TYPES.VISITED;
            visitedCount++;
        }

        // 4. Did we reach the end?
        if (closestNode.row === endNode.row && closestNode.col === endNode.col) {
            animatePath();
            updateTelemetry(visitedCount, "TARGET ACQUIRED");
            return;
        }

        // 5. Update neighbors
        updateNeighbors(closestNode);

        // 6. THE VISUALIZATION PAUSE
        // This 'await' is what lets you SEE the gold spread in real-time
        drawGrid();
        await new Promise(resolve => setTimeout(resolve, 5)); // 5ms delay
        document.getElementById("visited-count").innerText = visitedCount;
    }
}

function updateNeighbors(node) {
    const neighbors = [];
    const {row, col} = node;
    if (row > 0) neighbors.push(grid[row - 1][col]);
    if (row < GRID_SIZE - 1) neighbors.push(grid[row + 1][col]);
    if (col > 0) neighbors.push(grid[row][col - 1]);
    if (col < GRID_SIZE - 1) neighbors.push(grid[row][col + 1]);

    for (const neighbor of neighbors) {
        const newScore = node.gScore + neighbor.weight;
        if (newScore < neighbor.gScore) {
            neighbor.gScore = newScore;
            neighbor.previousNode = node;
        }
    }
}

function animatePath() {
    let curr = grid[endNode.row][endNode.col].previousNode;
    while (curr && (curr.row !== startNode.row || curr.col !== startNode.col)) {
        curr.type = NODE_TYPES.PATH;
        curr = curr.previousNode;
    }
    drawGrid();
}
// Initialize on load
resetGrid();