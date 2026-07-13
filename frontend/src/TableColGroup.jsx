function TableColGroup({ widths }) {
    return (
        <colgroup>
            {widths.map((width, index) => (
                <col key={index} style={{ width }} />
            ))}
        </colgroup>
    );
}

export default TableColGroup