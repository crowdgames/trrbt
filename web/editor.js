window.addEventListener('load', EDT_onload, false);



let EDT_canvas = null;
let EDT_ctx = null;
let EDT_propertyEditor = null;
let EDT_keysDown = new Set();

let EDT_nodeDrawTexts = null;
let EDT_nodeDrawPositions = null;
let EDT_nodeDrawPositionsDesired = null;
let EDT_nodeDrawPositionsWantUpdate = true;
let EDT_nodeDrawLastTime = null

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

let EDT_layout_horizontal = null;



const EDT_NODE_PADDING = 8;
const EDT_NODE_SPACING = 25;

const EDT_FONT_SIZE = 10;
const EDT_FONT_CHAR_SIZE = 6;
const EDT_FONT_LINE_SIZE = 12;

const EDT_TEXT_FONT  = 0;
const EDT_TEXT_COLOR = 1;
const EDT_TEXT_LINE  = 2;

const EDT_BUTTONS = [null, 'up', 'down', 'left', 'right', 'action1', 'action2'];

const EDT_EMPTY_PATTERN = {}
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

    { type:'rewrite', button:null, lhs:EDT_EMPTY_PATTERN, rhs:EDT_EMPTY_PATTERN },
    { type:'set-board', pattern:EDT_EMPTY_PATTERN },

    { type:'match', pattern:EDT_EMPTY_PATTERN },
]

const EDT_LT     = 'cc';
const EDT_LT_SEL = 'dd';
const EDT_DK     = 'aa';
const EDT_DK_SEL = 'bb';

function EDT_nodeColor(type, sel) {
    const lt = sel ? 'dd' : 'cc';
    const dk = sel ? 'bb' : 'aa';

    if (type === 'player') {
        return '#' + dk + dk + lt;
    } else if (['win', 'lose', 'draw'].indexOf(type) >= 0) {
        return '#' + lt + dk + dk;
    } else if (['rewrite', 'set-board', 'layer-template', 'append-rows', 'append-cols'].indexOf(type) >= 0) {
        return '#' + dk + lt + dk;
    } else if (['match'].indexOf(type) >= 0) {
        return '#' + dk + lt + lt;
    } else if (['display-board'].indexOf(type) >= 0) {
        return '#' + dk + dk + dk;
    } else {
        return '#' + lt + lt + lt;
    }
}

function EDT_onload() {
    document.oncontextmenu = function() {
        return false;
    }

    EDT_canvas = document.getElementById('editorcanvas');
    EDT_ctx = EDT_canvas.getContext('2d');
    EDT_propertyEditor = document.getElementById('editordiv');
    EDT_keysDown = new Set();

    EDT_nodeDrawTexts = new Map();
    EDT_nodeDrawPositions = new Map();
    EDT_nodeDrawPositionsDesired = new Map();
    EDT_nodeDrawPositionsWantUpdate = true;
    EDT_nodeDrawLastTime = null;

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

    EDT_layout_horizontal = true;

    EDT_canvas.addEventListener('mousedown', EDT_onMouseDown);
    EDT_canvas.addEventListener('mousemove', EDT_onMouseMove);
    EDT_canvas.addEventListener('mouseup', EDT_onMouseUp);
    EDT_canvas.addEventListener('mouseout', EDT_onMouseOut);
    EDT_canvas.addEventListener('wheel', EDT_onMouseWheel);
    EDT_canvas.addEventListener('keydown', EDT_onKeyDown);
    EDT_canvas.addEventListener('keyup', EDT_onKeyUp);

    EDT_updateCanvasSize(EDT_canvas.width, EDT_canvas.height);

    EDT_updatePropertyEditor(EDT_mouseNode);

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

    if (EDT_nodeDrawPositionsWantUpdate) {
        EDT_nodeDrawPositionsDesired = new Map();
        EDT_updateDesiredPositionsTree(EDT_nodeDrawPositionsDesired, EDT_nodeDrawTexts, GAME_SETUP.tree);

        var anyNodeMoved = false;
        if (EDT_nodeDrawLastTime !== null) {
            anyNodeMoved = EDT_updateNodePositions(EDT_nodeDrawPositions, EDT_nodeDrawPositionsDesired, EDT_nodeDrawTexts, drawTime - EDT_nodeDrawLastTime);
        } else {
            EDT_nodeDrawPositions = EDT_nodeDrawPositionsDesired
        }

        if (anyNodeMoved) {
            window.requestAnimationFrame(EDT_onDraw);
        } else {
            EDT_nodeDrawPositionsWantUpdate = false;
        }
    }

    EDT_drawTree(EDT_ctx, EDT_nodeDrawPositions, EDT_nodeDrawTexts, GAME_SETUP.tree);

    EDT_nodeDrawLastTime = drawTime;
}

function EDT_updatePositionsAndDraw(skipAnimate) {
    if (skipAnimate) {
        EDT_nodeDrawLastTime = null; // prevents node sliding animation
    }
    EDT_nodeDrawPositionsWantUpdate = true;
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

function EDT_updateNodePositions(nodePositions, nodePositionsDesired, nodeTexts, deltaTime) {
    var anyMoved = false;

    var toDelete = [];
    for (let node of nodePositions.keys()) {
        if (!nodePositionsDesired.has(node)) {
            toDelete.push(node);
        }
    }
    for (let node of toDelete) {
        nodePositions.delete(node);
        nodeTexts.delete(node);
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

function EDT_getTileSize(patterns) {
    var size = 1;
    for (const pattern of patterns) {
        for (const layer of Object.getOwnPropertyNames(pattern)) {
            for (const row of pattern[layer]) {
                for (const tile of row) {
                    size = Math.max(size, tile.length);
                }
            }
        }
    }
    return size;
}

function EDT_joinRow(row, tileSize, alwaysPad) {
    var rowStr = '';
    for (let ii = 0; ii < row.length; ++ ii) {
        if (ii + 1 < row.length) {
            rowStr += row[ii].padEnd(tileSize) + ' ';
        } else if (alwaysPad) {
            rowStr += row[ii].padEnd(tileSize);
        } else {
            rowStr += row[ii];
        }
    }
    return rowStr;
}

function EDT_updateDesiredPositionsTree(nodePositions, nodeTexts, tree) {
    nodePositions.clear();
    nodeTexts.clear();

    EDT_updateDesiredPositionsTreeNode(nodePositions, nodeTexts, EDT_getStackNodes(), tree, EDT_NODE_SPACING, EDT_NODE_SPACING, null);
}

function EDT_updateDesiredPositionsTreeNode(nodePositions, nodeTexts, stackNodes, node, xpos, ypos, align) {
    var texts = [];
    texts.push({type:EDT_TEXT_FONT,  data:'bold 10px sans-serif'});
    texts.push({type:EDT_TEXT_COLOR, data:'#222222'});
    texts.push({type:EDT_TEXT_LINE,  data:node.type});
    texts.push({type:EDT_TEXT_FONT,  data:'10px sans-serif'});

    if (node.hasOwnProperty('pid')) {
        texts.push({type:EDT_TEXT_LINE,  data:'pid: ' + node.pid});
    }

    if (node.hasOwnProperty('times')) {
        texts.push({type:EDT_TEXT_LINE,  data:'times: ' + node.times});
    }

    if (node.hasOwnProperty('what')) {
        texts.push({type:EDT_TEXT_LINE,  data:'what: ' + node.what});
    }

    if (node.hasOwnProperty('with')) {
        texts.push({type:EDT_TEXT_LINE,  data:'with: ' + node.with});
    }

    if (node.hasOwnProperty('button') && node.button !== null) {
        texts.push({type:EDT_TEXT_LINE,  data:'[' + node.button + ']'});
    }

    if (node.hasOwnProperty('pattern')) {
        const layers = Object.getOwnPropertyNames(node.pattern);
        const tileSize = EDT_getTileSize([node.pattern]);

        for (const layer of layers) {
            if (layers.length === 1 && layers[0] === 'main') {
                // pass
            } else {
                texts.push({type:EDT_TEXT_FONT,  data:'italic 10px sans-serif'});
                texts.push({type:EDT_TEXT_COLOR, data:'#888888'});
                texts.push({type:EDT_TEXT_LINE,  data:'- ' + layer + ' -'});
            }

            texts.push({type:EDT_TEXT_FONT,  data:'10px Courier New'});
            texts.push({type:EDT_TEXT_COLOR, data:'#222222'});

            for (let ii = 0; ii < node.pattern[layer].length; ++ ii) {
                texts.push({type:EDT_TEXT_LINE, data:EDT_joinRow(node.pattern[layer][ii], tileSize, false)});
            }
        }
    }

    if (node.hasOwnProperty('lhs') || node.hasOwnProperty('rhs')) {
        var layers = [];
        var patterns = [];
        if (node.hasOwnProperty('lhs')) {
            for (const layer of Object.getOwnPropertyNames(node.lhs)) {
                layers.push(layer);
            }
            patterns.push(node.lhs);
        }
        if (node.hasOwnProperty('rhs')) {
            for (const layer of Object.getOwnPropertyNames(node.rhs)) {
                if (layers.indexOf(layer) === -1) {
                    layers.push(layer);
                }
            }
            patterns.push(node.rhs);
        }
        const mainIndex = layers.indexOf('main');
        if (mainIndex > 0) {
            layers.splice(mainIndex, 1);
            layers.shift('main');
        }

        const tileSize = EDT_getTileSize(patterns);

        for (const layer of layers) {
            if (layers.length === 1 && layers[0] === 'main') {
                // pass
            } else {
                texts.push({type:EDT_TEXT_FONT,  data:'italic 10px sans-serif'});
                texts.push({type:EDT_TEXT_COLOR, data:'#888888'});
                texts.push({type:EDT_TEXT_LINE,  data:'- ' + layer + ' -'});
            }

            texts.push({type:EDT_TEXT_FONT,  data:'10px Courier New'});
            texts.push({type:EDT_TEXT_COLOR, data:'#222222'});

            const length = node.lhs.hasOwnProperty(layer) ? node.lhs[layer].length : node.rhs[layer].length;
            for (let ii = 0; ii < length; ++ ii) {
                const connect = (ii === 0) ? ' → ' : '   ';
                var lhs = node.lhs.hasOwnProperty(layer) ? EDT_joinRow(node.lhs[layer][ii], tileSize, true) : null;
                var rhs = node.rhs.hasOwnProperty(layer) ? EDT_joinRow(node.rhs[layer][ii], tileSize, true) : null;
                lhs = (lhs !== null) ? lhs : ' '.repeat(rhs.length);
                rhs = (rhs !== null) ? rhs : ' '.repeat(lhs.length);
                texts.push({type:EDT_TEXT_LINE,  data:lhs + connect + rhs});
            }
        }
    }

    var nx = xpos;
    var ny = ypos;

    var nw = 2 * EDT_NODE_PADDING;
    var nh = 2 * EDT_NODE_PADDING;

    for (const text of texts) {
        if (text.type === EDT_TEXT_LINE) {
            nw = Math.max(nw, 2 * EDT_NODE_PADDING + EDT_FONT_CHAR_SIZE * text.data.length);
            nh += EDT_FONT_LINE_SIZE;
        }
    }

    //nw = Math.max(nw, 40);
    //nh = Math.max(nh, 40);

    if (align !== null) {
        if (EDT_layout_horizontal) {
            nx = Math.max(nx, nx + 0.5 * align - 0.5 * nw);
        } else {
            ny = Math.max(ny, ny + 0.5 * align - 0.5 * nh);
        }
    }

    let next_pos = EDT_layout_horizontal ? (nx + nw + EDT_NODE_SPACING) : (ny + nh + EDT_NODE_SPACING);

    if (node.hasOwnProperty('children')) {
        if (!EDT_nodeCollapsed(node, stackNodes)) {
            let child_next_pos = EDT_layout_horizontal ? nx : ny;
            let child_align = EDT_layout_horizontal ? nw : nh;
            for (let child of node.children) {
                const child_xpos = EDT_layout_horizontal ? child_next_pos : (nx + nw + EDT_NODE_SPACING);
                const child_ypos = EDT_layout_horizontal ? (ny + nh + EDT_NODE_SPACING) : child_next_pos;

                child_next_pos = EDT_updateDesiredPositionsTreeNode(nodePositions, nodeTexts, stackNodes, child, child_xpos, child_ypos, child_align);
                child_align = null;
            }
            next_pos = Math.max(next_pos, child_next_pos);
        }
    }

    nodePositions.set(node, {x:nx, y:ny, w:nw, h:nh})
    nodeTexts.set(node, texts);

    return next_pos;
}

function EDT_drawTree(ctx, nodePositions, nodeTexts, tree) {
    EDT_drawTreeNode(ctx, nodePositions, nodeTexts, EDT_getStackNodes(), tree);
}

function EDT_drawTreeNode(ctx, nodePositions, nodeTexts, stackNodes, node) {
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
            if (EDT_layout_horizontal) {
                ctx.moveTo(nx + nw / 2 - childScale, ny + nh);
                ctx.lineTo(nx + nw / 2, ny + nh + 5);
                ctx.lineTo(nx + nw / 2 + childScale, ny + nh);
            } else {
                ctx.moveTo(nx + nw, ny + nh / 2 - childScale);
                ctx.lineTo(nx + nw + 5, ny + nh / 2);
                ctx.lineTo(nx + nw, ny + nh / 2 + childScale);
            }
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

                const midx = 0.5 * (nx + nw + cnx);
                const midy = 0.5 * (ny + nh + cny);

                const edge = EDT_layout_horizontal ?
                      [nx + nw / 2, ny + nh,
                       nx + nw / 2, midy,
                       cnx + cnw / 2, midy,
                       cnx + cnw / 2, cny] :
                      [nx + nw, ny + nh / 2,
                       midx, ny + nh / 2,
                       midx, cny + cnh / 2,
                       cnx, cny + cnh / 2];

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
                EDT_drawTreeNode(ctx, nodePositions, nodeTexts, stackNodes, child);
            }
        }
    }

    ctx.fillStyle = EDT_nodeColor(node.type, node === EDT_mouseNode);

    if (['player'].indexOf(node.type) >= 0) {
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
    } else if (['rewrite', 'match', 'set-board', 'layer-template', 'append-rows', 'append-cols', 'display-board'].indexOf(node.type) >= 0) {
        ctx.beginPath();
        ctx.roundRect(nx, ny, nw, nh, 6)
        ctx.fill();
    } else {
        ctx.beginPath();
        ctx.ellipse(nx + 0.5 * nw, ny + 0.5 * nh, 0.5 * nw, 0.5 * nh, 0, 0, TAU);
        ctx.fill();
    }

    var line = 0;
    for (const text of nodeTexts.get(node)) {
        if (text.type === EDT_TEXT_FONT) {
            ctx.font = text.data;
        } else if (text.type === EDT_TEXT_COLOR) {
            ctx.fillStyle = text.data;
        } else {
            const texty = EDT_FONT_LINE_SIZE * line + EDT_FONT_LINE_SIZE / 2 + EDT_NODE_PADDING;
            if (texty + EDT_FONT_LINE_SIZE / 2 - 1 > nh) {
                break;
            }
            ctx.fillText(text.data, nx + nw / 2, ny + texty, nw - EDT_NODE_PADDING);
            ++ line;
        }
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
    html += '<input type="text" id="' + id + '" name="' + id + '" value="' + value + '"/><br/>';
    return html;
}

function EDT_htmlChoiceProperty(id, name, value, values) {
    var html = '';
    html += '<li/>';
    html += name + '<br/>';
    for (const choice_value of values) {
        const choice_text = (choice_value === null) ? 'none' : choice_value;
        const choice_id = id + '_' + choice_value;
        html += '<input type="radio" id="' + choice_id + '" name="' + id + '" value="' + choice_value + '"' + (choice_value === value ? ' checked' : '') + '/>';
        html += '<label for="' + choice_id + '">' + choice_text + '</label>';
    }
    return html;
}

function EDT_parseChoiceProperty(id, values) {
    for (const choice_value of values) {
        var elem = document.getElementById(id + '_' + choice_value);
        if (elem.checked) {
            if (choice_value === null) {
                return null;
            } else {
                return elem.value;
            }
        }
    }
    return null;
}

function EDT_htmlPatternProperty(id, name, value, tileSize) {
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
            const rowText = EDT_joinRow(row, tileSize, false);
            text += rowText + '\n';
            rows += 1;
            cols = Math.max(cols, rowText.length);
        }
    }
    rows = Math.max(4, rows + 2);
    cols = Math.max(8, cols + 2);
    html += '<textarea id="' + id + '" name="' + id + '" rows="' + rows + '" cols= "' + cols + '">' + text + '</textarea><br/>'
    return html;
}

function EDT_parsePatternProperty(id) {
    var pattern = deepcopyobj(EDT_EMPTY_PATTERN);
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
            var row = tline.split(/\s+/);
            if (!pattern.hasOwnProperty(layer)) {
                pattern[layer] = [];
            }
            pattern[layer].push(row);
        }
    }
    return pattern;
}

function EDT_updatePropertyEditor(node) {
    if (EDT_propertyEditor === null) {
        return;
    }

    if (EDT_propertyNodes === null || node !== EDT_propertyNodes.node) {
        EDT_propertyNodes = (node !== null) ? { node:node, parent:EDT_findNodeParent(GAME_SETUP.tree, node) } : null;
        if (EDT_propertyNodes) {
            const parent = EDT_propertyNodes.parent;

            const proto = EDT_getNodePrototype(node.type);
            for (const prop of Object.getOwnPropertyNames(proto)) {
                if (!node.hasOwnProperty(prop)) {
                    node[prop] = deepcopyobj(proto[prop]);
                }
            }

            var html = '';
            html += '<b>' + node.type + '</b><br/>';

            if (parent !== null) {
                html += '<input type="button" style="background-color:#dddddd" value="Move Earlier" onClick="EDT_onNodeShift(true)"/>';
                html += '<input type="button" style="background-color:#dddddd" value="Move Later" onClick="EDT_onNodeShift(false)"/>';
            }
            html += '<br/>';
            html += '<br/>';

            html += '<input type="button" style="background-color:#dddddd" value="Copy Subtree" onClick="EDT_onNodeCopy(false)"/>';
            if (node !== GAME_SETUP.tree) {
                html += '<input type="button" style="background-color:#dddddd" value="Cut Subtree" onClick="EDT_onNodeCopy(true)"/>';
            }
            if (EDT_clipboard !== null) {
                if (node.hasOwnProperty('children')) {
                    if (node.type === 'player' && EDT_clipboard.type !== 'rewrite') {
                        // pass
                    } else {
                        html += '<input type="button" style="background-color:#dddddd" style="background-color:#dddddd" value="Paste Subtree" onClick="EDT_onNodePaste()"/>';
                    }
                }
            }
            html += '<br/>';
            html += '<br/>';

            if (node.hasOwnProperty('children')) {
                if (node !== GAME_SETUP.tree) {
                    html += '<input type="button" style="background-color:#dddddd" value="Delete and Reparent" onClick="EDT_onNodeDelete(true)"/>';
                    html += '<input type="button" style="background-color:#dddddd" value="Delete Subtree" onClick="EDT_onNodeDelete(false)"/>';
                }
                html += '<input type="button" style="background-color:#dddddd" value="Delete Children" onClick="EDT_onNodeDeleteChildren()"/>';
            } else if (node !== GAME_SETUP.tree) {
                html += '<input type="button" style="background-color:#dddddd" value="Delete" onClick="EDT_onNodeDelete(false)"/>';
            }
            html += '<br/>';
            html += '<br/>';

            if (node.hasOwnProperty('children')) {
                for (const proto of EDT_NODE_PROTOTYPES) {
                    if (node.type === 'player' && proto.type !== 'rewrite') {
                        // pass
                    } else {
                        html += '<input type="button" style="background-color:' + EDT_nodeColor(proto.type, false) + '" value="Add ' + proto.type + '" onClick="EDT_onNodeAddChild(\'' + proto.type + '\')"/><br/>';
                    }
                }
                html += '<br/>';
                html += '<br/>';
            }

            var anyProperties = false;
            html += '<div id="propertyform">';
            html += '<ul>';
            if (node.hasOwnProperty('pid')) {
                html += EDT_htmlTextProperty('prop_pid', 'player id', node.pid);
                anyProperties = true;
            }
            if (node.hasOwnProperty('times')) {
                html += EDT_htmlTextProperty('prop_times', 'times', node.times);
                anyProperties = true;
            }
            if (node.hasOwnProperty('what')) {
                html += EDT_htmlTextProperty('prop_what', 'what', node.what);
                anyProperties = true;
            }
            if (node.hasOwnProperty('with')) {
                html += EDT_htmlTextProperty('prop_with', 'with', node.with);
                anyProperties = true;
            }
            if (node.hasOwnProperty('button')) {
                html += EDT_htmlChoiceProperty('prop_button', 'button', node.button, EDT_BUTTONS);
                anyProperties = true;
            }
            if (node.hasOwnProperty('pattern')) {
                const tileSize = EDT_getTileSize([node.pattern]);
                html += EDT_htmlPatternProperty('prop_pattern', 'pattern', node.pattern, tileSize);
                anyProperties = true;
            }
            if (node.hasOwnProperty('lhs') || node.hasOwnProperty('rhs')) {
                const hasLHS = node.hasOwnProperty('lhs');
                const hasRHS = node.hasOwnProperty('rhs');
                const tileSize = (hasLHS && hasRHS) ? EDT_getTileSize([node.lhs, node.rhs]) : (hasLHS ? EDT_getTileSize([node.lhs]) : EDT_getTileSize([node.rhs]));
                if (hasLHS) {
                    html += EDT_htmlPatternProperty('prop_lhs', 'LHS', node.lhs, tileSize);
                    anyProperties = true;
                }
                if (hasRHS) {
                    html += EDT_htmlPatternProperty('prop_rhs', 'RHS', node.rhs, tileSize);
                    anyProperties = true;
                }
            }
            html += '</ul>';

            if (anyProperties) {
                html += '<input type="button" style="background-color:#dddddd" value="Save" onClick="EDT_onNodeSaveProperties()">';
                html += '<br/>';
                html += '<br/>';
            }

            html += '</div>';
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
    if (node.hasOwnProperty('what')) {
        node.pid = document.getElementById('prop_what').value;
    }
    if (node.hasOwnProperty('with')) {
        node.pid = document.getElementById('prop_with').value;
    }
    if (node.hasOwnProperty('button')) {
        node.button = EDT_parseChoiceProperty('prop_button', EDT_BUTTONS);
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

function EDT_getNodePrototype(type) {
    for (const proto of EDT_NODE_PROTOTYPES) {
        if (proto.type === type) {
            return proto;
        }
    }
    return null;
}

function EDT_onNodeAddChild(type) {
    var node = EDT_propertyNodes.node;

    node.children.push(deepcopyobj(EDT_getNodePrototype(type)));
    EDT_updatePositionsAndDraw();
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
        for (let [node, rect] of EDT_nodeDrawPositions.entries()) {
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
        if (key === 'v' || key === 'V') {
            EDT_layout_horizontal = !EDT_layout_horizontal;
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
