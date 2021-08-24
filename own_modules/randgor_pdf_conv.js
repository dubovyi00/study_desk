const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");
const os = require('os');

const tmpdir = path.join(os.tmpdir(), "pdfconv")
console.log("tmpdir", tmpdir)

function generateTempName(){
  var out = ""
  while (out.length < 30)
    out += Math.random().toString(36).substring(2);
  return out.substring(0,30)
}

function parseCommand(librePath, cmd) {
  let _args = [];

  var envTmpDir = "-env:UserInstallation=file:///" + path.join(tmpdir, generateTempName()).split("\\").join('/');
    
  console.log("envTmpDir", envTmpDir)

  if (process.platform === "win32") {
    _args.push("/c");
    _args.push(librePath);
  }
  _args.push(envTmpDir)

  _args = _args.concat(cmd);

  return { _args };
}


function fileExist(file) {
  try {
      fs.accessSync(file, fs.constants.F_OK)
      return true;
  } catch (err) {
      return false;
  }
}

function run(libreOfficeBin, cmd, outputFile) {
  return new Promise((resolve, reject) => {
    const { _args } = parseCommand(libreOfficeBin, cmd);
    let _cmd = libreOfficeBin;

    
    console.log("_args", _args)

    const proc = spawn(_cmd, _args);

    proc.stderr.on("error", function (err) {
      reject(err);
    });

    proc.on("close", (code) => {
      if(code === 0) {
        var uselessDir = cmd[5]
        fs.readdirSync(uselessDir).forEach(file => {
          var old = path.join(uselessDir, file)
          var newPath = outputFile
          
          fs.renameSync(old, newPath)
        });
        fs.rmdirSync(uselessDir);
      }
      const status = code === 0 ? "Success" : "Error";
      resolve(status);
    });
  });
}

var libreDefaults = [
  "C:\\Program Files\\LibreOffice\\program\\soffice.exe",
  "C:\\Program Files (x86)\\LibreOffice\\program\\soffice.exe",
  "C:\\Program Files (x86)\\LIBREO~1\\program\\soffice.exe",
  "/usr/bin/libreoffice",
  "/usr/bin/soffice",
  "/Applications/LibreOffice.app/Contents/MacOS/soffice"
]

var libreofficeBin = ""

for(const libreNext of libreDefaults)
    libreofficeBin = fileExist(libreNext)?libreNext:libreofficeBin

if (libreofficeBin == "") {
    console.error("No Libre Office found on this server!")
    return null;
}

exports.convert = function ({
  sourceFile,
  outputFile,
}) {
  const ext = path.extname(sourceFile.toLowerCase());

  //don't add/remove params because off calls by index
  const pdf = [
    "--headless",
    "--safe-mode",
    "--convert-to",
    "pdf",
    "--outdir",
    sourceFile+"_temp",
    sourceFile,
  ];




  if(fileExist(sourceFile)) {
    var extShort = ext.substring(1)

    if("xlsx;xlsm;xlsb;xlam;xltx;xltm;xls;xlt;xla;xlm;xlw;odc;ods;prn;csv;dsn;mdb;mde;accdb;accde;dbc;iqy;dqy;rqy;oqy;cub;atom;atomsvc;dbf;xll;xlb;slk;dif;xlk;bak;pptx;ppt;pptm;ppsx;pps;ppsm;potx;pot;potm;odp;thmx;docx;docm;doc;ppam;ppa;docx;docm;dotx;dotm;doc;odt;docx;docm;doc;dotx;dotm;dotx;dotm;rtf;odt;doc;wpd;doc".split(";").indexOf(extShort)!=-1) {
      return run(libreofficeBin, pdf, outputFile).then((pdfRes) => {
        console.log("conv status: " + pdfRes, sourceFile)
        if(pdfRes == "Error")
          return null;
        return pdfRes;
      });
    } else {
      console.log("Wrong file extension:", ext)
      return null;
    }
  } else {
    console.log("File was not found:", sourceFile)
    return null;
  }
};
