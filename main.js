// Importing necessary modules from Electron API
const { app, BrowserWindow, globalShortcut, ipcMain } = require("electron");

// Importing path module for handling and transforming file paths
const path = require("path");

// Importing NeDB, a lightweight JavaScript database, for storing data
const Datastore = require("nedb");

// Require electron-reload to enable live reloading on file changes
// require("electron-reload")(__dirname);

// Declare mainWindow variable to keep a global reference of the window object
let mainWindow;

// Function to create a new browser window
function createWindow() {
  // Create a new BrowserWindow with specific options
  mainWindow = new BrowserWindow({
    width: 640,
    height: 700,
    webPreferences: {
      preload: path.join(app.getAppPath(), "preload.js"), // File to be loaded before other scripts run in the page
      nodeIntegration: true, // Enable integration of Node.js APIs in the renderer process
      contextIsolation: false, // Disable context isolation so that preload scripts can use Node.js APIs
    },
    resizable: true, // Make the window non-resizable
    frame: false, // Remove the frame
    hasShadow: true, // Add shadow
    transparent: true, // Make the window transparent
    backgroundColor: "#00000000", // Set background color to transparent
  });

  // Remove the menu
  // mainWindow.setMenu(null);

  // Create new menu template
  const mainMenu = [
    {
      label: "File",
      submenu: [
        {
          label: "Quit",
          accelerator: "CommandOrControl+Q",
          click() {
            app.quit();
          },
        },
      ],
    },
  ];

  // Add the menu to the window
  // Menu.setApplicationMenu(Menu.buildFromTemplate(mainMenu));

  // Open the DevTools
  // mainWindow.webContents.openDevTools();

  // Load index.html into the new BrowserWindow
  mainWindow.loadFile("index.html");

  // Event listener for when the window is closed
  mainWindow.on("closed", function () {
    // Dereference the window object
    mainWindow = null;
  });
}

// When Electron has finished initialization and is ready to create browser windows
app.whenReady().then(() => {
  createWindow();

  // Register a 'Ctrl+Shift+0' shortcut listener.
  const ret = globalShortcut.register("CommandOrControl+Shift+0", () => {
    if (mainWindow.isVisible()) {
      mainWindow.hide();
    } else {
      mainWindow.show();
    }
  });

  if (!ret) {
    console.log("registration failed");
  }

  // Check whether the shortcut is registered.
  console.log(globalShortcut.isRegistered("CommandOrControl+Shift+0"));

  // Event listener for when the application is activated
  app.on("activate", function () {
    // If there's no window, create one
    if (mainWindow === null) createWindow();
  });
});

// Don't forget to unregister the shortcut when the app is quitting
app.on("will-quit", () => {
  // Unregister all shortcuts.
  globalShortcut.unregisterAll();
});

// Event listener for when all windows are closed
app.on("window-all-closed", function () {
  // On macOS, applications stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== "darwin") app.quit();
});

// Create notes database in the app's user data directory
const db = new Datastore({
  filename: path.join(app.getPath("userData"), "notes.db"),
  autoload: true,
});

// IPC event listener for adding a note
ipcMain.on("add-note", (event, { note, extraNote }) => {
  // Date and time of note creation
  const date = new Date();
  const dateTime = date.toLocaleString();

  // Insert the note into the database
  db.insert({ note, extraNote, dateTime }, function (err, newDoc) {
    // Log any errors
    if (err) {
      console.log(err);
      return;
    }

    console.log(newDoc);

    // Reply to the sender with the ID of the added note
    event.reply("note-added", newDoc._id);
  });
});

// IPC event listener for editing a note
ipcMain.on("edit-note", (event, { id, note, extraNote }) => {
  // Date and time of note creation
  const date = new Date();
  const dateTime = date.toLocaleString();

  // Update the note in the database
  db.update(
    { _id: id },
    { $set: { note, extraNote, dateTime } },
    {},
    function (err, numReplaced) {
      // Log any errors
      if (err) {
        console.log(err);
        return;
      }
      // Reply to the sender with the ID of the edited note
      event.reply("note-edited", id);
    }
  );
});

// IPC event listener for deleting a note
ipcMain.on("delete-note", (event, { id }) => {
  // Remove the note from the database
  db.remove({ _id: id }, {}, function (err, numRemoved) {
    // Log any errors
    if (err) {
      console.log(err);
      return;
    }
    // Reply to the sender with the ID of the deleted note
    event.reply("note-deleted", id);
  });
});

// IPC event listener for getting notes
ipcMain.on("get-notes", (event) => {
  // Find all documents in the database
  db.find({}, function (err, docs) {
    // Log any errors
    if (err) {
      console.log(err);
      return;
    }

    // Sort the notes by date and time descending
    docs.sort((a, b) => {
      return new Date(b.dateTime) - new Date(a.dateTime);
    });

    // Reply to the sender with the found documents
    event.reply("notes", docs);
  });
});

// IPC event listener for getting a note
ipcMain.on("get-note", (event, { id }) => {
  // Find the document in the database
  db.findOne({ _id: id }, function (err, doc) {
    // Log any errors
    if (err) {
      console.log(err);
      return;
    }
    // Reply to the sender with the found document
    event.reply("note", doc);
  });
});
