/**
 * GOOGLE APPS SCRIPT - Database Backup API v3 (SQL)
 * 
 * HƯỚNG DẪN CÀI ĐẶT:
 * 1. Vào Google Drive > Tạo Google Sheet mới (đặt tên: "Database Backups")
 * 2. Vào Extensions > Apps Script
 * 3. Xóa code mặc định, dán toàn bộ code này vào
 * 4. Lưu (Ctrl+S)
 * 5. Deploy > New deployment
 *    - Select type: Web app
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 6. Click Deploy > Authorize (cho phép quyền)
 * 7. Copy URL Web app (dạng: https://script.google.com/macros/s/xxxxx/exec)
 * 8. Dán URL vào file .env: GOOGLE_SHEET_API=URL
 * 
 * API Endpoints:
 * - POST: Thêm backup mới (SQL format trong ô A1)
 * - GET?action=list: Lấy danh sách backup
 * - GET?action=download&sheet=NAME: Tải backup cụ thể
 */

function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);
    
    if (payload.action === 'backup') {
      const now = new Date();
      const vnDate = Utilities.formatDate(now, 'Asia/Ho_Chi_Minh', 'dd/MM/yyyy HH:mm:ss');
      
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      
      // Lấy hoặc tạo sheet "main"
      let mainSheet = ss.getSheetByName('main');
      if (!mainSheet) {
        mainSheet = ss.insertSheet('main');
        // Tạo header
        mainSheet.appendRow(['id', 'ngày', 'sql']);
        mainSheet.getRange(1, 1, 1, 3).setFontWeight('bold').setBackground('#4285f4').setFontColor('white');
        mainSheet.setColumnWidth(1, 100);
        mainSheet.setColumnWidth(2, 180);
        mainSheet.setColumnWidth(3, 800);
      }
      
      // Tạo ID tự động (timestamp + random)
      const backupId = 'BK_' + Utilities.formatDate(now, 'Asia/Ho_Chi_Minh', 'yyyyMMdd_HHmmss');
      
      // Lấy SQL data
      const sqlData = payload.data || '';
      
      // Thêm dòng mới vào sheet main: id | ngày | sql
      mainSheet.appendRow([backupId, vnDate, sqlData]);
      
      // Giữ tối đa 20 backup (xóa dòng cũ nhất nếu vượt quá)
      cleanupOldBackupsInMain(20);
      
      return ContentService
        .createTextOutput(JSON.stringify({
          success: true,
          message: 'SQL backup saved with ID: ' + backupId,
          id: backupId,
          date: vnDate,
          size: sqlData.length
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: 'Unknown action' }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function cleanupOldBackupsInMain(maxBackups) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const mainSheet = ss.getSheetByName('main');
  if (!mainSheet) return;
  
  const lastRow = mainSheet.getLastRow();
  // Trừ đi header (dòng 1), số backup = lastRow - 1
  const numBackups = lastRow - 1;
  
  if (numBackups > maxBackups) {
    // Xóa các dòng cũ nhất (từ dòng 2 đến dòng cần xóa)
    const rowsToDelete = numBackups - maxBackups;
    mainSheet.deleteRows(2, rowsToDelete);
  }
}

function doGet(e) {
  try {
    const action = e.parameter.action || 'list';
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    
    if (action === 'list') {
      const mainSheet = ss.getSheetByName('main');
      let backups = [];
      
      if (mainSheet) {
        const lastRow = mainSheet.getLastRow();
        if (lastRow > 1) {
          // Lấy tất cả data từ dòng 2 (bỏ header)
          const data = mainSheet.getRange(2, 1, lastRow - 1, 2).getValues();
          backups = data.map(row => ({
            id: row[0],
            date: row[1]
          })).reverse(); // Mới nhất lên đầu
        }
      }
      
      return ContentService
        .createTextOutput(JSON.stringify({ success: true, backups: backups }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    if (action === 'download') {
      const backupId = e.parameter.id;
      if (!backupId) {
        return ContentService
          .createTextOutput(JSON.stringify({ success: false, error: 'Missing id parameter' }))
          .setMimeType(ContentService.MimeType.JSON);
      }
      
      const mainSheet = ss.getSheetByName('main');
      if (!mainSheet) {
        return ContentService
          .createTextOutput(JSON.stringify({ success: false, error: 'Main sheet not found' }))
          .setMimeType(ContentService.MimeType.JSON);
      }
      
      // Tìm backup theo ID
      const lastRow = mainSheet.getLastRow();
      const data = mainSheet.getRange(2, 1, lastRow - 1, 3).getValues();
      const backup = data.find(row => row[0] === backupId);
      
      if (!backup) {
        return ContentService
          .createTextOutput(JSON.stringify({ success: false, error: 'Backup not found' }))
          .setMimeType(ContentService.MimeType.JSON);
      }
      
      return ContentService
        .createTextOutput(JSON.stringify({ 
          success: true, 
          id: backup[0],
          date: backup[1],
          data: backup[2] 
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: 'Unknown action' }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
