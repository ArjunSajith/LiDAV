let gridSize = 20;
let points = [];
let scaleFactor = 1;
let selectedAlgorithm = 'dda';
let offsetX = 0;
let offsetY = 0;
let isDragging = false;
let lastMouseX = 0;
let lastMouseY = 0;
let didDrag = false;
let linePixels = [];
let stepDetails = [];      // all pixels from algorithm
let revealedPixels = 0;    // how many pixels to show so far

function formatNumber(n) { //rounds to three decimal places and removes trailing zeores after decimal point
    const fixed = Number(n).toFixed(3);
    return fixed.includes('.')
        ? fixed.replace(/\.?0+$/, '')
        : fixed;
}

function setup() {
    //Creating and placing canvas (the grid)
    const sketchHolder = document.getElementById("sketch-holder");
    const canvas = createCanvas(sketchHolder.clientWidth, sketchHolder.clientHeight);
    canvas.parent("sketch-holder");

    // Prevent native scroll behavior when scrolling mouse wheel
    sketchHolder.addEventListener("wheel", (e) => e.preventDefault(), { passive: false });

    // Setting defaults
    angleMode(DEGREES);
    textAlign(LEFT, BOTTOM);
    textSize(12);

    // Canvas resizes when window resizes
    window.addEventListener("resize", () => {
        resizeCanvas(sketchHolder.offsetWidth, sketchHolder.offsetHeight);
        redraw();
    });

    // Dropdown — algorithm selection
    const dropdown = document.getElementById("algorithm");
    dropdown.addEventListener("change", () => {
        selectedAlgorithm = dropdown.value;
        // Reset everything when algorithm is changed
        resetPage();
    });

    // Next / Show Table / Reset button
    const nextBtn = document.getElementById("nextBtn");
    nextBtn.dataset.mode = "next";
    nextBtn.innerText = "Next";

    nextBtn.addEventListener("click", () => {
        if (nextBtn.dataset.mode === "reset") {
            resetPage();
            return;
        }

        if (revealedPixels < linePixels.length) {
            revealedPixels++;
            updateStepInfo();

            if (revealedPixels === linePixels.length) { //change to Show Table when line has been drawn fully
                nextBtn.innerText = "Show Table";
                nextBtn.dataset.mode = "table";
            }
        } else if (nextBtn.dataset.mode === "table") {
            showStepTable();
            nextBtn.innerText = "Reset"; //changes to reset when table has been displayed
            nextBtn.dataset.mode = "reset";
        }
    });

    // Manual point input
    document.getElementById("applyPointsBtn").addEventListener("click", () => {
        const sx = parseInt(document.getElementById("startX").value);
        const sy = parseInt(document.getElementById("startY").value);
        const ex = parseInt(document.getElementById("endX").value);
        const ey = parseInt(document.getElementById("endY").value);

        if (
            Number.isInteger(sx) && Number.isInteger(sy) &&
            Number.isInteger(ex) && Number.isInteger(ey)
        ) {
            points = [{ x: sx, y: -sy }, { x: ex, y: -ey }];
            computeLine();
        }
    });

    // Initial description
    const descBox = document.getElementById("algo-description");
    if (descBox) {
        descBox.innerText = algorithmDescriptions[selectedAlgorithm].trim();
    }

    noLoop(); //preventing unwanted automatic refreshes
}

function resetPage() {
    points = [];
    linePixels = [];
    stepDetails = [];
    revealedPixels = 0;

    offsetX = 0;
    offsetY = 0;
    scaleFactor = 1;

    document.getElementById("startX").value = "";
    document.getElementById("startY").value = "";
    document.getElementById("endX").value = "";
    document.getElementById("endY").value = "";

    document.getElementById("step-info").innerText = "";

    document.getElementById("nextBtn").innerText = "Next";
    document.getElementById("nextBtn").dataset.mode = "next";

    const descBox = document.getElementById("algo-description");
    if (descBox) {
        descBox.innerText = algorithmDescriptions[selectedAlgorithm].trim();
    }

    redraw();
}

function showStepTable() {
    const container = document.getElementById("step-info");
    container.innerHTML = ""; // Clear previous content

    const table = document.createElement("table");
    table.style.width = "100%";
    table.style.borderCollapse = "collapse";
    table.style.fontFamily = "monospace";
    table.style.fontSize = "13px";

    // Header row
    const header = document.createElement("tr");
    ["Step", "Raw X", "Raw Y", "Plotted"].forEach(text => {
        const th = document.createElement("th");
        th.innerText = text;
        th.style.borderBottom = "1px solid #ccc";
        th.style.padding = "4px";
        th.style.textAlign = "left";
        header.appendChild(th);
    });
    table.appendChild(header);

    // Data rows
    stepDetails.forEach(step => {
        const row = document.createElement("tr");

        const cells = [
            step.step,
            step.rawX ? formatNumber(step.rawX) : "",
            step.rawY ? formatNumber(-step.rawY) : "",
            `(${step.x}, ${-step.y})`
        ];


        cells.forEach(text => {
            const td = document.createElement("td");
            td.innerText = text;
            td.style.padding = "4px";
            row.appendChild(td);
        });

        table.appendChild(row);
    });

    container.appendChild(table);
}

function windowResized() {
    const sketchHolder = document.getElementById("sketch-holder");
    resizeCanvas(sketchHolder.offsetWidth, sketchHolder.offsetHeight);
}

function computeLine() {
    if (points.length === 2) {
        if (selectedAlgorithm === "dda") {
            const result = dda(points[0], points[1]);
            linePixels = result.points;
            stepDetails = result.stepsInfo;
        } else {
            const result = bresenham(points[0], points[1]);
            linePixels = result.points;
            stepDetails = result.stepsInfo;
        }
        revealedPixels = 0;
        updateStepInfo();
        autoZoomToFit(points[0], points[1]);
    }
}

function autoZoomToFit(p0, p1) {
    const sketchHolder = document.getElementById("sketch-holder");
    const canvasW = sketchHolder.clientWidth;
    const canvasH = sketchHolder.clientHeight;

    const minGx = Math.min(p0.x, p1.x);
    const maxGx = Math.max(p0.x, p1.x);
    const minGy = Math.min(p0.y, p1.y);
    const maxGy = Math.max(p0.y, p1.y);

    const buffer = 5;
    const finalMinGx = Math.min(minGx - buffer, -buffer);
    const finalMaxGx = Math.max(maxGx + buffer, buffer);
    const finalMinGy = Math.min(minGy - buffer, -buffer);
    const finalMaxGy = Math.max(maxGy + buffer, buffer);

    const worldWidth = (finalMaxGx - finalMinGx) * gridSize;
    const worldHeight = (finalMaxGy - finalMinGy) * gridSize;

    if (worldWidth === 0 || worldHeight === 0) {
        scaleFactor = 1;
    } else {
        const scaleX = canvasW / worldWidth;
        const scaleY = canvasH / worldHeight;
        scaleFactor = Math.min(scaleX, scaleY) * 0.9;
    }

    const midGx = (finalMinGx + finalMaxGx) / 2;
    const midGy = (finalMinGy + finalMaxGy) / 2;

    offsetX = -midGx * gridSize * scaleFactor;
    offsetY = -midGy * gridSize * scaleFactor;

    loop();
    redraw();
}

function updateStepInfo() {
    const infoBox = document.getElementById("step-info");

    if (revealedPixels === 0) {
        infoBox.innerText = "No steps revealed yet.";
        return;
    }

    if (revealedPixels > stepDetails.length) {
        infoBox.innerText = "All pixels revealed.";
        return;
    }

    const step = stepDetails[revealedPixels - 1];
    let output = "";

    // Show calculation logic for DDA only on step 1
    if (
        step.xInc !== undefined &&
        step.yInc !== undefined &&
        step.step === 1
    ) {
        const stepsCount = stepDetails.length - 1;
        const dx = (step.xInc * stepsCount).toFixed(2);
        const dy = (step.yInc * stepsCount).toFixed(2);

        output += `Increment Calculation:\n`;
        output += `dx = x2 - x1 = ${formatNumber(dx)}\n`
        output += `dy = y2 - y1 = ${formatNumber(-dy)}\n`;
        output += `steps = max(|dx|, |dy|) = ${stepsCount}\n`;
        output += `xInc = dx / steps = ${formatNumber(dx)} / ${stepsCount} = ${formatNumber(step.xInc)}\n`;
        output += `yInc = dy / steps = ${formatNumber(-dy)} / ${stepsCount} = ${formatNumber(-step.yInc)}\n\n`;
    }

    // Step number
    output += `Step ${step.step} of ${stepDetails.length}\n`;

    // Plotted pixel
    output += `Plotted: (${step.x}, ${-step.y})\n`;

    // Bresenham-specific term
    if (step.err !== undefined) {
        output += `Error term: ${formatNumber(step.err)}\n`;
    }

    // Explanation
    if (step.explanation) {
        output += `\nExplanation:\n${step.explanation}`;
    }

    infoBox.innerText = output;
}

// ========================================================================
// REWRITTEN: Single helper function to convert world to screen coordinates
// ========================================================================
function worldToScreen(world, axis){
    if (axis == 'x') return (world * scaleFactor) + (width / 2 + offsetX);
    else return (world * scaleFactor) + (height / 2 + offsetY);
}

function draw() {
    background(255);

    // Apply pan and zoom
    translate(width / 2 + offsetX, height / 2 + offsetY);
    scale(scaleFactor);

    drawPixelGrid();
    drawAxesAsPixels();
    drawSelectedPoints();
    drawLinePixels();

}

function drawLinePixels() {
    fill('red');
    noStroke();

    for (let i = 0; i < revealedPixels && i < linePixels.length; i++) {
        const pt = linePixels[i];
        rect(pt.x * gridSize, pt.y * gridSize, gridSize, gridSize);
    }
}

function drawPixelGrid() {
    stroke(220);
    fill(255);

    const buffer =  6* gridSize;
    const viewLeft = (-width / 2 - offsetX - buffer) / scaleFactor;
    const viewRight = (width / 2 - offsetX + buffer) / scaleFactor;
    const viewTop = (-height / 2 - offsetY - buffer) / scaleFactor;
    const viewBottom = (height / 2 - offsetY + buffer) / scaleFactor;

    const startX = Math.floor(viewLeft / gridSize) * gridSize;
    const endX = Math.ceil(viewRight / gridSize) * gridSize;
    const startY = Math.floor(viewTop / gridSize) * gridSize;
    const endY = Math.ceil(viewBottom / gridSize) * gridSize;

    for (let x = startX; x <= endX; x += gridSize) {
        for (let y = startY; y <= endY; y += gridSize) {
            rect(x, y, gridSize, gridSize);
        }
    }
}

function drawAxesAsPixels() {
    const buffer = 6 * gridSize;
    const viewLeft = (-width / 2 - offsetX - buffer) / scaleFactor;
    const viewRight = (width / 2 - offsetX + buffer) / scaleFactor;
    const viewTop = (-height / 2 - offsetY - buffer) / scaleFactor;
    const viewBottom = (height / 2 - offsetY + buffer) / scaleFactor;

    const startX = Math.floor(viewLeft / gridSize) * gridSize;
    const endX = Math.ceil(viewRight / gridSize) * gridSize;
    const startY = Math.floor(viewTop / gridSize) * gridSize;
    const endY = Math.ceil(viewBottom / gridSize) * gridSize;

    const interval = getLabelInterval();
    const showInsideLabels = scaleFactor >= 0.3;

    // AXES LINES
    fill(0);
    noStroke();
    for (let x = startX; x <= endX; x += gridSize) rect(x, 0, gridSize, gridSize);
    for (let y = startY; y <= endY; y += gridSize) rect(0, y, gridSize, gridSize);
    rect(0, 0, gridSize, gridSize); // origin

    if (showInsideLabels) {
        push();
        fill(255);
        noStroke();
        textAlign(CENTER, CENTER);
        textSize(12 / scaleFactor);

        for (let x = startX; x <= endX; x += gridSize) {
            const gx = x / gridSize;
            if (gx % interval === 0) {
                text(formatNumber(gx), x + gridSize / 2, gridSize / 2);
            }
        }

        for (let y = startY; y <= endY; y += gridSize) {
            const gy = -y / gridSize;
            if (gy % interval === 0) {
                text(formatNumber(gy), gridSize / 2, y + gridSize / 2);
            }
        }

        text("0", gridSize / 2, gridSize / 2);
        pop();
    } else {
        const xLabels = [];
        const yLabels = [];

        for (let x = startX; x <= endX; x += gridSize) {
            const gx = x / gridSize;
            if (gx % interval === 0 && gx !== 0) {
                const sx = worldToScreen(x + gridSize / 2, 'x');
                if (sx >= 0 && sx <= width) {
                    xLabels.push({ text: formatNumber(gx), sx: sx });
                }
            }
        }

        for (let y = startY; y <= endY; y += gridSize) {
            const gy = -y / gridSize;
            if (gy % interval === 0 && gy !== 0) {
                const sy = worldToScreen(y + gridSize / 2, 'y');
                if (sy >= 0 && sy <= height) {
                    yLabels.push({ text: formatNumber(gy), sy: sy });
                }
            }
        }

        const axisScreenX = worldToScreen(0, 'x');
        const axisScreenY = worldToScreen(0, 'y');

        push();
        resetMatrix();
        textAlign(CENTER, CENTER);
        textSize(14);
        fill(0);
        noStroke();

        for (const label of xLabels) {
            text(label.text, label.sx, axisScreenY + 18);
        }

        for (const label of yLabels) {
            text(label.text, axisScreenX + 28, label.sy);
        }

        text("0", axisScreenX + 20, axisScreenY + 20);
        pop();
    }
}

function getLabelInterval() {
    if (scaleFactor < 0.1) return 100;
    if (scaleFactor < 0.2) return 50;
    if (scaleFactor < 0.3) return 20;
    if (scaleFactor < 0.5) return 10;
    if (scaleFactor < 1) return 5;
    return 1;
}

function drawSelectedPoints() {
    if (points.length === 0) return;

    const offsetDistance = 30 / scaleFactor;
    const textSizePx = 14 / scaleFactor;
    textSize(textSizePx);
    fill('black');
    noStroke();
    textAlign(CENTER, CENTER);

    let direction = { x: 0, y: 0 };
    if (points.length === 2) {
        const dx = points[1].x - points[0].x;
        const dy = points[1].y - points[0].y;
        const mag = Math.sqrt(dx * dx + dy * dy) || 1;
        direction = { x: dx / mag, y: dy / mag };
    }

    for (let i = 0; i < points.length; i++) {
        const pt = points[i];

        fill('blue');
        noStroke();
        
        const markerScreenSize = 8;
        if (scaleFactor * gridSize < markerScreenSize) {
            const markerWorldSize = markerScreenSize / scaleFactor;
            push();
            rectMode(CENTER);
            rect(pt.x * gridSize + gridSize / 2, pt.y * gridSize + gridSize / 2, markerWorldSize, markerWorldSize);
            pop();
        } else {
            rect(pt.x * gridSize, pt.y * gridSize, gridSize, gridSize);
        }

        const sign = i === 0 ? -1 : 1;
        const normalX = -direction.y;
        const normalY = direction.x;
        const offsetX = (normalX + direction.x) * offsetDistance * sign;
        const offsetY = (normalY + direction.y) * offsetDistance * sign;
        const labelX = pt.x * gridSize + gridSize / 2 + offsetX;
        const labelY = pt.y * gridSize + gridSize / 2 + offsetY;
        const label = `(${pt.x}, ${-pt.y})`;

        fill('black');
        text(label, labelX, labelY);
    }
}

function mousePressed() {
    lastMouseX = mouseX;
    lastMouseY = mouseY;
    didDrag = false;
}

function mouseDragged() {
    if (
        mouseX < 0 || mouseX > width ||
        mouseY < 0 || mouseY > height
    ) return;
    const dx = mouseX - lastMouseX;
    const dy = mouseY - lastMouseY;

    offsetX += dx;
    offsetY += dy;

    lastMouseX = mouseX;
    lastMouseY = mouseY;

    didDrag = true;
    loop();
    redraw();
}

function mouseReleased() {
    if (
        mouseX < 0 || mouseX > width ||
        mouseY < 0 || mouseY > height
    ) return;

    if (!didDrag && mouseButton === LEFT) {
        const x = (mouseX - width / 2 - offsetX) / scaleFactor;
        const y = (mouseY - height / 2 - offsetY) / scaleFactor;

        const col = Math.floor(x / gridSize);
        const row = Math.floor(y / gridSize);

        if (points.length < 2) {
            points.push({ x: col, y: row });

            if (points.length === 1) {
                document.getElementById("startX").value = col;
                document.getElementById("startY").value = -row;
                redraw();
            } else if (points.length === 2) {
                document.getElementById("endX").value = col;
                document.getElementById("endY").value = -row;
                computeLine();
            }

        } else {
            points = [{ x: col, y: row }];
            linePixels = [];
            revealedPixels = 0;
            document.getElementById("startX").value = col;
            document.getElementById("startY").value = -row;
            document.getElementById("endX").value = "";
            document.getElementById("endY").value = "";
            redraw();
        }
    }

    console.log("Line pixels:", linePixels);
}

function mouseWheel(event) {
    if (
        mouseX < 0 || mouseX > width ||
        mouseY < 0 || mouseY > height
    ) return;
    
    if (event.delta > 0) {
        scaleFactor *= 0.9;
    } else {
        scaleFactor *= 1.1;
    }

    loop();
    redraw();

    return false;
}