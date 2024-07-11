window.addEventListener('load', EDT_onload, false);



let EDT_canvas = null;
let EDT_ctx = null;

let EDT_nodeLocations = null;
let EDT_mousePan = null;
let EDT_mouseZoom = null;
let EDT_mousePos = null;
let EDT_mousePos_u = null;
let EDT_mouseLastTime = null;
let EDT_xformInv = null;
let EDT_mouseNode = null;

let EDT_collapsedNodes = null;



function EDT_onload() {
    document.oncontextmenu = function() {
        return false;
    }

    EDT_canvas = document.getElementById('editorcanvas');
    EDT_ctx = EDT_canvas.getContext('2d');

    EDT_nodeLocations = [];
    EDT_mousePan = null;
    EDT_mouseZoom = null;
    EDT_mousePos = null;
    EDT_mousePos_u = null;
    EDT_mouseLastTime = null;
    EDT_xformInv = null;
    EDT_mouseNode = null;

    EDT_collapsedNodes = new Set();

    EDT_canvas.addEventListener('mousedown', EDT_onMouseDown);
    EDT_canvas.addEventListener('mousemove', EDT_onMouseMove);
    EDT_canvas.addEventListener('mouseup', EDT_onMouseUp);
    EDT_canvas.addEventListener('mouseout', EDT_onMouseOut);
    EDT_canvas.addEventListener('wheel', EDT_onMouseWheel);

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

    EDT_nodeLocations = []

    EDT_drawTree(EDT_ctx, EDT_nodeLocations, GAME_SETUP.tree);
}

function EDT_drawTree(ctx, nodeLocations, tree) {
    var stackNodes = new Set();
    if (typeof ENG_callStack !== 'undefined' && ENG_callStack !== null) {
        for (var frame of ENG_callStack) {
            stackNodes.add(frame.node);
        }
    }

    var depth_index = new Map();
    EDT_drawTreeNode(ctx, nodeLocations, stackNodes, tree, 0, depth_index);
}

function EDT_drawTreeNode(ctx, nodeLocations, stackNodes, node, depth, depth_index) {
    const NODE_WIDTH = 80;
    const NODE_HEIGHT = 40;
    const NODE_SPACING = 25;

    var index = depth_index.has(depth) ? depth_index.get(depth) : 0;
    depth_index.set(depth, index + 1);

    const nx = (index + 1) * NODE_SPACING + index * NODE_WIDTH;
    const ny = (depth + 1) * NODE_SPACING + depth * NODE_HEIGHT;

    if (node.hasOwnProperty('children')) {
        if (EDT_collapsedNodes.has(node)) {
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
            ctx.lineTo(nx + NODE_WIDTH / 2 + childScale, ny + NODE_HEIGHT);
            ctx.moveTo(nx + NODE_WIDTH / 2 - childScale, ny + NODE_HEIGHT);
            ctx.lineTo(nx + NODE_WIDTH / 2, ny + NODE_HEIGHT + 5);
            ctx.lineTo(nx + NODE_WIDTH / 2 + childScale, ny + NODE_HEIGHT);
            ctx.fill();
            if (childOnStack) {
                ctx.lineWidth = 4;
                ctx.strokeStyle = '#222222';
                ctx.stroke();
            }
        } else {
            const child_depth = depth + 1;
            let stackEdges = [];
            for (let child of node.children) {
                var child_index = depth_index.has(child_depth) ? depth_index.get(child_depth) : 0;
                if (child_index < index) {
                    child_index = index;
                    depth_index.set(child_depth, child_index);
                }
                const cnx = (child_index + 1) * NODE_SPACING + child_index * NODE_WIDTH;
                const cny = (child_depth + 1) * NODE_SPACING + child_depth * NODE_HEIGHT;

                const edge = [nx + NODE_WIDTH / 2, ny + NODE_HEIGHT,
                              nx + NODE_WIDTH / 2, cny - NODE_SPACING / 2,
                              cnx + NODE_WIDTH / 2, cny - NODE_SPACING / 2,
                              cnx + NODE_WIDTH / 2, cny];

                if (stackNodes.has(child)) {
                    stackEdges.push(edge)
                } else {
                    ctx.lineWidth = 2;
                    ctx.strokeStyle = '#444488';

                    ctx.beginPath();
                    ctx.moveTo(edge[0], edge[1]);
                    ctx.bezierCurveTo(edge[2], edge[3], edge[4], edge[5], edge[6], edge[7]);
                    ctx.stroke();
                }

                EDT_drawTreeNode(ctx, nodeLocations, stackNodes, child, child_depth, depth_index);
            }

            for (let edge of stackEdges) {
                ctx.lineWidth = 4;
                ctx.strokeStyle = '#222222';

                ctx.beginPath();
                ctx.moveTo(edge[0], edge[1]);
                ctx.bezierCurveTo(edge[2], edge[3], edge[4], edge[5], edge[6], edge[7]);
                ctx.stroke();
            }
        }
    }

    if (node === EDT_mouseNode) {
        ctx.fillStyle = '#ddffff';
    } else {
        ctx.fillStyle = '#cceeee';
    }
    ctx.beginPath();
    ctx.roundRect(nx, ny, NODE_WIDTH, NODE_HEIGHT, 6)
    ctx.fill();

    if (stackNodes.has(node)) {
        ctx.lineWidth = 4;
        ctx.strokeStyle = '#222222';
        ctx.stroke();
    }

    ctx.fillStyle = '#222222'
    ctx.font = (NODE_WIDTH / node.type.length) + 'px'
    ctx.fillText(node.type, nx + NODE_WIDTH / 2, ny + NODE_HEIGHT / 2);

    nodeLocations.push({rect:[nx, ny, nx + NODE_WIDTH, ny + NODE_HEIGHT], node:node});
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
        for (const {rect, node} of EDT_nodeLocations) {
            if (rect[0] < mousePos.x && rect[1] < mousePos.y && rect[2] > mousePos.x && rect[3] > mousePos.y) {
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
