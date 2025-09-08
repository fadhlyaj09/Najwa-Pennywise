
import { google } from 'googleapis';
import type { User } from '@/ai/flows/user-auth-flow';
import type { Transaction, Category, Debt } from '@/lib/types';

// IMPORTANT: These environment variables must be set for the application to work.
// When deploying to a hosting provider (e.g., Vercel, Firebase App Hosting),
// you must configure these variables in the project's settings.
const SHEET_ID = process.env.SHEET_ID;
const GOOGLE_SHEETS_CLIENT_EMAIL = process.env.GOOGLE_SHEETS_CLIENT_EMAIL;
// This line below is the fix. It replaces the literal '\\n' characters from the
// Vercel environment variable with actual newline characters '\n'.
const GOOGLE_SHEETS_PRIVATE_KEY = process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, '\n');

const USER_SHEET_NAME = 'Users';
const TRANSACTION_SHEET_NAME = 'Transactions';
const CATEGORY_SHEET_NAME = 'Categories';
const DEBT_SHEET_NAME = 'Debts';
const SETTINGS_SHEET_NAME = 'Settings';

const USER_RANGE = `${USER_SHEET_NAME}!A:B`;
const TRANSACTION_RANGE = `${TRANSACTION_SHEET_NAME}!A:H`; 
const CATEGORY_RANGE = `${CATEGORY_SHEET_NAME}!A:F`;
const DEBT_RANGE = `${DEBT_SHEET_NAME}!A:J`;
const SETTINGS_RANGE = `${SETTINGS_SHEET_NAME}!A:B`;

async function getSheetsService() {
    if (!GOOGLE_SHEETS_CLIENT_EMAIL || !GOOGLE_SHEETS_PRIVATE_KEY || !SHEET_ID) {
        throw new Error('Google Sheets API credentials are not set in environment variables.');
    }

    const auth = new google.auth.GoogleAuth({
        credentials: {
            client_email: GOOGLE_SHEETS_CLIENT_EMAIL,
            private_key: GOOGLE_SHEETS_PRIVATE_KEY,
        },
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const authClient = await auth.getClient();
    return google.sheets({ version: 'v4', auth: authClient });
}

async function getSheetData(range: string) {
    const sheets = await getSheetsService();
    try {
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SHEET_ID,
            range: range,
        });
        return response.data.values || [];
    } catch (err) {
        console.error(`The API returned an error for range ${range}: ` + err);
        if (err instanceof Error) {
            const message = (err as any).errors?.[0]?.message || err.message;
            if (message.includes("Unable to parse range")) {
                 throw new Error(`Sheet for range '${range}' not found. Please ensure it exists.`);
            }
            throw new Error(`Failed to retrieve data from ${range}: ${message}`);
        }
        throw new Error(`Failed to retrieve data from ${range} due to an unknown error.`);
    }
}

async function appendRow(range: string, row: (string | number | boolean | undefined)[]) {
    const sheets = await getSheetsService();
    await sheets.spreadsheets.values.append({
        spreadsheetId: SHEET_ID,
        range: range,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [row] },
    });
}

async function findRowIndex(sheetName: string, columnIndex: number, value: string): Promise<number> {
    const sheetData = await getSheetData(`${sheetName}!A:J`); // Assume max 10 columns for search
    const rowIndex = sheetData.findIndex(row => row[columnIndex] === value);
    return rowIndex !== -1 ? rowIndex + 1 : -1; // Sheets are 1-indexed
}

async function deleteRow(sheetName: string, rowIndex: number) {
    const sheets = await getSheetsService();
    const sheetId = await getSheetIdByName(sheetName);

    if (sheetId === null || rowIndex <= 0) {
        throw new Error(`Could not find sheet ${sheetName} or invalid row index.`);
    }

    await sheets.spreadsheets.batchUpdate({
        spreadsheetId: SHEET_ID,
        requestBody: {
            requests: [{
                deleteDimension: {
                    range: {
                        sheetId: sheetId,
                        dimension: 'ROWS',
                        startIndex: rowIndex - 1,
                        endIndex: rowIndex,
                    },
                },
            }],
        },
    });
}

async function updateRow(sheetName: string, rowIndex: number, newRowData: (string | number | boolean | undefined)[]) {
    const sheets = await getSheetsService();
    const range = `${sheetName}!A${rowIndex}`;
    await sheets.spreadsheets.values.update({
        spreadsheetId: SHEET_ID,
        range,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [newRowData] },
    });
}


let sheetIdMap: Record<string, number> | null = null;
async function getSheetIdByName(sheetName: string): Promise<number | null> {
    if (sheetIdMap) {
        return sheetIdMap[sheetName] || null;
    }

    const sheets = await getSheetsService();
    const response = await sheets.spreadsheets.get({ spreadsheetId: SHEET_ID });
    const sheetList = response.data.sheets;
    if (!sheetList) return null;

    sheetIdMap = {};
    for (const sheet of sheetList) {
        if (sheet.properties?.title && sheet.properties?.sheetId != null) {
            sheetIdMap[sheet.properties.title] = sheet.properties.sheetId;
        }
    }
    return sheetIdMap[sheetName] || null;
}

export async function findUserByEmailInSheet(email: string): Promise<User | null> {
    const rows = await getSheetData(USER_RANGE);
    for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (row[0] && row[0].toLowerCase() === email.toLowerCase()) {
             return { email: row[0], password: row[1] };
        }
    }
    return null;
}

export async function appendUserToSheet(user: User): Promise<void> {
    await appendRow(USER_RANGE, [user.email, user.password]);
}

export async function getUserDataFromSheet(email: string) {
    const [
        allTransactions, 
        allCategories, 
        allSettings, 
        allDebts
    ] = await Promise.all([
        getSheetData(TRANSACTION_RANGE),
        getSheetData(CATEGORY_RANGE),
        getSheetData(SETTINGS_RANGE),
        getSheetData(DEBT_RANGE),
    ]);

    const lowercasedEmail = email.toLowerCase();

    const userTransactions = allTransactions.slice(1) // skip header
        .filter(row => row[0]?.toLowerCase() === lowercasedEmail)
        .map(row => ({
            id: row[1],
            type: row[2],
            category: row[3],
            amount: parseFloat(row[4]),
            date: row[5],
        } as Transaction));

    const userCategories = allCategories.slice(1)
        .filter(row => row[0]?.toLowerCase() === lowercasedEmail)
        .map(row => ({
            id: row[1],
            name: row[2],
            icon: row[3],
            type: row[4],
            isFixed: row[5] === 'TRUE',
        } as Category));

    const userSettingsRow = allSettings.slice(1).find(row => row[0]?.toLowerCase() === lowercasedEmail);
    const spendingLimit = userSettingsRow ? parseFloat(userSettingsRow[1]) : 5000000;

    const userDebts = allDebts.slice(1)
        .filter(row => row[0]?.toLowerCase() === lowercasedEmail)
        .map(row => ({
            id: row[1],
            debtorName: row[2],
            amount: parseFloat(row[3]),
            description: row[4],
            dueDate: row[5],
            status: row[6],
            icon: row[7],
            lendingTransactionId: row[8],
            repaymentTransactionId: row[9],
        } as Debt));

    return {
        transactions: userTransactions,
        categories: userCategories,
        spendingLimit,
        debts: userDebts,
    };
}

export async function addTransactionToSheet(email: string, transaction: Transaction) {
    await appendRow(TRANSACTION_RANGE, [email, transaction.id, transaction.type, transaction.category, transaction.amount, transaction.date]);
}

export async function addCategoryToSheet(email: string, category: Category) {
    await appendRow(CATEGORY_RANGE, [email, category.id, category.name, category.icon, category.type, category.isFixed]);
}

export async function addDebtToSheet(email: string, debt: Debt) {
    await appendRow(DEBT_RANGE, [email, debt.id, debt.debtorName, debt.amount, debt.description, debt.dueDate, debt.status, debt.icon, debt.lendingTransactionId, debt.repaymentTransactionId]);
}

export async function deleteTransactionFromSheet(transactionId: string) {
    const rowIndex = await findRowIndex(TRANSACTION_SHEET_NAME, 1, transactionId);
    if (rowIndex > 0) {
        await deleteRow(TRANSACTION_SHEET_NAME, rowIndex);
    }
}

export async function deleteDebtFromSheet(debtId: string) {
    const rowIndex = await findRowIndex(DEBT_SHEET_NAME, 1, debtId);
    if (rowIndex > 0) {
        await deleteRow(DEBT_SHEET_NAME, rowIndex);
    }
}

export async function deleteCategoryFromSheet(categoryId: string) {
    const rowIndex = await findRowIndex(CATEGORY_SHEET_NAME, 1, categoryId);
    if (rowIndex > 0) {
        await deleteRow(CATEGORY_SHEET_NAME, rowIndex);
    }
}

export async function updateDebtInSheet(email: string, debt: Debt) {
    const rowIndex = await findRowIndex(DEBT_SHEET_NAME, 1, debt.id);
    if (rowIndex > 0) {
        await updateRow(DEBT_SHEET_NAME, rowIndex, [email, debt.id, debt.debtorName, debt.amount, debt.description, debt.dueDate, debt.status, debt.icon, debt.lendingTransactionId, debt.repaymentTransactionId]);
    }
}

export async function updateSpendingLimitInSheet(email: string, limit: number) {
    const lowercasedEmail = email.toLowerCase();
    const allSettings = await getSheetData(SETTINGS_RANGE);
    const rowIndex = allSettings.findIndex(row => row[0]?.toLowerCase() === lowercasedEmail);

    if (rowIndex > 0) { // Found existing setting
        await updateRow(SETTINGS_SHEET_NAME, rowIndex + 1, [lowercasedEmail, limit]);
    } else { // No setting found, append new row
        await appendRow(SETTINGS_RANGE, [lowercasedEmail, limit]);
    }
}
