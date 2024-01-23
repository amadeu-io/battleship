import { Orientation, Ship } from "./ship";
import { Player, Role } from "./player";
import interact from "interactjs";

export class PlayerRenderer {
  player: Player;
  boardContainer: HTMLElement;
  cellSize: number;

  constructor(player: Player) {
    this.player = player;
    this.boardContainer = document.querySelector("." + this.player.role) as HTMLElement;
    this.cellSize = 47;
  }

  createBoard() {
    for (let row = 9; row >= 0; row--) {
      for (let col = 0; col < 10; col++) {
        let boardCell = new Image();
        boardCell.src = "images/tile.png";
        boardCell.className = this.player.role + "-cell";

        const coordinates = [col, row];
        boardCell.id = JSON.stringify(coordinates);

        this.boardContainer.appendChild(boardCell);
      }
    }
  }

  // Takes player.board list and renders it on screen
  renderAttacks() {
    var htmlCells = this.boardContainer.getElementsByClassName(this.player.role + "-cell");

    /* 
    Alternative idea to transform coords:
    for (var row = 9; row >= 0; row--) {
      // Iterate through columns from left to right
      for (var col = 0; col <= 9; col++) {
        // Calculate the index based on the row and column
        var i = row * 10 + col;

        var divElement = htmlCells[i];
        console.log(divElement.id);
      }
    }

    Or, alternative formula to transform coords:
    const j = (i % 10) + (9 - Math.floor(i / 10)) * 10;
    */

    // Restore blank cells
    for (var i = 0; i < htmlCells.length; i++) {
      var cell = htmlCells[i] as HTMLImageElement;
      cell.src = "images/tile.png";

      if (this.player.role === Role.Opponent) {
        cell.classList.remove("default-cursor");
        cell.classList.remove("reveal-cell");
      }
    }

    // Render player attacks on board
    if (this.player.role === Role.Player) {
      for (let i = 0; i < this.player.board.length; i++) {
        const htmlCell = htmlCells[i] as HTMLImageElement;
        const [x, y] = JSON.parse(htmlCell.id);
        const j = x + 10 * y; // transform coords

        const objCell = this.player.board[j];

        if (objCell.hit) {
          htmlCell.src = "images/tile_green.png";
          if (objCell.ship) {
            htmlCell.src = "images/tile_red.png";
            htmlCell.textContent = "🔥";
          }
        }
      }
    }

    // Render opponent attacks on board
    if (this.player.role === Role.Opponent) {
      for (let i = 0; i < this.player.board.length; i++) {
        const htmlCell = htmlCells[i] as HTMLImageElement;
        const [x, y] = JSON.parse(htmlCell.id);
        const j = x + 10 * y; // transform coords

        const objCell = this.player.board[j];

        if (objCell.hit) {
          htmlCell.src = "images/tile_green.png";
          htmlCell.classList.add("default-cursor");
          htmlCell.classList.add("reveal-cell");
          if (objCell.ship) {
            htmlCell.src = "images/tile_red.png";
            htmlCell.textContent = "🔥";
          }
        }
      }
    }
  }

  renderShip(ship: Ship) {
    const [x, y] = ship.position;

    // Remove existing ship with the same name
    const existingShip = this.boardContainer.querySelector(`.${ship.name}`);
    if (existingShip) {
      existingShip.remove();
    }

    // Create ship div
    let shipImg = new Image();
    shipImg.src = `images/${ship.name}.png`;
    shipImg.classList.add(ship.name, "ship");
    shipImg.draggable = false; // uses interact.js instead
    this.addInteract(shipImg);
    this.boardContainer.appendChild(shipImg);

    // Render dimensions
    shipImg.width = this.cellSize;
    shipImg.height = ship.length * this.cellSize;
    shipImg.style.transform = `translate(0px, 0px) rotate(${ship.orientation}deg)`;

    // Find pixel coordinates of ship
    const bottomValue = `${y * this.cellSize}px`;
    const leftValue = `${x * this.cellSize - 3}px`; // -3 offsets non symetrical image

    // Position ship
    shipImg.style.bottom = bottomValue;
    shipImg.style.left = leftValue;
  }

  addInteract(element: HTMLElement): void {
    var x = 0;
    var y = 0;

    const draggedShipName = element.classList.item(0) as string;
    const draggedShipObj = this.player.findShipByName(draggedShipName) as Ship;

    interact(element)
      .draggable({
        inertia: true,
        modifiers: [
          interact.modifiers.restrictRect({
            restriction: "parent",
            endOnly: true,
          }),
        ],
        autoScroll: true,

        listeners: {
          move: (event) => {
            element.classList.remove("transition");

            x += event.dx;
            y += event.dy;

            event.target.style.transform = `translate(${x}px, ${y}px) rotate(${draggedShipObj.orientation}deg)`;
          },

          end: (event) => {
            const stackingElements = document.elementsFromPoint(event.clientX, event.clientY);

            // Mouse grab position relative to ship
            var divRect = element.getBoundingClientRect();
            var xDelta = Math.floor((event.clientX - divRect.left) / this.cellSize);
            var yDelta = Math.floor((divRect.bottom - event.clientY) / this.cellSize);

            var dropCell = stackingElements[1] as HTMLElement;

            // Edge case: Placement on top of an existing ship
            if (!dropCell.id) {
              dropCell = stackingElements[2] as HTMLElement;
            }

            const [x, y] = JSON.parse(dropCell.id);

            this.player.moveToClosestValidPosition(draggedShipObj, [x - xDelta, y - yDelta]);
            this.renderShips();

            console.log(draggedShipObj.coordinates);
          },
        },
      })

      .on("tap", (event) => {
        element.classList.add("transition");

        this.player.switchShipOrientation(draggedShipObj);
        event.target.style.transform = `translate(0px, 0px) rotate(${draggedShipObj.orientation}deg)`;

        // Wait for the transition effect
        setTimeout(() => {
          this.player.moveToClosestValidPosition(draggedShipObj, draggedShipObj.position);
          this.renderShips();
        }, 300);
      });
  }

  removeInteract(element: HTMLElement): void {
    interact(element).unset();
  }

  addInteractToAll() {
    this.getHTMLShips().forEach((HTMLShip) => {
      this.addInteract(HTMLShip);
    });
  }

  removeInteractToAll() {
    this.getHTMLShips().forEach((HTMLShip) => {
      this.removeInteract(HTMLShip);
    });
  }

  renderShips() {
    this.player.ships.forEach((ship) => this.renderShip(ship));
  }

  clearShips() {
    this.getHTMLShips().forEach((HTMLShip) => {
      HTMLShip.remove();
    });
  }

  private getHTMLShips(): NodeListOf<HTMLDivElement> {
    return this.boardContainer.querySelectorAll(".ship");
  }
}
