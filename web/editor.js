const EDT_UNDO_MAX = 25;

const EDT_NODE_PADDING = 8;
const EDT_NODE_SPACING = 25;

const EDT_FONT_SIZE = 10;
const EDT_FONT_CHAR_SIZE = 7;
const EDT_FONT_LINE_SIZE = 12;

const EDT_TEXT_FONT = 0;
const EDT_TEXT_COLOR = 1;
const EDT_TEXT_LINE = 2;
const EDT_TEXT_RECT_BEGIN = 3;
const EDT_TEXT_RECT_END = 4;

const EDT_PARSE_TEXT_INT = 0;
const EDT_PARSE_TEXT_WORD = 1;
const EDT_PARSE_TEXT_TEXT = 2;

const EDT_COLOR_CHANGE = '#ffffbb';
const EDT_COLOR_ERROR = '#ffdddd';

const EDT_BUTTONS = ['', 'up', 'down', 'left', 'right', 'action1', 'action2'];

const EDT_EMPTY_PATTERN = {}
const EDT_NODE_PROTOTYPES = [
    { type: 'player', comment: '', nid: '', children: [], pid: '' },

    { type: 'win', comment: '', nid: '', children: [], pid: '' },
    { type: 'lose', comment: '', nid: '', children: [], pid: '' },
    { type: 'draw', comment: '', nid: '', children: [] },

    { type: 'order', comment: '', nid: '', children: [] },
    { type: 'all', comment: '', nid: '', children: [] },
    { type: 'none', comment: '', nid: '', children: [] },
    { type: 'random-try', comment: '', nid: '', children: [] },
    { type: 'loop-until-all', comment: '', nid: '', children: [] },
    { type: 'loop-times', comment: '', nid: '', children: [], times: 1 },

    { type: 'rewrite', comment: '', nid: '', button: '', lhs: EDT_EMPTY_PATTERN, rhs: EDT_EMPTY_PATTERN },
    { type: 'set-board', comment: '', nid: '', pattern: EDT_EMPTY_PATTERN },
    { type: 'layer-template', comment: '', nid: '', layer: '', with: '' },

    { type: 'match', pattern: EDT_EMPTY_PATTERN },
];

const EDT_XNODE_PROTOTYPES = [
    { type: 'x-ident', comment: '', nid: '', children: [] },
    { type: 'x-mirror', comment: '', nid: '', children: [], remorig: false },
    { type: 'x-skew', comment: '', nid: '', children: [], remorig: false },
    { type: 'x-rotate', comment: '', nid: '', children: [], remorig: false },
    { type: 'x-spin', comment: '', nid: '', children: [], remorig: false },
    { type: 'x-flip', comment: '', nid: '', children: [], remorig: false },
    { type: 'x-swap', comment: '', nid: '', children: [], what: '', with: '' },
    { type: 'x-replace', comment: '', nid: '', children: [], what: '', withs: [] },
    { type: 'x-prune', comment: '', nid: '', children: [] },
    { type: 'x-link', comment: '', nid: '', target: '' },
];

const EDT_NODE_HELP = {
    'player': { color: [0, 0, 1], help: 'If any LHS of any child matches, given player can choose which RHS rewrite to apply. Succeeds if there were any matches, otherwise, fails.' },

    'win': { color: [1, 0, 0], help: 'Runs children in order, until any child succeeds. If any child succeeds, the game ends with the given player winning; otherwise fails.' },
    'lose': { color: [1, 0, 0], help: 'Runs children in order, until any child succeeds. If any child succeeds, the game ends with the given player winning; otherwise fails.' },
    'draw': { color: [1, 0, 0], help: 'Runs children in order, until any child succeeds. If any child succeeds, the game ends with the given player winning; otherwise fails.' },

    'order': { color: [1, 1, 0], help: 'Runs all children in order (regardless of their success or failure). Succeeds if any child succeeds, otherwise fails.' },
    'all': { color: [1, 1, 0], help: 'Runs children in order, until any child fails. Fails if any child fails, otherwise succeeds.' },
    'none': { color: [1, 1, 0], help: 'Runs children in order, until any child succeeds. Fails if any child succeeds, otherwise succeeds.' },
    'random-try': { color: [1, 1, 0], help: 'Runs children in random order until one succeeds. Succeeds if any child succeeds, otherwise fails.' },
    'loop-until-all': { color: [1, 1, 0], help: 'Repeatedly runs children in order, until all children fail on one loop. Succeeds if any child succeeds, otherwise fails.' },
    'loop-times': { color: [1, 1, 0], help: 'Repeatedly runs children in order a fixed number of times. Succeeds if any child succeeds, otherwise fails.' },

    'rewrite': { color: [0, 1, 0], help: 'If there are any LHS pattern matches, randomly rewrites one of these matches with the RHS pattern. Succeeds if there were any matches, otherwise, fails.' },
    'set-board': { color: [0, 1, 0], help: 'Sets the board. Always succeeds.' },
    'append-rows': { color: [0, 1, 0], help: 'Appends a new row to the board. Always succeeds.' },
    'append-columns': { color: [0, 1, 0], help: 'Appends a new column the board. Always succeeds.' },
    'layer-template': { color: [0, 1, 0], help: 'Creates a new layer with the given name filled with the given tile. Always succeeds.' },
    'display-board': { color: [0, 1, 0], help: 'Causes the board to be displayed. Always succeeds.' },

    'match': { color: [0, 1, 1], help: 'Succeeds if pattern matches current board, otherwise fails.' },

    'x-ident': { color: [1, 1, 1], help: 'Do not apply any transform.' },
    'x-prune': { color: [1, 1, 1], help: 'Remove nodes.' },

    'x-mirror': { color: [1, 1, 1], help: 'Mirror patterns left-right.' },
    'x-skew': { color: [1, 1, 1], help: 'Skew patterns along columns.' },
    'x-rotate': { color: [1, 1, 1], help: 'Rotate patterns 90 degrees.' },
    'x-spin': { color: [1, 1, 1], help: 'Rotate patterns 90, 180, and 270 degrees.' },
    'x-flip': { color: [1, 1, 1], help: 'Flip patterns top-bottom.' },

    'x-swap': { color: [1, 1, 1], help: 'Swap characters in patterns and player IDs (removing original).' },
    'x-replace': { color: [1, 1, 1], help: 'Replace characters in patterns and player IDs (removing original).' },

    'x-unroll-replace': { color: [1, 1, 1], help: 'Duplicate replaces here as children of an order node.' },

    'x-link': { color: [1, 1, 1], help: 'Link to another node by node ID.' },
    'x-file': { color: [1, 1, 1], help: 'Link to another node by file name and node ID.' }
}

const EDT_PROP_NAMES = {
    comment: { name: 'comment', help: 'A comment about the node.' },
    nid: { name: 'node ID', help: 'ID of node that other nodes can use to refer to it.' },
    remorig: { name: 'remove original', help: 'Remove original pattern after transform applied.' },
    file: { name: 'file name', help: 'Name of file to link to.' },
    target: { name: 'target ID', help: 'Target node ID to link to.' },
    pid: { name: 'player ID', help: 'ID of player to make choice.' },
    layer: { name: 'layer', help: 'Name of layer to use.' },
    times: { name: 'times', help: 'How many times.' },
    what: { name: 'what', help: 'Character to be swapped/replaced.' },
    with: { name: 'with', help: 'Other character to use.' },
    withs: { name: 'withs', help: 'Space-separated other characters to use.' },
    button: { name: 'button', help: 'Button to press to apply rewrite.' },
    pattern: { name: 'pattern', help: 'A tile pattern.' },
    lhs: { name: 'LHS', help: 'Left hand side tile pattern of a rewrite rule.' },
    rhs: { name: 'RHS', help: 'Right hand side tile pattern of a rewrite rule.' }
};



class TRRBTEditor {

    constructor(game, file_to_game, canvasname, divname) {
        this.game = game;
        this.file_to_game = file_to_game;
        this.canvasname = canvasname;
        this.divname = divname;

        this.canvas = null;
        this.ctx = null;
        this.propertyEditor = null;
        this.keysDown = new Set();

        this.undoStack = null;
        this.undoStackPos = null;

        this.fileToNidToNode = null;
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
        this.mouseClearProp = null;
        this.xformInv = null;
        this.mouseNode = null;
        this.propertyNodes = null;
        this.clipboard = null;

        this.followStack = false;
        this.collapsedNodes = null;

        this.layout_horizontal = null;

        this.tooltip = null;
        this.emojiMessage = null;
        this.emojiPicker = null;

        this.engine = null;

        this.drawRequested = false;

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

        const help = EDT_NODE_HELP[type];
        const clr = help.color;

        return '#' + (clr[0] ? lt : dk) + (clr[1] ? lt : dk) + (clr[2] ? lt : dk);
    }

    onLoad() {
        document.oncontextmenu = function () {
            return false;
        }

        this.canvas = document.getElementById(this.canvasname);
        this.ctx = this.canvas.getContext('2d');
        this.propertyEditor = this.divname ? document.getElementById(this.divname) : null;
        this.keysDown = new Set();

        this.tooltip = document.getElementById('tooltip');
        if (this.tooltip === null) {
            this.tooltip = document.createElement('div');
            this.tooltip.id = 'tooltip';
            this.tooltip.style = 'position:absolute; top:0; left:0; z-index:99; pointer-events:none; max-width:250px; background-color:lightyellow; outline:3px solid yellow; padding:5px; font-style:italic;';
            document.body.appendChild(this.tooltip);
        }
        this.tooltip.style.display = 'none';

        if (this.emojiPicker === null) {
            if (window.customElements.get('emoji-picker') !== undefined) {
                this.emojiMessage = document.createElement('span');
                this.emojiMessage.style = 'font-size:small';
                let emojiMessage = this.emojiMessage;

                this.emojiPicker = document.createElement('emoji-picker');
                this.emojiPicker.style.display = 'none';
                this.emojiPicker.style.height = '200px';
                this.emojiPicker.addEventListener('emoji-click', e => {
                    if (!navigator.clipboard) {
                        alert('ERROR: Cannot find clipboard.');
                    } else {
                        navigator.clipboard.writeText(e.detail.unicode).then(function () {
                            emojiMessage.innerHTML = 'Emoji ' + e.detail.unicode + ' copied to clipboard.';
                        }, function (err) {
                            alert('ERROR: Could not copy to clipboard.');
                        });
                    }
                });
                this.emojiPicker.addEventListener('mousemove', e => { emojiMessage.innerHTML = '';});
                this.emojiPicker.addEventListener('mouseout', e => { emojiMessage.innerHTML = '';});
            }
        }

        this.undoStack = [];
        this.undoStackPos = -1;

        this.fileToNidToNode = new Map();
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
        this.mouseClearProp = null;
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
        this.updatePropertyEditor(null);

        this.drawRequested = false;

        this.requestDraw();
    }

    requestDraw() {
        if (!this.drawRequested) {
            this.drawRequested = true;
            window.requestAnimationFrame(bind0(this, 'onDraw'));
        }
    }

    onDraw() {
        this.drawRequested = false;

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
                this.requestDraw();
            } else {
                this.nodeDrawPositionsWantUpdate = false;
            }
        }

        this.drawTree(this.ctx, this.nodeDrawPositions, this.nodeDrawTexts, this.fileToNidToNode, this.game.tree);

        this.nodeDrawLastTime = drawTime;
    }

    updateXformedTreeStructure() {
        if (this.xform_editor !== null) {
            xformApplyIntoGame(this.xform_editor.game, this.game, this.file_to_game);
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

    updateDispids(node) {
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
                this.updateDispids(child);
            }
        }
    }

    updateNodeIds() {
        this.fileToNidToNode = new Map();
        this.dispidToNode = new Map();
        if (this.game.tree !== null) {
            this.updateDispids(this.game.tree);
            find_file_node_ids(null, this.game.tree, this.file_to_game, this.fileToNidToNode);
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

        if (this.propertyNodes !== null) {
            this.updatePropertyEditor(this.propertyNodes.node);
        } else {
            this.updatePropertyEditor(null)
        }

        if (this.hasEngine()) {
            this.engine.onLoad();
            this.engine.updateStepManual(true);
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
        this.requestDraw();
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
        if (this.hasEngine() && this.engine.state.callStack !== null) {
            for (let frame of this.engine.state.callStack) {
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

    updateDesiredPositionsTree(nodePositions, nodeTexts, tree) {
        nodePositions.clear();
        nodeTexts.clear();

        this.updateDesiredPositionsTreeNode(nodePositions, nodeTexts, this.getEngineStackNodes(), tree, EDT_NODE_SPACING, EDT_NODE_SPACING, null);
    }

    updateDesiredPositionsTreeNode(nodePositions, nodeTexts, stackNodes, node, xpos, ypos, align) {
        let texts = [];
        texts.push({ type: EDT_TEXT_FONT, data: 'bold 10px sans-serif' });
        texts.push({ type: EDT_TEXT_COLOR, data: '#222222' });
        texts.push({ type: EDT_TEXT_LINE, data: node.type });
        texts.push({ type: EDT_TEXT_FONT, data: '10px sans-serif' });

        //texts.push({type:EDT_TEXT_LINE,  data:'dispid: ' + node.dispid});

        if (node.hasOwnProperty('comment') && node.comment != '') {
            texts.push({ type: EDT_TEXT_FONT, data: 'italic 10px sans-serif' });
            if (node.comment.length > 30) {
                texts.push({ type: EDT_TEXT_LINE, data: node.comment.substring(0, 27) + '...' });
            } else {
                texts.push({ type: EDT_TEXT_LINE, data: node.comment });
            }
            texts.push({ type: EDT_TEXT_FONT, data: 'bold 10px sans-serif' });
        }

        if (node.hasOwnProperty('nid') && node.nid != '') {
            texts.push({ type: EDT_TEXT_LINE, data: EDT_PROP_NAMES['nid'].name + ': ' + node.nid });
        }

        if (node.hasOwnProperty('remorig') && node.remorig) {
            texts.push({ type: EDT_TEXT_LINE, data: EDT_PROP_NAMES['remorig'].name });
        }

        if (node.hasOwnProperty('file')) {
            texts.push({ type: EDT_TEXT_LINE, data: EDT_PROP_NAMES['file'].name + ': ' + node.file });
        }

        if (node.hasOwnProperty('target')) {
            texts.push({ type: EDT_TEXT_LINE, data: EDT_PROP_NAMES['target'].name + ': ' + node.target });
        }

        if (node.hasOwnProperty('pid')) {
            texts.push({ type: EDT_TEXT_LINE, data: EDT_PROP_NAMES['pid'].name + ': ' + node.pid });
        }

        if (node.hasOwnProperty('layer')) {
            texts.push({ type: EDT_TEXT_LINE, data: EDT_PROP_NAMES['layer'].name + ': ' + node.layer });
        }

        if (node.hasOwnProperty('times')) {
            texts.push({ type: EDT_TEXT_LINE, data: EDT_PROP_NAMES['times'].name + ': ' + node.times });
        }

        if (node.hasOwnProperty('what')) {
            texts.push({ type: EDT_TEXT_LINE, data: EDT_PROP_NAMES['what'].name + ': ' + node.what });
        }

        if (node.hasOwnProperty('with')) {
            texts.push({ type: EDT_TEXT_LINE, data: EDT_PROP_NAMES['with'].name + ': ' + node.with });
        }

        if (node.hasOwnProperty('withs')) {
            texts.push({ type: EDT_TEXT_LINE, data: EDT_PROP_NAMES['withs'].name + ': ' + node.withs.join(' ') });
        }

        if (node.hasOwnProperty('button') && node.button !== '') {
            texts.push({ type: EDT_TEXT_LINE, data: EDT_PROP_NAMES['button'].name + ': ' + node.button });
        }

        if (node.hasOwnProperty('pattern')) {
            const layers = Object.getOwnPropertyNames(node.pattern);
            const tileSize = getTileSize([node.pattern]);

            for (const layer of layers) {
                if (layers.length === 1 && layers[0] === 'main') {
                    // pass
                } else {
                    texts.push({ type: EDT_TEXT_FONT, data: 'italic 10px sans-serif' });
                    texts.push({ type: EDT_TEXT_COLOR, data: '#888888' });
                    texts.push({ type: EDT_TEXT_LINE, data: '- ' + layer + ' -' });
                }

                texts.push({ type: EDT_TEXT_FONT, data: '10px Courier New' });
                texts.push({ type: EDT_TEXT_COLOR, data: '#222222' });

                for (let ii = 0; ii < node.pattern[layer].length; ++ii) {
                    const row_text = joinRow(node.pattern[layer][ii], tileSize, false);
                    if (ii === 0) {
                        texts.push({ type: EDT_TEXT_RECT_BEGIN, from: 0, to: graphemeLength(row_text), len: graphemeLength(row_text) });
                    }
                    texts.push({ type: EDT_TEXT_LINE, data: row_text });
                }
                if (node.pattern[layer].length > 0) {
                    texts.push({ type: EDT_TEXT_RECT_END });
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
            /*
            const mainIndex = layers.indexOf('main');
            if (mainIndex > 0) {
                layers.splice(mainIndex, 1);
                layers.unshift('main');
            }
            */

            const tileSize = getTileSize(patterns);

            for (const layer of layers) {
                if (layers.length === 1 && layers[0] === 'main') {
                    // pass
                } else {
                    texts.push({ type: EDT_TEXT_FONT, data: 'italic 10px sans-serif' });
                    texts.push({ type: EDT_TEXT_COLOR, data: '#888888' });
                    texts.push({ type: EDT_TEXT_LINE, data: '- ' + layer + ' -' });
                }

                texts.push({ type: EDT_TEXT_FONT, data: '10px Courier New' });
                texts.push({ type: EDT_TEXT_COLOR, data: '#222222' });

                const length = node.lhs.hasOwnProperty(layer) ? node.lhs[layer].length : node.rhs[layer].length;
                for (let ii = 0; ii < length; ++ii) {
                    const connect = (ii === 0) ? ' → ' : '   ';
                    let lhs = node.lhs.hasOwnProperty(layer) ? joinRow(node.lhs[layer][ii], tileSize, true) : null;
                    let rhs = node.rhs.hasOwnProperty(layer) ? joinRow(node.rhs[layer][ii], tileSize, true) : null;
                    lhs = (lhs !== null) ? lhs : ' '.repeat(graphemeLength(rhs));
                    rhs = (rhs !== null) ? rhs : ' '.repeat(graphemeLength(length));
                    if (ii === 0) {
                        texts.push({ type: EDT_TEXT_RECT_BEGIN, from: 0, to: graphemeLength(lhs), len: graphemeLength(lhs) + 3 + graphemeLength(rhs) });
                        texts.push({ type: EDT_TEXT_RECT_BEGIN, from: graphemeLength(lhs) + 3, to: graphemeLength(lhs) + 3 + graphemeLength(rhs), len: graphemeLength(lhs) + 3 + graphemeLength(rhs) });
                    }
                    texts.push({ type: EDT_TEXT_LINE, data: lhs + connect + rhs });
                }
                if (length > 0) {
                    texts.push({ type: EDT_TEXT_RECT_END });
                    texts.push({ type: EDT_TEXT_RECT_END });
                }
            }
        }

        let nx = xpos;
        let ny = ypos;

        let nw = 2 * EDT_NODE_PADDING;
        let nh = 2 * EDT_NODE_PADDING;

        for (const text of texts) {
            if (text.type === EDT_TEXT_LINE) {
                nw = Math.max(nw, 2 * EDT_NODE_PADDING + EDT_FONT_CHAR_SIZE * graphemeLength(text.data));
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

        nodePositions.set(node.dispid, { x: nx, y: ny, w: nw, h: nh })
        nodeTexts.set(node.dispid, texts);

        return next_pos;
    }

    drawTree(ctx, nodePositions, nodeTexts, nodeIds, tree) {
        const stackNodes = this.getEngineStackNodes();
        this.drawTreeLink(ctx, nodePositions, nodeTexts, nodeIds, stackNodes, tree);
        this.drawTreeNode(ctx, nodePositions, nodeTexts, stackNodes, tree);
    }

    drawTreeLink(ctx, nodePositions, nodeTexts, nodeIds, stackNodes, node) {
        if (node.hasOwnProperty('file') || node.hasOwnProperty('target')) {
            const nrect = nodePositions.get(node.dispid);
            const nx = nrect.x;
            const ny = nrect.y;
            const nw = nrect.w;
            const nh = nrect.h;

            const x0 = this.layout_horizontal ? (nx + 0.5 * nw) : (nx + 1.0 * nw);
            const y0 = this.layout_horizontal ? (ny + 1.0 * nh) : (ny + 0.5 * nh);

            const dx = this.layout_horizontal ? (0.0) : (EDT_NODE_SPACING);
            const dy = this.layout_horizontal ? (EDT_NODE_SPACING) : (0.0);

            let found_target = false;

            ctx.lineWidth = 4;
            ctx.fillStyle = '#ccccff';
            ctx.strokeStyle = '#ccccff';

            ctx.beginPath();
            ctx.moveTo(x0, y0);
            ctx.lineTo(x0 + 0.5 * dx, y0 + 0.5 * dy);
            ctx.stroke();

            let file = null;
            if (node.hasOwnProperty('file')) {
                file = node.file;
            }

            if (node.hasOwnProperty('target')) {
                let target = null;
                const nid_to_node = nodeIds.get(file);
                if (nid_to_node) {
                    target = nid_to_node.get(node.target);
                }

                if (target) {
                    found_target = true;

                    if (file === null && nodePositions.has(target.dispid)) {
                        const tnrect = nodePositions.get(target.dispid);
                        const tnx = tnrect.x;
                        const tny = tnrect.y;
                        const tnw = tnrect.w;
                        const tnh = tnrect.h;
                        ctx.setLineDash([8, 4]);
                        ctx.beginPath();
                        ctx.moveTo(x0 + 0.5 * dx, y0 + 0.5 * dy);
                        ctx.bezierCurveTo(x0 + 1.0 * dx, y0 + 1.0 * dy, x0 + 1.0 * dx, y0 + 1.0 * dy, tnx + 0.5 * tnw, tny + 0.5 * tnh);
                        ctx.stroke();
                        ctx.setLineDash([]);
                    } else {
                        ctx.beginPath();
                        ctx.ellipse(x0 + 0.5 * dx, y0 + 0.5 * dy, EDT_NODE_SPACING / 4, EDT_NODE_SPACING / 4, 0, 0, TAU);
                        ctx.fill();
                    }
                }
            }

            if (!found_target) {
                ctx.strokeStyle = '#ffcccc';
                ctx.beginPath();
                ctx.moveTo(x0 + 0.5 * dx + EDT_NODE_SPACING / 4, y0 + 0.5 * dy - EDT_NODE_SPACING / 4);
                ctx.lineTo(x0 + 0.5 * dx - EDT_NODE_SPACING / 4, y0 + 0.5 * dy + EDT_NODE_SPACING / 4);
                ctx.moveTo(x0 + 0.5 * dx - EDT_NODE_SPACING / 4, y0 + 0.5 * dy - EDT_NODE_SPACING / 4);
                ctx.lineTo(x0 + 0.5 * dx + EDT_NODE_SPACING / 4, y0 + 0.5 * dy + EDT_NODE_SPACING / 4);
                ctx.stroke();
            }
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
            ctx.closePath();
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
            ctx.closePath();
            ctx.fill();
        } else if (['rewrite', 'match', 'set-board', 'layer-template', 'append-rows', 'append-cols', 'display-board'].indexOf(node.type) >= 0) {
            ctx.beginPath();
            ctx.roundRect(nx, ny, nw, nh, 6)
            ctx.fill();
        } else if (['x-unroll-replace'].indexOf(node.type) >= 0) {
            ctx.beginPath();
            ctx.moveTo(nx + 0.00 * nw, ny + 0.00 * nh);
            ctx.lineTo(nx + 0.33 * nw, ny + 0.05 * nh);
            ctx.lineTo(nx + 0.67 * nw, ny + 0.00 * nh);
            ctx.lineTo(nx + 1.00 * nw, ny + 0.05 * nh);
            ctx.lineTo(nx + 1.00 * nw, ny + 1.00 * nh);
            ctx.lineTo(nx + 0.67 * nw, ny + 0.95 * nh);
            ctx.lineTo(nx + 0.33 * nw, ny + 1.00 * nh);
            ctx.lineTo(nx + 0.00 * nw, ny + 0.95 * nh);
            ctx.closePath();
            ctx.fill();
        } else if (['x-link', 'x-file'].indexOf(node.type) >= 0) {
            ctx.beginPath();
            ctx.moveTo(nx + 0.00 * nw, ny + 0.00 * nh);
            ctx.lineTo(nx + 1.00 * nw, ny + 0.00 * nh);
            ctx.lineTo(nx + 1.00 * nw, ny + 0.85 * nh);
            ctx.lineTo(nx + 0.50 * nw, ny + 1.00 * nh);
            ctx.lineTo(nx + 0.00 * nw, ny + 0.85 * nh);
            ctx.closePath();
            ctx.fill();
        } else if (node.type.startsWith('x-')) {
            ctx.beginPath();
            ctx.moveTo(nx + 0.10 * nw, ny + 0.00 * nh);
            ctx.lineTo(nx + 1.00 * nw, ny + 0.00 * nh);
            ctx.lineTo(nx + 1.00 * nw, ny + 0.60 * nh);
            ctx.lineTo(nx + 0.90 * nw, ny + 1.00 * nh);
            ctx.lineTo(nx + 0.00 * nw, ny + 1.00 * nh);
            ctx.lineTo(nx + 0.00 * nw, ny + 0.40 * nh);
            ctx.closePath();
            ctx.fill();
        } else {
            ctx.beginPath();
            ctx.ellipse(nx + 0.5 * nw, ny + 0.5 * nh, 0.5 * nw, 0.5 * nh, 0, 0, TAU);
            ctx.closePath();
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
                        const lox = Math.max(nx + EDT_NODE_PADDING, nx + nw / 2 - EDT_FONT_CHAR_SIZE * graphemeLength(text.data) / 2);
                        const width = nw - EDT_NODE_PADDING;
                        let ii = 0;
                        for (const ch of splitGraphemes(text.data)) {
                            const cx = lox + (ii + 0.5) * EDT_FONT_CHAR_SIZE;
                            const cy = ny + texty;
                            if (cx - lox + 0.9 * EDT_FONT_CHAR_SIZE > width) {
                                break;
                            }
                            ctx.fillText(ch, cx, cy);
                            ++ii;
                        }
                    }
                    ++line;
                } else if (text.type === EDT_TEXT_RECT_BEGIN) {
                    rects.push({ from: text.from, to: text.to, len: text.len, texty: texty });
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

        if (node.hasOwnProperty('comment') && node.comment != '') {
            ctx.lineWidth = 5;
            ctx.strokeStyle = 'yellow';
            ctx.stroke();
        }

        if (stackNodes.has(node.dispid)) {
            ctx.lineWidth = 4;
            ctx.strokeStyle = '#222222';
            ctx.stroke();
        }

        if (this.propertyEditor !== null) {
            if (this.mouseNode !== null && node === this.mouseNode) {
                ctx.lineWidth = 1;
                ctx.strokeStyle = '#880088';
                ctx.stroke();
            }

            if (this.propertyNodes !== null && node === this.propertyNodes.node) {
                ctx.lineWidth = 3;
                ctx.strokeStyle = '#880088';
                ctx.stroke();
            }
        }
    }

    updateCanvasSize(desiredWidth, desiredHeight) {
        this.canvas.width = desiredWidth * PIXEL_RATIO;
        this.canvas.height = desiredHeight * PIXEL_RATIO;
        this.canvas.style.width = desiredWidth + 'px';
        this.canvas.style.height = desiredHeight + 'px';
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

    highlightProperty(id, isError) {
        let elem = document.getElementById(id);
        elem.style.backgroundColor = (isError ? EDT_COLOR_ERROR : EDT_COLOR_CHANGE);
    }

    appendTextProperty(parent, id, name, help, value) {
        const inList = (parent.nodeName === 'UL');

        const item = inList ? document.createElement('li') : document.createElement('span');
        const label = document.createElement('label');
        label.innerHTML = name;
        label.htmlFor = id;
        label.title = help;
        const input = document.createElement('input');
        input.id = id;
        input.name = id;
        input.type = 'text';
        input.value = value;
        input.oninput = () => { this.highlightProperty(id); };

        item.appendChild(label);
        if (inList) { appendBr(item) } else { appendText(item, ' '); }
        item.appendChild(input);
        if (inList) appendBr(item);
        parent.appendChild(item);
    }

    parseTextProperty(id, how) {
        let value = document.getElementById(id).value;
        value = value.trim();
        if (how === EDT_PARSE_TEXT_INT || how === EDT_PARSE_TEXT_WORD) {
            if (value.match(/\s+/) !== null) {
                return { ok: false, error: 'Cannot have spaces' };
            } else if (how === EDT_PARSE_TEXT_INT && value != '') {
                const asInt = parseInt(value, 10);
                if (isNaN(asInt) || asInt < 1 || asInt > 100) {
                    return { ok: false, error: 'Must be an integer between 1 and 100' };
                }
                return { ok: true, value: asInt };
            }
        }
        return { ok: true, value: value };
    }

    appendBoolProperty(parent, id, name, help, value) {
        const item = document.createElement('li');
        const label = document.createElement('label');
        label.innerHTML = name;
        label.htmlFor = id;
        label.title = help;

        const span = document.createElement('span');
        span.id = id;

        const input = document.createElement('input');
        input.id = id + '_check';
        input.name = id;
        input.type = 'checkbox';
        input.checked = value;
        input.onclick = () => { this.highlightProperty(id, false); };

        const labelCheck = document.createElement('label');
        labelCheck.innerHTML = 'set as true';
        labelCheck.htmlFor = id + '_check';

        item.appendChild(label);
        appendBr(item);
        span.appendChild(input);
        span.appendChild(labelCheck);
        item.appendChild(span);
        appendBr(item);
        parent.appendChild(item);
    }

    parseBoolProperty(id, how) {
        let value = document.getElementById(id + '_check').checked;
        return { ok: true, value: value };
    }

    appendChoiceProperty(parent, id, name, help, value, values) {
        const item = document.createElement('li');

        const label = document.createElement('label');
        label.innerHTML = name;
        label.title = help;
        item.appendChild(label);
        appendBr(item);

        const span = document.createElement('span');
        span.id = id;
        item.appendChild(span);

        for (const choice_value of values) {
            const choice_text = (choice_value === '') ? 'none' : choice_value;
            const choice_id = id + '_' + choice_value;

            const input = document.createElement('input');
            input.id = choice_id;
            input.name = id;
            input.type = 'radio';
            input.value = choice_value;
            input.checked = (choice_value === value);
            input.onclick = () => { this.highlightProperty(id, false); };

            const label = document.createElement('label');
            label.innerHTML = choice_text;
            label.htmlFor = choice_id;

            span.appendChild(input);
            span.appendChild(label);
        }
        parent.appendChild(item);
    }

    parseChoiceProperty(id, values) {
        for (const choice_value of values) {
            let elem = document.getElementById(id + '_' + choice_value);
            if (elem.checked) {
                return { ok: true, value: elem.value };
            }
        }
        return { ok: false, error: 'An unknown choice was selected.' };
    }

    appendThisEmojiPicker(parent) {
        if (this.emojiPicker) {
            appendButton(parent, 'Show/Hide Emoji Picker', 'Emoji picker can be used to copy emoji to clipboard.', null, bind0(this, 'onShowHidEmojiPicker'));
            appendText(parent, ' ');
            parent.appendChild(this.emojiMessage);
            appendBr(parent);
            parent.appendChild(this.emojiPicker);
            appendBr(parent);

        }
    }

    appendListProperty(parent, id, name, help, value) {
        this.appendTextProperty(parent, id, name, help, value.join(' '));
    }

    parseListProperty(id) {
        let value = document.getElementById(id).value;
        return { ok: true, value: value.split(/\s+/) };
    }

    appendPatternProperty(parent, id, name, help, value, tileSize) {
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
                cols = Math.max(cols, graphemeLength(layer) + 1);
            }

            for (const row of value[layer]) {
                const row_text = joinRow(row, tileSize, false);
                text += row_text + '\n';
                rows += 1;
                cols = Math.max(cols, graphemeLength(row_text));
            }
        }

        const item = document.createElement('li');
        const label = document.createElement('label');
        label.innerHTML = name;
        label.htmlFor = id;
        label.title = help;
        const input = document.createElement('textarea');
        input.id = id;
        input.name = id;
        input.innerHTML = text;
        input.style = 'font-family:monospace; letter-spacing:-0.1em; font-kerning:none; text-transform:full-width; width:' + (cols + 2) + 'em; height:' + (rows + 2) + 'lh';
        input.oninput = () => { this.highlightProperty(id, false); };

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
                    return { ok: false, error: 'Layer row count mismatch.' };
                }
                for (const row of pattern[layer]) {
                    if (cols === null) {
                        cols = row.length;
                    }
                    if (cols !== row.length) {
                        return { ok: false, error: 'Layer column count mismatch.' };
                    }
                }
            }
        }

        if (patterns.length === 1) {
            return { ok: true, value: patterns[0] };
        } else {
            return { ok: true, value: patterns };
        }
    }

    updatePropertyEditor(node, force = true) {
        if (this.propertyEditor === null) {
            return;
        }

        const changed =
            force ||
            (this.propertyNodes === null && node !== null) ||
            (this.propertyNodes !== null && node !== this.propertyNodes.node);

        if (changed) {
            const ed = this.propertyEditor;

            ed.innerHTML = '';

            appendText(ed, 'Editor', true, true);
            appendText(ed, ' ');
            appendText(ed, '(Hover for additional info)', false, false, true);
            appendBr(ed, true);

            appendButton(ed, 'Undo', 'Undo an edit.', null, bind0(this, 'onUndo'));
            appendButton(ed, 'Redo', 'Redo an edit.', null, bind0(this, 'onRedo'));
            appendText(ed, ' ');
            appendButton(ed, 'Hrz/Vrt', 'Toggle between horizontal and vertical layout.', null, bind0(this, 'onHrzVrt'));
            appendText(ed, ' ');
            appendButton(ed, 'Import', 'Import game (paste) from clipboard.', null, bind0(this, 'onImport'));
            appendButton(ed, 'Export', 'Export game (copy) to clipboard.', null, bind0(this, 'onExport'));
            appendBr(ed, true);

            this.appendTextProperty(ed, 'gameprop_name', 'Game Title', 'A title for the game', this.game.name)
            appendText(ed, ' ');
            appendButton(ed, 'Save', 'Save name change.', null, bind0(this, 'onGameSaveName'));
            appendBr(ed, true);

            this.appendThisEmojiPicker(ed);

            this.propertyNodes = (node !== null) ? { node: node, parent: this.findNodeParent(this.game.tree, node) } : null;
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

                const tooltip_help = 'Get more information about this node type.';
                const tooltip_add_front = 'Add new node at front of children.';
                const tooltip_add_back = 'Add new node at back of children.';
                const tooltip_add_below = 'Add new child node, and move current children to new node.';
                const tooltip_add_above = 'Add node as new parent to current node.';

                const node_clr = this.nodeColor(node.type, false);
                const node_help_str = EDT_NODE_HELP[node.type].help;

                appendButton(ed, '?', tooltip_help, node_clr, () => { alert(node.type + ': ' + node_help_str); });
                appendText(ed, ' ' + node.type, true);
                appendBr(ed, true);

                if (parent !== null) {
                    appendButton(ed, 'Move Earlier', 'Move node earlier in parent.', null, bind1(this, 'onNodeShift', true));
                    appendButton(ed, 'Move Later', 'Move node later in parent.', null, bind1(this, 'onNodeShift', false));
                    if (node.type === 'player') {
                        // pass
                    } else if (node.hasOwnProperty('children')) {
                        appendButton(ed, 'Swap with Parent', 'Swap node with parent.', null, bind0(this, 'onNodeSwapUp'));
                    }
                }
                appendBr(ed, true);

                appendButton(ed, 'Copy Subtree', 'Remember this subtree to paste later.', null, bind1(this, 'onNodeCopy', false));
                if (node !== this.game.tree) {
                    appendButton(ed, 'Cut Subtree', 'Remember this subtree to paste later, and delete it.', null, bind1(this, 'onNodeCopy', true));
                }
                if (this.clipboard !== null) {
                    if (node.hasOwnProperty('children')) {
                        if (node.type === 'player' && !can_be_player_children([this.clipboard])) {
                            // pass
                        } else {
                            appendButton(ed, 'Paste Subtree', 'Paste the remembered subtree.', null, bind1(this, 'onNodePaste', true));
                        }
                    }
                }
                appendBr(ed, true);

                if (node.hasOwnProperty('children') && node.children.length > 0) {
                    if (node !== this.game.tree) {
                        appendButton(ed, 'Delete and Reparent', 'Delete this node and move its children to the parent.', null, bind1(this, 'onNodeDelete', true));
                        appendButton(ed, 'Delete Subtree', 'Delete this node and the whole subtree.', null, bind1(this, 'onNodeDelete', false));
                    }
                    appendButton(ed, 'Delete Children', 'Delete all children of this node.', null, bind1(this, 'onNodeDeleteChildren', false));
                    appendBr(ed, true);
                } else if (node !== this.game.tree) {
                    appendButton(ed, 'Delete', 'Delete this node.', null, bind1(this, 'onNodeDelete', false));
                    appendBr(ed, true);
                }

                let anyProperties = false;

                const list = appendList(ed);

                if (node.hasOwnProperty('comment')) {
                    this.appendTextProperty(list, 'prop_comment', EDT_PROP_NAMES['comment'].name, EDT_PROP_NAMES['comment'].help, node.comment);
                    anyProperties = true;
                }
                if (node.hasOwnProperty('nid')) {
                    this.appendTextProperty(list, 'prop_nid', EDT_PROP_NAMES['nid'].name, EDT_PROP_NAMES['nid'].help, node.nid);
                    anyProperties = true;
                }
                if (node.hasOwnProperty('remorig')) {
                    this.appendBoolProperty(list, 'prop_remorig', EDT_PROP_NAMES['remorig'].name, EDT_PROP_NAMES['remorig'].help, node.remorig);
                    anyProperties = true;
                }
                if (node.hasOwnProperty('file')) {
                    this.appendTextProperty(list, 'prop_file', EDT_PROP_NAMES['file'].name, EDT_PROP_NAMES['file'].help, node.file);
                    anyProperties = true;
                }
                if (node.hasOwnProperty('target')) {
                    this.appendTextProperty(list, 'prop_target', EDT_PROP_NAMES['target'].name, EDT_PROP_NAMES['target'].help, node.target);
                    anyProperties = true;
                }
                if (node.hasOwnProperty('pid')) {
                    this.appendTextProperty(list, 'prop_pid', EDT_PROP_NAMES['pid'].name, EDT_PROP_NAMES['pid'].help, node.pid);
                    anyProperties = true;
                }
                if (node.hasOwnProperty('layer')) {
                    this.appendTextProperty(list, 'prop_layer', EDT_PROP_NAMES['layer'].name, EDT_PROP_NAMES['layer'].help, node.layer);
                    anyProperties = true;
                }
                if (node.hasOwnProperty('times')) {
                    this.appendTextProperty(list, 'prop_times', EDT_PROP_NAMES['times'].name, EDT_PROP_NAMES['times'].help, node.times);
                    anyProperties = true;
                }
                if (node.hasOwnProperty('what')) {
                    this.appendTextProperty(list, 'prop_what', EDT_PROP_NAMES['what'].name, EDT_PROP_NAMES['what'].help, node.what);
                    anyProperties = true;
                }
                if (node.hasOwnProperty('with')) {
                    this.appendTextProperty(list, 'prop_with', EDT_PROP_NAMES['with'].name, EDT_PROP_NAMES['with'].help, node.with);
                    anyProperties = true;
                }
                if (node.hasOwnProperty('withs')) {
                    this.appendListProperty(list, 'prop_withs', EDT_PROP_NAMES['withs'].name, EDT_PROP_NAMES['withs'].help, node.withs);
                    anyProperties = true;
                }
                if (node.hasOwnProperty('button')) {
                    this.appendChoiceProperty(list, 'prop_button', EDT_PROP_NAMES['button'].name, EDT_PROP_NAMES['button'].help, node.button, EDT_BUTTONS);
                    anyProperties = true;
                }
                if (node.hasOwnProperty('pattern')) {
                    const tileSize = getTileSize([node.pattern]);
                    this.appendPatternProperty(list, 'prop_pattern', EDT_PROP_NAMES['pattern'].name, EDT_PROP_NAMES['pattern'].help, node.pattern, tileSize);
                    anyProperties = true;
                }
                if (node.hasOwnProperty('lhs') || node.hasOwnProperty('rhs')) {
                    const hasLHS = node.hasOwnProperty('lhs');
                    const hasRHS = node.hasOwnProperty('rhs');
                    const tileSize = (hasLHS && hasRHS) ? getTileSize([node.lhs, node.rhs]) : (hasLHS ? getTileSize([node.lhs]) : getTileSize([node.rhs]));
                    if (hasLHS) {
                        this.appendPatternProperty(list, 'prop_lhs', EDT_PROP_NAMES['lhs'].name, EDT_PROP_NAMES['lhs'].help, node.lhs, tileSize);
                        anyProperties = true;
                    }
                    if (hasRHS) {
                        this.appendPatternProperty(list, 'prop_rhs', EDT_PROP_NAMES['rhs'].name, EDT_PROP_NAMES['rhs'].help, node.rhs, tileSize);
                        anyProperties = true;
                    }
                }

                if (anyProperties) {
                    appendButton(ed, 'Save', 'Save node changes.', null, bind0(this, 'onNodeSaveProperties'));
                    appendBr(ed, true);
                }

                appendText(ed, 'Add');

                const table = document.createElement('table');
                ed.appendChild(table);
                const tbody = document.createElement('tbody');
                table.appendChild(tbody);
                const tr = document.createElement('tr');
                tr.style = 'vertical-align:top; font-size:small';
                tbody.appendChild(tr);
                const td1 = document.createElement('td');
                tr.appendChild(td1);
                const td2 = document.createElement('td');
                tr.appendChild(td2);

                for (let [elem, protos] of [[td1, EDT_NODE_PROTOTYPES], [td2, EDT_XNODE_PROTOTYPES]]) {
                    for (const proto of protos) {
                        const clr = this.nodeColor(proto.type, false);
                        const help_str = EDT_NODE_HELP[proto.type].help;

                        if (node.hasOwnProperty('children')) {
                            if (node.type === 'player' && !can_be_player_children([proto])) {
                                // pass
                            } else {
                                if (node.children.length === 0) {
                                    appendButton(elem, '\u2193', tooltip_add_front, clr, bind2(this, 'onNodeAddChild', proto.type, 'front'));
                                } else {
                                    appendButton(elem, '\u2199', tooltip_add_front, clr, bind2(this, 'onNodeAddChild', proto.type, 'front'));
                                    appendButton(elem, '\u2198', tooltip_add_back, clr, bind2(this, 'onNodeAddChild', proto.type, 'back'));
                                }
                            }
                        }

                        if (node.hasOwnProperty('children') && proto.hasOwnProperty('children')) {
                            if (proto.type === 'player' && !can_be_player_children(node.children)) {
                                // pass
                            } else if (node.type === 'player' && !can_be_player_children([proto])) {
                                // pass
                            } else {
                                if (node.children.length > 0) {
                                    appendButton(elem, '\u2913', tooltip_add_below, clr, bind2(this, 'onNodeAddChild', proto.type, 'below'));
                                }
                            }
                        }

                        if (parent !== null && parent.hasOwnProperty('children') && proto.hasOwnProperty('children')) {
                            if (proto.type === 'player' && !can_be_player_children([node])) {
                                // pass
                            } else if (parent.type === 'player' && !can_be_player_children([proto])) {
                                // pass
                            } else {
                                appendButton(elem, '\u2912', tooltip_add_above, clr, bind1(this, 'onNodeAddParent', proto.type));
                            }
                        }

                        appendButton(elem, '?', tooltip_help, clr, () => { alert(proto.type + ': ' + help_str); });
                        appendText(elem, ' ' + proto.type);
                        appendBr(elem);
                    }
                }
            }
        }
    }

    onGameSaveName() {
        this.hasChanged = true;
        const SAVE_PROPS = [['name', bind0(this, 'parseTextProperty'), EDT_PARSE_TEXT_TEXT]];

        let new_props = new Map();
        let alert_strs = [];
        for (let [propid, propfn, proparg] of SAVE_PROPS) {
            let result = propfn('gameprop_' + propid, proparg);
            if (!result.ok) {
                this.highlightProperty('gameprop_' + propid, true);
                alert_strs.push('Error saving ' + EDT_PROP_NAMES[propid].name + '.\n' + result.error);
            } else {
                new_props.set(propid, result.value);
            }
        }

        if (alert_strs.length > 0) {
            alert(alert_strs.join('\n\n'));
            return;
        }

        for (let [propid, value] of new_props.entries()) {
            this.game[propid] = value;
        }

        this.updateTreeStructureAndDraw(false, false);
    }

    onNodeSaveProperties() {
        this.hasChanged = true;
        const SAVE_PROPS =
            [['comment', bind0(this, 'parseTextProperty'), EDT_PARSE_TEXT_TEXT],
            ['nid', bind0(this, 'parseTextProperty'), EDT_PARSE_TEXT_WORD],
            ['remorig', bind0(this, 'parseBoolProperty'), EDT_PARSE_TEXT_WORD],
            ['file', bind0(this, 'parseTextProperty'), EDT_PARSE_TEXT_WORD],
            ['target', bind0(this, 'parseTextProperty'), EDT_PARSE_TEXT_WORD],
            ['pid', bind0(this, 'parseTextProperty'), EDT_PARSE_TEXT_WORD],
            ['layer', bind0(this, 'parseTextProperty'), EDT_PARSE_TEXT_WORD],
            ['times', bind0(this, 'parseTextProperty'), EDT_PARSE_TEXT_INT],
            ['what', bind0(this, 'parseTextProperty'), EDT_PARSE_TEXT_WORD],
            ['with', bind0(this, 'parseTextProperty'), EDT_PARSE_TEXT_WORD],
            ['withs', bind0(this, 'parseListProperty'), false],
            ['button', bind0(this, 'parseChoiceProperty'), EDT_BUTTONS],
            ['pattern', bind0(this, 'parsePatternProperty'), undefined],
            ['lhs', bind0(this, 'parsePatternProperty'), undefined],
            ['rhs', bind0(this, 'parsePatternProperty'), undefined]];

        let node = this.propertyNodes.node;

        let new_props = new Map();
        let alert_strs = [];

        for (let [propid, propfn, proparg] of SAVE_PROPS) {
            if (node.hasOwnProperty(propid)) {
                let result = propfn('prop_' + propid, proparg);
                if (!result.ok) {
                    this.highlightProperty('prop_' + propid, true);
                    alert_strs.push('Error saving ' + EDT_PROP_NAMES[propid].name + '.\n' + result.error);
                } else {
                    new_props.set(propid, result.value);
                }
            }
        }

        if (new_props.has('lhs') && new_props.has('rhs')) {
            let result = this.checkPatterns([new_props.get('lhs'), new_props.get('rhs')]);
            if (!result.ok) {
                this.highlightProperty('prop_lhs', true);
                this.highlightProperty('prop_rhs', true);
                let reset_colors = () => {
                    this.highlightProperty('prop_lhs', false);
                    this.highlightProperty('prop_rhs', false);
                }
                document.getElementById('prop_lhs').oninput = reset_colors;
                document.getElementById('prop_rhs').oninput = reset_colors;
                alert_strs.push('Error saving ' + EDT_PROP_NAMES['lhs'].name + ' and ' + EDT_PROP_NAMES['rhs'].name + '.\n' + result.error);
            }
        }

        if (alert_strs.length > 0) {
            alert(alert_strs.join('\n\n'));
            return;
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
                this.updatePropertyEditor(null);
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

    onNodeAddChild(type, where) {
        let node = this.propertyNodes.node;

        let new_node = deepcopyobj(this.getNodePrototype(type));
        if (where === 'below') {
            new_node.children = node.children;
            node.children = [new_node];
        } else if (where === 'back') {
            node.children.push(new_node);
        } else if (where === 'front') {
            node.children.unshift(new_node);
        }
        this.updateTreeStructureAndDraw(false, false);
    }

    onNodeAddParent(type) {
        let node = this.propertyNodes.node;
        let parent = this.propertyNodes.parent;

        if (parent !== null) {
            const index = parent.children.indexOf(node);

            let new_node = deepcopyobj(this.getNodePrototype(type));
            new_node.children = [node];

            //parent.children.splice(index, 1);
            parent.children.splice(index, 1, new_node);

            this.updateTreeStructureAndDraw(false, false);
        }
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

    onNodeSwapUp() {
        let node = this.propertyNodes.node;
        let parent = this.propertyNodes.parent;

        function reassignnode(nodeto, nodefrom) {
            for (const prop of Object.getOwnPropertyNames(nodeto)) {
                if (prop !== 'children') {
                    delete nodeto[prop];
                }
            }
            for (const prop of Object.getOwnPropertyNames(nodefrom)) {
                if (prop !== 'children') {
                    nodeto[prop] = nodefrom[prop];
                }
            }
        }

        if (parent !== null) {
            const tmp = shallowcopyobj(parent);
            reassignnode(parent, node);
            reassignnode(node, tmp);
            this.updateTreeStructureAndDraw(false, false);
        }
    }

    onUndo() {
        this.undoUndo();
    }

    onRedo() {
        this.undoRedo();
    }

    onShowHidEmojiPicker() {
        if (this.emojiPicker !== null) {
            if (this.emojiPicker.style.display === 'none') {
                this.emojiPicker.style.display = 'block';
            } else {
                this.emojiPicker.style.display = 'none';
            }
        }
    }

    onHrzVrt() {
        this.layout_horizontal = !this.layout_horizontal;
        this.updatePositionsAndDraw(false);

        if (this.xform_editor !== null) {
            this.xform_editor.layout_horizontal = this.layout_horizontal;
            this.xform_editor.updatePositionsAndDraw(false);
        }
    }

    importGame(game) {
        copyIntoGame(this.game, game);

        this.mousePan = null;
        this.mouseZoom = null;

        this.mouseNode = null;
        this.mousePos_u = null;
        this.mousePos = null;

        this.updateTreeStructureAndDraw(false, true);
        this.updatePropertyEditor(this.mouseNode);

        this.resetXform();
        if (this.xform_editor !== null) {
            this.xform_editor.resetXform();
        }
    }

    onImport() {
        if (!navigator.clipboard) {
            alert('ERROR: Cannot find clipboard.');
        } else {
            let this_editor = this;
            navigator.clipboard.readText().then(function (text) {
                let gameImport = JSON.parse(text);
                this_editor.clearNodeDispid(gameImport.tree);

                this_editor.importGame(gameImport);

                alert('Game imported from clipboard.');
            }, function (err) {
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
            let text = JSON.stringify(gameExport);
            text = text.replace(/[\u007F-\uFFFF]/g, function (chr) {
                return '\\u' + ('0000' + chr.charCodeAt(0).toString(16)).substr(-4)
            });
            navigator.clipboard.writeText(text).then(function () {
                alert('Game exported to clipboard.');
            }, function (err) {
                alert('ERROR: Could not export game to clipboard.');
            });
        }
    }

    onMouseDown(evt) {
        this.canvas.focus();

        const mouseButton = evt.button;

        const mouseTime = Date.now();

        const isDouble = (this.mouseLastTime !== null && mouseTime - this.mouseLastTime <= DOUBLE_CLICK_TIME);

        this.mouseLastTime = mouseTime;
        this.mouseClearProp = true;

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

            this.updatePropertyEditor(this.mouseNode, false);
            this.mouseClearProp = false;
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
        }

        evt.preventDefault();
        this.requestDraw();
    }

    onMouseUp(evt) {
        const mouseButton = evt.button;

        if (this.mouseClearProp) {
            this.updatePropertyEditor(null, false);
        }

        this.mousePan = null;
        this.mouseZoom = null;

        evt.preventDefault();
        this.requestDraw();
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
                this.mouseClearProp = false;
            }
        } else if (this.mouseZoom !== null) {
            if (this.mousePos !== null) {
                this.zoomAroundXform(this.mouseZoom, 1 + ((mousePos_u.y - this.mousePos_u.y) / 400));
                mousePos = this.xformInv.transformPoint(mousePos_u);
                this.mouseClearProp = false;
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

        if (this.mouseNode && this.mouseNode.hasOwnProperty('comment') && this.mouseNode['comment'] !== '') {
            this.tooltip.style.display = 'block';
            this.tooltip.style.left = (evt.pageX) + 'px';
            this.tooltip.style.top = (evt.pageY + 15) + 'px';
            this.tooltip.innerHTML = this.mouseNode['comment'];
        } else {
            this.tooltip.style.display = 'none';
        }

        evt.preventDefault();
        this.requestDraw();
    }

    onMouseOut(evt) {
        this.mousePan = null;
        this.mouseZoom = null;

        this.mouseNode = null;
        this.mousePos_u = null;
        this.mousePos = null;

        this.tooltip.style.display = 'none';

        evt.preventDefault();
        this.requestDraw();
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
        this.requestDraw();
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
        this.requestDraw();
    }

    onKeyUp(evt) {
        let key = evt.key;

        this.keysDown.delete(key);

        evt.preventDefault();
    }

};
