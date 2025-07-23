const BUTTON_LEFT = 0;
const BUTTON_RIGHT = 2;
const PIXEL_RATIO = (typeof (window) === 'undefined') ? 1 : window.devicePixelRatio;
const DOUBLE_CLICK_TIME = 300;

const TAU = 2 * Math.PI;

const SEGMENTER = new Intl.Segmenter();

var TELEMETRY_DATA = JSON.parse(localStorage.getItem("TELEMETRY_DATA")) || [];

let G_nextId = 0;

function getNextId() {
    ++G_nextId;
    return G_nextId;
}

function copymap(map) {
    if (map === null) {
        return null;
    } else {
        return new Map(JSON.parse(JSON.stringify(Array.from(map))));
    }
}

function shallowcopyobj(obj) {
    if (obj === null) {
        return null;
    } else if (obj === true) {
        return true;
    } else if (obj === false) {
        return false;
    } else {
        return Object.assign({}, obj);
    }
}

function deepcopyobj(obj) {
    if (obj === null) {
        return null;
    } else if (obj === true) {
        return true;
    } else if (obj === false) {
        return false;
    } else {
        return JSON.parse(JSON.stringify(obj));
    }
}

function samepropsobj(obj1, obj2) {
    const props1 = Object.getOwnPropertyNames(obj1);
    const props2 = Object.getOwnPropertyNames(obj2);

    if (props1.length !== props2.length) {
        return false;
    }

    for (const p1 of props1) {
        if (props2.indexOf(p1) < 0) {
            return false;
        }
    }

    return true;
}

function bind0(obj, fn) {
    return obj[fn].bind(obj);
}

function bind1(obj, fn, arg1) {
    return obj[fn].bind(obj, arg1);
}

function bind2(obj, fn, arg1, arg2) {
    return obj[fn].bind(obj, arg1, arg2);
}



function appendText(parent, text, bold = false, underline = false, italic = false) {
    let elem = document.createTextNode(text);
    if (bold) {
        const elem_b = document.createElement('b');
        elem_b.appendChild(elem);
        elem = elem_b;
    }
    if (underline) {
        const elem_u = document.createElement('u');
        elem_u.appendChild(elem);
        elem = elem_u;
    }
    if (italic) {
        const elem_i = document.createElement('i');
        elem_i.appendChild(elem);
        elem = elem_i;
    }
    parent.appendChild(elem);
}

function appendButton(parent, id, text, tooltip, color, callback) {
    const button = document.createElement('button');
    button.innerHTML = text;
    button.title = tooltip;
    if (color !== null) {
        button.style.backgroundColor = color
    } else {
        button.style.backgroundColor = '#dddddd';
    }
    button.onclick = () => {
        telemetry("button-" + id)
        callback();
    };
    parent.appendChild(button)
}

function telemetry(action) {
    // console.log(action);
    // TELEMETRY_DATA.push({"action": action, "time": Date()});
    // localStorage.setItem("TELEMETRY_DATA", JSON.stringify(TELEMETRY_DATA));
}

function appendBr(parent, extraSpace=false) {
    let elem = document.createElement('br');
    if (extraSpace) {
        elem.style.display = 'block';
        elem.style.margin = '3px 0';
    }
    parent.appendChild(elem);
}

function appendList(parent) {
    const list = document.createElement('ul');
    parent.appendChild(list);
    return list;
}



function find_file_node_ids(file, node, resolve_file_to_game, file_to_tree, nid_to_node) {
    if (node.hasOwnProperty('nid') && node.nid != null && node.nid != '') {
        if (!nid_to_node.has(node.nid)) {
            nid_to_node.set(node.nid, node);
        }
    }
    if (node.hasOwnProperty('children')) {
        for (let child of node.children) {
            find_file_node_ids(file, child, resolve_file_to_game, file_to_tree, nid_to_node);
        }
    }
    if (node.hasOwnProperty('file') && node.hasOwnProperty('target')) {
        if (resolve_file_to_game != null) {
            if (!file_to_tree.has(node.file)) {
                const game_tree = resolve_file_to_game(node.file);
                if (game_tree) {
                    file_to_tree.set(node.file, game_tree);
                    find_file_node_ids(node.file, game_tree, resolve_file_to_game, file_to_tree, nid_to_node);
                } else {
                    file_to_tree.set(node.file, null);
                }
            }
        }
    }
}

function can_be_player_children(nodes) {
    for (const node of nodes) {
        if (node.type !== 'rewrite') {
            return false;
        }
    }
    return true;
}



function splitGraphemes(str) {
    return [...SEGMENTER.segment(str)].map(x => x.segment);
}

function graphemeLength(str) {
    const graphemes = splitGraphemes(str);
    return graphemes.length;
}

function getTileSize(patterns) {
    let size = 1;
    for (const pattern of patterns) {
        for (const layer of Object.getOwnPropertyNames(pattern)) {
            for (const row of pattern[layer]) {
                for (const tile of row) {
                    size = Math.max(size, graphemeLength(tile));
                }
            }
        }
    }
    return size;
}

function joinRow(row, tileSize, alwaysPad) {
    let rowStr = '';

    for (let ii = 0; ii < row.length; ++ii) {
        const graphemes = splitGraphemes(row[ii]);

        for (const ch of graphemes) {
            rowStr += ch;
        }

        if (ii + 1 < row.length || alwaysPad) {
            for (let jj = graphemes.length; jj < tileSize; ++jj) {
                rowStr += ' ';
            }
        }

        if (ii + 1 < row.length) {
            rowStr += ' ';
        }
    }

    return rowStr;
}

function patternReplace(patt, regex, func) {
    let ret = [];
    for (let row of patt) {
        let ret_row = [];
        for (let tile of row) {
            ret_row.push(tile.replace(regex, func));
        }
        ret.push(ret_row);
    }
    return ret;
}

function patternReplaceRotate(patt) {
    const regex = new RegExp('(\u2190|\u2191|\u2192|\u2193)', 'g');
    const func = function (mm) { if (mm == '\u2190') return '\u2191'; else if (mm == '\u2191') return '\u2192'; else if (mm == '\u2192') return '\u2193'; else return '\u2190'};

    return patternReplace(patt, regex, func);
}

function patternReplaceMirror(patt) {
    const regex = new RegExp('(\u2190|\u2192)', 'g');
    const func = function (mm) { if (mm == '\u2190') return '\u2192'; else return '\u2190'};

    return patternReplace(patt, regex, func);
}

function patternReplaceFlip(patt) {
    const regex = new RegExp('(\u2191|\u2193)', 'g');
    const func = function (mm) { if (mm == '\u2191') return '\u2193'; else return '\u2191'};

    return patternReplace(patt, regex, func);
}



function xform_node_shallowequal(node1, node2) {
    const props1 = Object.getOwnPropertyNames(node1);
    const props2 = Object.getOwnPropertyNames(node2);
    if (props1.length !== props2.length) {
        return false;
    }
    for (const prop1 of props1) {
        if (prop1 === 'children') {
            continue;
        }
        if (!node2.hasOwnProperty(prop1)) {
            return false;
        }
        if (JSON.stringify(node1[prop1]) !== JSON.stringify(node2[prop1])) {
            return false;
        }
    }
    return true;
}

function xform_remorig(remorig, orig, other) {
    if (remorig) {
        return [other];
    } else {
        return [orig, other];
    }
}

function xform_unique(nodes) {
    let ret = [];
    for (const node of nodes) {
        let unique = true;
        for (const rnode of ret) {
            if (xform_node_shallowequal(node, rnode)) {
                unique = false;
                break;
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
            node.pid = pid_func('' + node.pid);
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
    if (node.type === 'x-unroll-replace') {
        let new_node = { type: 'order', children: [] };
        for (const which of node.withs) {
            new_node.children.push({ type: 'x-replace', what: node.what, withs: [which], children: deepcopyobj(node.children) });
        }
        return [new_node]
    }
    return [node];
}

function xform_rule_prune(node) {
    return [];
}

function xform_rule_mirror_fn(remorig) {
    function xform_rule_mirror(node) {
        function pattern_func(patt) {
            return patternReplaceMirror(patt.slice(0).map(row => row.slice(0).reverse()));
        }
        let button_obj = { 'left': 'right', 'right': 'left' };

        return xform_unique(xform_remorig(remorig, node, xform_rule_apply(shallowcopyobj(node), pattern_func, null, button_obj)));
    }
    return xform_rule_mirror;
}

function xform_rule_rotate_fn(remorig) {
    function xform_rule_rotate(node) {
        function pattern_func(patt) {
            return patternReplaceRotate(patt[0].slice(0).map((val, index) => patt.slice(0).map(row => row.slice(0)[index]).reverse()));
        }
        let button_obj = { 'left': 'up', 'up': 'right', 'right': 'down', 'down': 'left' };

        return xform_unique(xform_remorig(remorig, node, xform_rule_apply(shallowcopyobj(node), pattern_func, null, button_obj)));
    }
    return xform_rule_rotate;
}

function xform_rule_spin_fn(remorig) {
    function xform_rule_spin(node) {
        function pattern_func(patt) {
            return patternReplaceRotate(patt[0].slice(0).map((val, index) => patt.slice(0).map(row => row.slice(0)[index]).reverse()));
        }
        let button_obj = { 'left': 'up', 'up': 'right', 'right': 'down', 'down': 'left' };

        let ret = [node];
        for (let ii = 0; ii < 3; ++ii) {
            ret.push(xform_rule_apply(shallowcopyobj(ret.at(-1)), pattern_func, null, button_obj));
        }
        if (remorig) {
            ret = ret.slice(1);
        }
        return xform_unique(ret);
    }
    return xform_rule_spin;
}

function xform_rule_skew_fn(remorig) {
    function xform_rule_skew(node) {
        function pattern_func(patt) {
            const rows = patt.length;
            const cols = patt[0].length;
            let ret = [];
            for (let rr = 0; rr < rows + cols - 1; ++rr) {
                let row = [];
                for (let cc = 0; cc < cols; ++cc) {
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

        return xform_unique(xform_remorig(remorig, node, xform_rule_apply(shallowcopyobj(node), pattern_func, null, null)));
    }
    return xform_rule_skew;
}

function xform_rule_flip_fn(remorig) {
    function xform_rule_flip(node) {
        function pattern_func(patt) {
            return patternReplaceFlip(patt.slice(0).reverse());
        }
        let button_obj = { 'up': 'down', 'down': 'up' };

        return xform_unique(xform_remorig(remorig, node, xform_rule_apply(shallowcopyobj(node), pattern_func, null, button_obj)));
    }
    return xform_rule_flip;
}

function xform_rule_swap_only_fn(wht, wth) {
    const swap_regex = new RegExp('(' + wht + '|' + wth + ')', 'g');
    const swap_func = function (mm) { return mm === wht ? wth : wht; };

    function pattern_func(patt) {
        return patternReplace(patt, swap_regex, swap_func);
    }

    function pid_func(pid) {
        return pid.replace(swap_regex, swap_func);
    }

    function rule_swap_only(node) {
        return xform_unique([xform_rule_apply(shallowcopyobj(node), pattern_func, pid_func, null)]);
    }

    return rule_swap_only;
}

function xform_rule_replace_only_fn(wht, wths) {
    function pattern_func_fn(wth) {
        function pattern_func(patt) {
            const repl_regex = new RegExp(wht, 'g');
            const repl_func = function (mm) { return wth; };

            return patternReplace(patt, repl_regex, repl_func);
        }
        return pattern_func;
    }

    function pid_func_fn(wth) {
        function pid_func(pid) {
            return pid.replaceAll(wht, wth);
        }
        return pid_func;
    }

    function rule_replace_only(node) {
        let ret = [];
        if (node.type === 'x-unroll-replace') {
            if (node.what === wht) {
                let new_node = { type: 'order', children: [] };
                for (const wth of wths) {
                    new_node.children.push({ type: 'x-replace', what: node.what, withs: [wth], children: deepcopyobj(node.children) });
                }
                ret.push(new_node);
            } else {
                ret.push(node);
            }
        } else {
            for (const wth of wths) {
                ret.push(xform_rule_apply(shallowcopyobj(node), pattern_func_fn(wth), pid_func_fn(wth), null));
            }
        }
        return xform_unique(ret);
    }

    return rule_replace_only;
}

function xform_apply_to_node(node, xforms, file_to_tree, nid_to_node, already_linked, apply_xform, dispid_use_or_prefix) {
    let ret_nodes = [];

    node = shallowcopyobj(node);

    const ntype = node.type;

    function get_link_or_file_nodes() {
        if (node.hasOwnProperty('target')) {
            const target = nid_to_node.get(node.target);
            if (target) {
                const linked_id = node.target;
                if (already_linked.indexOf(linked_id) >= 0) {
                    // pass
                    // TODO: ? add specialized node ?
                } else {
                    const linked_dispid_suffix = (dispid_use_or_prefix !== undefined) ? node.dispid : undefined;
                    const linked = xform_apply_to_node(deepcopyobj(target), xforms, file_to_tree, nid_to_node, [linked_id].concat(already_linked), apply_xform, linked_dispid_suffix);
                    return linked;
                }
            }
        }
        return null;
    }

    if (!apply_xform) {
        if (['x-file'].indexOf(ntype) >= 0) {
            const linked_nodes = get_link_or_file_nodes();
            if (linked_nodes !== null) {
                node.children = linked_nodes;
            }
        }
        ret_nodes.push(node)

        for (let ret_node of ret_nodes) {
            if (ret_node.hasOwnProperty('children')) {
                let new_children = []
                for (const child of ret_node.children) {
                    const child_xformed = xform_apply_to_node(child, xforms, file_to_tree, nid_to_node, already_linked, apply_xform, dispid_use_or_prefix)
                    new_children.push(...child_xformed);
                }
                ret_node.children = new_children;
            }
        }
    } else {
        if (dispid_use_or_prefix !== undefined && dispid_use_or_prefix !== null) {
            node.dispid = dispid_use_or_prefix + '_' + node.dispid;
        }

        if (node.hasOwnProperty('comment')) {
            delete node.comment;
        }
        if (node.hasOwnProperty('nid')) {
            delete node.nid;
        }

        if (['x-link', 'x-file'].indexOf(ntype) >= 0) {
            const linked_nodes = get_link_or_file_nodes();
            if (linked_nodes !== null) {
                ret_nodes.push(...linked_nodes);
            }
        } else if (['x-ident', 'x-prune', 'x-mirror', 'x-skew', 'x-rotate', 'x-spin', 'x-flip', 'x-swap', 'x-replace'].indexOf(ntype) >= 0) {
            let fn = null;
            if (ntype === 'x-ident') {
                fn = xform_rule_identity;
            } else if (ntype === 'x-prune') {
                fn = xform_rule_prune;
            } else if (ntype === 'x-mirror') {
                fn = xform_rule_mirror_fn(node.remorig);
            } else if (ntype === 'x-rotate') {
                fn = xform_rule_rotate_fn(node.remorig);
            } else if (ntype === 'x-spin') {
                fn = xform_rule_spin_fn(node.remorig);
            } else if (ntype === 'x-skew') {
                fn = xform_rule_skew_fn(node.remorig);
            } else if (ntype === 'x-flip') {
                fn = xform_rule_flip_fn(node.remorig);
            } else if (ntype === 'x-swap') {
                fn = xform_rule_swap_only_fn(node.what, node.with);
            } else if (ntype === 'x-replace') {
                fn = xform_rule_replace_only_fn(node.what, node.withs);
            }

            for (const child of node.children) {
                let dispid_suffix = 0;
                const children_xformed = xform_apply_to_node(child, [fn].concat(xforms), file_to_tree, nid_to_node, already_linked, apply_xform, dispid_use_or_prefix)
                for (let child_xformed of children_xformed) {
                    if (dispid_use_or_prefix !== undefined) {
                        if (dispid_suffix > 0) {
                            child_xformed.dispid = children_xformed[0].dispid + '_' + dispid_suffix;
                        }
                        ++dispid_suffix;
                    }
                    ret_nodes.push(child_xformed);
                }
            }
        } else if (['player', 'win', 'lose', 'draw', 'order', 'all', 'none', 'random-try', 'loop-until-all', 'loop-times', 'rewrite', 'rewrite-all', 'set-board', 'append-rows', 'append-columns', 'layer-template', 'match', 'display-board', 'x-unroll-replace'].indexOf(ntype) >= 0) {
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
                        const child_xformed = xform_apply_to_node(child, xforms, file_to_tree, nid_to_node, already_linked, apply_xform, dispid_use_or_prefix)
                        new_children.push(...child_xformed);
                    }
                    ret_node.children = new_children;
                }
            }
        } else {
            alert('unrecognized transform node ' + ntype);
        }
    }

    return ret_nodes;
}

function xform_apply_to_tree(tree, resolve_file_to_game, apply_xform, use_dispids) {
    let file_to_tree = new Map();
    let nid_to_node = new Map();

    find_file_node_ids(null, tree, resolve_file_to_game, file_to_tree, nid_to_node);

    return xform_apply_to_node(tree, [xform_rule_identity], file_to_tree, nid_to_node, [], apply_xform, use_dispids ? null : undefined)[0];
}



function xformApplyIntoGame(game, fromGame, resolve_file_to_game) {
    game.name = fromGame.name;
    game.sprites = fromGame.sprites;

    if (fromGame.tree === null) {
        game.tree = null;
    } else {
        game.tree = xform_apply_to_tree(fromGame.tree, resolve_file_to_game, true, true);
    }
}

function copyIntoGame(game, fromGame) {
    game.name = fromGame.name;
    game.sprites = fromGame.sprites;
    game.tree = deepcopyobj(fromGame.tree);
}

function emptyGame() {
    return { name: 'empty', sprites: null, tree: null };
}
