"use strict";

const GVNEWLINE   = '<BR/>';
const GVTILEBGN   = '<FONT FACE="Courier New">';
const GVTILEEND   = '</FONT>';
const GVCOMMBGN   = '<FONT POINT-SIZE="9"><I>';
const GVCOMMEND   = '</I></FONT>';
const GVNIDBGN    = '<FONT POINT-SIZE="9"><B>';
const GVNIDEND    = '</B></FONT>';
const GVLAYERBGN  = '<FONT POINT-SIZE="9"><I>-';
const GVLAYEREND  = '-</I></FONT>';
const GVBUTTONBGN = '<FONT POINT-SIZE="9"><I>[';
const GVBUTTONEND = ']</I></FONT>';
const GVDESCBGN   = '<FONT POINT-SIZE="9">(';
const GVDESCEND   = ')</FONT>';
const GVBOOLBGN   = '<FONT POINT-SIZE="9">';
const GVBOOLEND   = '</FONT>';

const NKEY_GVID   = '__GVID';



function pattern_max_tile_width(patt) {
    let tile_len = 1;
    for (const row of patt) {
        for (const tile of row) {
            tile_len = Math.max(tile_len, graphemeLength(tile));
        }
    }
    return tile_len;
}

function pad_tiles_multiple(patts, tile_len=null) {
    if (tile_len === null) {
        tile_len = 1;
        for (const patt of patts) {
            tile_len = Math.max(tile_len, pattern_max_tile_width(patt));
        }
    }

    return patts.map(patt => patt.map(row => row.map(tile => tile + ' '.repeat(tile_len - graphemeLength(tile)))));
}

function pad_tiles_single(patt, tile_len=null) {
    return pad_tiles_multiple([patt], tile_len)[0];
}

function layer_pattern_max_tile_width(lpatt) {
    let tile_len = 0;
    for (const [layer, patt] of Object.entries(lpatt)) {
        for (const row of patt) {
            for (const tile of row) {
                tile_len = Math.max(tile_len, graphemeLength(tile));
            }
        }
    }
    return tile_len;
}

function layer_pad_tiles_multiple(lpatts, tile_len=null) {
    if (tile_len === null) {
        tile_len = 0
        for (const lpatt of lpatts) {
            tile_len = Math.max(tile_len, layer_pattern_max_tile_width(lpatt));
        }
    }

    let ret = [];
    for (const lpatt of lpatts) {
        let ret_lpatt = {};
        for (const [layer, patt] of Object.entries(lpatt)) {
            ret_lpatt[layer] = pad_tiles_single(patt, tile_len);
        }
        ret.push(ret_lpatt);
    }
    return ret;
}

function layer_pad_tiles_single(lpatt, tile_len=null) {
    return layer_pad_tiles_multiple([lpatt], tile_len)[0];
}

function pattern_to_string(patt, filt, colsep, rowsep, tile_len=null) {
    return pad_tiles_single(patt, tile_len).map(row => row.map(tile => filt(tile)).join(colsep)).join(rowsep);
}

function layer_pattern_to_string(lpatt, filt, lpre, lpost, lsep, ppre, ppost, colsep, rowsep, tile_len=null) {
    let ret = '';
    let li = 0;
    for (const [layer, patt] of Object.entries(lpatt)) {
        if (li > 0) {
            ret += lsep;
        }
        if (Object.entries(lpatt).length > 1 || layer !== DEFAULT_LAYER) {
            ret += (lpre + layer + lpost);
        }
        ret += ppre;
        ret += pattern_to_string(patt, filt, colsep, rowsep, tile_len);
        ret += ppost;
        ++ li;
    }
    return ret;
}

function gv_filter_string(s) {
    return s.replaceAll('<', '&lt;').replaceAll('>', '&gt;')
}

function gv_print_node(node_lines, edge_lines, node, depth, nid_to_node) {
    const ntype = node[NKEY_TYPE];
    let nlabel = '';
    let nstyle = 'filled';
    let nfill = '';
    let nshape = '';

    let lt = 'e0';
    let dk = 'd0';

    if ([ND_REWRITE, ND_REWRITE_ALL, ND_MATCH, ND_MATCH_TIMES, ND_SET_BOARD, ND_LAYER_TEMPLATE, ND_APPEND_ROWS, ND_APPEND_COLS, ND_DISPLAY_BOARD].includes(ntype)) {
        nshape = 'box';

        nstyle += ',rounded';

        nlabel += '<TABLE BORDER="0">';
        nlabel += '<TR><TD COLSPAN="3">';
        nlabel += ntype;
        if ([ND_MATCH_TIMES].includes(ntype)) {
            nlabel += ':' + node[NKEY_TIMES]; // todo intify
        }
        nlabel += '</TD></TR>';

        if ([ND_REWRITE, ND_REWRITE_ALL, ND_SET_BOARD, ND_LAYER_TEMPLATE, ND_APPEND_ROWS, ND_APPEND_COLS].includes(ntype)) {
            nfill = `#${dk}${lt}${dk}`;
        } else if ([ND_MATCH, ND_MATCH_TIMES].includes(ntype)) {
            nfill = `#${dk}${lt}${lt}`;
        } else if ([ND_DISPLAY_BOARD].includes(ntype)) {
            nfill = `#${dk}${dk}${dk}`;
        }

        if ([ND_DISPLAY_BOARD].includes(ntype)) {
            // pass
        } else if ([ND_REWRITE, ND_REWRITE_ALL].includes(ntype)) {
            const [lhs, rhs] = layer_pad_tiles_multiple([node[NKEY_LHS], node[NKEY_RHS]]);

            if (NKEY_DESC in node && node[NKEY_DESC] !== "") {
                nlabel += '<TR><TD COLSPAN="3">'
                nlabel += GVDESCBGN
                nlabel += node[NKEY_DESC]
                nlabel += GVDESCEND
                nlabel += '</TD></TR>'
            }

            if (NKEY_BUTTON in node && node[NKEY_BUTTON] !== "") {
                nlabel += '<TR><TD COLSPAN="3">'
                nlabel += GVBUTTONBGN
                nlabel += node[NKEY_BUTTON]
                nlabel += GVBUTTONEND
                nlabel += '</TD></TR>'
            }

            let layer_to_sides = {};

            for (const [layer, patt] of Object.entries(lhs)) {
                layer_to_sides[layer] = [patt, null];
            }
            for (const [layer, patt] of Object.entries(rhs)) {
                if (layer in layer_to_sides) {
                    layer_to_sides[layer][1] = patt;
                } else {
                    layer_to_sides[layer] = [null, patt];
                }
            }

            for (const [layer, [llhs, lrhs]] of Object.entries(layer_to_sides)) {
                if (layer === DEFAULT_LAYER && Object.entries(layer_to_sides).length === 1) {
                    // pass
                } else {
                    nlabel += '<TR>';
                    nlabel += '<TD COLSPAN="3">' + GVLAYERBGN + layer + GVLAYEREND + '</TD>';
                    nlabel += '</TR>';
                }

                nlabel += '<TR>';
                if (llhs !== null) {
                    nlabel += '<TD BORDER="1" COLOR="#888888">';
                    nlabel += GVTILEBGN;
                    nlabel += pattern_to_string(llhs, gv_filter_string, ' ', GVNEWLINE);
                    nlabel += GVTILEEND;
                    nlabel += '</TD>';
                } else {
                    nlabel += '<TD></TD>';
                }
                nlabel += '<TD>→</TD>';
                if (lrhs !== null) {
                    nlabel += '<TD BORDER="1" COLOR="#888888">';
                    nlabel += GVTILEBGN;
                    nlabel += pattern_to_string(lrhs, gv_filter_string, ' ', GVNEWLINE);
                    nlabel += GVTILEEND;
                    nlabel += '</TD>';
                } else {
                    nlabel += '<TD></TD>';
                }
                nlabel += '</TR>';
            }
        } else if ([ND_LAYER_TEMPLATE].includes(ntype)) {
            nlabel += '<TR><TD COLSPAN="3">';
            nlabel += GVLAYERBGN;
            nlabel += gv_filter_string(node[NKEY_LAYER]);
            nlabel += GVLAYEREND;
            nlabel += ' with ';
            nlabel += GVTILEBGN;
            nlabel += gv_filter_string(node[NKEY_WITH]);
            nlabel += GVTILEEND;
            nlabel += '</TD></TR>';
        } else {
            nlabel += layer_pattern_to_string(node[NKEY_PATTERN], gv_filter_string,
                                              '<TR><TD COLSPAN="3">' + GVLAYERBGN,
                                              GVLAYEREND + '</TD></TR>',
                                              '',
                                              '<TR><TD></TD><TD BORDER="1" COLOR="#888888">' + GVTILEBGN,
                                              GVTILEEND + '</TD><TD></TD></TR>',
                                              ' ', GVNEWLINE); // todo
        }

        if (NKEY_NID in node && node[NKEY_NID] !== "") {
            nlabel += '<TR><TD COLSPAN="3">';
            nlabel += GVNIDBGN;
            nlabel += '@';
            nlabel += node[NKEY_NID];
            nlabel += GVNIDEND;
            nlabel += '</TD></TR>';
        }

        if (NKEY_COMMENT in node && node[NKEY_COMMENT] !== "") {
            nlabel += '<TR><TD COLSPAN="3">';
            nlabel += GVCOMMBGN;
            nlabel += node[NKEY_COMMENT];
            nlabel += GVCOMMEND;
            nlabel += '</TD></TR>';
        }

        nlabel += '</TABLE>';

    } else {
        if ([NDX_IDENT, NDX_PRUNE, NDX_MIRROR, NDX_SKEW, NDX_ROTATE, NDX_SPIN, NDX_FLIP, NDX_SWAP_ONLY, NDX_REPLACE_ONLY].includes(ntype)) {
            nshape = 'hexagon';
            nfill = `#${lt}${dk}${lt}`
        } else if ([NDX_UNROLL_REPLACE].includes(ntype)) {
            nshape = 'egg';
            nfill = `#${lt}${lt}${dk}`
        } else if ([NDX_LINK].includes(ntype)) {
            nshape = 'invhouse';
            nfill = `#${lt}${lt}${dk}`
        } else if ([NDX_FILE].includes(ntype)) {
            nshape = 'folder';
            nfill = `#${lt}${lt}${dk}`
        } else if ([ND_PLAYER].includes(ntype)) {
            nshape = 'diamond';
            nfill = `#${dk}${dk}${lt}`
        } else if ([ND_WIN, ND_LOSE, ND_DRAW].includes(ntype)) {
            nshape = 'octagon';
            nfill = `#${lt}${dk}${dk}`
        } else if ([ND_ORDER, ND_ALL, ND_NONE, ND_RND_TRY, ND_LOOP_UNTIL_ALL, ND_LOOP_TIMES].includes(ntype)) {
            nshape = 'oval';
            nfill = `#${lt}${lt}${lt}`
        } else {
            throw new Error(`unrecognized node type ${ntype}`);
        }

        nlabel += ntype

        if ([NDX_MIRROR, NDX_SKEW, NDX_ROTATE, NDX_SPIN, NDX_FLIP, NDX_SWAP_ONLY, NDX_REPLACE_ONLY].includes(ntype)) {
            if (NKEY_REMORIG in node && node[NKEY_REMORIG]) {
                nlabel += GVNEWLINE;
                nlabel += GVBOOLBGN;
                nlabel += 'remove original';
                nlabel += GVBOOLEND;
            }
        } else if ([ND_PLAYER, ND_WIN, ND_LOSE].includes(ntype)) {
            nlabel += ':' + node[NKEY_PID]; // todo intify
        } else if ([ND_LOOP_TIMES].includes(ntype)) {
            nlabel += ':' + node[NKEY_TIMES]; // todo intify
        } else if ([NDX_UNROLL_REPLACE].includes(ntype)) {
            nlabel += GVNEWLINE;
            nlabel += gv_filter_string(node[NKEY_WHAT]);
        } else if ([NDX_FILE].includes(ntype)) {
            nlabel += ':' + node[NKEY_FILE] + '@' + node[NKEY_TARGET];
        } else if ([NDX_LINK].includes(ntype)) {
            nlabel += ':@' + node[NKEY_TARGET];
        } else if ([NDX_SWAP_ONLY].includes(ntype)) {
            nlabel += GVNEWLINE;
            nlabel += GVTILEBGN;
            nlabel += gv_filter_string(node[NKEY_WHAT]);
            nlabel += GVTILEEND;
            nlabel += ' with ';
            nlabel += GVTILEBGN;
            nlabel += gv_filter_string(node[NKEY_WITH]);
            nlabel += GVTILEEND;
        } else if ([NDX_REPLACE_ONLY].includes(ntype)) {
            nlabel += GVNEWLINE;
            nlabel += GVTILEBGN;
            nlabel += gv_filter_string(node[NKEY_WHAT]);
            nlabel += GVTILEEND;
            nlabel += ' with ';
            nlabel += GVTILEBGN;
            nlabel += node[NKEY_WITHS].map(ee => gv_filter_string(ee)).join(GVTILEEND + ', ' + GVTILEBGN);
            nlabel += GVTILEEND;
        }

        if (NKEY_NID in node && node[NKEY_NID] !== "") {
            nlabel += GVNEWLINE;
            nlabel += GVNIDBGN;
            nlabel += '@';
            nlabel += node[NKEY_NID];
            nlabel += GVNIDEND;
        }

        if (NKEY_COMMENT in node && node[NKEY_COMMENT] !== "") {
            nlabel += GVNEWLINE;
            nlabel += GVCOMMBGN;
            nlabel += gv_filter_string(node[NKEY_COMMENT]);
            nlabel += GVCOMMEND;
        }
    }

    function indent(_depth) {
        return '  '.repeat(_depth + 1);
    }

    const nid_gv = node[NKEY_GVID];

    let ind = indent(depth);

    node_lines.push(`${ind}${nid_gv} [shape="${nshape}", fillcolor="${nfill}", style="${nstyle}", label=<${nlabel}>];`)

    if (ntype === NDX_FILE) {
        node_lines.push(`${ind}subgraph cluster_${nid_gv} {`);
        depth += 1;
        ind = indent(depth);
        node_lines.push(`${ind}graph [margin="8", bgcolor="#f4f4f4"];`);
    }

    if (NKEY_CHILDREN in node) {
        for (let child of node[NKEY_CHILDREN]) {
            gv_print_node(node_lines, edge_lines, child, depth, nid_to_node);
            const child_nid_gv = child[NKEY_GVID];
            edge_lines.push(`  ${nid_gv} -> ${child_nid_gv};`);
        }
    }

    if (ntype === NDX_FILE) {
        depth -= 1;
        ind = indent(depth);
        node_lines.push(`${ind}}`);
    }

    if (ntype === NDX_LINK) {
        const nid_target = node[NKEY_TARGET];
        if (nid_target in nid_to_node) {
            const target_id = nid_to_node[nid_target][NKEY_GVID];
            edge_lines.push(`  ${nid_gv} -> ${target_id} [style="dotted", constraint="false"];`);
        } else {
            const target_id = `_TARGET_MISSING_${nid_gv}`;
            node_lines.push(`${ind}"${target_id}" [shape="house", label=<<i>MISSING</i>>, style="filled", fillcolor="#aaaaaa"];`);
            edge_lines.push(`  ${nid_gv} -> ${target_id} [style="dotted"];`);
        }
    }
}

export function gv_print_game(game) {
    let nid_to_node = {};
    let next_gvid = 1000000;

    function node_find_ids(node) {
        node[NKEY_GVID] = next_gvid;
        next_gvid += 1;

        if (NKEY_NID in node && node[NKEY_NID] !== "") {
            const nid = node[NKEY_NID];
            if (nid in nid_to_node) {
                throw new Error(`duplicate node id ${nid}`);
            }
            nid_to_node[nid] = node;
        }

        if (NKEY_CHILDREN in node) {
            for (let child of node[NKEY_CHILDREN]) {
                node_find_ids(child);
            }
        }
    }

    function node_clear_ids(node) {
        delete node[NKEY_GVID];

        if (NKEY_CHILDREN in node) {
            for (let child of node[NKEY_CHILDREN]) {
                node_clear_ids(child);
            }
        }
    }

    node_find_ids(game.tree)

    let node_lines = [];
    let edge_lines = [];
    gv_print_node(node_lines, edge_lines, game.tree, 0, nid_to_node);

    node_clear_ids(game.tree);

    let lines = [];
    lines.push('digraph G {');
    lines.push('  graph [ordering="out", margin="0"];');
    lines.push(`  _NAME [shape="component", label=<${game.name}>, style="filled", fillcolor="#cccccc"];`);
    lines = lines.concat(node_lines, edge_lines);
    lines.push('}');

    return lines.join('\n') + '\n';
}
