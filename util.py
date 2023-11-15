import io
import os
import sys
import yaml

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf8')

GVNEWLINE = '<BR/>'
GVTILEBGN = '<FONT FACE="Courier New">'
GVTILEEND = '</FONT>'
GVCOMMBGN = '<FONT POINT-SIZE="6"><I>'
GVCOMMEND = '</I></FONT>'

class Game:
    def __init__(self, name, starts, tree):
        self.name = name
        self.starts = starts
        self.tree = tree



def pattern_max_tile_width(patt):
    tile_len = 0
    for row in patt:
        for tile in row:
            tile_len = max(tile_len, len(tile))
    return tile_len

def pad_tiles_multiple(patts, tile_len=None):
    if tile_len is None:
        tile_len = 0
        for patt in patts:
            tile_len = max(tile_len, pattern_max_tile_width(patt))

    return [[[(tile + (' ' * (tile_len - len(tile)))) for tile in row] for row in patt] for patt in patts]

def pad_tiles_single(patt, tile_len=None):
    return pad_tiles_multiple([patt], tile_len)[0]

def pattern_to_string(patt, colsep, rowsep, tile_len=None):
    return rowsep.join([colsep.join(row) for row in pad_tiles_single(patt, tile_len)])

def listify(patt):
    return list([list(row) for row in patt])

def tuplify(patt):
    return tuple([tuple(row) for row in patt])

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

def node_max_tile_width(node):
    tile_len = 0

    if node['type'] == 'rewrite':
        tile_len = max(tile_len, pattern_max_tile_width(node['lhs']))
        tile_len = max(tile_len, pattern_max_tile_width(node['rhs']))

    if node['type'] == 'match':
        tile_len = max(tile_len, pattern_max_tile_width(node['pattern']))

    if 'children' in node.keys():
        for child in node['children']:
            tile_len = max(tile_len, node_max_tile_width(child))

    return tile_len

def node_find_nids(node, nid_to_node, pid_to_nid):
    if 'id' in node.keys(): # TODO: move after xform?
        nid = node['id']
        if len(nid) == 0 or nid[0] == '_':
            raise RuntimeError(f'invalid node id {nid}')
    else:
        nid = ('_%04d' % len(nid_to_node))

    if nid in nid_to_node:
        raise RuntimeError(f'duplicate node id {nid}')

    nid_to_node[nid] = node
    pid_to_nid[id(node)] = nid

    if 'children' in node.keys():
        for child in node['children']:
            node_find_nids(child, nid_to_node, pid_to_nid)

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

def node_xform_tiles(node, xforms, nid_to_node):
    ret_nodes = []

    ntype = node['type']

    if ntype in ['file', 'ident', 'rotate', 'turn', 'mirror', 'skew', 'fliponly', 'swaponly', 'replace', 'replaceonly']:
        fn = None
        if ntype in ['file', 'ident']:
            fn = xform_identity
        elif ntype == 'rotate':
            fn = xform_rule_rotate
        elif ntype == 'turn':
            fn = xform_rule_turn
        elif ntype == 'mirror':
            fn = xform_rule_mirror
        elif ntype == 'skew':
            fn = xform_rule_skew
        elif ntype == 'fliponly':
            fn = xform_rule_fliponly
        elif ntype == 'swaponly':
            fn = xform_rule_swaponly_fn(node['what'], node['with'])
        elif ntype == 'replace':
            fn = xform_rule_replace_fn(node['what'], node['with'], True)
        elif ntype == 'replaceonly':
            fn = xform_rule_replace_fn(node['what'], node['with'], False)

        for child in node['children']:
            ret_nodes += node_xform_tiles(child, [fn] + xforms, nid_to_node)

    elif ntype == 'link':
        ret_nodes += node_xform_tiles(nid_to_node[node['target']], xforms, nid_to_node)

    elif ntype == 'nextplayer':
        ret_nodes += node_xform_tiles(node['children'][0], [xform_player_next] + xforms, nid_to_node)

    elif ntype in ['sequence', 'none', 'random-try', 'random-one', 'player', 'rewrite', 'match', 'win', 'lose', 'draw', 'loop-until-any', 'loop-until-all', 'loop-times']:
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
                    new_children += node_xform_tiles(child, xforms, nid_to_node)
                node['children'] = new_children

    else:
        raise RuntimeError(f'unrecognized node type {ntype}')

    return ret_nodes

def node_print_gv(node, nid_to_node, pid_to_nid):
    ntype = node['type']
    nlabel = '<'

    if ntype in ['rewrite', 'match']:
        nshape = 'box'

        if ntype == 'rewrite':
            lhs, rhs = pad_tiles_multiple([node['lhs'], node['rhs']])

            nlabel += GVTILEBGN
            for ii, (ll, rr) in enumerate(zip(lhs, rhs)):
                nlabel += ' '.join(ll)
                if ii == 0:#len(lhs) // 2:
                    nlabel += ' → '
                else:
                    nlabel += '   '
                nlabel += ' '.join(rr)
                if ii + 1 < len(lhs):
                    nlabel += GVNEWLINE
            nlabel += GVTILEEND
        else:
            nlabel += GVTILEBGN
            nlabel += pattern_to_string(node['pattern'], ' ', GVNEWLINE)
            nlabel += GVTILEEND

    else:
        if ntype in ['ident', 'mirror', 'skew', 'rotate', 'turn', 'fliponly', 'swaponly', 'replace', 'replaceonly', 'nextplayer']:
            nshape = 'hexagon'
        elif ntype in ['player']:
            nshape = 'diamond'
        elif ntype in ['link']:
            nshape = 'invhouse'
        elif ntype in ['win', 'lose', 'draw']:
            nshape = 'octagon'
        elif ntype in ['sequence', 'none', 'random-try', 'random-one', 'loop-until-any', 'loop-until-all', 'loop-times']:
            nshape = 'oval'
        elif ntype in ['file']:
            nshape = 'folder'
        else:
            raise RuntimeError(f'unrecognized node type {ntype}')

        nlabel += ntype

        if ntype in ['player', 'win', 'lose']:
            nlabel += ':' + str(node['number'])
        elif ntype in ['loop-times']:
            nlabel += ':' + str(node['times'])
        elif ntype in ['file']:
            nlabel += ':' + node['target']
        elif ntype == 'swaponly':
            nlabel += GVNEWLINE
            nlabel += GVTILEBGN
            nlabel += node['what']
            nlabel += ' ↔ '
            nlabel += node['with']
            nlabel += GVTILEEND
        elif ntype in ['replace', 'replaceonly']:
            nlabel += GVNEWLINE
            nlabel += GVTILEBGN
            nlabel += node['what']
            nlabel += ' → '
            nlabel += ' '.join([str(ee) for ee in node['with']])
            nlabel += GVTILEEND

    if 'comment' in node.keys():
        nlabel += GVNEWLINE
        nlabel += GVCOMMBGN
        nlabel += node['comment']
        nlabel += GVCOMMEND

    nlabel += '>'

    nid = pid_to_nid[id(node)]

    print(f'  {nid} [shape="{nshape}", label={nlabel}];')

    if 'children' in node.keys():
        children = node['children']
        for child in children:
            node_print_gv(child, nid_to_node, pid_to_nid)
            child_id = pid_to_nid[id(child)]
            print(f'  {nid} -> {child_id};')

    if ntype == 'link':
        node_target = node['target']
        if node_target in nid_to_node:
            target_id = pid_to_nid[id(nid_to_node[node_target])]
            print(f'  {nid} -> {target_id} [style="dotted", constraint="false"];')
        else:
            target_id = nid + 'TARGET'
            print(f'  {target_id} [shape="house", label="{node_target}"];')
            print(f'  {nid} -> {target_id} [style="dotted"];')

def game_print_gv(game):
    nid_to_node, pid_to_nid = {}, {}
    node_find_nids(game.tree, nid_to_node, pid_to_nid)

    print('digraph G {')
    print(f'  _NAME [shape="note", label=<{game.name}>];')
    for ii, start in enumerate(game.starts):
        label = pattern_to_string(start, ' ', GVNEWLINE)
        print(f'  _START{ii} [shape="box", label=<{GVTILEBGN}{label}{GVTILEEND}>];')
    node_print_gv(game.tree, nid_to_node, pid_to_nid)
    print('}')

def yamlload(filename):
    with open(filename, 'rt') as f:
        return yaml.safe_load(f)

def resolve_file_links(folder, node):
    if 'children' in node.keys():
        new_children = []
        for child in node['children']:
            if child['type'] == 'file':
                target = child['target']
                filename = f'{folder}/{target}.yaml'
                data = yamlload(filename)
                child['children'] = [data['tree']]
            new_children.append(resolve_file_links(folder, child))
        node['children'] = new_children
    return node

def yaml2bt(filename, xform):
    data = yamlload(filename)

    name = data['name']

    root = data['tree']

    root = resolve_file_links(os.path.dirname(filename), root)

    root = node_reshape_tiles(root)

    if xform:
        nid_to_node, pid_to_nid = {}, {}
        node_find_nids(root, nid_to_node, pid_to_nid)
        root = node_xform_tiles(root, [xform_identity], nid_to_node)[0]

    starts = [string_to_pattern(start) for start in data['start']]

    return Game(name, starts, root)
