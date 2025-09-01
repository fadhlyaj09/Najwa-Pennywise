import { google } from 'googleapis';
import type { User } from '@/ai/flows/user-auth-flow';

const SHEET_ID = process.env.SHEET_ID;
const GOOGLE_SHEETS_CLIENT_EMAIL = process.env.GOOGLE_SHEETS_CLIENT_EMAIL;
const GOOGLE_SHEETS_PRIVATE_KEY = process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, '\n');

const RANGE = 'A:B'; // Assuming Email is in column A and Password in column B

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

async function getSheetData() {
    const sheets = await getSheetsService();
    try {
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SHEET_ID,
            range: RANGE,
        });
        return response.data.values || [];
    } catch (err) {
        console.error('The API returned an error: ' + err);
        throw new Error('Failed to retrieve data from Google Sheet.');
    }
}


export async function findUserByEmailInSheet(email: string): Promise<User | null> {
    const rows = await getSheetData();
    const foundRow = rows.find(row => row[0]?.toLowerCase() === email.toLowerCase());
    if (foundRow) {
        return { email: foundRow[0], password: foundRow[1] };
    }
    return null;
}

export async function appendUserToSheet(user: User): Promise<void> {
    const sheets = await getSheetsService();
    try {
        await sheets.spreadsheets.values.append({
            spreadsheetId: SHEET_ID,
            range: RANGE,
            valueInputOption: 'USER_ENTERED',
            requestBody: {
                values: [[user.email, user.password]],
            },
        });
    } catch (err) {
        console.error('The API returned an error: ' + err);
        throw new Error('Failed to append data to Google Sheet.');
    }
}
