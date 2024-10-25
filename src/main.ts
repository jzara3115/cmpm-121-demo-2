import "./style.css";

const APP_NAME = "BARELY STARTED?";
const app = document.querySelector<HTMLDivElement>("#app")!;

document.title = APP_NAME;
app.innerHTML = `
    <h1>${APP_NAME}</h1>
    <button id="clearButton">Clear</button>
    <button id="undoButton">Undo</button>
    <button id="redoButton">Redo</button>
`;

const canvas = document.createElement('canvas') as HTMLCanvasElement;
canvas.id = 'myCanvas';
canvas.width = 256;
canvas.height = 256;
app.appendChild(canvas);

const context = canvas.getContext('2d')!;
context.lineWidth = 2;
context.strokeStyle = 'black';

class MarkerLine {
    private points: { x: number, y: number }[] = [];

    constructor(x: number, y: number) {
        this.points.push({ x, y });
    }

    drag(x: number, y: number) {
        this.points.push({ x, y });
    }

    display(ctx: CanvasRenderingContext2D) {
        ctx.beginPath();
        for (let i = 0; i < this.points.length; i++) {
            const point = this.points[i];
            if (i === 0) {
                ctx.moveTo(point.x, point.y);
            } else {
                ctx.lineTo(point.x, point.y);
            }
        }
        ctx.stroke();
    }
}

let drawing = false;
let drawings: MarkerLine[] = [];
let redoStack: MarkerLine[] = [];
let currentDrawing: MarkerLine | null = null;

canvas.addEventListener('mousedown', (event) => {
    drawing = true;
    currentDrawing = new MarkerLine(event.offsetX, event.offsetY);
    drawings.push(currentDrawing);
    redoStack = []; // Clear redo stack on new drawing
    canvas.dispatchEvent(new Event('drawing-changed'));
});

canvas.addEventListener('mousemove', (event) => {
    if (drawing && currentDrawing) {
        currentDrawing.drag(event.offsetX, event.offsetY);
        canvas.dispatchEvent(new Event('drawing-changed'));
    }
});

canvas.addEventListener('mouseup', () => {
    drawing = false;
    currentDrawing = null;
});

canvas.addEventListener('mouseout', () => {
    drawing = false;
    currentDrawing = null;
});

canvas.addEventListener('drawing-changed', () => {
    context.clearRect(0, 0, canvas.width, canvas.height);
    for (const drawing of drawings) {
        drawing.display(context);
    }
});

const clearButton = document.getElementById('clearButton') as HTMLButtonElement;
clearButton.addEventListener('click', () => {
    drawings = [];
    redoStack = [];
    context.clearRect(0, 0, canvas.width, canvas.height);
});

const undoButton = document.getElementById('undoButton') as HTMLButtonElement;
undoButton.addEventListener('click', () => {
    if (drawings.length > 0) {
        const lastDrawing = drawings.pop()!;
        redoStack.push(lastDrawing);
        canvas.dispatchEvent(new Event('drawing-changed'));
    }
});

const redoButton = document.getElementById('redoButton') as HTMLButtonElement;
redoButton.addEventListener('click', () => {
    if (redoStack.length > 0) {
        const lastUndone = redoStack.pop()!;
        drawings.push(lastUndone);
        canvas.dispatchEvent(new Event('drawing-changed'));
    }
});

