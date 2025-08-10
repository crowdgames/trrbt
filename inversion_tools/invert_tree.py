import argparse
import json
import subprocess
import sys
sys.path += ['.', '..']
import util

def check_tree(tree):
    if tree['type'] != 'loop-until-all':
        print('Invalid game, tree does not have loop-until-all as top node')
        return False

    l_u_a_childs = tree['children'] #children of order node, delete this if we go back to system using start board
    allowed_types_l_u_a = ['win', 'player']
    for i in range(len(allowed_types_l_u_a)):
        if l_u_a_childs[i]['type'] != allowed_types_l_u_a[i]:
            print('Invalid game based on children of l-u-a node')
            return False
        if l_u_a_childs[i]['pid'] != '1':
            print('Invalid game based on player id')
            return False

    child_win = l_u_a_childs[0]

    if len(child_win['children']) != 1 or child_win['children'][0]['type'] != 'match-times': #l_u_a[1] is win node
        print ('Invalid game because win condition is not a single match-times')
        return False
    else:
        win_children = child_win['children']

    child_player = l_u_a_childs[1]

    rewrites = []
    if len(child_player['children']) == 0:
        print ('Invalid game because player does not have children')
        return False

    for node in child_player['children']: #list of the children of the player node
        if node['type'] != 'rewrite':
            print('Invalid game because not all children of player node are rewrites')
            return False
        else:
            rewrite = {'type': 'rewrite', 'rhs': node['lhs'] , 'lhs': node['rhs']}
            rewrites.append(rewrite)

    # return starting_board, rewrites
    return win_children, rewrites  # returning tuple of boolean (does check pass), and list of dictionaries (rewrites)


# def invert(inverted_filename, n, starting_board, winning_board, rewrites):
def invert(inverted_filename, game_name, win_children, rewrites):
    data = {
        'name': game_name,
        'tree': {
            'type': 'loop-until-all',
            'children': [
                {
                    'type': 'player',
                    'pid': '1',
                    'children': rewrites
                },
                {
                    'type': 'lose',
                    'pid': '1',
                    'children': win_children
                }
            ]
        }
    }

    with open(inverted_filename, 'w') as f:
        json.dump(data, f)



if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('game_name', type=str, help='Name of the inverted game.')
    parser.add_argument('filename', type=str, help='Filename to process.')
    parser.add_argument('inverted_filename', type=str, help='New file to write to inverted tree')
    args = parser.parse_args()

    game = util.yaml2bt(args.filename, True, True)
    game.tree = util.objify(game.tree)

    result = check_tree(game.tree)
    if result is False:
        raise RuntimeError('tree not valid')

    win_children, rewrites = result

    # when we run game_agent.py we should check that result is true and then only take the board input
    invert(args.inverted_filename, args.game_name, win_children, rewrites)
    print('tree inverted and written to ' + args.inverted_filename)
