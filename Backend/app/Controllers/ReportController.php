<?php
require_once __DIR__ . '/../Models/Track.php';
require_once __DIR__ . '/BaseController.php';
class ReportController {
    private $db;

    public function __construct() {
        $this->db = (new Database())->connect();
        $this->db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    }

    public function submitReport() {
        $rawInput = file_get_contents("php://input");
        $data = json_decode($rawInput);

        $logFile = __DIR__ . '/debug_report.txt';
        file_put_contents($logFile, "🚨 [" . date('H:i:s') . "] INCOMING REPORT: " . $rawInput . "\n", FILE_APPEND);

        if (!isset($data->reporterId) || !isset($data->itemType) || !isset($data->itemId) || !isset($data->reason)) {
            file_put_contents($logFile, "❌ FAILED: Missing fields.\n\n", FILE_APPEND);
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Missing required fields.']);
            return;
        }

        try {
            $safeReason = substr($data->reason, 0, 99); 
            
            $stmt = $this->db->prepare("INSERT INTO Reports (ReporterID, ItemType, ItemID, Reason) VALUES (?, ?, ?, ?)");
            $stmt->execute([$data->reporterId, $data->itemType, $data->itemId, $safeReason]);
            
            file_put_contents($logFile, "✅ SUCCESS: Row inserted! ID: " . $this->db->lastInsertId() . "\n\n", FILE_APPEND);
            echo json_encode(['success' => true, 'message' => 'Report submitted successfully.']);
            
        } catch (PDOException $e) {
            file_put_contents($logFile, "🔥 SQL FATAL ERROR: " . $e->getMessage() . "\n\n", FILE_APPEND);
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'SQL Error: ' . $e->getMessage()]);
            
        } catch (Exception $e) {
            file_put_contents($logFile, "🔥 SERVER ERROR: " . $e->getMessage() . "\n\n", FILE_APPEND);
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Server Error: ' . $e->getMessage()]);
        }
    }
}
?>