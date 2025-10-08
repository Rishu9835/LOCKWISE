import dotenv from 'dotenv';
import { google } from 'googleapis';
dotenv.config();

// Decode Google Service Account JSON from base64
let credentials;
try {
    const credentialsJson = Buffer.from(process.env.GOOGLE_KEY_JSON, "base64").toString("utf-8");
    credentials = JSON.parse(credentialsJson);
    console.log('Google credentials loaded successfully. Client email:', credentials.client_email);
} catch (error) {
    console.error('Failed to parse Google credentials:', error.message);
    throw new Error('Invalid Google Service Account credentials');
}

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

if (!SPREADSHEET_ID) {
    console.error('CRITICAL: SPREADSHEET_ID environment variable is not set');
    throw new Error('SPREADSHEET_ID environment variable is required');
}

console.log('Using spreadsheet ID:', SPREADSHEET_ID);
console.log('Using sheet name:', SHEET_NAME);

const sheetsInstance = await getAuthenticatedSheetsClient();


async function appendEmailToSheet(name, regNo, email, password) {
    // const sheetsInstance = await getAuthenticatedSheetsClient();
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
    // const sheetsInstance = await getAuthenticatedSheetsClient();
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
    // const sheetsInstance = await getAuthenticatedSheetsClient();
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
    // const sheetsInstance = await getAuthenticatedSheetsClient();
    try {
        console.log(`Reading from spreadsheet ${SPREADSHEET_ID}, sheet ${SHEET_NAME}, column ${String.fromCharCode(65 + col)}`);
        
        const response = await sheetsInstance.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: `${SHEET_NAME}!${String.fromCharCode(65 + col)}:${String.fromCharCode(65 + col)}`, // Specified column only
        });

        const rows = response.data.values;
        console.log(`Column ${col} raw data:`, rows ? rows.length : 0, 'rows');

        if (!rows || rows.length === 0) {
            console.log(`No data found in column ${col}`);
            return [];
        }
        
        // Handle missing values and normalize: trim + lowercase, filter empties
        const data = rows
            .map(row => (row && row[0] ? String(row[0]) : ''))
            .map(v => v.trim())
            .filter(v => v.length > 0);
            
        console.log(`Column ${col} processed data:`, data.length, 'items');
        return data;
    } catch (err) {
        console.error(`Failed to retrieve data from column ${col}:`, err.message);
        throw err;
    }
}

async function appendUser(regNo) {
    const now = new Date().toISOString();
    const values = [[regNo, now]];

    try {
        const response = await sheetsInstance.spreadsheets.values.append({
            spreadsheetId: SPREADSHEET_ID,
            range: `${SHEET_NAME}!I:J`,
            valueInputOption: 'USER_ENTERED',
            resource: {
                values,
            },
        });
        // console.log('Email logged to Google Sheets.');
    } catch (err) {
        console.error('Failed to log to Google Sheets:', err);
        throw err;
    }
}

export default {
  appendEmailToSheet,
  getValueSheet,
  changeValueSheet,
  getAllValFromColumn,
  appendUser
};

