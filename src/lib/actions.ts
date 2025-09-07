
'use server';

import { generateMonthlyReport } from "@/ai/flows/generate-ai-monthly-report";
import type { Transaction, Category, Debt } from "@/lib/types";
import {
    getUserDataFromSheet,
    writeUserDataToSheet
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

    const result = await generateMonthlyReport({
      income,
      expenses,
      spendingByCategory,
      spendingLimit,
      transactionHistory: transactionHistoryString,
    });
    return { success: true, report: result.report };
  } catch (error) {
    console.error("Error generating AI report:", error);
    return { success: false, error: "Failed to generate AI report." };
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


export async function saveUserData(
    email: string,
    transactions: Transaction[],
    categories: Category[],
    limit: number
) {
    try {
        // Since debts are managed separately, fetch them first to avoid overwriting them
        const { debts } = await getUserDataFromSheet(email);
        await writeUserDataToSheet(email, transactions, categories, limit, debts || []);
        return { success: true };
    } catch (error) {
        console.error("Error saving user data to sheet:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        return { success: false, error: `Sync Error: ${errorMessage}` };
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

export async function settleDebtAction(email: string, debtId: string): Promise<{ success: boolean, error?: string, debts?: Debt[] }> {
    try {
        const { transactions, categories, spendingLimit, debts } = await getUserDataFromSheet(email);

        const debtToSettle = debts.find(d => d.id === debtId);
        if (!debtToSettle || debtToSettle.status === 'paid') {
            return { success: false, error: "Debt not found or already paid." };
        }

        // 1. Create a new income transaction
        const newTransaction: Transaction = {
            id: crypto.randomUUID(),
            type: 'income',
            category: 'Debt Repayment',
            amount: debtToSettle.amount,
            date: format(new Date(), "yyyy-MM-dd"),
        };
        const updatedTransactions = [...transactions, newTransaction];

        // 2. Update the debt status
        const updatedDebts = debts.map(d => 
            d.id === debtId ? { ...d, status: 'paid' as const } : d
        );

        // 3. Save everything back to the sheet
        await writeUserDataToSheet(email, updatedTransactions, categories, spendingLimit, updatedDebts);

        return { success: true, debts: updatedDebts };

    } catch (error) {
        console.error("Error settling debt:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        return { success: false, error: `Settle Debt Error: ${errorMessage}` };
    }
}

export async function addDebtAction(
    email: string, 
    debtData: Omit<Debt, 'id' | 'status'>
): Promise<{ success: boolean, error?: string, debts?: Debt[] }> {
    try {
        const { transactions, categories, spendingLimit, debts } = await getUserDataFromSheet(email);
        
        // 1. Create the new debt record
        const newDebt: Debt = {
            ...debtData,
            id: crypto.randomUUID(),
            status: 'unpaid',
            icon: 'Users', // Default icon for a debt record
        };
        const updatedDebts = [...debts, newDebt];

        // 2. Create a corresponding expense transaction
        const newExpenseTransaction: Transaction = {
            id: crypto.randomUUID(),
            type: 'expense',
            category: 'Lending', // New fixed category
            amount: debtData.amount,
            date: format(new Date(), "yyyy-MM-dd"), // Use today's date for the expense
        };
        const updatedTransactions = [...transactions, newExpenseTransaction];

        // 3. Save everything back to the sheet
        await writeUserDataToSheet(email, updatedTransactions, categories, spendingLimit, updatedDebts);

        return { success: true, debts: updatedDebts };
        
    } catch (error) {
        console.error("Error adding debt:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        return { success: false, error: `Add Debt Error: ${errorMessage}` };
    }
}
