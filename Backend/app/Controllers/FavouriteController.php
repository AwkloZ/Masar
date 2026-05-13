<?php
require_once __DIR__ . '/../Models/Favourite.php';
require_once __DIR__ . '/BaseController.php';

class FavouriteController extends BaseController {

    public function add() {
        $input = json_decode(file_get_contents('php://input'), true);
        if (empty($input['userID']) || empty($input['trackID'])) {
            $this->sendResponse(['success' => false, 'message' => 'Missing data'], 400); return;
        }
        $model = new FavouriteModel();
        if ($model->add($input['userID'], $input['trackID'])) {
            $this->sendResponse(['success' => true, 'message' => 'Added to favourites']);
        } else {
            $this->sendResponse(['success' => false, 'message' => 'Failed to add'], 500);
        }
    }

    public function remove() {
        $input = json_decode(file_get_contents('php://input'), true);
        if (empty($input['userID']) || empty($input['trackID'])) {
            $this->sendResponse(['success' => false, 'message' => 'Missing data'], 400); return;
        }
        $model = new FavouriteModel();
        if ($model->remove($input['userID'], $input['trackID'])) {
            $this->sendResponse(['success' => true, 'message' => 'Removed from favourites']);
        } else {
            $this->sendResponse(['success' => false, 'message' => 'Failed to remove'], 500);
        }
    }

    public function check() {
        if (empty($_GET['userID']) || empty($_GET['trackID'])) {
            $this->sendResponse(['success' => false, 'message' => 'Missing params'], 400); return;
        }
        $model = new FavouriteModel();
        $isFav = $model->check($_GET['userID'], $_GET['trackID']);
        $this->sendResponse(['success' => true, 'isFavourite' => $isFav]);
    }

    public function getUserFavourites($userId) {
        $model = new FavouriteModel();
        $data = $model->getByUser($userId);
        $this->sendResponse(['success' => true, 'data' => $data]);
    }
}
?>