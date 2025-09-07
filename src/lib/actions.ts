'use server';

import { generateMonthlyReport } from "@/ai/flows/generate-ai-monthly-report";
import type { Transaction, Category, Debt } from "@/lib/types";
import {
    getUserDataFromSheet,
    writeUserDataToSheet
} from '@/lib/sheets';

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
        await writeUserDataToSheet(email, transactions, categories, limit);
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

export async function saveDebts(email: string, debts: Debt[]): Promise<{ success: boolean, error?: string }> {
  try {
    // We can reuse writeUserDataToSheet by fetching existing data first
    const { transactions, categories, spendingLimit } = await getUserDataFromSheet(email);
    // Note: This is not the most efficient way as it reads then writes all data,
    // but it reuses existing functions. A dedicated `writeDebtsToSheet` would be better for performance.
    await writeUserDataToSheet(email, transactions, categories, spendingLimit, debts);
    return { success: true };
  } catch (error) {
    console.error("Error saving debts to sheet:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    return { success: false, error: `Sync Error: ${errorMessage}` };
  }
}