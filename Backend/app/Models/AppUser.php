<?php
require_once __DIR__ . '/../../config/database.php';

class AppUser {
    private $conn;
    private $table = 'AppUser';

    public function __construct() {
        $database = new Database();
        $this->conn = $database->connect();
    }

    public function create($data) {
        $gender = isset($data['gender']) ? $data['gender'] : null;
        $query = "INSERT INTO " . $this->table . "
                  (FirstName, LastName, Email, PasswordHash, DateRegistered, Role, Gender)
                  VALUES (:firstName, :lastName, :email, :password, NOW(), 2, :gender)";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':firstName', $data['firstName']);
        $stmt->bindParam(':lastName',  $data['lastName']);
        $stmt->bindParam(':email',     $data['email']);
        $stmt->bindParam(':password',  $data['password']);
        $stmt->bindParam(':gender',    $gender);
        if ($stmt->execute()) {
            return $this->conn->lastInsertId();
        }
        return false;
    }

    public function emailExists($email) {
        $query = "SELECT UserID FROM " . $this->table . " WHERE Email = :email LIMIT 1";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':email', $email);
        $stmt->execute();
        return $stmt->rowCount() > 0;
    }

    public function getByEmail($email) {
        $query = "SELECT * FROM " . $this->table . " WHERE Email = :email LIMIT 1";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':email', $email);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function getById($id) {
        $query = "SELECT UserID, FirstName, LastName, Email, DateRegistered, Role, Gender
                  FROM " . $this->table . "
                  WHERE UserID = :id LIMIT 1";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $id);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function updateProfile($id, $firstName, $lastName, $gender = null) {
        if ($gender !== null) {
            $query = "UPDATE " . $this->table . "
                      SET FirstName = :firstName, LastName = :lastName, Gender = :gender
                      WHERE UserID = :id";
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':firstName', $firstName);
            $stmt->bindParam(':lastName',  $lastName);
            $stmt->bindParam(':gender',    $gender);
            $stmt->bindParam(':id',        $id);
        } else {
            $query = "UPDATE " . $this->table . "
                      SET FirstName = :firstName, LastName = :lastName
                      WHERE UserID = :id";
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':firstName', $firstName);
            $stmt->bindParam(':lastName',  $lastName);
            $stmt->bindParam(':id',        $id);
        }
        return $stmt->execute();
    }

    public function getPasswordHash($id) {
        $query = "SELECT PasswordHash FROM " . $this->table . " WHERE UserID = :id LIMIT 1";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $id);
        $stmt->execute();
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row ? $row['PasswordHash'] : null;
    }

    public function changePassword($id, $newHashedPassword) {
        $query = "UPDATE " . $this->table . " SET PasswordHash = :password WHERE UserID = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':password', $newHashedPassword);
        $stmt->bindParam(':id',       $id);
        return $stmt->execute();
    }

    public function getTrackCount($id) {
        $query = "SELECT COUNT(*) as total FROM Track WHERE UserID = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $id);
        $stmt->execute();
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row ? (int)$row['total'] : 0;
    }

    public function getTracksByUser($id) {
        $query = "SELECT t.TrackID, t.TrackName, t.Length_km, t.Rating, t.DateSubmitted,
                         l.City
                  FROM Track t
                  LEFT JOIN Location l ON t.LocationID = l.LocationID
                  WHERE t.UserID = :id
                  ORDER BY t.DateSubmitted DESC";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $id);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}
?>
