
import time
from collections import deque


def _neighbors(grid, node):
    r, c = node
    dirs = [(1, 0), (-1, 0), (0, 1), (0, -1)]
    rows = len(grid)
    cols = len(grid[0]) if rows else 0
    for dr, dc in dirs:
        nr, nc = r + dr, c + dc
        if 0 <= nr < rows and 0 <= nc < cols and grid[nr][nc] == 0:
            yield (nr, nc)


def _reconstruct(parent, start, goal):
    path = []
    node = goal
    while node != start:
        path.append([node[0], node[1]])
        node = parent.get(node)
        if node is None:
            return []
    path.append([start[0], start[1]])
    path.reverse()
    return path


def run_bfs(grid, start, goal):
    start_time = time.time()
    if start == goal:
        return [[start[0], start[1]]], [[start[0], start[1]]], 0.0

    queue = deque([start])
    visited = set([start])
    parent = {}
    visited_order = [[start[0], start[1]]]

    while queue:
        node = queue.popleft()
        if node == goal:
            elapsed = time.time() - start_time
            path = _reconstruct(parent, start, goal)
            return path, visited_order, elapsed

        for nb in _neighbors(grid, node):
            if nb not in visited:
                visited.add(nb)
                parent[nb] = node
                queue.append(nb)
                visited_order.append([nb[0], nb[1]])

    elapsed = time.time() - start_time
    return [], visited_order, elapsed


def run_dfs(grid, start, goal):
    start_time = time.time()
    if start == goal:
        return [[start[0], start[1]]], [[start[0], start[1]]], 0.0

    stack = [start]
    visited = set([start])
    parent = {}
    visited_order = [[start[0], start[1]]]

    while stack:
        node = stack.pop()
        if node == goal:
            elapsed = time.time() - start_time
            path = _reconstruct(parent, start, goal)
            return path, visited_order, elapsed

        for nb in _neighbors(grid, node):
            if nb not in visited:
                visited.add(nb)
                parent[nb] = node
                stack.append(nb)
                visited_order.append([nb[0], nb[1]])

    elapsed = time.time() - start_time
    return [], visited_order, elapsed


def _manhattan(a, b):
    return abs(a[0] - b[0]) + abs(a[1] - b[1])


def run_astar(grid, start, goal):
    start_time = time.time()
    if start == goal:
        return [[start[0], start[1]]], [[start[0], start[1]]], 0.0

    from heapq import heappush, heappop

    open_heap = []
    g_score = {start: 0}
    f_score = {start: _manhattan(start, goal)}
    heappush(open_heap, (f_score[start], start))

    parent = {}
    visited_order = [[start[0], start[1]]]
    closed = set()

    while open_heap:
        _, node = heappop(open_heap)
        if node in closed:
            continue

        closed.add(node)
        if node == goal:
            elapsed = time.time() - start_time
            path = _reconstruct(parent, start, goal)
            return path, visited_order, elapsed

        for nb in _neighbors(grid, node):
            if nb in closed:
                continue

            tentative_g = g_score[node] + 1
            if tentative_g < g_score.get(nb, float('inf')):
                parent[nb] = node
                g_score[nb] = tentative_g
                f_score_nb = tentative_g + _manhattan(nb, goal)
                f_score[nb] = f_score_nb
                heappush(open_heap, (f_score_nb, nb))
                visited_order.append([nb[0], nb[1]])

    elapsed = time.time() - start_time
    return [], visited_order, elapsed
