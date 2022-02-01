const $ = require('../../node_modules/jquery')  // jQuery now loaded and assigned to $
const { ipcRenderer } = require('electron')

$('#inputDirectory').on('click', (e) => {
  e.preventDefault();
  ipcRenderer.send('choose-folder','true');
});

$('#btnGenerateCSV').on('click', () => {
  ipcRenderer.send('process-folder', $("#inputDirectoryPath").val());
});

$('#inputCSV').on('click', (e) => {
  e.preventDefault();
  ipcRenderer.send('choose-csv','true');
});

$('#btnUploadCSV').on('click', (e) => {
  e.preventDefault();
  ipcRenderer.send('process-csv',$("#inputCSVPath").val());
});

ipcRenderer.on('sel-dir', (event, path) => {
  $("#inputDirectoryPath").val(path);
  if (path !== "") {
    $("#btnGenerateCSV").prop('disabled', false);
  } else {
    $("#btnGenerateCSV").prop('disabled', true);
  }
})

ipcRenderer.on('saved-csv', (event, name) => {
  alert("The file " + name + " has been saved. Edit new filenames to process it.")
})

ipcRenderer.on('sel-file', (event, path) => {
  $("#inputCSVPath").val(path);
  if (path !== "") {
    $("#btnUploadCSV").prop('disabled', false);
  } else {
    $("#btnUploadCSV").prop('disabled', true);
  }
})

ipcRenderer.on('error-renaming', (event, file, err) => {
  alert("Error: " + err + " renaming the file named " + file + ".");
});

ipcRenderer.on('file-processed', (event, message) => {
  alert(message);
});

