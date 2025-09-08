
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
        spendingByCategory: JSON.stringify(spendingByCategory),
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

export async function addDebtAction(
    email: string, 
    debtData: Omit<Debt, 'id' | 'status' | 'lendingTransactionId' | 'repaymentTransactionId'>
): Promise<{ success: boolean; error?: string; newDebt?: Debt, newTransaction?: Transaction }> {
    try {
        const lendingTransactionId = crypto.randomUUID();
        const newDebtId = crypto.randomUUID();

        const newExpenseTransaction: Transaction = {
            id: lendingTransactionId,
            type: 'expense',
            category: 'Lending',
            amount: debtData.amount,
            date: format(new Date(), "yyyy-MM-dd"),
        };

        const newDebt: Debt = {
            ...debtData,
            id: newDebtId,
            status: 'unpaid',
            lendingTransactionId: lendingTransactionId,
        };

        await addTransactionToSheet(email, newExpenseTransaction);
        await addDebtToSheet(email, newDebt);

        return { success: true, newDebt, newTransaction: newExpenseTransaction };
    } catch (error) {
        console.error("Error adding debt:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        return { success: false, error: `Add Debt Error: ${errorMessage}` };
    }
}

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

export async function deleteTransactionAction(
    userEmail: string,
    transactionToDelete: Transaction,
    allDebts: Debt[]
): Promise<{ success: boolean, error?: string, deletedDebtId?: string, updatedDebt?: Debt }> {
    try {
        const relatedLendingDebt = allDebts.find(d => d.lendingTransactionId === transactionToDelete.id);
        if (relatedLendingDebt) {
            await deleteDebtFromSheet(relatedLendingDebt.id);
            await deleteTransactionFromSheet(transactionToDelete.id);
            return { success: true, deletedDebtId: relatedLendingDebt.id };
        }

        const relatedRepaymentDebt = allDebts.find(d => d.repaymentTransactionId === transactionToDelete.id);
        if (relatedRepaymentDebt) {
            const updatedDebt: Debt = {
                ...relatedRepaymentDebt,
                status: 'unpaid',
                repaymentTransactionId: undefined,
            };
            await updateDebtInSheet(userEmail, updatedDebt);
            await deleteTransactionFromSheet(transactionToDelete.id);
            return { success: true, updatedDebt };
        }
        
        await deleteTransactionFromSheet(transactionToDelete.id);
        return { success: true };
    } catch (error) {
        console.error("Error deleting transaction:", error);
        return { success: false, error: "Failed to delete transaction and related records." };
    }
}

export async function deleteDebtAction(debtToDelete: Debt): Promise<{ success: boolean, error?: string }> {
    try {
        if (debtToDelete.lendingTransactionId) {
            await deleteTransactionFromSheet(debtToDelete.lendingTransactionId);
        }
        
        if (debtToDelete.status === 'paid' && debtToDelete.repaymentTransactionId) {
            await deleteTransactionFromSheet(debtToDelete.repaymentTransactionId);
        }

        await deleteDebtFromSheet(debtToDelete.id);
        return { success: true };
    } catch (error) {
        console.error("Error deleting debt:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        return { success: false, error: `Delete Debt Error: ${errorMessage}` };
    }
}
