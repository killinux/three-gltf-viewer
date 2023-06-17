import { Viewer } from './viewer.js';
import { SimpleDropzone } from 'simple-dropzone';
import queryString from 'query-string';
import { ColorManagement } from 'three';

window.is_loadgltf_at_start = true;//add by hao for start load gltf
window.VIEWER = {};

if (!(window.File && window.FileReader && window.FileList && window.Blob)) {
  console.error('The File APIs are not fully supported in this browser.');
}
class App {
  constructor (el, location) {
    console.log("app constructor--->");
    console.log(location);
    
    const hash = location.hash ? queryString.parse(location.hash) : {};
    this.options = {
      kiosk: Boolean(hash.kiosk),
      model: hash.model || '',
      preset: hash.preset || '',
      cameraPosition: hash.cameraPosition
        ? hash.cameraPosition.split(',').map(Number)
        : null
    };
    this.el = el;
    this.viewer = null;
    this.viewerEl = null;
    this.spinnerEl = el.querySelector('.spinner');
    this.dropEl = el.querySelector('.dropzone');
    this.inputEl = el.querySelector('#file-input');
    this.createDropzone();
    this.hideSpinner();

    const options = this.options;
    console.log(options.model);
    if (options.kiosk) {
      const headerEl = document.querySelector('header');
      headerEl.style.display = 'none';
    }

    if (options.model) {
      console.log("model----->"+options.model);
      this.view(options.model, '', new Map());
    }
  }
  createDropzone () {
    if(window.is_loadgltf_at_start==true){//add by hao 直接加载gltf
      this.appload("");
    };
  }
  createViewer () {
    this.viewerEl = document.createElement('div');
    this.viewerEl.classList.add('viewer');
    this.dropEl.innerHTML = '';
    this.dropEl.appendChild(this.viewerEl);
    this.viewer = new Viewer(this.viewerEl, this.options);
    return this.viewer;
  }
  appload (fileMap) {
    if(window.is_loadgltf_at_start==true){ //add by hao 
      //const this_url="./model/tiny_house.glb";
      const this_url="./model/new_witch_naked.glb";
      console.log("from loadgltf.js, ----->appload, this_url:"+this_url);
      this.view(this_url, "", "");
    }
  }
  view (rootFile, rootPath, fileMap) {
    if (this.viewer) this.viewer.clear();
    const viewer = this.viewer || this.createViewer();
    const fileURL = typeof rootFile === 'string'
      ? rootFile
      : URL.createObjectURL(rootFile);
    const cleanup = () => {
      this.hideSpinner();
      if (typeof rootFile === 'object') URL.revokeObjectURL(fileURL);
    };
    viewer
      .load(fileURL, rootPath, fileMap)
      .catch((e) => this.onError(e))
      .then((gltf) => {
        if (!this.options.kiosk) {
          console.log("viewr.load validate--->error----->");
          console.log(this.options);
          //this.validator.validate(fileURL, rootPath, fileMap, gltf);
        }
        cleanup();
      });
  }
  onError (error) {
    let message = (error||{}).message || error.toString();
    if (message.match(/ProgressEvent/)) {
      message = 'Unable to retrieve this file. Check JS console and browser network tab.';
    } else if (message.match(/Unexpected token/)) {
      message = `Unable to parse file content. Verify that this file is valid. Error: "${message}"`;
    } else if (error && error.target && error.target instanceof Image) {
      message = 'Missing texture: ' + error.target.src.split('/').pop();
    }
    window.alert(message);
    console.error(error);
  }
  showSpinner () {
    this.spinnerEl.style.display = '';
  }
  hideSpinner () {
    this.spinnerEl.style.display = 'none';
  }
}
document.addEventListener('DOMContentLoaded', () => {
  const app = new App(document.body, location);
  window.VIEWER.app = app;
  console.info('[glTF Viewer] Debugging data exported as `window.VIEWER`.');
});
function isIFrame () {
    try {
        return window.self !== window.top;
    } catch (e) {
        return true;
    }
}

// bandwidth on this page is very high. hoping to
// figure out what percentage of that is embeds.
//Tinybird.trackEvent('load', {embed: isIFrame()});
