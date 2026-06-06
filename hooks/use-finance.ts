import { useMemo, useState } from 'react';

export interface Transaction {
    id: string;
    title: string;
    amount: number;
    date: string;
    category: string;
    type: 'income' | 'expense';
}

export function useFinance() {
    const [balance, setBalance] = useState(12450.00);

    const [transactions, setTransactions] = useState<Transaction[]>([
        { id: '1', title: 'Salary', amount: 4200, date: '2026-01-13', category: 'Work', type: 'income' },
        { id: '2', title: 'Groceries', amount: -150, date: '2026-01-12', category: 'Food', type: 'expense' },
        { id: '3', title: 'Rent', amount: -2000, date: '2026-01-01', category: 'Housing', type: 'expense' },
    ]);

    const stats = useMemo(() => {
        const income = transactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);

        const expenses = transactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + Math.abs(t.amount), 0);

        return { income, expenses };
    }, [transactions]);

    return {
        balance,
        transactions,
        stats,
        addTransaction: (t: Omit<Transaction, 'id'>) => {
            const newTransaction = { ...t, id: Math.random().toString(36).substr(2, 9) };
            setTransactions(prev => [newTransaction, ...prev]);
            setBalance(prev => prev + t.amount);
        }
    };
}
