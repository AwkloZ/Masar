<?php
require_once __DIR__ . '/../Models/Challenge.php';
require_once __DIR__ . '/../Models/AppUser.php';
require_once __DIR__ . '/BaseController.php';

class ChallengeController extends BaseController {

    
    public function getAll() {
        $userGender = null;
     if (!empty($_GET['userID'])) {
            $userModel  = new AppUser();
            $userData   = $userModel->getById((int)$_GET['userID']);
            $userGender = isset($userData['Gender']) ? strtolower($userData['Gender']) : null; 
        }
        $model = new ChallengeModel();
        $data  = $model->getAll($userGender);
        $this->sendResponse(['success' => true, 'data' => $data]);
    }

    public function getById($id) {
        $model = new ChallengeModel();
        $data  = $model->getById($id);
        if ($data) {
            $data['participants'] = $model->getParticipants($id);
            $this->sendResponse(['success' => true, 'data' => $data]);
        } else {
            $this->sendResponse(['success' => false, 'message' => 'Challenge not found.'], 404);
        }
    }

   
    public function create() {
        $input = json_decode(file_get_contents('php://input'), true);

        if (empty($input['userID']) || empty($input['trackID']) || empty($input['field']) || empty($input['type'])) {
            $this->sendResponse(['success' => false, 'message' => 'userID, trackID, field, and type are required.'], 400);
            return;
        }

        $genderPreference = isset($input['genderPreference']) ? $input['genderPreference'] : 'any';
        if (!in_array($genderPreference, ['male', 'female', 'any'])) {
            $genderPreference = 'any';
        }

        $userModel  = new AppUser();
        $userData   = $userModel->getById((int)$input['userID']);
        $userGender = $userData['Gender'] ?? null;

        $scheduledAt = isset($input['scheduledAt']) ? $input['scheduledAt'] : null;

        $model  = new ChallengeModel();
        $result = $model->create(
            $input['userID'],
            $input['trackID'],
            $input['field'],
            $input['type'],
            $scheduledAt,
            $genderPreference,
            $userGender
        );

        if ($result === 'gender_mismatch') {
            $this->sendResponse(['success' => false, 'message' => 'You cannot create a challenge for the opposite gender.'], 403);
        } elseif ($result) {
            $this->sendResponse(['success' => true, 'message' => 'Challenge created.', 'challengeId' => $result], 201);
        } else {
            $this->sendResponse(['success' => false, 'message' => 'Failed to create challenge.'], 500);
        }
    }

    public function join($challengeId) {
        $input = json_decode(file_get_contents('php://input'), true);

        if (empty($input['userID'])) {
            $this->sendResponse(['success' => false, 'message' => 'userID is required.'], 400);
            return;
        }

        $userModel  = new AppUser();
        $userData   = $userModel->getById((int)$input['userID']);
        $userGender = $userData['Gender'] ?? null;

        $model  = new ChallengeModel();
        $result = $model->join($challengeId, $input['userID'], $userGender);

        switch ($result) {
            case 'already_joined':
                $this->sendResponse(['success' => false, 'message' => 'Already joined this challenge.'], 409);
                break;
            case 'joined':
                $this->sendResponse(['success' => true, 'message' => 'Joined challenge successfully.']);
                break;
            case 'gender_restricted':
                $this->sendResponse(['success' => false, 'message' => 'This challenge is not open to your gender.'], 403);
                break;
            case 'not_found':
                $this->sendResponse(['success' => false, 'message' => 'Challenge not found.'], 404);
                break;
            default:
                $this->sendResponse(['success' => false, 'message' => 'Failed to join challenge.'], 500);
        }
    }

   
    public function unjoin($challengeId) {
        $input = json_decode(file_get_contents('php://input'), true);

        if (empty($input['userID'])) {
            $this->sendResponse(['success' => false, 'message' => 'userID is required.'], 400);
            return;
        }

        $model  = new ChallengeModel();
        $result = $model->unjoin($challengeId, $input['userID']);

        switch ($result) {
            case 'unjoined':
                $this->sendResponse(['success' => true, 'message' => 'You have left the challenge.']);
                break;
            case 'is_creator':
                $this->sendResponse(['success' => false, 'message' => 'Challenge creators cannot leave their own challenge.'], 403);
                break;
            case 'not_joined':
                $this->sendResponse(['success' => false, 'message' => 'You are not a participant in this challenge.'], 409);
                break;
            case 'not_found':
                $this->sendResponse(['success' => false, 'message' => 'Challenge not found.'], 404);
                break;
            default:
                $this->sendResponse(['success' => false, 'message' => 'Failed to leave challenge.'], 500);
        }
    }

    
    public function getUserChallenges($userId) {
        $model = new ChallengeModel();
        $data  = $model->getByUserId($userId);
        $this->sendResponse(['success' => true, 'data' => $data]);
    }

    public function delete($challengeId) {
        $input = json_decode(file_get_contents('php://input'), true);

        if (empty($input['userID'])) {
            $this->sendResponse(['success' => false, 'message' => 'userID is required.'], 400);
            return;
        }

        $model = new ChallengeModel();
        $result = $model->delete($challengeId, $input['userID']);

        switch ($result) {
            case 'deleted':
                $this->sendResponse(['success' => true, 'message' => 'Challenge deleted successfully.']);
                break;
            case 'unauthorized':
                $this->sendResponse(['success' => false, 'message' => 'You are not authorized to delete this challenge.'], 403);
                break;
            case 'not_found':
                $this->sendResponse(['success' => false, 'message' => 'Challenge not found.'], 404);
                break;
            default:
                $this->sendResponse(['success' => false, 'message' => 'Failed to delete challenge.'], 500);
        }
    }
}
?>
