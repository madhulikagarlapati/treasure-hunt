// Simple frontend for grid and visualization. No frameworks.
// Comments throughout to aid beginners.

const gridContainer = document.getElementById('gridContainer');
const gridSizeInput = document.getElementById('gridSize');
const setStartBtn = document.getElementById('setStartBtn');
const setGoalBtn = document.getElementById('setGoalBtn');
const placeWallsBtn = document.getElementById('placeWallsBtn');
const clearBtn = document.getElementById('clearBtn');
const randomBtn = document.getElementById('randomBtn');
const runBfsBtn = document.getElementById('runBfs');
const runDfsBtn = document.getElementById('runDfs');
const runAstarBtn = document.getElementById('runAstar');
const compareBtn = document.getElementById('compare');
const speedInput = document.getElementById('speed');
const resultsDiv = document.getElementById('results');
const themeToggle = document.getElementById('themeToggle');

let mode = 'walls'; // 'start', 'goal', 'walls'
let size = parseInt(gridSizeInput.value, 10) || 15;
let grid = [];
let start = null;
let goal = null;
let animating = false;

function setTheme(dark){
  if(dark) document.documentElement.setAttribute('data-theme','dark'), themeToggle.textContent='Light';
  else document.documentElement.removeAttribute('data-theme'), themeToggle.textContent='Dark';
}

themeToggle.addEventListener('click', ()=> setTheme(!document.documentElement.hasAttribute('data-theme')));

gridSizeInput.addEventListener('change', ()=>{
  size = Math.max(5, Math.min(40, parseInt(gridSizeInput.value,10)));
  buildGrid(size);
});

function setMode(m){
  mode = m;
  [setStartBtn,setGoalBtn,placeWallsBtn].forEach(b=>b.classList.remove('active'));
  if(m==='start') setStartBtn.classList.add('active');
  else if(m==='goal') setGoalBtn.classList.add('active');
  else if(m==='walls') placeWallsBtn.classList.add('active');
}

setStartBtn.addEventListener('click', ()=> setMode('start'));
setGoalBtn.addEventListener('click', ()=> setMode('goal'));
placeWallsBtn.addEventListener('click', ()=> setMode('walls'));
clearBtn.addEventListener('click', clearGrid);
randomBtn.addEventListener('click', randomMaze);
runBfsBtn.addEventListener('click', ()=> runSolve('bfs'));
runDfsBtn.addEventListener('click', ()=> runSolve('dfs'));
runAstarBtn.addEventListener('click', ()=> runSolve('astar'));
compareBtn.addEventListener('click', compare);

function buildGrid(n){
  gridContainer.innerHTML = '';
  gridContainer.style.gridTemplateColumns = `repeat(${n},28px)`;
  grid = Array.from({length:n}, ()=> Array(n).fill(0));
  start = null; goal = null;
  for(let r=0;r<n;r++){
    for(let c=0;c<n;c++){
      const cell = document.createElement('div');
      cell.className = 'cell empty';
      cell.dataset.r = r; cell.dataset.c = c;
      cell.addEventListener('click', onCellClick);
      cell.addEventListener('mouseenter', onCellHover);
      cell.addEventListener('mouseleave', onCellLeave);
      gridContainer.appendChild(cell);
    }
  }
}

function onCellHover(e){
  if(animating) return;
  const el = e.currentTarget;
  if(el.classList.contains('start') || el.classList.contains('goal')) return;
  if(mode === 'start') el.classList.add('hover-start');
  else if(mode === 'goal') el.classList.add('hover-goal');
  else if(mode === 'walls') el.classList.add('hover-wall');
}

function onCellLeave(e){
  const el = e.currentTarget;
  el.classList.remove('hover-start','hover-goal','hover-wall');
}

function onCellClick(e){
  if(animating) return;
  const el = e.currentTarget;
  const r = parseInt(el.dataset.r,10), c = parseInt(el.dataset.c,10);
  if(mode === 'start'){
    clearStart();
    start = [r,c]; el.classList.remove('empty'); el.classList.add('start');
  } else if(mode === 'goal'){
    clearGoal();
    goal = [r,c]; el.classList.remove('empty'); el.classList.add('goal');
  } else {
    if(el.classList.contains('wall')){
      el.classList.remove('wall'); grid[r][c]=0;
    } else if(!el.classList.contains('start') && !el.classList.contains('goal')){
      el.classList.add('wall'); grid[r][c]=1;
    }
  }
}

function clearStart(){
  document.querySelectorAll('.cell.start').forEach(el=>{
    el.classList.remove('start');
    el.classList.add('empty');
  });
}

function clearGoal(){
  document.querySelectorAll('.cell.goal').forEach(el=>{
    el.classList.remove('goal');
    el.classList.add('empty');
  });
}

function clearGrid(){
  buildGrid(size);
}

function randomMaze(){
  buildGrid(size);
  for(let r=0;r<size;r++){
    for(let c=0;c<size;c++){
      if(Math.random() < 0.28){
        grid[r][c]=1;
        const el = document.querySelector(`[data-r='${r}'][data-c='${c}']`);
        el.classList.add('wall');
      }
    }
  }
}

function getPayload(){
  return {grid:grid, start:start, goal:goal};
}

async function runSolve(alg){
  if(!start || !goal){ alert('Place start and treasure first'); return; }
  let data;
  if(alg === 'bfs') data = runBfs(grid, start, goal);
  else if(alg === 'dfs') data = runDfs(grid, start, goal);
  else if(alg === 'astar') data = runAstar(grid, start, goal);
  else return;

  await visualize(data, alg, true);
  showResults(alg, data);
}

async function compare(){
  if(!start || !goal){ alert('Place start and treasure first'); return; }
  const bfsResult = runBfs(grid, start, goal);
  const dfsResult = runDfs(grid, start, goal);
  const astarResult = runAstar(grid, start, goal);

  await visualize(bfsResult, 'bfs', true);
  await visualize(dfsResult, 'dfs', false);
  await visualize(astarResult, 'astar', false);
  showComparison({bfs: bfsResult, dfs: dfsResult, astar: astarResult});
}

function delay(ms){ return new Promise(r=>setTimeout(r,ms)); }

function _nodeKey(node){ return `${node[0]},${node[1]}`; }

function _sameNode(a,b){ return a[0] === b[0] && a[1] === b[1]; }

function* _neighbors(grid, node){
  const dirs = [[1,0],[-1,0],[0,1],[0,-1]];
  const rows = grid.length;
  const cols = rows ? grid[0].length : 0;
  for(const [dr,dc] of dirs){
    const nr = node[0] + dr;
    const nc = node[1] + dc;
    if(nr >= 0 && nr < rows && nc >= 0 && nc < cols && grid[nr][nc] === 0){
      yield [nr,nc];
    }
  }
}

function _reconstruct(parent, start, goal){
  const path = [];
  let node = _nodeKey(goal);
  const startKey = _nodeKey(start);
  while(node && node !== startKey){
    const [r,c] = node.split(',').map(Number);
    path.push([r,c]);
    node = parent[node];
  }
  if(node !== startKey) return [];
  path.push([start[0], start[1]]);
  return path.reverse();
}

function runBfs(grid, start, goal){
  const startTime = performance.now();
  const visitedOrder = [[start[0], start[1]]];
  if(_sameNode(start, goal)){
    return {path: [[start[0], start[1]]], visited: visitedOrder, time: 0};
  }

  const queue = [start];
  const visited = new Set([_nodeKey(start)]);
  const parent = {};

  while(queue.length){
    const node = queue.shift();
    if(_sameNode(node, goal)) break;
    for(const nb of _neighbors(grid, node)){
      const key = _nodeKey(nb);
      if(!visited.has(key)){
        visited.add(key);
        parent[key] = _nodeKey(node);
        queue.push(nb);
        visitedOrder.push([nb[0], nb[1]]);
      }
    }
  }

  const path = _reconstruct(parent, start, goal);
  const elapsed = (performance.now() - startTime) / 1000;
  return {path, visited: visitedOrder, time: elapsed, nodes_visited: visitedOrder.length, steps: path.length ? path.length - 1 : 0, exists: path.length > 0};
}

function runDfs(grid, start, goal){
  const startTime = performance.now();
  const visitedOrder = [[start[0], start[1]]];
  if(_sameNode(start, goal)){
    return {path: [[start[0], start[1]]], visited: visitedOrder, time: 0};
  }

  const stack = [start];
  const visited = new Set([_nodeKey(start)]);
  const parent = {};

  while(stack.length){
    const node = stack.pop();
    if(_sameNode(node, goal)) break;
    for(const nb of _neighbors(grid, node)){
      const key = _nodeKey(nb);
      if(!visited.has(key)){
        visited.add(key);
        parent[key] = _nodeKey(node);
        stack.push(nb);
        visitedOrder.push([nb[0], nb[1]]);
      }
    }
  }

  const path = _reconstruct(parent, start, goal);
  const elapsed = (performance.now() - startTime) / 1000;
  return {path, visited: visitedOrder, time: elapsed, nodes_visited: visitedOrder.length, steps: path.length ? path.length - 1 : 0, exists: path.length > 0};
}

function _manhattan(a, b){
  return Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]);
}

function _popMin(heap){
  let minIndex = 0;
  for(let i = 1; i < heap.length; i++){
    if(heap[i].f < heap[minIndex].f) minIndex = i;
  }
  return heap.splice(minIndex, 1)[0];
}

function runAstar(grid, start, goal){
  const startTime = performance.now();
  const visitedOrder = [[start[0], start[1]]];
  if(_sameNode(start, goal)){
    return {path: [[start[0], start[1]]], visited: visitedOrder, time: 0};
  }

  const openHeap = [{node: start, f: _manhattan(start, goal)}];
  const gScore = {[_nodeKey(start)]: 0};
  const parent = {};
  const closed = new Set();

  while(openHeap.length){
    const current = _popMin(openHeap).node;
    const currentKey = _nodeKey(current);
    if(closed.has(currentKey)) continue;
    closed.add(currentKey);

    if(_sameNode(current, goal)) break;

    for(const nb of _neighbors(grid, current)){
      const nbKey = _nodeKey(nb);
      if(closed.has(nbKey)) continue;
      const tentativeG = gScore[currentKey] + 1;
      if(tentativeG < (gScore[nbKey] ?? Infinity)){
        parent[nbKey] = currentKey;
        gScore[nbKey] = tentativeG;
        const f = tentativeG + _manhattan(nb, goal);
        openHeap.push({node: nb, f});
        visitedOrder.push([nb[0], nb[1]]);
      }
    }
  }

  const path = _reconstruct(parent, start, goal);
  const elapsed = (performance.now() - startTime) / 1000;
  return {path, visited: visitedOrder, time: elapsed, nodes_visited: visitedOrder.length, steps: path.length ? path.length - 1 : 0, exists: path.length > 0};
}

async function visualize(result, which, clear = true){
  animating = true;
  if (clear) {
    document.querySelectorAll('.cell').forEach(el=>{
      el.classList.remove('bfs-visited','bfs-path','dfs-visited','dfs-path','astar-visited','astar-path');
    });
  }

  const visited = result.visited || [];
  const path = result.path || [];
  const speed = parseInt(speedInput.value,10) || 50;

  for(let i=0;i<visited.length;i++){
    const [r,c] = visited[i];
    const el = document.querySelector(`[data-r='${r}'][data-c='${c}']`);
    if(!el) continue;
    if(which==='bfs') el.classList.add('bfs-visited');
    else if(which==='dfs') el.classList.add('dfs-visited');
    else if(which==='astar') el.classList.add('astar-visited');
    await delay(2000/speed);
  }

  for(let i=0;i<path.length;i++){
    const [r,c] = path[i];
    const el = document.querySelector(`[data-r='${r}'][data-c='${c}']`);
    if(!el) continue;
    if(which==='bfs') el.classList.add('bfs-path');
    else if(which==='dfs') el.classList.add('dfs-path');
    else if(which==='astar') el.classList.add('astar-path');
    await delay(1200/speed);
  }

  animating = false;
}

function showResults(alg, data){
  const wrap = document.createElement('div');
  wrap.innerHTML = `<strong>${alg.toUpperCase()}</strong>
    <p>Time: ${data.time.toFixed(6)}s</p>
    <p>Steps: ${data.steps}</p>
    <p>Nodes Visited: ${data.nodes_visited}</p>`;
  resultsDiv.prepend(wrap);
}

function showComparison(data){
  resultsDiv.innerHTML = '';
  const bfs = data.bfs; const dfs = data.dfs;
  const astar = data.astar;
  const out = document.createElement('div');
  out.innerHTML = `<h4>Comparison</h4>
    <p>BFS — time: ${bfs.time.toFixed(6)}s, steps: ${bfs.steps}, visited: ${bfs.nodes_visited}</p>
    <p>DFS — time: ${dfs.time.toFixed(6)}s, steps: ${dfs.steps}, visited: ${dfs.nodes_visited}</p>
    <p>A* — time: ${astar.time.toFixed(6)}s, steps: ${astar.steps}, visited: ${astar.nodes_visited}</p>`;

  let rec = '';
  if(bfs.exists && dfs.exists && astar.exists){
    const shortest = Math.min(bfs.steps, dfs.steps, astar.steps);
    if(shortest === bfs.steps) rec = 'BFS found the shortest path.';
    else if(shortest === dfs.steps) rec = 'DFS found the shortest path.';
    else rec = 'A* found the shortest path.';
  } else if(bfs.exists || dfs.exists || astar.exists){
    const found = [];
    if(bfs.exists) found.push('BFS');
    if(dfs.exists) found.push('DFS');
    if(astar.exists) found.push('A*');
    rec = `${found.join(' and ')} found a path.`;
  } else rec = 'No path found by any algorithm.';

  const recP = document.createElement('p'); recP.textContent = rec; out.appendChild(recP);
  resultsDiv.appendChild(out);
}

buildGrid(size);
