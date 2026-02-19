class Uploader {
  constructor(options) {
    this.fileInputId = options.fileInputId;
    this.url = options.url;
    this.headers = options.headers;
    this.started = options.started;
    this.progress = options.progress;
    this.completed = options.completed;
    this.error = options.error;
    this.fileList = [];
    this.uploading = false;
    this.init();
  }

  init() {
    this.addEvents();
  }

  addEvents() {
    const fileInput = document.getElementById(this.fileInputId);
    fileInput.addEventListener('change', (e) => {
      this.generateList(e.target.files);
    });
  }

  generateList(files) {
    Array.from(files).forEach((singleFile) => {
      let fileId = this.uniqueId();

      this.fileList.push({
        id: fileId,
        file: singleFile,
      });
    });

    this.started(this.fileList);
    this.uploadFromList();
  }

  uploadFromList() {
    if (this.fileList.length == 0 || this.uploading) {
      return;
    }

    let ajax = new XMLHttpRequest();
    let formData = new FormData();
    let file = this.fileList[0];

    formData.append('files[]', file.file);

    ajax.upload.addEventListener(
      'progress',
      (e) => {
        let percent = Math.floor((e.loaded / e.total) * 100);
        this.uploading = true;
        this.progress(file.id, percent);
      },
      false,
    );

    ajax.addEventListener(
      'error',
      (e) => {
        this.uploading = false;
        this.fileList.shift();
        this.uploadFromList();
        this.error(file.id, 'Error occured!');
      },
      false,
    );

    ajax.addEventListener(
      'abort',
      (e) => {
        this.uploading = false;
        this.error(file.id, 'Aborted!');
      },
      false,
    );

    ajax.addEventListener(
      'load',
      (e) => {
        this.uploading = false;
        this.fileList.shift();
        this.uploadFromList();
        if (e.target.status == 200) {
          this.completed(file.id, 'File uploaded!');
        } else {
          this.error(file.id, e.target.statusText);
        }
      },
      false,
    );

    ajax.open('POST', this.url);

    Object.keys(this.headers).forEach((key, i) => {
      console.log(key, this.headers[key]);
      ajax.setRequestHeader(key, this.headers[key]);
    });

    ajax.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
    ajax.send(formData);
  }

  uniqueId() {
    return Math.random().toString(36).slice(2, 7);
  }
}

export default Uploader;
