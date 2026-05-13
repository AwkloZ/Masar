<?php
require_once __DIR__ . '/../../config/database.php';

class ChallengeModel {
    private $conn;

    public function __construct() {
        $database = new Database();
        $this->conn = $database->connect();
    }

    
    public function getAll($userGender = null) {
        if ($userGender === 'male') {
            $genderFilter = "AND (c.GenderPreference IN ('any','male') OR c.GenderPreference IS NULL)";
        } elseif ($userGender === 'female') {
            $genderFilter = "AND (c.GenderPreference IN ('any','female') OR c.GenderPreference IS NULL)";
        } else {
            $genderFilter = "AND (c.GenderPreference = 'any' OR c.GenderPreference IS NULL)";
        }

        $query = "SELECT c.ChallengeID, c.Field, c.Type, c.ScheduledAt, c.GenderPreference,
                         c.UserID as CreatorID,
                         CONCAT(u.FirstName, ' ', u.LastName) as CreatorName,
                         u.Gender as CreatorGender,
                         c.TrackID, t.TrackName,
                         l.City,
                         (SELECT COUNT(*) FROM Participation p WHERE p.ChallengeID = c.ChallengeID) as ParticipantCount
                  FROM Challenge c
                  JOIN AppUser u ON c.UserID = u.UserID
                  JOIN Track t ON c.TrackID = t.TrackID
                  LEFT JOIN Location l ON t.LocationID = l.LocationID
                  WHERE 1=1 $genderFilter
                  ORDER BY c.ScheduledAt IS NULL, c.ScheduledAt ASC, c.ChallengeID DESC";
        
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getById($id) {
        $query = "SELECT c.ChallengeID, c.Field, c.Type, c.ScheduledAt, c.GenderPreference,
                         c.UserID as CreatorID,
                         CONCAT(u.FirstName, ' ', u.LastName) as CreatorName,
                         u.Gender as CreatorGender,
                         c.TrackID, t.TrackName, t.Description as TrackDescription,
                         l.City, l.Latitude, l.Longitude,
                         (SELECT COUNT(*) FROM Participation p WHERE p.ChallengeID = c.ChallengeID) as ParticipantCount
                  FROM Challenge c
                  JOIN AppUser u ON c.UserID = u.UserID
                  JOIN Track t ON c.TrackID = t.TrackID
                  LEFT JOIN Location l ON t.LocationID = l.LocationID
                  WHERE c.ChallengeID = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $id);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function getParticipants($challengeId) {
        $query = "SELECT u.UserID, u.FirstName, u.LastName, u.Gender
                  FROM Participation p
                  JOIN AppUser u ON p.UserID = u.UserID
                  WHERE p.ChallengeID = :cid";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':cid', $challengeId);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

   
    public function create($userId, $trackId, $field, $type, $scheduledAt, $genderPreference, $userGender) {
        if ($genderPreference === 'male' && $userGender === 'female') {
            return 'gender_mismatch';
        }
        if ($genderPreference === 'female' && $userGender === 'male') {
            return 'gender_mismatch';
        }

        $scheduled = (!empty($scheduledAt)) ? $scheduledAt : null;

        $query = "INSERT INTO Challenge (UserID, TrackID, Field, Type, ScheduledAt, GenderPreference)
                  VALUES (:uid, :tid, :field, :type, :scheduledAt, :genderPref)";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':uid',        $userId);
        $stmt->bindParam(':tid',        $trackId);
        $stmt->bindParam(':field',      $field);
        $stmt->bindParam(':type',       $type);
        $stmt->bindParam(':scheduledAt',$scheduled);
        $stmt->bindParam(':genderPref', $genderPreference);
        if ($stmt->execute()) {
            return $this->conn->lastInsertId();
        }
        return false;
    }

    
    public function join($challengeId, $userId, $userGender) {
        $check = $this->conn->prepare("SELECT 1 FROM Participation WHERE ChallengeID = :cid AND UserID = :uid");
        $check->bindParam(':cid', $challengeId);
        $check->bindParam(':uid', $userId);
        $check->execute();
        if ($check->rowCount() > 0) {
            return 'already_joined';
        }

        $prefStmt = $this->conn->prepare("SELECT GenderPreference FROM Challenge WHERE ChallengeID = :cid");
        $prefStmt->bindParam(':cid', $challengeId);
        $prefStmt->execute();
        $challenge = $prefStmt->fetch(PDO::FETCH_ASSOC);
        if (!$challenge) {
            return 'not_found';
        }

        $pref = $challenge['GenderPreference'];
        if ($pref === 'male' && $userGender !== 'male') {
            return 'gender_restricted';
        }
        if ($pref === 'female' && $userGender !== 'female') {
            return 'gender_restricted';
        }

        $query = "INSERT INTO Participation (ChallengeID, UserID) VALUES (:cid, :uid)";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':cid', $challengeId);
        $stmt->bindParam(':uid', $userId);
        return $stmt->execute() ? 'joined' : false;
    }

    
    public function unjoin($challengeId, $userId) {
        $creatorStmt = $this->conn->prepare("SELECT UserID FROM Challenge WHERE ChallengeID = :cid");
        $creatorStmt->bindParam(':cid', $challengeId);
        $creatorStmt->execute();
        $row = $creatorStmt->fetch(PDO::FETCH_ASSOC);
        if (!$row) return 'not_found';
        if ($row['UserID'] == $userId) return 'is_creator';

        $stmt = $this->conn->prepare("DELETE FROM Participation WHERE ChallengeID = :cid AND UserID = :uid");
        $stmt->bindParam(':cid', $challengeId);
        $stmt->bindParam(':uid', $userId);
        $stmt->execute();
        return $stmt->rowCount() > 0 ? 'unjoined' : 'not_joined';
    }

   
    public function getByUserId($userId) {
        $query = "SELECT c.ChallengeID, c.Field, c.Type, c.ScheduledAt, c.GenderPreference,
                         c.UserID as CreatorID,
                         CONCAT(u.FirstName, ' ', u.LastName) as CreatorName,
                         u.Gender as CreatorGender,
                         c.TrackID, t.TrackName,
                         l.City,
                         (SELECT COUNT(*) FROM Participation p WHERE p.ChallengeID = c.ChallengeID) as ParticipantCount,
                         CASE WHEN c.UserID = :uid1 THEN 'created'
                              WHEN EXISTS (SELECT 1 FROM Participation p2 WHERE p2.ChallengeID = c.ChallengeID AND p2.UserID = :uid2) THEN 'joined'
                              ELSE 'none' END as UserRelation
                  FROM Challenge c
                  JOIN AppUser u ON c.UserID = u.UserID
                  JOIN Track t ON c.TrackID = t.TrackID
                  LEFT JOIN Location l ON t.LocationID = l.LocationID
                  WHERE c.UserID = :uid3
                     OR c.ChallengeID IN (SELECT ChallengeID FROM Participation WHERE UserID = :uid4)
                  ORDER BY c.ScheduledAt IS NULL, c.ScheduledAt ASC, c.ChallengeID DESC";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':uid1', $userId);
        $stmt->bindParam(':uid2', $userId);
        $stmt->bindParam(':uid3', $userId);
        $stmt->bindParam(':uid4', $userId);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    
    public function delete($challengeId, $userId) {
        $checkStmt = $this->conn->prepare("SELECT UserID FROM Challenge WHERE ChallengeID = :cid");
        $checkStmt->bindParam(':cid', $challengeId);
        $checkStmt->execute();
        $row = $checkStmt->fetch(PDO::FETCH_ASSOC);

        if (!$row) return 'not_found';
        if ($row['UserID'] != $userId) return 'unauthorized';

        $stmt = $this->conn->prepare("DELETE FROM Challenge WHERE ChallengeID = :cid AND UserID = :uid");
        $stmt->bindParam(':cid', $challengeId);
        $stmt->bindParam(':uid', $userId);
        
        return $stmt->execute() ? 'deleted' : false;
    }
}
?>
