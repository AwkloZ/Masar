-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: May 19, 2026 at 12:46 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `masar_db`
--

-- --------------------------------------------------------

--
-- Table structure for table `amenity`
--

CREATE TABLE `amenity` (
  `AmenityID` int(11) NOT NULL,
  `AmenityKey` varchar(50) NOT NULL,
  `AmenityName` varchar(100) NOT NULL,
  `AmenityIcon` varchar(50) NOT NULL,
  `Category` varchar(50) NOT NULL,
  `IsActive` tinyint(1) NOT NULL DEFAULT 1,
  `CreatedAt` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `amenity`
--

INSERT INTO `amenity` (`AmenityID`, `AmenityKey`, `AmenityName`, `AmenityIcon`, `Category`, `IsActive`, `CreatedAt`) VALUES
(1, 'parking', 'Free Parking', 'local-parking', 'Facilities', 1, '2026-03-23 03:04:07'),
(2, 'restrooms', 'Restrooms', 'wc', 'Facilities', 1, '2026-03-23 03:04:07'),
(3, 'water_fountain', 'Water Fountain', 'water', 'Facilities', 1, '2026-03-23 03:04:07'),
(4, 'benches', 'Benches', 'weekend', 'Facilities', 1, '2026-03-23 03:04:07'),
(5, 'shelter', 'Shelter', 'home', 'Facilities', 1, '2026-03-23 03:04:07'),
(6, 'lockers', 'Lockers', 'lock', 'Facilities', 1, '2026-03-23 03:04:07'),
(7, 'grocery', 'Grocery Store', 'store', 'Food & Drink', 1, '2026-03-23 03:04:07'),
(8, 'cafe', 'Cafe', 'local-cafe', 'Food & Drink', 1, '2026-03-23 03:04:07'),
(9, 'restaurant', 'Restaurant', 'restaurant', 'Food & Drink', 1, '2026-03-23 03:04:07'),
(10, 'vending', 'Vending Machine', 'local-drink', 'Food & Drink', 1, '2026-03-23 03:04:07'),
(12, 'cctv', 'CCTV', 'videocam', 'Safety', 1, '2026-03-23 03:04:07'),
(13, 'first_aid', 'First Aid', 'local-hospital', 'Safety', 1, '2026-03-23 03:04:07'),
(14, 'wheelchair', 'Wheelchair Access', 'accessible', 'Safety', 1, '2026-03-23 03:04:07'),
(15, 'bike_rental', 'Bike Rental', 'directions-bike', 'Sports', 1, '2026-03-23 03:04:07'),
(16, 'bike_repair', 'Bike Repair', 'build', 'Sports', 1, '2026-03-23 03:04:07'),
(17, 'equipment', 'Equipment Rental', 'sports', 'Sports', 1, '2026-03-23 03:04:07'),
(18, 'showers', 'Showers', 'shower', 'Sports', 1, '2026-03-23 03:04:07');

-- --------------------------------------------------------

--
-- Table structure for table `appuser`
--

CREATE TABLE `appuser` (
  `UserID` int(11) NOT NULL,
  `Role` int(11) NOT NULL DEFAULT 2 COMMENT '1=Admin, 2=User',
  `FirstName` varchar(100) NOT NULL,
  `LastName` varchar(100) NOT NULL,
  `Email` varchar(255) NOT NULL,
  `PasswordHash` varchar(255) NOT NULL,
  `DateRegistered` datetime NOT NULL,
  `Gender` enum('male','female','other') DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `appuser`
--

INSERT INTO `appuser` (`UserID`, `Role`, `FirstName`, `LastName`, `Email`, `PasswordHash`, `DateRegistered`, `Gender`) VALUES
(8, 1, 'Hatem', 'Alzahrani', 'hatem@2.com', '$2y$10$blI3LibrysxR5M5q3Ln02eGMflaNyl8Mvw6Dy8Y61uln2AjYO5Qpq', '2026-03-23 03:18:20', 'male');

-- --------------------------------------------------------

--
-- Table structure for table `challenge`
--

CREATE TABLE `challenge` (
  `ChallengeID` int(11) NOT NULL,
  `UserID` int(11) NOT NULL,
  `TrackID` int(11) NOT NULL,
  `Field` varchar(50) NOT NULL,
  `Type` varchar(50) NOT NULL,
  `ScheduledAt` datetime DEFAULT NULL,
  `GenderPreference` enum('male','female','any') NOT NULL DEFAULT 'any',
  `SportTypeID` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `favourite`
--

CREATE TABLE `favourite` (
  `UserID` int(11) NOT NULL,
  `TrackID` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `favourite`
--

INSERT INTO `favourite` (`UserID`, `TrackID`) VALUES
(8, 37),
(8, 44);

-- --------------------------------------------------------

--
-- Table structure for table `lightingtype`
--

CREATE TABLE `lightingtype` (
  `LightingTypeID` int(11) NOT NULL,
  `LightingName` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `lightingtype`
--

INSERT INTO `lightingtype` (`LightingTypeID`, `LightingName`) VALUES
(1, 'Excellent'),
(2, 'Good'),
(3, 'Fair'),
(4, 'Poor'),
(5, 'None');

-- --------------------------------------------------------

--
-- Table structure for table `location`
--

CREATE TABLE `location` (
  `LocationID` int(11) NOT NULL,
  `Address` varchar(255) DEFAULT NULL,
  `City` varchar(100) NOT NULL,
  `Country` varchar(100) NOT NULL,
  `Latitude` decimal(8,6) NOT NULL,
  `Longitude` decimal(8,6) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `location`
--

INSERT INTO `location` (`LocationID`, `Address`, `City`, `Country`, `Latitude`, `Longitude`) VALUES
(37, 'حديقة الملك فهد', 'Madinah', 'Saudi Arabia', 24.416077, 39.601620),
(44, '', 'Madinah', 'Saudi Arabia', 24.405586, 39.521083),
(51, '', 'Riyadh', 'Saudi Arabia', 24.761616, 46.601174);

-- --------------------------------------------------------

--
-- Table structure for table `media`
--

CREATE TABLE `media` (
  `MediaID` int(11) NOT NULL,
  `TrackID` int(11) NOT NULL,
  `UserID` int(11) NOT NULL,
  `MediaType` varchar(30) NOT NULL,
  `FilePath` varchar(255) NOT NULL,
  `UploadDate` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `participation`
--

CREATE TABLE `participation` (
  `ChallengeID` int(11) NOT NULL,
  `UserID` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `reports`
--

CREATE TABLE `reports` (
  `ReportID` int(11) NOT NULL,
  `ReporterID` int(11) NOT NULL,
  `ItemType` varchar(50) NOT NULL,
  `ItemID` int(11) NOT NULL,
  `Reason` varchar(100) NOT NULL,
  `Status` varchar(20) DEFAULT 'pending',
  `ReportedAt` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `reports`
--

INSERT INTO `reports` (`ReportID`, `ReporterID`, `ItemType`, `ItemID`, `Reason`, `Status`, `ReportedAt`) VALUES
(1, 8, 'track', 25, 'Needs Track Update: I pepe', 'resolved', '2026-04-16 21:59:17'),
(2, 8, 'rating', 3, 'Spam: Useless comment', 'resolved', '2026-04-16 22:00:43'),
(3, 8, 'media', 0, 'Inappropriate: Oooo', 'resolved', '2026-04-17 01:01:21'),
(4, 8, 'media', 0, 'Inappropriate: Bad image', 'resolved', '2026-04-17 03:11:29'),
(5, 8, 'media', 1, 'Inappropriate: Bad image 2', 'resolved', '2026-04-17 03:11:56'),
(6, 8, 'media', 2, 'Inappropriate: 6ww6syys', 'resolved', '2026-04-17 03:14:13'),
(7, 8, 'media', 28, 'Inappropriate: Tuthtth', 'resolved', '2026-04-17 03:31:31'),
(8, 8, 'media', 27, 'Inappropriate: Hhg', 'resolved', '2026-04-17 03:34:26'),
(9, 8, 'rating', 5, 'Inappropriate', 'resolved', '2026-04-19 18:54:20'),
(10, 8, 'media', 30, 'Spam: Random sc', 'resolved', '2026-04-19 18:58:20'),
(11, 8, 'track', 34, 'Inappropriate', 'resolved', '2026-04-19 19:00:11'),
(12, 8, 'track', 35, 'Inappropriate: Chfu', 'Resolved', '2026-04-20 13:48:32'),
(13, 9, 'challenge', 8, 'Other: Qdhd', 'Resolved', '2026-04-20 14:45:04'),
(14, 9, 'challenge', 8, 'Inappropriate: Djdbjdj', 'Resolved', '2026-04-20 14:47:06'),
(15, 9, 'challenge', 11, 'Other: Egrg', 'resolved', '2026-04-20 16:09:13'),
(16, 8, 'track', 39, 'Inappropriate: kaka popo', 'resolved', '2026-05-02 13:40:37'),
(17, 8, 'media', 33, 'Inappropriate: segoisaehgoesagh', 'resolved', '2026-05-02 13:53:27'),
(18, 8, 'track', 41, 'Inappropriate: ذتذت\n', 'resolved', '2026-05-02 15:13:02'),
(19, 8, 'track', 41, 'Inappropriate', 'resolved', '2026-05-02 15:19:57'),
(20, 8, 'media', 34, 'Inappropriate: dsadwadsd', 'resolved', '2026-05-02 15:38:47'),
(21, 8, 'media', 35, 'Inappropriate', 'resolved', '2026-05-02 15:43:15'),
(22, 8, 'media', 36, 'Other', 'resolved', '2026-05-03 21:21:44'),
(23, 8, 'track', 40, 'Inappropriate', 'resolved', '2026-05-03 21:21:50'),
(24, 8, 'rating', 11, 'Inappropriate', 'resolved', '2026-05-03 21:21:56'),
(25, 8, 'rating', 12, 'Spam', 'resolved', '2026-05-03 21:50:42'),
(26, 8, 'track', 42, 'Spam', 'resolved', '2026-05-03 21:50:46'),
(27, 8, 'rating', 10, 'Spam: Dodjjd', 'resolved', '2026-05-03 21:54:15'),
(28, 9, 'track', 42, 'Spam', 'resolved', '2026-05-03 22:02:10'),
(29, 9, 'challenge', 17, 'Fake Challenge: Spamming shit\n', 'resolved', '2026-05-03 22:03:30'),
(30, 9, 'media', 53, 'Spam: Not a real car', 'resolved', '2026-05-03 22:03:44'),
(31, 9, 'rating', 12, 'Spam: Popo', 'resolved', '2026-05-03 22:03:51'),
(32, 8, 'track', 4, 'Spam', 'resolved', '2026-05-03 22:10:57'),
(33, 8, 'track', 41, 'Inappropriate: Xcf', 'resolved', '2026-05-03 22:21:35'),
(34, 8, 'rating', 14, 'Inappropriate', 'resolved', '2026-05-03 22:38:17'),
(35, 8, 'rating', 2, 'Inappropriate', 'resolved', '2026-05-03 22:57:27'),
(36, 8, 'rating', 3, 'Inappropriate: Fjfjf', 'resolved', '2026-05-03 22:57:50'),
(37, 8, 'track', 48, 'Spam', 'resolved', '2026-05-05 20:57:07'),
(38, 8, 'track', 46, 'Spam', 'resolved', '2026-05-05 20:57:14'),
(39, 8, 'track', 45, 'Inappropriate', 'resolved', '2026-05-05 20:57:20'),
(40, 8, 'track', 49, 'Inappropriate', 'resolved', '2026-05-05 20:57:29'),
(41, 8, 'track', 47, 'Inappropriate', 'resolved', '2026-05-05 20:57:36'),
(42, 9, 'challenge', 21, 'Spam', 'resolved', '2026-05-06 14:14:07'),
(43, 9, 'track', 50, 'Spam', 'resolved', '2026-05-06 14:14:15'),
(44, 9, 'track', 40, 'Spam', 'resolved', '2026-05-06 14:14:20'),
(45, 9, 'track', 43, 'Spam', 'resolved', '2026-05-06 14:14:24'),
(46, 9, 'track', 52, 'Inappropriate', 'resolved', '2026-05-12 14:23:23'),
(47, 8, 'track', 52, 'Spam', 'resolved', '2026-05-12 14:37:57'),
(48, 8, 'challenge', 22, 'Inappropriate Content', 'resolved', '2026-05-12 14:38:09'),
(49, 8, 'media', 64, 'Inappropriate', 'resolved', '2026-05-12 20:31:04'),
(50, 8, 'media', 67, 'Inappropriate', 'resolved', '2026-05-12 21:14:09'),
(51, 8, 'media', 68, 'Spam', 'resolved', '2026-05-12 21:16:09'),
(52, 8, 'media', 66, 'Spam', 'resolved', '2026-05-12 21:16:25'),
(53, 8, 'media', 64, 'Inappropriate: He cusses in the video', 'resolved', '2026-05-12 21:20:07'),
(54, 8, 'media', 71, 'Inappropriate', 'resolved', '2026-05-13 07:23:29'),
(55, 8, 'track', 53, 'Inappropriate', 'resolved', '2026-05-13 07:28:56'),
(56, 8, 'media', 65, 'Inappropriate', 'resolved', '2026-05-13 07:32:56'),
(57, 8, 'media', 65, 'Inappropriate', 'resolved', '2026-05-13 07:35:37'),
(58, 8, 'track', 54, 'Inappropriate', 'resolved', '2026-05-13 10:01:11');

-- --------------------------------------------------------

--
-- Table structure for table `sporttype`
--

CREATE TABLE `sporttype` (
  `SportTypeID` int(11) NOT NULL,
  `SportName` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `sporttype`
--

INSERT INTO `sporttype` (`SportTypeID`, `SportName`) VALUES
(1, 'Walking'),
(2, 'Cycling'),
(3, 'Skating'),
(4, 'Running');

-- --------------------------------------------------------

--
-- Table structure for table `surfacetype`
--

CREATE TABLE `surfacetype` (
  `SurfaceTypeID` int(11) NOT NULL,
  `SurfaceName` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `surfacetype`
--

INSERT INTO `surfacetype` (`SurfaceTypeID`, `SurfaceName`) VALUES
(1, 'Asphalt'),
(2, 'Concrete'),
(3, 'Synthetic'),
(4, 'Gravel'),
(5, 'Dirt');

-- --------------------------------------------------------

--
-- Table structure for table `track`
--

CREATE TABLE `track` (
  `TrackID` int(11) NOT NULL,
  `UserID` int(11) NOT NULL,
  `TrackName` varchar(50) NOT NULL,
  `Description` text DEFAULT NULL,
  `Length_km` decimal(5,2) DEFAULT NULL,
  `SurfaceTypeID` int(11) DEFAULT NULL,
  `LightingTypeID` int(11) DEFAULT NULL,
  `Difficulty` int(11) DEFAULT NULL,
  `Rating` int(11) DEFAULT 0,
  `LocationID` int(11) NOT NULL,
  `DateSubmitted` datetime NOT NULL,
  `RoutePoints` text DEFAULT NULL,
  `HasSeparateLanes` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `track`
--

INSERT INTO `track` (`TrackID`, `UserID`, `TrackName`, `Description`, `Length_km`, `SurfaceTypeID`, `LightingTypeID`, `Difficulty`, `Rating`, `LocationID`, `DateSubmitted`, `RoutePoints`, `HasSeparateLanes`) VALUES
(37, 8, 'King Fahad park', 'A track on the edge of King Fahad park. ', 1.22, 3, 2, 1, 4, 37, '2026-04-22 03:58:46', '[{\"latitude\":24.41607717271317,\"longitude\":39.60161983966828},{\"latitude\":24.41713714074734,\"longitude\":39.60117056965828},{\"latitude\":24.4207370578851,\"longitude\":39.602022171020515},{\"latitude\":24.423355114936232,\"longitude\":39.60283756256104},{\"latitude\":24.424410137495787,\"longitude\":39.60639953613282}]', 1),
(44, 8, 'TU Track', 'Test', 4.50, 2, 2, 1, 5, 44, '2026-05-04 12:44:21', '[{\"latitude\":24.405586350239613,\"longitude\":39.521082782975476},{\"latitude\":24.408741395167144,\"longitude\":39.523400005149256},{\"latitude\":24.411008635338632,\"longitude\":39.52404395288548},{\"latitude\":24.413197090520104,\"longitude\":39.52606079554356},{\"latitude\":24.415073055005294,\"longitude\":39.527090892117315},{\"latitude\":24.417144012838946,\"longitude\":39.52824958967541},{\"latitude\":24.4155444771478,\"longitude\":39.53258362661335},{\"latitude\":24.414020389789368,\"longitude\":39.5360169713069},{\"latitude\":24.412925894143456,\"longitude\":39.53859200353691},{\"latitude\":24.41046491688306,\"longitude\":39.5337864445333},{\"latitude\":24.409330667134544,\"longitude\":39.530052670114934},{\"latitude\":24.40788494444967,\"longitude\":39.52717723047526},{\"latitude\":24.406165614748687,\"longitude\":39.52395862428768},{\"latitude\":24.40526617457154,\"longitude\":39.522284725026125}]', 0),
(51, 8, 'Sports boulevard', 'A great track with beautiful scenery over the king Fahad road. ', 4.76, 3, 1, 2, 5, 51, '2026-05-06 17:07:21', '[{\"latitude\":24.761616411871362,\"longitude\":46.601174106004486},{\"latitude\":24.75640914772942,\"longitude\":46.589045185081744},{\"latitude\":24.755749477658448,\"longitude\":46.587454554933466},{\"latitude\":24.754696811464463,\"longitude\":46.58504329959423},{\"latitude\":24.754620252627575,\"longitude\":46.584498343616886},{\"latitude\":24.753993102855144,\"longitude\":46.583511470939264},{\"latitude\":24.753311362747095,\"longitude\":46.5819880891892},{\"latitude\":24.752701903553607,\"longitude\":46.58206067131476},{\"latitude\":24.75164961732619,\"longitude\":46.58263198811107},{\"latitude\":24.750029164358953,\"longitude\":46.5832513374836},{\"latitude\":24.749073425200454,\"longitude\":46.58344914960066},{\"latitude\":24.747225842542555,\"longitude\":46.584047239103896},{\"latitude\":24.743498916237098,\"longitude\":46.58567765804767},{\"latitude\":24.740937354216445,\"longitude\":46.58683742824879},{\"latitude\":24.740636634428533,\"longitude\":46.58641800212891},{\"latitude\":24.740542628829367,\"longitude\":46.586444963562364},{\"latitude\":24.73770180918589,\"longitude\":46.576221502986655}]', 0);

-- --------------------------------------------------------

--
-- Table structure for table `trackamenity`
--

CREATE TABLE `trackamenity` (
  `TrackID` int(11) NOT NULL,
  `AmenityID` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `trackamenity`
--

INSERT INTO `trackamenity` (`TrackID`, `AmenityID`) VALUES
(37, 1),
(37, 2),
(37, 8),
(37, 14),
(37, 15),
(44, 1),
(44, 12),
(51, 1),
(51, 2),
(51, 3),
(51, 4),
(51, 5),
(51, 8),
(51, 12),
(51, 13),
(51, 14),
(51, 15),
(51, 17);

-- --------------------------------------------------------

--
-- Table structure for table `trackeditrequest`
--

CREATE TABLE `trackeditrequest` (
  `RequestID` int(11) NOT NULL,
  `TrackID` int(11) NOT NULL,
  `UserID` int(11) NOT NULL,
  `ProposedChanges` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`ProposedChanges`)),
  `Status` enum('Pending','Approved','Rejected') DEFAULT 'Pending',
  `DateRequested` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `trackeditrequest`
--

INSERT INTO `trackeditrequest` (`RequestID`, `TrackID`, `UserID`, `ProposedChanges`, `Status`, `DateRequested`) VALUES
(1, 37, 9, '{\"TrackName\":\"King Fahad par2k\",\"DifficultyLevel\":\"\"}', 'Rejected', '2026-05-02 00:40:47'),
(4, 37, 9, '{\"LightingTypeID\":3}', 'Rejected', '2026-05-02 01:28:46'),
(5, 37, 9, '{\"SurfaceTypeID\":2}', 'Rejected', '2026-05-02 01:32:31'),
(6, 37, 9, '{\"sportTypes\":[1,2,4]}', 'Rejected', '2026-05-02 02:43:05'),
(13, 2, 8, '{\"Length_km\":1.14,\"HasSeparateLanes\":1,\"RoutePoints\":\"[{\\\"latitude\\\":24.08952445096696,\\\"longitude\\\":38.06440706381679},{\\\"latitude\\\":24.090151434684948,\\\"longitude\\\":38.07028598620189},{\\\"latitude\\\":24.08717131666994,\\\"longitude\\\":38.07449190750989}]\",\"sportTypes\":[1,4,2],\"amenity_ids\":[2]}', 'Approved', '2026-05-04 00:23:56'),
(17, 5, 8, '{\"Length_km\":1.17,\"Difficulty\":1,\"HasSeparateLanes\":1,\"SurfaceTypeID\":1,\"LightingTypeID\":3,\"RoutePoints\":\"[{\\\"latitude\\\":24.09066141698663,\\\"longitude\\\":38.06736783763302},{\\\"latitude\\\":24.088582381832516,\\\"longitude\\\":38.072474769176196},{\\\"latitude\\\":24.086545133364886,\\\"longitude\\\":38.07796788302962}]\",\"sportTypes\":[1,4,2]}', 'Approved', '2026-05-06 17:15:27'),
(18, 5, 8, '{\"sportTypes\":[1,2,4,3]}', 'Approved', '2026-05-12 17:39:48'),
(19, 5, 8, '{\"sportTypes\":[1,4]}', 'Rejected', '2026-05-12 17:42:24'),
(20, 5, 8, '{\"sportTypes\":[1,4]}', 'Rejected', '2026-05-12 17:42:58'),
(21, 5, 8, '{\"sportTypes\":[1,2,4]}', 'Approved', '2026-05-12 21:45:54'),
(22, 5, 8, '{\"sportTypes\":[1,2,4]}', 'Rejected', '2026-05-12 21:49:50'),
(23, 5, 8, '{\"sportTypes\":[1,2,4,3]}', 'Approved', '2026-05-13 12:44:20'),
(24, 5, 8, '{\"sportTypes\":[1,3,4]}', 'Rejected', '2026-05-13 13:10:15');

-- --------------------------------------------------------

--
-- Table structure for table `trackrating`
--

CREATE TABLE `trackrating` (
  `RatingID` int(11) NOT NULL,
  `TrackID` int(11) NOT NULL,
  `UserID` int(11) NOT NULL,
  `RatingValue` int(11) NOT NULL,
  `ReviewText` text DEFAULT NULL,
  `DatePosted` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tracksport`
--

CREATE TABLE `tracksport` (
  `TrackID` int(11) NOT NULL,
  `SportTypeID` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tracksport`
--

INSERT INTO `tracksport` (`TrackID`, `SportTypeID`) VALUES
(37, 1),
(37, 2),
(37, 3),
(37, 4),
(44, 1),
(44, 2),
(44, 3),
(44, 4),
(51, 1),
(51, 2),
(51, 3),
(51, 4);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `amenity`
--
ALTER TABLE `amenity`
  ADD PRIMARY KEY (`AmenityID`),
  ADD UNIQUE KEY `AmenityKey` (`AmenityKey`);

--
-- Indexes for table `appuser`
--
ALTER TABLE `appuser`
  ADD PRIMARY KEY (`UserID`),
  ADD UNIQUE KEY `Email` (`Email`);

--
-- Indexes for table `challenge`
--
ALTER TABLE `challenge`
  ADD PRIMARY KEY (`ChallengeID`),
  ADD KEY `UserID` (`UserID`),
  ADD KEY `TrackID` (`TrackID`),
  ADD KEY `fk_challenge_sporttype` (`SportTypeID`);

--
-- Indexes for table `favourite`
--
ALTER TABLE `favourite`
  ADD PRIMARY KEY (`UserID`,`TrackID`),
  ADD KEY `TrackID` (`TrackID`);

--
-- Indexes for table `lightingtype`
--
ALTER TABLE `lightingtype`
  ADD PRIMARY KEY (`LightingTypeID`);

--
-- Indexes for table `location`
--
ALTER TABLE `location`
  ADD PRIMARY KEY (`LocationID`);

--
-- Indexes for table `media`
--
ALTER TABLE `media`
  ADD PRIMARY KEY (`MediaID`),
  ADD KEY `TrackID` (`TrackID`),
  ADD KEY `UserID` (`UserID`);

--
-- Indexes for table `participation`
--
ALTER TABLE `participation`
  ADD PRIMARY KEY (`ChallengeID`,`UserID`),
  ADD KEY `UserID` (`UserID`);

--
-- Indexes for table `reports`
--
ALTER TABLE `reports`
  ADD PRIMARY KEY (`ReportID`),
  ADD KEY `ReporterID` (`ReporterID`);

--
-- Indexes for table `sporttype`
--
ALTER TABLE `sporttype`
  ADD PRIMARY KEY (`SportTypeID`);

--
-- Indexes for table `surfacetype`
--
ALTER TABLE `surfacetype`
  ADD PRIMARY KEY (`SurfaceTypeID`);

--
-- Indexes for table `track`
--
ALTER TABLE `track`
  ADD PRIMARY KEY (`TrackID`),
  ADD KEY `UserID` (`UserID`),
  ADD KEY `LocationID` (`LocationID`),
  ADD KEY `SurfaceTypeID` (`SurfaceTypeID`),
  ADD KEY `LightingTypeID` (`LightingTypeID`);

--
-- Indexes for table `trackamenity`
--
ALTER TABLE `trackamenity`
  ADD PRIMARY KEY (`TrackID`,`AmenityID`),
  ADD KEY `trackamenity_ibfk_2` (`AmenityID`);

--
-- Indexes for table `trackeditrequest`
--
ALTER TABLE `trackeditrequest`
  ADD PRIMARY KEY (`RequestID`),
  ADD KEY `TrackID` (`TrackID`),
  ADD KEY `UserID` (`UserID`);

--
-- Indexes for table `trackrating`
--
ALTER TABLE `trackrating`
  ADD PRIMARY KEY (`RatingID`),
  ADD KEY `TrackID` (`TrackID`),
  ADD KEY `UserID` (`UserID`);

--
-- Indexes for table `tracksport`
--
ALTER TABLE `tracksport`
  ADD PRIMARY KEY (`TrackID`,`SportTypeID`),
  ADD KEY `SportTypeID` (`SportTypeID`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `amenity`
--
ALTER TABLE `amenity`
  MODIFY `AmenityID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=20;

--
-- AUTO_INCREMENT for table `appuser`
--
ALTER TABLE `appuser`
  MODIFY `UserID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `challenge`
--
ALTER TABLE `challenge`
  MODIFY `ChallengeID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=26;

--
-- AUTO_INCREMENT for table `lightingtype`
--
ALTER TABLE `lightingtype`
  MODIFY `LightingTypeID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `location`
--
ALTER TABLE `location`
  MODIFY `LocationID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=57;

--
-- AUTO_INCREMENT for table `media`
--
ALTER TABLE `media`
  MODIFY `MediaID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=73;

--
-- AUTO_INCREMENT for table `reports`
--
ALTER TABLE `reports`
  MODIFY `ReportID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=59;

--
-- AUTO_INCREMENT for table `sporttype`
--
ALTER TABLE `sporttype`
  MODIFY `SportTypeID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `surfacetype`
--
ALTER TABLE `surfacetype`
  MODIFY `SurfaceTypeID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `track`
--
ALTER TABLE `track`
  MODIFY `TrackID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=57;

--
-- AUTO_INCREMENT for table `trackeditrequest`
--
ALTER TABLE `trackeditrequest`
  MODIFY `RequestID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=25;

--
-- AUTO_INCREMENT for table `trackrating`
--
ALTER TABLE `trackrating`
  MODIFY `RatingID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=23;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `challenge`
--
ALTER TABLE `challenge`
  ADD CONSTRAINT `challenge_ibfk_1` FOREIGN KEY (`UserID`) REFERENCES `appuser` (`UserID`),
  ADD CONSTRAINT `challenge_ibfk_2` FOREIGN KEY (`TrackID`) REFERENCES `track` (`TrackID`),
  ADD CONSTRAINT `fk_challenge_sporttype` FOREIGN KEY (`SportTypeID`) REFERENCES `sporttype` (`SportTypeID`) ON DELETE SET NULL;

--
-- Constraints for table `favourite`
--
ALTER TABLE `favourite`
  ADD CONSTRAINT `favourite_ibfk_1` FOREIGN KEY (`UserID`) REFERENCES `appuser` (`UserID`) ON DELETE CASCADE,
  ADD CONSTRAINT `favourite_ibfk_2` FOREIGN KEY (`TrackID`) REFERENCES `track` (`TrackID`) ON DELETE CASCADE;

--
-- Constraints for table `media`
--
ALTER TABLE `media`
  ADD CONSTRAINT `media_ibfk_1` FOREIGN KEY (`TrackID`) REFERENCES `track` (`TrackID`),
  ADD CONSTRAINT `media_ibfk_2` FOREIGN KEY (`UserID`) REFERENCES `appuser` (`UserID`);

--
-- Constraints for table `participation`
--
ALTER TABLE `participation`
  ADD CONSTRAINT `participation_ibfk_1` FOREIGN KEY (`ChallengeID`) REFERENCES `challenge` (`ChallengeID`),
  ADD CONSTRAINT `participation_ibfk_2` FOREIGN KEY (`UserID`) REFERENCES `appuser` (`UserID`);

--
-- Constraints for table `reports`
--
ALTER TABLE `reports`
  ADD CONSTRAINT `reports_ibfk_1` FOREIGN KEY (`ReporterID`) REFERENCES `appuser` (`UserID`) ON DELETE CASCADE;

--
-- Constraints for table `track`
--
ALTER TABLE `track`
  ADD CONSTRAINT `track_ibfk_1` FOREIGN KEY (`UserID`) REFERENCES `appuser` (`UserID`),
  ADD CONSTRAINT `track_ibfk_2` FOREIGN KEY (`LocationID`) REFERENCES `location` (`LocationID`),
  ADD CONSTRAINT `track_ibfk_3` FOREIGN KEY (`SurfaceTypeID`) REFERENCES `surfacetype` (`SurfaceTypeID`),
  ADD CONSTRAINT `track_ibfk_4` FOREIGN KEY (`LightingTypeID`) REFERENCES `lightingtype` (`LightingTypeID`);

--
-- Constraints for table `trackamenity`
--
ALTER TABLE `trackamenity`
  ADD CONSTRAINT `trackamenity_ibfk_1` FOREIGN KEY (`TrackID`) REFERENCES `track` (`TrackID`) ON DELETE CASCADE,
  ADD CONSTRAINT `trackamenity_ibfk_2` FOREIGN KEY (`AmenityID`) REFERENCES `amenity` (`AmenityID`) ON DELETE CASCADE;

--
-- Constraints for table `trackeditrequest`
--
ALTER TABLE `trackeditrequest`
  ADD CONSTRAINT `trackeditrequest_ibfk_1` FOREIGN KEY (`TrackID`) REFERENCES `track` (`TrackID`) ON DELETE CASCADE,
  ADD CONSTRAINT `trackeditrequest_ibfk_2` FOREIGN KEY (`UserID`) REFERENCES `appuser` (`UserID`) ON DELETE CASCADE;

--
-- Constraints for table `trackrating`
--
ALTER TABLE `trackrating`
  ADD CONSTRAINT `trackrating_ibfk_1` FOREIGN KEY (`TrackID`) REFERENCES `track` (`TrackID`),
  ADD CONSTRAINT `trackrating_ibfk_2` FOREIGN KEY (`UserID`) REFERENCES `appuser` (`UserID`);

--
-- Constraints for table `tracksport`
--
ALTER TABLE `tracksport`
  ADD CONSTRAINT `tracksport_ibfk_1` FOREIGN KEY (`TrackID`) REFERENCES `track` (`TrackID`),
  ADD CONSTRAINT `tracksport_ibfk_2` FOREIGN KEY (`SportTypeID`) REFERENCES `sporttype` (`SportTypeID`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
