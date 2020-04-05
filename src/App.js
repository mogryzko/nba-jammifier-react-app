import React, { Component } from "react";
import Upload from "./components/upload";
import ImageSlider from "./components/imageSlider";
import axios from "axios";

import "./App.css";

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      dunkVid: null,
      videoUploaded: false,
      dunkVidName: null,
      dunkPhotoName: null,
    };
    this.imageCount = 0;
  }

  saveFile = (formData) => {
    return axios
      .post("http://localhost:8000/upload", formData, {})
      .then((res) => {
        return res;
      });
  };

  onChangeHandler = (event) => {
    this.setState({
      dunkVid: event.target.files[0],
      loaded: 0,
    });
  };

  onClickHandler = () => {
    if (this.state.dunkVid !== null) {
      const video = new FormData();
      video.append("file", this.state.dunkVid);
      this.saveFile(video).then((res) => {
        const newFilename = res.data.filename;
        const origName = res.data.originalname;
        this.setState({
          dunkVidName: newFilename,
          dunkPhotoName: origName.substring(0, origName.length - 4),
          videoUploaded: true,
        });
        this.showImageAt(0);
      });
    }
  };

  getVideoImage = (path, secs, callback) => {
    var me = this;
    var video = document.createElement("video");
    video.onloadedmetadata = function () {
      if ("function" === typeof secs) {
        secs = secs(this.duration);
      }
      this.currentTime = Math.min(
        Math.max(0, (secs < 0 ? this.duration : 0) + secs),
        this.duration
      );
    };
    video.onseeked = function (e) {
      var canvas = document.createElement("canvas");
      canvas.height = video.videoHeight;
      canvas.width = video.videoWidth;
      var ctx = canvas.getContext("2d");
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(function (blob) {
        const formData = new FormData();
        formData.append(
          "file",
          blob,
          me.state.dunkPhotoName + "-" + me.imageCount + ".png"
        );
        me.imageCount = me.imageCount + 1;
        me.saveFile(formData);
      });
      callback.call(me, this.currentTime, e);
    };
    video.src = path;
  };

  showImageAt = (secs) => {
    var duration;
    this.getVideoImage(
      process.env.PUBLIC_URL + "/" + this.state.dunkVidName,
      function (totalTime) {
        duration = totalTime;
        return secs;
      },
      function (secs, event) {
        if (event.type === "seeked") {
          secs = secs + 0.25;
          if (duration >= secs) {
            this.showImageAt(secs);
          }
        }
      }
    );
  };

  showUploadOrVideo = () => {
    // Show images
    if (this.state.videoUploaded) {
      return <ImageSlider />;
    } else {
      // Show upload element
      return (
        <Upload
          onClickHandler={this.onClickHandler}
          onChangeHandler={this.onChangeHandler}
        />
      );
    }
  };

  render() {
    return (
      <React.Fragment>
        <link
          href="//maxcdn.bootstrapcdn.com/bootstrap/4.0.0/css/bootstrap.min.css"
          rel="stylesheet"
          id="bootstrap-css"
        />
        <script src="//maxcdn.bootstrapcdn.com/bootstrap/4.0.0/js/bootstrap.min.js"></script>
        <script src="//code.jquery.com/jquery-1.11.1.min.js"></script>
        <div className="App">
          <header className="App-header">{this.showUploadOrVideo()}</header>
        </div>
      </React.Fragment>
    );
  }
}
export default App;
