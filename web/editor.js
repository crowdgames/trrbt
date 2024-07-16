window.addEventListener('load', EDT_onload, false);



let EDT_canvas = null;
let EDT_ctx = null;
let EDT_propertyEditor = null;
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
let EDT_propertyNodes = null;
let EDT_clipboard = null;

let EDT_followStack = false;
let EDT_collapsedNodes = null;

const EDT_NODE_SPACING = 25;

const EDT_FONT_SIZE = 10;
const EDT_FONT_CHAR_SIZE = 6;
const EDT_FONT_LINE_SIZE = 12;



const EDT_EMPTY_PATTERN = {main:[[]]}
const EDT_NODE_PROTOTYPES = [
    { type:'player', children:[], pid:'' },

    { type:'win', children:[], pid:'' },
    { type:'lose', children:[], pid:'' },
    { type:'draw', children:[] },

    { type:'order', children:[] },
    { type:'all', children:[] },
    { type:'none', children:[] },
    { type:'random-try', children:[] },
    { type:'loop-until-all', children:[] },
    { type:'loop-times', children:[], times:1 },

    { type:'rewrite', lhs:EDT_EMPTY_PATTERN, rhs:EDT_EMPTY_PATTERN },
    { type:'match', pattern:EDT_EMPTY_PATTERN },
    { type:'set-board', pattern:EDT_EMPTY_PATTERN },
]

function EDT_onload() {
    document.oncontextmenu = function() {
        return false;
    }

    EDT_canvas = document.getElementById('editorcanvas');
    EDT_ctx = EDT_canvas.getContext('2d');
    EDT_propertyEditor = document.getElementById('editordiv');
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
    EDT_propertyNodes = null;
    EDT_clipboard = null;

    EDT_followStack = false;
    EDT_collapsedNodes = new Set();

    EDT_canvas.addEventListener('mousedown', EDT_onMouseDown);
    EDT_canvas.addEventListener('mousemove', EDT_onMouseMove);
    EDT_canvas.addEventListener('mouseup', EDT_onMouseUp);
    EDT_canvas.addEventListener('mouseout', EDT_onMouseOut);
    EDT_canvas.addEventListener('wheel', EDT_onMouseWheel);
    EDT_canvas.addEventListener('keydown', EDT_onKeyDown);
    EDT_canvas.addEventListener('keyup', EDT_onKeyUp);

    EDT_updateCanvasSize(EDT_canvas.width, EDT_canvas.height);

    window.requestAnimationFrame(EDT_onDraw);
}

function EDT_onDraw() {
    const currentXform = EDT_ctx.getTransform();

    EDT_ctx.resetTransform();
    EDT_ctx.scale(PIXEL_RATIO, PIXEL_RATIO);
    EDT_ctx.clearRect(0, 0, EDT_canvas.width, EDT_canvas.height);
    EDT_ctx.fillStyle = '#eeeeee';
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

function EDT_updatePositionsAndDraw(skipAnimate) {
    if (skipAnimate) {
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
    return 0.15 * (des - curr);
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
    } else if (['rewrite', 'match', 'set-board'].indexOf(node.type) >= 0) {
        nw = 50;
        nh = 10;

        var line = 1;

        const multChars = (node.type === 'rewrite') ? 2 : 1;
        const addChars = (node.type === 'rewrite') ? 3 : 0;

        const pattern = (node.type === 'rewrite') ? node.lhs : node.pattern;
        const layers = Object.getOwnPropertyNames(pattern);

        for (const layer of layers) {
            nw = Math.max(nw, 10 + EDT_FONT_CHAR_SIZE * (multChars * (2 * pattern[layer][0].length - 1) + addChars))
            if (layers.length === 1 && layers[0] === 'main') {
                // pass
            } else {
                ++ line;
            }
            line += pattern[layer].length;
        }

        nh += EDT_FONT_LINE_SIZE * line;
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
        if (EDT_nodeCollapsed(node, stackNodes) && node.children.length > 0) {
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

    const lt = (node === EDT_mouseNode) ? 'dd' : 'cc';
    const dk = (node === EDT_mouseNode) ? 'bb' : 'aa';

    ctx.font = '10px sans-serif';

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

        ctx.fillStyle = '#222222'
        ctx.fillText(node.type + ': ' + node.pid, nx + nw / 2, ny + nh / 2);
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

        ctx.fillStyle = '#222222'
        if (['win', 'lose'].indexOf(node.type) >= 0) {
            ctx.fillText(node.type + ': ' + node.pid, nx + nw / 2, ny + nh / 2);
        } else {
            ctx.fillText(node.type, nx + nw / 2, ny + nh / 2);
        }
    } else if (['rewrite', 'match', 'set-board', 'layer-template', 'append-rows', 'append-cols', 'display-board'].indexOf(node.type) >= 0) {
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

        const textx = nx + nw / 2;
        var line = 1;

        ctx.fillStyle = '#222222'
        ctx.fillText(node.type, textx, ny + EDT_FONT_LINE_SIZE * line);
        ++ line;

        if (['rewrite', 'match', 'set-board', 'set-board', 'append-rows', 'append-cols'].indexOf(node.type) >= 0) {
            const pattern = (node.type === 'rewrite') ? node.lhs : node.pattern;
            const layers = Object.getOwnPropertyNames(pattern);

            for (const layer of layers) {
                if (EDT_FONT_LINE_SIZE * (line + 0.3) > nh) {
                    break;
                }
                if (layers.length === 1 && layers[0] === 'main') {
                    // pass
                } else {
                    ctx.fillStyle = '#888888'
                    ctx.font = 'italic 10px sans-serif';
                    ctx.fillText('- ' + layer + ' -', textx, ny + EDT_FONT_LINE_SIZE * line);
                    ++ line;
                }
                ctx.fillStyle = '#222222'
                ctx.font = '10px Courier New';

                for (let ii = 0; ii < pattern[layer].length; ++ ii) {
                    if (EDT_FONT_LINE_SIZE * (line + 0.3) > nh) {
                        break;
                    }
                    if (node.type === 'rewrite') {
                        const connect = (ii === 0) ? ' → ' : '   ';
                        const lhs = node.lhs[layer][ii].join(' ');
                        const rhs = node.rhs.hasOwnProperty(layer) ? node.rhs[layer][ii].join(' ') : ' '.repeat(lhs.length);
                        ctx.fillText(lhs + connect + rhs, textx, ny + EDT_FONT_LINE_SIZE * line);
                    } else {
                        ctx.fillText(node.pattern[layer][ii].join(' '), textx, ny + EDT_FONT_LINE_SIZE * line);
                    }
                    ++ line;
                }
            }
        }
    } else {
        ctx.fillStyle = '#' + lt + lt + lt;
        ctx.beginPath();
        ctx.ellipse(nx + 0.5 * nw, ny + 0.5 * nh, 0.5 * nw, 0.5 * nh, 0, 0, TAU);
        ctx.fill();

        ctx.fillStyle = '#222222'
        ctx.fillText(node.type, nx + nw / 2, ny + nh / 2);
    }

    if (stackNodes.has(node)) {
        ctx.lineWidth = 4;
        ctx.strokeStyle = '#222222';
        ctx.stroke();
    }

    if (EDT_propertyNodes !== null && node === EDT_propertyNodes.node) {
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#880088';
        ctx.stroke();
    }
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
        if (collapse && node.children.length > 0) {
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

function EDT_htmlTextProperty(id, name, value) {
    var html = '';
    html += '<li/>';
    html += '<label for="' + id + '">' + name + '</label><br/>';
    html += '<input type="text" id="prop_' + id + '" name="' + id + '" value="' + value + '"/><br/>';
    return html;
}

function EDT_htmlPatternProperty(id, name, value) {
    var html = '';
    html += '<li/>';
    html += '<label for="' + id + '">' + name + ': </label><br/>';

    var rows = 0;
    var cols = 0;
    var text = '';

    const layers = Object.getOwnPropertyNames(value);
    for (const layer of layers) {
        if (layers.length === 1 && layers[0] === 'main') {
            // pass
        } else {
            text += ' ' + layer + '\n';
            rows += 1;
            cols = Math.max(cols, layer.length + 1);
        }

        for (const row of value[layer]) {
            const rowText = row.join(' ');
            text += rowText + '\n';
            rows += 1;
            cols = Math.max(cols, rowText.length);
        }
    }
    rows = Math.max(4, rows + 2);
    cols = Math.max(8, cols + 2);
    html += '<textarea id="prop_' + id + '" name="' + id + '" rows="' + rows + '" cols= "' + cols + '">' + text + '</textarea><br/>'
    return html;
}

function EDT_parsePatternProperty(id) {
    var pattern = {};
    var layer = 'main';
    const text = document.getElementById(id).value;

    for (const line of text.split('\n')) {
        const tline = line.trimEnd();
        if (tline.length === 0) {
            continue;
        }
        if (tline[0] === ' ') {
            layer = tline.trim();
        } else {
            var row = tline.split(' ');
            if (!pattern.hasOwnProperty(layer)) {
                pattern[layer] = [];
            }
            pattern[layer].push(row);
        }
    }
    return pattern;
}

function EDT_updatePropertyEditor(node) {
    if (EDT_propertyNodes === null || node !== EDT_propertyNodes.node) {
        EDT_propertyNodes = (node !== null) ? { node:node, parent:EDT_findNodeParent(GAME_SETUP.tree, node) } : null;
        if (EDT_propertyNodes) {
            const parent = EDT_propertyNodes.parent;

            var html = ''
            html += '<b>' + node.type + '</b><br/>'

            if (parent !== null) {
                html += '<input type="button" value="Move Earlier" onClick="EDT_onNodeShift(true)"/>'
                html += '<input type="button" value="Move Later" onClick="EDT_onNodeShift(false)"/>'
            }
            html += '<br/>'
            html += '<br/>'

            html += '<input type="button" value="Copy Subtree" onClick="EDT_onNodeCopy(false)"/>'
            html += '<input type="button" value="Cut Subtree" onClick="EDT_onNodeCopy(true)"/>'
            if (EDT_clipboard !== null) {
                if (node.hasOwnProperty('children')) {
                    if (node.type === 'player' && EDT_clipboard.type !== 'rewrite') {
                        // pass
                    } else {
                        html += '<input type="button" value="Paste Subtree" onClick="EDT_onNodePaste()"/>'
                    }
                }
            }
            html += '<br/>'
            html += '<br/>'

            if (node.hasOwnProperty('children')) {
                if (node !== GAME_SETUP.tree) {
                    html += '<input type="button" value="Delete and Reparent" onClick="EDT_onNodeDelete(true)"/>'
                    html += '<input type="button" value="Delete Subtree" onClick="EDT_onNodeDelete(false)"/>'
                }
                html += '<input type="button" value="Delete Children" onClick="EDT_onNodeDeleteChildren()"/>'
            } else if (node !== GAME_SETUP.tree) {
                html += '<input type="button" value="Delete" onClick="EDT_onNodeDelete(false)"/>'
            }
            html += '<br/>'
            html += '<br/>'

            if (node.hasOwnProperty('children')) {
                for (const proto of EDT_NODE_PROTOTYPES) {
                    if (node.type === 'player' && proto.type !== 'rewrite') {
                        // pass
                    } else {
                        html += '<input type="button" value="Add ' + proto.type + '" onClick="EDT_onNodeAddChild(\'' + proto.type + '\')"/>'
                    }
                }
                html += '<br/>'
                html += '<br/>'
            }

            var anyProperties = false;
            html += '<div id="propertyform">'
            html += '<ul>'
            if (node.hasOwnProperty('pid')) {
                html += EDT_htmlTextProperty('pid', 'player id', node.pid);
                anyProperties = true;
            }
            if (node.hasOwnProperty('times')) {
                html += EDT_htmlTextProperty('times', 'times', node.times);
                anyProperties = true;
            }
            if (node.hasOwnProperty('pattern')) {
                html += EDT_htmlPatternProperty('pattern', 'pattern', node.pattern);
                anyProperties = true;
            }
            if (node.hasOwnProperty('lhs')) {
                html += EDT_htmlPatternProperty('lhs', 'LHS', node.lhs);
                anyProperties = true;
            }
            if (node.hasOwnProperty('rhs')) {
                html += EDT_htmlPatternProperty('rhs', 'RHS', node.rhs);
                anyProperties = true;
            }
            html += '</ul>'
            if (anyProperties) {
                html += '<input type="button" value="Save" onClick="EDT_onNodeSaveProperties()">'
                html += '<br/>'
                html += '<br/>'
            }

            if (typeof ENG_onLoad !== 'undefined') {
                html += '<br/>'
                html += '<br/>'
                html += '<input type="button" value="Restart" onClick="ENG_onLoad()">'
            }

            html += '</div>'
            EDT_propertyEditor.innerHTML = html;
        } else {
            EDT_propertyEditor.innerHTML = '';
        }
    }
}

function EDT_onNodeSaveProperties() {
    var node = EDT_propertyNodes.node;

    if (node.hasOwnProperty('pid')) {
        node.pid = document.getElementById('prop_pid').value;
    }
    if (node.hasOwnProperty('times')) {
        node.pid = document.getElementById('prop_times').value;
    }
    if (node.hasOwnProperty('pattern')) {
        node.pattern = EDT_parsePatternProperty('prop_pattern');
    }
    if (node.hasOwnProperty('lhs')) {
        node.lhs = EDT_parsePatternProperty('prop_lhs');
    }
    if (node.hasOwnProperty('rhs')) {
        node.rhs = EDT_parsePatternProperty('prop_rhs');
    }

    EDT_updatePositionsAndDraw();
}

function EDT_findNodeParent(from, node) {
    if (from.hasOwnProperty('children')) {
        for (let child of from.children) {
            if (child === node) {
                return from;
            }
            const found = EDT_findNodeParent(child, node);
            if (found !== null) {
                return found;
            }
        }
    }
    return null;
}

function EDT_onNodeCopy(cut) {
    var node = EDT_propertyNodes.node;

    EDT_clipboard = deepcopyobj(node);

    if (cut) {
        EDT_onNodeDelete(false);
    } else {
        EDT_updatePositionsAndDraw();
    }
}

function EDT_onNodePaste() {
    var node = EDT_propertyNodes.node;

    if (EDT_clipboard !== null) {
        node.children.push(deepcopyobj(EDT_clipboard));
        EDT_updatePositionsAndDraw();
    }
}

function EDT_onNodeDelete(reparentChildren) {
    var node = EDT_propertyNodes.node;
    var parent = EDT_propertyNodes.parent;

    if (parent !== null) {
        const index = parent.children.indexOf(node);
        if (index >= 0) {
            if (reparentChildren) {
                parent.children.splice(index, 1, ...node.children);
            } else {
                parent.children.splice(index, 1);
            }
            EDT_updatePositionsAndDraw();
        }
    }
}

function EDT_onNodeDeleteChildren() {
    var node = EDT_propertyNodes.node;

    node.children = [];

    EDT_collapseNodes(node, false);
    EDT_updatePositionsAndDraw();
}

function EDT_onNodeAddChild(type) {
    var node = EDT_propertyNodes.node;

    for (const proto of EDT_NODE_PROTOTYPES) {
        if (proto.type === type) {
            node.children.push(deepcopyobj(proto));
            EDT_updatePositionsAndDraw();
            break;
        }
    }
}

function EDT_onNodeShift(earlier) {
    var node = EDT_propertyNodes.node;
    var parent = EDT_propertyNodes.parent;

    if (parent !== null) {
        const index = parent.children.indexOf(node);
        if (index >= 0) {
            if (earlier && index > 0) {
                parent.children.splice(index, 1);
                parent.children.splice(index - 1, 0, node);
                EDT_updatePositionsAndDraw();
            } else if (!earlier && index + 1 < parent.children.length) {
                parent.children.splice(index, 1);
                parent.children.splice(index + 1, 0, node);
                EDT_updatePositionsAndDraw();
            }
        }
    }
}

function EDT_onMouseDown(evt) {
    EDT_canvas.focus();

    const mouseButton = evt.button;

    const mouseTime = Date.now();

    const isDouble = (EDT_mouseLastTime !== null && mouseTime - EDT_mouseLastTime <= DOUBLE_CLICK_TIME);

    if (EDT_mouseNode !== null) {
        if (EDT_propertyNodes !== null && EDT_mouseNode === EDT_propertyNodes.node) {
            if (isDouble) {
                EDT_collapseNodes(EDT_mouseNode, true, EDT_collapsedNodes.has(EDT_mouseNode));
                EDT_updatePositionsAndDraw(true);
            } else {
                EDT_collapseNodes(EDT_mouseNode, false, !EDT_collapsedNodes.has(EDT_mouseNode));
                EDT_updatePositionsAndDraw();
            }
        }

        EDT_updatePropertyEditor(EDT_mouseNode);
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

        EDT_updatePropertyEditor(null);
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
            EDT_updatePositionsAndDraw();
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
