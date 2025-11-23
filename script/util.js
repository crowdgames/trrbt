import fs from 'fs';
import path from 'node:path';
import readline from 'node:readline/promises';
import util from 'node:util';
import zlib from 'node:zlib';

function patternToString(pattern, tilesize, lsep, rsep) {
    let patternText = "";
    if (pattern === null) {
        patternText = "<null>";
    } else {
        const layers = Object.getOwnPropertyNames(pattern);
        let layerFirst = true;
        for (const layer of layers) {
            if (!layerFirst) {
                patternText += lsep;
            }
            layerFirst = false;

            if (layers.length === 1 && layers[0] === 'main') {
                // pass
            } else {
                patternText += '[' + layer + ']' + lsep;
            }

            let rowFirst = true;
            for (const row of pattern[layer]) {
                if (!rowFirst) {
                    patternText += rsep;
                }
                rowFirst = false;

                patternText += joinRow(row, tilesize, false);
            }
        }
    }
    return patternText;
}

function parse_args(options) {
    const args = util.parseArgs({ options:options }).values;
    for (const [name, opts] of Object.entries(options)) {
        if (typeof opts.required !== 'undefined' && typeof args[name] === 'undefined') {
            throw new Error('Arguments missing --' + name);
        }
    }
    return args;
}

function file_to_game_in_folder(folder) {
    function file_to_game(filename) {
        filename = path.join(folder, filename + '.json');
	if (!fs.existsSync(filename)) {
	    return null;
	} else {
            return JSON.parse(fs.readFileSync(filename, 'utf8')).tree;
	}
    }
    return file_to_game;
}

function load_game(gamefilename, resolve, xform) {
    let game = JSON.parse(fs.readFileSync(gamefilename, 'utf8'));

    const resolve_fn = resolve ? file_to_game_in_folder(path.dirname(gamefilename)) : null;
    game.tree = xform_apply_to_tree(game.tree, resolve_fn, xform, false);

    return game;
}

function image_pam_data(pamfile) {
    let magic = null;
    let width = null;
    let height = null;
    let maxval = null;
    let tupltype = null;
    let data = null;

    let fileBuffer = fs.readFileSync(pamfile);
    while (true) {
	const newline = fileBuffer.indexOf('\n');
	if (newline < 0) {
	    break;
	}
	const line = fileBuffer.subarray(0, newline).toString('ascii');
	fileBuffer = fileBuffer.subarray(newline + 1);
	if (magic === null) {
	    magic = line;
	} else if (line.startsWith('WIDTH ')) {
	    width = parseInt(line.substring(6));
	} else if (line.startsWith('HEIGHT ')) {
	    height = parseInt(line.substring(7));
	} else if (line.startsWith('MAXVAL ')) {
	    maxval = parseInt(line.substring(7));
	} else if (line.startsWith('TUPLTYPE ')) {
	    tupltype = line.substring(9);
	} else if (line === 'ENDHDR') {
	    data = zlib.deflateSync(fileBuffer).toString('base64');
	    break;
	}
    }

    if (magic !== 'P7' || width === null || height === null || maxval !== 255 || tupltype !== 'RGB_ALPHA' || data === null) {
	throw new Error('Bad PAM image format: ' + pamfile);
    }

    return {size:[width,height], data:data};
}

function load_sprites(spritefilename) {
    const sprite_info = JSON.parse(fs.readFileSync(spritefilename, 'utf8'));

    let sprite_data = {};

    let sprite_images = {};
    let sprite_tiles = {};
    for (const [tile, imagefilename] of Object.entries(sprite_info.sprites)) {
        if (imagefilename === '.') {
            sprite_tiles[tile] = null;
	} else {
            if (!(imagefilename in sprite_images)) {
                sprite_images[imagefilename] = image_pam_data(path.join(path.dirname(spritefilename), imagefilename + '.pam'));
	    }
            sprite_tiles[tile] = imagefilename;
	}
    }

    sprite_data['images'] = sprite_images
    sprite_data['tiles'] = sprite_tiles

    if (sprite_info.back) {
        sprite_data.back = sprite_info.back;
    }

    if (sprite_info.players) {
        sprite_data.players = sprite_info.players;
    }

    return sprite_data;
}

function setup_engine(game, undo_enabled, board_init, random_seed) {
    let engine = new TRRBTEngine(game, undo_enabled);
    engine.onLoad();

    const max_tile_width = getMaxTileSize(game.tree);

    if (board_init !== null) {
        engine.setBoard(board_init);
    }

    if (random_seed !== null) {
        engine.setRandomSeed(random_seed);
    }

    return [engine, max_tile_width];
}

async function sleep(seconds) {
    await new Promise((resolve) => {
        setTimeout(resolve, seconds * 1000.0);
    });
}

async function question(prompt) {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const answer = await rl.question(prompt + '\n');
    rl.close()
    return answer;
}
