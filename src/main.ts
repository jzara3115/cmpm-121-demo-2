import "./style.css";

const APP_NAME = "BARELY STARTED?";
const app = document.querySelector<HTMLDivElement>("#app")!;

document.title = APP_NAME;
app.innerHTML = `<h1>${APP_NAME}</h1><button id="clearButton">Clear</button>`;

const canvas = document.createElement('canvas') as HTMLCanvasElement;
canvas.id = 'myCanvas';
canvas.width = 256;
canvas.height = 256;
app.appendChild(canvas);

const context = canvas.getContext('2d')!;
context.lineWidth = 2;
context.strokeStyle = 'black';

let drawing = false;

canvas.addEventListener('mousedown', (event) => {
    drawing = true;
    context.beginPath();
    context.moveTo(event.offsetX, event.offsetY);
});

canvas.addEventListener('mousemove', (event) => {
    if (drawing) {
        context.lineTo(event.offsetX, event.offsetY);
        context.stroke();
    }
});

canvas.addEventListener('mouseup', () => {
    drawing = false;
});

canvas.addEventListener('mouseout', () => {
    drawing = false;
});

const clearButton = document.getElementById('clearButton') as HTMLButtonElement;
clearButton.addEventListener('click', () => {
    context.clearRect(0, 0, canvas.width, canvas.height);
});

