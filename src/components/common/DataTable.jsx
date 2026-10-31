import React, { useState, useMemo } from 'react';
import { Search, ChevronLeft, ChevronRight, Inbox } from './Icons';

/**
 * Responsive DataTable Component
 *
 * - Desktop (>= md): Displays a professional, full-featured data table.
 * - Mobile (< md): Automatically transforms records into clean, touch-friendly record cards.
 * - Supports custom `renderCard(row, idx)` or automatic column mapping.
 * - Includes integrated client-side search, responsive pagination, and empty states.
 */
export default function DataTable({
  columns = [],
  data = [],
  searchPlaceholder = 'Search records...',
  emptyTitle = 'No records found',
  emptySubtitle = 'Try adjusting your search query or filters.',
  onAdd = null,
  addText = '',
  pageSize = 10,
  renderCard = null
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Search filtering across all properties of each record
  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return data;
    const q = searchTerm.toLowerCase();

    return data.filter((item) => {
      if (!item) return false;
      return Object.values(item).some((val) => {
        if (val === null || val === undefined) return false;
        if (typeof val === 'object') {
          try {
            return JSON.stringify(val).toLowerCase().includes(q);
          } catch {
            return false;
          }
        }
        return String(val).toLowerCase().includes(q);
      });
    });
  }, [data, searchTerm]);

  // Pagination
  const totalPages = Math.ceil(filteredData.length / pageSize) || 1;
  const safePage = Math.min(currentPage, totalPages);
  const paginatedData = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, safePage, pageSize]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  // Identify action column and data columns for default mobile card layout
  const actionCol = useMemo(() => {
    return columns.find((c) => {
      const h = String(c.header || '').toLowerCase();
      return h === 'action' || h === 'actions';
    });
  }, [columns]);

  const dataCols = useMemo(() => {
    return columns.filter((c) => {
      const h = String(c.header || '').toLowerCase();
      return h !== 'action' && h !== 'actions';
    });
  }, [columns]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
      {/* Table Header Controls: Search & Optional Add Button */}
      <div className="p-3.5 sm:p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/60">
        <div className="relative flex-1 max-w-md w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder={searchPlaceholder}
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
        </div>

        {onAdd && addText && (
          <button
            type="button"
            onClick={onAdd}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm rounded-xl transition-colors shadow-2xs flex items-center justify-center gap-1.5 shrink-0 self-start sm:self-auto"
          >
            {addText}
          </button>
        )}
      </div>

      {/* ── DESKTOP VIEW: Full Data Table (hidden on mobile < md) ── */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50 text-slate-700 text-xs font-bold uppercase tracking-wider border-b border-slate-200">
            <tr>
              {columns.map((col, idx) => (
                <th key={idx} className={`px-5 py-3.5 whitespace-nowrap ${col.className || ''}`}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginatedData.length > 0 ? (
              paginatedData.map((row, rIdx) => (
                <tr key={row.id || rIdx} className="hover:bg-slate-50/80 transition-colors">
                  {columns.map((col, cIdx) => (
                    <td key={cIdx} className={`px-5 py-3.5 whitespace-nowrap text-slate-700 ${col.cellClassName || ''}`}>
                      {col.render ? col.render(row, rIdx) : col.accessor ? row[col.accessor] : null}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="px-6 py-12 text-center text-slate-500">
                  <div className="flex flex-col items-center justify-center">
                    <Inbox className="w-8 h-8 text-slate-300 mb-2" />
                    <p className="font-bold text-slate-700 text-sm">{emptyTitle}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{emptySubtitle}</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ── MOBILE VIEW: Record Cards (shown only on mobile < md) ── */}
      <div className="block md:hidden p-3.5 space-y-3 bg-slate-50/40">
        {paginatedData.length > 0 ? (
          paginatedData.map((row, rIdx) => {
            if (renderCard) {
              return <div key={row.id || rIdx}>{renderCard(row, rIdx)}</div>;
            }

            // Default card layout
            const primaryCol = dataCols[0];
            const secondaryCol = dataCols[1];
            const remainingCols = dataCols.slice(2);

            return (
              <div
                key={row.id || rIdx}
                className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-4 space-y-2.5 transition-all"
              >
                {/* Card Header */}
                <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2">
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      {primaryCol?.header}
                    </span>
                    <div className="text-sm font-extrabold text-slate-900 truncate">
                      {primaryCol?.render ? primaryCol.render(row, rIdx) : row[primaryCol?.accessor]}
                    </div>
                  </div>

                  {secondaryCol && (
                    <div className="text-right shrink-0">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">
                        {secondaryCol.header}
                      </span>
                      <div className="text-xs font-bold text-slate-700">
                        {secondaryCol.render ? secondaryCol.render(row, rIdx) : row[secondaryCol.accessor]}
                      </div>
                    </div>
                  )}
                </div>

                {/* Card Fields Grid */}
                {remainingCols.length > 0 && (
                  <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                    {remainingCols.map((col, cIdx) => (
                      <div key={cIdx} className="min-w-0">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block truncate">
                          {col.header}
                        </span>
                        <div className="text-xs text-slate-800 font-medium truncate mt-0.5">
                          {col.render ? col.render(row, rIdx) : row[col.accessor] ?? '—'}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Card Actions Footer */}
                {actionCol && (
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mr-auto">
                      Actions
                    </span>
                    <div className="flex items-center gap-1.5">
                      {actionCol.render(row, rIdx)}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="p-8 text-center bg-white rounded-xl border border-slate-200">
            <Inbox className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="font-bold text-slate-700 text-sm">{emptyTitle}</p>
            <p className="text-xs text-slate-400 mt-0.5">{emptySubtitle}</p>
          </div>
        )}
      </div>

      {/* Pagination Controls (shown on both Desktop & Mobile) */}
      {filteredData.length > 0 && (
        <div className="p-3 sm:p-4 border-t border-slate-100 bg-white flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div>
            Showing <span className="font-bold text-slate-800">{(safePage - 1) * pageSize + 1}</span> to{' '}
            <span className="font-bold text-slate-800">
              {Math.min(safePage * pageSize, filteredData.length)}
            </span>{' '}
            of <span className="font-bold text-slate-800">{filteredData.length}</span> records
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              aria-label="Previous records page" disabled={safePage === 1}
              onClick={() => setCurrentPage(Math.max(1, safePage - 1))}
              className="min-h-11 min-w-11 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all font-semibold flex items-center gap-1"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Previous</span>
            </button>

            <span className="px-3 py-1 font-bold text-slate-800 text-xs">
              Page {safePage} of {totalPages}
            </span>

            <button
              type="button"
              aria-label="Next records page" disabled={safePage >= totalPages}
              onClick={() => setCurrentPage(Math.min(totalPages, safePage + 1))}
              className="min-h-11 min-w-11 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all font-semibold flex items-center gap-1"
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
