window.addEventListener('load', EDT_onload, false);



let EDT_canvas = null;
let EDT_ctx = null;
let EDT_keysDown = new Set();

let EDT_nodeLocations = null;
let EDT_mousePan = null;
let EDT_mouseZoom = null;
let EDT_mousePos = null;
let EDT_mousePos_u = null;
let EDT_mouseLastTime = null;
let EDT_xformInv = null;
let EDT_mouseNode = null;

let EDT_followStack = false;
let EDT_collapsedNodes = null;



function EDT_onload() {
    document.oncontextmenu = function() {
        return false;
    }

    EDT_canvas = document.getElementById('editorcanvas');
    EDT_ctx = EDT_canvas.getContext('2d');
    EDT_keysDown = new Set();

    EDT_nodeLocations = new Map();
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

    EDT_nodeLocations = new Map();

    EDT_updateDesiredPositionsTree(EDT_nodeLocations, GAME_SETUP.tree);
    EDT_drawTree(EDT_ctx, EDT_nodeLocations, GAME_SETUP.tree);
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

function EDT_updateDesiredPositionsTree(nodeLocations, tree) {
    nodeLocations.clear()

    EDT_updateDesiredPositionsTreeNode(nodeLocations, EDT_getStackNodes(), tree, 0, [0]);
}

function EDT_updateDesiredPositionsTreeNode(nodeLocations, stackNodes, node, depth, index_arr) {
    const NODE_WIDTH = 80;
    const NODE_HEIGHT = 40;
    const NODE_SPACING = 25;

    const index = index_arr[0];
    const nx = (index + 1) * NODE_SPACING + index * NODE_WIDTH;
    const ny = (depth + 1) * NODE_SPACING + depth * NODE_HEIGHT;

    if (node.hasOwnProperty('children')) {
        if (!EDT_nodeCollapsed(node, stackNodes)) {
            let child_number = 0;
            for (let child of node.children) {
                EDT_updateDesiredPositionsTreeNode(nodeLocations, stackNodes, child, depth + 1, index_arr);

                child_number += 1;
                if (child_number < node.children.length) {
                    index_arr[0] += 1;
                }
            }
        }
    }

    nodeLocations.set(node, {x:nx, y:ny, w:NODE_WIDTH, h:NODE_HEIGHT})
}

function EDT_drawTree(ctx, nodeLocations, tree) {
    EDT_drawTreeNode(ctx, nodeLocations, EDT_getStackNodes(), tree);
}

function EDT_drawTreeNode(ctx, nodeLocations, stackNodes, node) {
    const nrect = nodeLocations.get(node);
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
                const cnrect = nodeLocations.get(child);
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
                EDT_drawTreeNode(ctx, nodeLocations, stackNodes, child);
            }
        }
    }

    if (node === EDT_mouseNode) {
        ctx.fillStyle = '#ddffff';
    } else {
        ctx.fillStyle = '#cceeee';
    }
    ctx.beginPath();
    ctx.roundRect(nx, ny, nw, nh, 6)
    ctx.fill();

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
        } else {
            EDT_collapseNodes(EDT_mouseNode, false, !EDT_collapsedNodes.has(EDT_mouseNode));
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
        for (let [node, rect] of EDT_nodeLocations.entries()) {
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
