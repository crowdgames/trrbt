import trrbt.util as util
import random
import numpy as np
import argparse
import time
import copy
from queue import PriorityQueue
from collections import deque
import trrbt.game as game
from trrbt.game import GameOverException, END_WIN


def manhattan(board, a, b):
    ai = np.argwhere(board == a)
    bi = np.argwhere(board == b)
    if len(ai) == 0 or len(bi) == 0:
        return -1
    return (ai[0][0] - bi[0][0]) + (ai[0][1] - bi[0][1])


def blockdude_heuristic(board):
    dist = manhattan(board[util.DEFAULT_LAYER], "P", "D")
    if dist == -1:
        return 0
    return dist


class Frontier:
    def __init__(self, priority, item):
        self.priority = priority
        self.item = item

    def __eq__(self, other):
        return self.priority == other.priority

    def __lt__(self, other):
        return self.priority < other.priority


class AgentGameProcessor(game.GameProcessor):
    def __init__(self, filename, agent_id, agent_heuristic):
        super().__init__(filename, True, [], False)
        self.agent_id = agent_id
        self.agent_heuristic = agent_heuristic

        self.agent_frontier = PriorityQueue()
        self.agent_came_from = dict()
        self.agent_previous_move = dict()
        self.agent_cost = dict()

        self.agent_current = None
        self.agent_current_unexplored_neighbors = []
        self.agent_current_move_intermediates = []

        self.solution = []
        self.move_count = 0
        self.start = time.time()

    def display_board(self, delay):
        super().display_board(0)
        # if delay != 0:
        #     super().display_board(0)
        return

    def get_valid_moves(self, node):
        valid_moves = []
        for child in node[util.NKEY_CHILDREN]:
            if child[util.NKEY_TYPE] == util.ND_REWRITE:
                res = self.find_layer_pattern(child[util.NKEY_LHS])
                if len(res) > 0:
                    valid_moves += [
                        (
                            child.get(util.NKEY_DESC, None),
                            child.get(util.NKEY_BUTTON, None),
                            row,
                            col,
                            child[util.NKEY_LHS],
                            child[util.NKEY_RHS],
                        )
                        for row, col in res
                    ]
            else:
                raise RuntimeError("All children of player nodes must be rewrite")
        return valid_moves

    def execute_win_node(self, node):
        """
        Executes children in order, until any child succeeds
        :return: when a child succeeds, game ends immediately as a win, and false otherwise
        """
        children = node[util.NKEY_CHILDREN]
        player = str(node[util.NKEY_PID])
        for child in children:
            if self.execute_node(child):
                if self.agent_current == self.board:
                    # We've found the shortest path.
                    goal_key = str(self.agent_current)
                    prev_board = self.agent_came_from[goal_key]
                    path = deque([self.agent_current["main"]])
                    while prev_board != None:
                        path.appendleft(prev_board["main"])
                        prev_board = self.agent_came_from[str(prev_board)]
                    self.solution = list(path)
                    raise GameOverException(END_WIN, player)
                current_key = str(self.agent_current)
                cost = self.agent_cost[current_key] + 1
                neighbor_key = str(self.board)
                if (
                    neighbor_key not in self.agent_cost
                    or cost < self.agent_cost[neighbor_key]
                ):
                    self.agent_cost[neighbor_key] = cost
                    priority = cost + 0  # This is the goal
                    self.agent_frontier.put(
                        Frontier(priority, copy.deepcopy(self.board))
                    )
                    self.agent_unroll()
                    self.agent_previous_move[neighbor_key] = self.agent_current_move
                self.board = self.agent_current  # Set board to current
        return False

    def agent_unroll(self):
        parent_board = self.agent_current
        for intermediate_board in self.agent_current_move_intermediates:
            self.agent_came_from[str(intermediate_board)] = copy.deepcopy(parent_board)
            parent_board = intermediate_board

    def make_move(self, lpatt, row, col):
        super().make_move(lpatt, row, col)
        new_board = copy.deepcopy(self.board)
        self.agent_current_move_intermediates.append(new_board)
        return

    def execute_player_node(self, node):
        print(str(self.board))
        if self.solution == []:
            self.solution = [self.board]
        self.move_count += 1
        self.elapsed = time.time() - self.start
        if self.elapsed > 7200:
            raise Exception("Timed Out after " + str(self.move_count) + "moves")

        player_id = str(node[util.NKEY_PID])

        if player_id == self.agent_id:
            if len(self.agent_came_from) == 0:
                # This is the start position.
                self.agent_frontier.put(Frontier(0, copy.deepcopy(self.board)))
                current_key = str(self.board)
                self.agent_came_from[current_key] = None
                self.agent_previous_move[current_key] = None
                self.agent_current_move = None
                self.agent_cost[current_key] = 0
            else:
                current_key = str(self.agent_current)
                cost = self.agent_cost[current_key] + 1
                neighbor_key = str(self.board)
                if (
                    neighbor_key not in self.agent_cost
                    or cost < self.agent_cost[neighbor_key]
                ):
                    self.agent_cost[neighbor_key] = cost
                    priority = cost + self.agent_heuristic(self.board)
                    self.agent_frontier.put(
                        Frontier(priority, copy.deepcopy(self.board))
                    )
                    self.agent_unroll()
                    self.agent_previous_move[neighbor_key] = self.agent_current_move
            if len(self.agent_current_unexplored_neighbors) == 0:
                # done exploring current; move to next frontier
                self.agent_current = copy.deepcopy(self.agent_frontier.get().item)

            # Reset board to the current frontier
            self.board = copy.deepcopy(self.agent_current)

        # Get valid moves from board.
        valid_moves = self.get_valid_moves(node)
        move = None

        if player_id != self.agent_id:
            if len(valid_moves) == 0:
                return False
            move = random.choice(valid_moves)

        else:
            if len(self.agent_current_unexplored_neighbors) == 0:
                self.agent_current_unexplored_neighbors = valid_moves

            if len(self.agent_current_unexplored_neighbors) == 0:
                return False

            move = self.agent_current_unexplored_neighbors.pop()
            self.agent_current_move = move
            self.agent_current_move_intermediates = []

        desc, button, row, col, lhs, rhs = move
        self.make_move(rhs, row, col)
        return True


class AgentBlockdudeProcessor(AgentGameProcessor):
    def __init__(self, filename):
        super().__init__(filename, "1", blockdude_heuristic)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Play game YAML.")
    parser.add_argument("filename", type=str, help="Filename to process.")
    parser.add_argument(
        "--player-agent", type=str, help="Player ID to play as the solver."
    )
    parser.add_argument("--random", type=int, help="Random seed.")
    args = parser.parse_args()

    random_seed = args.random if args.random is not None else int(time.time()) % 10000
    random.seed(random_seed)

    game = AgentBlockdudeProcessor(args.filename)
    game.game_play()

    soln = game.solution
    for state in soln:
        for row in state:
            print(row)
