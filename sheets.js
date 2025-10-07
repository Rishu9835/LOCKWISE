import dotenv from 'dotenv';
import { google } from 'googleapis';
dotenv.config();

// Decode Google Service Account JSON from base64
const credentials = JSON.parse(
  Buffer.from(process.env.GOOGLE_KEY_JSON, "base64").toString("utf-8")
);

// Create auth client using GoogleAuth with credentials
const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

// Initialize the auth client
let sheets;

async function getAuthenticatedSheetsClient() {
    if (!sheets) {
        const client = await auth.getClient();
        sheets = google.sheets({ version: 'v4', auth: client });
    }
    return sheets;
}

console.log('Google Sheets authentication initialized successfully');

const SPREADSHEET_ID = process.env.SPREADSHEET_ID; 
const SHEET_NAME = 'door_log'; // Change as needed

async function appendEmailToSheet(name, regNo, email, password) {
    const sheetsInstance = await getAuthenticatedSheetsClient();
    const now = new Date().toISOString();
    // Match your actual Google Sheet structure: A=Name, B=RegNo, C=Email, D=Password, E=Admin(empty), F=DoorOTP(empty), G=Timestamp
    const values = [[name || '', regNo || '', email || '', password || '', '', '', now]];
    console.log(`Appending member entry: Name=${name}, RegNo=${regNo}, Email=${email}, Password=${password}, Timestamp=${now}`);
    console.log(`Appending to range: ${SHEET_NAME}!A:G`);
    try {
        await sheetsInstance.spreadsheets.values.append({
            spreadsheetId: SPREADSHEET_ID,
            range: `${SHEET_NAME}!A:G`,   
            valueInputOption: 'USER_ENTERED',
            insertDataOption: 'INSERT_ROWS',
            resource: { values: values },
        });

        console.log('Member entry logged to Google Sheets: A=name, B=regNo, C=email, D=password, G=timestamp (skipping admin/door columns).');
    } catch (err) {
        console.error('Failed to log member entry to Google Sheets:', err);
        throw err;
    }
}


async function getValueSheet(row, col) {
    const sheetsInstance = await getAuthenticatedSheetsClient();
    try {
        const response = await sheetsInstance.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: `${SHEET_NAME}!A:C`,
        });
        const rows = response.data.values;
        if (rows.length) {
            // Assuming the password is in the first third column and first row
            return rows[row][col];
        } else {
            throw new Error('No data found');
        }   
    } catch (err) {
        console.error('Failed to retrieve from Google Sheets:', err);
        throw err;
    }
}

async function changeValueSheet(row, col, newValue) {
    const sheetsInstance = await getAuthenticatedSheetsClient();
    try {
        await sheetsInstance.spreadsheets.values.update({
            spreadsheetId: SPREADSHEET_ID,
            range: `${SHEET_NAME}!${String.fromCharCode(65 + col)}${row + 1}`,
            valueInputOption: 'USER_ENTERED',
            resource: {
                values: [[newValue]],
            },
        });
        // console.log('Value updated successfully in Google Sheets.');
    } catch (err) {
        console.error('Failed to update Google Sheets:', err);
        throw err;
    }
}

async function getAllValFromColumn(col) {
    const sheetsInstance = await getAuthenticatedSheetsClient();
    try {
        const response = await sheetsInstance.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: `${SHEET_NAME}!${String.fromCharCode(65 + col)}:${String.fromCharCode(65 + col)}`, // Specified column only
        });

        const rows = response.data.values;

        if (!rows || rows.length === 0) {
            // console.log('No emails found in column D.');
            return [];
        }
        // Handle missing values and normalize: trim + lowercase, filter empties
        const data = rows
            .map(row => (row && row[0] ? String(row[0]) : ''))
            .map(v => v.trim().toLowerCase())
            .filter(v => v.length > 0);
        return data;
    } catch (err) {
        // console.error('Failed to retrieve emails from Google Sheets:', err);
        throw err;
    }
}

export default {
  appendEmailToSheet,
  getValueSheet,
  changeValueSheet,
  getAllValFromColumn
};

