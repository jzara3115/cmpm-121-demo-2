import "./style.css";

const APP_NAME = "BARELY STARTED?";
const app = document.querySelector<HTMLDivElement>("#app")!;

document.title = APP_NAME;
app.innerHTML = `
    <h1>${APP_NAME}</h1>
    <div id="canvasContainer">
        <canvas id="myCanvas" width="256" height="256"></canvas>
    </div>
    <div id="buttonContainer">
        <button id="clearButton">Clear</button>
        <button id="undoButton">Undo</button>
        <button id="redoButton">Redo</button>
        <button id="thinButton">Thin</button>
        <button id="thickButton">Thick</button>
        <div id="stickerButtons"></div>
        <button id="customStickerButton">Custom Sticker</button>
        <button id="exportButton">Export</button>
    </div>
`;

const canvas = document.getElementById('myCanvas') as HTMLCanvasElement;
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

class StickerPreview {
    private x: number;
    private y: number;
    private sticker: string;

    constructor(x: number, y: number, sticker: string) {
        this.x = x;
        this.y = y;
        this.sticker = sticker;
    }

    updatePosition(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    draw(ctx: CanvasRenderingContext2D) {
        ctx.font = '24px Arial';
        ctx.fillText(this.sticker, this.x, this.y);
    }
}

class Sticker {
    private x: number;
    private y: number;
    private sticker: string;

    constructor(x: number, y: number, sticker: string) {
        this.x = x;
        this.y = y;
        this.sticker = sticker;
    }

    drag(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    display(ctx: CanvasRenderingContext2D) {
        ctx.font = '24px Arial';
        ctx.fillText(this.sticker, this.x, this.y);
    }
}

let isDrawing = false;
let markerLines: MarkerLine[] = [];
let stickers: Sticker[] = [];
let redoStack: (MarkerLine | Sticker)[] = [];
let currentMarkerLine: MarkerLine | null = null;
let currentSticker: Sticker | null = null;
let currentThickness = 2;
let toolPreview: ToolPreview | StickerPreview | null = null;
let currentStickerEmoji: string | null = null;

const stickerData = [
    { id: 'sticker1', emoji: '😀' },
    { id: 'sticker2', emoji: '🎉' },
    { id: 'sticker3', emoji: '🌟' }
];

const stickerButtonsDiv = document.getElementById('stickerButtons')!;
stickerData.forEach(sticker => {
    const button = document.createElement('button');
    button.id = `${sticker.id}Button`;
    button.textContent = sticker.emoji;
    button.addEventListener('click', () => {
        currentStickerEmoji = sticker.emoji;
        updateSelectedTool(button);
        canvas.dispatchEvent(new Event('tool-moved'));
    });
    stickerButtonsDiv.appendChild(button);
});

const customStickerButton = document.getElementById('customStickerButton') as HTMLButtonElement;
customStickerButton.addEventListener('click', () => {
    const customSticker = prompt('Enter your custom sticker:', '😊');
    if (customSticker) {
        const customStickerId = `sticker${stickerData.length + 1}`;
        stickerData.push({ id: customStickerId, emoji: customSticker });
        const button = document.createElement('button');
        button.id = `${customStickerId}Button`;
        button.textContent = customSticker;
        button.addEventListener('click', () => {
            currentStickerEmoji = customSticker;
            updateSelectedTool(button);
            canvas.dispatchEvent(new Event('tool-moved'));
        });
        stickerButtonsDiv.appendChild(button);
    }
});

function updateSelectedTool(selectedButton: HTMLButtonElement) {
    document.querySelectorAll('button').forEach(button => {
        button.classList.remove('selectedTool');
    });
    selectedButton.classList.add('selectedTool');
}

canvas.addEventListener('mousedown', (event) => {
    if (currentStickerEmoji) {
        currentSticker = new Sticker(event.offsetX, event.offsetY, currentStickerEmoji);
        stickers.push(currentSticker);
        redoStack = []; // Clear redo stack on new drawing
        toolPreview = null; // Hide tool preview while drawing
        canvas.dispatchEvent(new Event('drawing-changed'));
    } else {
        isDrawing = true;
        currentMarkerLine = new MarkerLine(event.offsetX, event.offsetY, currentThickness);
        markerLines.push(currentMarkerLine);
        redoStack = []; // Clear redo stack on new drawing
        toolPreview = null; // Hide tool preview while drawing
        canvas.dispatchEvent(new Event('drawing-changed'));
    }
});

canvas.addEventListener('mousemove', (event) => {
    if (isDrawing && currentMarkerLine) {
        currentMarkerLine.drag(event.offsetX, event.offsetY);
        canvas.dispatchEvent(new Event('drawing-changed'));
    } else if (currentSticker) {
        currentSticker.drag(event.offsetX, event.offsetY);
        canvas.dispatchEvent(new Event('drawing-changed'));
    } else {
        if (currentStickerEmoji) {
            if (!toolPreview || !(toolPreview instanceof StickerPreview)) {
                toolPreview = new StickerPreview(event.offsetX, event.offsetY, currentStickerEmoji);
            } else {
                toolPreview.updatePosition(event.offsetX, event.offsetY);
            }
        } else {
            if (!toolPreview || !(toolPreview instanceof ToolPreview)) {
                toolPreview = new ToolPreview(event.offsetX, event.offsetY, currentThickness);
            } else {
                toolPreview.updatePosition(event.offsetX, event.offsetY);
            }
        }
        canvas.dispatchEvent(new Event('tool-moved'));
    }
});

canvas.addEventListener('mouseup', () => {
    isDrawing = false;
    currentMarkerLine = null;
    currentSticker = null;
});

canvas.addEventListener('mouseout', () => {
    isDrawing = false;
    currentMarkerLine = null;
    currentSticker = null;
    toolPreview = null; // Hide tool preview when mouse leaves canvas
});

canvas.addEventListener('drawing-changed', () => {
    context.clearRect(0, 0, canvas.width, canvas.height);
    for (const markerLine of markerLines) {
        markerLine.display(context);
    }
    for (const sticker of stickers) {
        sticker.display(context);
    }
});

canvas.addEventListener('tool-moved', () => {
    context.clearRect(0, 0, canvas.width, canvas.height);
    for (const markerLine of markerLines) {
        markerLine.display(context);
    }
    for (const sticker of stickers) {
        sticker.display(context);
    }
    if (toolPreview && !isDrawing) {
        toolPreview.draw(context);
    }
});

const clearButton = document.getElementById('clearButton') as HTMLButtonElement;
clearButton.addEventListener('click', () => {
    markerLines = [];
    stickers = [];
    redoStack = [];
    context.clearRect(0, 0, canvas.width, canvas.height);
});

const undoButton = document.getElementById('undoButton') as HTMLButtonElement;
undoButton.addEventListener('click', () => {
    if (markerLines.length > 0) {
        const lastMarkerLine = markerLines.pop()!;
        redoStack.push(lastMarkerLine);
        canvas.dispatchEvent(new Event('drawing-changed'));
    } else if (stickers.length > 0) {
        const lastSticker = stickers.pop()!;
        redoStack.push(lastSticker);
        canvas.dispatchEvent(new Event('drawing-changed'));
    }
});

const redoButton = document.getElementById('redoButton') as HTMLButtonElement;
redoButton.addEventListener('click', () => {
    if (redoStack.length > 0) {
        const lastUndone = redoStack.pop()!;
        if (lastUndone instanceof MarkerLine) {
            markerLines.push(lastUndone);
        } else if (lastUndone instanceof Sticker) {
            stickers.push(lastUndone);
        }
        canvas.dispatchEvent(new Event('drawing-changed'));
    }
});

const thinButton = document.getElementById('thinButton') as HTMLButtonElement;
const thickButton = document.getElementById('thickButton') as HTMLButtonElement;

thinButton.addEventListener('click', () => {
    currentThickness = 2;
    currentStickerEmoji = null;
    updateSelectedTool(thinButton);
});

thickButton.addEventListener('click', () => {
    currentThickness = 5;
    currentStickerEmoji = null;
    updateSelectedTool(thickButton);
});

const exportButton = document.getElementById('exportButton') as HTMLButtonElement;
exportButton.addEventListener('click', () => {
    const exportCanvas = document.createElement('canvas') as HTMLCanvasElement;
    exportCanvas.width = 1024;
    exportCanvas.height = 1024;
    const exportContext = exportCanvas.getContext('2d')!;
    exportContext.scale(4, 4); // Scale context to match the size of the original canvas

    // Redraw all items on the export canvas
    for (const markerLine of markerLines) {
        markerLine.display(exportContext);
    }
    for (const sticker of stickers) {
        sticker.display(exportContext);
    }

    // Trigger file download
    exportCanvas.toBlob((blob) => {
        if (blob) {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'drawing.png';
            a.click();
            URL.revokeObjectURL(url);
        }
    });
});

