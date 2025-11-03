import argparse, json, sys
import util

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Process game YAML.')
    parser.add_argument('filename', type=str, help='Filename to process.')
    parser.add_argument('--out', type=str, help='Filename to write to.')
    parser.add_argument('--name', type=str, help='New name for game.')
    parser.add_argument('--resolve', action='store_true', help='Resolve file nodes.')
    parser.add_argument('--xform', action='store_true', help='Apply xforms.')
    parser.add_argument('--fmt', type=str, required=True, help='Output format: gv or json.')
    args = parser.parse_args()

    game = util.yaml2bt(args.filename, args.resolve, args.xform)

    if args.name is not None:
        game.name = args.name

    if args.fmt == 'gv':
        out_str = util.game_print_gv(game)
    elif args.fmt == 'json':
        out_str = json.dumps({'name':game.name, 'tree':util.objify(game.tree)})
    else:
        raise RuntimeError(f'unrecognized format {args.fmt}')

    if args.out is None:
        sys.stdout.write(out_str)
    else:
        with open(args.out, 'wt') as f:
            f.write(out_str)
