import argparse
import random
import time
import util


class GameProcessor:
    def __init__(self, filename):
        bt = util.yaml2bt(filename, True)

        self.filename = filename
        self.game_ends = False
        self.board = util.string_to_pattern_list(random.choice(bt.starts))
        self.m = len(self.board)
        self.n = len(self.board[0])
        self.tree = bt.tree
        self.current_player = None
        self.winner = None
        self.loser = None
        self.max_tile_width = util.node_max_tile_width(self.tree)

    def game_play(self):
        """
        Play the whole game
        """
        self.display_board()
        # Process the root node
        root_type = self.tree["type"]
        if root_type == "sequence":
            self.process_sequence_node(self.tree)
        elif root_type == "loop-until-all":
            self.process_loop_until_all_node(self.tree)
        # Game ends
        if self.winner is None and self.loser is None:
            print("A TIE")
            return
        elif self.winner:
            print("Player", self.winner, "wins")
            return
        elif self.loser:
            print("Player", self.loser, "loses")

    def process_sequence_node(self, node):
        # assume that sequence node is the entry point and only appears at the root of the tree
        for child in node["children"]:
            if self.game_ends:
                break
            child_type = child["type"]
            if child_type == "player":  # todo
                self.current_player = child["number"]
                if not self.process_player_node(child):
                    # current player has no valid move
                    self.loser = self.current_player
                    self.game_ends = True
            elif child_type == "all":
                self.process_all_node(child)
            elif child_type == "loop-until-all":
                self.process_loop_until_all_node(child)
            elif child_type == "win":
                self.process_win_node(child)
            elif child_type == "lose":
                self.process_lose_node(child)
            elif child_type == "rewrite":
                self.process_rewite_node(child)
            elif child_type == "sequence":
                self.process_sequence_node(child)
            elif child_type == "loop-times":
                self.process_loop_times_node(child)
            elif child_type == "random-try":
                self.process_rondom_try_node(child)

    def process_loop_times_node(self, node):
        # currently this function is used to randomize board
        times = node["times"]
        while times > 0:
            times -= 1
            for child in node["children"]:
                if self.game_ends:
                    break
                child_type = child["type"]
                # todo: what if child type is not random?
                if child_type == "sequence":
                    self.process_sequence_node(child)
                elif child_type == "random-try":
                    self.process_rondom_try_node(child)
                # print(child)
        print("Randomzing board...")
        self.display_board()

    def process_rewite_node(self, node):
        res = self.find_pattern(node)
        if res:
            res = res[1][0]
            self.make_move(res)
            return True
        return False

    def process_player_node(self, node):
        """
        Prompt the player to make a choice from a list of valid moves.
        :return: True if the player has at least one valid move. False otherwise.
        """
        # assume that all children nodes of player node are rewrite nodes
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
            print("Your choices are:")
            idx = 0
            for node, row, col in valid_moves:
                lhs = '; '.join([' '.join(row) for row in node['lhs']])
                rhs = '; '.join([' '.join(row) for row in node['rhs']])

                print(f'{idx}: at {row},{col} {lhs} → {rhs}')
                idx += 1
            while True:
                try:
                    user_input = int(input(f"Please enter the index of your choice, from 0 to {idx - 1}: "))
                    if user_input < 0 or user_input >= idx:
                        print("Your index is out of range!")
                        continue
                    break
                except ValueError:
                    print("Error: Please enter a valid integer.")

            choice = valid_moves[user_input]
            self.make_move(choice)
            return True

    def process_rondom_try_node(self, node):
        """
        The system will pick a rondom move. No need for player to make a choice.
        :param node:
        :return:
        """
        # assume that all children nodes of player node are rewrite nodes
        valid_moves = []
        if node["children"]:
            for child in node["children"]:
                if child["type"] == "rewrite":
                    res = self.find_pattern(child)
                    if res:
                        res = res[1]
                        valid_moves.extend(res)
                else:
                    # todo
                    print("type =", child['type'])
            if len(valid_moves) == 0:
                return False
            choice = random.choice(valid_moves)
            self.make_move(choice)
            return True

    def process_all_node(self, node):
        # todo
        # loop until all children fail == apply all once + loop ?
        flag = False
        for child in node["children"]:
            child_type = child["type"]
            if child_type == "rewrite":
                flag = self.process_rewite_node(child)
        return flag

    def process_loop_until_all_node(self, node):
        # loops until all children fail
        flag = True
        while flag and not self.game_ends:
            # self.process_sequence_node(node)
            flag = False
            for child in node["children"]:
                if self.game_ends:
                    break
                child_type = child["type"]
                if child_type == "player":
                    if self.process_player_node(child):
                        flag = True
                elif child_type == "loop-until-all":
                    if self.process_loop_until_all_node(child):
                        flag = True
                elif child_type == "win":
                    self.process_win_node(child)
                elif child_type == "lose":
                    self.process_lose_node(child)
                elif child_type == "rewrite":
                    if self.process_rewite_node(child):
                        flag = True
                elif child_type == "random-try":
                    if self.process_rondom_try_node(child):
                        flag = True
        return flag

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

    def process_win_node(self, node):
        """
        Process win node
        :return: true if one of the players win and false otherwise
        """
        child = node["children"]
        self.display_board()
        for item in child:
            node_type = item["type"]
            if node_type == "match":
                pattern = item['pattern']
                if self.match_pattern(pattern):
                    print("Pattern matched:", pattern)
                    self.winner = self.current_player
                    print("winner", self.winner)
                    self.game_ends = True
                    return True
            elif node_type == "none":
                children = item["children"]
                for none_node_child in children:
                    pattern = none_node_child["pattern"]
                    if self.match_pattern(pattern):
                        return False
                self.game_ends = True
                self.winner = self.current_player
                return True
        return False

    def process_lose_node(self, node):
        """
        Process lose node
        """
        child = node["children"]
        self.display_board()
        for item in child:
            node_type = item["type"]
            if node_type == "match":
                pattern = item['pattern']
                if self.match_pattern(pattern):
                    print("Pattern matched:", pattern)
                    self.loser = self.current_player
                    self.game_ends = True
                    return True
            elif node_type == "none":
                children = item["children"]
                for none_node_child in children:
                    pattern = none_node_child["pattern"]
                    if self.match_pattern(pattern):
                        return
                self.game_ends = True
                self.loser = self.current_player
                return

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
                        if pattern[r][c] != '.':
                            if self.board[i + r][j + c] != pattern[r][c]:
                                match = False
                                break
                    if not match:
                        break
                if match:
                    return True
        return False

    def display_board(self):
        print("Current board is:")
        for row in util.pad_tiles([self.board], self.max_tile_width)[0]:
            print(' '.join(row))


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
