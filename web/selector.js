window.addEventListener('load', SEL_onLoad, false);

var GAME_SETUPS = {}
var LOCAL_GAME_SETUPS = JSON.parse(localStorage.getItem("LOCAL_GAME_SETUPS")) || {};

function SEL_onLoad() {
    let div = document.getElementById('selectordiv');

    if (typeof onSelectGame !== 'undefined' && div) {
        appendText(div, 'Select Game ', true, true);

        if (false) {
        } else {
            const select = document.createElement('select');
            select.type = 'select';
            select.id = 'game-selector';
            select.onchange = function () {
                const gameOp = select.options[select.selectedIndex];
                const game = gameOp.value
                telemetry("select-" + game);
                select.selectedIndex = 0;
                window.location.hash = encodeURIComponent(game);
                if (gameOp.classList.contains('local')) {
                    onSelectGame(LOCAL_GAME_SETUPS[game], false)
                } else {
                    onSelectGame(GAME_SETUPS[game], true);
                }
            };
            div.appendChild(select);

            setOptions(select);
        }
    }
}

function setOptions(select) {
    select.options.length = 0;

    SEL_addOption('--', '');
    SEL_addOption('NEW', 'NEW');

    for (const game of Object.getOwnPropertyNames(LOCAL_GAME_SETUPS).sort()) {
        SEL_addOption(game + " (local)", game, ['local']);
    }
    for (const game of Object.getOwnPropertyNames(GAME_SETUPS).sort()) {
        if (game != "NEW") {
            SEL_addOption(game, game);
        }
    }
}

function SEL_addOption(innerHTML, value, classList = []) {
    select = document.getElementById('game-selector');
    var option = document.createElement('option');
    option.innerHTML = innerHTML;
    option.value = value;
    if (classList.length > 0) {
        option.classList.add(classList);
    }
    select.add(option);
}

function SEL_update() {
    let select = document.getElementById('game-selector');
    setOptions(select);
}

function SEL_upsert(game) {
    LOCAL_GAME_SETUPS[game['name']] = game;
    SEL_update();
    localStorage.setItem("LOCAL_GAME_SETUPS", JSON.stringify(LOCAL_GAME_SETUPS));
}

function SEL_removeLocal(game) {
    delete LOCAL_GAME_SETUPS[game];
    localStorage.setItem("LOCAL_GAME_SETUPS", JSON.stringify(LOCAL_GAME_SETUPS))
    SEL_update();
}

function SEL_startingGame() {
    const game = decodeURIComponent(window.location.hash.substring(1));
    if (game !== '' && GAME_SETUPS.hasOwnProperty(game)) {
        return GAME_SETUPS[game];
    }
    return GAME_SETUPS['NEW'] || emptyGame();
}

function SEL_getGameTree(game) {
    if (GAME_SETUPS.hasOwnProperty(game)) {
        return GAME_SETUPS[game].tree;
    }
    return null;
}
