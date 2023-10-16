import argparse
import util

parser = argparse.ArgumentParser(description='Process game YAML.')
parser.add_argument('filename', type=str, help='Filename to process.')
parser.add_argument('--xform', action='store_true', help='Apply xforms.')
args = parser.parse_args()

util.game_print_gv(util.yaml2bt(args.filename, args.xform))
