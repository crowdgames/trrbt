echo "=== games/trees ==="
for game in `find games/trees -type f | sort`; do
    echo "--- ${game} ---"
    cat ${game}
done

echo "=== viz/gv ==="
for game in `find viz/gv -type f | sort`; do
    echo "--- ${game} ---"
    cat ${game}
done
