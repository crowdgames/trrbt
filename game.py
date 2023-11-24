import argparse
import os
import random
import sys
import time
import util

END_WIN  = 'win'
END_LOSE = 'lose'
END_DRAW = 'draw'

def cls():
    sys.stdout.flush()
    sys.stderr.flush()
    os.system('cls' if os.name == 'nt' else 'clear')

class GameOverException(Exception):
    def __init__(self, result, player):
        self.result = result
        self.player = player

class GameProcessor:
    def __init__(self, filename, random_players, clear_screen):
        bt = util.yaml2bt(filename, True)

        self.name = bt.name
        self.filename = filename
        self.board = None
        self.m = None
        self.n = None
        self.tree = bt.tree
        self.max_tile_width = util.node_max_tile_width(self.tree)
        self.previous_moves = {}

        self.random_players = random_players
        self.clear_screen = clear_screen

        self.node_func_map = {
            util.ND_SET_BOARD: self.execute_setboard_node,
            util.ND_SEQ: self.execute_sequence_node,
            util.ND_LOOP_UNTIL_ALL: self.execute_loop_until_all_node,
            util.ND_WIN: self.execute_win_node,
            util.ND_LOSE: self.execute_lose_node,
            util.ND_DRAW: self.execute_draw_node,
            util.ND_REWRITE: self.execute_rewite_node,
            util.ND_LOOP_TIMES: self.execute_loop_times_node,
            util.ND_RND_TRY: self.execute_random_try_node,
            util.ND_PLAYER: self.execute_player_node,
            util.ND_MATCH: self.execute_match_node,
            util.ND_NONE: self.execute_none_node,
        }

    def execute_node(self, node):
        fn = self.node_func_map[node[util.NKEY_TYPE]]
        return fn(node)

    def game_play(self):
        """
        Play the whole game
        """
        try:
            self.execute_node(self.tree)
        except GameOverException as e:
            self.display_board()
            print()
            if e.result == END_WIN:
                print("Game over, player", e.player, "wins")
            elif e.result == END_LOSE:
                print("Game over, player", e.player, "loses")
            elif e.result == END_DRAW:
                print("Game over, draw")
            else:
                print("Game over, unrecognized game result:", e.result)
        else:
            self.display_board()
            print()
            print("Game over, stalemate - root node exited but game has not ended")

    def execute_setboard_node(self, node):
        """
        Sets current board to given pattern.
        :return: Success.
        """
        self.board = util.listify(node[util.NKEY_PATTERN])
        self.m = len(self.board)
        self.n = len(self.board[0])
        return True

    def execute_sequence_node(self, node):
        """
        Executes children in order (regardless of their success or failure)
        :return: If any child succeeds, returns success, otherwise returns failure.
        """
        flag = False
        for child in node[util.NKEY_CHILDREN]:
            if self.execute_node(child):
                flag = True
        return flag

    def execute_loop_times_node(self, node):
        """
        Repeatedly executes children in order a fixed number of times
        :return: If any child succeeds, returns success, otherwise returns failure.
        """
        flag = False
        times = node[util.NKEY_TIMES]
        while times > 0:
            times -= 1
            for child in node[util.NKEY_CHILDREN]:
                if self.execute_node(child):
                    flag = True
        return flag

    def execute_rewite_node(self, node):
        """
        If there are any lhs pattern matches, randomly rewrites one of these matches with the rhs pattern.
        :return: If any rewrite rule is applied successfully, return true, otherwise return false.
        """
        res = self.find_pattern(node)
        if res:
            res = random.choice(res[1])
            self.make_move(res)
            return True
        return False

    def execute_player_node(self, node):
        """
        Prompt the player to make a choice from a list of valid moves.
        All children nodes of player node are rewrite nodes
        :return: True if the player has at least one valid move. False otherwise.
        """
        valid_moves = []
        player_id = str(node[util.NKEY_PID])

        self.display_board()
        print()

        for child in node[util.NKEY_CHILDREN]:
            if child[util.NKEY_TYPE] == util.ND_REWRITE:
                res = self.find_pattern(child)
                if res:
                    res = res[1]
                    valid_moves.extend(res)
            else:
                raise RuntimeError('All children of player nodes must be rewrite')

        if len(valid_moves) == 0:
            print(f"Player {player_id} doesn't have a valid move!")
            return False

        this_turn_choices = {}
        this_turn_info = {}

        for choice in valid_moves:
            node, row, col = choice

            lhs, rhs = util.pad_tiles_multiple([node[util.NKEY_LHS], node[util.NKEY_RHS]])
            lhs = util.pattern_to_string(lhs, ' ', '; ')
            rhs = util.pattern_to_string(rhs, ' ', '; ')

            idx = None

            choice_keys = [(lhs, row, col, rhs), (lhs, row, col), (lhs)]
            for choice_key in choice_keys:
                if choice_key in self.previous_moves:
                    idx = self.previous_moves[choice_key]
                    break

            if idx is None:
                idx = 1 + (max(self.previous_moves.values()) if len(self.previous_moves) > 0 else 0)

            while idx in this_turn_choices:
                idx += 1

            this_turn_choices[idx] = choice
            this_turn_info[idx] = (lhs, rhs, row, col)

            for choice_key in choice_keys:
                self.previous_moves[choice_key] = idx

        if player_id in self.random_players:
            user_input = random.choice(list(this_turn_choices.keys()))

            lhs, rhs, row, col = this_turn_info[user_input]
            print(f'Player {player_id} choice: {lhs} → {rhs} at {row},{col}')

        else:
            print(f"Choices for player {player_id} are:")
            for idx in sorted(this_turn_choices.keys()):
                lhs, rhs, row, col = this_turn_info[idx]
                print(f'{idx}: {lhs} → {rhs} at {row},{col}')

            while True:
                try:
                    user_input = int(input(f"Please enter the number of your choice: "))
                    if user_input not in this_turn_choices:
                        print("Your number is out of range!")
                        continue
                    break
                except ValueError:
                    print("Error: Please enter a valid number.")

        choice = this_turn_choices[user_input]
        self.make_move(choice)
        return True

    def execute_random_try_node(self, node):
        """
        Executes children in random order until one succeeds.
        :return: If any child succeeds, returns success, otherwise returns failure.
        """
        if node[util.NKEY_CHILDREN]:
            list_of_children = node[util.NKEY_CHILDREN]
            random.shuffle(list_of_children)
            for child in list_of_children:
                if self.execute_node(child):
                    return True
        return False

    def execute_loop_until_all_node(self, node):
        """
        Repeatedly executes children in order, until all children fail.
        :return: If any child succeeds, returns success, otherwise returns failure.
        """
        flag = False
        keep_going = True
        while keep_going:
            keep_going = False
            for child in node[util.NKEY_CHILDREN]:
                if self.execute_node(child):
                    flag = True
                    keep_going = True
        return flag

    def execute_match_node(self, node):
        """
        Executes match node
        :return: Returns success if pattern matches current board, otherwise returns failure.
        """
        pattern = node[util.NKEY_PATTERN]
        if self.match_pattern(pattern):
            #print("Pattern matched:", util.pattern_to_string(pattern, ' ', '; '))
            return True
        return False

    def execute_none_node(self, node):
        """
        Executes children in order, until any child succeeds.
        :return: If any child succeeds, returns failure, otherwise returns success.
        """
        children = node[util.NKEY_CHILDREN]
        for child in children:
            if self.execute_node(child):
                return False
        return True

    def execute_win_node(self, node):
        """
        Executes children in order, until any child succeeds
        :return: when a child succeeds, game ends immediately as a win, and false otherwise
        """
        children = node[util.NKEY_CHILDREN]
        player = str(node[util.NKEY_PID])
        for child in children:
            if self.execute_node(child):
                raise GameOverException(END_WIN, player)
        return False

    def execute_lose_node(self, node):
        """
        Executes children in order, until any child succeeds
        :return: when a child succeeds, game ends immediately as a lose, and false otherwise
        """
        children = node[util.NKEY_CHILDREN]
        player = str(node[util.NKEY_PID])
        for child in children:
            if self.execute_node(child):
                raise GameOverException(END_LOSE, player)
        return False

    def execute_draw_node(self, node):
        """
        Executes children in order, until any child succeeds
        :return: when a child succeeds, game ends immediately as a draw, and false otherwise
        """
        children = node[util.NKEY_CHILDREN]
        for child in children:
            if self.execute_node(child):
                raise GameOverException(END_DRAW, None)
        return False

    def make_move(self, choice):
        if self.board is None:
            raise RuntimeError('Cannot make move without board.')
        if len(choice) != 3:
            raise RuntimeError('Choice wrong size.')

        node, x, y = choice[0], choice[1], choice[2]
        lhs, rhs = node[util.NKEY_LHS], node[util.NKEY_RHS]
        for i in range(len(lhs)):
            for j in range(len(lhs[i])):
                if rhs[i][j] != '.':
                    self.board[x + i][y + j] = rhs[i][j]

    def find_pattern(self, child):
        if self.board is None:
            raise RuntimeError('Cannot find pattern without board.')

        ret = []
        for i in range(self.m):
            for j in range(self.n):
                if self.is_match(child[util.NKEY_LHS], i, j):
                    ret.append([child, i, j])
        if len(ret) == 0:
            return False
        return True, ret

    def is_match(self, lhs, x, y):
        if self.board is None:
            raise RuntimeError('Cannot match without board.')

        for i in range(len(lhs)):
            for j in range(len(lhs[i])):
                if lhs[i][j] != '.':
                    if x + i >= self.m or y + j >= self.n or self.board[x + i][y + j] != lhs[i][j]:
                        return False
        return True, x, y

    def match_pattern(self, pattern):
        if self.board is None:
            raise RuntimeError('Cannot match without board.')

        pattern_rows = len(pattern)
        pattern_cols = len(pattern[0])

        if self.m < pattern_rows or self.n < pattern_cols:
            return False

        for i in range(self.m - pattern_rows + 1):
            for j in range(self.n - pattern_cols + 1):
                match = True
                for r in range(pattern_rows):
                    for c in range(pattern_cols):
                        if pattern[r][c] != ".":
                            if self.board[i + r][j + c] != pattern[r][c]:
                                match = False
                                break
                    if not match:
                        break
                if match:
                    return True
        return False

    def display_board(self):
        if self.board is None:
            raise RuntimeError('Cannot display without board.')

        if self.clear_screen:
            cls()
        else:
            print()

        print("Current board is:")
        print(util.pattern_to_string(self.board, ' ', '\n', self.max_tile_width))


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Play game YAML.')
    parser.add_argument('filename', type=str, help='Filename to process.')
    parser.add_argument('--player-random', type=str, nargs='+', help='Player IDs to play randomly.', default=[])
    parser.add_argument('--random', type=int, help='Random seed.')
    parser.add_argument('--cls', action='store_true', help='Clear screen before moves.')
    args = parser.parse_args()

    random_seed = args.random if args.random is not None else int(time.time()) % 10000
    print(f'Using random seed {random_seed}')
    random.seed(random_seed)

    game = GameProcessor(args.filename, args.player_random, args.cls)
    game.game_play()
