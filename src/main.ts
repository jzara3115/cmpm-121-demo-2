import "./style.css";

const APP_NAME = "BARELY STARTED?";
const app = document.querySelector<HTMLDivElement>("#app")!;

document.title = APP_NAME;
app.innerHTML = `
    <h1>${APP_NAME}</h1>
    <button id="clearButton">Clear</button>
    <button id="undoButton">Undo</button>
    <button id="redoButton">Redo</button>
    <button id="thinButton">Thin</button>
    <button id="thickButton">Thick</button>
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
    private thickness: number;

    constructor(x: number, y: number, thickness: number) {
        this.points.push({ x, y });
        this.thickness = thickness;
    }

    drag(x: number, y: number) {
        this.points.push({ x, y });
    }

    display(ctx: CanvasRenderingContext2D) {
        ctx.lineWidth = this.thickness;
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

class ToolPreview {
    private x: number;
    private y: number;
    private thickness: number;

    constructor(x: number, y: number, thickness: number) {
        this.x = x;
        this.y = y;
        this.thickness = thickness;
    }

    updatePosition(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    draw(ctx: CanvasRenderingContext2D) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.thickness / 2, 0, Math.PI * 2);
        ctx.stroke();
    }
}

let drawing = false;
let drawings: MarkerLine[] = [];
let redoStack: MarkerLine[] = [];
let currentDrawing: MarkerLine | null = null;
let currentThickness = 2;
let toolPreview: ToolPreview | null = null;

canvas.addEventListener('mousedown', (event) => {
    drawing = true;
    currentDrawing = new MarkerLine(event.offsetX, event.offsetY, currentThickness);
    drawings.push(currentDrawing);
    redoStack = []; // Clear redo stack on new drawing
    toolPreview = null; // Hide tool preview while drawing
    canvas.dispatchEvent(new Event('drawing-changed'));
});

canvas.addEventListener('mousemove', (event) => {
    if (drawing && currentDrawing) {
        currentDrawing.drag(event.offsetX, event.offsetY);
        canvas.dispatchEvent(new Event('drawing-changed'));
    } else {
        if (!toolPreview) {
            toolPreview = new ToolPreview(event.offsetX, event.offsetY, currentThickness);
        } else {
            toolPreview.updatePosition(event.offsetX, event.offsetY);
        }
        canvas.dispatchEvent(new Event('tool-moved'));
    }
});

canvas.addEventListener('mouseup', () => {
    drawing = false;
    currentDrawing = null;
});

canvas.addEventListener('mouseout', () => {
    drawing = false;
    currentDrawing = null;
    toolPreview = null; // Hide tool preview when mouse leaves canvas
});

canvas.addEventListener('drawing-changed', () => {
    context.clearRect(0, 0, canvas.width, canvas.height);
    for (const drawing of drawings) {
        drawing.display(context);
    }
});

canvas.addEventListener('tool-moved', () => {
    context.clearRect(0, 0, canvas.width, canvas.height);
    for (const drawing of drawings) {
        drawing.display(context);
    }
    if (toolPreview && !drawing) {
        toolPreview.draw(context);
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

const thinButton = document.getElementById('thinButton') as HTMLButtonElement;
const thickButton = document.getElementById('thickButton') as HTMLButtonElement;

thinButton.addEventListener('click', () => {
    currentThickness = 2;
    thinButton.classList.add('selectedTool');
    thickButton.classList.remove('selectedTool');
});

thickButton.addEventListener('click', () => {
    currentThickness = 5;
    thickButton.classList.add('selectedTool');
    thinButton.classList.remove('selectedTool');
});

