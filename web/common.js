const BUTTON_LEFT = 0;
const BUTTON_RIGHT = 2;
const PIXEL_RATIO = window.devicePixelRatio;
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

function xformApplyIntoGame(game, fromGame) {
    game.name = fromGame.name;
    game.sprites = fromGame.sprites;

    if (fromGame.tree === null) {
        game.tree = null;
    } else {
        let nidToNode = new Map();

        function findNodeIds(node) {
            if (node.hasOwnProperty('nid') && node.nid != null && node.nid != '') {
                nidToNode.set(node.nid, node);
            }
            if (node.hasOwnProperty('children')) {
                for (let child of node.children) {
                    findNodeIds(child);
                }
            }
        }

        findNodeIds(fromGame.tree);

        game.tree = xformApplyToTree(fromGame.tree, nidToNode);
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
