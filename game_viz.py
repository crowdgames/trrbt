import argparse
import game
import os
import random
import sys
import threading
import time
import tkinter, tkinter.messagebox
import util



class ThreadedGameProcessor(game.GameProcessor):
    def __init__(self, filename, random_players, mtx):
        super().__init__(filename, True, random_players, None)

        self._thread_mtx = mtx

        self._thread_choices = None
        self._thread_choice = None

        self._thread_new_board = None

    def display_board(self):
        with self._thread_mtx:
            self._thread_new_board = self.board

    def get_player_choice_input(self, player_id, this_turn_info):
        with self._thread_mtx:
            self._thread_choices = (player_id, this_turn_info)
            self._thread_choice = None

            print('player choice waiting...')
            sys.stdout.flush()

        while True:
            time.sleep(0.01)
            with self._thread_mtx:
                if self._thread_choice is not None:
                    ret = self._thread_choice

                    self._thread_choices = None
                    self._thread_choice = None

                    print('player choice done.')
                    sys.stdout.flush()
                    return ret

class GameFrame(tkinter.Frame):
    def __init__(self, root, cell_size, game_proc, game_thread):
        super().__init__(root)

        self._padding = 5
        self._cell_size = cell_size

        self._rows = 0
        self._cols = 0
        self._cvs = tkinter.Canvas(self, width=self.tocvsx(self._cols) + self._padding, height=self.tocvsy(self._rows) + self._padding, bg='#dddddd')
        self._cvs.grid(column=0, row=0)

        self._mouse_choice = None

        self._text_widgets = []
        self._choice_widgets = {}

        self.pack()

        self._cvs.bind('<Motion>', self.on_mouse_motion)
        self._cvs.bind('<Leave>', self.on_mouse_leave)
        self._cvs.bind('<ButtonPress-1>', self.on_mouse_button)

        self._player_id_colors = {}

        self._game_proc = game_proc
        self._game_thread = game_thread

        self._game_thread.start()
        self.check_thread()

    def tocvsx(self, x):
        return (x * self._cell_size) + self._padding

    def tocvsy(self, y):
        return (y * self._cell_size) + self._padding

    def fromcvsx(self, x):
        return (x - self._padding) / self._cell_size

    def fromcvsy(self, y):
        return (y - self._padding) / self._cell_size

    def create_rrect(self, x0, y0, x1, y1, cn, fill, outline):
        return self._cvs.create_polygon(x0+cn, y0, x0+cn, y0,
                                        x1-cn, y0, x1-cn, y0,
                                        x1, y0,
                                        x1, y0+cn, x1, y0+cn,
                                        x1, y1-cn, x1, y1-cn,
                                        x1, y1,
                                        x1-cn, y1, x1-cn, y1,
                                        x0+cn, y1, x0+cn, y1,
                                        x0, y1,
                                        x0, y1-cn, x0, y1-cn,
                                        x0, y0+cn, x0, y0+cn,
                                        x0, y0,
                                        fill=fill, outline=outline, joinstyle=tkinter.ROUND, smooth=1, width=5)

    def on_mouse_motion(self, event):
        with self._game_proc._thread_mtx:
            mr, mc = self.fromcvsy(event.y), self.fromcvsx(event.x)

            choice = None
            best_choice = None

            if self._choices is not None:
                for idx, (lhs, rhs, row, col) in self._choices.items():
                    rows = len(lhs)
                    cols = len(lhs[0])
                    rowmid = row + rows / 2.0
                    colmid = col + cols / 2.0
                    if row <= mr and mr <= row + rows and col <= mc and mc <= col + cols:
                        dist_sqr = (mr - rowmid) ** 2 + (mc - colmid) ** 2
                        if best_choice is None or dist_sqr <= best_choice:
                            choice = idx
                            best_choice = dist_sqr

            self.update_mouse_choice(choice)

    def on_mouse_leave(self, event):
        with self._game_proc._thread_mtx:
            self.update_mouse_choice(None)

    def on_mouse_button(self, event):
        if self._mouse_choice is not None:
            choice = self._mouse_choice
            self._mouse_choice = None
            self.make_choice(choice)

    def update_mouse_choice(self, new_choice):
        if self._mouse_choice != new_choice:
            self._mouse_choice = new_choice

            for choice_idx, choice_widgets in self._choice_widgets.items():
                for choice_widget in choice_widgets:
                    if choice_idx == self._mouse_choice:
                        self._cvs.itemconfigure(choice_widget, state='normal')
                    else:
                        self._cvs.itemconfigure(choice_widget, state='hidden')

    def update_board(self, new_board):
        new_rows = len(new_board)
        new_cols = 0 if new_rows == 0 else len(new_board[0])
        if new_rows != self._rows or new_cols != self._cols:
            self._rows = new_rows
            self._cols = new_cols
            self._cvs.config(width=self.tocvsx(self._cols) + self._padding, height=self.tocvsy(self._rows) + self._padding)

        for text_widget in self._text_widgets:
            self._cvs.delete(text_widget)
        self._text_widgets = []

        for rr in range(new_rows):
            for cc in range(new_cols):
                text = new_board[rr][cc].strip()
                font = ('Courier', str(int(0.9 * self._cell_size / len(text))))
                self._text_widgets.append(self._cvs.create_text(self.tocvsx(cc + 0.5), self.tocvsy(rr + 0.5),
                                                                text=text, fill='#000000', font=font, anchor=tkinter.CENTER))

    def update_choices(self, player_id, choices):
        self._choices = choices

        if player_id not in self._player_id_colors:
            color_num = len(self._player_id_colors) % 5
            if color_num == 0:
                color1, color2 = '#0000ff', '#0000cc'
            elif color_num == 1:
                color1, color2 = '#00ff00', '#00cc00'
            elif color_num == 2:
                color1, color2 = '#ffff00', '#cccc00'
            elif color_num == 3:
                color1, color2 = '#ff00ff', '#cc00cc'
            else:
                color1, color2 = '#00ffff', '#00cccc'
            self._player_id_colors[player_id] = color1, color2
        color1, color2 = self._player_id_colors[player_id]

        self._choice_widgets[None] = []

        for idx, (lhs, rhs, row, col) in self._choices.items():
            rows = len(lhs)
            cols = len(lhs[0])
            self._choice_widgets[idx] = []

            for rr in range(rows):
                for cc in range(cols):
                    text = rhs[rr][cc].strip()
                    if text == '.':
                        continue
                    font = ('Courier', str(int(0.9 * self._cell_size / len(text))))
                    #self._choice_widgets[idx].append(self._cvs.create_rectangle(self.tocvsx(col + cc), self.tocvsy(row + rr),
                    #                                                            self.tocvsx(col + cc + 1), self.tocvsy(row + rr + 1),
                    #                                                            fill='#eeeeee', outline=''))
                    self._choice_widgets[idx].append(self.create_rrect(self.tocvsx(col), self.tocvsy(row),
                                                                       self.tocvsx(col + cols), self.tocvsy(row + rows),
                                                                       self._cell_size / 4,
                                                                       '#eeeeee', ''))
                    self._choice_widgets[idx].append(self._cvs.create_text(self.tocvsx(col + cc + 0.5), self.tocvsy(row + rr + 0.5),
                                                                           text=text, fill='#777777', font=font, anchor=tkinter.CENTER))

            self._choice_widgets[idx].append(self.create_rrect(self.tocvsx(col), self.tocvsy(row),
                                                               self.tocvsx(col + cols), self.tocvsy(row + rows),
                                                               self._cell_size / 4,
                                                               '', color1))
            for choice_widget in self._choice_widgets[idx]:
                self._cvs.itemconfigure(choice_widget, state='hidden')

            self._choice_widgets[None].append(self.create_rrect(self.tocvsx(col), self.tocvsy(row),
                                                                self.tocvsx(col + cols), self.tocvsy(row + rows),
                                                                self._cell_size / 4,
                                                                '', color2))

    def make_choice(self, choice):
        print('making choice', choice)
        sys.stdout.flush()

        with self._game_proc._thread_mtx:
            for choice_widgets in self._choice_widgets.values():
                for choice_widget in choice_widgets:
                    self._cvs.delete(choice_widget)
            self._choice_widgets = {}

            self._choices = None
            game_proc._thread_choice = choice

    def check_thread(self):
        #if not self._game_thread.is_alive():
        #    self.winfo_toplevel().destroy()
        #    return

        with self._game_proc._thread_mtx:
            if self._game_proc._thread_new_board is not None:
                self.update_board(game_proc._thread_new_board)
                game_proc._thread_new_board = None

            if game_proc._thread_choices is not None:
                self.update_choices(game_proc._thread_choices[0], game_proc._thread_choices[1])
                game_proc._thread_choices = None

        self.after(1, self.check_thread)

def run_game(game_proc):
    game_proc.game_play()
    sys.stdout.flush()

def run_game_input_viz(game_proc, game_thread):
    root = tkinter.Tk()
    root.title('game')

    GameFrame(root, 100, game_proc, game_thread)

    root.mainloop()

def run_game_input_text(game_proc, game_thread):
    game_thread.start()

    while game_thread.is_alive():
        time.sleep(0.01)
        with game_proc._thread_mtx:
            if game_proc._thread_new_board is not None:
                print(util.pattern_to_string(game_proc._thread_new_board, ' ', '\n', game_proc.max_tile_width))
                game_proc._thread_new_board = None
                sys.stdout.flush()

            if game_proc._thread_choices is not None and game_proc._thread_choice is None:
                game_proc._thread_choice = random.choice(list(game_proc._thread_choices.keys()))
                print('thread choosing', game_proc._thread_choices[game_proc._thread_choice])
                sys.stdout.flush()



if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Play game YAML.')
    parser.add_argument('filename', type=str, help='Filename to process.')
    parser.add_argument('--player-random', type=str, nargs='+', help='Player IDs to play randomly.', default=[])
    parser.add_argument('--random', type=int, help='Random seed.')
    args = parser.parse_args()

    random_seed = args.random if args.random is not None else int(time.time()) % 10000
    print(f'Using random seed {random_seed}')
    random.seed(random_seed)

    mtx = threading.Lock()
    game_proc = ThreadedGameProcessor(args.filename, args.player_random, mtx)
    game_thread = threading.Thread(target=run_game, args=(game_proc,), daemon=True)

    run_game_input_viz(game_proc, game_thread)
