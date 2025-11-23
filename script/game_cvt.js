const args = parse_args({
    game: { type: 'string', required: true },
    fmt: { type: 'string', required: true },
    folder: { type: 'string' },
    sprites: { type: 'string' },
    out: { type: 'string' },
    append: { type: 'boolean', default: false },
    rename: { type: 'boolean', default: false },
    resolve: { type: 'boolean', default: false },
    xform: { type: 'boolean', default: false },
});

const gamefilename = args.folder ? path.join(args.folder, args.game) : args.game;

const game = load_game(gamefilename, args.resolve, args.xform);

const parse = path.parse(args.game);
const game_name = path.join(parse.dir, parse.name);

if (args.rename) {
    game.name = game_name;
}

if (args.sprites) {
    game.sprites = load_sprites(args.sprites);
}

let out_str = null;
if (args.fmt === 'gv') {
    out_str = gv_print_game(game);
} else if (args.fmt === 'json') {
    out_str = JSON.stringify(game) + '\n';
} else if (args.fmt === 'js-entry') {
    out_str = 'GAME_SETUPS[\'' + game_name + '\'] = ' + JSON.stringify(game) + '\n';
}

if (args.out) {
    if (args.append) {
        fs.appendFileSync(args.out, out_str);
    } else {
        fs.writeFileSync(args.out, out_str);
    }
} else {
    process.stdout.write(out_str);
}
