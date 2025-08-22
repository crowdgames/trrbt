# Game Behaviour Trees Using Tile Rewrite Rules

## Web Interface

To start the web interface, run the following:
```
bash web/make_games.sh
open web/public/index.html
```

Click the Download Introductory Materials button for a brief tutorial video and editor guide.

By default, only games included in the study are in the dropdown. 

Additional game files are in games and web/games_web.
You can add more games by adding the game name to the TEMPLATES list in web/public/selector.js. Games from games_web can also be imported from JSON.

## CLI

To setup, you will need pipenv:

```
pip3 install pipenv
```

Then set up the environment for this project by running:
```
pipenv install
pipenv shell
```


### Game Description Visualization

To visualize game descriptions you will also need [GraphViz](https://graphviz.org/) installed.
Then run `make` to create visualizations in the `out` folder.


### Playing Games

To play a game, run `python game.py games/NAME.yaml`.


## Node Behaviors

**order**: Executes children in order (regardless of their success or failure); if any child succeeds, returns success, otherwise returns failure.

**all**: Executes children in order, until any child fails; if any child fails, returns failure, otherwise returns success.

**none**: Executes children in order, until any child succeeds; if any child succeeds, returns failure, otherwise returns success.

**random-try**: Executes children in random order until one succeeds; if any child succeeds, returns success, otherwise returns failure.

**loop-until-all**: Repeatedly executes children in order, until all children fail on one loop; if any child succeeds, returns success, otherwise returns failure.

**loop-times**: Repeatedly executes children in order a fixed number of times; if any child succeeds, returns success, otherwise returns failure.

**rewrite**: If there are any lhs pattern matches, randomly rewrites one of these matches with the rhs pattern.

**match**: Returns success if pattern matches current board, otherwise returns failure.

**player**: *For now, assume all child nodes are **rewrite** nodes.* If any lhs of any child matches, player can choose which rhs rewrite to apply; returns success if there were any matches, otherwise, returns failure.

**win**, **lose**, **draw**: Executes children in order, until any child succeeds; if any child succeeds, the game ends with the given player winning (if a **win** node) or losing (if a **lose** node), or as a draw (if a **draw** node); otherwise returns failure.
