import game

class AgentGameProcessor(game.GameProcessor):
    def __init__(self, filename, random_players):
        super().__init__(filename, True, random_players, False)

    def display_board(self):
        return       
    
    def execute_player_node(self, node):
        return super().execute_player_node(node)
    
    def get_player_choice_input(self, player_id, this_turn_info):
        return super().get_player_choice_input(player_id, this_turn_info)
