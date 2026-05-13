<?php
require_once __DIR__ . '/BaseModel.php';

class SportType extends BaseModel {
    protected $table = 'SportType';

    public function getAllSurfaces() {
        $query = "SELECT * FROM SurfaceType ORDER BY SurfaceTypeID";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt;
    }

    public function getAllLighting() {
        $query = "SELECT * FROM LightingType ORDER BY LightingTypeID";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt;
    }
}
?>
