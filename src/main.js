const { app, dialog, ipcMain, BrowserWindow, Menu } = require('electron');
const url = require('url');
const fs = require('fs');
const path = require('path');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const csv = require('csv-parser');


let mainWindow, helpWindow;
let cvsData = [];

if (process.env.NODE_ENV !== 'production') {
    require('electron-reload')(__dirname, {
        // electron: path.join(__dirname, '../node-modules', '.bin', 'electron')
    });
}

var menu = Menu.buildFromTemplate([
    {
        label: 'File',
        submenu: [{
            label:'Exit',
            click() { 
                app.quit() 
            } 
        }]
    },
    {
        label: 'Help',
        submenu: [{
            label:'Show help',
            click() { 
                helpWindow = new BrowserWindow({
                    height: 400, 
                    width: 400,
                    webPreferences: {
                        nodeIntegration: true,
                        contextIsolation: false,
                    }
                })
                helpWindow.loadURL(url.format({
                    pathname: path.join(__dirname, 'views/other-view.html'),
                    protocol: 'file',
                    slashes: true
                }));
            } 
        }]
    }
]);
Menu.setApplicationMenu(menu); 

app.on('ready', () => {
    mainWindow = new BrowserWindow({
        height: 600, 
        width: 800,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: true
        }
    })
    mainWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'views/index.html'),
        protocol: 'file',
        slashes: true
    }));
});

ipcMain.on('choose-folder', async (event,arg) => {
    const result = await dialog.showOpenDialog(mainWindow, {
        title: 'Select folder',
        defaultPath : "\\",
        buttonLabel : "Select folder",
        properties: ['openDirectory']
    });
    event.sender.send('sel-dir', result.filePaths);
    console.log('directories selected', result.filePaths)
});

ipcMain.on('process-folder', async (event, fsPath) => {
    if (fsPath !== '') {
        let dialogObject = await dialog.showSaveDialog(mainWindow, {
            title: "Save file - Electron example",
            defaultPath : path.join(fsPath, 'filenames.csv'),
            buttonLabel : "Save CSV File",
            filters :[
                {name: 'CSV', extensions: ['csv']},
                {name: 'All Files', extensions: ['*']}
            ]
        });
        if (!dialogObject.canceled) {
            const csvWriter = createCsvWriter({
                path: dialogObject.filePath,
                header: [
                  {id: 'path', title: 'Path'},
                  {id: 'extension', title: 'Extension'},
                  {id: 'oldname', title: 'OldName'},
                  {id: 'newname', title: 'NewName'},
                ]
            });
            fs.readdirSync(fsPath).forEach(file => {
                cvsData.push({
                    path: fsPath, 
                    extension: path.parse(file).ext, 
                    oldname: path.parse(file).name, 
                    newname: ''
                });
            });
            csvWriter.writeRecords(cvsData).then(()=> {
                event.sender.send('saved-csv', dialogObject.filePath);
                console.log('The CSV file was written successfully')
            });
        }
    }
});

ipcMain.on('choose-csv', async (event, arg) => {
    const result = await dialog.showOpenDialog(mainWindow, {
        title: 'Select csv',
        defaultPath : "\\",
        buttonLabel : "Select file",
        properties: ['openFile'],
        filters :[
            {name: 'CSV', extensions: ['csv']},
            {name: 'All Files', extensions: ['*']}
        ]
    });
    event.sender.send('sel-file', result.filePaths);
    console.log('File selected', result.filePaths)
});

ipcMain.on('process-csv', (event, fsPath) => {
    fs.createReadStream(fsPath)
    .pipe(csv())
    .on('data', (row) => {
        let oldFileName = path.join(row.Path, row.OldName + row.Extension);
        let newFileName = path.join(row.Path, row.NewName + row.Extension);
        if (row.NewName){
            fs.rename(oldFileName, newFileName, function(err) {
                if ( err ) {
                    event.sender.send('error-renaming', oldFileName, err);
                    console.log('ERROR: ' + err);
                }
            });
        }
    })
    .on('end', () => {
        event.sender.send('file-processed', 'CSV file successfully processed.');
    });
});