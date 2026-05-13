<?php
require_once __DIR__ . '/../../config/database.php';

class Amenity {
    private $conn;

    public function __construct() {
        $database = new Database();
        $this->conn = $database->connect();
    }

    public function getAll() {
        $query = "SELECT AmenityID, AmenityKey, AmenityName, AmenityIcon, Category
                  FROM Amenity
                  WHERE IsActive = 1
                  ORDER BY Category, AmenityName";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getByTrackId($trackId) {
        $query = "SELECT a.AmenityID, a.AmenityKey, a.AmenityName, a.AmenityIcon, a.Category
                  FROM TrackAmenity ta
                  JOIN Amenity a ON ta.AmenityID = a.AmenityID
                  WHERE ta.TrackID = :trackId AND a.IsActive = 1
                  ORDER BY a.Category, a.AmenityName";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':trackId', $trackId);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function saveForTrack($trackId, $amenityIds) {
        $del = $this->conn->prepare("DELETE FROM TrackAmenity WHERE TrackID = :trackId");
        $del->bindParam(':trackId', $trackId);
        $del->execute();

        if (!empty($amenityIds)) {
            $ins = $this->conn->prepare("INSERT INTO TrackAmenity (TrackID, AmenityID) VALUES (:trackId, :amenityId)");
            foreach ($amenityIds as $aid) {
                $ins->bindParam(':trackId',   $trackId);
                $ins->bindParam(':amenityId', $aid);
                $ins->execute();
            }
        }
        return true;
    }
}
?>
