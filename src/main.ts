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

let drawing = false;
let drawings: { x: number, y: number }[][] = [];
let redoStack: { x: number, y: number }[][] = [];
let currentDrawing: { x: number, y: number }[] = [];

canvas.addEventListener('mousedown', (event) => {
    drawing = true;
    currentDrawing = [{ x: event.offsetX, y: event.offsetY }];
    drawings.push(currentDrawing);
    redoStack = []; // Clear redo stack on new drawing
    canvas.dispatchEvent(new Event('drawing-changed'));
});

canvas.addEventListener('mousemove', (event) => {
    if (drawing) {
        currentDrawing.push({ x: event.offsetX, y: event.offsetY });
        canvas.dispatchEvent(new Event('drawing-changed'));
    }
});

canvas.addEventListener('mouseup', () => {
    drawing = false;
});

canvas.addEventListener('mouseout', () => {
    drawing = false;
});

canvas.addEventListener('drawing-changed', () => {
    context.clearRect(0, 0, canvas.width, canvas.height);
    for (const drawing of drawings) {
        context.beginPath();
        for (let i = 0; i < drawing.length; i++) {
            const point = drawing[i];
            if (i === 0) {
                context.moveTo(point.x, point.y);
            } else {
                context.lineTo(point.x, point.y);
            }
        }
        context.stroke();
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

