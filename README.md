# BFS vs DFS Treasure Hunt

Educational web app visualizing and comparing Breadth-First Search (BFS), Depth-First Search (DFS), and A* pathfinding on a grid.

## Project objective
- Let users place a Start (Rocket), Treasure (Diamond), and Walls on a square grid.
- Run BFS, DFS, and A* to find paths and visualize visited nodes and final paths.
- Compare execution time, nodes visited, and path length.

## Tech stack
- Frontend: plain HTML, CSS, JavaScript
- Backend: none required for the browser version

## Files
- `app.py` — optional Python static file server for local preview
- `algorithms.py` — Python implementations (not used by the browser client)
- `static/index.html` — frontend
- `static/style.css`
- `static/script.js`
- `requirements.txt`

## Run locally
Open `static/index.html` directly in your browser, or use the built-in Python static server:

```bash
python app.py
```

Then open http://127.0.0.1:8000 in your browser.

## Usage
- Use the toolbar to set Start, Treasure, and place Walls by clicking cells.
- Use `Run BFS`, `Run DFS`, `Run A*`, or `Compare Algorithms` to visualize and measure.
- Adjust animation `Speed` slider.

## Extra notes
- All pathfinding runs entirely in the browser; no Flask backend is needed.
- The app visualizes algorithm exploration order and final paths.
- A* uses a heuristic to guide search and can be faster than BFS/DFS when the heuristic is admissible.
