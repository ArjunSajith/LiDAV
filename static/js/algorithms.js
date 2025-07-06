function formatNumber(n) {
    const num = Number(n);
    return Number.isInteger(num) ? num.toString() : parseFloat(num.toFixed(3)).toString();
}

// Digital Differential Analyzer (DDA)
function dda(p1, p2) {
    let points = [];
    let stepsInfo = [];

    let dx = p2.x - p1.x;
    let dy = p2.y - p1.y;
    let steps = Math.max(Math.abs(dx), Math.abs(dy));
    let xInc = dx / steps;
    let yInc = dy / steps;
    let x = p1.x;
    let y = p1.y;

    for (let i = 0; i <= steps; i++) {
        const px = Math.round(x);
        const py = Math.round(y);

        points.push({ x: px, y: py });

        const explanation = (i === 0) ? "" :
            `x += ${formatNumber(xInc)} -> x = ${formatNumber(x)}\n` +
            `y += ${formatNumber(-yInc)} → y = ${formatNumber(-y)}\n` +
            `→ round(${formatNumber(x)}, ${formatNumber(-y)})\n` +
            `→ (${px}, ${-py})`;

        stepsInfo.push({
            step: i + 1,
            x: px,
            y: py,
            rawX: x.toFixed(2),
            rawY: y.toFixed(2),
            xInc: xInc.toFixed(2),
            yInc: yInc.toFixed(2),
            explanation: explanation
        });

        x += xInc;
        y += yInc;
    }

    return { points, stepsInfo };
}

// Bresenham's Line Algorithm
function bresenham(p1, p2) {
    let points = [];
    let stepsInfo = [];

    let x1 = p1.x;
    let y1 = p1.y;
    const x2 = p2.x;
    const y2 = p2.y;

    const dx = Math.abs(x2 - x1);
    const dy = Math.abs(y2 - y1);
    const sx = (x1 < x2) ? 1 : -1;
    const sy = (y1 < y2) ? 1 : -1;

    let err = dx - dy;
    let step = 1;

    while (true) {
        points.push({ x: x1, y: y1 });

        let explanation = "";
        if (step > 1) {
            const e2 = 2 * err;
            explanation =
                `Step ${step}:\n` +
                `→ e = ${err}, 2e = ${e2}\n`;

            if (e2 > -dy) {
                explanation += `→ 2e > -dy (${e2} > ${-dy}) → x += ${sx}, e -= ${dy} → e = ${err - dy}\n`;
            }
            if (e2 < dx) {
                explanation += `→ 2e < dx (${e2} < ${dx}) → y += ${sy}, e += ${dx} → e = ${err + dx}\n`;
            }
        }

        stepsInfo.push({
            step: step,
            x: x1,
            y: y1,
            rawX: x1,
            rawY: y1,
            err: err,
            explanation: explanation.trim()
        });

        if (x1 === x2 && y1 === y2) break;

        const e2 = 2 * err;
        if (e2 > -dy) {
            err -= dy;
            x1 += sx;
        }
        if (e2 < dx) {
            err += dx;
            y1 += sy;
        }

        step++;
    }

    return { points, stepsInfo };
}
