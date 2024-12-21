const canvasContainer = document.getElementById('canvasContainer');
const colorPicker = document.getElementById('colorPicker');
const lineWidth = document.getElementById('lineWidth');
const addCanvasButton = document.getElementById('addCanvas');
const clearButton = document.getElementById('clearCanvas');
const downloadButton = document.getElementById('downloadCanvas');
const canvasList = document.getElementById('canvasList');
const freeDrawButton = document.getElementById('drawFree');
const rectButton = document.getElementById('drawRect');
const circleButton = document.getElementById('drawCircle');
const fillShapeButton = document.getElementById('fillShape');

let canvas, ctx;
let isDrawing = false;
let currentTool = 'free';
let startX = 0;
let startY = 0;
let savedCanvas;
let activeCanvasId = null;
let activeCanvasName = ''; // 当前画布名称
let isFilling = false;

// 初始化画布
function initializeCanvas(id, name) {
    canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;
    canvas.id = id;
    canvas.classList.add('drawingCanvas');
    canvasContainer.innerHTML = '';
    canvasContainer.appendChild(canvas);
    ctx = canvas.getContext('2d');
    activeCanvasId = id;
    activeCanvasName = name; // 设置当前画布名称

    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);

    const dataURL = localStorage.getItem(`canvas-${id}`);
    if (dataURL) {
        const img = new Image();
        img.onload = () => ctx.drawImage(img, 0, 0);
        img.src = dataURL;
    }
}

// 加载画布列表
function loadCanvasList() {
    const savedCanvasList = JSON.parse(localStorage.getItem('canvasList')) || [];
    canvasList.innerHTML = '';

    if (savedCanvasList.length > 0) {
        savedCanvasList.forEach((canvasData) => {
            addCanvasToList(canvasData.name, canvasData.id, false);
        });

        initializeCanvas(savedCanvasList[0].id, savedCanvasList[0].name);
    } else {
        addCanvas('默认画布');
    }
}

// 保存画布列表到 Local Storage
function saveCanvasList() {
    const list = [];
    const items = canvasList.querySelectorAll('li');
    items.forEach((item) => {
        list.push({ name: item.textContent.replace('删除', '').trim(), id: item.id });
    });
    localStorage.setItem('canvasList', JSON.stringify(list));
}

// 添加画布到列表
function addCanvasToList(name, id, autoSwitch = true) {
    const li = document.createElement('li');
    li.textContent = name;

    const deleteBtn = document.createElement('span');
    deleteBtn.textContent = '删除';
    deleteBtn.classList.add('delete-btn');
    deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        localStorage.removeItem(`canvas-${id}`);
        li.remove();
        saveCanvasList();

        // 如果画布列表为空，则创建一个默认画布
        if (canvasList.children.length === 0) {
            addCanvas('默认画布');
        } else {
            // 切换到第一个画布
            const firstCanvas = canvasList.children[0];
            initializeCanvas(firstCanvas.id, firstCanvas.textContent.replace('删除', '').trim());
        }
    });

    li.addEventListener('click', () => initializeCanvas(id, name));
    li.id = id;
    li.appendChild(deleteBtn);
    canvasList.appendChild(li);

    saveCanvasList();

    if (autoSwitch) {
        initializeCanvas(id, name);
    }
}

// 添加新画布
function addCanvas(defaultName = '') {
    const canvasName = defaultName || prompt('请输入新画布的名称:');
    if (!canvasName || canvasName.trim() === '') return; // 防止空名称
    const id = `canvas-${Date.now()}`;
    addCanvasToList(canvasName, id);
    initializeCanvas(id, canvasName);
}

// 工具按钮绑定事件
freeDrawButton.addEventListener('click', () => currentTool = 'free');
rectButton.addEventListener('click', () => currentTool = 'rect');
circleButton.addEventListener('click', () => currentTool = 'circle');
fillShapeButton.addEventListener('click', () => isFilling = !isFilling);

// 画布事件
function startDrawing(e) {
    isDrawing = true;
    startX = e.offsetX;
    startY = e.offsetY;

    ctx.beginPath();
    ctx.moveTo(startX, startY);
    savedCanvas = ctx.getImageData(0, 0, canvas.width, canvas.height);
}

function draw(e) {
    if (!isDrawing) return;

    ctx.putImageData(savedCanvas, 0, 0);
    ctx.strokeStyle = colorPicker.value;
    ctx.fillStyle = colorPicker.value;
    ctx.lineWidth = lineWidth.value;
    ctx.lineCap = 'round';

    if (currentTool === 'free') {
        ctx.lineTo(e.offsetX, e.offsetY);
        ctx.stroke();
    } else if (currentTool === 'rect') {
        ctx.strokeRect(startX, startY, e.offsetX - startX, e.offsetY - startY);
        if (isFilling) {
            ctx.fillRect(startX, startY, e.offsetX - startX, e.offsetY - startY);
        }
    } else if (currentTool === 'circle') {
        const radius = Math.sqrt(
            Math.pow(e.offsetX - startX, 2) + Math.pow(e.offsetY - startY, 2)
        );
        ctx.beginPath();
        ctx.arc(startX, startY, radius, 0, Math.PI * 2);
        ctx.stroke();
        if (isFilling) {
            ctx.fill();
        }
    }
}

function stopDrawing() {
    if (isDrawing) {
        saveCanvas(activeCanvasId);
        isDrawing = false;
    }
}

// 清除画布
clearButton.addEventListener('click', () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    saveCanvas(activeCanvasId);
    console.log('画布已清除');
});

// 下载画布
downloadButton.addEventListener('click', () => {
    const link = document.createElement('a');
    link.download = `${activeCanvasName}.png`; // 使用当前画布名称作为文件名
    link.href = canvas.toDataURL();
    link.click();
    console.log('画布下载成功');
});

// 保存画布到 Local Storage
function saveCanvas(id) {
    const dataURL = canvas.toDataURL();
    localStorage.setItem(`canvas-${id}`, dataURL);
}

// 初始化
addCanvasButton.addEventListener('click', () => addCanvas());
loadCanvasList();
