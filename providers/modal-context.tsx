import type { BudgetWithSpend } from '@/features/budgets/hooks/use-budgets';
import React, { createContext, useContext, useMemo, useState } from 'react';

export type ModalType = 'transaction' | 'budget' | 'savings' | 'export' | null;
type TransactionInitialType = 'income' | 'expense';

export interface OpenModalOptions {
    /** 'transaction' only — which side of the Expense/Income toggle to start on. */
    transactionType?: TransactionInitialType;
    /** 'budget' only — open the budget sheet in edit mode for this budget. */
    budget?: BudgetWithSpend | null;
}

interface ModalStateContextType {
    activeModal: ModalType;
    transactionInitialType: TransactionInitialType;
    editingBudget: BudgetWithSpend | null;
    refreshSignal: number;
}

interface ModalActionsContextType {
    openModal: (type: ModalType, options?: OpenModalOptions) => void;
    closeModal: () => void;
    triggerRefresh: () => void;
}

const ModalStateContext = createContext<ModalStateContextType | undefined>(undefined);
const ModalActionsContext = createContext<ModalActionsContextType | undefined>(undefined);

export function ModalProvider({ children }: { children: React.ReactNode }) {
    const [activeModal, setActiveModal] = useState<ModalType>(null);
    const [transactionInitialType, setTransactionInitialType] = useState<TransactionInitialType>('expense');
    const [editingBudget, setEditingBudget] = useState<BudgetWithSpend | null>(null);
    const [refreshSignal, setRefreshSignal] = useState(0);

    const actions = useMemo(() => ({
        openModal: (type: ModalType, options?: OpenModalOptions) => {
            // Reset to the defaults so a previous 'income' or edit target doesn't leak.
            if (type === 'transaction') setTransactionInitialType(options?.transactionType ?? 'expense');
            if (type === 'budget') setEditingBudget(options?.budget ?? null);
            setActiveModal(type);
        },
        closeModal: () => {
            setActiveModal(null);
            setEditingBudget(null);
        },
        triggerRefresh: () => setRefreshSignal(s => s + 1),
    }), []);

    const state = useMemo(() => ({
        activeModal,
        transactionInitialType,
        editingBudget,
        refreshSignal,
    }), [activeModal, transactionInitialType, editingBudget, refreshSignal]);

    return (
        <ModalActionsContext.Provider value={actions}>
            <ModalStateContext.Provider value={state}>
                {children}
            </ModalStateContext.Provider>
        </ModalActionsContext.Provider>
    );
}

export function useModals() {
    const state = useContext(ModalStateContext);
    const actions = useContext(ModalActionsContext);
    if (state === undefined || actions === undefined) {
        throw new Error('useModals must be used within a ModalProvider');
    }
    return { ...state, ...actions };
}

export function useModalActions() {
    const actions = useContext(ModalActionsContext);
    if (actions === undefined) {
        throw new Error('useModalActions must be used within a ModalProvider');
    }
    return actions;
}
