import React, { useState } from 'react';
import { CreditCard, DollarSign, Download, Search, CheckCircle2 } from 'lucide-react';

const mockTransactions = [
  { id: 'TXN-9081', user: 'Kasun Perera', amount: 'LKR 4,500', course: 'Korean Syntax Masterclass', method: 'Bank Transfer / Slip', date: 'Nov 12, 2023', status: 'Completed' },
  { id: 'TXN-9080', user: 'Aruni Madushani', amount: 'LKR 8,500', course: 'EPS-TOPIK Comprehensive', method: 'Online Card', date: 'Nov 11, 2023', status: 'Completed' },
  { id: 'TXN-9079', user: 'Dilani Samarasinghe', amount: 'LKR 6,000', course: 'Business Korean Essentials', method: 'Online Card', date: 'Nov 09, 2023', status: 'Completed' },
  { id: 'TXN-9078', user: 'Nuwan Pradeep', amount: 'LKR 3,500', course: 'Conversational Korean', method: 'Bank Transfer', date: 'Nov 06, 2023', status: 'Completed' }
];

const PaymentDetails = () => {
  const [transactions] = useState(mockTransactions);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Payment & Revenue Details</h2>
          <p className="text-xs sm:text-sm text-gray-500">Monitor course purchases, bank slips, and subscriber history.</p>
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition-colors cursor-pointer">
          <Download size={16} />
          <span>Export CSV</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <h3 className="font-bold text-sm text-gray-900">Recent Transactions</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm text-gray-600">
            <thead className="bg-gray-50 text-[11px] uppercase tracking-wider text-gray-500 font-semibold">
              <tr>
                <th className="px-6 py-3.5">Txn ID</th>
                <th className="px-6 py-3.5">Student</th>
                <th className="px-6 py-3.5">Course Program</th>
                <th className="px-6 py-3.5">Amount</th>
                <th className="px-6 py-3.5">Payment Method</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {transactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-gray-50/50">
                  <td className="px-6 py-4 font-mono font-medium text-gray-800">{tx.id}</td>
                  <td className="px-6 py-4 font-semibold text-gray-900">{tx.user}</td>
                  <td className="px-6 py-4 text-gray-700">{tx.course}</td>
                  <td className="px-6 py-4 font-bold text-gray-900">{tx.amount}</td>
                  <td className="px-6 py-4 text-gray-500">{tx.method}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full text-xs font-semibold">
                      <CheckCircle2 size={13} /> {tx.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-400">{tx.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PaymentDetails;
