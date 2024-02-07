import argparse
import game
import os
import PIL.Image, PIL.ImageDraw, PIL.ImageTk
import random
import sys
import threading
import time
import tkinter, tkinter.messagebox
import util
import yaml


CELL_SIZE_DEF   = 100


class ThreadedGameProcessor(game.GameProcessor):
    def __init__(self, filename, random_players, clear_screen, mtx):
        super().__init__(filename, True, random_players, clear_screen)

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

        while True:
            time.sleep(0.01)
            with self._thread_mtx:
                if self._thread_choice is not None:
                    ret = self._thread_choice

                    self._thread_choices = None
                    self._thread_choice = None

                    return ret

class GameFrame(tkinter.Frame):
    def __init__(self, root, cell_size, sprites, game_proc, game_thread):
        super().__init__(root)

        self._padding = 5
        self._cell_size = cell_size

        self._rows = 0
        self._cols = 0
        self._cvs = tkinter.Canvas(self, width=self.tocvsx(self._cols) + self._padding, height=self.tocvsy(self._rows) + self._padding, bg='#dddddd')
        self._cvs.grid(column=0, row=0)

        self._player_id_colors = {}

        self._sprites = {}
        self._back_board = None
        if sprites is not None:
            sprite_info = util.yamlload(sprites)
            for k, v in sprite_info['sprites'].items():
                img = PIL.Image.open(os.path.join(os.path.dirname(sprites), v + '.png')).resize((self._cell_size, self._cell_size), PIL.Image.Resampling.NEAREST)
                imgx = img.convert('RGBA')
                datax = imgx.getdata()
                newdatax = []
                for item in datax:
                    newdatax.append((item[0], item[1], item[2], item[3] // 2))
                imgx.putdata(newdatax)
                self._sprites[k] = (PIL.ImageTk.PhotoImage(img), PIL.ImageTk.PhotoImage(imgx), img, imgx)
            if 'back' in sprite_info:
                self._back_board = util.string_to_pattern(sprite_info['back'])
            if 'players' in sprite_info:
                for k, v in sprite_info['players'].items():
                    self._player_id_colors[k] = tuple(['#' + clr.strip() for clr in v.split(';')])

        self._choices_by_idx = None
        self._choices_by_rect = None
        self._mouse_choice = None
        self._game_over = None

        self._fg_cids = {}
        self._bg_cids = {}
        self._choice_cids = {}

        self.pack()

        self._cvs.bind('<Motion>', self.on_mouse_motion)
        self._cvs.bind('<Leave>', self.on_mouse_leave)
        self._cvs.bind('<ButtonPress-1>', self.on_mouse_button)
        self._cvs.bind('<ButtonPress-2>', self.on_mouse_button_alt_down)
        self._cvs.bind('<ButtonRelease-2>', self.on_mouse_button_alt_up)

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

            if self._choices_by_rect is not None:
                for (row, col, rows, cols), choices in self._choices_by_rect.items():
                    if row <= mr and mr <= row + rows and col <= mc and mc <= col + cols:
                        rowmid = row + rows / 2.0
                        colmid = col + cols / 2.0
                        dist_sqr = (mr - rowmid) ** 2 + (mc - colmid) ** 2
                        if choice is None or dist_sqr < best_choice:
                            idx, desc, lhs, rhs = choices[max(0, min(len(choices) - 1, int(len(choices) * ((mc - col) / cols))))]
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

    def on_mouse_button_alt_down(self, event):
        for choice_idx, choice_cids in self._choice_cids.items():
            for choice_cid, is_alt in choice_cids:
                if choice_idx == self._mouse_choice and not is_alt:
                    self._cvs.itemconfigure(choice_cid, state='hidden')

    def on_mouse_button_alt_up(self, event):
        for choice_idx, choice_cids in self._choice_cids.items():
            for choice_cid, is_alt in choice_cids:
                if choice_idx == self._mouse_choice and not is_alt:
                    self._cvs.itemconfigure(choice_cid, state='normal')

    def update_mouse_choice(self, new_choice):
        if self._mouse_choice != new_choice:
            self._mouse_choice = new_choice

            for choice_idx, choice_cids in self._choice_cids.items():
                for choice_cid, is_alt in choice_cids:
                    if choice_idx == self._mouse_choice:
                        self._cvs.itemconfigure(choice_cid, state='normal')
                    else:
                        self._cvs.itemconfigure(choice_cid, state='hidden')

    def update_board(self, new_board):
        new_rows = len(new_board)
        new_cols = 0 if new_rows == 0 else len(new_board[0])

        if new_rows != self._rows or new_cols != self._cols:
            for rr in range(self._rows):
                for cc in range(self._cols):
                    if rr >= new_rows or cc >= new_cols:
                        key = (rr, cc)
                        if key in self._fg_cids:
                            self._cvs.delete(self._fg_cids[key][1])
                            del self._fg_cids[key]
                        if key in self._bg_ids:
                            self._cvs.delete(self._bg_cids[key])
                            del self._bg_cids[key]

            self._rows = new_rows
            self._cols = new_cols
            self._cvs.config(width=self.tocvsx(self._cols) + self._padding, height=self.tocvsy(self._rows) + self._padding)

            for rr in range(self._rows):
                for cc in range(self._cols):
                    text = new_board[rr][cc]
                    if text != '.':
                        key = (rr, cc)
                        if self._back_board and key not in self._bg_cids:
                            back_rows = len(self._back_board)
                            back_cols = len(self._back_board[0])
                            back_text = self._back_board[rr % back_rows][cc % back_cols]
                            cid = self._cvs.create_image(self.tocvsx(cc), self.tocvsy(rr), anchor=tkinter.NW, image=self._sprites[back_text][0])
                            self._cvs.tag_lower(cid)
                            self._bg_cids[key] = cid

        for rr in range(self._rows):
            for cc in range(self._cols):
                text = new_board[rr][cc].strip()
                if text != '.':
                    key = (rr, cc)
                    if key not in self._fg_cids or text != self._fg_cids[key][0]:
                        if key in self._fg_cids:
                            self._cvs.delete(self._fg_cids[key][1])
                        font = ('Courier', str(int(0.9 * self._cell_size / len(text))))

                        if text in self._sprites:
                            cid = self._cvs.create_image(self.tocvsx(cc), self.tocvsy(rr), anchor=tkinter.NW, image=self._sprites[text][0])
                        else:
                            cid = self._cvs.create_text(self.tocvsx(cc + 0.5), self.tocvsy(rr + 0.5),
                                                        text=text, fill='#000000', font=font, anchor=tkinter.CENTER)
                        self._fg_cids[key] = (text, cid)

    def update_choices(self, player_id, choices):
        self._choices_by_idx = {}
        self._choices_by_rect = {}
        for idx, (desc, lhs, rhs, row, col) in choices.items():
            rows = len(lhs)
            cols = len(lhs[0])

            self._choices_by_idx[idx] = (desc, lhs, rhs, row, col)

            rect = (row, col, rows, cols)
            if rect not in self._choices_by_rect:
                self._choices_by_rect[rect] = []

            self._choices_by_rect[rect].append((idx, desc, lhs, rhs))

        corner = self._cell_size / 4
        corner_box = corner * 1.5

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

        self._choice_cids[None] = []

        for (row, col, rows, cols), choices in self._choices_by_rect.items():
            for ii, (idx, desc, lhs, rhs) in enumerate(choices):
                self._choice_cids[idx] = []

                for rr in range(rows):
                    for cc in range(cols):
                        text = rhs[rr][cc].strip()
                        if text == '.':
                            continue
                        font = ('Courier', str(int(0.9 * self._cell_size / len(text))))

                        if self._back_board:
                            back_rows = len(self._back_board)
                            back_cols = len(self._back_board[0])
                            back_text = self._back_board[(row + rr) % back_rows][(col + cc) % back_cols]
                            cid = self._cvs.create_image(self.tocvsx(col + cc), self.tocvsy(row + rr), anchor=tkinter.NW, image=self._sprites[back_text][0])
                        else:
                            cid = self._cvs.create_rectangle(self.tocvsx(col + cc), self.tocvsy(row + rr),
                                                             self.tocvsx(col + cc + 1), self.tocvsy(row + rr + 1),
                                                             fill='#dddddd', outline='')
                        self._choice_cids[idx].append((cid, False))

                        if text in self._sprites:
                            cid = self._cvs.create_image(self.tocvsx(col + cc), self.tocvsy(row + rr), anchor=tkinter.NW, image=self._sprites[text][1])
                        else:
                            cid = self._cvs.create_text(self.tocvsx(col + cc + 0.5), self.tocvsy(row + rr + 0.5),
                                                        text=text, fill='#999999', font=font, anchor=tkinter.CENTER)
                        self._choice_cids[idx].append((cid, False))
                self._choice_cids[idx].append((self.create_rrect(self.tocvsx(col), self.tocvsy(row),
                                                                 self.tocvsx(col + cols), self.tocvsy(row + rows),
                                                                 corner,
                                                                 '', color1),
                                               True))
                if len(choices) > 1:
                    self._choice_cids[idx].append((self.create_rrect(self.tocvsx(col), self.tocvsy(row),
                                                                     self.tocvsx(col) + corner_box, self.tocvsy(row) + corner_box,
                                                                     corner,
                                                                     color1, ''),
                                                   True))
                    text = ii + 1
                    font = ('Courier', str(int(corner)))
                    self._choice_cids[idx].append((self._cvs.create_text(self.tocvsx(col) + corner_box / 2, self.tocvsy(row) + corner_box / 2,
                                                                         text=text, fill='#dddddd', font=font, anchor=tkinter.CENTER),
                                                   True))

                text = desc
                font = ('Courier', str(int(corner)))
                self._choice_cids[idx].append((self._cvs.create_text(self.tocvsx(col + 0.5 * cols), self.tocvsy(row + rows) - corner_box / 2,
                                                                     text=text, fill='#444444', font=font, anchor=tkinter.CENTER),
                                               True))

            self._choice_cids[None].append((self.create_rrect(self.tocvsx(col), self.tocvsy(row),
                                                              self.tocvsx(col + cols), self.tocvsy(row + rows),
                                                              corner,
                                                              '', color2),
                                            False))
            self._choice_cids[None].append((self.create_rrect(self.tocvsx(col), self.tocvsy(row),
                                                              self.tocvsx(col + cols), self.tocvsy(row + rows),
                                                              corner,
                                                              '', color2),
                                            False))
            if len(choices) > 1:
                self._choice_cids[None].append((self.create_rrect(self.tocvsx(col), self.tocvsy(row),
                                                                  self.tocvsx(col) + corner_box, self.tocvsy(row) + corner_box,
                                                                  corner,
                                                                  color2, ''),
                                                False))
                text = len(choices)
                font = ('Courier', str(int(corner)))
                self._choice_cids[None].append((self._cvs.create_text(self.tocvsx(col) + corner_box / 2, self.tocvsy(row) + corner_box / 2,
                                                                      text=text, fill='#dddddd', font=font, anchor=tkinter.CENTER),
                                                False))

        for idx in self._choice_cids:
            if idx is not None:
                for choice_cid, is_alt in self._choice_cids[idx]:
                    self._cvs.itemconfigure(choice_cid, state='hidden')

    def make_choice(self, choice):
        with self._game_proc._thread_mtx:
            for choice_cids in self._choice_cids.values():
                for choice_cid, is_alt in choice_cids:
                    self._cvs.delete(choice_cid)
            self._choice_cids = {}

            desc, lhs, rhs, row, col = self._choices_by_idx[choice]

            tmp_board = util.listify(game_proc.board)
            for rr in range(len(rhs)):
                for cc in range(len(rhs[rr])):
                    text = rhs[rr][cc].strip()
                    if text != '.':
                        tmp_board[row + rr][col + cc] = text
            self.update_board(tmp_board)

            self._choices_by_idx = None
            self._choices_by_rect = None
            game_proc._thread_choice = choice

    def check_thread(self):
        if not self._game_thread.is_alive():
            if self._game_over is None:
                self._game_over = 10
            elif self._game_over > 0:
                self._game_over -= 1
            elif self._game_over == 0:
                self._game_over -= 1

                go = self._game_proc.game_over
                msg = None

                if go is None:
                    msg = 'Error in game over.'
                elif go.result == game.END_WIN:
                    msg = f'Game over, player {go.player} wins!'
                elif go.result == game.END_LOSE:
                    msg = f'Game over, player {go.player} loses!'
                elif go.result == game.END_DRAW:
                    msg = f'Game over, draw!'
                elif go.result == game.END_STALE:
                    msg = f'Game over, stalemate!'
                else:
                    msg = 'Error in game over.'
                tkinter.messagebox.showinfo(message=msg)

                #self.winfo_toplevel().destroy()
                #return

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

def run_game_input_viz(game_proc, game_thread, cell_size, sprites):
    root = tkinter.Tk()
    root.title('game')

    GameFrame(root, cell_size, sprites, game_proc, game_thread)

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
    parser.add_argument('--cls', type=float, nargs='?', const=game.DEFAULT_DISPLAY_DELAY, default=None, help='Clear screen before moves, optionally providing move delay.')
    parser.add_argument('--cell-size', type=int, help='Size of cells.', default=CELL_SIZE_DEF)
    parser.add_argument('--sprites', type=str, help='Sprite file.')
    args = parser.parse_args()

    random_seed = args.random if args.random is not None else int(time.time()) % 10000
    print(f'Using random seed {random_seed}')
    random.seed(random_seed)

    mtx = threading.Lock()
    game_proc = ThreadedGameProcessor(args.filename, args.player_random, args.cls, mtx)
    game_thread = threading.Thread(target=run_game, args=(game_proc,), daemon=True)

    run_game_input_viz(game_proc, game_thread, args.cell_size, args.sprites)
