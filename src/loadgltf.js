import WebGL from 'three/examples/jsm/capabilities/WebGL.js';
import { Viewer } from './viewer.js';
import { SimpleDropzone } from 'simple-dropzone';
import { Validator } from './validator.js';
import { Footer } from './components/footer';
import queryString from 'query-string';

window.is_loadgltf_at_start = true;//add by hao for start load gltf
window.VIEWER = {};

if (!(window.File && window.FileReader && window.FileList && window.Blob)) {
  console.error('The File APIs are not fully supported in this browser.');
} else if (!WebGL.isWebGLAvailable()) {
  console.error('WebGL is not supported in this browser.');
}

class App {

  /**
   * @param  {Element} el
   * @param  {Location} location
   */
  constructor (el, location) {

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
    this.validator = new Validator(el);

    this.createDropzone();
    this.hideSpinner();

    const options = this.options;

    if (options.kiosk) {
      const headerEl = document.querySelector('header');
      headerEl.style.display = 'none';
    }

    if (options.model) {
      this.view(options.model, '', new Map());
    }
  }

  /**
   * Sets up the drag-and-drop controller.
   */
  createDropzone () {
    //console.log("from loadgltf.js 这里是关键 ---->createDropzone:可以在这里加gltf 解析成file ");
    //add by hao 
    //this.view("from_url", rootPath, fileMap);
    if(window.is_loadgltf_at_start==true){//add by hao 直接加载gltf
      this.appload("");
    }
    

    const dropCtrl = new SimpleDropzone(this.dropEl, this.inputEl);
    dropCtrl.on('drop', ({files}) => this.appload(files));
    dropCtrl.on('dropstart', () => this.showSpinner());
    dropCtrl.on('droperror', () => this.hideSpinner());
  }

  /**
   * Sets up the view manager.
   * @return {Viewer}
   */
  createViewer () {
    this.viewerEl = document.createElement('div');
    this.viewerEl.classList.add('viewer');
    this.dropEl.innerHTML = '';
    this.dropEl.appendChild(this.viewerEl);
    //console.log("-------->createViewer");
    //console.log(this.viewerEl);
    this.viewer = new Viewer(this.viewerEl, this.options);
    return this.viewer;
  }

  /**
   * Loads a fileset provided by user action.
   * @param  {Map<string, File>} fileMap
   */
  //load (fileMap) {
  appload (fileMap) {
    if(window.is_loadgltf_at_start==true){ //add by hao 
      const this_url="./model/tiny_house.glb";
      //const this_url="./model/new_witch_naked.glb";
      
      console.log("from loadgltf.js, ----->appload, this_url:"+this_url);
      this.view(this_url, "", "");
    }else{
      let rootFile;
      let rootPath;
      Array.from(fileMap).forEach(([path, file]) => {
        if (file.name.match(/\.(gltf|glb)$/)) {
          
          rootFile = file;
          rootPath = path.replace(file.name, '');
        }
      });
  
      if (!rootFile) {
        this.onError('No .gltf or .glb asset found.');
      }
      console.log("load-------->rootFile:"+rootFile+",rootPath:"+rootPath+",fileMap:"+fileMap);
      console.log(rootFile);
      this.view(rootFile, rootPath, fileMap);
    }
  }

  /**
   * Passes a model to the viewer, given file and resources.
   * @param  {File|string} rootFile
   * @param  {string} rootPath
   * @param  {Map<string, File>} fileMap
   */
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
          //console.log("viewr.load validate--->");
          this.validator.validate(fileURL, rootPath, fileMap, gltf);
        }
        cleanup();
      });
  }

  /**
   * @param  {Error} error
   */
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

document.body.innerHTML += Footer();

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
Tinybird.trackEvent('load', {embed: isIFrame()});
