# D3: Game Name (Will come up with later!)

## Game Design Vision

{Game (Will change when I have a better idea of how I want to personalize my game!).}

## Technologies

- TypeScript for most game code, little to no explicit HTML, and all CSS collected in common `style.css` file
- Deno and Vite for building
- GitHub Actions + GitHub Pages for deployment automation

## Assignments

## D3.a: Core mechanics (token collection and crafting)

Key technical challenge: Can you assemble a map-based user interface using the Leaflet mapping framework?
Key gameplay challenge: Can players collect and craft tokens from nearby locations to finally make one of sufficiently high value?

## D3.a Steps

### Part 1: Basic Map Setup

- [x] copy main.ts to reference.ts for future reference
- [x] delete everything in main.ts
- [x] put a basic leaflet map on the screen
- [x] Center the map on a fixed location (e.g., the classroom) and set a fixed zoom level.
- [x] Disable map movement and zooming.
- [x] Draw the player's location on the map (e.g., a circle or marker).

### Part 2: Cell & Grid System

- [x] Define the grid system constants (e.g., cell size like `0.0001`, player interaction-radius).
- [x] Create a data structure or class for a `Cell`, which can be identified by its coordinates (e.Sg., `i`, `j`).
- [x] Create a "deterministic " function (using the provided `luck` function) that takes cell coordinates (`i`, `j`) and decides if a token exists there (and its initial value, e.g., `1`). This ensures the map is consistent on every page load.
- [x] Write a function to draw a single cell (a Leaflet rectangle) on the map given its coordinates.
- [x] Use nested loops to draw a large grid of cells that covers the entire visible map area.
- [x] Modify the grid-drawing loop:
  - [x] Use the deterministic `luck` function to get the data for each cell.
  - [x] If a token exists in a cell, render its value (e.g., as text, a `L.divIcon`, or by coloring the cell).

### Part 3: Inventory & UI

- [x] Create a variable to track the player's inventory (e.g., `inventoryToken: { value: number } | null`).
- [x] Add a simple HTML element (e.g., a `<div>`) to the page to display the inventory status (e.g., "Holding: Empty" or "Holding: Token (Value 4)").
- [x] Write a function `updateInventoryUI()` that updates this HTML element based on the `inventoryToken` variable.

### Part 4: Game Logic & Interaction

- [x] Add a click listener to each cell rectangle.
- [x] Inside the click handler, first check if the cell is within the player's interaction radius. If not, do nothing.
- [x] **If the player's inventory is empty:**
  - [x] On click, check if the cell contains a token.
    - [x] If it does, move the token to the `inventoryToken` variable.
    - [x] "Remove" the token from the cell (e.g., update the cell's data and visual).
    - [x] Call `updateInventoryUI()`.
- [x] **If the player's inventory is full:**
  - [x] **Crafting Logic:** On click, check if the cell contains a token _of the same value_ as the inventory token.
        - [x] If values match: "Remove" the token from the cell, double the value of the `inventoryToken`, and call `updateInventoryUI()`.
        - [x] If values _do not_ match, do nothing.
    - [x] **Placing Logic:** On click, check if the cell is _empty_.
      - [x] If it's empty, move the token from `inventoryToken` to the cell (update cell data and visual).
      - [x] Set `inventoryToken` to `null` and call `updateInventoryUI()`.

## D3.b: Globe-spanning Gameplay

Key technical challenge: Can you refactor the grid system to be earth-spanning and dynamically drawn as the map moves?
Key gameplay challenge: Can the player "farm" tokens by moving around, taking advantage of the "memoryless" cells?

## D3.b Steps

### Part 1: Refactor to an Absolute, Earth-Spanning Grid

- [x] Unlock the map by removing `dragging`, `zoom`, etc., options from the `map` initialization.
- [x] Create a `controlPanel` div and add four buttons (North, South, East, West) for player movement.
- [x] Refactor the player's position from a `const` to a `let` variable (e.g., `let playerLatLng`) so it can be updated.
- [x] Create a function `latLngToCell(latLng)` that converts any Lat/Lng to an absolute `(i, j)` grid coordinate (anchored at 0,0).
- [x] Create a function `cellToBounds(i, j)` that converts an absolute `(i, j)` coordinate back into `LatLngBounds`.
- [x] Delete the old `getCellBounds` function.

### Part 2: Dynamic Grid Drawing

- [ ] Create a new main function `drawVisibleCells()`.
- [ ] This function will:
  - [ ] Get the map's current view bounds (`map.getBounds()`).
  - [ ] Use `latLngToCell` to calculate the *range_ of `(i, j)` cells to draw.
  - [ ] **Crucially:** Clear all old rectangles from the map and clear the `cellMap`. This makes the cells "memoryless."
  - [ ] Loop over the visible `(i, j)` range and (re)draw all cells, reusing the `luck` function and `updateCellVisuals`.
- [ ] Delete the old, static `for` loop that drew the grid.
- [ ] Call `drawVisibleCells()` once at startup.
- [ ] Add a Leaflet event listener (`map.on('moveend', ...)` ) that calls `drawVisibleCells()` every time the map stops moving.

### Part 3: Implement Player Movement & Win Condition

- [ ] Define a new, higher `WIN_VALUE` (e.g., 32 or 64) in `Game Constants`.
- [ ] Add click handlers to the N/S/E/W buttons.
- [ ] When a button is clicked (e.g., "North"):
  - [ ] Update the `playerLatLng` variable (e.g., `playerLatLng.lat += TILE_DEGREES`).
  - [ ] Move the `playerMarker` to the new location (`playerMarker.setLatLng(...)`).
  - [ ] Center the map on the player's new location (`map.panTo(...)`).
- [ ] **Refactor Click Logic:** The click logic for interaction is now broken.
  - [ ] Inside the cell's `on("click")` handler, get the player's current cell `(player_i, player_j)` using `latLngToCell(playerLatLng)`.
  - [ ] Calculate distance relative to the player: `Math.max(Math.abs(i - player_i), Math.abs(j - player_j))`.
  - [ ] Use *this_ new distance to check against `PLAYER_INTERACTION_RADIUS`.
  - [ ] Add the win condition check (`if (inventoryToken.value >= WIN_VALUE)`) after a successful craft.

### D3.c Coming Soon
