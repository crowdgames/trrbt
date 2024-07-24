const EDT_NODE_PADDING = 8;
const EDT_NODE_SPACING = 25;

const EDT_FONT_SIZE = 10;
const EDT_FONT_CHAR_SIZE = 6;
const EDT_FONT_LINE_SIZE = 12;

const EDT_TEXT_FONT  = 0;
const EDT_TEXT_COLOR = 1;
const EDT_TEXT_LINE  = 2;

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

function xform_unique(nodes) {
    let ret = [];
    for (const node of nodes) {
        let unique = true;
        for (const rnode of ret) {
            let same = true;
            for (const key of ['pattern', 'lhs', 'rhs', 'pid', 'button']) {
                if (node.hasOwnProperty(key) != rnode.hasOwnProperty(key)) {
                    same = false;
                    break;
                } else if (node.hasOwnProperty(key) && rnode.hasOwnProperty(key)) {
                    if (JSON.stringify(node[key]) != JSON.stringify(rnode[key])) {
                        same = false;
                        break;
                    }
                }
            }
            if (same) {
                unique = false;
            }
        }
        if (unique) {
            ret.push(node);
        }
    }
    return ret;
}

function xform_rule_apply(node, pattern_func, pid_func, button_obj) {
    if (pattern_func !== null) {
        for (const key of ['pattern', 'lhs', 'rhs']) {
            if (node.hasOwnProperty(key)) {
                let new_patt = {}
                for (const layer of Object.getOwnPropertyNames(node[key])) {
                    new_patt[layer] = pattern_func(node[key][layer]);
                }
                node[key] = new_patt;
            }
        }
    }

    if (pid_func !== null) {
        if (node.hasOwnProperty('pid')) {
            node.pid = pid_func(node.pid);
        }
    }

    if (button_obj !== null) {
        if (node.hasOwnProperty('button')) {
            if (button_obj.hasOwnProperty(node.button)) {
                node.button = button_obj[node.button];
            }
        }
    }

    return node;
}

function xform_rule_identity(node) {
    return [node];
}

function xform_rule_mirror(node) {
    function pattern_func(patt) {
        return patt.slice().map(row=>row.slice().reverse());
    }
    let button_obj = {'left':'right', 'right':'left'};

    return [node, xform_rule_apply(shallowcopyobj(node), pattern_func, null, button_obj)];
}

function xform_rule_rotate(node) {
    function pattern_func(patt) {
        return patt[0].slice().map((val, index) => patt.slice().map(row => row.slice()[index]).reverse());
    }
    let button_obj = {'left':'up', 'up':'right', 'right':'down', 'down':'left'};

    return [node, xform_rule_apply(shallowcopyobj(node), pattern_func, null, button_obj)];
}

function xform_rule_spin(node) {
    function pattern_func(patt) {
        return patt[0].slice().map((val, index) => patt.slice().map(row => row.slice()[index]).reverse());
    }
    let button_obj = {'left':'up', 'up':'right', 'right':'down', 'down':'left'};

    let ret = [node];
    for (let ii = 0; ii < 3; ++ ii) {
        ret.push(xform_rule_apply(shallowcopyobj(ret.at(-1)), pattern_func, null, button_obj));
    }
    return ret;
}

function xform_rule_skew(node) {
    function pattern_func(patt) {
        const rows = patt.length;
        const cols = patt[0].length;
        let ret = [];
        for (let rr = 0; rr < rows + cols - 1; ++ rr) {
            let row = [];
            for (let cc = 0; cc < cols; ++ cc) {
                const skewed = rr - cc;
                if (0 <= skewed && skewed < patt.length) {
                    row.push(patt[skewed][cc]);
                } else {
                    row.push('.');
                }
            }
            ret.push(row);
        }
        return ret;
    }

    return [node, xform_rule_apply(shallowcopyobj(node), pattern_func, null, null)];
}

function xform_rule_flip_only(node) {
    function pattern_func(patt) {
        return patt.slice().reverse();
    }
    let button_obj = {'up':'down', 'down':'up'};

    return [xform_rule_apply(shallowcopyobj(node), pattern_func, null, button_obj)];
}

function xform_rule_swap_only_fn(wht, wth) {
    function pattern_func(patt) {
        let ret = [];
        for (let row of patt) {
            let ret_row = [];
            for (let tile of row) {
                let ret_tile = '';
                for (let char of tile) {
                    if (char === wht) {
                        char = wth;
                    } else if (char === wth) {
                        char = wht;
                    }
                    ret_tile += char;
                }
                ret_row.push(ret_tile);
            }
            ret.push(ret_row);
        }
        return ret;
    }

    function pid_func(pid) {
        let ret = '';
        for (let char of pid) {
            if (char === wht) {
                char = wth;
            } else if (char === wth) {
                char = wht;
            }
            ret += char;
        }
        return ret;
    }

    function rule_swap_only(node) {
        return [xform_rule_apply(shallowcopyobj(node), pattern_func, pid_func, null)];
    }

    return rule_swap_only;
}

function xform_rule_replace_only_fn(wht, wth) {
    function pattern_func_fn(which) {
        function pattern_func(patt) {
            let ret = [];
            for (let row of patt) {
                let ret_row = [];
                for (let tile of row) {
                    let ret_tile = '';
                    for (let char of tile) {
                        if (char === wht) {
                            char = which;
                        }
                        ret_tile += char;
                    }
                    ret_row.push(ret_tile);
                }
                ret.push(ret_row);
            }
            return ret;
        }
        return pattern_func;
    }

    function pid_func_fn(which) {
        function pid_func(pid) {
            let ret = '';
            for (let char of pid) {
                if (char === wht) {
                    char = which;
                }
                ret += char;
            }
            return ret;
        }
        return pid_func;
    }

    function rule_replace_only(node) {
        let ret = [];
        for (const which of wth.split(/\s+/)) {
            ret.push(xform_rule_apply(shallowcopyobj(node), pattern_func_fn(which), pid_func_fn(which), null));
        }
        return xform_unique(ret);
    }

    return rule_replace_only;
}

function xformApplyToNode(node, xforms, nidToNode, dispid_pref) {
    let ret_nodes = [];

    node = shallowcopyobj(node);

    if (dispid_pref) {
        node.dispid = dispid_pref + '_' + node.dispid;
    }

    if (node.hasOwnProperty('comment')) {
        delete node.comment;
    }
    if (node.hasOwnProperty('nid')) {
        delete node.nid;
    }

    const ntype = node.type;

    if (['x-ident', 'x-mirror', 'x-skew', 'x-rotate', 'x-spin', 'x-flip-only', 'x-swap-only', 'x-replace-only'].indexOf(ntype) >= 0 || (ntype.startsWith('x-') && ntype !== 'x-link')) {
        let fn = null;
        if (ntype === 'x-ident') {
            fn = xform_rule_identity;
        } else if (ntype === 'x-mirror') {
            fn = xform_rule_mirror;
        } else if (ntype === 'x-rotate') {
            fn = xform_rule_rotate;
        } else if (ntype === 'x-spin') {
            fn = xform_rule_spin;
        } else if (ntype === 'x-skew') {
            fn = xform_rule_skew;
        } else if (ntype === 'x-flip-only') {
            fn = xform_rule_flip_only;
        } else if (ntype === 'x-swap-only') {
            fn = xform_rule_swap_only_fn(node.what, node.with);
        } else if (ntype === 'x-replace-only') {
            fn = xform_rule_replace_only_fn(node.what, node.with);
        } else {
            fn = xform_rule_identity;
        }

        for (const child of node.children) {
            let dispid_suff = 0;
            const children_xformed = xformApplyToNode(child, [fn].concat(xforms), nidToNode, dispid_pref)
            for (let child_xformed of children_xformed) {
                if (dispid_suff > 0) {
                    child_xformed.dispid = children_xformed[0].dispid + '_' + dispid_suff;
                }
                ++ dispid_suff;
                ret_nodes.push(child_xformed);
            }
        }
    } else if ('x-link' === ntype) {
        const target = nidToNode.get(node.target);
        if (target) {
            const linked = xformApplyToNode(deepcopyobj(target), xforms, nidToNode, node.dispid);
            ret_nodes.push(...linked);
        }
    } else {
        let xformed = [node];
        for (let xform of xforms) {
            let new_xformed = [];
            for (let xformed_node of xformed) {
                const xformed_node_applied = xform(xformed_node);
                new_xformed.push(...xformed_node_applied);
            }
            xformed = new_xformed;
        }
        ret_nodes = xformed;

        for (let ret_node of ret_nodes) {
            if (ret_node.hasOwnProperty('children')) {
                let new_children = []
                for (const child of ret_node.children) {
                    const child_xformed = xformApplyToNode(child, xforms, nidToNode, dispid_pref)
                    new_children.push(...child_xformed);
                }
                ret_node.children = new_children;
            }
        }
    }

    return ret_nodes;
}

function xformApplyToTree(tree, nidToNode) {
    return xformApplyToNode(tree, [xform_rule_identity], nidToNode)[0];
}



class TRRBTEditor {

    constructor(game, canvasname, divname) {
        this.game = game;
        this.canvasname = canvasname;
        this.divname = divname;

        this.canvas = null;
        this.ctx = null;
        this.propertyEditor = null;
        this.keysDown = new Set();

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

        this.updateTreeStructure();
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
            this.xform_editor.game.name = this.game.name;
            this.xform_editor.game.sprites = this.game.sprites;
            this.xform_editor.game.tree = xformApplyToTree(this.game.tree, this.nidToNode);
            this.xform_editor.updateTreeStructure();
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
        if (node.hasOwnProperty('nid') && node.nid != '') {
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
        this.updateNodeIdsNode(this.game.tree);
    }

    updateTreeStructure() {
        this.updateNodeIds();
        this.updateXformedTreeStructure();
    }

    updateTreeStructureAndDraw(skipAnimate) {
        this.updateTreeStructure();
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
                        size = Math.max(size, tile.length);
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
            texts.push({type:EDT_TEXT_LINE,  data:'nid: ' + node.nid});
        }

        if (node.hasOwnProperty('target') && node.target != '') {
            texts.push({type:EDT_TEXT_LINE,  data:'target: ' + node.target});
        }

        if (node.hasOwnProperty('pid') && node.pid != '') {
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

        if (node.hasOwnProperty('button') && node.button !== '') {
            texts.push({type:EDT_TEXT_LINE,  data:'[' + node.button + ']'});
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
                    texts.push({type:EDT_TEXT_LINE, data:this.joinRow(node.pattern[layer][ii], tileSize, false)});
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

                const length = node.lhs.hasOwnProperty(layer) ? node.lhs[layer].length : node.rhs[layer].length;
                for (let ii = 0; ii < length; ++ ii) {
                    const connect = (ii === 0) ? ' → ' : '   ';
                    let lhs = node.lhs.hasOwnProperty(layer) ? this.joinRow(node.lhs[layer][ii], tileSize, true) : null;
                    let rhs = node.rhs.hasOwnProperty(layer) ? this.joinRow(node.rhs[layer][ii], tileSize, true) : null;
                    lhs = (lhs !== null) ? lhs : ' '.repeat(rhs.length);
                    rhs = (rhs !== null) ? rhs : ' '.repeat(lhs.length);
                    texts.push({type:EDT_TEXT_LINE,  data:lhs + connect + rhs});
                }
            }
        }

        let nx = xpos;
        let ny = ypos;

        let nw = 2 * EDT_NODE_PADDING;
        let nh = 2 * EDT_NODE_PADDING;

        for (const text of texts) {
            if (text.type === EDT_TEXT_LINE) {
                nw = Math.max(nw, 2 * EDT_NODE_PADDING + EDT_FONT_CHAR_SIZE * text.data.length);
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

        let line = 0;
        for (const text of nodeTexts.get(node.dispid)) {
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

        item.appendChild(label)
        appendBr(item)
        item.appendChild(input)
        appendBr(item)
        parent.appendChild(item);
    }

    appendChoiceProperty(parent, id, name, value, values) {
        const item = document.createElement('li');
        appendText(item, name)
        appendBr(item)
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
                if (choice_value === null) {
                    return null;
                } else {
                    return elem.value;
                }
            }
        }
        return null;
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
                cols = Math.max(cols, layer.length + 1);
            }

            for (const row of value[layer]) {
                const rowText = this.joinRow(row, tileSize, false);
                text += rowText + '\n';
                rows += 1;
                cols = Math.max(cols, rowText.length);
            }
        }
        rows = Math.max(4, rows + 2);
        cols = Math.max(8, cols + 2);

        const item = document.createElement('li');
        const label = document.createElement('label');
        label.innerHTML = name;
        label.htmlFor = id;
        const input = document.createElement('textarea');
        input.id = id;
        input.name = id;
        input.innerHTML = text;
        input.rows = rows;
        input.cols = cols;

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
        return pattern;
    }

    updatePropertyEditor(node) {
        if (this.propertyEditor === null) {
            return;
        }

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

                const ed = this.propertyEditor;

                ed.innerHTML = '';

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
                    this.appendTextProperty(list, 'prop_nid', 'node id', node.nid);
                    anyProperties = true;
                }
                if (node.hasOwnProperty('target')) {
                    this.appendTextProperty(list, 'prop_target', 'target id', node.target);
                    anyProperties = true;
                }
                if (node.hasOwnProperty('pid')) {
                    this.appendTextProperty(list, 'prop_pid', 'player id', node.pid);
                    anyProperties = true;
                }
                if (node.hasOwnProperty('times')) {
                    this.appendTextProperty(list, 'prop_times', 'times', node.times);
                    anyProperties = true;
                }
                if (node.hasOwnProperty('what')) {
                    this.appendTextProperty(list, 'prop_what', 'what', node.what);
                    anyProperties = true;
                }
                if (node.hasOwnProperty('with')) {
                    this.appendTextProperty(list, 'prop_with', 'with', node.with);
                    anyProperties = true;
                }

                if (node.hasOwnProperty('button')) {
                    this.appendChoiceProperty(list, 'prop_button', 'button', node.button, EDT_BUTTONS);
                    anyProperties = true;
                }
                if (node.hasOwnProperty('pattern')) {
                    const tileSize = this.getTileSize([node.pattern]);
                    this.appendPatternProperty(list, 'prop_pattern', 'pattern', node.pattern, tileSize);
                    anyProperties = true;
                }
                if (node.hasOwnProperty('lhs') || node.hasOwnProperty('rhs')) {
                    const hasLHS = node.hasOwnProperty('lhs');
                    const hasRHS = node.hasOwnProperty('rhs');
                    const tileSize = (hasLHS && hasRHS) ? this.getTileSize([node.lhs, node.rhs]) : (hasLHS ? this.getTileSize([node.lhs]) : this.getTileSize([node.rhs]));
                    if (hasLHS) {
                        this.appendPatternProperty(list, 'prop_lhs', 'LHS', node.lhs, tileSize);
                        anyProperties = true;
                    }
                    if (hasRHS) {
                        this.appendPatternProperty(list, 'prop_rhs', 'RHS', node.rhs, tileSize);
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
            } else {
                this.propertyEditor.innerHTML = '';
            }
        }
    }

    onNodeSaveProperties() {
        let node = this.propertyNodes.node;

        if (node.hasOwnProperty('nid')) {
            node.nid = document.getElementById('prop_nid').value;
        }
        if (node.hasOwnProperty('target')) {
            node.target = document.getElementById('prop_target').value;
        }
        if (node.hasOwnProperty('pid')) {
            node.pid = document.getElementById('prop_pid').value;
        }
        if (node.hasOwnProperty('times')) {
            node.times = document.getElementById('prop_times').value;
        }
        if (node.hasOwnProperty('what')) {
            node.what = document.getElementById('prop_what').value;
        }
        if (node.hasOwnProperty('with')) {
            node.with = document.getElementById('prop_with').value;
        }
        if (node.hasOwnProperty('button')) {
            node.button = this.parseChoiceProperty('prop_button', EDT_BUTTONS);
        }
        if (node.hasOwnProperty('pattern')) {
            node.pattern = this.parsePatternProperty('prop_pattern');
        }
        if (node.hasOwnProperty('lhs')) {
            node.lhs = this.parsePatternProperty('prop_lhs');
        }
        if (node.hasOwnProperty('rhs')) {
            node.rhs = this.parsePatternProperty('prop_rhs');
        }

        this.updateTreeStructureAndDraw(false);
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
            this.updateTreeStructureAndDraw(false);
        }
    }

    onNodePaste() {
        let node = this.propertyNodes.node;

        if (this.clipboard !== null) {
            node.children.push(deepcopyobj(this.clipboard));
            this.updateTreeStructureAndDraw(false);
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
                this.updateTreeStructureAndDraw(false);
            }
        }
    }

    onNodeDeleteChildren() {
        let node = this.propertyNodes.node;

        node.children = [];

        this.collapseNodes(node, false);
        this.updateTreeStructureAndDraw(false);
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
        this.updateTreeStructureAndDraw(false);
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
                    this.updateTreeStructureAndDraw(false);
                } else if (!earlier && index + 1 < parent.children.length) {
                    parent.children.splice(index, 1);
                    parent.children.splice(index + 1, 0, node);
                    this.updateTreeStructureAndDraw(false);
                }
            }
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
