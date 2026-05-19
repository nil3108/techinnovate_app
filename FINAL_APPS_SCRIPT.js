// CNG FUEL TRACKER - COMPLETE AUTO SETUP
// 1. Paste this in script.google.com
// 2. Run setup()
// 3. Deploy as Web App
// 4. Give URL to update app

function setup() {
  Logger.log('=== CNG TRACKER AUTO SETUP ===');
  
  // 1. Create Spreadsheet
  const ss = SpreadsheetApp.create('CNG Fuel Tracker DB');
  const sheetId = ss.getId();
  Logger.log('✓ Sheet created');
  Logger.log('SHEET ID: ' + sheetId);
  
  // 2. Create sheets
  const sheets = [
    {name: 'Owners', headers: ['id', 'name', 'email', 'phone', 'business', 'password', 'status', 'createdAt']},
    {name: 'Drivers', headers: ['id', 'name', 'code', 'assignedVehicleId', 'ownerId', 'status', 'createdAt']},
    {name: 'Vehicles', headers: ['id', 'plate', 'model', 'initialOdo', 'currentOdo', 'capacity', 'ownerId', 'status']},
    {name: 'Fills', headers: ['id', 'vehicleId', 'driverId', 'time', 'station', 'kgs', 'rate', 'total', 'videoUrl', 'pumpPhotoUrl', 'receiptPhotoUrl', 'odoPhotoUrl', 'pumpGPS', 'receiptGPS', 'odoGPS', 'odoReading', 'distanceDiff', 'mismatch', 'fuelDropPercent', 'ownerId', 'verified']},
    {name: 'Alerts', headers: ['id', 'time', 'event', 'user', 'type', 'ownerId', 'resolved']}
  ];
  
  sheets.forEach(s => {
    const sheet = ss.insertSheet(s.name);
    sheet.getRange(1, 1, 1, s.headers.length).setValues([s.headers]);
    sheet.getRange(1, 1, 1, s.headers.length).setFontWeight('bold').setBackground('#EE2726').setFontColor('white');
    sheet.setFrozenRows(1);
  });
  
  // Delete default sheet AFTER creating others
  try { ss.deleteSheet(ss.getSheetByName('Sheet1')); } catch(e) {}
  
  // 3. Add demo data
  ss.getSheetByName('Owners').appendRow(['own1', 'Rajesh Patel', 'owner@demo.com', '9876543210', 'Patel Transport', 'demo123', 'active', new Date().toISOString()]);
  ss.getSheetByName('Drivers').appendRow(['drv1', 'Amit Kumar', '1234', 'veh1', 'own1', 'active', new Date().toISOString()]);
  ss.getSheetByName('Drivers').appendRow(['drv2', 'Suresh Singh', '5678', 'veh2', 'own1', 'active', new Date().toISOString()]);
  ss.getSheetByName('Vehicles').appendRow(['veh1', 'GJ-01-AB-1234', 'Tata Ace CNG', 45000, 47820, 60, 'own1', 'active']);
  ss.getSheetByName('Vehicles').appendRow(['veh2', 'GJ-05-XY-5678', 'Ashok Leyland Dost', 32000, 34150, 75, 'own1', 'active']);
  
  // 4. Create Drive folder
  const folder = DriveApp.createFolder('CNG Fuel Media');
  const folderId = folder.getId();
  folder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  
  // 5. Save config
  PropertiesService.getScriptProperties().setProperties({
    'SHEET_ID': sheetId,
    'DRIVE_FOLDER_ID': folderId
  });
  
  Logger.log('=== COMPLETE ===');
  Logger.log('Sheet: https://docs.google.com/spreadsheets/d/' + sheetId);
  Logger.log('Drive: https://drive.google.com/drive/folders/' + folderId);
  
  return {sheetId, folderId};
}

function doPost(e) {
  try {
    const props = PropertiesService.getScriptProperties();
    const SHEET_ID = props.getProperty('SHEET_ID');
    const DRIVE_ID = props.getProperty('DRIVE_FOLDER_ID');
    const data = JSON.parse(e.postData.contents);
    
    // UPLOAD MEDIA
    if (data.action === 'uploadMedia') {
      const main = DriveApp.getFolderById(DRIVE_ID);
      const plate = (data.vehiclePlate || 'Unknown').replace(/[^a-zA-Z0-9-_]/g, '_');
      const vFolder = getFolder(main, plate);
      const dFolder = getFolder(vFolder, data.fillDate || new Date().toISOString().split('T')[0]);
      const bytes = Utilities.base64Decode(data.base64Data);
      const file = dFolder.createFile(Utilities.newBlob(bytes, data.mimeType, data.fileName));
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      return json({success: true, fileUrl: 'https://drive.google.com/uc?id=' + file.getId(), fileId: file.getId()});
    }
    
    // SAVE FILL
    if (data.action === 'addFill') {
      const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName('Fills');
      sheet.appendRow([
        data.id, data.vehicleId, data.driverId, data.time, data.station,
        Number(data.kgs) || 0, Number(data.rate) || 0, Number(data.total) || 0,
        data.videoUrl || '', data.pumpPhotoUrl || '', data.receiptPhotoUrl || '', data.odoPhotoUrl || '',
        data.pumpGPS || '', data.receiptGPS || '', data.odoGPS || '',
        Number(data.odoReading) || 0, Number(data.distanceDiff) || 0,
        data.mismatch === true, Number(data.fuelDropPercent) || 0,
        data.ownerId, data.verified === true
      ]);
      
      // Update odometer
      try {
        const vSheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName('Vehicles');
        const vals = vSheet.getDataRange().getValues();
        for (let i = 1; i < vals.length; i++) {
          if (vals[i][0] === data.vehicleId) {
            vSheet.getRange(i+1, 5).setValue(Number(data.odoReading) || 0);
            break;
          }
        }
      } catch(e) {}
      
      return json({success: true});
    }
    
    return json({success: false, error: 'Unknown action'});
  } catch(err) {
    return json({success: false, error: err.toString()});
  }
}

function doGet() {
  return json({status: 'CNG API Active', setup: !!PropertiesService.getScriptProperties().getProperty('SHEET_ID')});
}

function getFolder(parent, name) {
  const f = parent.getFoldersByName(name);
  return f.hasNext() ? f.next() : parent.createFolder(name);
}

function json(d) {
  return ContentService.createTextOutput(JSON.stringify(d)).setMimeType(ContentService.MimeType.JSON);
}