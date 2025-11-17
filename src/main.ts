// @deno-types="npm:@types/leaflet"
import leaflet from "leaflet";

// Style sheets
import "leaflet/dist/leaflet.css";
import "./style.css";

// Fixed missing marker images
import "./_leafletWorkaround.ts";

// Imported our luck function
import luck from "./_luck.ts";

// Created UI Elements
const controlPanelDiv = document.createElement("div");
controlPanelDiv.id = "controlPanel";
document.body.append(controlPanelDiv);

const mapDiv = document.createElement("div");
mapDiv.id = "map";
document.body.append(mapDiv);

// Status panel for inventory and game controls
const statusPanelDiv = document.createElement("div");
statusPanelDiv.id = "statusPanel";
statusPanelDiv.innerHTML = `
  <div id="inventoryStatus">Holding: Empty</div>
  <div id="gameControls">
    <button id="newGame">New Game</button>
    <button id="toggleMovement">Use GPS</button>
  </div>
`;
document.body.append(statusPanelDiv);

// Added movement buttons
controlPanelDiv.innerHTML = `
  <button id="north">N</button>
  <button id="south">S</button>
  <button id="west">W</button>
  <button id="east">E</button>
`;

// Game Constants
const CLASSROOM_LATLNG = leaflet.latLng(
  36.997936938057016,
  -122.05703507501151,
);
const GAMEPLAY_ZOOM_LEVEL = 19;
const TILE_DEGREES = 1e-4;
const TOKEN_SPAWN_PROBABILITY = 0.1;
const PLAYER_INTERACTION_RADIUS = 3;
const WIN_VALUE = 32;
const GAME_STATE_KEY = "d3_gameState";

// Type Definitions
type Token = {
  value: number;
};

type CellID = {
  i: number;
  j: number;
};

type CellData = {
  id: CellID;
  token: Token | null;
  rectangle: leaflet.Rectangle;
};

// Type for saving/loading game state
type GameState = {
  playerLatLng: leaflet.LatLngLiteral;
  inventoryToken: Token | null;
  persistentCellData: [string, Token | null][];
};

// Game State
let inventoryToken: Token | null = null;
const cellMap: Map<string, CellData> = new Map();
let playerLatLng = CLASSROOM_LATLNG.clone();
const persistentCellData: Map<string, Token | null> = new Map();

let movementMode: "buttons" | "geolocation";
let geolocationWatcherId: number | null = null;

// Game State Persistence

function saveGameState() {
  const state: GameState = {
    playerLatLng: { lat: playerLatLng.lat, lng: playerLatLng.lng },
    inventoryToken: inventoryToken,
    persistentCellData: Array.from(persistentCellData.entries()),
  };
  localStorage.setItem(GAME_STATE_KEY, JSON.stringify(state));
}

function loadGameState() {
  const savedState = localStorage.getItem(GAME_STATE_KEY);
  if (savedState) {
    try {
      const state: GameState = JSON.parse(savedState);
      playerLatLng = leaflet.latLng(
        state.playerLatLng.lat,
        state.playerLatLng.lng,
      );
      inventoryToken = state.inventoryToken;
      persistentCellData.clear();
      for (const [key, value] of state.persistentCellData) {
        persistentCellData.set(key, value);
      }
      console.log("Game state loaded.");
    } catch (e) {
      console.error("Failed to load game state, starting fresh:", e);
      localStorage.removeItem(GAME_STATE_KEY);
    }
  } else {
    console.log("No saved state found, starting new game.");
  }
}

// Loads state before map initialization
loadGameState();

// Map Initialization
const map = leaflet.map(mapDiv, {
  center: playerLatLng,
  zoom: GAMEPLAY_ZOOM_LEVEL,
});

leaflet
  .tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution:
      '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  })
  .addTo(map);

// Player Marker
const playerMarker = leaflet.marker(playerLatLng);
playerMarker.bindTooltip("That's you!");
playerMarker.addTo(map);

// Coordinate Functions
function latLngToCell(latLng: leaflet.LatLng): CellID {
  const i = Math.floor(latLng.lat / TILE_DEGREES);
  const j = Math.floor(latLng.lng / TILE_DEGREES);
  return { i, j };
}

function cellToBounds(id: CellID): leaflet.LatLngBounds {
  const { i, j } = id;
  const north = (i + 1) * TILE_DEGREES;
  const south = i * TILE_DEGREES;
  const east = (j + 1) * TILE_DEGREES;
  const west = j * TILE_DEGREES;
  return leaflet.latLngBounds([
    [south, west],
    [north, east],
  ]);
}

// Cell Visuals
function updateCellVisuals(cell: CellData) {
  const { token, rectangle } = cell;

  const cellOptions: leaflet.PathOptions = {
    fillOpacity: 0.1,
    weight: 0.5,
  };

  if (token) {
    cellOptions.color = "blue";
    cellOptions.fillOpacity = 0.3;
    rectangle.bindTooltip(`Token (Value: ${token.value})`);
  } else {
    cellOptions.color = "grey";
    rectangle.unbindTooltip();
  }
  rectangle.setStyle(cellOptions);
}

// Dynamic Grid Drawing
function drawVisibleCells() {
  for (const cell of cellMap.values()) {
    cell.rectangle.remove();
  }
  cellMap.clear();

  const bounds = map.getBounds();
  const northEast = bounds.getNorthEast();
  const southWest = bounds.getSouthWest();

  const minCell = latLngToCell(southWest);
  const maxCell = latLngToCell(northEast);

  for (let i = minCell.i; i <= maxCell.i; i++) {
    for (let j = minCell.j; j <= maxCell.j; j++) {
      const id: CellID = { i, j };
      const key = `${i},${j}`;
      const bounds = cellToBounds(id);

      let currentToken: Token | null;
      if (persistentCellData.has(key)) {
        currentToken = persistentCellData.get(key)!;
      } else {
        const hasToken = luck([i, j].toString()) < TOKEN_SPAWN_PROBABILITY;
        currentToken = hasToken ? { value: 1 } : null;
      }

      const rectangle = leaflet.rectangle(bounds, {
        color: "grey",
        fillOpacity: 0.1,
        weight: 0.5,
      });

      const cellData: CellData = {
        id: id,
        token: currentToken,
        rectangle: rectangle,
      };

      cellMap.set(key, cellData);
      updateCellVisuals(cellData);
      rectangle.addTo(map);

      rectangle.on("click", () => {
        const playerCell = latLngToCell(playerLatLng);
        const distance = Math.max(
          Math.abs(i - playerCell.i),
          Math.abs(j - playerCell.j),
        );

        if (distance > PLAYER_INTERACTION_RADIUS) {
          console.log("Cell is too far away!");
          return;
        }

        // GAME LOGIC
        if (inventoryToken === null) {
          if (cellData.token) {
            inventoryToken = cellData.token;
            cellData.token = null;
          }
        } else {
          // Craft or Place
          if (cellData.token) {
            if (cellData.token.value === inventoryToken.value) {
              inventoryToken.value *= 2;
              cellData.token = null;

              if (inventoryToken.value >= WIN_VALUE) {
                alert(
                  "You Win! You crafted a token of value " +
                    inventoryToken.value,
                );
              }
            }
          } else {
            cellData.token = inventoryToken;
            inventoryToken = null;
          }
        }

        persistentCellData.set(key, cellData.token);

        updateCellVisuals(cellData);
        updateInventoryUI();
        saveGameState();
      });
    }
  }
}

map.on("moveend", drawVisibleCells);

// Player Movement Facade
// The facade function: updates state, UI, and saves.
function setPlayerPosition(newPos: leaflet.LatLng) {
  playerLatLng.lat = newPos.lat;
  playerLatLng.lng = newPos.lng;
  playerMarker.setLatLng(playerLatLng);
  map.panTo(playerLatLng);
  saveGameState();
}

// Function for button-based movement
function movePlayerBy(latDelta: number, lngDelta: number) {
  const newPos = playerLatLng.clone();
  newPos.lat += latDelta;
  newPos.lng += lngDelta;
  setPlayerPosition(newPos);
}

// Geolocation callback
function onGeolocationSuccess(position: GeolocationPosition) {
  const { latitude, longitude } = position.coords;
  const newPos = leaflet.latLng(latitude, longitude);
  setPlayerPosition(newPos);
  console.log("Geolocation update:", newPos);
}

// Geolocation error callback
function onGeolocationError(error: GeolocationPositionError) {
  console.error("Geolocation error:", error.message);
  alert(`Geolocation error: ${error.message}. Reverting to button controls.`);
  setMovementMode("buttons");
}

// Main function to switch modes
function setMovementMode(mode: "buttons" | "geolocation") {
  movementMode = mode;
  const toggleButton = document.getElementById("toggleMovement")!;

  if (mode === "geolocation") {
    controlPanelDiv.style.display = "none";
    toggleButton.innerHTML = "Use Buttons";

    if (geolocationWatcherId === null) {
      geolocationWatcherId = navigator.geolocation.watchPosition(
        onGeolocationSuccess,
        onGeolocationError,
        { enableHighAccuracy: true },
      );
    }
  } else {
    // Mode is "buttons"
    controlPanelDiv.style.display = "block";
    toggleButton.innerHTML = "Use GPS";

    if (geolocationWatcherId !== null) {
      navigator.geolocation.clearWatch(geolocationWatcherId);
      geolocationWatcherId = null;
    }
  }
}

// Event Listeners for Button-based movement
const northButton = document.getElementById("north")!;
const southButton = document.getElementById("south")!;
const westButton = document.getElementById("west")!;
const eastButton = document.getElementById("east")!;

northButton.addEventListener("click", () => {
  movePlayerBy(TILE_DEGREES, 0);
});
southButton.addEventListener("click", () => {
  movePlayerBy(-TILE_DEGREES, 0);
});
westButton.addEventListener("click", () => {
  movePlayerBy(0, -TILE_DEGREES);
});
eastButton.addEventListener("click", () => {
  movePlayerBy(0, TILE_DEGREES);
});

// Game control buttons
const newGameButton = document.getElementById("newGame")!;
const toggleMovementButton = document.getElementById("toggleMovement")!;

newGameButton.addEventListener("click", () => {
  if (
    confirm(
      "Are you sure you want to start a new game? All progress will be lost.",
    )
  ) {
    localStorage.removeItem(GAME_STATE_KEY);
    location.reload();
  }
});

toggleMovementButton.addEventListener("click", () => {
  const newMode = movementMode === "buttons" ? "geolocation" : "buttons";
  setMovementMode(newMode);
});

// UI
function updateInventoryUI() {
  const inventoryStatusEl = document.getElementById("inventoryStatus")!;
  if (inventoryToken) {
    inventoryStatusEl.innerHTML =
      `Holding: Token (Value: ${inventoryToken.value})`;
  } else {
    inventoryStatusEl.innerHTML = "Holding: Empty";
  }
}

// Initial Load
// Set initial movement mode from URL
const urlParams = new URLSearchParams(globalThis.location.search);
const initialMode = urlParams.get("movement") === "geolocation"
  ? "geolocation"
  : "buttons";
setMovementMode(initialMode);

// Initial UI and map draw
updateInventoryUI();
drawVisibleCells();
