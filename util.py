import io
import sys
import yaml

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf8')

class Game:
    def __init__(self, starts, tree):
        self.starts = starts
        self.tree = tree


def pad_tiles(ts):
    tile_len = 0
    for t in ts:
        for row in t:
            for tile in row:
                tile_len = max(tile_len, len(tile))

    return [[[(tile + (' ' * (tile_len - len(tile)))) for tile in row] for row in t] for t in ts]

def tuplify(hs):
    return tuple([tuple(row) for row in hs])

def string_to_pattern(s):
    return tuplify([[tile.strip() for tile in row.split()] for row in s.split(';') if row.strip() != ''])

def node_reshape_tiles(node):
    node = node.copy()

    if node['type'] == 'rewrite':
        node['lhs'] = string_to_pattern(node['lhs'])
        node['rhs'] = string_to_pattern(node['rhs'])

    if node['type'] == 'match':
        node['pattern'] = string_to_pattern(node['pattern'])

    if 'children' in node.keys():
        node['children'] = [node_reshape_tiles(child) for child in node['children']]

    return node

def unique(nodes):
    ret = []
    for node in nodes:
        uniq = True
        for rnode in ret:
            if node == rnode: #TODO: compare all keys but 'children'?
                uniq = False
        if uniq:
            ret.append(node)

    return ret

def rule_apply(node, app):
    for key in ['lhs', 'rhs', 'pattern']:
        if key in node.keys():
            node[key] = app(node[key])
    return node

def xform_identity(node):
    return [node]

def xform_rule_mirror(node):
    return unique([node, rule_apply(node.copy(), lambda x: tuplify([row[::-1] for row in x]))])

def xform_rule_skew(node):
    def rule_skew(hs):
        rows = len(hs)
        cols = len(hs[0])
        ret = [['.' for ci in range(cols)] for ri in range(rows + cols - 1)]
        for row in range(rows):
            for col in range(cols):
                ret[row + col][col] = hs[row][col]
        return tuplify(ret)
    return unique([node, rule_apply(node.copy(), rule_skew)])

def xform_rule_fliponly(node):
    return unique([rule_apply(node.copy(), lambda x: tuplify(x[::-1]))])

def xform_rule_rotate(node):
    ret = [node]
    while len(ret) < 4:
        ret.append(rule_apply(ret[-1].copy(), lambda x: tuplify(zip(*x[::-1]))))
    return unique(ret)

def xform_rule_turn(node):
    ret = [node]
    ret.append(rule_apply(ret[-1].copy(), lambda x: tuplify(zip(*x[::-1]))))
    return unique(ret)

def xform_rule_swaponly_fn(wht, wth):
    def rule_swaponly_side(hs):
        ret_hs = ()
        for row in hs:
            ret_row = ()
            for tile in row:
                ret_tile = ''
                for char in tile:
                    if char == wht:
                        char = wth
                    elif char == wth:
                        char = wht
                    ret_tile += char
                ret_row += (ret_tile,)
            ret_hs += (ret_row,)
        return ret_hs

    def rule_swaponly(node):
        return unique([rule_apply(node.copy(), lambda x: rule_swaponly_side(x))])

    return rule_swaponly

def xform_rule_replace_fn(wht, wth, keep):
    def rule_replace_side(hs, wthi):
        ret_hs = ()
        for row in hs:
            ret_row = ()
            for tile in row:
                ret_tile = tile.replace(wht, wthi)
                ret_row += (ret_tile,)
            ret_hs += (ret_row,)
        return ret_hs

    def rule_replace(node):
        return unique(([node] if keep else []) + [rule_apply(node.copy(), lambda x: rule_replace_side(x, str(wthi))) for wthi in wth])

    return rule_replace

def xform_player_next(node):
    if 'number' in node.keys():
        node = node.copy()
        node['number'] += 1
    return [node]

def node_xform_tiles(node, xforms, id_to_node):
    if 'id' in node.keys(): # TODO: move after xform?
        id_to_node[node['id']] = node

    ret_nodes = []

    if node['type'] in ['ident', 'rotate', 'turn', 'mirror', 'skew', 'fliponly', 'swaponly', 'replace', 'replaceonly']:
        fn = None
        if node['type'] == 'ident':
            fn = xform_identity
        elif node['type'] == 'rotate':
            fn = xform_rule_rotate
        elif node['type'] == 'turn':
            fn = xform_rule_turn
        elif node['type'] == 'mirror':
            fn = xform_rule_mirror
        elif node['type'] == 'skew':
            fn = xform_rule_skew
        elif node['type'] == 'fliponly':
            fn = xform_rule_fliponly
        elif node['type'] == 'swaponly':
            fn = xform_rule_swaponly_fn(node['what'], node['with'])
        elif node['type'] == 'replace':
            fn = xform_rule_replace_fn(node['what'], node['with'], True)
        elif node['type'] == 'replaceonly':
            fn = xform_rule_replace_fn(node['what'], node['with'], False)

        for child in node['children']:
            ret_nodes += node_xform_tiles(child, [fn] + xforms, id_to_node)

    elif node['type'] == 'link':
        ret_nodes += node_xform_tiles(id_to_node[node['target']], xforms, id_to_node)

    elif node['type'] == 'nextplayer':
        ret_nodes += node_xform_tiles(node['children'][0], [xform_player_next] + xforms, id_to_node)

    else:
        xformed = [node.copy()]
        for xform in xforms:
            new_xformed = []
            for xformed_node in xformed:
                new_xformed += xform(xformed_node)
            xformed = new_xformed
        ret_nodes = xformed

        for node in ret_nodes:
            if 'children' in node.keys():
                children = node['children']
                new_children = []
                for child in children:
                    new_children += node_xform_tiles(child, xforms, id_to_node)
                node['children'] = new_children

    return ret_nodes

def node_print_gv(node, next_gid, id_to_gid):
    id_str = ('%04d' % next_gid[0])
    next_gid[0] += 1

    ntype = node['type']

    if 'id' in node.keys():
        id_to_gid[node['id']] = id_str

    if ntype in ['rewrite', 'match']:
        nshape = 'box'
        nfont = 'Courier New'

        if ntype == 'rewrite':
            lhs, rhs = pad_tiles([node['lhs'], node['rhs']])

            nlabel = ''
            for ii, (ll, rr) in enumerate(zip(lhs, rhs)):
                nlabel += ' '.join(ll)
                if ii == 0:#len(lhs) // 2:
                    nlabel += ' → '
                else:
                    nlabel += '   '
                nlabel += ' '.join(rr)
                nlabel += '\\n'
        else:
            pattern = pad_tiles([node['pattern']])[0]
            nlabel = '\\n'.join([' '.join(row) for row in pattern])

    else:
        if ntype in ['ident', 'mirror', 'skew', 'rotate', 'turn', 'fliponly', 'swaponly', 'replace', 'replaceonly', 'nextplayer']:
            nshape = 'hexagon'
        elif ntype in ['player']:
            nshape = 'diamond'
        elif ntype in ['link']:
            nshape = 'invhouse'
        elif ntype in ['win', 'lose', 'draw']:
            nshape = 'octagon'
        else:
            nshape = 'oval'
        nfont = 'Times New Roman'
        nlabel = ntype

        if ntype in ['player', 'win', 'lose', 'draw']:
            nlabel += ':' + str(node['number'])
        elif ntype == 'swaponly':
            nlabel += '\\n'
            nlabel += node['what']
            nlabel += ' ↔ '
            nlabel += node['with']
        elif ntype in ['replace', 'replaceonly']:
            nlabel += '\\n'
            nlabel += node['what']
            nlabel += ' → '
            nlabel += ' '.join([str(ee) for ee in node['with']])

    print('  %s [label="%s", shape="%s", fontname="%s"];' % (id_str, nlabel, nshape, nfont))

    if 'children' in node.keys():
        children = node['children']
        for child in children:
            child_id = node_print_gv(child, next_gid, id_to_gid)
            print('  %s -> %s;' % (id_str, child_id))

    if ntype == 'link':
        print('  %s -> %s [style="dotted", constraint="false"];' % (id_str, id_to_gid[node['target']]))

    return id_str

def game_print_gv(game):
    print('digraph G {')
    for ii, start in enumerate(game.starts):
        start = pad_tiles([string_to_pattern(start)])[0]
        label = '\\n'.join([' '.join(row) for row in start])
        print('  START%d [shape="box", fontname="Courier New", label="%s"];' % (ii, label))
    node_print_gv(game.tree, [0], {})
    print('}')

def yaml2bt(filename, xform):
    with open(filename, 'rt') as f:
        data = yaml.safe_load(f)

    root = data['tree']
    root = node_reshape_tiles(root)
    if xform:
        root = node_xform_tiles(root, [xform_identity], {})[0]

    starts = data['start']

    return Game(starts, root)
