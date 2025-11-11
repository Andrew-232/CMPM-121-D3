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

// Status panel for inventory
const statusPanelDiv = document.createElement("div");
statusPanelDiv.id = "statusPanel";
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
const GRID_SIZE = 20;
const TOKEN_SPAWN_PROBABILITY = 0.1;
const PLAYER_INTERACTION_RADIUS = 3;

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

// Game State
let inventoryToken: Token | null = null;
const cellMap: Map<string, CellData> = new Map();
const playerLatLng = CLASSROOM_LATLNG.clone();

// Map Initialization
const map = leaflet.map(mapDiv, {
  center: playerLatLng,
  zoom: GAMEPLAY_ZOOM_LEVEL,
});

// Populates the map with a background tile layer
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

function _latLngToCell(latLng: leaflet.LatLng): CellID {
  const i = Math.floor(latLng.lat / TILE_DEGREES);
  const j = Math.floor(latLng.lng / TILE_DEGREES);
  return { i, j };
}

function _cellToBounds(id: CellID): leaflet.LatLngBounds {
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

for (let i = -GRID_SIZE; i < GRID_SIZE; i++) {
  for (let j = -GRID_SIZE; j < GRID_SIZE; j++) {
    const tempOrigin = CLASSROOM_LATLNG;
    const bounds = leaflet.latLngBounds([
      [tempOrigin.lat + i * TILE_DEGREES, tempOrigin.lng + j * TILE_DEGREES],
      [
        tempOrigin.lat + (i + 1) * TILE_DEGREES,
        tempOrigin.lng + (j + 1) * TILE_DEGREES,
      ],
    ]);

    const rectangle = leaflet.rectangle(bounds, {
      color: "grey",
      fillOpacity: 0.1,
      weight: 0.5,
    });

    const hasToken = luck([i, j].toString()) < TOKEN_SPAWN_PROBABILITY;

    const cellData: CellData = {
      id: { i, j },
      token: hasToken ? { value: 1 } : null,
      rectangle: rectangle,
    };

    const key = `${i},${j}`;
    cellMap.set(key, cellData);
    updateCellVisuals(cellData);
    rectangle.addTo(map);

    rectangle.on("click", () => {
      const distance = Math.max(Math.abs(i), Math.abs(j));
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
          }
        } else {
          cellData.token = inventoryToken;
          inventoryToken = null;
        }
      }

      // Updates both the cell and inventory after any action
      updateCellVisuals(cellData);
      updateInventoryUI();
    });
  }
}

// UI
function updateInventoryUI() {
  if (inventoryToken) {
    statusPanelDiv.innerHTML =
      `Holding: Token (Value: ${inventoryToken.value})`;
  } else {
    statusPanelDiv.innerHTML = "Holding: Empty";
  }
}

// Initializes UI
updateInventoryUI();
