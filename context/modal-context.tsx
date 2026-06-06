import React, { createContext, useContext, useMemo, useState } from 'react';

type ModalType = 'transaction' | 'recurring' | 'budget' | 'savings' | null;
type TransactionInitialType = 'income' | 'expense';

interface ModalStateContextType {
    activeModal: ModalType;
    transactionInitialType: TransactionInitialType;
    refreshSignal: number;
}

interface ModalActionsContextType {
    openModal: (type: ModalType, initialType?: TransactionInitialType) => void;
    closeModal: () => void;
    triggerRefresh: () => void;
}

const ModalStateContext = createContext<ModalStateContextType | undefined>(undefined);
const ModalActionsContext = createContext<ModalActionsContextType | undefined>(undefined);

export function ModalProvider({ children }: { children: React.ReactNode }) {
    const [activeModal, setActiveModal] = useState<ModalType>(null);
    const [transactionInitialType, setTransactionInitialType] = useState<TransactionInitialType>('expense');
    const [refreshSignal, setRefreshSignal] = useState(0);

    const actions = useMemo(() => ({
        openModal: (type: ModalType, initialType?: TransactionInitialType) => {
            if (initialType) setTransactionInitialType(initialType);
            setActiveModal(type);
        },
        closeModal: () => setActiveModal(null),
        triggerRefresh: () => setRefreshSignal(s => s + 1),
    }), []);

    const state = useMemo(() => ({
        activeModal,
        transactionInitialType,
        refreshSignal,
    }), [activeModal, transactionInitialType, refreshSignal]);

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
