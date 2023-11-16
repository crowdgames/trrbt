import argparse
import random
import time
import util


class GameProcessor:
    def __init__(self, filename):
        bt = util.yaml2bt(filename, True)

        self.name = bt.name
        self.filename = filename
        self.game_ends = False
        self.board = util.listify(random.choice(bt.starts))
        self.m = len(self.board)
        self.n = len(self.board[0])
        self.tree = bt.tree
        self.current_player = None
        self.winner = None
        self.loser = None
        self.max_tile_width = util.node_max_tile_width(self.tree)
        self.previous_moves = {}

        self.node_func_map = {
            "sequence": self.execute_sequence_node,
            "loop-until-all": self.execute_loop_until_all_node,
            "win": self.execute_win_node,
            "lose": self.execute_lose_node,
            "rewrite": self.execute_rewite_node,
            "loop-times": self.execute_loop_times_node,
            "random-try": self.execute_rondom_try_node,
            "player": self.execute_player_node,
            "match": self.execute_match_node,
            "none": self.execute_none_node,
        }

    def execute_node(self, node):
        fn = self.node_func_map[node["type"]]
        return fn(node)

    def game_play(self):
        """
        Play the whole game
        """
        self.display_board()
        self.execute_node(self.tree)
        if self.game_ends:
            print("game ends")
            if self.winner is None and self.loser is None:
                print("A TIE")
                return
            elif self.winner:
                print("Player", self.winner, "wins")
                return
            elif self.loser:
                print("Player", self.loser, "loses")

    def execute_sequence_node(self, node):
        """
        Executes children in order (regardless of their success or failure)
        :return: If any child fails, returns failure, otherwise returns success.
        """
        flag = True
        for child in node["children"]:
            if self.game_ends:
                break
            if not self.execute_node(child):
                flag = False
        return flag

    def execute_loop_times_node(self, node):
        """
        Repeatedly executes children in order a fixed number of times
        Currently this function is used to randomize board
        :return: If any child succeeds, returns success, otherwise returns failure.
        """
        times = node["times"]
        while times > 0:
            times -= 1
            for child in node["children"]:
                self.execute_node(child)
        print("Randomzing board...")
        self.display_board()

    def execute_rewite_node(self, node):
        """
        If there are any lhs pattern matches, randomly rewrites one of these matches with the rhs pattern.
        :return: If any rewrite rule is applied successfully, return true, otherwise return false.
        """
        res = self.find_pattern(node)
        if res:
            res = res[1][0]
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
        self.current_player = node["number"]
        if node["children"]:
            for child in node["children"]:
                if child["type"] == "rewrite":
                    res = self.find_pattern(child)
                    if res:
                        res = res[1]
                        valid_moves.extend(res)
            if len(valid_moves) == 0:
                print("You don't have a valid move!")
                return False

            this_turn_choices = {}
            this_turn_info = {}

            for choice in valid_moves:
                node, row, col = choice

                lhs = util.pattern_to_string(node['lhs'], ' ', '; ')
                rhs = util.pattern_to_string(node['rhs'], ' ', '; ')

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

            print()
            print("Your choices are:")
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

    def execute_rondom_try_node(self, node):
        """
        Executes children in random order until one succeeds.
        :return: If any child succeeds, returns success, otherwise returns failure.
        """
        if node["children"]:
            list_of_children = node["children"]
            random.shuffle(list_of_children)
            for child in list_of_children:
                if self.execute_node(child):
                    return True

    def execute_loop_until_all_node(self, node):
        """
        Repeatedly executes children in order, until all children fail.
        :return: If any child succeeds, returns success, otherwise returns failure.
        """
        flag = True
        while flag and not self.game_ends:
            flag = False
            for child in node["children"]:
                if self.game_ends:
                    break
                if self.execute_node(child):
                    flag = True
        return flag

    def execute_match_node(self, node):
        """
        Executes match node
        :return: Returns success if pattern matches current board, otherwise returns failure.
        """
        pattern = node["pattern"]
        if self.match_pattern(pattern):
            print("Pattern matched:", pattern)
            return True
        return False

    def execute_none_node(self, node):
        """
        Executes children in order, until any child succeeds.
        :return: If any child succeeds, returns failure, otherwise returns success.
        """
        children = node["children"]
        if not children:
            return True
        for child in children:
            if self.execute_node(child):
                return False
        return True

    def execute_win_node(self, node):
        """
        Executes children in order, until any child succeeds
        :return: true if one of the players win and false otherwise
        """
        children = node["children"]
        self.display_board()
        for child in children:
            if self.execute_node(child):
                self.winner = self.current_player
                self.game_ends = True
                return True
        return False

    def execute_lose_node(self, node):
        """
        Executes children in order, until any child succeeds
        :return: true if one of the players lose and false otherwise
        """
        children = node["children"]
        self.display_board()
        for child in children:
            if self.execute_node(child):
                self.loser = self.current_player
                self.game_ends = True
                return True
        return False

    def execute_tie_node(self, node):
        # todo
        if node["children"]:
            print("..")

    def make_move(self, choice):
        if len(choice) != 3:
            return
        node, x, y = choice[0], choice[1], choice[2]
        lhs, rhs = node["lhs"], node["rhs"]
        for i in range(len(lhs)):
            for j in range(len(lhs[i])):
                if rhs[i][j] != '.':
                    self.board[x + i][y + j] = rhs[i][j]

    def find_pattern(self, child):
        ret = []
        for i in range(self.m):
            for j in range(self.n):
                if self.is_match(child["lhs"], i, j):
                    ret.append([child, i, j])
        if len(ret) == 0:
            return False
        return True, ret

    def is_match(self, lhs, x, y):
        for i in range(len(lhs)):
            for j in range(len(lhs[i])):
                if lhs[i][j] != '.':
                    if x + i >= self.m or y + j >= self.n or self.board[x + i][y + j] != lhs[i][j]:
                        return False
        return True, x, y

    def match_pattern(self, pattern):
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
        print()
        print("Current board is:")
        print(util.pattern_to_string(self.board, ' ', '\n', self.max_tile_width))


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Play game YAML.')
    parser.add_argument('filename', type=str, help='Filename to process.')
    parser.add_argument('--random', type=int, help='Random seed.')
    args = parser.parse_args()

    random_seed = args.random if args.random is not None else int(time.time()) % 10000
    print(f'Using random seed {random_seed}')
    random.seed(random_seed)

    game = GameProcessor(args.filename)
    game.game_play()
