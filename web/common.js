const BUTTON_LEFT = 0;
const BUTTON_RIGHT = 2;
const PIXEL_RATIO = (typeof(window) === 'undefined') ? 1 : window.devicePixelRatio;
const DOUBLE_CLICK_TIME = 300;

const TAU = 2 * Math.PI;

const SEGMENTER = new Intl.Segmenter();

let G_nextId = 0;

function getNextId() {
    ++ G_nextId;
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

function bind0(obj, fn) {
    return obj[fn].bind(obj);
}

function bind1(obj, fn, arg1) {
    return obj[fn].bind(obj, arg1);
}

function splitGraphemes(str) {
    return [...SEGMENTER.segment(str)].map(x => x.segment);
}

function charLength(str) {
    const graphemes = splitGraphemes(str);
    return graphemes.length;
}



function appendText(parent, text, bold, underline) {
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
    parent.appendChild(elem);
}

function appendButton(parent, text, callback, color) {
    const button = document.createElement('button');
    button.innerHTML = text;
    button.onclick = callback;
    if (color !== undefined) {
        button.style.backgroundColor = color
    } else {
        button.style.backgroundColor = '#dddddd';
    }
    parent.appendChild(button)
}

function appendBr(parent) {
    parent.appendChild(document.createElement('br'));
}

function appendList(parent) {
    const list = document.createElement('ul');
    parent.appendChild(list);
    return list;
}



function find_file_node_ids(file, node, file_to_game, file_to_nid_to_node) {
    if (node.hasOwnProperty('nid') && node.nid != null && node.nid != '') {
        if (!file_to_nid_to_node.has(file)) {
            file_to_nid_to_node.set(file, new Map());
        }
        if (!file_to_nid_to_node.get(file).has(node.nid)) {
            file_to_nid_to_node.get(file).set(node.nid, node);
        }
    }
    if (node.hasOwnProperty('children')) {
        for (let child of node.children) {
            find_file_node_ids(file, child, file_to_game, file_to_nid_to_node);
        }
    }
    if (node.hasOwnProperty('file') && node.hasOwnProperty('target')) {
        if (file_to_game.hasOwnProperty(node.file)) {
            if (!file_to_nid_to_node.has(node.file)) {
                find_file_node_ids(node.file, file_to_game[node.file].tree, file_to_game, file_to_nid_to_node);
            }
        }
    }
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
    return [node];
}

function xform_rule_prune(node) {
    return [];
}

function xform_rule_mirror(node) {
    function pattern_func(patt) {
        return patt.slice(0).map(row=>row.slice(0).reverse());
    }
    let button_obj = {'left':'right', 'right':'left'};

    return xform_unique([node, xform_rule_apply(shallowcopyobj(node), pattern_func, null, button_obj)]);
}

function xform_rule_rotate(node) {
    function pattern_func(patt) {
        return patt[0].slice(0).map((val, index) => patt.slice(0).map(row => row.slice(0)[index]).reverse());
    }
    let button_obj = {'left':'up', 'up':'right', 'right':'down', 'down':'left'};

    return xform_unique([node, xform_rule_apply(shallowcopyobj(node), pattern_func, null, button_obj)]);
}

function xform_rule_spin(node) {
    function pattern_func(patt) {
        return patt[0].slice(0).map((val, index) => patt.slice(0).map(row => row.slice(0)[index]).reverse());
    }
    let button_obj = {'left':'up', 'up':'right', 'right':'down', 'down':'left'};

    let ret = [node];
    for (let ii = 0; ii < 3; ++ ii) {
        ret.push(xform_rule_apply(shallowcopyobj(ret.at(-1)), pattern_func, null, button_obj));
    }
    return xform_unique(ret);
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

    return xform_unique([node, xform_rule_apply(shallowcopyobj(node), pattern_func, null, null)]);
}

function xform_rule_flip_only(node) {
    function pattern_func(patt) {
        return patt.slice(0).reverse();
    }
    let button_obj = {'up':'down', 'down':'up'};

    return xform_unique([xform_rule_apply(shallowcopyobj(node), pattern_func, null, button_obj)]);
}

function xform_rule_swap_only_fn(wht, wth) {
    function pattern_func(patt) {
        let ret = [];
        for (let row of patt) {
            let ret_row = [];
            for (let tile of row) {
                let ret_tile = '';
                for (let ch of splitGraphemes(tile)) {
                    if (ch === wht) {
                        ch = wth;
                    } else if (ch === wth) {
                        ch = wht;
                    }
                    ret_tile += ch;
                }
                ret_row.push(ret_tile);
            }
            ret.push(ret_row);
        }
        return ret;
    }

    function pid_func(pid) {
        let ret = '';
        for (let ch of splitGraphemes(pid)) {
            if (ch === wht) {
                ch = wth;
            } else if (ch === wth) {
                ch = wht;
            }
            ret += ch;
        }
        return ret;
    }

    function rule_swap_only(node) {
        return xform_unique([xform_rule_apply(shallowcopyobj(node), pattern_func, pid_func, null)]);
    }

    return rule_swap_only;
}

function xform_rule_replace_only_fn(wht, wths) {
    function pattern_func_fn(which) {
        function pattern_func(patt) {
            let ret = [];
            for (let row of patt) {
                let ret_row = [];
                for (let tile of row) {
                    let ret_tile = '';
                    for (let ch of splitGraphemes(tile)) {
                        if (ch === wht) {
                            ch = which;
                        }
                        ret_tile += ch;
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
            for (let ch of splitGraphemes(pid)) {
                if (ch === wht) {
                    ch = which;
                }
                ret += ch;
            }
            return ret;
        }
        return pid_func;
    }

    function rule_replace_only(node) {
        let ret = [];
        if (node.type === 'x-unroll-replace') {
            if (node.what === wht) {
                let new_node = {type:'order', children:[]};
                for (const which of wths) {
                    new_node.children.push({type:'x-replace-only', what:node.what, withs:[which], children:deepcopyobj(node.children)});
                }
                ret.push(new_node);
            } else {
                ret.push(node);
            }
        } else {
            for (const which of wths) {
                ret.push(xform_rule_apply(shallowcopyobj(node), pattern_func_fn(which), pid_func_fn(which), null));
            }
        }
        return xform_unique(ret);
    }

    return rule_replace_only;
}

function xform_apply_to_node(node, xforms, file_to_nid_to_node, file_to_game, dispid_use_or_prefix) {
    let ret_nodes = [];

    node = shallowcopyobj(node);

    if (dispid_use_or_prefix !== undefined && dispid_use_or_prefix !== null) {
        node.dispid = dispid_use_or_prefix + '_' + node.dispid;
    }

    if (node.hasOwnProperty('comment')) {
        delete node.comment;
    }
    if (node.hasOwnProperty('nid')) {
        delete node.nid;
    }

    const ntype = node.type;

    if (['x-ident', 'x-prune', 'x-mirror', 'x-skew', 'x-rotate', 'x-spin', 'x-flip-only', 'x-swap-only', 'x-replace-only'].indexOf(ntype) >= 0) {
        let fn = null;
        if (ntype === 'x-ident') {
            fn = xform_rule_identity;
        } else if (ntype === 'x-prune') {
            fn = xform_rule_prune;
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
            fn = xform_rule_replace_only_fn(node.what, node.withs);
        }

        for (const child of node.children) {
            let dispid_suffix = 0;
            const children_xformed = xform_apply_to_node(child, [fn].concat(xforms), file_to_nid_to_node, file_to_game, dispid_use_or_prefix)
            for (let child_xformed of children_xformed) {
                if (dispid_use_or_prefix !== undefined) {
                    if (dispid_suffix > 0) {
                        child_xformed.dispid = children_xformed[0].dispid + '_' + dispid_suffix;
                    }
                    ++ dispid_suffix;
                }
                ret_nodes.push(child_xformed);
            }
        }
    } else if (['x-link', 'x-file'].indexOf(ntype) >= 0) {
        let file = null;
        if (node.hasOwnProperty('file')) {
            file = node.file;
        }

        const nid_to_node = file_to_nid_to_node.get(file);
        if (nid_to_node) {
            const target = nid_to_node.get(node.target);
            if (target) {
                const linked_dispid_suffix = (dispid_use_or_prefix !== undefined) ? node.dispid : undefined;
                const linked = xform_apply_to_node(deepcopyobj(target), xforms, file_to_nid_to_node, file_to_game, linked_dispid_suffix);
                ret_nodes.push(...linked);
            }
        }
    } else if (['x-unroll-replace', 'player', 'win', 'lose', 'draw', 'order', 'all', 'none', 'random-try', 'loop-until-all', 'loop-times', 'rewrite', 'set-board', 'layer-template', 'match', 'display-board'].indexOf(ntype) >= 0) {
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
                    const child_xformed = xform_apply_to_node(child, xforms, file_to_nid_to_node, file_to_game, dispid_use_or_prefix)
                    new_children.push(...child_xformed);
                }
                ret_node.children = new_children;
            }
        }
    } else {
        alert('unrecognized transform node ' + ntype);
    }

    return ret_nodes;
}

function xform_apply_to_tree(tree, file_to_game, use_dispids) {
    let file_to_nid_to_node = new Map();

    find_file_node_ids(null, tree, file_to_game, file_to_nid_to_node);

    return xform_apply_to_node(tree, [xform_rule_identity], file_to_nid_to_node, file_to_game, use_dispids ? null : undefined)[0];
}



function xformApplyIntoGame(game, fromGame, file_to_game) {
    game.name = fromGame.name;
    game.sprites = fromGame.sprites;

    if (fromGame.tree === null) {
        game.tree = null;
    } else {
        game.tree = xform_apply_to_tree(fromGame.tree, file_to_game, true);
    }
}

function copyIntoGame(game, fromGame) {
    game.name = fromGame.name;
    game.sprites = fromGame.sprites;
    game.tree = deepcopyobj(fromGame.tree);
}

function emptyGame() {
    return {name:'empty', sprites:null, tree:null};
}
