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

## Steps

### Part 1: Basic Map Setup

- [x] copy main.ts to reference.ts for future reference
- [x] delete everything in main.ts
- [x] put a basic leaflet map on the screen
- [x] Center the map on a fixed location (e.g., the classroom) and set a fixed zoom level.
- [x] Disable map movement and zooming.
- [x] Draw the player's location on the map (e.g., a circle or marker).

### Part 2: Cell & Grid System

- [x] Define the grid system constants (e.g., cell size like `0.0001`, player interaction-radius).
- [ ] Create a data structure or class for a `Cell`, which can be identified by its coordinates (e.Sg., `i`, `j`).
- [x] Create a "deterministic " function (using the provided `luck` function) that takes cell coordinates (`i`, `j`) and decides if a token exists there (and its initial value, e.g., `1`). This ensures the map is consistent on every page load.
- [x] Write a function to draw a single cell (a Leaflet rectangle) on the map given its coordinates.
- [x] Use nested loops to draw a large grid of cells that covers the entire visible map area.
- [x] Modify the grid-drawing loop:
  - [x] Use the deterministic `luck` function to get the data for each cell.
  - [x] If a token exists in a cell, render its value (e.g., as text, a `L.divIcon`, or by coloring the cell).

### Part 3: Inventory & UI

- [ ] Create a variable to track the player's inventory (e.g., `inventoryToken: { value: number } | null`).
- [ ] Add a simple HTML element (e.g., a `<div>`) to the page to display the inventory status (e.g., "Holding: Empty" or "Holding: Token (Value 4)").
- [ ] Write a function `updateInventoryUI()` that updates this HTML element based on the `inventoryToken` variable.

### Part 4: Game Logic & Interaction

- [ ] Add a click listener to each cell rectangle.
- [ ] Inside the click handler, first check if the cell is within the player's interaction radius. If not, do nothing.
- [ ] **If the player's inventory is empty:**
  - [ ] On click, check if the cell contains a token.
    - [ ] If it does, move the token to the `inventoryToken` variable.
    - [ ] "Remove" the token from the cell (e.g., update the cell's data and visual).
    - [ ] Call `updateInventoryUI()`.
- [ ] **If the player's inventory is full:**
  - [ ] **Crafting Logic:** On click, check if the cell contains a token _of the same value_ as the inventory token.
        - [ ] If values match: "Remove" the token from the cell, double the value of the `inventoryToken`, and call `updateInventoryUI()`.
        - [ ] If values _do not_ match, do nothing.
    - [ ] **Placing Logic:** On click, check if the cell is _empty_.
      - [ ] If it's empty, move the token from `inventoryToken` to the cell (update cell data and visual).
      - [ ] Set `inventoryToken` to `null` and call `updateInventoryUI()`.

### Part 5: Win Condition

- [ ] Define a "win value" (e.g., `8` or `16`).
- [ ] After each successful craft, check if the `inventoryToken`'s value meets or exceeds the win value.
- [ ] If it does, show a "You Win!" message (e.g., using `alert()`).

## D3.b: Coming soon
