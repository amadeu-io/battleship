import "../styles/reset.css";
import "../styles/style.css";

import { Name, Orientation, Ship } from "./modules/ship";
import { Gameboard, Cell } from "./modules/gameboard";

// Create a 10x10 gameboard
function createBoard(gameboard: HTMLElement) {
  for (let row = 0; row < 10; row++) {
    for (let col = 0; col < 10; col++) {
      // Create div
      const gridItem = document.createElement("div");
      gridItem.className = "grid-item";

      // Set the id of the div to be its coordinates
      const coordinates: [number, number] = [col, row];
      gridItem.id = JSON.stringify(coordinates);

      gameboard.appendChild(gridItem);
    }
  }
}

// Render a ship object on a gameboard
function renderShip(ship: Ship, gameboard: HTMLElement) {
  const [x, y] = ship.position;

  // Remove existing ship with the same name
  const existingShip = document.querySelector(`.${ship.name}`);
  if (existingShip) {
    existingShip.remove();
  }

  // Create ship div
  const shipDiv = document.createElement("div");
  shipDiv.classList.add(ship.name);
  shipDiv.setAttribute("draggable", "true");
  gameboard.appendChild(shipDiv);

  // Find pixel coordinates of ship
  const cellSize = 50; // px
  const topValue = `${y * cellSize}px`;
  const leftValue = `${x * cellSize}px`;

  // Add dimensions to ship
  if (ship.orientation === "Horizontal") {
    shipDiv.style.width = `${ship.length * cellSize}px`;
    shipDiv.style.height = `${cellSize}px`;
  } else {
    shipDiv.style.width = `${cellSize}px`;
    shipDiv.style.height = `${ship.length * cellSize}px`;
  }

  // Position ship
  shipDiv.style.top = topValue;
  shipDiv.style.left = leftValue;
}

function renderBoard(board: Cell[][], gameboardHTML: HTMLElement): void {
  // Flattens the board matrix column-wise
  const transposedBoard = board[0].map((_, i) => board.map((row) => row[i]));
  const boardList = transposedBoard.flat();

  // Select html grid items inside specified gameboard
  var htmlCells = gameboardHTML.getElementsByClassName("grid-item");

  // Iterate through board list, add 🔥 to the corresponding html divs
  boardList.forEach((objCell, index) => {
    if (objCell.hit && objCell.ship) {
      htmlCells[index].textContent = "🔥";
    }
  });
}

// Program starts

// Create data

const playerGameboardObj = new Gameboard();

const destroyer = new Ship(Name.Destroyer, [5, 5], Orientation.Horizontal);
const carrier = new Ship(Name.Carrier, [3, 3], Orientation.Vertical);
const battleship = new Ship(Name.Battleship, [0, 2], Orientation.Vertical);
const cruiser = new Ship(Name.Cruiser, [7, 9], Orientation.Horizontal);

playerGameboardObj.placeShip(destroyer);
playerGameboardObj.placeShip(carrier);
playerGameboardObj.placeShip(battleship);
playerGameboardObj.placeShip(cruiser);

playerGameboardObj.createAttack([5, 5]);
playerGameboardObj.createAttack([3, 3]);
playerGameboardObj.createAttack([0, 2]);
playerGameboardObj.createAttack([7, 9]);

// Create HTML board

const playerGameboardHTML = document.querySelector(".gameboard") as HTMLElement;
createBoard(playerGameboardHTML);

// Render board

renderBoard(playerGameboardObj.board, playerGameboardHTML);

// Render ships

playerGameboardObj.ships.forEach((ship) => renderShip(ship, playerGameboardHTML));

// Drag & Drop functionality

document.addEventListener("dragstart", (event: DragEvent) => {
  // Get the dragged ship
  const draggedShip = (event.target as HTMLElement).className;
  if (event.dataTransfer) {
    event.dataTransfer.setData("text/plain", draggedShip);
  }
});

document.addEventListener("dragover", (event: DragEvent) => {
  event.preventDefault();
});

// Find the ship and coordinates in which it has been droped
// Update the gameboard
// Render the updated ship
document.addEventListener("drop", (event: DragEvent) => {
  event.preventDefault();

  // Get the ship that has been dropped
  if (event.dataTransfer) {
    const droppedClass = event.dataTransfer.getData("text/plain");
    const droppedShip = playerGameboardObj.ships.find((ship) => ship.name === droppedClass);

    if (droppedShip) {
      // Find the position in which the ship has been dropped
      const dropCell = (event.target as HTMLElement).closest(".grid-item");

      if (dropCell) {
        // Update the gameboard with the new position
        const [x, y] = JSON.parse(dropCell.id);
        playerGameboardObj.moveShip(droppedShip, [x, y]);

        // Render updated ship
        renderShip(droppedShip, playerGameboardHTML);
      }
    }
  }
});
