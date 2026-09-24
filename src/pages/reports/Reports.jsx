import React, { useState } from 'react';
import { FileText, Download, Printer, Filter, Calendar } from 'lucide-react';
import { useFarm } from '../../context/FarmContext';

export default function Reports() {
  const { farm, flocks, eggs, sales, expenses, mortality, currentPlan, canExportPdf } = useFarm();
  const [selectedReport, setSelectedReport] = useState('Flock');
  const [dateFilter, setDateFilter] = useState('This Month');
  const [pdfWarning, setPdfWarning] = useState('');

  const reportTypes = [
    'Flock Report',
    'Egg Production Report',
    'Feed Consumption Report',
    'Mortality Report',
    'Sales Report',
    'Expense Report',
    'Profit & Loss Summary'
  ];

  const handleExportCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Report,Date,Value\n";
    csvContent += `${selectedReport},${new Date().toISOString().split('T')[0]},Exported Successfully\n`;

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${selectedReport.toLowerCase().replace(/ /g, '_')}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = () => {
    if (!canExportPdf()) {
      setPdfWarning(`PDF Export is available on Basic (₦5,000/mo) and Pro (₦15,000/mo) plans. You are currently on the ${currentPlan.name} plan.`);
      return;
    }
    setPdfWarning('');
    window.print();
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs no-print">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
              <FileText className="w-6 h-6 text-emerald-600" />
              Farm Analytics & Reports
            </h1>
            <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold rounded-full">
              {currentPlan.badge}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500">Generate, print, and export audit-ready reports for farm operations.</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors flex items-center gap-1.5"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
          <button
            onClick={handleExportPDF}
            className={`px-3.5 py-2 font-semibold text-xs rounded-xl transition-colors flex items-center gap-1.5 ${
              canExportPdf()
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                : 'bg-slate-200 text-slate-500 hover:bg-slate-300'
            }`}
          >
            <FileText className="w-4 h-4" />
            PDF Export {canExportPdf() ? '' : '(Basic/Pro)'}
          </button>
          <button
            onClick={handlePrint}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs rounded-xl transition-colors flex items-center gap-1.5"
          >
            <Printer className="w-4 h-4" />
            Print
          </button>
        </div>
      </div>

      {pdfWarning && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs flex items-center justify-between no-print">
          <div>
            <strong className="font-extrabold text-amber-950 block">🔒 PDF Export Gated</strong>
            {pdfWarning}
          </div>
          <a
            href="/settings"
            className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-xs transition-colors shrink-0"
          >
            Upgrade Plan →
          </a>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4 no-print">
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
          {reportTypes.map((r) => (
            <button
              key={r}
              onClick={() => setSelectedReport(r.replace(' Report', ''))}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                selectedReport === r.replace(' Report', '')
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {r}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Calendar className="w-4 h-4 text-slate-400" />
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
          >
            <option value="Today">Today</option>
            <option value="This Week">This Week</option>
            <option value="This Month">This Month</option>
            <option value="Last Month">Last Month</option>
          </select>
        </div>
      </div>

      {/* Printable Report Document Card */}
      <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
        <div className="border-b border-slate-200 pb-6 flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">{farm.name || 'Green Valley Poultry Farm'}</h2>
            <p className="text-xs text-slate-500">{farm.location || 'Ilorin, Kwara State, Nigeria'}</p>
            <p className="text-xs font-semibold text-emerald-600 mt-1 uppercase tracking-wider">{selectedReport} Report ({dateFilter})</p>
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-400">Generated On</span>
            <p className="text-xs font-bold text-slate-800">{new Date().toLocaleDateString()}</p>
          </div>
        </div>

        {/* Dynamic Report Content */}
        {selectedReport === 'Flock' && (
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 font-bold uppercase border-b border-slate-200">
              <tr>
                <th className="p-3">Flock Name</th>
                <th className="p-3">Type</th>
                <th className="p-3">Breed</th>
                <th className="p-3">Initial</th>
                <th className="p-3">Current Live</th>
                <th className="p-3">Pen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {flocks.map((f) => (
                <tr key={f.id}>
                  <td className="p-3 font-bold text-slate-800">{f.name}</td>
                  <td className="p-3">{f.type}</td>
                  <td className="p-3">{f.breed}</td>
                  <td className="p-3">{f.initialBirds}</td>
                  <td className="p-3 font-bold text-emerald-700">{f.currentBirds}</td>
                  <td className="p-3">{f.pen}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {selectedReport === 'Egg Production' && (
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 font-bold uppercase border-b border-slate-200">
              <tr>
                <th className="p-3">Date</th>
                <th className="p-3">Flock</th>
                <th className="p-3">Total Eggs</th>
                <th className="p-3">Good Eggs</th>
                <th className="p-3">Crates</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {eggs.map((e) => (
                <tr key={e.id}>
                  <td className="p-3">{e.date}</td>
                  <td className="p-3 font-bold text-slate-800">{e.flockName}</td>
                  <td className="p-3">{e.totalEggs}</td>
                  <td className="p-3 font-bold text-emerald-700">{e.goodEggs}</td>
                  <td className="p-3 font-bold text-blue-700">{e.crates} Crates</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {(selectedReport !== 'Flock' && selectedReport !== 'Egg Production') && (
          <div className="p-8 text-center text-slate-500 text-sm">
            Summary data compiled for {selectedReport} Report ({dateFilter}). Ready for export or printing.
          </div>
        )}
      </div>
    </div>
  );
}
