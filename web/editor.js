const EDT_UNDO_MAX = 25;

const EDT_NODE_PADDING = 8;
const EDT_NODE_SPACING = 25;

const EDT_FONT_SIZE = 10;
const EDT_FONT_CHAR_SIZE = 7;
const EDT_FONT_LINE_SIZE = 12;

const EDT_TEXT_FONT        = 0;
const EDT_TEXT_COLOR       = 1;
const EDT_TEXT_LINE        = 2;
const EDT_TEXT_RECT_BEGIN  = 3;
const EDT_TEXT_RECT_END    = 4;

const EDT_BUTTONS = ['', 'up', 'down', 'left', 'right', 'action1', 'action2'];

const EDT_EMPTY_PATTERN = {}
const EDT_NODE_PROTOTYPES = [
    { type:'player', nid:'', children:[], pid:'' },

    { type:'win', nid:'', children:[], pid:'' },
    { type:'lose', nid:'', children:[], pid:'' },
    { type:'draw', nid:'', children:[] },

    { type:'order', nid:'', children:[] },
    { type:'all', nid:'', children:[] },
    { type:'none', nid:'', children:[] },
    { type:'random-try', nid:'', children:[] },
    { type:'loop-until-all', nid:'', children:[] },
    { type:'loop-times', nid:'', children:[], times:1 },

    { type:'rewrite', nid:'', button:'', lhs:EDT_EMPTY_PATTERN, rhs:EDT_EMPTY_PATTERN },
    { type:'set-board', nid:'', pattern:EDT_EMPTY_PATTERN },
    { type:'layer-template', nid:'', what:'', with:'' },

    { type:'match', pattern:EDT_EMPTY_PATTERN },
];

const EDT_XNODE_PROTOTYPES = [
    { type:'x-ident', nid:'', children:[] },
    { type:'x-mirror', nid:'', children:[] },
    { type:'x-skew', nid:'', children:[] },
    { type:'x-rotate', nid:'', children:[] },
    { type:'x-spin', nid:'', children:[] },
    { type:'x-flip-only', nid:'', children:[] },
    { type:'x-swap-only', nid:'', children:[], what:'', with:'' },
    { type:'x-replace-only', nid:'', children:[], what:'', with:'' },
    { type:'x-link', nid:'', target:'' },
];

const EDT_PROP_NAMES = {
    nid: 'node id',
    target: 'target id',
    pid: 'player',
    times: 'times',
    what: 'what',
    with: 'with',
    button: 'button',
    pattern: 'pattern',
    lhs: 'LHS',
    rhs: 'RHS'
};



class TRRBTEditor {

    constructor(game, canvasname, divname) {
        this.game = game;
        this.canvasname = canvasname;
        this.divname = divname;

        this.canvas = null;
        this.ctx = null;
        this.propertyEditor = null;
        this.keysDown = new Set();

        this.undoStack = null;
        this.undoStackPos = null;

        this.nidToNode = null;
        this.dispidToNode = null;

        this.nodeDrawTexts = null;
        this.nodeDrawPositions = null;
        this.nodeDrawPositionsDesired = null;
        this.nodeDrawPositionsWantUpdate = true;
        this.nodeDrawLastTime = null

        this.mousePan = null;
        this.mouseZoom = null;
        this.mousePos = null;
        this.mousePos_u = null;
        this.mouseLastTime = null;
        this.xformInv = null;
        this.mouseNode = null;
        this.propertyNodes = null;
        this.clipboard = null;

        this.followStack = false;
        this.collapsedNodes = null;

        this.layout_horizontal = null;

        this.engine = null;

        this.xform_editor = null;
    }

    undoPush() {
        let state = deepcopyobj(this.game);

        while (this.undoStack.length > this.undoStackPos + 1) {
            this.undoStack.pop();
        }

        while (this.undoStack.length >= EDT_UNDO_MAX) {
            this.undoStack.shift();
        }

        this.undoStack.push(state);
        this.undoStackPos = this.undoStack.length - 1;

        //console.log('push <-', this.undoStackPos, this.undoStack.length, this.undoStack);
    }

    undoUndo() {
        if (this.undoStackPos - 1 >= 0) {
            this.undoStackPos -= 1;

            let state = (this.undoStack.length > 0) ? this.undoStack[this.undoStackPos] : emptyGame();

            copyIntoGame(this.game, state);

            this.mousePan = null;
            this.mouseZoom = null;

            this.mouseNode = null;
            this.mousePos_u = null;
            this.mousePos = null;

            this.updateTreeStructureAndDraw(true, true);
            this.updatePropertyEditor(this.mouseNode);

            //console.log('undo <-', this.undoStackPos, this.undoStack.length, this.undoStack);
        }
    }

    undoRedo() {
        if (this.undoStackPos + 1 < this.undoStack.length) {
            this.undoStackPos += 1;

            let state = this.undoStack[this.undoStackPos];

            copyIntoGame(this.game, state);

            this.mousePan = null;
            this.mouseZoom = null;

            this.mouseNode = null;
            this.mousePos_u = null;
            this.mousePos = null;

            this.updateTreeStructureAndDraw(true, true);
            this.updatePropertyEditor(this.mouseNode);

            //console.log('redo <-', this.undoStackPos, this.undoStack.length, this.undoStack);
        }
    }

    nodeColor(type, sel) {
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
        } else if (type.startsWith('x-')) {
            return '#' + lt + lt + lt;
        } else {
            return '#' + lt + lt + dk;
        }
    }

    onLoad() {
        document.oncontextmenu = function() {
            return false;
        }

        this.canvas = document.getElementById(this.canvasname);
        this.ctx = this.canvas.getContext('2d');
        this.propertyEditor = this.divname ? document.getElementById(this.divname) : null;
        this.keysDown = new Set();

        this.undoStack = [];
        this.undoStackPos = -1;

        this.nidToNode = new Map();
        this.dispidToNode = new Map();

        this.nodeDrawTexts = new Map();
        this.nodeDrawPositions = new Map();
        this.nodeDrawPositionsDesired = new Map();
        this.nodeDrawPositionsWantUpdate = true;
        this.nodeDrawLastTime = null;

        this.mousePan = null;
        this.mouseZoom = null;
        this.mousePos = null;
        this.mousePos_u = null;
        this.mouseLastTime = null;
        this.xformInv = null;
        this.mouseNode = null;
        this.propertyNodes = null;
        this.clipboard = null;

        this.followStack = false;
        this.collapsedNodes = new Set();

        this.layout_horizontal = true;

        this.canvas.addEventListener('mousedown', bind0(this, 'onMouseDown'));
        this.canvas.addEventListener('mousemove', bind0(this, 'onMouseMove'));
        this.canvas.addEventListener('mouseup', bind0(this, 'onMouseUp'));
        this.canvas.addEventListener('mouseout', bind0(this, 'onMouseOut'));
        this.canvas.addEventListener('wheel', bind0(this, 'onMouseWheel'));
        this.canvas.addEventListener('keydown', bind0(this, 'onKeyDown'));
        this.canvas.addEventListener('keyup', bind0(this, 'onKeyUp'));

        this.updateCanvasSize(this.canvas.width, this.canvas.height);

        this.updateTreeStructure(false);
        this.updatePropertyEditor(this.mouseNode);

        window.requestAnimationFrame(bind0(this, 'onDraw'));
    }

    onDraw() {
        const currentXform = this.ctx.getTransform();

        this.ctx.resetTransform();
        this.ctx.scale(PIXEL_RATIO, PIXEL_RATIO);
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = '#eeeeee';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.setTransform(currentXform);

        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';

        const drawTime = Date.now();

        if (this.nodeDrawPositionsWantUpdate) {
            this.nodeDrawPositionsDesired = new Map();
            this.updateDesiredPositionsTree(this.nodeDrawPositionsDesired, this.nodeDrawTexts, this.game.tree);

            let anyNodeMoved = false;
            if (this.nodeDrawLastTime !== null) {
                anyNodeMoved = this.updateNodePositions(this.nodeDrawPositions, this.nodeDrawPositionsDesired, this.nodeDrawTexts, this.nodeDrawNids, drawTime - this.nodeDrawLastTime);
            } else {
                this.nodeDrawPositions = this.nodeDrawPositionsDesired;
            }

            if (anyNodeMoved) {
                window.requestAnimationFrame(bind0(this, 'onDraw'));
            } else {
                this.nodeDrawPositionsWantUpdate = false;
            }
        }

        this.drawTree(this.ctx, this.nodeDrawPositions, this.nodeDrawTexts, this.nidToNode, this.game.tree);

        this.nodeDrawLastTime = drawTime;
    }

    updateXformedTreeStructure() {
        if (this.xform_editor !== null) {
            xformApplyIntoGame(this.xform_editor.game, this.game);
            this.xform_editor.updateTreeStructure(true);
        }
    }

    updateXformedTreeDraw(skipAnimate) {
        if (this.xform_editor !== null) {
            this.xform_editor.updatePositionsAndDraw(skipAnimate);
        }
    }

    clearNodeDispid(node) {
        if (node.hasOwnProperty('dispid')) {
            delete node.dispid;
        }
        if (node.hasOwnProperty('children')) {
            for (let child of node.children) {
                this.clearNodeDispid(child);
            }
        }
    }

    updateNodeIdsNode(node) {
        if (node.hasOwnProperty('nid') && node.nid != null && node.nid != '') {
            this.nidToNode.set(node.nid, node);
        }
        if (node.hasOwnProperty('dispid')) {
            if (this.dispidToNode.has(node.dispid)) {
                node.dispid = getNextId();
            }
        } else {
            node.dispid = getNextId();
        }
        this.dispidToNode.set(node.dispid, node);
        if (node.hasOwnProperty('children')) {
            for (let child of node.children) {
                this.updateNodeIdsNode(child);
            }
        }
    }

    updateNodeIds() {
        this.nidToNode = new Map();
        this.dispidToNode = new Map();
        if (this.game.tree !== null) {
            this.updateNodeIdsNode(this.game.tree);
        }
    }

    updateTreeStructure(skipUndo) {
        if (this.game.tree === null) {
            this.game.tree = deepcopyobj(this.getNodePrototype('order'));
        }

        if (!skipUndo) {
            this.undoPush();
        }

        this.updateNodeIds();
        this.updateXformedTreeStructure();

        if (this.hasEngine()) {
            this.engine.onLoad();
            this.engine.stepManual = true;
        }
    }

    updateTreeStructureAndDraw(skipUndo, skipAnimate) {
        this.updateTreeStructure(skipUndo);
        this.updatePositionsAndDraw(skipAnimate);
    }

    updatePositionsAndDraw(skipAnimate) {
        if (skipAnimate) {
            this.nodeDrawLastTime = null; // prevents node sliding animation
        }
        this.nodeDrawPositionsWantUpdate = true;
        window.requestAnimationFrame(bind0(this, 'onDraw'));
        this.updateXformedTreeDraw(skipAnimate);
    }

    nodeCollapsed(node, stackNodes) {
        if (this.followStack) {
            return !stackNodes.has(node.dispid);
        } else {
            return this.collapsedNodes.has(node.dispid);
        }
    }

    hasEngine() {
        return this.engine !== null;
    }

    getEngineStackNodes() {
        let stackNodes = new Set();
        if (this.hasEngine() && this.engine.callStack !== null) {
            for (let frame of this.engine.callStack) {
                stackNodes.add(frame.node.dispid);
            }
        }
        return stackNodes;
    }

    rectClose(ra, rb) {
        const EPSILON = 1;
        return Math.abs(ra.x - rb.x) <= EPSILON && Math.abs(ra.y - rb.y) <= EPSILON && Math.abs(ra.w - rb.w) <= EPSILON && Math.abs(ra.h - rb.h) <= EPSILON;
    }

    rectValueUpdate(curr, des, dt) {
        return 0.15 * (des - curr);
    }

    updateNodePositions(nodePositions, nodePositionsDesired, nodeTexts, deltaTime) {
        let anyMoved = false;

        let toDelete = [];
        for (const dispid of nodePositions.keys()) {
            if (!nodePositionsDesired.has(dispid)) {
                toDelete.push(dispid);
            }
        }
        for (const dispid of toDelete) {
            nodePositions.delete(dispid);
            nodeTexts.delete(dispid);
        }

        for (let [dispid, desRect] of nodePositionsDesired.entries()) {
            if (nodePositions.has(dispid)) {
                let rect = nodePositions.get(dispid);
                if (this.rectClose(rect, desRect)) {
                    nodePositions.set(dispid, desRect);
                } else {
                    rect.x += this.rectValueUpdate(rect.x, desRect.x, deltaTime);
                    rect.y += this.rectValueUpdate(rect.y, desRect.y, deltaTime);
                    rect.w += this.rectValueUpdate(rect.w, desRect.w, deltaTime);
                    rect.h += this.rectValueUpdate(rect.h, desRect.h, deltaTime);
                    anyMoved = true;
                }
            } else {
                nodePositions.set(dispid, desRect);
            }
        }

        return anyMoved;
    }

    getTileSize(patterns) {
        let size = 1;
        for (const pattern of patterns) {
            for (const layer of Object.getOwnPropertyNames(pattern)) {
                for (const row of pattern[layer]) {
                    for (const tile of row) {
                        size = Math.max(size, charlength(tile));
                    }
                }
            }
        }
        return size;
    }

    joinRow(row, tileSize, alwaysPad) {
        let rowStr = '';
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

    updateDesiredPositionsTree(nodePositions, nodeTexts, tree) {
        nodePositions.clear();
        nodeTexts.clear();

        this.updateDesiredPositionsTreeNode(nodePositions, nodeTexts, this.getEngineStackNodes(), tree, EDT_NODE_SPACING, EDT_NODE_SPACING, null);
    }

    updateDesiredPositionsTreeNode(nodePositions, nodeTexts, stackNodes, node, xpos, ypos, align) {
        let texts = [];
        texts.push({type:EDT_TEXT_FONT,  data:'bold 10px sans-serif'});
        texts.push({type:EDT_TEXT_COLOR, data:'#222222'});
        texts.push({type:EDT_TEXT_LINE,  data:node.type});
        texts.push({type:EDT_TEXT_FONT,  data:'10px sans-serif'});

        //texts.push({type:EDT_TEXT_LINE,  data:'dispid: ' + node.dispid});

        if (node.hasOwnProperty('nid') && node.nid != '') {
            texts.push({type:EDT_TEXT_LINE,  data:EDT_PROP_NAMES['nid'] + ': ' + node.nid});
        }

        if (node.hasOwnProperty('target')) {
            texts.push({type:EDT_TEXT_LINE,  data:EDT_PROP_NAMES['target'] + ': ' + node.target});
        }

        if (node.hasOwnProperty('pid')) {
            texts.push({type:EDT_TEXT_LINE,  data:EDT_PROP_NAMES['pid'] + ': ' + node.pid});
        }

        if (node.hasOwnProperty('times')) {
            texts.push({type:EDT_TEXT_LINE,  data:EDT_PROP_NAMES['times'] + ': ' + node.times});
        }

        if (node.hasOwnProperty('what')) {
            texts.push({type:EDT_TEXT_LINE,  data:EDT_PROP_NAMES['what'] + ': ' + node.what});
        }

        if (node.hasOwnProperty('with')) {
            texts.push({type:EDT_TEXT_LINE,  data:EDT_PROP_NAMES['with'] + ': ' + node.with});
        }

        if (node.hasOwnProperty('button') && node.button !== '') {
            texts.push({type:EDT_TEXT_LINE,  data:EDT_PROP_NAMES['button'] + ': ' + node.button});
        }

        if (node.hasOwnProperty('pattern')) {
            const layers = Object.getOwnPropertyNames(node.pattern);
            const tileSize = this.getTileSize([node.pattern]);

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
                    const row_text = this.joinRow(node.pattern[layer][ii], tileSize, false);
                    if (ii === 0) {
                        texts.push({type:EDT_TEXT_RECT_BEGIN, from:0, to:charlength(row_text), len:charlength(row_text)});
                    }
                    texts.push({type:EDT_TEXT_LINE, data:row_text});
                }
                if (node.pattern[layer].length > 0) {
                    texts.push({type:EDT_TEXT_RECT_END});
                }
            }
        }

        if (node.hasOwnProperty('lhs') || node.hasOwnProperty('rhs')) {
            let layers = [];
            let patterns = [];
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

            const tileSize = this.getTileSize(patterns);

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

                const length = node.lhs.hasOwnProperty(layer) ? charlength(node.lhs[layer]) : charlength(node.rhs[layer]);
                for (let ii = 0; ii < length; ++ ii) {
                    const connect = (ii === 0) ? ' → ' : '   ';
                    let lhs = node.lhs.hasOwnProperty(layer) ? this.joinRow(node.lhs[layer][ii], tileSize, true) : null;
                    let rhs = node.rhs.hasOwnProperty(layer) ? this.joinRow(node.rhs[layer][ii], tileSize, true) : null;
                    lhs = (lhs !== null) ? lhs : ' '.repeat(charlength(rhs));
                    rhs = (rhs !== null) ? rhs : ' '.repeat(charlength(length));
                    if (ii === 0) {
                        texts.push({type:EDT_TEXT_RECT_BEGIN, from:0, to:charlength(lhs), len:charlength(lhs) + 3 + charlength(rhs)});
                        texts.push({type:EDT_TEXT_RECT_BEGIN, from:charlength(lhs) + 3, to:charlength(lhs) + 3 + charlength(rhs), len:charlength(lhs) + 3 + charlength(rhs)});
                    }
                    texts.push({type:EDT_TEXT_LINE,  data:lhs + connect + rhs});
                }
                if (length > 0) {
                    texts.push({type:EDT_TEXT_RECT_END});
                    texts.push({type:EDT_TEXT_RECT_END});
                }
            }
        }

        let nx = xpos;
        let ny = ypos;

        let nw = 2 * EDT_NODE_PADDING;
        let nh = 2 * EDT_NODE_PADDING;

        for (const text of texts) {
            if (text.type === EDT_TEXT_LINE) {
                nw = Math.max(nw, 2 * EDT_NODE_PADDING + EDT_FONT_CHAR_SIZE * charlength(text.data));
                nh += EDT_FONT_LINE_SIZE;
            }
        }

        //nw = Math.max(nw, 40);
        //nh = Math.max(nh, 40);

        if (align !== null) {
            if (this.layout_horizontal) {
                nx = Math.max(nx, nx + 0.5 * align - 0.5 * nw);
            } else {
                ny = Math.max(ny, ny + 0.5 * align - 0.5 * nh);
            }
        }

        let next_pos = this.layout_horizontal ? (nx + nw + EDT_NODE_SPACING) : (ny + nh + EDT_NODE_SPACING);

        if (node.hasOwnProperty('children')) {
            if (!this.nodeCollapsed(node, stackNodes)) {
                let child_next_pos = this.layout_horizontal ? nx : ny;
                let child_align = this.layout_horizontal ? nw : nh;
                for (let child of node.children) {
                    const child_xpos = this.layout_horizontal ? child_next_pos : (nx + nw + EDT_NODE_SPACING);
                    const child_ypos = this.layout_horizontal ? (ny + nh + EDT_NODE_SPACING) : child_next_pos;

                    child_next_pos = this.updateDesiredPositionsTreeNode(nodePositions, nodeTexts, stackNodes, child, child_xpos, child_ypos, child_align);
                    child_align = null;
                }
                next_pos = Math.max(next_pos, child_next_pos);
            }
        }

        nodePositions.set(node.dispid, {x:nx, y:ny, w:nw, h:nh})
        nodeTexts.set(node.dispid, texts);

        return next_pos;
    }

    drawTree(ctx, nodePositions, nodeTexts, nodeIds, tree) {
        const stackNodes = this.getEngineStackNodes();
        this.drawTreeLink(ctx, nodePositions, nodeTexts, nodeIds, stackNodes, tree);
        this.drawTreeNode(ctx, nodePositions, nodeTexts, stackNodes, tree);
    }

    drawTreeLink(ctx, nodePositions, nodeTexts, nodeIds, stackNodes, node) {
        if (node.hasOwnProperty('target')) {
            const nrect = nodePositions.get(node.dispid);
            const nx = nrect.x;
            const ny = nrect.y;
            const nw = nrect.w;
            const nh = nrect.h;

            const target = nodeIds.get(node.target);

            const x0 = this.layout_horizontal ? (nx + 0.5 * nw) : (nx + 1.0 * nw);
            const y0 = this.layout_horizontal ? (ny + 1.0 * nh) : (ny + 0.5 * nh);

            const dx = this.layout_horizontal ? (0.0) : (EDT_NODE_SPACING);
            const dy = this.layout_horizontal ? (EDT_NODE_SPACING) : (0.0);

            ctx.lineWidth = 4;
            ctx.strokeStyle = '#ccccff';

            ctx.setLineDash([8, 4]);
            ctx.beginPath();
            ctx.moveTo(x0, y0);

            if (target) {
                const tnrect = nodePositions.get(target.dispid);
                const tnx = tnrect.x;
                const tny = tnrect.y;
                const tnw = tnrect.w;
                const tnh = tnrect.h;
                ctx.bezierCurveTo(x0 + 0.5 * dx, y0 + 0.5 * dy, x0 + 1.5 * dx, y0 + 1.5 * dy, tnx + 0.5 * tnw, tny + 0.5 * tnh);
            } else {
                ctx.lineTo(x0 + 0.5 * dx, y0 + 0.5 * dy);
            }
            ctx.stroke();
            ctx.setLineDash([]);
        }

        if (node.hasOwnProperty('children')) {
            for (let child of node.children) {
                if (this.nodeCollapsed(node, stackNodes) && node.children.length > 0) {
                } else {
                    this.drawTreeLink(ctx, nodePositions, nodeTexts, nodeIds, stackNodes, child);
                }
            }
        }
    }

    drawTreeNode(ctx, nodePositions, nodeTexts, stackNodes, node) {
        const nrect = nodePositions.get(node.dispid);
        const nx = nrect.x;
        const ny = nrect.y;
        const nw = nrect.w;
        const nh = nrect.h;

        if (node.hasOwnProperty('children')) {
            if (this.nodeCollapsed(node, stackNodes) && node.children.length > 0) {
                const childScale = 5 + 2 * Math.min(node.children.length - 1, 5);

                let childOnStack = false;
                for (let child of node.children) {
                    if (stackNodes.has(child.dispid)) {
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
                if (this.layout_horizontal) {
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
                    const cnrect = nodePositions.get(child.dispid);
                    const cnx = cnrect.x;
                    const cny = cnrect.y;
                    const cnw = cnrect.w;
                    const cnh = cnrect.h;

                    const midx = 0.5 * (nx + nw + cnx);
                    const midy = 0.5 * (ny + nh + cny);

                    const edge = this.layout_horizontal ?
                          [nx + nw / 2, ny + nh,
                           nx + nw / 2, midy,
                           cnx + cnw / 2, midy,
                           cnx + cnw / 2, cny] :
                          [nx + nw, ny + nh / 2,
                           midx, ny + nh / 2,
                           midx, cny + cnh / 2,
                           cnx, cny + cnh / 2];

                    if (stackNodes.has(child.dispid)) {
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
                    this.drawTreeNode(ctx, nodePositions, nodeTexts, stackNodes, child);
                }
            }
        }

        ctx.fillStyle = this.nodeColor(node.type, node === this.mouseNode);

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
        } else if (node.type.startsWith('x-')) {
            ctx.beginPath();
            ctx.moveTo(nx + 0.10 * nw, ny + 0.00 * nh);
            ctx.lineTo(nx + 1.00 * nw, ny + 0.00 * nh);
            ctx.lineTo(nx + 1.00 * nw, ny + 0.60 * nh);
            ctx.lineTo(nx + 0.90 * nw, ny + 1.00 * nh);
            ctx.lineTo(nx + 0.00 * nw, ny + 1.00 * nh);
            ctx.lineTo(nx + 0.00 * nw, ny + 0.40 * nh);
            ctx.lineTo(nx + 0.10 * nw, ny + 0.00 * nh);
            ctx.fill();
        } else {
            ctx.beginPath();
            ctx.ellipse(nx + 0.5 * nw, ny + 0.5 * nh, 0.5 * nw, 0.5 * nh, 0, 0, TAU);
            ctx.fill();
        }

        ctx.lineWidth = 0.5;
        ctx.strokeStyle = '#779999';

        let line = 0;
        let rects = [];
        for (const text of nodeTexts.get(node.dispid)) {
            if (text.type === EDT_TEXT_FONT) {
                ctx.font = text.data;
            } else if (text.type === EDT_TEXT_COLOR) {
                ctx.fillStyle = text.data;
            } else {
                const texty = EDT_FONT_LINE_SIZE * line + EDT_FONT_LINE_SIZE / 2 + EDT_NODE_PADDING;
                if (text.type === EDT_TEXT_LINE) {
                    if (texty + EDT_FONT_LINE_SIZE / 2 - 1 > nh) {
                        continue;
                    }
                    if (rects.length == 0) {
                        ctx.fillText(text.data, nx + nw / 2, ny + texty, nw - EDT_NODE_PADDING);
                    } else {
                        const lox = Math.max(nx + EDT_NODE_PADDING, nx + nw / 2 - EDT_FONT_CHAR_SIZE * charlength(text.data) / 2);
                        const width = nw - EDT_NODE_PADDING;
                        let ii = 0;
                        for (const ch of text.data) {
                            const cx = lox + (ii + 0.5) * EDT_FONT_CHAR_SIZE;
                            const cy = ny + texty;
                            if (cx - lox + 0.9 * EDT_FONT_CHAR_SIZE > width) {
                                break;
                            }
                            ctx.fillText(ch, cx, cy);
                            ++ ii;
                        }
                    }
                    ++ line;
                } else if (text.type === EDT_TEXT_RECT_BEGIN) {
                    rects.push({from:text.from, to:text.to, len:text.len, texty:texty});
                } else if (text.type == EDT_TEXT_RECT_END) {
                    const rect = rects.pop();
                    const lox = Math.max(nx + EDT_NODE_PADDING, nx + nw / 2 - EDT_FONT_CHAR_SIZE * rect.len / 2);
                    const width = Math.min(nw - EDT_NODE_PADDING, (rect.to - rect.from) * EDT_FONT_CHAR_SIZE + EDT_FONT_CHAR_SIZE);
                    ctx.strokeRect(lox + rect.from * EDT_FONT_CHAR_SIZE - EDT_FONT_CHAR_SIZE / 2,
                                   ny + rect.texty - EDT_FONT_LINE_SIZE / 2 - EDT_FONT_LINE_SIZE / 10,
                                   width,
                                   texty - rect.texty + EDT_FONT_LINE_SIZE / 5);
                }
            }
        }

        if (stackNodes.has(node.dispid)) {
            ctx.lineWidth = 4;
            ctx.strokeStyle = '#222222';
            ctx.stroke();
        }

        if (this.propertyNodes !== null && node === this.propertyNodes.node) {
            ctx.lineWidth = 2;
            ctx.strokeStyle = '#880088';
            ctx.stroke();
        }
    }

    updateCanvasSize(desiredWidth, desiredHeight) {
        this.canvas.width = desiredWidth * PIXEL_RATIO;
        this.canvas.height = desiredHeight * PIXEL_RATIO;
        this.canvas.style.width = desiredWidth + "px";
        this.canvas.style.height = desiredHeight + "px";
        this.resetXform();
    }

    updateXformInv() {
        this.xformInv = this.ctx.getTransform();
        this.xformInv.invertSelf();
    }

    resetXform() {
        this.ctx.resetTransform();
        this.ctx.scale(PIXEL_RATIO, PIXEL_RATIO);
        this.updateXformInv();
    }

    translateXform(byx, byy) {
        this.ctx.translate(byx, byy);
        this.updateXformInv();
    }

    zoomAroundXform(pt, scale) {
        this.ctx.translate(pt.x, pt.y);
        this.ctx.scale(scale, scale);
        this.ctx.translate(-pt.x, -pt.y);
        this.updateXformInv();
    }

    collapseNodes(node, recurse, collapse) {
        if (node.hasOwnProperty('children')) {
            if (collapse && node.children.length > 0) {
                this.collapsedNodes.add(node.dispid);
            } else {
                this.collapsedNodes.delete(node.dispid);
            }
            if (recurse) {
                for (let child of node.children) {
                    this.collapseNodes(child, recurse, collapse);
                }
            }
        }
    }

    appendTextProperty(parent, id, name, value) {
        const item = document.createElement('li');
        const label = document.createElement('label');
        label.innerHTML = name;
        label.htmlFor = id;
        const input = document.createElement('input');
        input.id = id;
        input.name = id;
        input.type = 'text';
        input.value = value;

        item.appendChild(label);
        appendBr(item);
        item.appendChild(input);
        appendBr(item);
        parent.appendChild(item);
    }

    parseTextProperty(id, intOnly) {
        const value = document.getElementById(id).value;
        if (intOnly && value != '') {
            const asInt = parseInt(value, 10);
            if (isNaN(asInt) || asInt < 1 || asInt > 100) {
                return {ok:false, error:"Must be an integer between 1 and 100"};
            }
            return {ok:true, value:asInt};
        } else {
            return {ok:true, value:value};
        }
    }

    appendChoiceProperty(parent, id, name, value, values) {
        const item = document.createElement('li');
        appendText(item, name);
        appendBr(item);
        for (const choice_value of values) {
            const choice_text = (choice_value === '') ? 'none' : choice_value;
            const choice_id = id + '_' + choice_value;

            const input = document.createElement('input');
            input.id = choice_id;
            input.name = id;
            input.type = 'radio';
            input.value = choice_value;
            input.checked = (choice_value === value);

            const label = document.createElement('label');
            label.innerHTML = choice_text;
            label.htmlFor = choice_id;

            item.appendChild(input);
            item.appendChild(label);
        }
        parent.appendChild(item);
    }

    parseChoiceProperty(id, values) {
        for (const choice_value of values) {
            let elem = document.getElementById(id + '_' + choice_value);
            if (elem.checked) {
                return {ok:true, value:elem.value};
            }
        }
        return {ok:false, error:'An unknown choice was selected.'};
    }

    appendPatternProperty(parent, id, name, value, tileSize) {
        let rows = 0;
        let cols = 0;
        let text = '';

        const layers = Object.getOwnPropertyNames(value);
        for (const layer of layers) {
            if (layers.length === 1 && layers[0] === 'main') {
                // pass
            } else {
                text += ' ' + layer + '\n';
                rows += 1;
                cols = Math.max(cols, charlength(layer) + 1);
            }

            for (const row of value[layer]) {
                const rowText = this.joinRow(row, tileSize, false);
                text += rowText + '\n';
                rows += 1;
                cols = Math.max(cols, charlength(rowText));
            }
        }

        const item = document.createElement('li');
        const label = document.createElement('label');
        label.innerHTML = name;
        label.htmlFor = id;
        const input = document.createElement('textarea');
        input.id = id;
        input.name = id;
        input.innerHTML = text;
        input.style = 'font-family:monospace; letter-spacing:-0.1em; font-kerning:none; text-transform:full-width; width:' + (cols + 2) + 'em; height:' + (rows + 2) + 'lh';

        item.appendChild(label)
        appendBr(item)
        item.appendChild(input)
        appendBr(item)
        parent.appendChild(item);
    }

    parsePatternProperty(id) {
        let pattern = deepcopyobj(EDT_EMPTY_PATTERN);
        let layer = 'main';
        const text = document.getElementById(id).value;

        for (const line of text.split('\n')) {
            const tline = line.trimEnd();
            if (tline.length === 0) {
                continue;
            }
            if (tline[0] === ' ') {
                layer = tline.trim();
            } else {
                let row = tline.split(/\s+/);
                if (!pattern.hasOwnProperty(layer)) {
                    pattern[layer] = [];
                }
                pattern[layer].push(row);
            }
        }

        return this.checkPatterns([pattern]);
    }

    checkPatterns(patterns) {
        let rows = null;
        let cols = null;

        for (const pattern of patterns) {
            for (const layer of Object.getOwnPropertyNames(pattern)) {
                if (rows === null) {
                    rows = pattern[layer].length;
                }
                if (rows !== pattern[layer].length) {
                    return {ok:false, error:'Layer row count mismatch.'};
                }
                for (const row of pattern[layer]) {
                    if (cols === null) {
                        cols = row.length;
                    }
                    if (cols !== row.length) {
                        return {ok:false, error:'Layer column count mismatch.'};
                    }
                }
            }
        }

        if (patterns.length === 1) {
            return {ok:true, value:patterns[0]};
        } else {
            return {ok:true, value:patterns};
        }
    }

    updatePropertyEditor(node) {
        if (this.propertyEditor === null) {
            return;
        }

        const ed = this.propertyEditor;

        ed.innerHTML = '';

        appendText(ed, 'Editor', true, true);
        appendBr(ed);

        appendButton(ed, 'Undo', bind0(this, 'onUndo'));
        appendButton(ed, 'Redo', bind0(this, 'onRedo'));
        appendButton(ed, 'Import', bind0(this, 'onImport'));
        appendButton(ed, 'Export', bind0(this, 'onExport'));
        appendBr(ed);
        appendBr(ed);

        if (this.propertyNodes === null || node !== this.propertyNodes.node) {
            this.propertyNodes = (node !== null) ? { node:node, parent:this.findNodeParent(this.game.tree, node) } : null;
            if (this.propertyNodes) {
                const parent = this.propertyNodes.parent;

                const proto = this.getNodePrototype(node.type);
                if (proto) {
                    for (const prop of Object.getOwnPropertyNames(proto)) {
                        if (!node.hasOwnProperty(prop)) {
                            node[prop] = deepcopyobj(proto[prop]);
                        }
                    }
                }

                appendText(ed, node.type, true);
                appendBr(ed);

                if (parent !== null) {
                    appendButton(ed, 'Move Earlier', bind1(this, 'onNodeShift', true));
                    appendButton(ed, 'Move Later', bind1(this, 'onNodeShift', false));
                }
                appendBr(ed);
                appendBr(ed);

                appendButton(ed, 'Copy Subtree', bind1(this, 'onNodeCopy', false));
                if (node !== this.game.tree) {
                    appendButton(ed, 'Cut Subtree', bind1(this, 'onNodeCopy', true));
                }
                if (this.clipboard !== null) {
                    if (node.hasOwnProperty('children')) {
                        if (node.type === 'player' && this.clipboard.type !== 'rewrite') {
                            // pass
                        } else {
                            appendButton(ed, 'Paste Subtree', bind1(this, 'onNodePaste', true));
                        }
                    }
                }
                appendBr(ed);
                appendBr(ed);

                if (node.hasOwnProperty('children') && node.children.length > 0) {
                    if (node !== this.game.tree) {
                        appendButton(ed, 'Delete and Reparent', bind1(this, 'onNodeDelete', true));
                        appendButton(ed, 'Delete Subtree', bind1(this, 'onNodeDelete', false));
                    }
                    appendButton(ed, 'Delete Children', bind1(this, 'onNodeDeleteChildren', false));
                } else if (node !== this.game.tree) {
                    appendButton(ed, 'Delete', bind1(this, 'onNodeDelete', false));
                }
                appendBr(ed);
                appendBr(ed);

                let anyProperties = false;

                const list = appendList(ed);

                if (node.hasOwnProperty('nid')) {
                    this.appendTextProperty(list, 'prop_nid', EDT_PROP_NAMES['nid'], node.nid);
                    anyProperties = true;
                }
                if (node.hasOwnProperty('target')) {
                    this.appendTextProperty(list, 'prop_target', EDT_PROP_NAMES['target'], node.target);
                    anyProperties = true;
                }
                if (node.hasOwnProperty('pid')) {
                    this.appendTextProperty(list, 'prop_pid', EDT_PROP_NAMES['pid'], node.pid);
                    anyProperties = true;
                }
                if (node.hasOwnProperty('times')) {
                    this.appendTextProperty(list, 'prop_times', EDT_PROP_NAMES['times'], node.times);
                    anyProperties = true;
                }
                if (node.hasOwnProperty('what')) {
                    this.appendTextProperty(list, 'prop_what', EDT_PROP_NAMES['what'], node.what);
                    anyProperties = true;
                }
                if (node.hasOwnProperty('with')) {
                    this.appendTextProperty(list, 'prop_with', EDT_PROP_NAMES['with'], node.with);
                    anyProperties = true;
                }

                if (node.hasOwnProperty('button')) {
                    this.appendChoiceProperty(list, 'prop_button', EDT_PROP_NAMES['button'], node.button, EDT_BUTTONS);
                    anyProperties = true;
                }
                if (node.hasOwnProperty('pattern')) {
                    const tileSize = this.getTileSize([node.pattern]);
                    this.appendPatternProperty(list, 'prop_pattern', EDT_PROP_NAMES['pattern'], node.pattern, tileSize);
                    anyProperties = true;
                }
                if (node.hasOwnProperty('lhs') || node.hasOwnProperty('rhs')) {
                    const hasLHS = node.hasOwnProperty('lhs');
                    const hasRHS = node.hasOwnProperty('rhs');
                    const tileSize = (hasLHS && hasRHS) ? this.getTileSize([node.lhs, node.rhs]) : (hasLHS ? this.getTileSize([node.lhs]) : this.getTileSize([node.rhs]));
                    if (hasLHS) {
                        this.appendPatternProperty(list, 'prop_lhs', EDT_PROP_NAMES['lhs'], node.lhs, tileSize);
                        anyProperties = true;
                    }
                    if (hasRHS) {
                        this.appendPatternProperty(list, 'prop_rhs', EDT_PROP_NAMES['rhs'], node.rhs, tileSize);
                        anyProperties = true;
                    }
                }

                if (anyProperties) {
                    appendButton(ed, 'Save', bind0(this, 'onNodeSaveProperties'));
                    appendBr(ed);
                }

                if (node.hasOwnProperty('children')) {
                    appendBr(ed);
                    appendBr(ed);

                    const table = document.createElement('table');
                    ed.appendChild(table);
                    const tbody = document.createElement('tbody');
                    table.appendChild(tbody);
                    const tr = document.createElement('tr');
                    tr.style = 'vertical-align:top';
                    tbody.appendChild(tr);
                    const td1 = document.createElement('td');
                    tr.appendChild(td1);
                    const td2 = document.createElement('td');
                    tr.appendChild(td2);

                    const rows = Math.max(EDT_NODE_PROTOTYPES.length, EDT_XNODE_PROTOTYPES.length);
                    for (let ii = 0; ii < rows; ++ ii) {
                        if (ii < EDT_NODE_PROTOTYPES.length) {
                            const proto = EDT_NODE_PROTOTYPES[ii];
                            if (node.type === 'player' && proto.type !== 'rewrite') {
                                // pass
                            } else {
                                appendButton(td1, 'Add ' + proto.type, bind1(this, 'onNodeAddChild', proto.type), this.nodeColor(proto.type, false));
                                appendBr(td1);
                            }
                        }
                        if (ii < EDT_XNODE_PROTOTYPES.length) {
                            const proto = EDT_XNODE_PROTOTYPES[ii];
                            appendButton(td2, 'Add ' + proto.type, bind1(this, 'onNodeAddChild', proto.type), this.nodeColor(proto.type, false));
                            appendBr(td2);
                        }
                    }
                }
            }
        }
    }

    onNodeSaveProperties() {
        const SAVE_PROPS = [['nid', bind0(this, 'parseTextProperty'), false],
                            ['target', bind0(this, 'parseTextProperty'), false],
                            ['pid', bind0(this, 'parseTextProperty'), false],
                            ['times', bind0(this, 'parseTextProperty'), true],
                            ['what', bind0(this, 'parseTextProperty'), false],
                            ['with', bind0(this, 'parseTextProperty'), false],
                            ['button', bind0(this, 'parseChoiceProperty'), EDT_BUTTONS],
                            ['pattern', bind0(this, 'parsePatternProperty'), undefined],
                            ['lhs', bind0(this, 'parsePatternProperty'), undefined],
                            ['rhs', bind0(this, 'parsePatternProperty'), undefined]];

        let node = this.propertyNodes.node;

        let new_props = new Map();

        for (let [propid, propfn, proparg] of SAVE_PROPS) {
            if (node.hasOwnProperty(propid)) {
                let result = propfn('prop_' + propid, proparg);
                if (!result.ok) {
                    alert('Error saving ' + EDT_PROP_NAMES[propid] + '.\n' + result.error);
                    return;
                }
                new_props.set(propid, result.value);
            }
        }

        if (node.hasOwnProperty('lhs') || node.hasOwnProperty('rhs')) {
            if (!new_props.has('lhs') && new_props.has('rhs')) {
                alert('Error saving ' + EDT_PROP_NAMES['lhs'] + ' and ' + EDT_PROP_NAMES['rhs'] + '.\n' + 'Missing one.');
                return;
            }
            let result = this.checkPatterns([new_props.get('lhs'), new_props.get('rhs')]);
            if (!result.ok) {
                alert('Error saving ' + EDT_PROP_NAMES['lhs'] + ' and ' + EDT_PROP_NAMES['rhs'] + '.\n' + result.error);
                return;
            }
        }

        for (let [propid, value] of new_props.entries()) {
            node[propid] = value;
        }

        this.updateTreeStructureAndDraw(false, false);
    }

    findNodeParent(from, node) {
        if (from.hasOwnProperty('children')) {
            for (let child of from.children) {
                if (child === node) {
                    return from;
                }
                const found = this.findNodeParent(child, node);
                if (found !== null) {
                    return found;
                }
            }
        }
        return null;
    }

    onNodeCopy(cut) {
        let node = this.propertyNodes.node;

        this.clipboard = deepcopyobj(node);
        this.clearNodeDispid(this.clipboard);

        if (cut) {
            this.onNodeDelete(false);
        } else {
            this.updateTreeStructureAndDraw(false, false);
        }
    }

    onNodePaste() {
        let node = this.propertyNodes.node;

        if (this.clipboard !== null) {
            node.children.push(deepcopyobj(this.clipboard));
            this.updateTreeStructureAndDraw(false, false);
        }
    }

    onNodeDelete(reparentChildren) {
        let node = this.propertyNodes.node;
        let parent = this.propertyNodes.parent;

        if (parent !== null) {
            const index = parent.children.indexOf(node);
            if (index >= 0) {
                if (reparentChildren) {
                    parent.children.splice(index, 1, ...node.children);
                } else {
                    parent.children.splice(index, 1);
                }
                this.updateTreeStructureAndDraw(false, false);
            }
        }
    }

    onNodeDeleteChildren() {
        let node = this.propertyNodes.node;

        node.children = [];

        this.collapseNodes(node, false);
        this.updateTreeStructureAndDraw(false, false);
    }

    getNodePrototype(type) {
        for (const proto of EDT_NODE_PROTOTYPES) {
            if (proto.type === type) {
                return proto;
            }
        }
        for (const proto of EDT_XNODE_PROTOTYPES) {
            if (proto.type === type) {
                return proto;
            }
        }
        return null;
    }

    onNodeAddChild(type) {
        let node = this.propertyNodes.node;

        node.children.push(deepcopyobj(this.getNodePrototype(type)));
        this.updateTreeStructureAndDraw(false, false);
    }

    onNodeShift(earlier) {
        let node = this.propertyNodes.node;
        let parent = this.propertyNodes.parent;

        if (parent !== null) {
            const index = parent.children.indexOf(node);
            if (index >= 0) {
                if (earlier && index > 0) {
                    parent.children.splice(index, 1);
                    parent.children.splice(index - 1, 0, node);
                    this.updateTreeStructureAndDraw(false, false);
                } else if (!earlier && index + 1 < parent.children.length) {
                    parent.children.splice(index, 1);
                    parent.children.splice(index + 1, 0, node);
                    this.updateTreeStructureAndDraw(false, false);
                }
            }
        }
    }

    onUndo() {
        this.undoUndo();
    }

    onRedo() {
        this.undoRedo();
    }

    onImport() {
        if (!navigator.clipboard) {
            alert('ERROR: Cannot find clipboard.');
        } else {
            let this_editor = this;
            navigator.clipboard.readText().then(function(text) {
                let gameImport = JSON.parse(text);
                this_editor.clearNodeDispid(gameImport.tree);
                copyIntoGame(this_editor.game, gameImport);

                this_editor.mousePan = null;
                this_editor.mouseZoom = null;

                this_editor.mouseNode = null;
                this_editor.mousePos_u = null;
                this_editor.mousePos = null;

                this_editor.updateTreeStructureAndDraw(false, true);
                this_editor.updatePropertyEditor(this_editor.mouseNode);

                alert('Game imported from clipboard.');
            }, function(err) {
                alert('ERROR: Could not import game from clipboard.');
            });
        }
    }

    onExport() {
        if (!navigator.clipboard) {
            alert('ERROR: Cannot find clipboard.');
        } else {
            let gameExport = deepcopyobj(this.game);
            this.clearNodeDispid(gameExport.tree);
            const text = JSON.stringify(gameExport);
            navigator.clipboard.writeText(text).then(function() {
                alert('Game exported to clipboard.');
            }, function(err) {
                alert('ERROR: Could not export game to clipboard.');
            });
        }
    }

    onMouseDown(evt) {
        this.canvas.focus();

        const mouseButton = evt.button;

        const mouseTime = Date.now();

        const isDouble = (this.mouseLastTime !== null && mouseTime - this.mouseLastTime <= DOUBLE_CLICK_TIME);

        if (this.mouseNode !== null) {
            if (this.propertyEditor === null || (this.propertyNodes !== null && this.mouseNode === this.propertyNodes.node)) {
                if (isDouble) {
                    this.collapseNodes(this.mouseNode, true, this.collapsedNodes.has(this.mouseNode.dispid));
                    this.updatePositionsAndDraw(true);
                } else {
                    this.collapseNodes(this.mouseNode, false, !this.collapsedNodes.has(this.mouseNode.dispid));
                    this.updatePositionsAndDraw(false);
                }
            }

            this.updatePropertyEditor(this.mouseNode);
        } else {
            if (isDouble) {
                this.resetXform();
            } else {
                if (mouseButton === BUTTON_LEFT) {
                    this.mousePan = true;
                } else if (mouseButton === BUTTON_RIGHT) {
                    this.mouseZoom = this.mousePos;
                }
            }

            this.updatePropertyEditor(null);
        }

        this.mouseLastTime = mouseTime;

        evt.preventDefault();
        window.requestAnimationFrame(bind0(this, 'onDraw'));
    }

    onMouseUp(evt) {
        const mouseButton = evt.button;

        this.mousePan = null;
        this.mouseZoom = null;

        evt.preventDefault();
        window.requestAnimationFrame(bind0(this, 'onDraw'));
    }

    onMouseMove(evt) {
        const rect = this.canvas.getBoundingClientRect();
        const mousePos_u = new DOMPoint((evt.clientX - rect.left) * PIXEL_RATIO, (evt.clientY - rect.top) * PIXEL_RATIO);

        let mousePos = this.xformInv.transformPoint(mousePos_u);

        this.mouseNode = null;

        if (this.mousePan !== null) {
            if (this.mousePos !== null) {
                this.translateXform(mousePos.x - this.mousePos.x, mousePos.y - this.mousePos.y);
                mousePos = this.xformInv.transformPoint(mousePos_u);
            }
        } else if (this.mouseZoom !== null) {
            if (this.mousePos !== null) {
                this.zoomAroundXform(this.mouseZoom, 1 + ((mousePos_u.y - this.mousePos_u.y) / 400));
                mousePos = this.xformInv.transformPoint(mousePos_u);
            }
        } else {
            for (let [dispid, rect] of this.nodeDrawPositions.entries()) {
                if (rect.x < mousePos.x && rect.y < mousePos.y && rect.x + rect.w > mousePos.x && rect.y + rect.h > mousePos.y) {
                    this.mouseNode = this.dispidToNode.get(dispid);
                    break;
                }
            }
        }

        this.mousePos_u = mousePos_u;
        this.mousePos = mousePos;

        evt.preventDefault();
        window.requestAnimationFrame(bind0(this, 'onDraw'));
    }

    onMouseOut(evt) {
        this.mousePan = null;
        this.mouseZoom = null;

        this.mouseNode = null;
        this.mousePos_u = null;
        this.mousePos = null;

        evt.preventDefault();
        window.requestAnimationFrame(bind0(this, 'onDraw'));
    }

    onMouseWheel(evt) {
        if (this.mousePos !== null) {
            if (evt.deltaY < 0) {
                this.zoomAroundXform(this.mousePos, 1 + (10 / 400));
            } else {
                this.zoomAroundXform(this.mousePos, 1 - (10 / 400));
            }
        }

        evt.preventDefault();
        window.requestAnimationFrame(bind0(this, 'onDraw'));
    }

    onKeyDown(evt) {
        let key = evt.key;

        if (!this.keysDown.has(key)) {
            this.keysDown.add(key);

            if (key === 'f' || key === 'F') {
                if (this.hasEngine()) {
                    this.followStack = !this.followStack;
                    this.updatePositionsAndDraw(false);
                }
            }
            if (key === 'v' || key === 'V') {
                this.layout_horizontal = !this.layout_horizontal;
                this.updatePositionsAndDraw(false);
            }
        }

        evt.preventDefault();
        window.requestAnimationFrame(bind0(this, 'onDraw'));
    }

    onKeyUp(evt) {
        let key = evt.key;

        this.keysDown.delete(key);

        evt.preventDefault();
    }

};
