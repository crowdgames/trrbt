import game
import util
import random

class AgentGameProcessor(game.GameProcessor):
    def __init__(self, filename, agent):
        super().__init__(filename, True, [], False)
        self.agent = agent

    def display_board(self):
        return       
    
    def execute_player_node(self, node):
        valid_moves = []
        player_id = str(node[util.NKEY_PID])

        for child in node[util.NKEY_CHILDREN]:
            if child[util.NKEY_TYPE] == util.ND_REWRITE:
                res = self.find_layer_pattern(child[util.NKEY_LHS])
                if len(res) > 0:
                    valid_moves += [(child.get(util.NKEY_DESC, None), child.get(util.NKEY_BUTTON, None), row, col, child[util.NKEY_LHS], child[util.NKEY_RHS]) for row, col in res]
            else:
                raise RuntimeError('All children of player nodes must be rewrite')

        if len(valid_moves) == 0:
            print(f"Player {player_id} doesn't have a valid move!")

            return False

        this_turn_choices = {}
        this_turn_info = {}

        for ii, choice in enumerate(valid_moves):
            desc, button, row, col, lhs, rhs = choice

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
            this_turn_info[idx] = (desc, button, lhs, rhs, row, col)

        if player_id in self.random_players:
            user_input = random.choice(list(this_turn_choices.keys()))

        else:
            user_input = self.get_player_choice_input(player_id, this_turn_info)

        desc, button, row, col, lhs, rhs = this_turn_choices[user_input]
        self.make_move(rhs, row, col)
        return True

