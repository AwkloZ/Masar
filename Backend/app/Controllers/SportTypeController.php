<?php
require_once __DIR__ . '/../Models/SportType.php';
require_once __DIR__ . '/BaseController.php';

class SportTypeController extends BaseController {

    public function getAllSportTypes() {
        $model  = new SportType();
        $result = $model->getAll();
        $data   = $result->fetchAll(PDO::FETCH_ASSOC);
        $this->sendResponse(['success' => true, 'data' => $data]);
    }

    public function getAllSurfaceTypes() {
        $model  = new SportType();
        $result = $model->getAllSurfaces();
        $data   = $result->fetchAll(PDO::FETCH_ASSOC);
        $this->sendResponse(['success' => true, 'data' => $data]);
    }

    public function getAllLightingTypes() {
        $model  = new SportType();
        $result = $model->getAllLighting();
        $data   = $result->fetchAll(PDO::FETCH_ASSOC);
        $this->sendResponse(['success' => true, 'data' => $data]);
    }
}
?>
