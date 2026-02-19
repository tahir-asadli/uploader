class Uploader {
  constructor(options) {
    this.fileInputId = options.fileInputId;
    this.url = options.url;
    this.headers = options.headers;
    this.started = options.started;
    this.ended = options.ended;
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
    if (this.fileList.length == 0) {
      this.ended();
    }

    if (this.fileList.length == 0 || this.uploading) {
      return;
    }

    let ajax = new XMLHttpRequest();
    let formData = new FormData();
    let file = this.fileList[0];

    formData.append('file', file.file);

    ajax.upload.addEventListener(
      'progress',
      (e) => {
        let percent = Math.floor((e.loaded / e.total) * 100);
        this.uploading = true;
        this.progress(file.id, percent, e);
      },
      false,
    );

    ajax.addEventListener(
      'error',
      (e) => {
        this.uploading = false;
        this.fileList.shift();
        this.uploadFromList();
        let message = null;

        try {
          const jsonResponse = JSON.parse(e.target.response);
          message = jsonResponse?.message ? jsonResponse?.message : null;
        } catch (error) {
          console.error('Could not read json response');
        }
        this.error(file.id, message, e);
      },
      false,
    );

    ajax.addEventListener(
      'abort',
      (e) => {
        this.uploading = false;
        this.error(file.id, 'Error', e);
      },
      false,
    );

    ajax.addEventListener(
      'load',
      (e) => {
        this.uploading = false;
        this.fileList.shift();
        this.uploadFromList();
        let message = null;
        if (e.target.status == 200) {
          try {
            const jsonResponse = JSON.parse(e.target.response);
            message = jsonResponse?.message ? jsonResponse?.message : null;
          } catch (error) {
            console.error('Could not read json response', e);
          }
          this.completed(file.id, message, e);
        } else {
          try {
            const jsonResponse = JSON.parse(e.target.response);
            message = jsonResponse?.message ? jsonResponse?.message : null;
          } catch (error) {
            console.error('Could not read json response');
          }
          this.error(file.id, message, e);
        }
      },
      false,
    );

    ajax.open('POST', this.url);

    Object.keys(this.headers).forEach((key, i) => {
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
