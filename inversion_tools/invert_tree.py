import yaml
import argparse
import subprocess
import json

def load_yaml(filename):
    with open(filename) as f:
        return yaml.safe_load(f)

def check_tree(data):
    if 'tree' not in data:
        print("Invalid game, yaml does not start with a tree")
        return False
    tree = data['tree']
    if tree['type'] != 'loop-until-all':
        print("Invalid game, tree does not have loop-until-all as top node")
        return False
    # order_childs = tree['children']
    l_u_a_childs = tree['children'] #children of order node, delete this if we go back to system using start board
    # allowed_types_order = ['set-board', 'loop-until-all']
    allowed_types_lua = ['player', 'win']
    rewrites = []

    # for i in range(len(allowed_types_order)):
    #     if order_childs[i]['type'] != allowed_types_order[i]:
    #         print("Invalid game based on children of order node")
    #         return False, {}, []

    # l_u_a_childs = allowed_types_lua[1]['children'] #now we're at list of children of loop-u-a node
    for i in range(len(allowed_types_lua)):
        if l_u_a_childs[i]['type'] != allowed_types_lua[i]:
            print("Invalid game based on children of l-u-a node")
            return False, {}, []

    for node in l_u_a_childs[0]['children']: #list of the children of the player node
        if node['type'] != 'rewrite':
            print("Invalid game because not all children of player node are rewrites")
            return False, {}, []
        else:
            rewrite = {'type': 'rewrite', 'rhs': node['lhs'] , 'lhs': node['rhs']}
            rewrites.append(rewrite)


    if (l_u_a_childs[1]['children'][0]['type'] != 'match') and (l_u_a_childs[1]['children'][0]['type'] != 'match-times'): #l_u_a[1] is win node
        print ("Invalid game because win condition isn't match")
        return False, {}, []
    else:
        win_children = l_u_a_childs[1]['children']



    # starting_board = order_childs[0]['pattern']

    # return True, starting_board, rewrites
    return True, win_children, rewrites  #returning tuple of boolean (does check pass), and list of dictionaries (rewrites)


# def invert(inverted_filename, n, starting_board, winning_board, rewrites):
def invert(inverted_filename, win_children, rewrites):
    data = {
        'name': inverted_filename,
        'tree': {
            # 'type': 'order',
            # 'children': [
            #     {'type': 'set-board',
            #     'pattern': winning_board},
                'type': 'loop-until-all',
                # 'times': n,
                'children': [
                        {
                            'type': 'player',
                            'pid': "1",
                            'children': rewrites
                        },
                        {
                            'type': 'lose',
                            'pid': "1",
                            'children': win_children
                            # [
                            #     {
                            #         'type': 'match',
                            #         'pattern': starting_board
                            #     },
                            #     {
                            #         'type': 'match',
                            #         'pattern': winning_board
                            #     }
                            #     #pattern match for stalemate?
                            # ]
                        }
                    ]
        }
    }

    file = open(inverted_filename, "w")
    yaml.dump(data, file, sort_keys=False)


def format_win_board(winning_board):
    board_string = str(winning_board)
    formatted = ''
    # board = winning_board['main']
    for char in board_string:
        if char == "'":
            formatted += '"'

        else:
            formatted += char
    return formatted
    # for row in board:
    #     for mini_string in row:
    #         board_string += mini_string + " "
    #     board_string += ";"
    # return board_string

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('filename', type=str, help='Filename to process.')
    parser.add_argument('inverted_filename', type=str, help='New file to write to inverted tree')
    # parser.add_argument('n', type=str, help='number of random executions of reverse rewrites')
    args = parser.parse_args()

    data = load_yaml(args.filename)
    print(data)

    # n = int(args.n)
    # valid, starting_board, rewrites = check_tree(data)
    valid, win_children, rewrites = check_tree(data)

    if valid:
        #when we run game_agent.py we should check that result is true and then only take the board input
        invert(args.inverted_filename, win_children, rewrites)
        print("tree inverted and written to " + args.inverted_filename)

        # forward_run = subprocess.run(
        # ["python", "game_agent.py", args.filename], stdout=subprocess.PIPE, text=True)
        # forward_result = json.loads(forward_run.stdout)
        # winning_board = format_win_board(forward_result.get("board"))

        # if (forward_result.get("result")):
        #     invert(args.inverted_filename, args.n, win_children, rewrites)
        #     print("tree inverted and written to " + args.inverted_filename)
        # else:
        #     print("failed forward run")

    else:
        print("not valid")
