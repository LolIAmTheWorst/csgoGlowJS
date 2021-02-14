const { app, BrowserWindow, Tray, Menu } = require('electron')
const path = require('path')
const memoryjs = require('memoryjs');
const fetch = require("node-fetch");
const processName = "csgo.exe";
const offsets = {}; 


async function createWindow () {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    show: false,
    webPreferences: {
      nodeIntegration: true
    }
  })
  const iconPath = path.join(__dirname, 'assets/skull.png');
  tray = new Tray(iconPath);
  const contextMenu = Menu.buildFromTemplate([
      {
        label: 'Tokei',
        type: 'normal',
        click: () => { 
          /* Later this will open the Main Window */ 
        }
      },
      {
        label: 'Quit',
        type: 'normal',
        click: () => app.quit()
      }
  ])
  tray.setToolTip('CSGO GLOW BY RAFAEL E BERTINHO')
  tray.setContextMenu(contextMenu)
  win.loadFile('index.html')
  



  const hazeDump = await fetch('https://raw.githubusercontent.com/frk1/hazedumper/master/csgo.json')
  const hazeDumpJson = await hazeDump.json();
  
  offsets.dwGlowObjectManager = hazeDumpJson.signatures.dwGlowObjectManager
  offsets.dwEntityList = hazeDumpJson.signatures.dwEntityList
  offsets.m_iTeamNum = hazeDumpJson.netvars.m_iTeamNum
  offsets.m_iGlowIndex = hazeDumpJson.netvars.m_iGlowIndex
  offsets.m_iHealth = hazeDumpJson.netvars.m_iHealth
  offsets.m_bSpotted = hazeDumpJson.netvars.m_bSpotted
  offsets.m_bIsScoped = hazeDumpJson.netvars.m_bIsScoped
  
  console.log(offsets)


  const processObject = memoryjs.openProcess(processName);
  const client = memoryjs.findModule('client.dll', processObject.th32ProcessID);
  
  
  glowAndRadar(client, processObject)
  
  
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

function trigger(client, processObject){

    LocalPlayer = memoryjs.readMemory(processObject.handle, client.hModule + 0xD8A2BC, memoryjs.INT32)
    Id = memoryjs.readMemory(processObject.handle, LocalPlayer + 0xB3E4, memoryjs.INT32)
    if(Id > 0 && Id < 64){
      entity = memoryjs.readMemory(processObject.handle, client.hModule + 0x4DA1F24 + ((Id - 1) * 0x10), memoryjs.INT32)
      myTeam =  memoryjs.readMemory(processObject.handle, LocalPlayer + 0xF4, memoryjs.INT32)
      EntTeam = memoryjs.readMemory(processObject.handle, entity + 0xF4, memoryjs.INT32)
      if(myTeam != EntTeam){
        memoryjs.writeMemory(processObject.handle, client.hModule + 0x31D3460, 6, memoryjs.INT32)
      }
    }

}

async function glowAndRadar(client, processObject){
    while (true) {
    //trigger(client, processObject)

    const glow_manager = memoryjs.readMemory(processObject.handle, client.hModule + offsets.dwGlowObjectManager, memoryjs.INT32);
    
    for(var i=1; i<=64; i++){
      var entidade = memoryjs.readMemory(processObject.handle, client.hModule + offsets.dwEntityList + i * 0x10, memoryjs.INT32)
      
      if(entidade){
        
        var entity_team_id = memoryjs.readMemory(processObject.handle, entidade + offsets.m_iTeamNum, memoryjs.INT32)
        var entity_glow = memoryjs.readMemory(processObject.handle, entidade + offsets.m_iGlowIndex, memoryjs.INT32)
        
        if(entity_team_id == 2){
                memoryjs.writeMemory(processObject.handle, (glow_manager + ((entity_glow * 0x38) + 0x4)), 1.0, memoryjs.FLOAT)
                memoryjs.writeMemory(processObject.handle, (glow_manager + ((entity_glow * 0x38) + 0x8)), 0.0, memoryjs.FLOAT)
                memoryjs.writeMemory(processObject.handle, (glow_manager + ((entity_glow * 0x38) + 0xC)), 0.0, memoryjs.FLOAT)
                memoryjs.writeMemory(processObject.handle, (glow_manager + ((entity_glow * 0x38) + 0x10)), 1.1, memoryjs.FLOAT)
                memoryjs.writeMemory(processObject.handle, (glow_manager + ((entity_glow * 0x38) + 0x24)), true, "bool");
                memoryjs.writeMemory(processObject.handle, (glow_manager + ((entity_glow * 0x38) + 0x25)), false, "bool");
        }

        if(entity_team_id == 3){
                memoryjs.writeMemory(processObject.handle, (glow_manager + ((entity_glow * 0x38) + 0x4)), 0.0, memoryjs.FLOAT)
                memoryjs.writeMemory(processObject.handle, (glow_manager + ((entity_glow * 0x38) + 0x8)), 0.0, memoryjs.FLOAT)
                memoryjs.writeMemory(processObject.handle, (glow_manager + ((entity_glow * 0x38) + 0xC)), 1.0, memoryjs.FLOAT)
                memoryjs.writeMemory(processObject.handle, (glow_manager + ((entity_glow * 0x38) + 0x10)), 1.0, memoryjs.FLOAT)
                memoryjs.writeMemory(processObject.handle, (glow_manager + ((entity_glow * 0x38) + 0x24)), true, "bool");
                memoryjs.writeMemory(processObject.handle, (glow_manager + ((entity_glow * 0x38) + 0x25)), false, "bool");
        }

        memoryjs.writeMemory(processObject.handle, entidade + offsets.m_bSpotted, 1, memoryjs.INT32)
      }

    }

 }
}