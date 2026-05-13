<?php
require_once __DIR__ . '/BaseModel.php';

class TrackEditRequest {
    private $conn;
    private $table = 'TrackEditRequest';

    public function __construct() {
        $database = new Database();
        $this->conn = $database->connect();
    }

    public function createRequest($trackId, $userId, $proposedChangesJson) {
        $query = "INSERT INTO " . $this->table . " (TrackID, UserID, ProposedChanges, Status, DateRequested) 
                  VALUES (:trackId, :userId, :changes, 'Pending', NOW())";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':trackId', $trackId);
        $stmt->bindParam(':userId', $userId);
        $stmt->bindParam(':changes', $proposedChangesJson);
        return $stmt->execute();
    }

    public function getPendingRequests() {
        $query = "SELECT er.*, t.TrackName, u.FirstName, u.LastName 
                  FROM " . $this->table . " er
                  JOIN Track t ON er.TrackID = t.TrackID
                  JOIN AppUser u ON er.UserID = u.UserID
                  WHERE er.Status = 'Pending'
                  ORDER BY er.DateRequested ASC";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function updateStatus($requestId, $status) {
        $query = "UPDATE " . $this->table . " SET Status = :status WHERE RequestID = :requestId";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':status', $status);
        $stmt->bindParam(':requestId', $requestId);
        return $stmt->execute();
    }

    public function getRequestById($requestId) {
        $query = "SELECT * FROM " . $this->table . " WHERE RequestID = :id LIMIT 1";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $requestId);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }
    
}
?>