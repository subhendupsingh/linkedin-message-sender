const { chromium } = require('playwright');
const fs = require('fs-extra');
const { google } = require('@googleapis/sheets');

let allConnections = [];

// Enter your linkedin credentials, this will not be stored anywhere, this will stay on your system.
const linkedInEmail = "";
const linkedInPassword = "";

// File to store contacted connections
const CONTACTED_FILE = 'contacted_connections.json';
const SPREADSHEET_ID = '11GaB_shWlLdFgwPzk07Shus_xAS2EicZiAIpT5HkFls'; // Add your Google Sheet ID here

// Initialize Google Sheets API
//const sheets = google.sheets('v4');


// Initialize or load contacted connections
const loadContactedConnections = async () => {
    try {
        await fs.ensureFile(CONTACTED_FILE);
        const data = await fs.readJson(CONTACTED_FILE, { throws: false });
        return data || {};
    } catch (error) {
        return {};
    }
};

// Save contacted connection
const saveContactedConnection = async (personName, status) => {
    const contacted = await loadContactedConnections();
    contacted[personName] = { status, timestamp: new Date().toISOString() };
    await fs.writeJson(CONTACTED_FILE, contacted);

    /* try {
        const auth = new google.auth.GoogleAuth({
            scopes: ['https://www.googleapis.com/auth/spreadsheets']
        });
        const authClient = await auth.getClient();
        
        await sheets.spreadsheets.values.append({
            auth: authClient,
            spreadsheetId: SPREADSHEET_ID,
            range: 'Sheet1!A:C',
            valueInputOption: 'USER_ENTERED',
            resource: {
                values: [[personName, status, new Date().toISOString()]]
            }
        });
    } catch (error) {
        console.error('Error updating spreadsheet:', error.message);
    } */
};
async function getGreeting(connection) {
    const personNameElement = await connection.$('span.mn-connection-card__name');
    const personName = personNameElement ? await personNameElement.innerText() : '';

    console.log("Contacting:", personName);

    // Split the name and extract the first name
    const firstName = personName.split(" ")[0];
    const greeting = firstName ? `Hello ${firstName}` : "Hello";

    console.log(greeting);
    return greeting;
}

async function isOldConnection(connection) {
    const timeElement = await connection.$('time');
    if (timeElement) {
        const timeText = await timeElement.innerText();

        // Check if the time text indicates months or years
        if (timeText.includes('month') || timeText.includes('year')) {
            return true;
        }

        return false;
    }

    return false;
}

async function doPreviousMessagesContainShootmail(page) {
    const messages = await page.$$('div.msg-s-event-listitem__message-bubble');
   const previousMessages = await Promise.all(messages.map(async (msg) => {
       return await msg.innerText();
   }));

   // Check if "Shootmail" is in the last 10 messages
   const recentMessages = previousMessages.slice(-10);
   const hasShootmail = recentMessages.some(message => message.includes('/shootmail'));
   console.log(`Has Shootmail: ${hasShootmail}`);

   return hasShootmail;
}

async function closeMessageWindow(page) {
    const closeButtonHeaders = await page.$$('div.msg-convo-wrapper header div.msg-overlay-bubble-header__controls');
   
    if(closeButtonHeaders?.length >0){
        let closeButton;
        for (let index = 0; index < closeButtonHeaders.length; index++) {
            const closeButtonHeader = closeButtonHeaders[index];
            if (closeButtonHeader) {
                const children = await closeButtonHeader.$$('button'); // Select all child divs
                const childrenCount = children.length;
    
                //console.log(`Children count: ${childrenCount}`);
    
                if (childrenCount > 0) {
                    closeButton = children[childrenCount - 1];
                }
    
                console.log("Closing the window");
    
                if (closeButton) {
                    await closeButton.click(); // Click the close button
                } else {
                    console.log("Close button not found.");
                }
            } else {
                console.log("Close button header not found.");
            }
        }
    }else{
        console.log("Close button header not found.");
    }
}

async function sendMessageToNewConnections(page, connection) {
    const greeting = await getGreeting(connection);
    const messageInput = await page.$('div[contenteditable="true"]');
    const message = `${greeting}\n\nHope you are doing good! I am launching on Product Hunt for the first time. I need your support to make it to the top 5.\n\nYou can subscribe to the launch notification here: https://www.producthunt.com/products/shootmail\n\nI will notify you on the launch day, most probably on Nov 7. It would mean a lot to me.\n\nThanks in advance, would love to support you in any way. :)`;
    await messageInput.fill(message);
    await page.click('button[type="submit"]'); // Click the send button
}

async function sendMessageToOldConnections(page, connection) {
    const greeting = await getGreeting(connection);
    //console.log(greeting);
    const messageInput = await page.$('div[contenteditable="true"]');
    const message = `${greeting}\n\nHope you are doing good! I am launching on Product Hunt for the first time. I need your support to make it to the top 5.\n\nYou can subscribe to the launch notification here: https://www.producthunt.com/products/shootmail\n\nI will notify you on the launch day, most probably on Nov 7. It would mean a lot to me.\n\nP.S. If you don't have an account on Product Hunt, I request you to please create one.\n\nThanks in advance :)`;
    await messageInput.fill(message);
    await page.click('button[type="submit"]'); // Click the send button
}


const filterOldConnections = async () => {
    const oldConnections = [];
    for (let index = 0; index < allConnections.length; index++) {
        const connection = allConnections[index];

        const isOld = await isOldConnection(connection);
        if (isOld) {
            oldConnections.push(connection);
        }
    }
    console.log(`Total old connections: ${oldConnections.length}`);
    return oldConnections;
}

const filterAlreadycontactedConnections = async (connections) => {
    const contacted = await loadContactedConnections();
    const filteredConnections = [];
    console.log(`Total contacted connections: ${Object.keys(contacted).length}`);

    for (let index = 0; index < connections.length; index++) {
        const connection = connections[index];
        const personNameElement = await connection.$('span.mn-connection-card__name');
        const personName = personNameElement ? await personNameElement.innerText() : '';
        console.log("personName", personName);
        if (!contacted[personName]) {
            filteredConnections.push(connection);
        }
    }

    console.log(`Total uncontacted connections: ${filteredConnections.length}`);
    return filteredConnections;
}

async function processConnection(connection, page) {
    const personNameElement = await connection.$('span.mn-connection-card__name');
    const personName = personNameElement ? await personNameElement.innerText() : '';
    
    // Close the message window if it's open
    await closeMessageWindow(page);
    
    const isOld = await isOldConnection(connection);
    const type = isOld ? "old" : "new";

   // Click on the message button
   const messageButton = await connection.$('button.artdeco-button'); // Adjust selector to find the correct button
   await messageButton.click();
   await page.waitForTimeout(5000); // Wait for the message window to open

   // Check previous messages
   const hasShootmail = await doPreviousMessagesContainShootmail(page);
   console.log(`Connection type: ${type}`);
   if(!hasShootmail){
        if(type === "new"){
            await sendMessageToNewConnections(page, connection);
        } else if(type === "old"){
            await sendMessageToOldConnections(page, connection);
        }
        await saveContactedConnection(personName, "Invite Sent");
    }else{
        console.log("Message already sent to this connection, skipping....");
        await saveContactedConnection(personName, "Already Contacted");
    }

    await page.waitForTimeout(5000); // wait to send the message
    // Close the message window
   // Close the message window
   await closeMessageWindow(page);
}

async function processConnections(connections, page) {

    // Load contacted connections first
    //const contacted = await loadContactedConnections();

    /* if(sendMessagesToOldConnectionsOnly){ */
        //const oldConnections = await filterOldConnections();

        // Filter out already contacted connections
        const uncontactedConnections = await filterAlreadycontactedConnections(allConnections);

        console.log(`Found ${uncontactedConnections.length} uncontacted old connections to process`);

        for (const connection of uncontactedConnections) {
            const index = allConnections.indexOf(connection);
            console.log(`Processing connection number: ${index}`);
            await processConnection(connection, page);
            await page.waitForTimeout(5000); // Wait before moving to the next connection
        }

        await browser.close();
    /* } */
}

async function getConnections(page) {
    const connections = await page.$$('li.mn-connection-card');
    allConnections = connections;
    console.log(`Total connections fetched: ${allConnections.length}`);
}


(async () => {
    const browser = await chromium.launch({ headless: false }); // Set headless: true to run in the background
    const context = await browser.newContext();
    const page = await context.newPage();

    // Navigate to LinkedIn and log in
    await page.goto('https://www.linkedin.com/login');
    await page.fill('input[name="session_key"]', linkedInEmail); // Replace with your email
    await page.fill('input[name="session_password"]', linkedInPassword); // Replace with your password
    await page.click('button[type="submit"]');
    await page.waitForNavigation({timeout: 100*1000});

    // Navigate to connections
    await page.goto('https://www.linkedin.com/mynetwork/invite-connect/connections/');

    await page.waitForSelector('li.mn-connection-card');

    // Get initially loaded connections
    await getConnections(page);

    let repeatCount = 0;

    while (true) {
        //close any message popup if open while scanning connections
        closeMessageWindow(page);

        // Check if there's a "Load More" button
        const loadMoreButton = await page.$('.scaffold-finite-scroll__load-button');
        let previousConnectionsLength = allConnections.length;

        if (loadMoreButton) {
            // Click the button to load more connections
            //await loadMoreButton.click();
            await page.click('.scaffold-finite-scroll__load-button');
            await page.waitForTimeout(2000); // Wait for connections to load
            await getConnections(page);
        } else {
            // No "Load More" button, scroll down to load more connections
            await page.evaluate(() => {
                window.scrollTo(0, document.body.scrollHeight);
            });

            await page.waitForTimeout(2000); // Wait for new connections to load

            // Check if we have reached the bottom of the page
            await getConnections(page);
        }

        if (allConnections.length === previousConnectionsLength) {
            repeatCount = repeatCount + 1;
        }

        if (repeatCount > 5) {
            break;
        }

    }

    console.log(`Total connections found: ${allConnections.length}, processing now...`);
    await processConnections(allConnections, page);
})();
