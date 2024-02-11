import argparse
import copy
import os
import random
import sys
import time
import util

END_WIN   = 'win'
END_LOSE  = 'lose'
END_DRAW  = 'draw'
END_STALE = 'stale'

DEFAULT_DISPLAY_DELAY = 0.5

def cls():
    sys.stdout.flush()
    sys.stderr.flush()
    os.system('cls' if os.name == 'nt' else 'clear')

def delay(seconds):
    sys.stdout.flush()
    sys.stderr.flush()
    time.sleep(seconds)

class GameOver:
    def __init__(self, result, player):
        self.result = result
        self.player = player

class GameOverException(Exception):
    def __init__(self, result, player):
        self.game_over = GameOver(result, player)

class GameProcessor:
    def __init__(self, filename, choice_order, random_players, clear_screen):
        bt = util.yaml2bt(filename, True)

        self.name = bt.name
        self.filename = filename
        self.board = {}
        self.m = 0
        self.n = 0
        self.tree = bt.tree
        self.max_tile_width = util.node_max_tile_width(self.tree)
        self.previous_moves = {}

        self.game_over = None

        self.choice_order = choice_order
        self.random_players = random_players
        self.clear_screen = clear_screen

        self.node_func_map = {
            util.ND_DISPLAY_BOARD: self.execute_displayboard_node,
            util.ND_SET_BOARD: self.execute_setboard_node,
            util.ND_LAYER_TEMPLATE: self.execute_layertemplate_node,
            util.ND_APPEND_ROWS: self.execute_appendrows_node,
            util.ND_APPEND_COLS: self.execute_appendcols_node,
            util.ND_ORDER: self.execute_order_node,
            util.ND_LOOP_UNTIL_ALL: self.execute_loop_until_all_node,
            util.ND_WIN: self.execute_win_node,
            util.ND_LOSE: self.execute_lose_node,
            util.ND_DRAW: self.execute_draw_node,
            util.ND_REWRITE: self.execute_rewrite_node,
            util.ND_LOOP_TIMES: self.execute_loop_times_node,
            util.ND_RND_TRY: self.execute_random_try_node,
            util.ND_PLAYER: self.execute_player_node,
            util.ND_MATCH: self.execute_match_node,
            util.ND_ALL: self.execute_all_node,
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
            go = e.game_over
            if go.result == END_WIN:
                self.game_over = go
                print("Game over, player", go.player, "wins")
            elif go.result == END_LOSE:
                self.game_over = go
                print("Game over, player", go.player, "loses")
            elif go.result == END_DRAW:
                self.game_over = go
                print("Game over, draw")
            else:
                print("Game over, unrecognized game result:", e.result)
        else:
            self.display_board()
            self.game_over = GameOver(END_STALE, None)
            print("Game over, stalemate - root node exited but game has not ended")

    def execute_displayboard_node(self, node):
        """
        Display current board.
        :return: Success.
        """
        self.display_board()

        if self.clear_screen is not None:
            delay(self.clear_screen)

        return True

    def execute_setboard_node(self, node):
        """
        Sets current board to given pattern.
        :return: Success.
        """
        self.board = { layer: util.listify(patt) for layer, patt in node[util.NKEY_PATTERN].items() }
        self.m, self.n = util.layer_pattern_size(self.board)
        return True

    def execute_layertemplate_node(self, node):
        """
        Copies layer.
        :return: Success.
        """
        old_layer = self.board[util.DEFAULT_LAYER]
        new_layer = [[('.' if tile == '.' else node[util.NKEY_WITH]) for tile in row] for row in old_layer]
        self.board[node[util.NKEY_WHAT]] = new_layer
        return True

    def execute_appendrows_node(self, node):
        """
        Append new rows to the board by repeating the given pattern until as wide as the board.
        :return: Success.
        """
        pattern = node[util.NKEY_PATTERN]

        if self.m == 0 or self.n == 0:
            self.board = util.listify(pattern)
        else:
            new_rows = util.listify(pattern)
            while len(new_rows[0]) < self.n:
                for rr in range(len(pattern)):
                    new_rows[rr] += pattern[rr]
            for rr in range(len(pattern)):
                new_rows[rr] = new_rows[rr][:self.n]

            self.board += new_rows

        self.m, self.n = util.layer_pattern_size(self.board)
        return True

    def execute_appendcols_node(self, node):
        """
        Append new columns to the board by repeating the given pattern until as tall as the board.
        :return: Success.
        """
        pattern = node[util.NKEY_PATTERN]

        if self.m == 0 or self.n == 0:
            self.board = util.listify(pattern)
        else:
            new_cols = util.listify(pattern)
            while len(new_cols) < self.m:
                new_cols += pattern
            new_cols = new_cols[:self.m]

            for rr in range(len(pattern)):
                self.board[rr] += new_cols[rr]

        self.m, self.n = util.layer_pattern_size(self.board)
        return True

    def execute_order_node(self, node):
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

    def execute_rewrite_node(self, node):
        """
        If there are any lhs pattern matches, randomly rewrites one of these matches with the rhs pattern.
        :return: If any rewrite rule is applied successfully, return true, otherwise return false.
        """
        res = self.find_layer_pattern(node[util.NKEY_LHS])
        if len(res) > 0:
            row, col = random.choice(res)
            self.make_move(node[util.NKEY_RHS], row, col)
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

        for child in node[util.NKEY_CHILDREN]:
            if child[util.NKEY_TYPE] == util.ND_REWRITE:
                res = self.find_layer_pattern(child[util.NKEY_LHS])
                if len(res) > 0:
                    child_desc = child[util.NKEY_DESC] if util.NKEY_DESC in child else None
                    valid_moves += [(child_desc, row, col, child[util.NKEY_LHS], child[util.NKEY_RHS]) for row, col in res]
            else:
                raise RuntimeError('All children of player nodes must be rewrite')

        if len(valid_moves) == 0:
            print(f"Player {player_id} doesn't have a valid move!")

            if self.clear_screen is not None:
                delay(self.clear_screen)

            return False

        this_turn_choices = {}
        this_turn_info = {}

        for ii, choice in enumerate(valid_moves):
            desc, row, col, lhs, rhs = choice

            lhs, rhs = util.layer_pad_tiles_multiple([lhs, rhs])
            lhs = { layer: util.tuplify(patt) for layer, patt in lhs.items() }
            rhs = { layer: util.tuplify(patt) for layer, patt in rhs.items() }

            if self.choice_order:
                idx = ii + 1

            else:
                idx = None

                choice_keys = [(str(lhs), row, col, str(rhs)), (str(lhs), row, col), (str(lhs))]
                for choice_key in choice_keys:
                    if choice_key in self.previous_moves:
                        idx = self.previous_moves[choice_key]
                        break

                if idx is None:
                    idx = 1 + (max(self.previous_moves.values()) if len(self.previous_moves) > 0 else 0)

                while idx in this_turn_choices:
                    idx += 1

                for choice_key in choice_keys:
                    self.previous_moves[choice_key] = idx

            this_turn_choices[idx] = choice
            this_turn_info[idx] = (desc, rhs, row, col)

        if player_id in self.random_players:
            user_input = random.choice(list(this_turn_choices.keys()))

            lhs, rhs, row, col = this_turn_info[user_input]
            lhs = util.layer_pattern_to_string(lhs, None, '-', '-:', '&', '', '', ' ', '; ')
            rhs = util.layer_pattern_to_string(rhs, None, '-', '-:', '&', '', '', ' ', '; ')
            print(f'Player {player_id} choice: {lhs} → {rhs} at {row},{col}')

            if self.clear_screen is not None:
                delay(self.clear_screen)

        else:
            user_input = self.get_player_choice_input(player_id, this_turn_info)

        desc, row, col, lhs, rhs = this_turn_choices[user_input]
        self.make_move(rhs, row, col)
        return True

    def get_player_choice_input(self, player_id, this_turn_info):
        print(f"Choices for player {player_id} are:")
        for idx in sorted(this_turn_info.keys()):
            desc, rhs, row, col = this_turn_info[idx]
            lhs = util.layer_pattern_to_string(lhs, None, '-', '-:', '&', '', '', ' ', '; ')
            rhs = util.layer_pattern_to_string(rhs, None, '-', '-:', '&', '', '', ' ', '; ')
            choice_desc = f'({desc}) ' if desc is not None else ''
            print(f'{choice_desc}{idx}: {lhs} → {rhs} at {row},{col}')

        while True:
            try:
                user_input = int(input(f"Please enter the number of your choice: "))
                if user_input not in this_turn_info:
                    print("Your number is out of range!")
                    continue
                return user_input
            except ValueError:
                print("Error: Please enter a valid number.")

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
        if self.match_layer_pattern(pattern):
            #print("Pattern matched:", util.pattern_to_string(pattern, ' ', '; '))
            return True
        return False

    def execute_all_node(self, node):
        """
        Executes children in order, until any child fails.
        :return: If any child fails, returns failure, otherwise returns success.
        """
        children = node[util.NKEY_CHILDREN]
        for child in children:
            if not self.execute_node(child):
                return False
        return True

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

    def make_move(self, lpatt, row, col):
        pr, pc = util.layer_pattern_size(lpatt)
        for rr in range(pr):
            for cc in range(pc):
                for layer, patt in lpatt.items():
                    tile = patt[rr][cc]
                    if tile == '.':
                        continue
                    self.board[layer][row + rr][col + cc] = tile

    def find_layer_pattern(self, lpatt):
        ret = []
        pr, pc = util.layer_pattern_size(lpatt)
        for rr in range(self.m - pr + 1):
            for cc in range(self.n - pc + 1):
                if self.is_match(lpatt, rr, cc):
                    ret.append([rr, cc])
        return ret

    def match_layer_pattern(self, lpatt):
        ret = []
        pr, pc = util.layer_pattern_size(lpatt)
        for rr in range(self.m - pr + 1):
            for cc in range(self.n - pc + 1):
                if self.is_match(lpatt, rr, cc):
                    return True
        return False

    def is_match(self, lpatt, row, col):
        pr, pc = util.layer_pattern_size(lpatt)
        for rr in range(pr):
            for cc in range(pc):
                for layer, patt in lpatt.items():
                    tile = patt[rr][cc]
                    if tile == '.':
                        continue
                    if self.board[layer][row + rr][col + cc] != tile:
                        return False
        return True

    def display_board(self):
        if self.clear_screen is not None:
            cls()
        else:
            print()

        print("Current board is:")
        print(util.layer_pattern_to_string(self.board, None, '-', '-\n', '\n', '', '', ' ', '\n', self.max_tile_width))
        print()



if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Play game YAML.')
    parser.add_argument('filename', type=str, help='Filename to process.')
    parser.add_argument('--player-random', type=str, nargs='+', help='Player IDs to play randomly.', default=[])
    parser.add_argument('--random', type=int, help='Random seed.')
    parser.add_argument('--choice-order', action='store_true', help='Keep move choices in order.')
    parser.add_argument('--cls', type=float, nargs='?', const=DEFAULT_DISPLAY_DELAY, default=None, help='Clear screen before moves, optionally providing move delay.')
    args = parser.parse_args()

    random_seed = args.random if args.random is not None else int(time.time()) % 10000
    print(f'Using random seed {random_seed}')
    random.seed(random_seed)

    game = GameProcessor(args.filename, args.choice_order, args.player_random, args.cls)
    game.game_play()
