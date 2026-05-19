# **Masar 🏃‍♂️🗺️**

**Discovery Platform for Outdoor Sports Tracks**

This guide provides the complete, step-by-step process to run the Masar full-stack application (React Native Frontend \+ PHP Backend) locally on an Android Emulator.

## **🛠️ 1\. Required Software**

Please ensure the following tools are installed on your machine before proceeding:

* [**Node.js**](https://nodejs.org/) (LTS version required to run the Expo frontend)  
* [**XAMPP**](https://www.apachefriends.org/download.html) (To host the local PHP/MySQL backend)  
* [**Android Studio**](https://developer.android.com/studio) (To run the Android Virtual Device / Emulator)

## **⚙️ 2\. Backend Setup (XAMPP & Database)**

1. Open the **XAMPP Control Panel** and Start both **Apache** and **MySQL**.  
2. Locate the `Backend` folder in this repository.  
3. Copy the entire `Backend` folder and paste it into your XAMPP `htdocs` directory (Default Windows path: `C:\xampp\htdocs`).  
4. Rename the folder inside `htdocs` to `masar-backend` (Path should now be `C:\xampp\htdocs\masar-backend`).  
5. Open a web browser and navigate to `http://localhost/phpmyadmin`.  
6. Click **New** on the left sidebar to create a new database. Name the database exactly **`masar_db`** and click Create.  
7. Select `masar_db` from the sidebar, click the **Import** tab at the top, select the `.sql` database file included in this repository, and click **Import** at the bottom.

## **📱 3\. Frontend Setup & Critical IP Configuration**

1. Open your terminal or command prompt and navigate to the frontend folder:  
   cd Frontend/masar-frontend    
2. Install all required dependencies:  
   npm install  
    
3. **CRITICAL STEP FOR EMULATORS:** You must configure the app to talk to your local machine's database. Android Emulators cannot use `localhost`; they use a specific alias IP (`10.0.2.2`) to access the host machine's local server.  
   You must open your code editor and change the IP address to `10.0.2.2` inside these **3 specific frontend files**:  
   * **File 1 (`src/api/config.js`)**: Change `baseURL` to `'http://10.0.2.2/masar-backend'`  
   * **File 2 (`src/screens/Main/TrackDetailsScreen.js`)**: Change `BASE_IMAGE_URL` to `'http://10.0.2.2/masar-backend/public/'`  
   * **File 3 (`src/screens/Admin/AdminEntityReviewScreen.js`)**: Change `BASE_IMAGE_URL` to `'http://10.0.2.2/masar-backend/public/'`

## **🚀 4\. Launching the Application**

1. Open **Android Studio**. Go to **Virtual Device Manager** and launch your Android Emulator by clicking the Play button. Wait for the Android home screen to fully load.  
2. Return to your terminal (ensure you are still inside `Frontend/masar-frontend`).  
3. Start the Expo server by running:  
   npx expo start  
4. Once the server starts and the QR code appears in the terminal, press the **`a`** key on your keyboard.  
5. Expo will automatically install the required Expo Go client on the running emulator, bundle the JavaScript, and launch Masar.  
