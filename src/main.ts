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
const mapDiv = document.createElement("div");
mapDiv.id = "map";
document.body.append(mapDiv);

// New status panel for inventory
const statusPanelDiv = document.createElement("div");
statusPanelDiv.id = "statusPanel";
document.body.append(statusPanelDiv);

// Game Constants
const CLASSROOM_LATLNG = leaflet.latLng(
  36.997936938057016,
  -122.05703507501151,
);
const GAMEPLAY_ZOOM_LEVEL = 19;
const TILE_DEGREES = 1e-4;
const GRID_SIZE = 20;
const TOKEN_SPAWN_PROBABILITY = 0.1;

// Map Initialization
const map = leaflet.map(mapDiv, {
  center: CLASSROOM_LATLNG,
  zoom: GAMEPLAY_ZOOM_LEVEL,
  minZoom: GAMEPLAY_ZOOM_LEVEL,
  maxZoom: GAMEPLAY_ZOOM_LEVEL,
  zoomControl: false,
  scrollWheelZoom: false,
  dragging: false,
  touchZoom: false,
  doubleClickZoom: false,
});

// Populates the map with a background tile layer
leaflet
  .tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution:
      '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  })
  .addTo(map);

// Added Player Marker
const playerMarker = leaflet.marker(CLASSROOM_LATLNG);
playerMarker.bindTooltip("That's you!");
playerMarker.addTo(map);

// Function to get the bounds of a cell
function getCellBounds(i: number, j: number): leaflet.LatLngBounds {
  const origin = CLASSROOM_LATLNG;
  const bounds = leaflet.latLngBounds([
    [origin.lat + i * TILE_DEGREES, origin.lng + j * TILE_DEGREES],
    [origin.lat + (i + 1) * TILE_DEGREES, origin.lng + (j + 1) * TILE_DEGREES],
  ]);
  return bounds;
}

// Loop to draw the grid
for (let i = -GRID_SIZE; i < GRID_SIZE; i++) {
  for (let j = -GRID_SIZE; j < GRID_SIZE; j++) {
    const hasToken = luck([i, j].toString()) < TOKEN_SPAWN_PROBABILITY;

    // Defines the cell's appearance
    const cellOptions: leaflet.PathOptions = {
      fillOpacity: 0.1,
      weight: 0.5,
    };

    if (hasToken) {
      cellOptions.color = "blue";
      cellOptions.fillOpacity = 0.3;
    } else {
      cellOptions.color = "grey";
    }

    // Creates the rectangle for the cell
    const bounds = getCellBounds(i, j);
    const rect = leaflet.rectangle(bounds, cellOptions);

    if (hasToken) {
      const tokenValue = 1;
      rect.bindTooltip(`Token (Value: ${tokenValue})`);
    }

    rect.addTo(map);
  }
}

// Inventory
type Token = {
  value: number;
};

const inventoryToken: Token | null = null;

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
