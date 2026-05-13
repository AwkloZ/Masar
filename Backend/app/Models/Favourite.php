<?php
require_once __DIR__ . '/../../config/database.php';

class FavouriteModel {
    private $conn;

    public function __construct() {
        $this->conn = (new Database())->connect();
    }

    public function add($userId, $trackId) {
        $stmt = $this->conn->prepare("INSERT IGNORE INTO Favourite (UserID, TrackID) VALUES (:uid, :tid)");
        return $stmt->execute([':uid' => $userId, ':tid' => $trackId]);
    }

    public function remove($userId, $trackId) {
        $stmt = $this->conn->prepare("DELETE FROM Favourite WHERE UserID = :uid AND TrackID = :tid");
        return $stmt->execute([':uid' => $userId, ':tid' => $trackId]);
    }

    public function check($userId, $trackId) {
        $stmt = $this->conn->prepare("SELECT 1 FROM Favourite WHERE UserID = :uid AND TrackID = :tid");
        $stmt->execute([':uid' => $userId, ':tid' => $trackId]);
        return $stmt->rowCount() > 0;
    }

    public function getByUser($userId) {
        $query = "SELECT t.*, l.City 
                  FROM Track t
                  JOIN Favourite f ON t.TrackID = f.TrackID
                  LEFT JOIN Location l ON t.LocationID = l.LocationID
                  WHERE f.UserID = :uid
                  ORDER BY t.DateSubmitted DESC";
        $stmt = $this->conn->prepare($query);
        $stmt->execute([':uid' => $userId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}
?>