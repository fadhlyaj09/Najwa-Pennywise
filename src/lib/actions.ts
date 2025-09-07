
'use server';

import { generateMonthlyReport } from "@/ai/flows/generate-ai-monthly-report";
import type { Transaction, Category, Debt } from "@/lib/types";
import {
    getUserDataFromSheet,
    addTransactionToSheet,
    addCategoryToSheet,
    addDebtToSheet,
    deleteTransactionFromSheet,
    deleteCategoryFromSheet,
    deleteDebtFromSheet,
    updateDebtInSheet,
    updateSpendingLimitInSheet
} from '@/lib/sheets';
import { format } from "date-fns";

export async function generateMonthlyReportAction(
  income: number,
  expenses: number,
  spendingByCategory: Record<string, number>,
  spendingLimit: number,
  transactions: Transaction[]
) {
  try {
    const transactionHistoryString = transactions
      .map(t => {
        const amount = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(t.amount);
        return `${t.date}: ${t.type === 'income' ? '+' : '-'}${amount} (${t.category})`;
      })
      .join('\n');

    const promptInput = {
        income,
        expenses,
        spendingByCategory,
        spendingLimit,
        transactionHistory: transactionHistoryString,
    };

    const reportResult = await generateMonthlyReport(promptInput);

    return { success: true, report: reportResult.report };
  } catch (error) {
    console.error("Error generating AI report:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    return { success: false, error: `Failed to generate AI report. ${errorMessage}` };
  }
}

export async function getUserData(email: string) {
    try {
        const data = await getUserDataFromSheet(email);
        return { success: true, data };
    } catch (error) {
        console.error("Error fetching user data from sheet:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        return { success: false, error: `Could not load data from the cloud. ${errorMessage}` };
    }
}

<<<<<<< HEAD

export async function saveUserData(
    email: string,
    transactions: Transaction[],
    categories: Category[],
    limit: number,
    debts: Debt[]
) {
    try {
        await writeUserDataToSheet(email, transactions, categories, limit, debts);
=======
export async function addTransactionAction(email: string, transactionData: Omit<Transaction, 'id'>) {
    try {
        const newTransaction: Transaction = {
            ...transactionData,
            id: crypto.randomUUID(),
        };
        await addTransactionToSheet(email, newTransaction);
        return { success: true, transaction: newTransaction };
    } catch (error) {
        console.error("Error adding transaction:", error);
        return { success: false, error: "Failed to add transaction." };
    }
}

export async function addCategoryAction(email: string, categoryData: Omit<Category, 'id' | 'isFixed' | 'icon'>) {
    try {
        const newCategory: Category = {
            ...categoryData,
            id: crypto.randomUUID(),
            isFixed: false,
            icon: 'Tag',
        };
        await addCategoryToSheet(email, newCategory);
        return { success: true, category: newCategory };
    } catch (error) {
        console.error("Error adding category:", error);
        return { success: false, error: "Failed to add category." };
    }
}

export async function deleteCategoryAction(categoryId: string) {
    try {
        await deleteCategoryFromSheet(categoryId);
>>>>>>> 5aec298 (Try fixing this error: `Console Error: Encountered two children with the)
        return { success: true };
    } catch (error) {
        console.error("Error deleting category:", error);
        return { success: false, error: "Failed to delete category." };
    }
}

export async function setSpendingLimitAction(email: string, limit: number) {
    try {
        await updateSpendingLimitInSheet(email, limit);
        return { success: true };
    } catch (error) {
        console.error("Error setting spending limit:", error);
        return { success: false, error: "Failed to set spending limit." };
    }
}

export async function getDebts(email: string): Promise<{ success: boolean, data?: Debt[], error?: string }> {
  try {
    const { debts } = await getUserDataFromSheet(email);
    return { success: true, data: debts };
  } catch (error) {
    console.error("Error fetching debts from sheet:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    return { success: false, error: `Could not load debts from the cloud. ${errorMessage}` };
  }
}

<<<<<<< HEAD
export async function settleDebtAction(email: string, debtId: string): Promise<{ success: boolean, error?: string, debts?: Debt[], transactions?: Transaction[] }> {
=======
export async function addDebtAction(
    email: string, 
    debtData: Omit<Debt, 'id' | 'status' | 'lendingTransactionId' | 'repaymentTransactionId'>
): Promise<{ success: boolean; error?: string; newDebt?: Debt, newTransaction?: Transaction }> {
>>>>>>> 5aec298 (Try fixing this error: `Console Error: Encountered two children with the)
    try {
        const lendingTransactionId = crypto.randomUUID();
        const newDebtId = crypto.randomUUID();

<<<<<<< HEAD
        const debtToSettle = debts.find(d => d.id === debtId);
        if (!debtToSettle || debtToSettle.status === 'paid') {
            return { success: false, error: "Debt not found or already paid." };
        }
        
        const repaymentTransactionId = crypto.randomUUID();

        // 1. Create a new income transaction
        const newTransaction: Transaction = {
            id: repaymentTransactionId,
            type: 'income',
            category: 'Debt Repayment',
            amount: debtToSettle.amount,
=======
        const newExpenseTransaction: Transaction = {
            id: lendingTransactionId,
            type: 'expense',
            category: 'Lending',
            amount: debtData.amount,
>>>>>>> 5aec298 (Try fixing this error: `Console Error: Encountered two children with the)
            date: format(new Date(), "yyyy-MM-dd"),
        };

<<<<<<< HEAD
        // 2. Update the debt status and link transaction
        const updatedDebts = debts.map(d => 
            d.id === debtId ? { ...d, status: 'paid' as const, repaymentTransactionId: repaymentTransactionId } : d
        );
=======
        const newDebt: Debt = {
            ...debtData,
            id: newDebtId,
            status: 'unpaid',
            lendingTransactionId: lendingTransactionId,
        };
>>>>>>> 5aec298 (Try fixing this error: `Console Error: Encountered two children with the)

        await addTransactionToSheet(email, newExpenseTransaction);
        await addDebtToSheet(email, newDebt);

<<<<<<< HEAD
        return { success: true, debts: updatedDebts, transactions: updatedTransactions };
=======
        return { success: true, newDebt, newTransaction: newExpenseTransaction };
    } catch (error) {
        console.error("Error adding debt:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        return { success: false, error: `Add Debt Error: ${errorMessage}` };
    }
}
>>>>>>> 5aec298 (Try fixing this error: `Console Error: Encountered two children with the)

export async function settleDebtAction(
    email: string, 
    debt: Debt
): Promise<{ success: boolean; error?: string; updatedDebt?: Debt, newTransaction?: Transaction }> {
    try {
        if (debt.status === 'paid') {
            return { success: false, error: "Debt already paid." };
        }

        const repaymentTransactionId = crypto.randomUUID();
        const newIncomeTransaction: Transaction = {
            id: repaymentTransactionId,
            type: 'income',
            category: 'Debt Repayment',
            amount: debt.amount,
            date: format(new Date(), "yyyy-MM-dd"),
        };

        const updatedDebt: Debt = {
            ...debt,
            status: 'paid',
            repaymentTransactionId: repaymentTransactionId,
        };

        await addTransactionToSheet(email, newIncomeTransaction);
        await updateDebtInSheet(email, updatedDebt);

        return { success: true, updatedDebt, newTransaction: newIncomeTransaction };
    } catch (error) {
        console.error("Error settling debt:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        return { success: false, error: `Settle Debt Error: ${errorMessage}` };
    }
}

<<<<<<< HEAD
export async function addDebtAction(
    email: string, 
    debtData: Omit<Debt, 'id' | 'status' | 'lendingTransactionId' | 'repaymentTransactionId'>
): Promise<{ success: boolean, error?: string, debts?: Debt[], transactions?: Transaction[] }> {
    try {
        const { transactions, categories, spendingLimit, debts } = await getUserDataFromSheet(email);
        
        const lendingTransactionId = crypto.randomUUID();
        const debtId = crypto.randomUUID();

        // 1. Create the new debt record
        const newDebt: Debt = {
            ...debtData,
            id: debtId,
            status: 'unpaid',
            lendingTransactionId: lendingTransactionId,
        };
        const updatedDebts = [...debts, newDebt];

        // 2. Create a corresponding expense transaction
        const newExpenseTransaction: Transaction = {
            id: lendingTransactionId,
            type: 'expense',
            category: 'Lending',
            amount: debtData.amount,
            date: format(new Date(), "yyyy-MM-dd"),
        };
        const updatedTransactions = [...transactions, newExpenseTransaction];
=======
export async function deleteTransactionAction(
    userEmail: string,
    transactionToDelete: Transaction,
    allDebts: Debt[]
): Promise<{ success: boolean, error?: string, deletedDebtId?: string, updatedDebt?: Debt }> {
    try {
        // Find if the transaction is linked to any debt before deleting it.
        const relatedLendingDebt = allDebts.find(d => d.lendingTransactionId === transactionToDelete.id);
        if (relatedLendingDebt) {
            // This is a "Lending" transaction. Delete the debt record along with it.
            await deleteDebtFromSheet(relatedLendingDebt.id);
            await deleteTransactionFromSheet(transactionToDelete.id);
            return { success: true, deletedDebtId: relatedLendingDebt.id };
        }
>>>>>>> 5aec298 (Try fixing this error: `Console Error: Encountered two children with the)

        const relatedRepaymentDebt = allDebts.find(d => d.repaymentTransactionId === transactionToDelete.id);
        if (relatedRepaymentDebt) {
            // This is a "Debt Repayment" transaction. Revert the debt status to "unpaid".
            const updatedDebt: Debt = {
                ...relatedRepaymentDebt,
                status: 'unpaid',
                repaymentTransactionId: undefined,
            };
            await updateDebtInSheet(userEmail, updatedDebt);
            await deleteTransactionFromSheet(transactionToDelete.id);
            return { success: true, updatedDebt };
        }

<<<<<<< HEAD
<<<<<<< HEAD
        return { success: true, debts: updatedDebts, transactions: updatedTransactions };
        
=======
=======
        // If it's a regular transaction, just delete it.
        await deleteTransactionFromSheet(transactionToDelete.id);
>>>>>>> dc8a151 (error saat hapus Debt Repayment)
        return { success: true };
>>>>>>> 5aec298 (Try fixing this error: `Console Error: Encountered two children with the)
    } catch (error) {
        console.error("Error deleting transaction:", error);
        return { success: false, error: "Failed to delete transaction and related records." };
    }
}

<<<<<<< HEAD

<<<<<<< HEAD
export async function deleteTransactionAction(email: string, transactionId: string): Promise<{ success: boolean, error?: string, transactions?: Transaction[], debts?: Debt[] }> {
    try {
        const { transactions, categories, spendingLimit, debts } = await getUserDataFromSheet(email);

        const transactionToDelete = transactions.find(t => t.id === transactionId);
        if (!transactionToDelete) {
            return { success: false, error: "Transaction not found." };
        }

        let updatedDebts = [...debts];
        
        // Check if this transaction is linked to any debt
        const linkedDebtAsLending = debts.find(d => d.lendingTransactionId === transactionId);
        const linkedDebtAsRepayment = debts.find(d => d.repaymentTransactionId === transactionId);

        if (linkedDebtAsLending) {
            // If the lending transaction is deleted, the whole debt record should be deleted
            updatedDebts = debts.filter(d => d.id !== linkedDebtAsLending.id);
        } else if (linkedDebtAsRepayment) {
            // If the repayment transaction is deleted, revert the debt status to 'unpaid'
            updatedDebts = debts.map(d => 
                d.id === linkedDebtAsRepayment.id 
                ? { ...d, status: 'unpaid' as const, repaymentTransactionId: undefined } 
                : d
            );
        }

        const updatedTransactions = transactions.filter(t => t.id !== transactionId);

        await writeUserDataToSheet(email, updatedTransactions, categories, spendingLimit, updatedDebts);
        
        return { success: true, transactions: updatedTransactions, debts: updatedDebts };
        
    } catch (error) {
        console.error("Error deleting transaction:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        return { success: false, error: `Delete Transaction Error: ${errorMessage}` };
    }
}

    
=======
=======
>>>>>>> dc8a151 (error saat hapus Debt Repayment)
export async function deleteDebtAction(debtToDelete: Debt): Promise<{ success: boolean, error?: string }> {
    try {
        // First, delete the associated "Lending" transaction from the sheet.
        if (debtToDelete.lendingTransactionId) {
            await deleteTransactionFromSheet(debtToDelete.lendingTransactionId);
        }
        // Then, delete the debt record itself.
        await deleteDebtFromSheet(debtToDelete.id);
        return { success: true };
    } catch (error) {
        console.error("Error deleting debt:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        return { success: false, error: `Delete Debt Error: ${errorMessage}` };
    }
}
