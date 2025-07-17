import yaml
import argparse
import game_agent
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
    if tree['type'] != 'order': return False
    order_childs = tree['children'] #children of order node
    allowed_types_order = ['set-board', 'loop-until-all']
    allowed_types_lua = ['player', 'win']
    rewrites = []

    for i in range(len(allowed_types_order)):
        if order_childs[i]['type'] != allowed_types_order[i]:
            print("Invalid game based on children of order node")
            return False, {}, []
           
    l_u_a_childs = order_childs[1]['children'] #now we're at list of children of loop-u-a node
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
 
    
    if (l_u_a_childs[1]['children'][0]['type'] != 'match') or (len(l_u_a_childs[1]['children'])!= 1): #l_u_a[1] is win node
        print ("Invalid game because win condition isn't match")
        return False, {}, []
    
    starting_board = order_childs[0]['pattern']
    
    #returning tuple of boolean, dictionary, and list of dictionaries
    return True, starting_board, rewrites 


def invert(tree, inverted_filename, n, starting_board, winning_board, rewrites): 
    data = {
        'name': inverted_filename,
        'tree': {
            'type': 'order', 
            'children': [
                {'type': 'set-board', 
                'pattern': winning_board},
                {'type': 'loop-times',
                'times': n,
                'children': [
                        {
                            'type': 'player', 
                            'pid': "1", 
                            'children': rewrites
                        },
                        {
                            'type': 'lose',
                            'pid': "1",
                            'children': [
                                {
                                    'type': 'match',
                                    'pattern': starting_board 
                                },
                                {
                                    'type': 'match',
                                    'pattern': winning_board
                                }
                                #pattern match for stalemate? 
                            ]
                        }
                    ]
                }
            ]                      
        }
    }
    
    file = open(inverted_filename, "w")
    yaml.dump(data, file)

def format_win_board(winning_board):
    board_string = ''
    board = winning_board['main']
    for row in board:
        for mini_string in row:
            board_string += mini_string + " "
        board_string += ";"
    return board_string
# 'pattern': 'lr dl __ __ ; __ dr dl __ ; __ __ ur dl ; __ __ __ ud ; __ __ __ ud ; __ __ __ ur ;'}
    
if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('filename', type=str, help='Filename to process.')
    parser.add_argument('inverted_filename', type=str, help='New file to write to inverted tree')
    parser.add_argument('n', type=int, help='number of random executions of reverse rewrites')
    args = parser.parse_args()

    data = load_yaml(args.filename)
    # check if tree is valid, use something from util
    valid, starting_board, rewrites = check_tree(data)
   
    if valid:
        #when we run game_agent.py we should check that result is true and then only take the board input
        forward_run = subprocess.run(
        ["python", "game_agent.py", args.filename], stdout=subprocess.PIPE, text=True)
        forward_result = json.loads(forward_run.stdout)
        winning_board = format_win_board(forward_result.get("board"))
        
        if (forward_result.get("result")): 
            invert(data, args.inverted_filename, args.n, starting_board, winning_board, rewrites)
            print("tree inverted and written to " + args.inverted_filename)
        else:
            print("failed forward run")
        
    else:
        print("not valid")
