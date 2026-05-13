<?php
require_once __DIR__ . '/../Models/Amenity.php';
require_once __DIR__ . '/BaseController.php';

class AmenityController extends BaseController {

    public function getAllAmenities() {
        $model = new Amenity();
        $data  = $model->getAll();
        $this->sendResponse(['success' => true, 'data' => $data]);
    }

}
?>
