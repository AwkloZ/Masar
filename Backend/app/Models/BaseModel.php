<?php
require_once __DIR__ . 
'/../../config/database.php';

class BaseModel {
    protected $conn;
    protected $table;

    public function __construct() {
        $database = new Database();
        $this->conn = $database->connect();
    }

    public function getAll() {
        $query = 'SELECT * FROM ' . $this->table;
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt;
    }

    public function getById($id) {
        $query = 'SELECT * FROM ' . $this->table . ' WHERE ' . $this->table . 'ID = :id';
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $id);
        $stmt->execute();
        return $stmt;
    }
}
?>
