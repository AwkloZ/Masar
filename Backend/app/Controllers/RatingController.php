<?php
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/BaseController.php';

class RatingController extends BaseController {

 

    public function submitRating($trackId) {
        $data = json_decode(file_get_contents('php://input'), true);

        if (empty($data['userID']) || empty($data['ratingValue'])) {
            $this->sendResponse(['success' => false, 'message' => 'userID and ratingValue are required.'], 400);
            return;
        }

        $ratingValue = (int)$data['ratingValue'];
        if ($ratingValue < 1 || $ratingValue > 5) {
            $this->sendResponse(['success' => false, 'message' => 'Rating must be between 1 and 5.'], 400);
            return;
        }

        $db   = new Database();
        $conn = $db->connect();

        $check = $conn->prepare("SELECT RatingID FROM TrackRating WHERE TrackID = :tid AND UserID = :uid");
        $check->bindParam(':tid', $trackId);
        $check->bindParam(':uid', $data['userID']);
        $check->execute();

        if ($check->rowCount() > 0) {
            $row = $check->fetch(PDO::FETCH_ASSOC);
            $update = $conn->prepare("UPDATE TrackRating SET RatingValue = :val, ReviewText = :text, DatePosted = NOW() WHERE RatingID = :rid");
            $update->bindParam(':val',  $ratingValue);
            $reviewText = $data['reviewText'] ?? null;
            $update->bindParam(':text', $reviewText);
            $update->bindParam(':rid',  $row['RatingID']);
            $update->execute();
        } else {
            $insert = $conn->prepare("INSERT INTO TrackRating (TrackID, UserID, RatingValue, ReviewText, DatePosted) VALUES (:tid, :uid, :val, :text, NOW())");
            $insert->bindParam(':tid',  $trackId);
            $insert->bindParam(':uid',  $data['userID']);
            $insert->bindParam(':val',  $ratingValue);
            $reviewText = $data['reviewText'] ?? null;
            $insert->bindParam(':text', $reviewText);
            $insert->execute();
        }

        $avgQuery = $conn->prepare("SELECT ROUND(AVG(RatingValue)) as avg_rating FROM TrackRating WHERE TrackID = :tid");
        $avgQuery->bindParam(':tid', $trackId);
        $avgQuery->execute();
        $avgRow = $avgQuery->fetch(PDO::FETCH_ASSOC);
        $newAvg = $avgRow['avg_rating'] ?? 0;

        $conn->prepare("UPDATE Track SET Rating = :avg WHERE TrackID = :tid")
             ->execute([':avg' => $newAvg, ':tid' => $trackId]);

        $this->sendResponse(['success' => true, 'message' => 'Rating submitted.', 'newAverage' => (int)$newAvg]);
    }
public function deleteRating($ratingId) {
        $data = json_decode(file_get_contents("php://input"), true);
        $userId = $data['userID'] ?? null;

        if (!$userId) {
            echo json_encode(["success" => false, "message" => "User ID required."]);
            return;
        }

        $db   = new Database();
        $conn = $db->connect();

        $trackQuery = $conn->prepare("SELECT TrackID FROM trackrating WHERE RatingID = :ratingId");
        $trackQuery->execute([':ratingId' => $ratingId]);
        $trackRow = $trackQuery->fetch(PDO::FETCH_ASSOC);
        
        if (!$trackRow) {
            echo json_encode(["success" => false, "message" => "Rating not found."]);
            return;
        }
        $trackId = $trackRow['TrackID'];

        $query = "DELETE FROM trackrating WHERE RatingID = :ratingId AND UserID = :userId";
        $stmt = $conn->prepare($query);
        $stmt->execute([':ratingId' => $ratingId, ':userId' => $userId]);
        
        if ($stmt->rowCount() > 0) {
            
            $avgQuery = $conn->prepare("SELECT ROUND(AVG(RatingValue)) as avg_rating FROM trackrating WHERE TrackID = :tid");
            $avgQuery->execute([':tid' => $trackId]);
            $avgRow = $avgQuery->fetch(PDO::FETCH_ASSOC);
            
            $newAvg = $avgRow['avg_rating'] ?? 0; 

            $conn->prepare("UPDATE track SET Rating = :avg WHERE TrackID = :tid")
                 ->execute([':avg' => $newAvg, ':tid' => $trackId]);

            echo json_encode(["success" => true, "message" => "Rating deleted and average updated."]);
        } else {
            http_response_code(400); 
            echo json_encode(["success" => false, "message" => "Database refused to delete the row."]);
        }
    }
    public function getRatingsByTrackId($trackId) {

$query = "SELECT r.RatingID, r.UserID, r.RatingValue, r.ReviewText, r.DatePosted,
                         u.FirstName, u.LastName
                  FROM TrackRating r
                  JOIN AppUser u ON r.UserID = u.UserID
                  WHERE r.TrackID = :trackId
                  ORDER BY r.DatePosted DESC";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':trackId', $trackId);
        $stmt->execute();
        return $stmt;
    }
}
?>
