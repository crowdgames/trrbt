window.addEventListener('load', EDT_onload, false);



let EDT_canvas = null;
let EDT_ctx = null;
let EDT_keysDown = new Set();

let EDT_nodePositions = null;
let EDT_nodePositionsDesired = null;
let EDT_nodePositionsWantUpdate = true;
let EDT_drawLastTime = null

let EDT_mousePan = null;
let EDT_mouseZoom = null;
let EDT_mousePos = null;
let EDT_mousePos_u = null;
let EDT_mouseLastTime = null;
let EDT_xformInv = null;
let EDT_mouseNode = null;

let EDT_followStack = false;
let EDT_collapsedNodes = null;

const EDT_NODE_SPACING = 25;



function EDT_onload() {
    document.oncontextmenu = function() {
        return false;
    }

    EDT_canvas = document.getElementById('editorcanvas');
    EDT_ctx = EDT_canvas.getContext('2d');
    EDT_keysDown = new Set();

    EDT_nodePositions = new Map();
    EDT_nodePositionsDesired = new Map();
    EDT_nodePositionsWantUpdate = true;
    EDT_drawLastTime = null;

    EDT_mousePan = null;
    EDT_mouseZoom = null;
    EDT_mousePos = null;
    EDT_mousePos_u = null;
    EDT_mouseLastTime = null;
    EDT_xformInv = null;
    EDT_mouseNode = null;

    EDT_followStack = false;
    EDT_collapsedNodes = new Set();

    EDT_canvas.addEventListener('mousedown', EDT_onMouseDown);
    EDT_canvas.addEventListener('mousemove', EDT_onMouseMove);
    EDT_canvas.addEventListener('mouseup', EDT_onMouseUp);
    EDT_canvas.addEventListener('mouseout', EDT_onMouseOut);
    EDT_canvas.addEventListener('wheel', EDT_onMouseWheel);
    window.addEventListener('keydown', EDT_onKeyDown);
    window.addEventListener('keyup', EDT_onKeyUp);

    EDT_updateCanvasSize(EDT_canvas.width, EDT_canvas.height);

    window.requestAnimationFrame(EDT_onDraw);
}

function EDT_onDraw() {
    const currentXform = EDT_ctx.getTransform();

    EDT_ctx.resetTransform();
    EDT_ctx.scale(PIXEL_RATIO, PIXEL_RATIO);
    EDT_ctx.clearRect(0, 0, EDT_canvas.width, EDT_canvas.height);
    EDT_ctx.fillStyle = '#aaaaaa';
    EDT_ctx.fillRect(0, 0, EDT_canvas.width, EDT_canvas.height);

    EDT_ctx.setTransform(currentXform);

    EDT_ctx.textAlign = 'center';
    EDT_ctx.textBaseline = 'middle';

    const drawTime = Date.now();

    if (EDT_nodePositionsWantUpdate) {
        EDT_nodePositionsDesired = new Map();
        EDT_updateDesiredPositionsTree(EDT_nodePositionsDesired, GAME_SETUP.tree);

        var anyNodeMoved = false;
        if (EDT_drawLastTime !== null) {
            anyNodeMoved = EDT_updateNodePositions(EDT_nodePositions, EDT_nodePositionsDesired, drawTime - EDT_drawLastTime);
        } else {
            EDT_nodePositions = EDT_nodePositionsDesired
        }

        if (anyNodeMoved) {
            window.requestAnimationFrame(EDT_onDraw);
        } else {
            EDT_nodePositionsWantUpdate = false;
        }
    }

    EDT_drawTree(EDT_ctx, EDT_nodePositions, GAME_SETUP.tree);

    EDT_drawLastTime = drawTime;
}

function EDT_updatePositionsAndDraw(animate) {
    if (!animate) {
        EDT_drawLastTime = null; // prevents node sliding animation
    }
    EDT_nodePositionsWantUpdate = true;
    window.requestAnimationFrame(EDT_onDraw);
}

function EDT_nodeCollapsed(node, stackNodes) {
    if (EDT_followStack) {
        return !stackNodes.has(node);
    } else {
        return EDT_collapsedNodes.has(node);
    }
}

function EDT_getStackNodes() {
    var stackNodes = new Set();
    if (typeof ENG_callStack !== 'undefined' && ENG_callStack !== null) {
        for (var frame of ENG_callStack) {
            stackNodes.add(frame.node);
        }
    }
    return stackNodes;
}

function EDT_rectClose(ra, rb) {
    const EPSILON = 1;
    return Math.abs(ra.x - rb.x) <= EPSILON && Math.abs(ra.y - rb.y) <= EPSILON && Math.abs(ra.w - rb.w) <= EPSILON && Math.abs(ra.h - rb.h) <= EPSILON;
}

function EDT_rectValueUpdate(curr, des, dt) {
    return 0.2 * (des - curr);
}

function EDT_updateNodePositions(nodePositions, nodePositionsDesired, deltaTime) {
    var anyMoved = false;

    var toDelete = [];
    for (let node of nodePositions.keys()) {
        if (!nodePositionsDesired.has(node)) {
            toDelete.push(node);
        }
    }
    for (let node of toDelete) {
        nodePositions.delete(node);
    }

    for (let [node, desRect] of nodePositionsDesired.entries()) {
        if (nodePositions.has(node)) {
            var rect = nodePositions.get(node);
            if (EDT_rectClose(rect, desRect)) {
                nodePositions.set(node, desRect);
            } else {
                rect.x += EDT_rectValueUpdate(rect.x, desRect.x, deltaTime);
                rect.y += EDT_rectValueUpdate(rect.y, desRect.y, deltaTime);
                rect.w += EDT_rectValueUpdate(rect.w, desRect.w, deltaTime);
                rect.h += EDT_rectValueUpdate(rect.h, desRect.h, deltaTime);
                anyMoved = true;
            }
        } else {
            nodePositions.set(node, desRect);
        }
    }

    return anyMoved;
}

function EDT_updateDesiredPositionsTree(nodePositions, tree) {
    nodePositions.clear()

    EDT_updateDesiredPositionsTreeNode(nodePositions, EDT_getStackNodes(), tree, EDT_NODE_SPACING, null, EDT_NODE_SPACING);
}

function EDT_updateDesiredPositionsTreeNode(nodePositions, stackNodes, node, xpos, xalign, ypos) {
    var nx = xpos;
    var ny = ypos;

    var nw = 80;
    var nh = 40;
    if (node.type === 'player') {
        nw = 120;
        nh = 40;
    } else if (node.type === 'match') {
        nw = 40;
        nh = 30;
    } else if (['win', 'lose', 'draw'].indexOf(node.type) >= 0) {
        nw = 40;
        nh = 40;
    }

    if (xalign !== null) {
        nx = Math.max(nx, nx + 0.5 * xalign - 0.5 * nw);
    }

    let next_xpos = nx + nw + EDT_NODE_SPACING;

    if (node.hasOwnProperty('children')) {
        if (!EDT_nodeCollapsed(node, stackNodes)) {
            let child_next_xpos = nx;
            let child_xalign = nw;
            for (let child of node.children) {
                child_next_xpos = EDT_updateDesiredPositionsTreeNode(nodePositions, stackNodes, child, child_next_xpos, child_xalign, ypos + nh + EDT_NODE_SPACING);
                child_xalign = null;
            }
            next_xpos = Math.max(next_xpos, child_next_xpos);
        }
    }

    nodePositions.set(node, {x:nx, y:ny, w:nw, h:nh})

    return next_xpos;
}

function EDT_drawTree(ctx, nodePositions, tree) {
    EDT_drawTreeNode(ctx, nodePositions, EDT_getStackNodes(), tree);
}

function EDT_drawTreeNode(ctx, nodePositions, stackNodes, node) {
    const nrect = nodePositions.get(node);
    const nx = nrect.x;
    const ny = nrect.y;
    const nw = nrect.w;
    const nh = nrect.h;

    if (node.hasOwnProperty('children')) {
        if (EDT_nodeCollapsed(node, stackNodes)) {
            const childScale = 5 + 2 * Math.min(node.children.length - 1, 5);

            var childOnStack = false;
            for (let child of node.children) {
                if (stackNodes.has(child)) {
                    childOnStack = true;
                    break;
                }
            }

            ctx.beginPath();
            if (childOnStack) {
                ctx.fillStyle = '#222222';
            } else {
                ctx.fillStyle = '#444488';
            }
            ctx.moveTo(nx + nw / 2 - childScale, ny + nh);
            ctx.lineTo(nx + nw / 2, ny + nh + 5);
            ctx.lineTo(nx + nw / 2 + childScale, ny + nh);
            ctx.fill();
            if (childOnStack) {
                ctx.lineWidth = 4;
                ctx.strokeStyle = '#222222';
                ctx.stroke();
            }
        } else {
            let stackEdges = [];
            let nonStackEdges = [];
            for (let child of node.children) {
                const cnrect = nodePositions.get(child);
                const cnx = cnrect.x;
                const cny = cnrect.y;
                const cnw = cnrect.w;
                const cnh = cnrect.h;

                const midy = 0.5 * (ny + nh + cny);

                const edge = [nx + nw / 2, ny + nh,
                              nx + nw / 2, midy,
                              cnx + cnw / 2, midy,
                              cnx + cnw / 2, cny];

                if (stackNodes.has(child)) {
                    stackEdges.push(edge);
                } else {
                    nonStackEdges.push(edge);
                }
            }

            for (let edge of nonStackEdges) {
                ctx.lineWidth = 2;
                ctx.strokeStyle = '#444488';

                ctx.beginPath();
                ctx.moveTo(edge[0], edge[1]);
                ctx.bezierCurveTo(edge[2], edge[3], edge[4], edge[5], edge[6], edge[7]);
                ctx.stroke();
            }

            for (let edge of stackEdges) {
                ctx.lineWidth = 4;
                ctx.strokeStyle = '#222222';

                ctx.beginPath();
                ctx.moveTo(edge[0], edge[1]);
                ctx.bezierCurveTo(edge[2], edge[3], edge[4], edge[5], edge[6], edge[7]);
                ctx.stroke();
            }

            for (let child of node.children) {
                EDT_drawTreeNode(ctx, nodePositions, stackNodes, child);
            }
        }
    }

    const lt = (node === EDT_mouseNode) ? 'ff' : 'ee';
    const dk = (node === EDT_mouseNode) ? 'dd' : 'cc';

    if (node.type === 'player') {
        ctx.fillStyle = '#' + dk + dk + lt;
        ctx.beginPath();
        ctx.moveTo(nx + 0.40 * nw, ny + 0.00 * nh);
        ctx.lineTo(nx + 0.60 * nw, ny + 0.00 * nh);
        ctx.lineTo(nx + 1.00 * nw, ny + 0.40 * nh);
        ctx.lineTo(nx + 1.00 * nw, ny + 0.60 * nh);
        ctx.lineTo(nx + 0.60 * nw, ny + 1.00 * nh);
        ctx.lineTo(nx + 0.40 * nw, ny + 1.00 * nh);
        ctx.lineTo(nx + 0.00 * nw, ny + 0.60 * nh);
        ctx.lineTo(nx + 0.00 * nw, ny + 0.40 * nh);
        ctx.lineTo(nx + 0.40 * nw, ny + 0.00 * nh);
        ctx.fill();
    } else if (['win', 'lose', 'draw'].indexOf(node.type) >= 0) {
        ctx.fillStyle = '#' + lt + dk + dk;
        ctx.beginPath();
        ctx.moveTo(nx + 0.25 * nw, ny + 0.00 * nh);
        ctx.lineTo(nx + 0.75 * nw, ny + 0.00 * nh);
        ctx.lineTo(nx + 1.00 * nw, ny + 0.25 * nh);
        ctx.lineTo(nx + 1.00 * nw, ny + 0.75 * nh);
        ctx.lineTo(nx + 0.75 * nw, ny + 1.00 * nh);
        ctx.lineTo(nx + 0.25 * nw, ny + 1.00 * nh);
        ctx.lineTo(nx + 0.00 * nw, ny + 0.75 * nh);
        ctx.lineTo(nx + 0.00 * nw, ny + 0.25 * nh);
        ctx.lineTo(nx + 0.25 * nw, ny + 0.00 * nh);
        ctx.fill();
    } else if (['rewrite', 'set-board', 'set-board', 'layer-template', 'append-rows', 'append-cols', 'match', 'display-board'].indexOf(node.type) >= 0) {
        if (['rewrite', 'set-board', 'set-board', 'layer-template', 'append-rows', 'append-cols'].indexOf(node.type) >= 0) {
            ctx.fillStyle = '#' + dk + lt + dk;
        } else if (['match'].indexOf(node.type) >= 0) {
            ctx.fillStyle = '#' + dk + lt + lt;
        } else {
            ctx.fillStyle = '#' + dk + dk + dk;
        }
        ctx.beginPath();
        ctx.roundRect(nx, ny, nw, nh, 6)
        ctx.fill();
    } else {
        ctx.fillStyle = '#' + lt + lt + lt;
        ctx.beginPath();
        ctx.ellipse(nx + 0.5 * nw, ny + 0.5 * nh, 0.5 * nw, 0.5 * nh, 0, 0, 2 * Math.PI);
        ctx.fill();
    }

    if (stackNodes.has(node)) {
        ctx.lineWidth = 4;
        ctx.strokeStyle = '#222222';
        ctx.stroke();
    }

    ctx.fillStyle = '#222222'
    ctx.font = (nw / node.type.length) + 'px'
    ctx.fillText(node.type, nx + nw / 2, ny + nh / 2);
}

function EDT_updateCanvasSize(desiredWidth, desiredHeight) {
    EDT_canvas.width = desiredWidth * PIXEL_RATIO;
    EDT_canvas.height = desiredHeight * PIXEL_RATIO;
    EDT_canvas.style.width = desiredWidth + "px";
    EDT_canvas.style.height = desiredHeight + "px";
    EDT_resetXform();
}

function EDT_updateXformInv() {
    EDT_xformInv = EDT_ctx.getTransform();
    EDT_xformInv.invertSelf();
}

function EDT_resetXform() {
    EDT_ctx.resetTransform();
    EDT_ctx.scale(PIXEL_RATIO, PIXEL_RATIO);
    EDT_updateXformInv();
}

function EDT_translateXform(byx, byy) {
    EDT_ctx.translate(byx, byy);
    EDT_updateXformInv();
}

function EDT_zoomAroundXform(pt, scale) {
    EDT_ctx.translate(pt.x, pt.y);
    EDT_ctx.scale(scale, scale);
    EDT_ctx.translate(-pt.x, -pt.y);
    EDT_updateXformInv();
}

function EDT_collapseNodes(node, recurse, collapse) {
    if (node.hasOwnProperty('children')) {
        if (collapse) {
            EDT_collapsedNodes.add(node);
        } else {
            EDT_collapsedNodes.delete(node);
        }
        if (recurse) {
            for (let child of node.children) {
                EDT_collapseNodes(child, recurse, collapse);
            }
        }
    }
}

function EDT_onMouseDown(evt) {
    const mouseButton = evt.button;

    const mouseTime = Date.now();

    const isDouble = (EDT_mouseLastTime !== null && mouseTime - EDT_mouseLastTime <= DOUBLE_CLICK_TIME);

    if (EDT_mouseNode !== null) {
        if (isDouble) {
            EDT_collapseNodes(EDT_mouseNode, true, EDT_collapsedNodes.has(EDT_mouseNode));
            EDT_updatePositionsAndDraw(false);
        } else {
            EDT_collapseNodes(EDT_mouseNode, false, !EDT_collapsedNodes.has(EDT_mouseNode));
            EDT_updatePositionsAndDraw(true);
        }
    } else {
        if (isDouble) {
            EDT_resetXform();
        } else {
            if (mouseButton === BUTTON_LEFT) {
                EDT_mousePan = true;
            } else if (mouseButton === BUTTON_RIGHT) {
                EDT_mouseZoom = EDT_mousePos;
            }
        }
    }

    EDT_mouseLastTime = mouseTime;

    evt.preventDefault();
    window.requestAnimationFrame(EDT_onDraw);
}

function EDT_onMouseUp(evt) {
    const mouseButton = evt.button;

    EDT_mousePan = null;
    EDT_mouseZoom = null;

    evt.preventDefault();
    window.requestAnimationFrame(EDT_onDraw);
}

function EDT_onMouseMove(evt) {
    const rect = EDT_canvas.getBoundingClientRect();
    const mousePos_u = new DOMPoint((evt.clientX - rect.left) * PIXEL_RATIO, (evt.clientY - rect.top) * PIXEL_RATIO);

    let mousePos = EDT_xformInv.transformPoint(mousePos_u);

    EDT_mouseNode = null;

    if (EDT_mousePan !== null) {
        if (EDT_mousePos !== null) {
            EDT_translateXform(mousePos.x - EDT_mousePos.x, mousePos.y - EDT_mousePos.y);
            mousePos = EDT_xformInv.transformPoint(mousePos_u);
        }
    } else if (EDT_mouseZoom !== null) {
        if (EDT_mousePos !== null) {
            EDT_zoomAroundXform(EDT_mouseZoom, 1 + ((mousePos_u.y - EDT_mousePos_u.y) / 400));
            mousePos = EDT_xformInv.transformPoint(mousePos_u);
        }
    } else {
        for (let [node, rect] of EDT_nodePositions.entries()) {
            if (rect.x < mousePos.x && rect.y < mousePos.y && rect.x + rect.w > mousePos.x && rect.y + rect.h > mousePos.y) {
                EDT_mouseNode = node;
                break;
            }
        }
    }

    EDT_mousePos_u = mousePos_u;
    EDT_mousePos = mousePos;

    evt.preventDefault();
    window.requestAnimationFrame(EDT_onDraw);
}

function EDT_onMouseOut(evt) {
    EDT_mousePan = null;
    EDT_mouseZoom = null;

    EDT_mouseNode = null;
    EDT_mousePos_u = null;
    EDT_mousePos = null;

    evt.preventDefault();
    window.requestAnimationFrame(EDT_onDraw);
}

function EDT_onMouseWheel(evt) {
    if (EDT_mousePos !== null) {
        if (evt.deltaY < 0) {
            EDT_zoomAroundXform(EDT_mousePos, 1 + (10 / 400));
        } else {
            EDT_zoomAroundXform(EDT_mousePos, 1 - (10 / 400));
        }
    }

    evt.preventDefault();
    window.requestAnimationFrame(EDT_onDraw);
}

function EDT_onKeyDown(evt) {
    var key = evt.key;

    if (!EDT_keysDown.has(key)) {
        EDT_keysDown.add(key);

        if (key === 'f' || key === 'F') {
            EDT_followStack = !EDT_followStack;
        }
    }

    evt.preventDefault();
    window.requestAnimationFrame(EDT_onDraw);
}

function EDT_onKeyUp(evt) {
    var key = evt.key;

    EDT_keysDown.delete(key);

    evt.preventDefault();
}
