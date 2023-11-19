import io
import os
import sys
import yaml



NDX_IDENT          = 'x-ident'
NDX_MIRROR         = 'x-mirror'
NDX_SKEW           = 'x-skew'
NDX_ROTATE         = 'x-rotate'
NDX_TURN           = 'x-turn'
NDX_FLIPONLY       = 'x-fliponly'
NDX_SWAPONLY       = 'x-swaponly'
NDX_REPLACE        = 'x-replace'
NDX_REPLACEONLY    = 'x-replaceonly'
NDX_NEWPLAYER      = 'x-newplayer'

NDX_LINK           = 'x-link'
NDX_FILE           = 'x-file'

ND_PLAYER          = 'player'

ND_WIN             = 'win'
ND_LOSE            = 'lose'
ND_DRAW            = 'draw'

ND_SEQ             = 'sequence'
ND_NONE            = 'none'
ND_RND_TRY         = 'random-try'
ND_LOOP_UNTIL_ALL  = 'loop-until-all'
ND_LOOP_TIMES      = 'loop-times'

ND_REWRITE         = 'rewrite'
ND_MATCH           = 'match'


NKEY_TYPE          = 'type'
NKEY_CHILDREN      = 'children'
NKEY_NID           = 'nid'
NKEY_COMMENT       = 'comment'

NKEY_PATTERN       = 'pattern'
NKEY_LHS           = 'lhs'
NKEY_RHS           = 'rhs'

NKEY_PID           = 'pid'
NKEY_TIMES         = 'times'
NKEY_WHAT          = 'what'
NKEY_WITH          = 'with'
NKEY_TARGET        = 'target'


FKEY_NAME          = 'name'
FKEY_START         = 'start'
FKEY_TREE          = 'tree'



class Game:
    def __init__(self, name, starts, tree):
        self.name = name
        self.starts = starts
        self.tree = tree



sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf8')

GVNEWLINE = '<BR/>'
GVTILEBGN = '<FONT FACE="Courier New">'
GVTILEEND = '</FONT>'
GVCOMMBGN = '<FONT POINT-SIZE="6"><I>'
GVCOMMEND = '</I></FONT>'



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

    if node[NKEY_TYPE] == ND_REWRITE:
        node[NKEY_LHS] = string_to_pattern(node[NKEY_LHS])
        node[NKEY_RHS] = string_to_pattern(node[NKEY_RHS])

    if node[NKEY_TYPE] == ND_MATCH:
        node[NKEY_PATTERN] = string_to_pattern(node[NKEY_PATTERN])

    if NKEY_CHILDREN in node.keys():
        node[NKEY_CHILDREN] = [node_reshape_tiles(child) for child in node[NKEY_CHILDREN]]

    return node

def node_max_tile_width(node):
    tile_len = 0

    if node[NKEY_TYPE] == ND_REWRITE:
        tile_len = max(tile_len, pattern_max_tile_width(node[NKEY_LHS]))
        tile_len = max(tile_len, pattern_max_tile_width(node[NKEY_RHS]))

    if node[NKEY_TYPE] == ND_MATCH:
        tile_len = max(tile_len, pattern_max_tile_width(node[NKEY_PATTERN]))

    if NKEY_CHILDREN in node.keys():
        for child in node[NKEY_CHILDREN]:
            tile_len = max(tile_len, node_max_tile_width(child))

    return tile_len

def node_find_nids(node, nid_to_node, pid_to_nid):
    if NKEY_NID in node.keys(): # TODO: move after xform?
        nid = node[NKEY_NID]
        if len(nid) == 0 or nid[0] == '_':
            raise RuntimeError(f'invalid node id {nid}')
    else:
        nid = ('_%04d' % len(nid_to_node))

    if nid in nid_to_node:
        raise RuntimeError(f'duplicate node id {nid}')

    nid_to_node[nid] = node
    pid_to_nid[id(node)] = nid

    if NKEY_CHILDREN in node.keys():
        for child in node[NKEY_CHILDREN]:
            node_find_nids(child, nid_to_node, pid_to_nid)

def unique(nodes):
    ret = []
    for node in nodes:
        uniq = True
        for rnode in ret:
            if node == rnode: #TODO: compare all keys but NKEY_CHILDREN?
                uniq = False
        if uniq:
            ret.append(node)

    return ret

def rule_apply(node, app):
    for key in [NKEY_LHS, NKEY_RHS, NKEY_PATTERN]:
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

def xform_player_new_fn(new_pid):
    def player_new(node):
        if NKEY_PID in node.keys():
            node = node.copy()
            node[NKEY_PID] = new_pid
        return [node]

    return player_new

def node_xform_tiles(node, xforms, nid_to_node):
    ret_nodes = []

    ntype = node[NKEY_TYPE]

    if ntype in [NDX_FILE, NDX_IDENT, NDX_ROTATE, NDX_TURN, NDX_MIRROR, NDX_SKEW, NDX_FLIPONLY, NDX_SWAPONLY, NDX_REPLACE, NDX_REPLACEONLY]:
        fn = None
        if ntype in [NDX_FILE, NDX_IDENT]:
            fn = xform_identity
        elif ntype == NDX_ROTATE:
            fn = xform_rule_rotate
        elif ntype == NDX_TURN:
            fn = xform_rule_turn
        elif ntype == NDX_MIRROR:
            fn = xform_rule_mirror
        elif ntype == NDX_SKEW:
            fn = xform_rule_skew
        elif ntype == NDX_FLIPONLY:
            fn = xform_rule_fliponly
        elif ntype == NDX_SWAPONLY:
            fn = xform_rule_swaponly_fn(node[NKEY_WHAT], node[NKEY_WITH])
        elif ntype == NDX_REPLACE:
            fn = xform_rule_replace_fn(node[NKEY_WHAT], node[NKEY_WITH], True)
        elif ntype == NDX_REPLACEONLY:
            fn = xform_rule_replace_fn(node[NKEY_WHAT], node[NKEY_WITH], False)

        for child in node[NKEY_CHILDREN]:
            ret_nodes += node_xform_tiles(child, [fn] + xforms, nid_to_node)

    elif ntype == NDX_LINK:
        ret_nodes += node_xform_tiles(nid_to_node[node[NKEY_TARGET]], xforms, nid_to_node)

    elif ntype == NDX_NEWPLAYER:
        for child in node[NKEY_CHILDREN]:
            ret_nodes += node_xform_tiles(child, [xform_player_new_fn(node[NKEY_PID])] + xforms, nid_to_node)

    elif ntype in [ND_SEQ, ND_NONE, ND_RND_TRY, ND_PLAYER, ND_REWRITE, ND_MATCH, ND_WIN, ND_LOSE, ND_DRAW, ND_LOOP_UNTIL_ALL, ND_LOOP_TIMES]:
        xformed = [node.copy()]
        for xform in xforms:
            new_xformed = []
            for xformed_node in xformed:
                new_xformed += xform(xformed_node)
            xformed = new_xformed
        ret_nodes = xformed

        for node in ret_nodes:
            if NKEY_CHILDREN in node.keys():
                children = node[NKEY_CHILDREN]
                new_children = []
                for child in children:
                    new_children += node_xform_tiles(child, xforms, nid_to_node)
                node[NKEY_CHILDREN] = new_children

    else:
        raise RuntimeError(f'unrecognized node type {ntype}')

    return ret_nodes

def node_print_gv(node, nid_to_node, pid_to_nid):
    ntype = node[NKEY_TYPE]
    nlabel = '<'

    if ntype in [ND_REWRITE, ND_MATCH]:
        nshape = 'box'

        if ntype == ND_REWRITE:
            lhs, rhs = pad_tiles_multiple([node[NKEY_LHS], node[NKEY_RHS]])

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
            nlabel += pattern_to_string(node[NKEY_PATTERN], ' ', GVNEWLINE)
            nlabel += GVTILEEND

    else:
        if ntype in [NDX_IDENT, NDX_MIRROR, NDX_SKEW, NDX_ROTATE, NDX_TURN, NDX_FLIPONLY, NDX_SWAPONLY, NDX_REPLACE, NDX_REPLACEONLY, NDX_NEWPLAYER]:
            nshape = 'hexagon'
        elif ntype in [NDX_LINK]:
            nshape = 'invhouse'
        elif ntype in [NDX_FILE]:
            nshape = 'folder'
        elif ntype in [ND_PLAYER]:
            nshape = 'diamond'
        elif ntype in [ND_WIN, ND_LOSE, ND_DRAW]:
            nshape = 'octagon'
        elif ntype in [ND_SEQ, ND_NONE, ND_RND_TRY, ND_LOOP_UNTIL_ALL, ND_LOOP_TIMES]:
            nshape = 'oval'
        else:
            raise RuntimeError(f'unrecognized node type {ntype}')

        nlabel += ntype

        if ntype in [ND_PLAYER, ND_WIN, ND_LOSE, NDX_NEWPLAYER]:
            nlabel += ':' + str(node[NKEY_PID])
        elif ntype in [ND_LOOP_TIMES]:
            nlabel += ':' + str(node[NKEY_TIMES])
        elif ntype in [NDX_FILE]:
            nlabel += ':' + node[NKEY_TARGET]
        elif ntype in [NDX_LINK]:
            nlabel += ':' + node[NKEY_TARGET]
        elif ntype == NDX_SWAPONLY:
            nlabel += GVNEWLINE
            nlabel += GVTILEBGN
            nlabel += node[NKEY_WHAT]
            nlabel += ' ↔ '
            nlabel += node[NKEY_WITH]
            nlabel += GVTILEEND
        elif ntype in [NDX_REPLACE, NDX_REPLACEONLY]:
            nlabel += GVNEWLINE
            nlabel += GVTILEBGN
            nlabel += node[NKEY_WHAT]
            nlabel += ' → '
            nlabel += ' '.join([str(ee) for ee in node[NKEY_WITH]])
            nlabel += GVTILEEND

    if NKEY_COMMENT in node.keys():
        nlabel += GVNEWLINE
        nlabel += GVCOMMBGN
        nlabel += node[NKEY_COMMENT]
        nlabel += GVCOMMEND

    nlabel += '>'

    nid = pid_to_nid[id(node)]

    print(f'  {nid} [shape="{nshape}", label={nlabel}];')

    if NKEY_CHILDREN in node.keys():
        children = node[NKEY_CHILDREN]
        for child in children:
            node_print_gv(child, nid_to_node, pid_to_nid)
            child_id = pid_to_nid[id(child)]
            print(f'  {nid} -> {child_id};')

    if ntype == NDX_LINK:
        node_target = node[NKEY_TARGET]
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
    print(f'  _NAME [shape="component", label=<{game.name}>];')
    for ii, start in enumerate(game.starts):
        label = pattern_to_string(start, ' ', GVNEWLINE)
        print(f'  _START{ii} [shape="note", label=<start:{GVNEWLINE}{GVTILEBGN}{label}{GVTILEEND}>];')
    node_print_gv(game.tree, nid_to_node, pid_to_nid)
    print('}')

def yamlload(filename):
    with open(filename, 'rt') as f:
        return yaml.safe_load(f)

def resolve_file_links(folder, node):
    if NKEY_CHILDREN in node.keys():
        new_children = []
        for child in node[NKEY_CHILDREN]:
            if child[NKEY_TYPE] == NDX_FILE:
                target = child[NKEY_TARGET]
                filename = f'{folder}/{target}.yaml'
                data = yamlload(filename)
                child[NKEY_CHILDREN] = [data[FKEY_TREE]]
            new_children.append(resolve_file_links(folder, child))
        node[NKEY_CHILDREN] = new_children
    return node

def yaml2bt(filename, xform):
    data = yamlload(filename)

    name = data[FKEY_NAME]

    root = data[FKEY_TREE]

    root = resolve_file_links(os.path.dirname(filename), root)

    root = node_reshape_tiles(root)

    if xform:
        nid_to_node, pid_to_nid = {}, {}
        node_find_nids(root, nid_to_node, pid_to_nid)
        root = node_xform_tiles(root, [xform_identity], nid_to_node)[0]

    starts = [string_to_pattern(start) for start in data[FKEY_START]]

    return Game(name, starts, root)
