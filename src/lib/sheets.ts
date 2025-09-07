import { google } from 'googleapis';
import type { User } from '@/ai/flows/user-auth-flow';
import type { Transaction, Category, Debt } from '@/lib/types';

const SHEET_ID = process.env.SHEET_ID;
const GOOGLE_SHEETS_CLIENT_EMAIL = process.env.GOOGLE_SHEETS_CLIENT_EMAIL;
const GOOGLE_SHEETS_PRIVATE_KEY = process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, '\n');

const USER_SHEET_NAME = 'Users';
const TRANSACTION_SHEET_NAME = 'Transactions';
const CATEGORY_SHEET_NAME = 'Categories';
const DEBT_SHEET_NAME = 'Debts';
const SETTINGS_SHEET_NAME = 'Settings';

const USER_RANGE = `${USER_SHEET_NAME}!A:B`;
const TRANSACTION_RANGE = `${TRANSACTION_SHEET_NAME}!A:F`;
const CATEGORY_RANGE = `${CATEGORY_SHEET_NAME}!A:E`;
const DEBT_RANGE = `${DEBT_SHEET_NAME}!A:F`;
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
            throw new Error(`Failed to retrieve data from ${range}: ${err.message}`);
        }
        throw new Error(`Failed to retrieve data from ${range} due to an unknown error.`);
    }
}

export async function findUserByEmailInSheet(email: string): Promise<User | null> {
    const rows = await getSheetData(USER_RANGE);
    // Skip header row by starting search from index 1
    for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (row[0] && row[0].toLowerCase() === email.toLowerCase()) {
             return { email: row[0], password: row[1] };
        }
    }
    return null;
}

export async function appendUserToSheet(user: User): Promise<void> {
    const sheets = await getSheetsService();
    try {
        await sheets.spreadsheets.values.append({
            spreadsheetId: SHEET_ID,
            range: USER_RANGE,
            valueInputOption: 'USER_ENTERED',
            requestBody: {
                values: [[user.email, user.password]],
            },
        });
    } catch (err) {
        console.error('The API returned an error: ' + err);
        if (err instanceof Error) {
            throw new Error(`Failed to append data to Google Sheet: ${err.message}`);
        }
        throw new Error('Failed to append data to Google Sheet due to an unknown error.');
    }
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

    const userTransactions = allTransactions.slice(1) // skip header
        .filter(row => row[0]?.toLowerCase() === email.toLowerCase())
        .map(row => ({
            id: row[1],
            type: row[2],
            category: row[3],
            amount: parseFloat(row[4]),
            date: row[5],
        } as Transaction));

    const userCategories = allCategories.slice(1)
        .filter(row => row[0]?.toLowerCase() === email.toLowerCase())
        .map(row => ({
            id: row[1],
            name: row[2],
            icon: row[3],
            type: row[4],
        } as Category));

    const userSettingsRow = allSettings.slice(1).find(row => row[0]?.toLowerCase() === email.toLowerCase());
    const spendingLimit = userSettingsRow ? parseFloat(userSettingsRow[1]) : 5000000;

    const userDebts = allDebts.slice(1)
        .filter(row => row[0]?.toLowerCase() === email.toLowerCase())
        .map(row => ({
            id: row[1],
            debtorName: row[2],
            amount: parseFloat(row[3]),
            description: row[4],
            dueDate: row[5],
            status: row[6],
        } as Debt));

    return {
        transactions: userTransactions,
        categories: userCategories,
        spendingLimit,
        debts: userDebts,
    };
}


export async function writeUserDataToSheet(email: string, transactions: Transaction[], categories: Category[], limit: number, debts: Debt[]) {
    const sheets = await getSheetsService();
    const lowercasedEmail = email.toLowerCase();

    // Fetch all existing data first
    const [allTransactions, allCategories, allSettings, allDebts] = await Promise.all([
        getSheetData(TRANSACTION_RANGE),
        getSheetData(CATEGORY_RANGE),
        getSheetData(SETTINGS_RANGE),
        getSheetData(DEBT_RANGE),
    ]);

    // Filter out data for the current user to replace it with the new data
    const otherUsersTransactions = allTransactions.slice(1).filter(row => row[0]?.toLowerCase() !== lowercasedEmail);
    const otherUsersCategories = allCategories.slice(1).filter(row => row[0]?.toLowerCase() !== lowercasedEmail);
    const otherUsersSettings = allSettings.slice(1).filter(row => row[0]?.toLowerCase() !== lowercasedEmail);
    const otherUsersDebts = allDebts.slice(1).filter(row => row[0]?.toLowerCase() !== lowercasedEmail);

    // Prepare new data for the current user
    const newTransactionRows = transactions.map(t => [lowercasedEmail, t.id, t.type, t.category, t.amount, t.date]);
    const newCategoryRows = categories.map(c => [lowercasedEmail, c.id, c.name, c.icon, c.type, c.isFixed]);
    const newSettingsRow = [lowercasedEmail, limit];
    const newDebtRows = debts.map(d => [lowercasedEmail, d.id, d.debtorName, d.amount, d.description, d.dueDate, d.status]);


    // Combine other users' data with the new data for the current user
    const finalTransactions = [allTransactions[0], ...otherUsersTransactions, ...newTransactionRows];
    const finalCategories = [allCategories[0], ...otherUsersCategories, ...newCategoryRows];
    const finalSettings = [allSettings[0], ...otherUsersSettings, newSettingsRow];
    const finalDebts = [allDebts[0], ...otherUsersDebts, ...newDebtRows];

    // Clear and write data back to sheets
    try {
        await sheets.spreadsheets.values.batchUpdate({
            spreadsheetId: SHEET_ID,
            requestBody: {
                valueInputOption: 'USER_ENTERED',
                data: [
                    { range: TRANSACTION_RANGE, values: finalTransactions },
                    { range: CATEGORY_RANGE, values: finalCategories },
                    { range: SETTINGS_RANGE, values: finalSettings },
                    { range: DEBT_RANGE, values: finalDebts }
                ]
            }
        });
        
        // This part clears any old rows that might be left if the new data is shorter than the old data
        await sheets.spreadsheets.values.batchClear({
             spreadsheetId: SHEET_ID,
             requestBody: {
                 ranges: [
                    `${TRANSACTION_SHEET_NAME}!A${finalTransactions.length + 1}:F`,
                    `${CATEGORY_SHEET_NAME}!A${finalCategories.length + 1}:F`,
                    `${SETTINGS_SHEET_NAME}!A${finalSettings.length + 1}:B`,
                    `${DEBT_SHEET_NAME}!A${finalDebts.length + 1}:G`,
                 ]
             }
        });

    } catch (err) {
        console.error('The API returned an error during batch update/clear: ' + err);
        if (err instanceof Error) {
            throw new Error(`Failed to write data to Google Sheet: ${err.message}`);
        }
        throw new Error('Failed to write data to Google Sheet due to an unknown error.');
    }
}
