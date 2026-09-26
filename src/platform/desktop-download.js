function downloadDesktopApp(){
  try { localStorage.setItem('prospector_desktop_download_clicked', '1'); } catch(e) {}
  window.open('https://sebo2203.github.io/Prospector-II/downloads/Prospector-II-v0.25-portable.exe', '_blank');
  drawMenuScreen();
}

function shouldShowDesktopDownload(){
  try {
    if(window.__TAURI__?.core || window.__TAURI__?.invoke) return false;
    if(localStorage.getItem('prospector_desktop_download_clicked') === '1') return false;
  } catch(e) {}
  return true;
}

