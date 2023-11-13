const express = require('express');
const router = express.Router();
const axios = require('axios');
const FormData = require('form-data');
const path = require('path')
const { PDFDocument } = require('pdf-lib');
const fs = require('fs');

const ENV_FILE = path.join(__dirname, './.env');
require('dotenv').config({ path: ENV_FILE });
const tempalte_path = path.join(__dirname, "./templates");

const { TableClient, AzureSASCredential } = require("@azure/data-tables");
const { BlobServiceClient, StorageSharedKeyCredential, generateBlobSASQueryParameters, BlobSASPermissions, SASProtocol  } = require("@azure/storage-blob");
const { create } = require('domain');

// Azure Authentication client variables
const storageAccount = "vumbotstorage";
const tableName = "moyaClients";
const policyNumberTableName = "policyNumber";
const claimsTableName = "moyaClaims";
const errorLogTableName = "errorLogs";
const moyaPayPaymentsTableName = "moyaPayPayments";
const cfeRegistrationTableName = "cfeRegistration";
const SAScredential = process.env.SAScredential;
const moyaToken = process.env.MOYA_TOKEN;
const moyaPayToken = process.env.MOYA_PAY_TOKEN;
const sharedKeyToken = process.env.sharedKeyToken;
const googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY;
const what3WordsApiKey = process.env.WHAT_3_WORDS_API_KEY;
const API_KEY = process.env.API_KEY;

// Azure Table Authentication Credentials
const azureSASCredential = new AzureSASCredential(SAScredential);

// Azure Blob Storage Authentication Credentials
const sharedKeyCredential = new StorageSharedKeyCredential(storageAccount, sharedKeyToken);

const clientTableClient = new TableClient(
  `https://${storageAccount}.table.core.windows.net/`,
  tableName,
  azureSASCredential
);

const policyNumberTableClient = new TableClient(
  `https://${storageAccount}.table.core.windows.net/`,
  policyNumberTableName,
  azureSASCredential
);

const moyaPayIDsTableClient = new TableClient(
  `https://${storageAccount}.table.core.windows.net/`,
  moyaPayPaymentsTableName,
  azureSASCredential
);

const claimTableClient = new TableClient(
  `https://${storageAccount}.table.core.windows.net/`,
  claimsTableName,
  azureSASCredential
);

const questionTableClient = new TableClient(
  `https://${storageAccount}.table.core.windows.net/`,
  "moyaQuestions",
  azureSASCredential
);

const cancellationTableClient = new TableClient(
  `https://${storageAccount}.table.core.windows.net/`,
  "moyaCancellations",
  azureSASCredential
);

const errorLogTable = new TableClient(
  `https://${storageAccount}.table.core.windows.net/`,
  errorLogTableName,
  azureSASCredential
);

const policyScheduleBlobClient = new BlobServiceClient(
  `https://${storageAccount}.blob.core.windows.net/`,
  sharedKeyCredential
);

const cfeQuizTableResults = createTableClient(storageAccount, "cfeTrainingAnswers", azureSASCredential);

const cfeRegistrationTable = createTableClient(storageAccount, cfeRegistrationTableName, azureSASCredential);

// Middleware
const checkApiKey = (req, res, next) => {
  const apiKey = req.headers['authorization']?.split(' ')[1];
  if (!apiKey || apiKey !== API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
};

// ROUTES
// This will run when the client clicks submit on the tile page, it will send the business activity and update the client record in the Azure table.
// It will then send a moya bridge message to the client to start the chatbot.
router.post('/updateBusinessActivity/:did', async (req, res, next) => {
    try {
        const binuDid = req.params.did;
        const updateData = req.body;
        console.log(`FORM DATA: ${JSON.stringify(updateData)}`)

        // NEW CODE
        // Start Data Request from Moya
        const moyaPayCheckPromise = moyaPayCheck(updateData.number);
        // THIS IS THE START OF THE KYC DATA COLLECTION THAT ISN'T BEING CALLED ANYMORE
        // const startDataReqPromise = startDataRequestMoya(updateData.number);
        
        // Await the request ID from the start data request
        // const requestID = await startDataReqPromise;

        // Start fetchDataRequestMoya and moyaPayCheck concurrently
        // THIS IS THE FETCH REQUEST OF THE KYC DATA COLLECTION THAT ISN'T BEING CALLED ANYMORE
        // const fetchDataReqPromise = fetchDataRequestMoya(requestID.requestId);
        // THIS IS THE AWAIT ALL PROMISE FOR THE MOYA CLIENTS KYC DATA AND THE MOY PAY CHECK, ONLY THE MOYA PAY CHECK IS BEING USED NOW
        // const [clientMoyaData, moyaPayData] = await Promise.all([fetchDataReqPromise, moyaPayCheckPromise]);

        // Await the moyaPayCheckPromise
        const moyaPayData = await moyaPayCheckPromise;

        console.log(`MOYA PAY DATA AFTER PROMISES: ${JSON.stringify(moyaPayData)}`)
        
        // Create Client Record in Azure Table Storage
        // Check if the businessActivity parameter is present and has a value
        if (!updateData.businessActivity || updateData.businessActivity.trim() === '') {
          return res.status(400).json({ success: false, message: 'Missing or empty businessActivity parameter' });
        }
        // Perform the update operation using the x-binu-did value and the data from the request body
        try {
            const entity = await clientTableClient.getEntity("", updateData.number);
            if(!entity.didNumber || entity.didNumber == ""){
                entity.didNumber = binuDid;
            }
            entity.businessActivity = updateData.businessActivity;
            // entity.firstName = clientMoyaData.results.first_name.value;
            // entity.lastName = clientMoyaData.results.last_name.value;
            // entity.idNumber = clientMoyaData.results.id_number.value;
            // entity.citizenship = clientMoyaData.results.citizenship.value;
            // entity.deviceMake = clientMoyaData.results.device_make.value;
            // entity.deviceModel = clientMoyaData.results.device_model.value;
            // entity.deviceTac = clientMoyaData.results.device_tac.value;
            // entity.displayName = clientMoyaData.results.display_name.value;
            entity.moyaPay = moyaPayData.resultCode,
            entity.moyaPayStatus = moyaPayData.resultMessage,
            await clientTableClient.updateEntity(entity);
        } catch (err) {
            const data = {
                partitionKey:"", 
                rowKey: updateData.number,
                didNumber:binuDid,
                firstName: "",
                lastName: "",
                idNumber: "",
                citizenship: "",
                deviceMake: "",
                deviceModel: "",
                deviceTac: "",
                displayName: "",
                // THESE ARE THE RESULTS OF THE MOYA KYC DATA REQUEST THAT ISN'T BEING CALLED ANYMORE
                // firstName: clientMoyaData.results.first_name.value,
                // lastName: clientMoyaData.results.last_name.value,
                // idNumber: clientMoyaData.results.id_number.value,
                // citizenship: clientMoyaData.results.citizenship.value,
                // deviceMake: clientMoyaData.results.device_make.value,
                // deviceModel: clientMoyaData.results.device_model.value,
                // deviceTac: clientMoyaData.results.device_tac.value,
                // displayName: clientMoyaData.results.display_name.value,
                moyaPay: moyaPayData.resultCode,
                moyaPayStatus: moyaPayData.resultMessage,
                policyNumber:"",
                hasTradingName: "",
                businessName:"", 
                coverOption:"",
                businessActivity: updateData.businessActivity,
                googlePlus:"",
                pinCoords:"",
                what3Words:"",
                inceptionDate:"",
                dataPopulated:false,
                incepted:false,
                pro_rata:"",
                pro_rata_amt:"",
                premium_excl_sasria: "",
                premium_incl_sasria: "",
                premium_nett_excl_sasria: "",
                premium_nett_incl_sasria: "",
                premium_vat_excl_sasria: "",
                premium_vat_incl_sasria: "",
                street:"",
                area:"",
                suburb:"",
                postalCode:"",
                province:"",
            }
            await clientTableClient.createEntity(data)
        }
        // Send initial message to client, starting the moya chatBot
        await moyaBridgeMessage(updateData.number, "start chat")
          .then((response) => {
            res.status(200).json({ success: true });
          })
          .catch((error) => {
            console.error("Error sending bridge message to Moya:", error);
          });
      } catch (error) {
        console.error('Error updating business activity:', error);
        res.status(500).json(
            { success: false }
        );
      }
});

// This will run when once the inception bot has finished collecting all the client data.
// It will update the client record in the Azure table with the data collected from the bot.
// It will then initiate the payment process by making the moyaPay API call, with the custom callback enpoint (containing the client's phone number).
router.post('/populatePolicyData/:number', checkApiKey, async (req, res, next) => {
  const clientNumber = req.params.number;
  const data = {
    ...req.body,
    ...getProRataAmount(req.body.inceptionDate, req.body.premium_excl_sasria),
  };

  console.log(`\n\nINCEPTION DATA: ${JSON.stringify(data)}`)

  // Starting the google plus code and what 3 words api call and saving the promises
  const googleMapsPromise = getAPIData("https://maps.googleapis.com/maps/api/geocode/json",`latlng=${data.pinCoords}`,`key=${googleMapsApiKey}`);
  const what3WordsPromise = getAPIData("https://api.what3words.com/v3/convert-to-3wa",`coordinates=${data.pinCoords}`,`key=${what3WordsApiKey}`);
  
  // Getting policy number if client doesn't have one
  if (!data.policyNumber){ data.policyNumber = await getNextPolicyNumber()}
  
  // Creating the moya pay payment promise
  let promises;
  if (data.paymentType === "MoyaPay") {
    console.log("PAYMENT TYPE IS MOYA PAY" + data.paymentType)
    const moyaPayPaymentPromise = moyaCreatePayment(data.premium_due, clientNumber, data.policyNumber,`https://vum-webapp-node.azurewebsites.net/MoyaPayPaymentCallback/${clientNumber}` , "Santam Emerging Business Insurance Policy Schedule Inception");
    promises = [googleMapsPromise, what3WordsPromise, moyaPayPaymentPromise];
  } else {
    // Implement pay@ API call.
    // For now do nothing.
    promises = [googleMapsPromise, what3WordsPromise];
  }

  res.status(200).json(
    { success: true, 
      message: 'Policy data populated successfully', 
      data: {
        pro_rata: data.pro_rata,
        premium_due: data.premium_due,
        policyNumber: data.policyNumber
      } 
    }
  );
  try{
    // Finish with promises
    const [googleMapsData, what3WordsData, moyaPayPaymentResult] = await Promise.all(promises);
    // Adding the google maps and what 3 words data to the policy data
    console.log(`\n\nGOOGLE MAPS DATA: ${JSON.stringify(googleMapsData)}`);
    data.googlePlus = googleMapsData.plus_code.global_code;
    data.what3Words = what3WordsData.words;

    let establishment = '';
    let route = '';

    googleMapsData.results[0].address_components.forEach(component => {
        if (component.types.includes('establishment')) {
            establishment = component.long_name;
        }
        else if (component.types.includes('route')) {
            route = component.long_name;
        }
        else if (component.types.includes('sublocality_level_1')) {
            data.suburb = component.long_name;
        }
        else if (component.types.includes('locality')) {
            data.area = component.long_name;
        }
        else if (component.types.includes('administrative_area_level_1')) {
            data.province = component.long_name;
        }
        else if (component.types.includes('postal_code')) {
            data.postalCode = component.long_name;
        }
    });
    
    // Concatenate establishment and route to form street
    if (establishment !== '' && route !== '') {
        data.street = `${establishment}, ${route}`;
    } else if (establishment !== '') {
        data.street = establishment;
    } else {
        data.street = route;
    }
    
    // If any field is not set, assign it as ''
    const keys = ['street', 'suburb', 'area', 'province', 'postalCode'];
    for (let key of keys) { if (!data.hasOwnProperty(key) || data[key] === undefined) { data[key] = '';}}
  
    // Adding client data to the client table
    try{ clientTableClient.updateEntity(data)} catch {clientTableClient.createEntity(data)}
  
    // Returning moya pay payment result
    const paymentID = data.paymentType === "MoyaPay" ? moyaPayPaymentResult.paymentID : "Pay@";
    const paymentData = {
      partitionKey: "",
      rowKey: clientNumber,
      paymentID: paymentID,
    }
    try{ await moyaPayIDsTableClient.updateEntity(paymentData)} catch {await moyaPayIDsTableClient.createEntity(paymentData)}
} catch (error) {
  console.log(`ERROR IN POPULATING POLICY DATA: ${error}`)
    try{
        const errorOutput = JSON.stringify(error)
        const timestamp = new Date()
        console.log("Logging error")
        console.log(`TYPE OF ERROR: ${typeof errorOutput}`)
        console.log(`TYPE OF clientNumber: ${typeof clientNumber}`)
        console.log(`TYPE OF data: ${typeof data}`)
        console.log(`TYPE OF new Date(): ${typeof new Date()}`)
        let errorData = {participantId: clientNumber, conversationId: "", error: "ERROR in populating data api call", activity: JSON.stringify(data), timestamp: JSON.stringify(timestamp)}
        addSequentialRow(errorLogTable, errorData);
    } catch {
        console.log("ERROR IN LOGGING ERROR!!!!!")
    }
}
});

// This will run once the payment has been made and the callback has been called from MoyaPay.
// It will update the client record in the Azure table with the payment confirmation.
// It will then send the client's policy schedule to the client through the broadcast messaging channel.
router.post('/MoyaPayPaymentCallback/:number', async (req, res, next) => {
  console.log(`MoyaPayPaymentCallback: ${JSON.stringify(req.body)}`)
  const paymentState = req.body.success;
  const clientNumber = req.params.number;
  if (paymentState) {
    console.log("PAYMENT STATE IS TRUE")
    const entity = await clientTableClient.getEntity("", clientNumber);
    if (entity.dataPopulated){
      const filename = `Santam Emerging Business Insurance Policy Schedule Inception - ${entity.policyNumber}.pdf`;
      const pdfURL = await getAndFillInceptionPDF(entity, filename);
  
      console.log(`PDF URL: ${JSON.stringify(pdfURL)}`)
  
      entity.sasUrl = pdfURL;
      entity.pdfScheduleSent = true;
      entity.incepted = true;
  
      clientTableClient.updateEntity(entity);
  
      await uploadFileAndSendMessage(pdfURL, clientNumber)
        .catch((error) => {
        console.error("Error uploading File and sending message to Moya:", error);
      });
  
      console.log(`CLIENT NUMBER: ${clientNumber}`)
      await moyaBridgeMessage(clientNumber, "PAYMENT APPROVED_xa#r5Go9t")
        .then((response) => {
          res.status(200).json({ success: true});
        })
        .catch((error) => {
          res.status(500).json({ success: false });
        });
    } else {
      await moyaBridgeMessage(clientNumber, "PAYMENT APPROVED BUT DATA NOT POPULATED_xa#r5Go9t")
        .then((response) => {
          res.status(200).json({ success: true, message: "PAYMENT APPROVED BUT DATA NOT POPULATED"});
        }
        )
        .catch((error) => {
          console.error("Error sending bridge message to Moya:", error);
          res.status(500).json({ success: false, message: "PAYMENT APPROVED BUT DATA NOT POPULATED BUT ERROR SENDING BRIDGE MESSAGE"});
        });
    }

  } else {
    await moyaBridgeMessage(clientNumber, "PAYMENT CANCELED_xa#r5Go9t")
      .then((response) => {
        res.status(200).json({ success: true, message: "PAYMENT CANCELED"});
      })
      .catch((error) => {
        console.error("Error sending bridge message to Moya:", error);
        res.status(500).json({ success: false, message: "PAYMENT CANCELED BUT ERROR SENDING BRIDGE MESSAGE"});
      });
  }

  
});

// Logging the claim
router.post('/api/logclaim', async(req, res, next) => {
  const claimData = req.body;
  const clientData = await clientTableClient.getEntity("", claimData.ClientNumber);
  if(!claimData.LossAddress){
    claimData.LossAddress = clientData.googlePlus;
  }
  const data = { 
    ...claimData, 
    FirstName: clientData.firstName,
    LastName: clientData.lastName,
    BusinessName: clientData.businessName,
  }
  console.log(`DATA: ${JSON.stringify(data)}`);
  addSequentialRow(claimTableClient, data);
  res.status(200).json({ success: true });
});

// Logging clients question
router.post('/api/askquestion', async(req, res, next) => {
  const questionData = req.body;
  const clientData = await clientTableClient.getEntity("", questionData.ClientNumber);
  const data = {
    ...questionData,
    FirstName: clientData.firstName,
    LastName: clientData.lastName,
    BusinessName: clientData.businessName,
    CoverOption: clientData.coverOption,
  }
  console.log(`DATA: ${JSON.stringify(data)}`);
  addSequentialRow(questionTableClient, data);
  res.status(200).json({ success: true });
});

// Logging cancellation request
router.post('/api/cancelpolicy', async(req, res, next) => {
  const cancellationData = req.body;
  const clientData = await clientTableClient.getEntity("", cancellationData.ClientNumber);
  const data = {
    ...cancellationData,
    FirstName: clientData.firstName,
    LastName: clientData.lastName,
    BusinessName: clientData.businessName,
    CoverOption: clientData.coverOption,
  }
  console.log(`DATA: ${JSON.stringify(data)}`);
  addSequentialRow(cancellationTableClient, data);
  clientData.incepted = false;
  clientData.cancelled = true;
  clientTableClient.updateEntity(clientData);
  res.status(200).json({ success: true });
});

// CFE form submission
router.post('/api/cfe', async(req, res, next) => {
  const data = req.body;
  console.log(`DATA: ${JSON.stringify(data)}`);

  // Create CFE Registration Record in Azure Table Storage
  try {
    const entity = await cfeRegistrationTable.getEntity("", data.phoneNumber);
    entity.didNumber = data.didNumber;
    entity.businessOwner = data.businessOwner;
    entity.businessType = data.businessType;
    entity.businessName = data.businessName;
    entity.nameSurname = data.nameSurname;
    entity.businessTurnover = data.businessTurnover;
    await cfeRegistrationTable.updateEntity(entity);
  } catch {
    const uploadData = {
      partitionKey: "",
      rowKey: data.phoneNumber,
      didNumber: data.didNumber,
      businessOwner: data.businessOwner,
      businessType: data.businessType,
      businessName: data.businessName,
      nameSurname: data.nameSurname,
      businessTurnover: data.businessTurnover,
    }
    await cfeRegistrationTable.createEntity(uploadData);
  }
  
  // Set the cookie to last for 2 months
  res.cookie('cfe-form-completed', 'true', { maxAge: 5184000000, httpOnly: true });
  
  return res.status(200).json({ success: true });
});

// CFE training quiz
router.post('/api/cfeTrainingQuiz', async(req, res, next) => {
  const data = req.body;

  console.log(`DATA: ${JSON.stringify(data)}`)
  // Create/Update CFE Training Quiz Record Table in Azure Table Storage
  let cfeQuizData;
  try {
    cfeQuizData = await cfeQuizTableResults.getEntity("", data.phoneNumber);
  } catch {
    let newEntity = {
      partitionKey: "", 
      rowKey: data.phoneNumber, 
      q1: data.q1,
      q2a1: data.q2[0],
      q2a2: data.q2[1],
      q2a3: data.q2[2],
      q3: data.q3,
      q4: data.q4,
      q5: data.q5,
      q6: data.q6,
      q7: data.q7,
      q8step1: data.q8.step1,
      q8step2: data.q8.step2,
      q8step3: data.q8.step3,
      q9: data.q9,
      q10: data.q10,
      idNumber: data.idNumber,
      nameSurname: data.nameSurname,
    }
    console.log(`NEW ENTITY: ${JSON.stringify(newEntity)}`)
    cfeQuizData = await cfeQuizTableResults.createEntity( newEntity );
  }

  // Check answers for each question
  let correctAnswers = 0;
  if (data.q1 == "partnership") correctAnswers++;
  if (data.q2.includes("individual") && data.q2.includes("employer") && data.q2.includes("business_owner")) correctAnswers++;
  if (data.q3 == "false") correctAnswers++;
  if (data.q4 == "q4option3") correctAnswers++;
  if (data.q5 == "q5option2") correctAnswers++;
  if (data.q6 == "q6option4") correctAnswers++;
  if (data.q7 == "true") correctAnswers++;
  let q8Correct = true;
  if (data.q8.step1 !== "calc_revenue") { q8Correct = false; } 
  else if (data.q8.step2 !== "id_list_expenses") { q8Correct = false; } 
  else if (data.q8.step3 !== "budget_big_costs") { q8Correct = false; }
  if (q8Correct) correctAnswers++;
  if (data.q9 == "true") correctAnswers++;
  if (data.q10 == "true") correctAnswers++;

  if(correctAnswers == 10){
    // Produce and send certificate
  }
  res.status(200).json({ success: true, correctAnswers });
});

// This will run when the client clicks on the "Business Insurance" Tile in the moya app.
// It will render the web page and the business activity form.
router.get('/', async(req, res, next) => {
    const xBinuDid = req.query['x-binu-did'];
    if(!xBinuDid){
        return res.status(200).json({ success: true, message: 'Viewed outside of MoyaApp' });
    }
    console.log(`DID: ${xBinuDid}`)
    let userMetaDataMoya = "";
    // Get Client Phone Number from DID Number
    console.log(`X-BINU-DID: ${xBinuDid}`)
    try{
    userMetaDataMoya = await getMoyaMetaData(xBinuDid);
    } catch (error) {
        console.error('Error getting Moya Meta Data:');
        return res.status(200).json({ success: true, message: 'Moya id invalid' });
    }
    console.log(`CLIENT MOYA DATA: ${JSON.stringify(userMetaDataMoya)}`);
    console.log(`CLIENT NUMBER: ${userMetaDataMoya.number}`)
    const clientNumber = userMetaDataMoya.number;
    try{
      const entity = await clientTableClient.getEntity("", clientNumber);
      console.log(`CLIENT ENTITY: ${JSON.stringify(entity)}`)
      if (entity.incepted){
        // redirect to client portal route in line 395
        return res.redirect(`/clientPortal?clientNumber=${clientNumber}&policyNumber=${entity.policyNumber}`);
      }
    } catch(error){/* pass */ }
    return res.render(
        'inception',
        {
            businessActivity: ['Advertising Agency','Airtime Sales','Audio Visual Production','Bakery','Barber','Beauty Spa','Bed and Breakfast','Butchery','Car Wash','Carpentry','Catering Services','Cell Phone Shop','Cleaning Service','Clothing Shop','Coffee Shop','Delivery','Design and Print','DJ','Dry Cleaner','Events Coordinator','Fast Food Delivery','Fast Food Outlet','Fencing','Fresh Produce Store','Furniture Mover','Furniture Shop','Garden Services','General Maintenance','General Movers','Glass Fitment','Graphic Designer','Hair Extensions Sales','Hair Salon','Handyman','Hardware Store','High-Pressure Cleaning','Hiring Business - Wedding Attire','Internet Cafe','Liquor Store','Mobile Car Wash','Mobile Kitchen','Motor Mechanic','Musician','Paint Contractor','Part and Spares Shop','Pest Control','Photographer','Plumber','Pool Maintenance','Printing and Copying Services','Sales - Cosmetics','Second-hand Shop','Sound and AV Fitment','Sound Technician','Spaza Shop','Tailor','Tavern','Upholsterer', 'Waste Pickers'],
            xBinuDid: xBinuDid,
            number: clientNumber,
        }
    );
  }
);

router.get('/clientPortal', async(req, res, next) => {
  return res.render(
    'clientPortal',
    {
      clientNumber: req.query['clientNumber'],
      policyNumber: req.query['policyNumber'],
    }
    );
});

router.get('/cfe', async(req, res, next) => {
  const xBinuDid = req.query['x-binu-did'];
  if(!xBinuDid){
    return res.redirect('moya://app.moya.biz.training')
  }
  let userMetaDataMoya = "";
  // Get Client Phone Number from DID Number
  try {
    userMetaDataMoya = await getMoyaMetaData(xBinuDid);
  } catch (error) {
    console.error('Error getting Moya Meta Data:');
    return res.status(200).json({ success: true, message: 'Moya id invalid' });
  }
  try {
    const entity = await cfeRegistrationTable.getEntity("", userMetaDataMoya.number);
    console.log(`ENTITY: ${JSON.stringify(entity)}`)
    return res.render('cfeTraining', {number : entity.rowKey});
  } catch (error) {
    console.log(`ERROR: ${error}`);
  }
  return res.render(
    'cfeCampaign',
    {
      xBinuDid: xBinuDid,
      number: userMetaDataMoya.number,
    }
  );
});

router.get('/cfeRegistered', async (req, res, next) => {
  return res.render('cfeRegistered');
});

router.get('/cfeTraining', async(req, res) => {
  const number = req.query['number'];
  return res.render('cfeTraining', {number});
});

// Helper to serve the CFE Training video
router.get('/cfe-training-serve-video', (req, res) => {
  const videoPath = path.join(__dirname, "./cfe_training/CFE Training Video.mp4");
  const stat = fs.statSync(videoPath);
  const fileSize = stat.size;
  const range = req.headers.range;

  if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] 
          ? parseInt(parts[1], 10) 
          : fileSize-1;

      const chunkSize = (end-start)+1;
      const file = fs.createReadStream(videoPath, {start, end});
      const head = {
          'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunkSize,
          'Content-Type': 'video/mp4',
      };
      res.writeHead(206, head);
      file.pipe(res);
  } else {
      const head = {
          'Content-Length': fileSize,
          'Content-Type': 'video/mp4',
      };
      res.writeHead(200, head);
      fs.createReadStream(videoPath).pipe(res);
  }
});

router.get('/cfeTrainingQuestions', async(req, res) => {
  // Get number parameter
  const number = req.query['number'];
  if(!number){
    return res.status(400).send('Missing number parameter');
  }
  res.render('cfeTrainingQuestions', {number});
});

router.get('/api/health', (req, res, next) => {
  res.send(200, 'Healthy');
  next();
});

// FUNCTIONS
async function getMoyaMetaData(xBinuDidParam) {
  return new Promise(async (resolve, reject) => {
    let config = {
      method: 'get',
      maxBodyLength: Infinity,
      url: `https://api.moya.app/v1/users/${xBinuDidParam}`,
      headers: {
        'Authorization': `Bearer ${moyaToken}`,
      },
    };

    try {
      const response = await axios.request(config);
      resolve(response.data.user_profile);
    } catch (error) {
      console.log("ERROR IN GETTING MOYA METADATA: ");
      reject(error);
    }
  });
}

async function startDataRequestMoya(clientNumber){
  return new Promise(async (resolve, reject) => {
    let data = JSON.stringify({
    "reason": "Santam Business Insurance would like access to your information",
    "data": [
      {
        "property": "first_name",
        "reason": "Required for your policy",
        "required": true
      },
      {
        "property": "last_name",
        "reason": "Required for your policy",
        "required": true
      },
      {
        "property": "number",
        "reason": "Required for your policy",
        "required": true
      },
      {
        "property": "id_number",
        "reason": "Required for your policy",
        "required": true
      },
      {
        "property": "citizenship",
        "reason": "Required for your policy",
        "required": true
      },
      {
        "property": "device_make",
        "reason": "Required for your policy",
        "required": true
      },
      {
        "property": "device_model",
        "reason": "Required for your policy",
        "required": true
      },
      {
        "property": "device_tac",
        "reason": "Required for your policy",
        "required": true
      },
      {
        "property": "display_name",
        "reason": "Required for your policy",
        "required": true
      }
    ]
    });
    let config = {
      method: 'post',
      maxBodyLength: Infinity,
      url: `https://kyc-api.moya.app/v1/user_data/start/${clientNumber}?auto_accept_all=true`,
      headers: { 
        'Authorization': `Bearer ${moyaToken}`,
        'Content-Type': 'application/json'
      },
      data : data
    };
    try {
      const response = await axios.request(config);
      resolve(response.data);
    }
    catch (error) {
      // console.log(error);
      reject(error);
    }
  }); 
}
  
async function fetchDataRequestMoya(requestID){
  return new Promise(async (resolve, reject) => {
    let config = {
      method: 'get',
      maxBodyLength: Infinity,
      url: `https://kyc-api.moya.app/v1/user_data/fetch/${requestID}`,
      headers: { 
        'Authorization': `Bearer ${moyaToken}`,
      }
    };
    
    try {
      const response = await axios.request(config);
      resolve(response.data);
    }
    catch (error) {
      // console.log(error);
      reject(error);
    }
  });
}

function getProRataAmount(inceptionDateChosen, totalPremiumExclSasria){
  const date = new Date(inceptionDateChosen);
  let pro_rata = true;
  let premium_due = 0;
  let pro_rata_amt = 0;
  if(date.getDate() < 10){
      pro_rata = false;
      premium_due = totalPremiumExclSasria + 5;
      return {pro_rata, premium_due};
  } else {
      // calculate the days remaining in the current month
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const nextMonthFirstDay = new Date(year, month, 1);

      const millisecondsPerDay = 24 * 60 * 60 * 1000;
      const differenceInMilliseconds = nextMonthFirstDay - date;
      const daysRemaining = Math.floor(differenceInMilliseconds / millisecondsPerDay);

      // calculate the pro rata amount
      pro_rata_amt = parseFloat((((totalPremiumExclSasria * 12)/365) * daysRemaining).toFixed(2)) + 5;
      premium_due = parseFloat((totalPremiumExclSasria + pro_rata_amt).toFixed(2)) + 5;
      return {pro_rata, premium_due, pro_rata_amt};
  }
}

async function getNextPolicyNumber() {
  while (true) {
    try {
      console.log("TRY STATEMENT")
      // Retrieve the entity containing the latest policy number
      const entity = await policyNumberTableClient.getEntity("newPolicyNumberPK", "newPolicyNumberRK");
      console.log(`E-Tag: ${entity.etag}`)    
      // Increment the policy number
      const newPolicyNumber = parseInt(entity.policyNumber) + 1;
      // Update the entity with the new policy number
      console.log(`Entity: ${JSON.stringify(entity)}`)
      await policyNumberTableClient.updateEntity(
        { ...entity, policyNumber: newPolicyNumber.toString() },
        "Replace",
        { etag: entity.etag }
      );
      // Return the new policy number
      return newPolicyNumber;
    } catch (error) {
      // If the update operation fails due to an ETag mismatch, retry the process
      if (error.statusCode === 412) {
        console.log('ETag mismatch, retrying...');
        continue;
      }

      // If an error other than an ETag mismatch occurs, throw the error
      throw error;
    }
  }
}

async function getAndFillInceptionPDF(clientObject, filename){
  const outputContainerName = "policy-schedules";
  const today = formatString(new Date());
  console.log(`Today's date: ${today}`)
  console.log("getAndFillInceptionPDF")
  const pdfDoc = 
      await PDFDocument.load(
          fs.readFileSync(
              path.join(
                  tempalte_path, 
                  'Santam Emerging Business Insurance Policy Schedule - Template.pdf'
                  )
              )
          );
  
  console.log(`FORM DATA ${JSON.stringify(clientObject)}`)
  
  let stock_and_contents_sum_insured;
  let PA_sum_insured;
  let BA_make;
  let BA_model;
  let TAC_number;
  let BA_sum_insured;

  switch(clientObject.coverOption){
    case "Starter":
      stock_and_contents_sum_insured = "R 30 000.00";
      PA_sum_insured = "R 25 000.00";
      BA_make = "COVER NOT TAKEN";
      BA_model = "COVER NOT TAKEN";
      TAC_number = "COVER NOT TAKEN";
      BA_sum_insured = "COVER NOT TAKEN";
      break;
    case "Standard":
      stock_and_contents_sum_insured = "R 50 000.00";
      PA_sum_insured = "R 25 000.00";
      BA_make = clientObject.deviceMake;
      BA_model = clientObject.deviceModel;
      TAC_number = clientObject.deviceTac;
      BA_sum_insured = "R 2 500.00";
    break;
    case "Premium":
      stock_and_contents_sum_insured = "R 100 000.00";
      PA_sum_insured = "R 50 000.00";
      BA_make = clientObject.deviceMake;
      BA_model = clientObject.deviceModel;
      TAC_number = clientObject.deviceTac;
      BA_sum_insured = "R 5 000.00";
    break;
  }

  const form = pdfDoc.getForm();
  const policyNumber = form.getTextField('PolicyNumber');
  const inceptioNDate = form.getTextField('InceptionDate');
  const insured = form.getTextField('Insured');
  const cellNumber = form.getTextField('CellNumber');
  const googlePlusCode = form.getTextField('Google Plus Code');
  const what_3_Words = form.getTextField('What3Words');
  const policyPremiumNett = form.getTextField('PolicyPremiumNett');
  const policyPremiumVat = form.getTextField('PolicyPremiumVat');
  const PolicyPremiumTotal = form.getTextField('PolicyPremiumTotal');
  const sasriaNett = form.getTextField('SasriaNett');
  const sasriaVat = form.getTextField('SasriaVat');
  const sasriaTotal = form.getTextField('SasriaTotal');
  const totalNett = form.getTextField('TotalNett');
  const totalVat = form.getTextField('TotalVat');
  const total = form.getTextField('Total');
  const date = form.getTextField('Date');
  // const datePrinted1 = form.getTextField('DatePrinted1');
  // const datePrinted2 = form.getTextField('DatePrinted2');
  // const datePrinted3 = form.getTextField('DatePrinted3');
  // const datePrinted4 = form.getTextField('DatePrinted4');
  // const datePrinted5 = form.getTextField('DatePrinted5');
  // const datePrinted6 = form.getTextField('DatePrinted6');
  const descriptionGooglePlusCode = form.getTextField('DescriptionGoogle Plus Code');
  const descriptionWhat3Words = form.getTextField('DescriptionWhat3Words');
  const descriptionBusinessAddress = form.getTextField('DescriptionBusiness Address');
  const descriptionAreaOrSuburb = form.getTextField('DescriptionArea or Suburb');
  const descriptionPostalCode = form.getTextField('DescriptionPostal Code');
  const descriptionProvinceOrRegion = form.getTextField('DescriptionProvince or Region');
  const descriptionBusinessActivity = form.getTextField('DescriptionBusiness Activity');
  const decscriptionCoverOptionChosen = form.getTextField('DescriptionCover Option Chosen'); 
  const descriptionSumInsured = form.getTextField('DescriptionSum Insured');
  const descriptionInsuredName = form.getTextField('DescriptionInsured Name');
  const descriptionIDOrPassportNumber = form.getTextField('DescriptionID or Passport Number');
  const descriptionNationality = form.getTextField('DescriptionNationality');
  const descriptionPASumInsured = form.getTextField('DescriptionSum Insured_2');
  const descriptionMake = form.getTextField('DescriptionMake');
  const descriptionModel = form.getTextField('DescriptionModel');
  const descriptionSerialNumber = form.getTextField('DescriptionSerial Number');
  const descriptionSumInsured_3 = form.getTextField('DescriptionSum Insured_3');

  policyNumber.setText(clientObject.policyNumber.toString());
  inceptioNDate.setText(clientObject.inceptionDate.toString());
  insured.setText(clientObject.businessName);
  cellNumber.setText(clientObject.rowKey);
  googlePlusCode.setText(clientObject.googlePlus);
  what_3_Words.setText(clientObject.what3Words);
  policyPremiumNett.setText(formatCurrency(clientObject.premium_nett_excl_sasria));
  policyPremiumVat.setText(formatCurrency(clientObject.premium_vat_excl_sasria));
  PolicyPremiumTotal.setText(formatCurrency(clientObject.premium_excl_sasria));
  sasriaNett.setText('R 4.35');
  sasriaVat.setText('R 0.65');
  sasriaTotal.setText('R 5.00');
  totalNett.setText(formatCurrency(clientObject.premium_nett_incl_sasria));
  totalVat.setText(formatCurrency(clientObject.premium_vat_incl_sasria));
  total.setText(formatCurrency(clientObject.premium_incl_sasria));
  date.setText(today);
  console.log("FIRST PAGE DONE")
  // datePrinted1.setText(`Printed on: ${today}`);
  // datePrinted2.setText(`Printed on: ${today}`);
  // datePrinted3.setText(`Printed on: ${today}`);
  // datePrinted4.setText(`Printed on: ${today}`);
  // datePrinted5.setText(`Printed on: ${today}`);
  // datePrinted6.setText(`Printed on: ${today}`);
  descriptionGooglePlusCode.setText(clientObject.googlePlus);
  descriptionWhat3Words.setText(clientObject.what3Words);
  descriptionBusinessAddress.setText(clientObject.street);
  descriptionAreaOrSuburb.setText(clientObject.suburb);
  descriptionPostalCode.setText(clientObject.postalCode);
  descriptionProvinceOrRegion.setText(clientObject.province);
  descriptionBusinessActivity.setText(clientObject.businessActivity);
  decscriptionCoverOptionChosen.setText(clientObject.coverOption);
  descriptionSumInsured.setText(stock_and_contents_sum_insured);
  descriptionInsuredName.setText(`${clientObject.firstName} ${clientObject.lastName}`);
  descriptionIDOrPassportNumber.setText(clientObject.idNumber);
  descriptionNationality.setText(clientObject.citizenship);
  descriptionPASumInsured.setText(PA_sum_insured);
  descriptionMake.setText(BA_make);
  descriptionModel.setText(BA_model);
  descriptionSerialNumber.setText(TAC_number);
  descriptionSumInsured_3.setText(BA_sum_insured);

  console.log("FORM FINISHED")
  form.flatten();

  const pdfBytes_output = await pdfDoc.save();

  const containerClient = policyScheduleBlobClient.getContainerClient(outputContainerName);
  const blockBlobClient = containerClient.getBlockBlobClient(filename);
  await blockBlobClient.upload(pdfBytes_output, pdfBytes_output.length);
  
  const pdfURL = generateBlobSasUrl(filename, outputContainerName);

  return pdfURL;
}

async function getAndFillCFECertificatePDF(clientObject, filename){
  const outputContainerName = "cfe-certificates";
  const today = formatString(new Date());
  console.log(`Today's date: ${today}`)
  console.log("getAndFillCFECertificatePDF")
  const pdfDoc = 
      await PDFDocument.load(
          fs.readFileSync(
              path.join(
                  tempalte_path, 
                  'CFE Certificate - Template.pdf'
                  )
              )
          ).getForm();
  // Get form fiels
  const nameSurname = pdfDoc.getTextField('Name & Surname');
  const idNumber = pdfDoc.getTextField('ID Number');
  const date = pdfDoc.getTextField('Date Completed');

  // Fill out form fields
  nameSurname.setText(clientObject.nameSurname);
  idNumber.setText(clientObject.idNumber);
  date.setText(today);
}

function generateBlobSasUrl(blobName, containerName, expiresInDays = 180) {
  const now = new Date();
  const expiresOn = new Date(now.getTime() + expiresInDays * 24 * 60 * 60 * 1000);

  const sasPermissions = new BlobSASPermissions();
  sasPermissions.read = true;

  const sasQueryParameters = generateBlobSASQueryParameters(
    {
      containerName,
      blobName,
      permissions: sasPermissions,
      startsOn: now,
      expiresOn,
      protocol: SASProtocol.Https,
    },
    sharedKeyCredential
  );

  const sasToken = sasQueryParameters.toString();
  const sasUrl = `https://${storageAccount}.blob.core.windows.net/${containerName}/${blobName}?${sasToken}`;

  return sasUrl;
}

function formatString(dateParam){
  const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
  let day = dateParam.getDate();
  let month = monthNames[dateParam.getMonth()];
  let year = dateParam.getFullYear();
  // This arrangement can be altered based on how we want the date's format to appear.
  return `${day}-${month}-${year}`
}

function formatCurrency(num){
  const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 2
      });
  const formattedNum = formatter.format(num);
  return formattedNum.replace('ZAR', 'R ');
}

async function moyaBridgeMessage(number, body) {
  return new Promise((resolve, reject) => {
    let data = JSON.stringify({
      "message": {
        "type": "text",
        "from": number,
        "text": {
          "body": body
        }
      }
    });
    
    let config = {
      method: 'post',
      maxBodyLength: Infinity,
      url: 'https://messaging-bridge.moya.app/v1/webhook/27700008020',
      headers: { 
        'Authorization': `Bearer ${moyaToken}`, 
        'Content-Type': 'application/json'
      },
      data : data
    };
    
    axios.request(config)
    .then((response) => {
      resolve(response.data);
    })
    .catch((error) => {
      console.log(`==================\nError in bridge Message: ${number}\n==================`)
      reject(error);
    });
  });
}

/**
 * Create a Moya payment
 @params amount - the amount to be paid
 @params number - the client phone number that the payment is being sent to
 @params policyNumber - the policy number that the payment is being created for
 @params webhookURL - the webhook URL that will be called when the payment is completed
 @params reference - the reference that will be displayed on the payment
 */
async function moyaCreatePayment(amount, number, policyNumber, webhookURL, reference){
  return new Promise((resolve, reject) => {
    let data = JSON.stringify({
      "amount": amount*100,
      "redirectUrl": "https://moya://27700008020",
      "webhookUrl": webhookURL,
      "username": `${number}`,
      "reference": `${reference} - ${policyNumber}`
    });
    console.log(`DATA: ${data}`)
    let config = {
      method: 'post',
      maxBodyLength: Infinity,
      url: 'https://gateway.payments.moyapayd.app/payments/',
      headers: { 
        'Content-Type': 'application/json', 
        'Authorization': `Bearer ${moyaPayToken}`
      },
      data : data
    };

    axios.request(config)
    .then((response) => {
      resolve(response.data);
    })
    .catch((error) => {
      console.log(`\n====================\nMoya Create Payment Error: ${number}\n====================\n`);
      reject(error);
    });
  });
}

async function moyaPayCheck(clientNumber){
  return new Promise(async (resolve, reject) => {
      let config = {
        method: 'get',
        maxBodyLength: Infinity,
        url: `https://gateway.payments.moyapayd.app/customers/${clientNumber}/check`,
        headers: {
          'Authorization': `Bearer ${moyaPayToken}`, 
        },
      };
  
      try {
        const response = await axios.request(config);
        resolve(response.data);
      } catch (error) {
        console.log(`\n====================\nMoya Pay Check Error: ${clientNumber}\n====================\n`);
        reject(error);
      }
    });
}

/**
 * Fetches data from the API enpoint and returns the data
 @params endpoint - the API enpoint with no parameters
 @params args - the parameters to be passed to the endpoint
 */
 async function getAPIData(endpoint,...args) { 
  let parameters = "";
  for (let i = 0; i < args.length; i++) {
      parameters += "&" + args[i];
  }
  const endpointUrl = `${endpoint}?${parameters}`;
  try {
      const response = await axios.get(endpointUrl);
      return response.data;
  } catch (error) {
      console.log(error);
  }
}

async function uploadFileAndSendMessage(fileUrl, phoneNumber) {
  try {
    // Step 1: Upload the file
    const data = new FormData();
    data.append('url', fileUrl);

    console.log(`DATA: ${fileUrl}`);

    const uploadConfig = {
      method: 'post',
      maxBodyLength: Infinity,
      url: 'https://api.moya.app/v1/upload_file',
      headers: {
        'Authorization': `Bearer ${moyaToken}`,
        ...data.getHeaders()
      },
      data: data
    };

    let uploadResponse
    await axios.request(uploadConfig)
      .then((response) => {
        uploadResponse = response;
        console.log(`UPLOAD RESPONSE ${JSON.stringify(uploadResponse.data)}`);
      })
      .catch((error) => {
        console.error("Error uploading file to Moya:", error);
      });
    const uploadedUrl = uploadResponse.data.url;
    
    // Step 2: Send the message's
    let initialMessageData = JSON.stringify({
      "to": phoneNumber,
      "recipient_type": "individual",
      "type": "text",
      "text": {
        "body": "Thank you for choosing Santam Business Insurance.\nKindly see below for your policy schedule."
      }
    });
    
    let initialMessageConfig = {
      method: 'post',
      maxBodyLength: Infinity,
      url: 'https://api.moya.app/v1/message',
      headers: { 
        'Content-Type': 'application/json', 
        'Authorization': `Bearer ${moyaToken}`,
      },
      data : initialMessageData
    };
    
    axios.request(initialMessageConfig)
    .then((response) => {
      console.log(JSON.stringify(response.data));
    })
    .catch((error) => {
      console.log(error);
    });

    const messageData = JSON.stringify({
      "to": phoneNumber,
      "recipient_type": "individual",
      "type": "file",
      "file": {
        "url": uploadedUrl
      }
    });

    const messageConfig = {
      method: 'post',
      maxBodyLength: Infinity,
      url: 'https://api.moya.app/v1/message',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${moyaToken}`,
      },
      data: messageData
    };

    const messageResponse = await axios.request(messageConfig);
    console.log(`MESSAGE RESPONSE ${JSON.stringify(messageResponse.data)}`);

  } catch (error) {
    console.log(error);
  }
}

async function addSequentialRow(tableClient, data) {
  // Query the table to find the highest existing RowKey.
  const tableEntities = tableClient.listEntities({
    queryOptions: { filter: `PartitionKey eq ''` },
    select: ["RowKey"]
  });

  let maxRowKey = 0;

  for await (const entity of tableEntities) {
    let rowKey = parseInt(entity.rowKey);
    if (rowKey > maxRowKey) {
      maxRowKey = rowKey;
    }
  }

  // Increment maxRowKey by 1 for the new row.
  const newRowKey = maxRowKey + 1;

  // Create a new row with the given data, plus the new RowKey.
  const newRow = { ...data, partitionKey:'', rowKey: newRowKey.toString()};
  const createEntityResponse = await tableClient.createEntity(newRow);

  return createEntityResponse;
}

function createTableClient(storageAcc, tableName, cred) {
  return new TableClient(`https://${storageAcc}.table.core.windows.net/`,tableName,cred)
}

module.exports = router;