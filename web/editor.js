window.addEventListener('load', onload, false);

let g_canvas = null;
let g_ctx = null;

let g_nodeLocations = null;
let g_mousePan = null;
let g_mouseZoom = null;
let g_mousePos = null;
let g_mousePos_u = null;
let g_mouseLastTime = null;
let g_xformInv = null;
let g_mouseNode = null;

let g_collapsedNodes = null;

const BUTTON_LEFT = 0;
const BUTTON_RIGHT = 2;
const PIXEL_RATIO = window.devicePixelRatio;
const DOUBLE_CLICK_TIME = 300;

function onload() {
    document.oncontextmenu = function() {
        return false;
    }

    g_canvas = document.getElementById('editorcanvas');
    g_ctx = g_canvas.getContext('2d');

    g_nodeLocations = [];
    g_mousePan = null;
    g_mouseZoom = null;
    g_mousePos = null;
    g_mousePos_u = null;
    g_mouseLastTime = null;
    g_xformInv = null;
    g_mouseNode = null;

    g_collapsedNodes = new Set();

    g_canvas.addEventListener('mousedown', onMouseDown);
    g_canvas.addEventListener('mousemove', onMouseMove);
    g_canvas.addEventListener('mouseup', onMouseUp);
    g_canvas.addEventListener('mouseout', onMouseOut);
    g_canvas.addEventListener('wheel', onMouseWheel);

    updateCanvasSize(g_canvas.width, g_canvas.height);

    window.requestAnimationFrame(onDraw);
}

function onDraw() {
    const currentXform = g_ctx.getTransform();

    g_ctx.resetTransform();
    g_ctx.scale(PIXEL_RATIO, PIXEL_RATIO);
    g_ctx.clearRect(0, 0, g_canvas.width, g_canvas.height);
    g_ctx.fillStyle = '#aaaaaa';
    g_ctx.fillRect(0, 0, g_canvas.width, g_canvas.height);

    g_ctx.setTransform(currentXform);

    g_ctx.textAlign = 'center';
    g_ctx.textBaseline = 'middle';

    g_nodeLocations = []

    drawTree(g_ctx, g_nodeLocations, GAME_SETUP.tree);
}

function drawTree(ctx, nodeLocations, tree) {
    var depth_index = new Map();
    drawTreeNode(ctx, nodeLocations, tree, 0, depth_index);
}

function drawTreeNode(ctx, nodeLocations, node, depth, depth_index) {
    const NODE_WIDTH = 80;
    const NODE_HEIGHT = 40;
    const NODE_SPACING = 25;

    var index = depth_index.has(depth) ? depth_index.get(depth) : 0;
    depth_index.set(depth, index + 1);

    const nx = (index + 1) * NODE_SPACING + index * NODE_WIDTH;
    const ny = (depth + 1) * NODE_SPACING + depth * NODE_HEIGHT;

    if (node.hasOwnProperty('children')) {
        if (g_collapsedNodes.has(node)) {
            const childScale = 5 + 2 * Math.min(node.children.length - 1, 5);
            ctx.beginPath();
            ctx.fillStyle = '#444488';
            ctx.moveTo(nx + NODE_WIDTH / 2, ny + NODE_HEIGHT + 5);
            ctx.lineTo(nx + NODE_WIDTH / 2 - childScale, ny + NODE_HEIGHT);
            ctx.lineTo(nx + NODE_WIDTH / 2 + childScale, ny + NODE_HEIGHT);
            ctx.fill();
        } else {
            const child_depth = depth + 1;
            for (let child of node.children) {
                var child_index = depth_index.has(child_depth) ? depth_index.get(child_depth) : 0;
                if (child_index < index) {
                    child_index = index;
                    depth_index.set(child_depth, child_index);
                }
                const cnx = (child_index + 1) * NODE_SPACING + child_index * NODE_WIDTH;
                const cny = (child_depth + 1) * NODE_SPACING + child_depth * NODE_HEIGHT;

                ctx.lineWidth = 2;
                ctx.strokeStyle = '#444488';
                ctx.beginPath();
                ctx.moveTo(nx + NODE_WIDTH / 2, ny + NODE_HEIGHT);
                ctx.bezierCurveTo(nx + NODE_WIDTH / 2, cny - NODE_SPACING / 2, cnx + NODE_WIDTH / 2, cny - NODE_SPACING / 2, cnx + NODE_WIDTH / 2, cny);
                ctx.stroke();

                drawTreeNode(ctx, nodeLocations, child, child_depth, depth_index);
            }
        }
    }

    if (node === g_mouseNode) {
        ctx.fillStyle = '#ddffff';
    } else {
        ctx.fillStyle = '#cceeee';
    }
    ctx.beginPath();
    ctx.roundRect(nx, ny, NODE_WIDTH, NODE_HEIGHT, 6)
    ctx.fill();

    ctx.fillStyle = '#222222'
    ctx.font = (NODE_WIDTH / node.type.length) + 'px'
    ctx.fillText(node.type, nx + NODE_WIDTH / 2, ny + NODE_HEIGHT / 2);

    nodeLocations.push({rect:[nx, ny, nx + NODE_WIDTH, ny + NODE_HEIGHT], node:node});
}

function updateCanvasSize(desiredWidth, desiredHeight) {
    g_canvas.width = desiredWidth * PIXEL_RATIO;
    g_canvas.height = desiredHeight * PIXEL_RATIO;
    g_canvas.style.width = desiredWidth + "px";
    g_canvas.style.height = desiredHeight + "px";
    resetXform();
}

function updateXformInv() {
    g_xformInv = g_ctx.getTransform();
    g_xformInv.invertSelf();
}

function resetXform() {
    g_ctx.resetTransform();
    g_ctx.scale(PIXEL_RATIO, PIXEL_RATIO);
    updateXformInv();
}

function translateXform(byx, byy) {
    g_ctx.translate(byx, byy);
    updateXformInv();
}

function zoomAroundXform(pt, scale) {
    g_ctx.translate(pt.x, pt.y);
    g_ctx.scale(scale, scale);
    g_ctx.translate(-pt.x, -pt.y);
    updateXformInv();
}

function collapseNodes(node, recurse, collapse) {
    if (node.hasOwnProperty('children')) {
        if (collapse) {
            g_collapsedNodes.add(node);
        } else {
            g_collapsedNodes.delete(node);
        }
        if (recurse) {
            for (let child of node.children) {
                collapseNodes(child, recurse, collapse);
            }
        }
    }
}

function onMouseDown(evt) {
    const mouseButton = evt.button;

    const mouseTime = Date.now();

    const isDouble = (g_mouseLastTime !== null && mouseTime - g_mouseLastTime <= DOUBLE_CLICK_TIME);

    if (g_mouseNode !== null) {
        if (isDouble) {
            collapseNodes(g_mouseNode, true, g_collapsedNodes.has(g_mouseNode));
        } else {
            collapseNodes(g_mouseNode, false, !g_collapsedNodes.has(g_mouseNode));
        }
    } else {
        if (isDouble) {
            resetXform();
        } else {
            if (mouseButton === BUTTON_LEFT) {
                g_mousePan = true;
            } else if (mouseButton === BUTTON_RIGHT) {
                g_mouseZoom = g_mousePos;
            }
        }
    }

    g_mouseLastTime = mouseTime;

    evt.preventDefault();
    window.requestAnimationFrame(onDraw);
}

function onMouseUp(evt) {
    const mouseButton = evt.button;

    g_mousePan = null;
    g_mouseZoom = null;

    evt.preventDefault();
    window.requestAnimationFrame(onDraw);
}

function onMouseMove(evt) {
    const rect = g_canvas.getBoundingClientRect();
    const mousePos_u = new DOMPoint((evt.clientX - rect.left) * PIXEL_RATIO, (evt.clientY - rect.top) * PIXEL_RATIO);

    let mousePos = g_xformInv.transformPoint(mousePos_u);

    g_mouseNode = null;

    if (g_mousePan !== null) {
        if (g_mousePos !== null) {
            translateXform(mousePos.x - g_mousePos.x, mousePos.y - g_mousePos.y);
            mousePos = g_xformInv.transformPoint(mousePos_u);
        }
    } else if (g_mouseZoom !== null) {
        if (g_mousePos !== null) {
            zoomAroundXform(g_mouseZoom, 1 + ((mousePos_u.y - g_mousePos_u.y) / 400));
            mousePos = g_xformInv.transformPoint(mousePos_u);
        }
    } else {
        for (const {rect, node} of g_nodeLocations) {
            if (rect[0] < mousePos.x && rect[1] < mousePos.y && rect[2] > mousePos.x && rect[3] > mousePos.y) {
                g_mouseNode = node;
                break;
            }
        }
    }

    g_mousePos_u = mousePos_u;
    g_mousePos = mousePos;

    evt.preventDefault();
    window.requestAnimationFrame(onDraw);
}

function onMouseOut(evt) {
    g_mouseNode = null;
    g_mousePos_u = null;
    g_mousePos = null;

    evt.preventDefault();
    window.requestAnimationFrame(onDraw);
}

function onMouseWheel(evt) {
    if (g_mousePos !== null) {
        if (evt.deltaY < 0) {
            zoomAroundXform(g_mousePos, 1 + (10 / 400));
        } else {
            zoomAroundXform(g_mousePos, 1 - (10 / 400));
        }
    }

    evt.preventDefault();
    window.requestAnimationFrame(onDraw);
}
