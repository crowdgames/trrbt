import yaml


class Game:
    def __init__(self, starts, bt):
        self.starts = starts
        self.bt = bt

        
def pad_tiles(ts):
    tile_len = 0
    for t in ts:
        for row in t:
            for tile in row:
                tile_len = max(tile_len, len(tile))
    
    return [[[(tile + (' ' * (tile_len - len(tile)))) for tile in row] for row in t] for t in ts]

def string_to_tuple(s):
    return tuple([tuple([tile.strip() for tile in row.split()]) for row in s.split(';') if row.strip() != ''])

def node_reshape_tiles(node):
    node = node.copy()

    if node['type'] == 'rule':
        node['lhs'] = string_to_tuple(node['lhs'])
        node['rhs'] = string_to_tuple(node['rhs'])

    if 'children' in node.keys():
        node['children'] = [node_reshape_tiles(child) for child in node['children']]

    return node

def unique(rules):
    keys = {}
    for rule in rules:
        keys[rule] = None
    return list(keys.keys())

def rule_identity(lhs, rhs):
    return unique([(lhs, rhs)])

def rule_mirror(lhs, rhs):
    return unique([(lhs, rhs), (tuple([row[::-1] for row in lhs]), tuple([row[::-1] for row in rhs]))])

def rule_fliponly(lhs, rhs):
    return unique([(tuple(lhs[::-1]), tuple(rhs[::-1]))])

def rule_rotate(lhs, rhs):
    ret = [(lhs, rhs)]
    while len(ret) < 4:
        last_lhs, last_rhs = ret[-1]
        ret.append((tuple(zip(*last_lhs[::-1])), tuple(zip(*last_rhs[::-1]))))
    return unique(ret)

def rule_swaponly_fn(wht, wth):
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
            
    def rule_swaponly(lhs, rhs):
        ret = [(rule_swaponly_side(lhs), rule_swaponly_side(rhs))]
        return unique(ret)

    return rule_swaponly

def rule_replace_fn(wht, wth):
    def rule_replace_side(hs, wthi):
        ret_hs = ()
        for row in hs:
            ret_row = ()
            for tile in row:
                ret_tile = tile.replace(wht, wthi)
                ret_row += (ret_tile,)
            ret_hs += (ret_row,)
        return ret_hs
            
    def rule_replace(lhs, rhs):
        ret = [(lhs, rhs)] + [(rule_replace_side(lhs, wthi), rule_replace_side(rhs, wthi)) for wthi in wth]
        return unique(ret)

    return rule_replace

def node_xform_tiles(node, xforms, id_to_node, player_number_offset):
    nodes = []

    if 'id' in node.keys():
        id_to_node[node['id']] = node

    if node['type'] == 'rule':
        xformed = [(node['lhs'], node['rhs'])]
        for xform in xforms:
            new_xformed = []
            for lhs, rhs in xformed:
                new_xformed += xform(lhs, rhs)
            xformed = new_xformed
        for lhs, rhs in xformed:
            new_node = node.copy()
            new_node['lhs'], new_node['rhs'] = lhs, rhs
            nodes.append(new_node)

    elif node['type'] == 'link':
        nodes.append(node_xform_tiles(id_to_node[node['to']], xforms, id_to_node, player_number_offset)[0])

    elif node['type'] == 'nextplayer':
        nodes.append(node_xform_tiles(node['children'][0], xforms, id_to_node, player_number_offset + 1)[0])
        
    elif node['type'] in ['rotate', 'mirror', 'fliponly', 'swaponly', 'replace']:
        fn = None
        if node['type'] == 'rotate':
            fn = rule_rotate
        elif node['type'] == 'mirror':
            fn = rule_mirror
        elif node['type'] == 'fliponly':
            fn = rule_fliponly
        elif node['type'] == 'swaponly':
            fn = rule_swaponly_fn(node['what'], node['with'])
        elif node['type'] == 'replace':
            fn = rule_replace_fn(node['what'], node['with'])

        for child in node['children']:
            nodes += node_xform_tiles(child, [fn] + xforms, id_to_node, player_number_offset)

    else:
        node = node.copy()
        nodes.append(node)

        if node['type'] == 'player':
            node['number'] += player_number_offset
        
        if 'children' in node.keys():
            children = node['children']
            new_children = []
            for child in children:
                new_children += node_xform_tiles(child, xforms, id_to_node, player_number_offset)
            node['children'] = new_children

    return nodes

def node_print_gv(node, next_gid, id_to_gid):
    id_str = ('%04d' % next_gid[0])
    next_gid[0] += 1

    ntype = node['type']

    if 'id' in node.keys():
        id_to_gid[node['id']] = id_str

    if ntype == 'rule':
        nshape = 'box'
        nfont = 'Courier New'

        lhs = node['lhs']
        rhs = node['rhs']
        
        if False:
            tile_len = 0
            for ll, rr in zip(lhs, rhs):
                for ee in ll + rr:
                    tile_len = max(tile_len, len(ee))

            space_tile = '.'
            while True:
                if len(space_tile) >= tile_len:
                    break
                space_tile += ' '
                if len(space_tile) >= tile_len:
                    break
                space_tile = ' ' + space_tile
            lhs = [[(tile if tile != '.' else space_tile) for tile in row] for row in lhs]
            rhs = [[(tile if tile != '.' else space_tile) for tile in row] for row in rhs]
        else:
            lhs, rhs = pad_tiles([lhs, rhs])

        nlabel = ''
        for ii, (ll, rr) in enumerate(zip(lhs, rhs)):
            nlabel += ' '.join(ll)
            if ii == len(lhs) // 2:
                nlabel += ' → '
            else:
                nlabel += '   '
            nlabel += ' '.join(rr)
            nlabel += '\\n'
    else:
        if ntype in ['mirror', 'rotate', 'fliponly', 'swaponly', 'replace']:
            nshape = 'hexagon'
        elif ntype in ['player', 'nextplayer']:
            nshape = 'diamond'
        elif ntype in ['link']:
            nshape = 'invhouse'
        else:
            nshape = 'oval'
        nfont = 'Times New Roman'
        nlabel = ntype
        
        if ntype == 'player':
            nlabel += ':' + str(node['number'])
        elif ntype == 'swaponly':
            nlabel += '\\n'
            nlabel += node['what']
            nlabel += ' ↔ '
            nlabel += node['with']
        elif ntype == 'replace':
            nlabel += '\\n'
            nlabel += node['what']
            nlabel += ' → '
            nlabel += ' '.join(node['with'])

    print('  %s [label="%s", shape="%s", fontname="%s"];' % (id_str, nlabel, nshape, nfont))

    if 'children' in node.keys():
        children = node['children']
        for child in children:
            child_id = node_print_gv(child, next_gid, id_to_gid)
            print('  %s -> %s;' % (id_str, child_id))

    if ntype == 'link':
        print('  %s -> %s [style="dotted", constraint="false"];' % (id_str, id_to_gid[node['to']]))

    return id_str

def game_print_gv(game):
    print('digraph G {')
    for ii, start in enumerate(game.starts):
        start = pad_tiles([string_to_tuple(start)])[0]
        label = '\\n'.join([' '.join(row) for row in start])
        print('  START%d [shape="box", fontname="Courier New", label="%s"];' % (ii, label))
    node_print_gv(game.bt, [0], {})
    print('}')

def yaml2bt(filename, xform):
    with open(filename, 'rt') as f:
        data = yaml.safe_load(f)

    root = data['rule']
    root = node_reshape_tiles(root)
    if xform:
        root = node_xform_tiles(root, [rule_identity], {}, 0)[0]

    starts = data['start']

    return Game(starts, root)
