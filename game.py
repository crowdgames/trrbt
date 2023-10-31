import argparse
import random
import util


class GameProcessor:
    def __init__(self, filename):
        bt = util.yaml2bt(filename, True)

        self.filename = filename
        self.game_ends = False
        self.board = random.choice(bt.starts).split(";")
        self.board = [row.split() for row in self.board if row]
        self.m = len(self.board)
        self.n = len(self.board[0])
        self.tree = bt.tree
        self.current_player = None
        self.winner = None
        self.loser = None

    def game_play(self):
        # play the whole game
        self.display_board()
        while not self.game_ends:
            self.play()
        if self.winner is None and self.loser is None:
            print("A TIE")
            return
        elif self.winner:
            print("Player", self.winner, "wins")
            return
        elif self.loser:
            print("Player", self.loser, "loses")

    def play(self):
        # play one round of the game
        children = self.tree["children"]
        for child in children:
            if not self.game_ends:
                self.process_sequence_node(child)

    def process_sequence_node(self, child):
        child_type = child["type"]
        if child_type == "player" and not self.game_ends:
            self.current_player = child["number"]
            if not self.process_player_node(child):
                self.game_ends = True
        elif child_type == "all" and not self.game_ends:
            self.process_all_node(child)
        elif child_type == "loop" and not self.game_ends:
            self.process_loop_node(child)
        elif child_type == "win" and not self.game_ends:
            self.process_win_node(child)
        elif child_type == "lose" and not self.game_ends:
            self.process_lose_node(child)

    def process_player_node(self, node):
        valid_moves = []
        if node["children"]:
            for child in node["children"]:
                if child["type"] == "rewrite":
                    res = self.find_pattern(child)
                    if res:
                        res = res[1]
                        valid_moves.extend(res)
            # print("valid moves:", valid_moves)
            if len(valid_moves) == 0:
                # self.game_ends = True
                return False
            choice = random.choice(valid_moves)
            # print("choice =", choice)
            self.make_move(choice)
            return True

    def process_all_node(self, node):
        # todo
        if node["children"]:
            for child in node["children"]:
                if child["type"] == "rewrite":
                    res = self.find_pattern(child)
                    if res:
                        ret = res[1]
                        # print("move in all node", ret, len(ret))
                        self.make_move(ret[0])

    def process_loop_node(self, node):
        # currently, I assume the children of loop nodes are rewrite nodes
        flag = True
        while flag:
            flag = self.process_player_node(node)

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
        child = node["children"]
        self.display_board()
        for item in child:
            node_type = item["type"]
            if node_type == "match":
                pattern = item['pattern']
                if self.match_pattern(pattern):
                    print("Pattern matched:", pattern)
                    self.winner = self.current_player
                    self.game_ends = True
                    return
            elif node_type == "none":
                children = item["children"]
                for none_node_child in children:
                    pattern = none_node_child["pattern"]
                    # print(pattern)
                    if self.match_pattern(pattern):
                        print("Pattern matched - none:", pattern)
                        return
                self.game_ends = True
                # print("none matched")
                return

    def process_lose_node(self, node):
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
                    return
            elif node_type == "none":
                children = item["children"]
                for none_node_child in children:
                    pattern = none_node_child["pattern"]
                    if self.match_pattern(pattern):
                        # print("Pattern matched - none:", pattern)
                        return
                self.game_ends = True
                self.loser = self.current_player
                # print("none matched")
                return

    def match_pattern(self, pattern):
        rows = len(self.board)
        cols = len(self.board[0])
        pattern_rows = len(pattern)
        pattern_cols = len(pattern[0])

        if rows < pattern_rows or cols < pattern_cols:
            return False

        for i in range(rows - pattern_rows + 1):
            for j in range(cols - pattern_cols + 1):
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
        print("current board is:")
        for row in self.board:
            print(row)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Play game YAML.')
    parser.add_argument('filename', type=str, help='Filename to process.')
    args = parser.parse_args()

    game = GameProcessor(args.filename)
    game.game_play()
