import copy
import io
import os
import sys
import yaml



NDX_IDENT          = 'x-ident'
NDX_PRUNE          = 'x-prune'
NDX_MIRROR         = 'x-mirror'
NDX_SKEW           = 'x-skew'
NDX_ROTATE         = 'x-rotate'
NDX_SPIN           = 'x-spin'
NDX_FLIP_ONLY      = 'x-flip-only'
NDX_SWAP_ONLY      = 'x-swap-only'
NDX_REPLACE_ONLY   = 'x-replace-only'
NDX_SET_PLAYER     = 'x-set-player'

NDX_LINK           = 'x-link'
NDX_FILE           = 'x-file'

ND_PLAYER          = 'player'

ND_WIN             = 'win'
ND_LOSE            = 'lose'
ND_DRAW            = 'draw'

ND_ORDER           = 'order'
ND_NONE            = 'none'
ND_RND_TRY         = 'random-try'
ND_LOOP_UNTIL_ALL  = 'loop-until-all'
ND_LOOP_TIMES      = 'loop-times'

ND_REWRITE         = 'rewrite'
ND_MATCH           = 'match'
ND_SET_BOARD       = 'set-board'
ND_APPEND_ROWS     = 'append-rows'
ND_APPEND_COLS     = 'append-columns'
ND_DISPLAY_BOARD   = 'display-board'

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
NKEY_FILE          = 'file'
NKEY_TARGET        = 'target'


FKEY_NAME          = 'name'
FKEY_TREE          = 'tree'



class Game:
    def __init__(self, name, tree):
        self.name = name
        self.tree = tree



sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf8')

GVNEWLINE = '<BR/>'
GVTILEBGN = '<FONT FACE="Courier New">'
GVTILEEND = '</FONT>'
GVCOMMBGN = '<FONT POINT-SIZE="9"><I>'
GVCOMMEND = '</I></FONT>'
GVNIDBGN  = '<FONT POINT-SIZE="9"><B>'
GVNIDEND  = '</B></FONT>'



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

    if node[NKEY_TYPE] in [ND_MATCH, ND_SET_BOARD, ND_APPEND_ROWS, ND_APPEND_COLS]:
        node[NKEY_PATTERN] = string_to_pattern(node[NKEY_PATTERN])

    if NKEY_CHILDREN in node.keys():
        node[NKEY_CHILDREN] = [node_reshape_tiles(child) for child in node[NKEY_CHILDREN]]

    return node

def node_check(node, files_resolved, xformed):
    ntype = node[NKEY_TYPE]

    if xformed:
        if ntype not in [ND_PLAYER, ND_WIN, ND_LOSE, ND_DRAW, ND_ORDER, ND_NONE, ND_RND_TRY, ND_LOOP_UNTIL_ALL, ND_LOOP_TIMES, ND_REWRITE, ND_MATCH, ND_SET_BOARD, ND_APPEND_ROWS, ND_APPEND_COLS, ND_DISPLAY_BOARD]:
            raise RuntimeError(f'node type {ntype} must not be in xformed tree')

    if ntype == ND_PLAYER:
        if NKEY_CHILDREN not in node.keys():
            raise RuntimeError(f'node type {ntype} must have {NKEY_CHILDREN}')

        for child in node[NKEY_CHILDREN]:
            if xformed:
                if child[NKEY_TYPE] != ND_REWRITE:
                    raise RuntimeError(f'node type {ntype} children must have type {ND_REWRITE}')
    elif ntype == NDX_FILE:
        if files_resolved:
            if NKEY_CHILDREN not in node.keys():
                raise RuntimeError(f'node type {ntype} must have {NKEY_CHILDREN}')
        else:
            if NKEY_CHILDREN in node.keys():
                raise RuntimeError(f'node type {ntype} must not have {NKEY_CHILDREN}')
    elif ntype in [NDX_LINK, NDX_FILE, ND_REWRITE, ND_MATCH, ND_SET_BOARD, ND_APPEND_ROWS, ND_APPEND_COLS, ND_DISPLAY_BOARD]:
        if NKEY_CHILDREN in node.keys():
            raise RuntimeError(f'node type {ntype} must not have {NKEY_CHILDREN}')
    else:
        if NKEY_CHILDREN not in node.keys():
            raise RuntimeError(f'node type {ntype} must have {NKEY_CHILDREN}')

    if NKEY_CHILDREN in node.keys():
        for child in node[NKEY_CHILDREN]:
            node_check(child, files_resolved, xformed)

def node_max_tile_width(node):
    tile_len = 0

    if node[NKEY_TYPE] == ND_REWRITE:
        tile_len = max(tile_len, pattern_max_tile_width(node[NKEY_LHS]))
        tile_len = max(tile_len, pattern_max_tile_width(node[NKEY_RHS]))

    if node[NKEY_TYPE] in [ND_MATCH, ND_SET_BOARD, ND_APPEND_ROWS, ND_APPEND_COLS]:
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

def xform_prune(node):
    return []

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
    ret.append(rule_apply(ret[-1].copy(), lambda x: tuplify(zip(*x[::-1]))))
    return unique(ret)

def xform_rule_spin(node):
    ret = [node]
    while len(ret) < 4:
        ret.append(rule_apply(ret[-1].copy(), lambda x: tuplify(zip(*x[::-1]))))
    return unique(ret)

def xform_rule_swaponly_fn(wht, wth):
    def rule_swap_side(hs):
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
        return unique([rule_apply(node.copy(), lambda x: rule_swap_side(x))])

    return rule_swaponly

def xform_rule_replaceonly_fn(wht, wth):
    if type(wth) != list:
        raise RuntimeError(f'replace with must be list')

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
        return unique([rule_apply(node.copy(), lambda x: rule_replace_side(x, str(wthi))) for wthi in wth])

    return rule_replace

def xform_player_new_fn(new_pid):
    def player_new(node):
        if NKEY_PID in node.keys():
            node = node.copy()
            node[NKEY_PID] = new_pid
        return [node]

    return player_new

def node_apply_xforms(node, xforms, nid_to_node):
    ret_nodes = []

    node = node.copy()
    if NKEY_COMMENT in node:
        del node[NKEY_COMMENT]
    if NKEY_NID in node:
        del node[NKEY_NID]

    ntype = node[NKEY_TYPE]

    if ntype in [NDX_FILE, NDX_IDENT, NDX_PRUNE, NDX_ROTATE, NDX_SPIN, NDX_MIRROR, NDX_SKEW, NDX_FLIP_ONLY, NDX_SWAP_ONLY, NDX_REPLACE_ONLY]:
        fn = None
        if ntype in [NDX_FILE, NDX_IDENT]:
            fn = xform_identity
        elif ntype in [NDX_PRUNE]:
            fn = xform_prune
        elif ntype == NDX_ROTATE:
            fn = xform_rule_rotate
        elif ntype == NDX_SPIN:
            fn = xform_rule_spin
        elif ntype == NDX_MIRROR:
            fn = xform_rule_mirror
        elif ntype == NDX_SKEW:
            fn = xform_rule_skew
        elif ntype == NDX_FLIP_ONLY:
            fn = xform_rule_fliponly
        elif ntype == NDX_SWAP_ONLY:
            fn = xform_rule_swaponly_fn(node[NKEY_WHAT], node[NKEY_WITH])
        elif ntype == NDX_REPLACE_ONLY:
            fn = xform_rule_replaceonly_fn(node[NKEY_WHAT], node[NKEY_WITH])

        for child in node[NKEY_CHILDREN]:
            ret_nodes += node_apply_xforms(child, [fn] + xforms, nid_to_node)

    elif ntype == NDX_LINK:
        nid_target = node[NKEY_TARGET]
        if nid_target in nid_to_node:
            ret_nodes += node_apply_xforms(copy.deepcopy(nid_to_node[nid_target]), xforms, nid_to_node)

    elif ntype == NDX_SET_PLAYER:
        for child in node[NKEY_CHILDREN]:
            ret_nodes += node_apply_xforms(child, [xform_player_new_fn(node[NKEY_PID])] + xforms, nid_to_node)

    elif ntype in [ND_ORDER, ND_NONE, ND_RND_TRY, ND_PLAYER, ND_REWRITE, ND_MATCH, ND_SET_BOARD, ND_DISPLAY_BOARD, ND_APPEND_ROWS, ND_APPEND_COLS, ND_WIN, ND_LOSE, ND_DRAW, ND_LOOP_UNTIL_ALL, ND_LOOP_TIMES]:
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
                    new_children += node_apply_xforms(child, xforms, nid_to_node)
                node[NKEY_CHILDREN] = new_children

    else:
        raise RuntimeError(f'unrecognized node type {ntype}')

    return ret_nodes

def node_print_gv(node, depth, nid_to_node, pid_to_nid):
    ntype = node[NKEY_TYPE]
    nlabel = ''
    nstyle = 'filled'

    if ntype in [ND_REWRITE, ND_MATCH, ND_SET_BOARD, ND_APPEND_ROWS, ND_APPEND_COLS, ND_DISPLAY_BOARD]:
        nshape = 'box'
        nstyle += ',rounded'

        nlabel += '<TABLE BORDER="0">'
        nlabel += '<TR><TD COLSPAN="3">'
        nlabel += ntype
        nlabel += '</TD></TR>'

        if ntype == ND_DISPLAY_BOARD:
            pass

        elif ntype == ND_REWRITE:
            lhs, rhs = pad_tiles_multiple([node[NKEY_LHS], node[NKEY_RHS]])

            nlabel += '<TR>'
            nlabel += '<TD BORDER="1" COLOR="#888888">'
            nlabel += GVTILEBGN
            nlabel += pattern_to_string(lhs, ' ', GVNEWLINE)
            nlabel += GVTILEEND
            nlabel += '</TD>'
            nlabel += '<TD>→</TD>'
            nlabel += '<TD BORDER="1" COLOR="#888888">'
            nlabel += GVTILEBGN
            nlabel += pattern_to_string(rhs, ' ', GVNEWLINE)
            nlabel += GVTILEEND
            nlabel += '</TD>'
            nlabel += '</TR>'

        else:
            nlabel += '<TR><TD></TD><TD BORDER="1" COLOR="#888888">'
            nlabel += GVTILEBGN
            nlabel += pattern_to_string(node[NKEY_PATTERN], ' ', GVNEWLINE)
            nlabel += GVTILEEND
            nlabel += '</TD><TD></TD></TR>'

        if NKEY_NID in node.keys():
            nlabel += '<TR><TD COLSPAN="3">'
            nlabel += GVNIDBGN
            nlabel += '@'
            nlabel += node[NKEY_NID]
            nlabel += '</TD></TR>'

        if NKEY_COMMENT in node.keys():
            nlabel += '<TR><TD COLSPAN="3">'
            nlabel += GVCOMMBGN
            nlabel += node[NKEY_COMMENT]
            nlabel += GVCOMMEND
            nlabel += '</TD></TR>'

        nlabel += '</TABLE>'

    else:
        if ntype in [NDX_IDENT, NDX_PRUNE, NDX_MIRROR, NDX_SKEW, NDX_ROTATE, NDX_SPIN, NDX_FLIP_ONLY, NDX_SWAP_ONLY, NDX_REPLACE_ONLY, NDX_SET_PLAYER]:
            nshape = 'hexagon'
        elif ntype in [NDX_LINK]:
            nshape = 'invhouse'
        elif ntype in [NDX_FILE]:
            nshape = 'folder'
        elif ntype in [ND_PLAYER]:
            nshape = 'diamond'
        elif ntype in [ND_WIN, ND_LOSE, ND_DRAW]:
            nshape = 'octagon'
        elif ntype in [ND_ORDER, ND_NONE, ND_RND_TRY, ND_LOOP_UNTIL_ALL, ND_LOOP_TIMES]:
            nshape = 'oval'
        else:
            raise RuntimeError(f'unrecognized node type {ntype}')

        nlabel += ntype

        if ntype in [ND_PLAYER, ND_WIN, ND_LOSE, NDX_SET_PLAYER]:
            nlabel += ':' + str(node[NKEY_PID])
        elif ntype in [ND_LOOP_TIMES]:
            nlabel += ':' + str(node[NKEY_TIMES])
        elif ntype in [NDX_FILE]:
            nlabel += ':' + node[NKEY_FILE] + '@' + node[NKEY_TARGET]
        elif ntype in [NDX_LINK]:
            nlabel += ':@' + node[NKEY_TARGET]
        elif ntype == NDX_SWAP_ONLY:
            nlabel += GVNEWLINE
            nlabel += GVTILEBGN
            nlabel += node[NKEY_WHAT]
            nlabel += GVTILEEND
            nlabel += ' with '
            nlabel += GVTILEBGN
            nlabel += node[NKEY_WITH]
            nlabel += GVTILEEND
        elif ntype in [NDX_REPLACE_ONLY]:
            nlabel += GVNEWLINE
            nlabel += GVTILEBGN
            nlabel += node[NKEY_WHAT]
            nlabel += GVTILEEND
            nlabel += ' with '
            nlabel += GVTILEBGN
            nlabel += (GVTILEEND + ', ' + GVTILEBGN).join([str(ee) for ee in node[NKEY_WITH]])
            nlabel += GVTILEEND

        if NKEY_NID in node.keys():
            nlabel += GVNEWLINE
            nlabel += GVNIDBGN
            nlabel += '@'
            nlabel += node[NKEY_NID]
            nlabel += GVNIDEND

        if NKEY_COMMENT in node.keys():
            nlabel += GVNEWLINE
            nlabel += GVCOMMBGN
            nlabel += node[NKEY_COMMENT]
            nlabel += GVCOMMEND

    nid = pid_to_nid[id(node)]

    if depth == 0:
        nfill = '#eeeeee'
    else:
        nfill = '#cccccc'

    print(f'  {nid} [shape="{nshape}", fillcolor="{nfill}", style="{nstyle}", label=<{nlabel}>];')

    if ntype == NDX_FILE:
        depth += 1

    if NKEY_CHILDREN in node.keys():
        children = node[NKEY_CHILDREN]
        for child in children:
            node_print_gv(child, depth, nid_to_node, pid_to_nid)
            child_id = pid_to_nid[id(child)]
            print(f'  {nid} -> {child_id};')

    if ntype == NDX_LINK:
        nid_target = node[NKEY_TARGET]
        if nid_target in nid_to_node:
            target_id = pid_to_nid[id(nid_to_node[nid_target])]
            print(f'  {nid} -> {target_id} [style="dotted", constraint="false"];')
        else:
            target_id = nid + '_TARGET_MISSING'
            print(f'  {target_id} [shape="house", label=<<i>MISSING</i>>, style="filled", fillcolor="{nfill}"];')
            print(f'  {nid} -> {target_id} [style="dotted"];')

def game_print_gv(game):
    nid_to_node, pid_to_nid = {}, {}
    node_find_nids(game.tree, nid_to_node, pid_to_nid)

    print('digraph G {')
    print(f'  graph [ordering="out"];')
    print(f'  _NAME [shape="component", label=<{game.name}>, style="filled", fillcolor="#aaaaaa"];')
    node_print_gv(game.tree, 0, nid_to_node, pid_to_nid)
    print('}')

def yamlload(filename):
    with open(filename, 'rt') as f:
        return yaml.safe_load(f)

def resolve_file_links(folder, node):
    if NKEY_CHILDREN in node.keys():
        new_children = []
        for child in node[NKEY_CHILDREN]:
            if child[NKEY_TYPE] == NDX_FILE:
                filename = child[NKEY_FILE]
                target = child[NKEY_TARGET]

                filename = f'{folder}/{filename}.yaml'
                data = yamlload(filename)

                fileroot = data[FKEY_TREE]
                nid_to_node, pid_to_nid = {}, {}
                node_find_nids(fileroot, nid_to_node, pid_to_nid)

                if target not in nid_to_node:
                    raise RuntimeError(f'missing target node {target} in file {filename}')

                child[NKEY_CHILDREN] = [nid_to_node[target]]

            new_children.append(resolve_file_links(folder, child))
        node[NKEY_CHILDREN] = new_children
    return node

def yaml2bt(filename, xform):
    data = yamlload(filename)

    name = data[FKEY_NAME]

    root = data[FKEY_TREE]

    node_check(root, False, False)

    root = resolve_file_links(os.path.dirname(filename), root)

    node_check(root, True, False)

    root = node_reshape_tiles(root)

    if xform:
        nid_to_node, pid_to_nid = {}, {}
        node_find_nids(root, nid_to_node, pid_to_nid)
        root = node_apply_xforms(root, [xform_identity], nid_to_node)

        if len(root) == 0:
            raise RuntimeError('xformed tree has no root')
        if len(root) > 1:
            raise RuntimeError('xformed tree has multiple roots')
        root = root[0]

        node_check(root, True, True)

    return Game(name, root)
