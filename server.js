import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch'; // for making API calls
import sheets from './sheets.js';
import { generateOtp, getExpiry } from './utils/otp.js';
import { saveOtp, verifyOtp, cleanupOtps } from './store/otpstore.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { appendEmailToSheet, getValueSheet, changeValueSheet, getAllValFromColumn } = sheets;

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

let currAdminPass = (Math.floor(Math.random() * 1000000)).toString().padStart(6, '0');
// store logged-in admins
// just keep a set of admin emails who are verified
const loggedInAdmins = new Set();

app.use(cors());
app.use(express.json());

// Serve static files from frontend/dist
app.use(express.static(path.join(__dirname, 'frontend', 'dist')));

// API test endpoint
app.get('/api/test', (req, res) => {
    res.json({ message: 'Robotics Club Door Lock API Server', status: 'running' });
});
//=========================//
// Helper: Send Email via Brevo
//=========================//
async function sendEmailBrevo(to, subject, htmlContent) {
    const url = "https://api.brevo.com/v3/smtp/email";

    const body = {
        sender: {
            name: "Robotics Club",
            email: process.env.EMAIL_USER   // must match a verified Brevo sender
        },
        to: [{ email: to }],
        subject: subject,
        htmlContent: htmlContent
    };

    const response = await fetch(url, {
        method: "POST",
        headers: {
            "accept": "application/json",
            "api-key": process.env.BREVO_API_KEY,
            "content-type": "application/json"
        },
        body: JSON.stringify(body)
    });

    if (!response.ok) {
        throw new Error(`Brevo email failed: ${response.statusText}`);
    }

    return response.json();
}


//=========================//
// Routes
//=========================//

// Initialize admin emails (will be loaded when needed)
async function getAdminEmails() {
    try {
        const admins = await getAllValFromColumn(Number(process.env.ADMIN_COL));
        console.log('Admin emails loaded from Google Sheets:', admins.length, 'admins found');
        return admins;
    } catch (error) {
        console.error('CRITICAL: Failed to load admin emails from Google Sheets:', error.message);
        throw new Error('Cannot load admin emails from Google Sheets. Check environment variables.');
    }
}

// Verify admin and send OTP
app.post('/api/verifyAdmin', async (req, res) => {
    const { email, otp } = req.body; // if otp is undefined, it's step 1
    const admins = await getAdminEmails();

    if (!email) return res.status(400).send('Missing required field: email');
    if (!admins.includes(email)) return res.status(400).send('You are not an admin');

    // Step 2: OTP is provided → verify and log in
    if (otp) {
        const result = verifyOtp(otp, 'ADMIN');
        if (!result.valid) {
            return res.status(400).send(`OTP invalid: ${result.reason}`);
        }

        loggedInAdmins.add(email); // now admin is logged in
        console.log(`Admin ${email} logged in successfully.`);
        return res.status(200).send('Admin verified and logged in.');
    }

    // Step 1: No OTP yet → generate OTP and send email
    const generatedOtp = generateOtp();
    const expiresAt = getExpiry(5); // 5 minutes
    saveOtp(generatedOtp, 'ADMIN', expiresAt);

    const subject = "Admin Verification OTP";
    const htmlContent = `
        <p>Hello Admin,</p>
        <p>Your OTP for login is: <b>${generatedOtp}</b></p>
        <p>This OTP is valid for 5 minutes.</p>
    `;

    try {
        await sendEmailBrevo(email, subject, htmlContent);
        console.log(`OTP sent to admin email: ${email}`);
        return res.status(200).json({ 
            message: 'OTP sent to admin email.',
            expiresAt: expiresAt,
            validityMinutes: 5
        });
    } catch (err) {
        console.error('Error sending OTP:', err);
        return res.status(500).send('Failed to send OTP.');
    }
});


async function requireAdmin(req, res, next) {
    const { email } = req.body;
    if (!email || !loggedInAdmins.has(email)) {
        return res.status(401).send("Unauthorized: Admin not verified");
    }
    next();
}

app.post('/api/admin/logout', (req, res) => {
    const { email } = req.body;
    if (!email || !loggedInAdmins.has(email)) {
        return res.status(400).send("Admin not logged in");
    }

    loggedInAdmins.delete(email);
    console.log(`Admin ${email} logged out`);
    res.status(200).send("Admin logged out successfully");
});


// Log entry
app.post('/api/enter', async (req, res) => {
    const { name, regNo, email } = req.body;
    
    // Validate required fields
    // For ESP32, only regNo is required. For frontend, both regNo and email are required
    if (!regNo) {
        return res.status(400).json({ error: 'Registration number is required' });
    }
    
    // If request comes from frontend (has email), validate email
    if (email && !name) {
        return res.status(400).json({ error: 'Name is required when email is provided' });
    }

    try {
        // Generate 8-digit password: first 4 are last 4 digits of regNo, last 4 are random
        const regNoDigits = regNo.replace(/\D/g, ''); // Extract only digits from regNo
        const lastFourOfRegNo = regNoDigits.slice(-4).padStart(4, '0'); // Get last 4 digits, pad if needed
        const randomFour = (Math.floor(Math.random() * 10000)).toString().padStart(4, '0'); // Random 4 digits
        const password = lastFourOfRegNo + randomFour; // 8-digit password
        
        // Log the member entry with name, regNo, email, password, and timestamp
        await appendEmailToSheet(name, regNo, email, password);
        
        // Send password via email
        const subject = 'Robotics Club - Access Password';
        const htmlContent = `
            <html>
              <body>
                <h2>Welcome to Robotics Club!</h2>
                <p>Hello ${name || 'Member'},</p>
                <p>Your access password is: <b>${password}</b></p>
                <p>Registration Number: <b>${regNo}</b></p>
                <p>This password is valid for door access.</p>
                <p>- Robotics Club</p>
              </body>
            </html>
        `;

        try {
            await sendEmailBrevo(email, subject, htmlContent);
            console.log(`Access password sent to member email: ${email}`);
        } catch (emailError) {
            console.error('Failed to send password email:', emailError);
            // Still continue with success since entry is logged
        }
        
        res.status(200).json({ 
            success: true, 
            message: "Member entry logged successfully",
            password: password 
        });
    } catch (error) {
        console.error('Error logging member entry:', error);
        res.status(500).json({ error: 'Error logging member entry to sheet' });
    }
});



// Debug endpoint to check sheet data
app.get('/api/debug-sheet', async (req, res) => {
    try {
        const emails = await getAllValFromColumn(Number(process.env.MEMBER_EMAIL_COL));
        const regNos = await getAllValFromColumn(Number(process.env.MEMBER_REG_NO_COL));
        const passwords = await getAllValFromColumn(Number(process.env.MEMBER_PASSWORD_COL));
        const admins = await getAllValFromColumn(Number(process.env.ADMIN_COL));
        
        res.json({
            columns: {
                MEMBER_EMAIL_COL: process.env.MEMBER_EMAIL_COL,
                MEMBER_REG_NO_COL: process.env.MEMBER_REG_NO_COL,
                MEMBER_PASSWORD_COL: process.env.MEMBER_PASSWORD_COL,
                ADMIN_COL: process.env.ADMIN_COL
            },
            data: {
                emails,
                regNos, 
                passwords,
                admins
            }
        });
    } catch (error) {
        console.error('Debug sheet error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Update password fetch
app.post('/api/update', requireAdmin, async (req, res) => {
    try {
        const currentPassword = await getAllValFromColumn(Number(process.env.MEMBER_PASSWORD_COL));
        res.status(200).send(currentPassword.join(','));
    } catch (error) {
        console.error('Error fetching current password:', error);
        res.status(500).send('Error fetching current password.');
    }
});


// Change passwords and send via email
const changePassword = async () => {
    console.log('changePassword function started');
    try {
        console.log('Fetching emails from column:', process.env.MEMBER_EMAIL_COL);
        const emails = await getAllValFromColumn(Number(process.env.MEMBER_EMAIL_COL));
        console.log('Emails retrieved:', emails);

        console.log('Fetching reg numbers from column:', process.env.MEMBER_REG_NO_COL);
        const regNos = await getAllValFromColumn(Number(process.env.MEMBER_REG_NO_COL));
        console.log('Reg numbers retrieved:', regNos);

        if (!emails || !regNos) {
            console.error('Missing data - emails or regNos is null/undefined');
            console.error('Emails:', emails, 'RegNos:', regNos);
            return;
        }

        if (emails.length === 0 || regNos.length === 0) {
            console.log('No members found in the sheet - emails or regNos is empty');
            console.log('This means there are no members to update passwords for');
            return;
        }

        if (emails.length !== regNos.length) {
            console.error('Mismatch in data length - emails and regNos arrays have different lengths');
            console.error('Emails length:', emails.length, 'RegNos length:', regNos.length);
            return;
        }

        console.log(`Processing ${emails.length} members...`);
        for (let i = 0; i < emails.length; i++) {
            const email = emails[i];
            const regNo = regNos[i];
            console.log(`Processing member ${i + 1}: email=${email}, regNo=${regNo}`);
            
            if (!email || !regNo) {
                console.log(`Skipping member ${i + 1} - missing email or regNo`);
                continue;
            }

            const regStr = String(regNo);
            const last4 = regStr.slice(-4);
            const rand4 = Math.floor(1000 + Math.random() * 9000);
            const password = `${last4}${rand4}`;
            console.log(`Generated password for ${email}: ${password}`);

            const subject = 'Your Robotics Club Password';
            const htmlContent = `
                <html>
                  <body>
                    <p>Hello,</p>
                    <p>Your new password is: <b>${password}</b></p>
                    <p>Please keep it safe.</p>
                    <p>- Robotics Club</p>
                  </body>
                </html>
            `;

            try {
                console.log(`Sending email to ${email}...`);
                await sendEmailBrevo(email, subject, htmlContent);
                console.log(`Email sent successfully to ${email}`);
                
                console.log(`Updating sheet - row ${i}, column ${process.env.MEMBER_PASSWORD_COL}, password: ${password}`);
                await changeValueSheet(i, Number(process.env.MEMBER_PASSWORD_COL), password);
                console.log(`Sheet updated successfully for ${email}`);
            } catch (err) {
                console.error(`Failed for ${email}:`, err);
            }
        }
        console.log('changePassword function completed');
    } catch (err) {
        console.error('changePassword function error:', err);
    }
};

// Admin generates OTP for door unlock
app.post('/api/admin/generateDoorOtp', requireAdmin,async (req, res) => {
    try {
        // 1️⃣ Generate OTP
        const otp = generateOtp();
        const expiresAt = getExpiry(15); // 15 minutes
        saveOtp(otp, 'DOOR', expiresAt);

        // 2️⃣ Log OTP in Google Sheet (new column for door OTPs)
        // Assuming you have a helper like changeValueSheet(row, col, value)
        // We'll append to the first empty row in a specific column
        const doorOtpCol = Number(process.env.DOOR_OTP_COL); // add in .env
        const nextRow = await getAllValFromColumn(doorOtpCol).then(vals => vals.length);
        await changeValueSheet(nextRow, doorOtpCol, otp);
        console.log(`Door OTP logged in sheet at row ${nextRow}, column ${doorOtpCol}`);

        // 3️⃣ Get admin emails
        const admins = await getAdminEmails();
        const validAdmins = admins.map(e => e.trim()).filter(e => e.includes('@'));

        if (validAdmins.length === 0) {
            console.error("No valid admin emails found for door OTP.");
            return res.status(500).send("No valid admin emails found.");
        }

        // 4️⃣ Prepare email content
        const subject = 'Door Unlock OTP';
        const htmlContent = `
            <html>
              <body>
                <p>Hello Admin,</p>
                <p>Your OTP to unlock the door is: <b>${otp}</b></p>
                <p>This OTP is valid for 15 minutes.</p>
                <p>- Robotics Club</p>
              </body>
            </html>
        `;

        // 5️⃣ Send OTP email to all valid admins
        for (const email of validAdmins) {
            await sendEmailBrevo(email, subject, htmlContent);
            console.log(`Door OTP sent to admin email: ${email}`);
        }

        // 6️⃣ Schedule deletion after expiry
        setTimeout(async () => {
            console.log(`Deleting door OTP ${otp} after 15 minutes.`);
            cleanupOtps(); // remove from in-memory store
            // Remove from Google Sheet
            const sheetVals = await getAllValFromColumn(doorOtpCol);
            const rowIndex = sheetVals.indexOf(otp);
            if (rowIndex !== -1) {
                await changeValueSheet(rowIndex, doorOtpCol, '');
                console.log(`Door OTP ${otp} removed from Google Sheet row ${rowIndex}`);
            }
        }, 15 * 60 * 1000);

        return res.status(200).json({
            message: "Door OTP sent to admin email(s) and logged in sheet.",
            otp: otp,
            expiresAt: expiresAt,
            validityMinutes: 15
        });

    } catch (err) {
        console.error("Error generating/sending/logging door OTP:", err);
        return res.status(500).send("Failed to generate/send/log door OTP.");
    }
});



// Door verifies OTP
app.post('/api/door/verifyOtp', async (req, res) => {
  const { otp } = req.body;
  const result = verifyOtp(otp, 'DOOR');

  if (!result.valid) {
    return res.status(400).json({ error: result.reason });
  }

  try {
    // Find the row with this OTP in the door OTPs column
    const doorOtpCol = Number(process.env.DOOR_OTP_COL);
    const timestampCol = 6; // Column G for timestamp
    const otps = await getAllValFromColumn(doorOtpCol);
    const rowIndex = otps.indexOf(otp);

    if (rowIndex !== -1) {
      // Update timestamp for this OTP usage
      const timestamp = new Date().toISOString();
      await changeValueSheet(rowIndex, timestampCol, timestamp);
      console.log(`Timestamp logged for OTP ${otp} at row ${rowIndex}`);
    }

    res.json({ success: true, message: 'Door unlocked!', timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('Error logging timestamp:', error);
    // Still return success even if timestamp logging fails
    res.json({ success: true, message: 'Door unlocked! (Timestamp logging failed)' });
  }
});

// Manual or cron-triggered password reset

app.post('/api/changepassword', requireAdmin, async (req, res) => {
    const { cron_job_pass, otp, confirm, adminPass } = req.body;

    // Handle ESP32 adminPass request
    if (adminPass) {
        try {
            await changePassword();
            return res.status(200).send("Password changed successfully");
        } catch (error) {
            console.error("Password change error:", error);
            return res.status(500).send("Error changing password");
        }
    }

    // 1️⃣ Cron job triggered password reset
    if (cron_job_pass && cron_job_pass === process.env.CRON_JOB_PASSWROD) {
        try {
            await changePassword();
            return res.status(200).send("Password changed successfully (cron job)");
        } catch (error) {
            console.error("Cron job password change error:", error);
            return res.status(500).send("Error changing password");
        }
    }

    // 2️⃣ OTP flow for manual admin-triggered password change
    if (!confirm) {
        // Generate OTP
        const generatedOtp = generateOtp();
        const expiresAt = getExpiry(5); // OTP valid for 5 minutes
        saveOtp(generatedOtp, 'RESET', expiresAt);

        // Fetch admin emails
        const admins = await getAdminEmails();
        const validAdmins = admins
            .map(e => e.trim())
            .filter(e => e.includes('@'));

        if (validAdmins.length === 0) {
            console.error("No valid admin emails found to send OTP.");
            return res.status(500).send("No valid admin emails found.");
        }

        const subject = 'OTP for Password Change';
        const htmlContent = `
            <html>
              <body>
                <p>Hello Admin,</p>
                <p>Your OTP for changing all passwords is: <b>${generatedOtp}</b></p>
                <p>This OTP is valid for 5 minutes.</p>
                <p>- Robotics Club</p>
              </body>
            </html>
        `;

        try {
            for (const email of validAdmins) {
                await sendEmailBrevo(email, subject, htmlContent);
                console.log(`OTP sent to admin email: ${email}`);
            }
            return res.status(200).send("OTP sent to admin email(s). Use it to confirm password change.");
        } catch (err) {
            console.error('Error sending OTP emails:', err);
            return res.status(500).send("Failed to send OTP email(s)");
        }
    }

    // 3️⃣ Confirm OTP and proceed to change passwords
    const result = verifyOtp(otp, 'RESET');
    if (!result.valid) {
        return res.status(400).send(`OTP invalid: ${result.reason}`);
    }

    try {
        await changePassword();
        console.log('Password change completed successfully');
        return res.status(200).send("Password changed successfully");
    } catch (error) {
        console.error("Error changing password:", error);
        return res.status(500).send("Error changing password");
    }
});

// Get member logs from Google Sheet
app.post('/api/admin/getMemberLogs', requireAdmin, async (req, res) => {
    try {
        // Fetch data from actual Google Sheet structure based on your screenshot
        // Your sheet has: RegNo (B=1), Email (C=2), Password (D=3), Admin (E=4)
        // Fetch data from actual Google Sheet structure (0-based indexing)
        const names = await getAllValFromColumn(0); // Column A (index 0) - Name
        const regNos = await getAllValFromColumn(1); // Column B (index 1) - Registration Number  
        const emails = await getAllValFromColumn(2); // Column C (index 2) - Email
        const passwords = await getAllValFromColumn(3); // Column D (index 3) - Password
        const timestamps = await getAllValFromColumn(6); // Column G (index 6) - Timestamp

        console.log('Debug - Column data:');
        console.log('Names (Col A):', names?.slice(0, 3));
        console.log('RegNos (Col B):', regNos?.slice(0, 3));
        console.log('Emails (Col C):', emails?.slice(0, 3));
        console.log('Passwords (Col D):', passwords?.slice(0, 3));
        console.log('Timestamps (Col G):', timestamps?.slice(0, 3));

        // Create an array of member log objects
        const memberLogs = [];
        const maxLength = Math.max(
            names?.length || 0,
            regNos?.length || 0, 
            emails?.length || 0,
            passwords?.length || 0,
            timestamps?.length || 0
        );

        // Start from index 1 to skip the header row
        for (let i = 1; i < maxLength; i++) {
            // Skip if no essential data in this row (need at least regNo or email)
            if (!regNos?.[i] && !emails?.[i]) continue;

            memberLogs.push({
                id: i + 1,
                name: names?.[i] || '',
                regNo: regNos?.[i] || '',
                email: emails?.[i] || '',
                password: passwords?.[i] || '',
                timestamp: timestamps?.[i] || ''
            });
        }

        // Since no timestamps, keep original order (no sorting needed)

        console.log(`Retrieved ${memberLogs.length} member logs`);
        
        return res.status(200).json({
            success: true,
            data: memberLogs,
            total: memberLogs.length
        });

    } catch (error) {
        console.error('Error fetching member logs:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to fetch member logs'
        });
    }
});

// every 5 minutes, purge expired/used OTPs
setInterval(cleanupOtps, 10 * 60 * 1000);

// Serve frontend for all other routes (must be last)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'dist', 'index.html'));
});

//=========================//
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});