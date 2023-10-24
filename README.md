# pyrrbt

## General Setup

To setup, you will need pipenv:

```
pip3 install pipenv
```

Then set up the environment for this project by running:
```
pipenv install
pipenv shell
```

## Game Description Visuazliation

To visualize game descriptions you will also need [GraphViz](https://graphviz.org/) installed.
Then run `make` to create visualizations in the `out` folder.


## Node Behaviors

**sequence**: Executes all children in order (regardless of their success or failure); if any child fails, returns failure, otherwise returns success.

**loop**: Repeatedly executes children in order, until any child fails; if any child succeeds, returns success, otherwise returns failure.

**none**: Executes children in order, until any child fails; if any child fails, returns failure, otherwise returns success.

**rewrite**: If there are any lhs pattern matches, randomly rewrites one of these matches with the rhs pattern.

**match**: Returns success if pattern matches current board, otherwise returns failure.

**player**: *For now, assume all child nodes are **rewrite** nodes.* If any lhs of any child matches, player can choose which rhs rewrite to apply; returns success if there were any matches, otherwise, returns failure.

**win**, **lose**: Executes children in order, until any child succeeds; if any child succeeds, the game ends with the given player winning (if a **win** node) or losing (if a **lose** node), otherwise returns success (?).
