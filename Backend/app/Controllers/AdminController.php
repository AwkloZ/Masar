<?php
require_once __DIR__ . '/../Models/Track.php';
require_once __DIR__ . '/BaseController.php';

class AdminController {
    private $db;

    public function __construct() {
        $this->db = (new Database())->connect();
        $this->db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    }

    private function isAdmin($userId) {
        $stmt = $this->db->prepare("SELECT Role FROM appuser WHERE UserID = ?");
        $stmt->execute([$userId]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        return ($user && $user['Role'] == 1);
    }

    public function getPendingReports() {
        $userId = $_GET['adminId'] ?? null;

        if (!$userId || !$this->isAdmin($userId)) {
            http_response_code(403);
            echo json_encode(['success' => false, 'message' => 'Unauthorized: VIP Access Only.']);
            return;
        }

        try {
            $stmt = $this->db->prepare("
                SELECT r.*, u.FirstName, u.LastName 
                FROM Reports r 
                JOIN appuser u ON r.ReporterID = u.UserID 
                WHERE r.Status = 'pending' 
                ORDER BY r.ReportedAt DESC
            ");
            $stmt->execute();
            $reports = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            echo json_encode(['success' => true, 'reports' => $reports]);
            
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
        }
    }

    public function moderateItem() {
        $data = json_decode(file_get_contents("php://input"));

        if (!isset($data->adminId) || !$this->isAdmin($data->adminId)) {
            http_response_code(403);
            echo json_encode(['success' => false, 'message' => 'Unauthorized']);
            return;
        }

        $reportId = $data->reportId;
        $action = $data->action;      
        $itemType = $data->itemType;   
        $itemId = $data->itemId;       

        try {
            $this->db->beginTransaction();

            if ($action === 'delete') {
                if ($itemType === 'rating') {
                    
                    $trackQuery = $this->db->prepare("SELECT TrackID FROM trackrating WHERE RatingID = ?");
                    $trackQuery->execute([$itemId]);
                    $trackRow = $trackQuery->fetch(PDO::FETCH_ASSOC);

                    $this->db->prepare("DELETE FROM trackrating WHERE RatingID = ?")->execute([$itemId]);

                    if ($trackRow) {
                        $trackId = $trackRow['TrackID'];
                        
                        $avgQuery = $this->db->prepare("SELECT ROUND(AVG(RatingValue)) as avg_rating FROM trackrating WHERE TrackID = ?");
                        $avgQuery->execute([$trackId]);
                        $avgRow = $avgQuery->fetch(PDO::FETCH_ASSOC);
                        
                        
                        $this->db->prepare("UPDATE track SET Rating = ? WHERE TrackID = ?")->execute([$newAvg, $trackId]);
                    }

                } elseif ($itemType === 'media') {
                    $this->db->prepare("DELETE FROM media WHERE MediaID = ?")->execute([$itemId]);
                } elseif ($itemType === 'challenge') {
                    $this->db->prepare("DELETE FROM participation WHERE ChallengeID = ?")->execute([$itemId]);
                    $this->db->prepare("DELETE FROM challenge WHERE ChallengeID = ?")->execute([$itemId]);
                } elseif ($itemType === 'track') {
                    $this->db->prepare("DELETE FROM media WHERE TrackID = ?")->execute([$itemId]);
                    $this->db->prepare("DELETE FROM trackrating WHERE TrackID = ?")->execute([$itemId]);
                    $this->db->prepare("DELETE FROM tracksport WHERE TrackID = ?")->execute([$itemId]);
                    $chStmt = $this->db->prepare("SELECT ChallengeID FROM challenge WHERE TrackID = ?");
                    $chStmt->execute([$itemId]);
                    foreach ($chStmt->fetchAll(PDO::FETCH_COLUMN) as $chId) {
                        $this->db->prepare("DELETE FROM participation WHERE ChallengeID = ?")->execute([$chId]);
                    }
                    $this->db->prepare("DELETE FROM challenge WHERE TrackID = ?")->execute([$itemId]);
                    $this->db->prepare("DELETE FROM track WHERE TrackID = ?")->execute([$itemId]);
                }
            }

            $this->db->prepare("UPDATE reports SET Status = 'resolved' WHERE ReportID = ?")->execute([$reportId]);

            $this->db->commit();
            echo json_encode(['success' => true, 'message' => 'Moderation action complete.']);
            
        } catch (PDOException $e) {
            $this->db->rollBack();
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
        }
    }

    public function getReportedItem() {
        $adminId = $_GET['adminId'] ?? null;
        $itemType = $_GET['itemType'] ?? null;
        $itemId = $_GET['itemId'] ?? null;

        if (!$adminId || !$this->isAdmin($adminId)) {
            http_response_code(403);
            echo json_encode(['success' => false, 'message' => 'Unauthorized']);
            return;
        }

        try {
            $data = null;
            if ($itemType === 'track') {
                $stmt = $this->db->prepare("SELECT * FROM track WHERE TrackID = ?");
                $stmt->execute([$itemId]);
                $data = $stmt->fetch(PDO::FETCH_ASSOC);
            } elseif ($itemType === 'media') {
                $stmt = $this->db->prepare("SELECT m.*, u.FirstName, u.LastName, t.TrackName FROM media m JOIN appuser u ON m.UserID = u.UserID JOIN track t ON m.TrackID = t.TrackID WHERE m.MediaID = ?");
                $stmt->execute([$itemId]);
                $data = $stmt->fetch(PDO::FETCH_ASSOC);
            } elseif ($itemType === 'rating') {
                $stmt = $this->db->prepare("SELECT r.*, u.FirstName, u.LastName, t.TrackName FROM trackrating r JOIN appuser u ON r.UserID = u.UserID JOIN track t ON r.TrackID = t.TrackID WHERE r.RatingID = ?");
                $stmt->execute([$itemId]);
                $data = $stmt->fetch(PDO::FETCH_ASSOC);
            } elseif ($itemType === 'challenge') {
                $stmt = $this->db->prepare("SELECT c.*, u.FirstName, u.LastName, t.TrackName FROM challenge c JOIN appuser u ON c.UserID = u.UserID JOIN track t ON c.TrackID = t.TrackID WHERE c.ChallengeID = ?");
                $stmt->execute([$itemId]);
                $data = $stmt->fetch(PDO::FETCH_ASSOC);
            }

            echo json_encode(['success' => true, 'data' => $data]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
        }
    }

}
?>