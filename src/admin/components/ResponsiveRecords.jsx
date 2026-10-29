import React, { useState } from 'react';

const childrenOf = node => React.Children.toArray(node?.props?.children);
const textOf = node => typeof node === 'string' || typeof node === 'number' ? String(node) : childrenOf(node).map(textOf).join(' ');

// One set of rows, controls, and event handlers at every screen width.
export default function ResponsiveRecords({ children, pageSize = 25 }) {
  const [page, setPage] = useState(0);
  const parts = childrenOf(children);
  const head = parts.find(part => part.type === 'thead');
  const labels = childrenOf(childrenOf(head)[0]).map(textOf);
  const body = parts.find(part => part.type === 'tbody');
  const rows = childrenOf(body);
  const pages = Math.max(1, Math.ceil(rows.length / pageSize));
  const safePage = Math.min(page, pages - 1);
  const mapped = parts.map(part => part !== body ? part : React.cloneElement(body, { children: rows.slice(safePage * pageSize, (safePage + 1) * pageSize).map(row => React.cloneElement(row, {
    role: 'row', children: childrenOf(row).map((cell, index) => React.cloneElement(cell, { role: 'cell', 'data-label': cell.props.colSpan ? undefined : labels[index] })),
  })) }));
  return <div className="admin-records min-w-0 max-w-full">
    <div className="min-w-0 overflow-x-auto">{React.cloneElement(children, { role: 'table', children: mapped })}</div>
    {pages > 1 && <nav aria-label="Record pagination" className="flex flex-wrap items-center justify-between gap-3 border-t p-4 text-sm">
      <button type="button" disabled={!safePage} onClick={() => setPage(safePage - 1)}>Previous</button>
      <span>Page {safePage + 1} of {pages}</span>
      <button type="button" disabled={safePage >= pages - 1} onClick={() => setPage(safePage + 1)}>Next</button>
    </nav>}
  </div>;
}
