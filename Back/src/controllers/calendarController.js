const { google } = require('googleapis');

const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
);

exports.auth = (req, res) => {
    const scopes = ['https://www.googleapis.com/auth/calendar.readonly'];
    const url = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: scopes
    });
    res.redirect(url);
};

exports.callback = async (req, res) => {
    const { code } = req.query;
    try {
        const { tokens } = await oauth2Client.getToken(code);
        oauth2Client.setCredentials(tokens);
        // In prod: Save tokens to User Session/DB
        res.redirect('http://localhost:5173?calendar_connected=true');
    } catch (error) {
        console.error('Error retrieving access token', error);
        res.status(500).send("Error with Google Auth");
    }
};

exports.getEvents = async (req, res) => {
    try {
        const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
        const response = await calendar.events.list({
            calendarId: 'primary',
            timeMin: (new Date()).toISOString(),
            maxResults: 10,
            singleEvents: true,
            orderBy: 'startTime',
        });
        res.json(response.data.items);
    } catch (error) {
        console.log('No auth or API error, returning mocks');
        // Fallback to Mocks if not connected to avoid breaking UI checking logic
        res.json([
            { id: 'mock1', summary: 'Mock: Revue Stratégique', start: { dateTime: new Date().toISOString() } },
            { id: 'mock2', summary: 'Mock: Déjeuner Client', start: { dateTime: new Date(Date.now() + 3600000).toISOString() } }
        ]);
    }
};
