<?php
require_once __DIR__ . '/../Models/Track.php';
require_once __DIR__ . '/BaseController.php';

class TrackController extends BaseController {

private $ffmpegPath = "C:/ffmpeg/bin/ffmpeg.exe";
    public function getAllTracks() {
        $track  = new Track();
        $result = $track->getAll();
        $tracks = $result->fetchAll(PDO::FETCH_ASSOC);

        foreach ($tracks as &$t) {
            $st = $track->getSportTypesByTrackId($t['TrackID']);
            $t['sportTypes'] = $st->fetchAll(PDO::FETCH_ASSOC);
            $am = $track->getAmenitiesByTrackId($t['TrackID']);
            $t['amenities'] = $am->fetchAll(PDO::FETCH_ASSOC);
        }

        $this->sendResponse(['success' => true, 'data' => $tracks]);
    }


    public function getTrack($id) {
        $track     = new Track();
        $result    = $track->getById($id);
        $trackData = $result->fetch(PDO::FETCH_ASSOC);

        if ($trackData) {
            $st = $track->getSportTypesByTrackId($id);
            $trackData['sportTypes'] = $st->fetchAll(PDO::FETCH_ASSOC);
            
            $am = $track->getAmenitiesByTrackId($id);
            $trackData['amenities'] = $am->fetchAll(PDO::FETCH_ASSOC);
            
            $rt = $track->getRatingsByTrackId($id);
            $trackData['ratings'] = $rt->fetchAll(PDO::FETCH_ASSOC);

            $md = $track->getMediaByTrackId($id);
            $trackData['media'] = $md->fetchAll(PDO::FETCH_ASSOC);

            $this->sendResponse(['success' => true, 'data' => $trackData]);
        } else {
            $this->sendResponse(['success' => false, 'message' => 'Track not found.'], 404);
        }
    }

    public function createTrack() {
        $isFormData = !empty($_POST);
        $data = $isFormData ? $_POST : json_decode(file_get_contents("php://input"), true);

        if (empty($data['userID']) || empty($data['trackName'])) {
            $this->sendResponse(['success' => false, 'message' => 'Incomplete data.'], 400);
            return;
        }

        $track = new Track();
        
        $sportTypes = isset($data['sportTypes']) ? (is_string($data['sportTypes']) ? json_decode($data['sportTypes'], true) : $data['sportTypes']) : [];
        $amenityIds = isset($data['amenity_ids']) ? (is_string($data['amenity_ids']) ? json_decode($data['amenity_ids'], true) : $data['amenity_ids']) : [];

        $trackId = $track->create($data, $sportTypes, $amenityIds);

        if ($isFormData && isset($_FILES['media'])) {
            $uploadDir = __DIR__ . '/../../public/uploads/';
            if (!is_dir($uploadDir)) {
                mkdir($uploadDir, 0777, true);
            }

            $db = (new Database())->connect();
            $stmt = $db->prepare("INSERT INTO Media (TrackID, UserID, MediaType, FilePath, UploadDate) VALUES (?, ?, ?, ?, NOW())");

            $fileCount = count($_FILES['media']['name']);
            for ($i = 0; $i < $fileCount; $i++) {
                if ($_FILES['media']['error'][$i] === UPLOAD_ERR_OK) {
                    
                    $tmpName = $_FILES['media']['tmp_name'][$i];
                    $fileMime = $_FILES['media']['type'][$i];
                    $mediaType = (strpos($fileMime, 'video') !== false) ? 'video' : 'image';
                    
                    if ($mediaType === 'video') {
                        $fileName = time() . '_' . $i . '_compressed.mp4';
                        $targetPath = $uploadDir . $fileName;
                        
                        $cmd = "{$this->ffmpegPath} -y -i " . escapeshellarg($tmpName) . " -vcodec libx264 -crf 28 -preset faster -movflags +faststart " . escapeshellarg($targetPath) . " 2>&1";
                        shell_exec($cmd);

                        if (file_exists($targetPath)) {
                            $stmt->execute([$trackId, $data['userID'], $mediaType, 'uploads/' . $fileName]);
                        }
                    } else {
                        $fileName = time() . '_' . $i . '_' . basename($_FILES['media']['name'][$i]);
                        $targetPath = $uploadDir . $fileName;

                        if (move_uploaded_file($tmpName, $targetPath)) {
                            $stmt->execute([$trackId, $data['userID'], $mediaType, 'uploads/' . $fileName]);
                        }
                    }
                }
            }
        }

        if ($trackId) {
            if (isset($_FILES['photo'])) {
                if ($_FILES['photo']['error'] === UPLOAD_ERR_OK) {
                    $uploadDir = __DIR__ . '/../../public/uploads/';
                    if (!is_dir($uploadDir)) {
                        mkdir($uploadDir, 0777, true);
                    }
                    $fileName = time() . '_' . basename($_FILES['photo']['name']);
                    $targetPath = $uploadDir . $fileName;

                    if (move_uploaded_file($_FILES['photo']['tmp_name'], $targetPath)) {
                        try {
                            $db = (new Database())->connect();
                            $stmt = $db->prepare("INSERT INTO media (TrackID, UserID, MediaType, FilePath, UploadDate) VALUES (?, ?, 'image', ?, NOW())");
                            $stmt->execute([$trackId, $data['userID'], 'uploads/' . $fileName]);
                        } catch (PDOException $e) {
                            $this->sendResponse(['success' => false, 'message' => 'DB Error: ' . $e->getMessage()], 500);
                            return;
                        }
                    } else {
                        $this->sendResponse(['success' => false, 'message' => 'File Upload Error: Could not move the file to uploads folder.'], 500);
                        return;
                    }
                } else {
                    $this->sendResponse(['success' => false, 'message' => 'File Upload Error Code: ' . $_FILES['photo']['error']], 500);
                    return;
                }
            }

            $this->sendResponse(['success' => true, 'message' => 'Track created.', 'trackId' => $trackId], 201);
        } else {
            $this->sendResponse(['success' => false, 'message' => 'Failed to create track.'], 500);
        }
    }

    public function addMedia() {
        $trackId = $_POST['trackId'] ?? null;
        $userId = $_POST['userId'] ?? null;

        if (!$trackId || !$userId || !isset($_FILES['media'])) {
            $this->sendResponse(['success' => false, 'message' => 'Missing track info or files.'], 400);
            return;
        }

        $uploadDir = __DIR__ . '/../../public/uploads/';
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0777, true);
        }

        $db = (new Database())->connect();
        $stmt = $db->prepare("INSERT INTO Media (TrackID, UserID, MediaType, FilePath, UploadDate) VALUES (?, ?, ?, ?, NOW())");

        $fileCount = count($_FILES['media']['name']);
        for ($i = 0; $i < $fileCount; $i++) {
            if ($_FILES['media']['error'][$i] === UPLOAD_ERR_OK) {
                
                $tmpName = $_FILES['media']['tmp_name'][$i];
                $fileMime = $_FILES['media']['type'][$i];
                $mediaType = (strpos($fileMime, 'video') !== false) ? 'video' : 'image';
                
                if ($mediaType === 'video') {
                    $fileName = time() . '_' . $i . '_compressed.mp4';
                    $targetPath = $uploadDir . $fileName;
                    
                    $cmd = "{$this->ffmpegPath} -y -i " . escapeshellarg($tmpName) . " -vcodec libx264 -crf 28 -preset faster -movflags +faststart " . escapeshellarg($targetPath) . " 2>&1";
                    shell_exec($cmd);

                    if (file_exists($targetPath)) {
                        $stmt->execute([$trackId, $userId, $mediaType, 'uploads/' . $fileName]);
                    }
                } else {
                    $fileName = time() . '_' . $i . '_' . basename($_FILES['media']['name'][$i]);
                    $targetPath = $uploadDir . $fileName;

                    if (move_uploaded_file($tmpName, $targetPath)) {
                        $stmt->execute([$trackId, $userId, $mediaType, 'uploads/' . $fileName]);
                    }
                }
            }
        }

        $this->sendResponse(['success' => true, 'message' => 'Media added successfully.']);
    }
}
?>