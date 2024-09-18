window.addEventListener('load', SEL_onLoad, false);

var GAME_SETUPS = {}
var LOCAL_GAME_SETUPS = {}

function SEL_onLoad() {
    let div = document.getElementById('selectordiv');

    if (typeof onSelectGame !== 'undefined' && div) {
        appendText(div, 'Select Game', true, true);
        appendBr(div, true);

        if (false) {
        } else {
            const select = document.createElement('select');
            select.type = 'select';
            select.id = 'game-selector';
            select.onchange = function () {
                const gameOp = select.options[select.selectedIndex];
                const game = gameOp.value
                select.selectedIndex = 0;
                window.location.hash = game;
                if (gameOp.classList.contains('local')) {
                    onSelectGame(LOCAL_GAME_SETUPS[game])
                } else {
                    onSelectGame(GAME_SETUPS[game]);
                }
            };
            div.appendChild(select);

            var option = document.createElement('option');
            option.value = '';
            option.innerHTML = '--';
            select.add(option);

            for (const game of Object.getOwnPropertyNames(GAME_SETUPS)) {
                var option = document.createElement('option');
                option.value = game;
                option.innerHTML = game;
                select.add(option);
            }
        }
    }
}

function SEL_addLocal(game) {
    select = document.getElementById('game-selector');
    var option = document.createElement('option');
    option.value = game.name;
    option.innerHTML = game.name + ' (local)';
    option.classList.add('local')
    select.add(option);
}

function SEL_startingGame() {
    const hash = window.location.hash.substring(1);
    if (hash !== '' && GAME_SETUPS.hasOwnProperty(hash)) {
        return GAME_SETUPS[hash];
    }
    return emptyGame();
}

function SEL_getGameTree(game) {
    if (GAME_SETUPS.hasOwnProperty(game)) {
        return GAME_SETUPS[game].tree;
    }
    return null;
}
