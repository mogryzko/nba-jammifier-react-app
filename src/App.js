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
      videoAndImagesSaved: false,
      dunkStartStopEntered: false,
      dunkVidName: null,
      dunkVidTimeStamp: null,
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
    });
  };

  onClickHandler = () => {
    const video = new FormData();
    video.append("file", this.state.dunkVid);
    this.saveFile(video).then(
      (res) => {
        const newFilename = res.data.filename;
        this.setState({
          dunkVidName: newFilename,
          dunkVidTimeStamp: newFilename.substring(0, 13),
        });
        this.showImageAt(0);
      },
      (err) => {
        console.log("error loading video: ", err);
      }
    );
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
      const formData = new FormData();
      canvas.toBlob(function (blob) {
        formData.append(
          "file",
          blob,
          me.state.dunkVidName + "-" + me.imageCount + ".png"
        );
        me.saveFile(formData);
        me.imageCount = me.imageCount + 1;
      });
      callback.call(me, this.currentTime, e);
    };
    video.src = path;
  };

  showImageAt = (secs) => {
    var duration;
    this.getVideoImage(
      process.env.PUBLIC_URL +
        "/" +
        this.state.dunkVidTimeStamp +
        "/" +
        this.state.dunkVidName,
      function (totalTime) {
        duration = totalTime;
        return secs;
      },
      function (secs, event) {
        if (event.type === "seeked") {
          secs = secs + 0.15;
          if (duration >= secs) {
            this.showImageAt(secs);
          } else {
            this.setState({ videoAndImagesSaved: true });
          }
        }
      }
    );
  };

  dunkStartEndEntered = (start, end) => {
    this.setState({
      dunkStart: start,
      dunkEnd: end,
      dunkStartStopEntered: true,
    });
    // call flask w this

    fetch("/testget")
      .then(function (response) {
        return response.text();
      })
      .then(function (data) {
        console.log(data); // this will be a string
      });
  };

  showProcessingScreen = () => {
    return <p>Loading...</p>;
  };

  showImageSliderScreen = () => {
    return (
      <ImageSlider
        imageCount={this.imageCount}
        dunkPhotoSrc={
          this.state.dunkVidTimeStamp + "/" + this.state.dunkVidName
        }
        dunkStartEndEntered={this.dunkStartEndEntered}
      />
    );
  };

  showUploadScreen = () => {
    return (
      <Upload
        onClickHandler={this.onClickHandler}
        onChangeHandler={this.onChangeHandler}
        dunkVid={this.state.dunkVid}
      />
    );
  };

  view = () => {
    if (this.state.dunkStartStopEntered) {
      return this.showProcessingScreen();
    }
    // Show images
    if (this.state.videoAndImagesSaved) {
      return this.showImageSliderScreen();
    } else {
      // Show upload element
      return this.showUploadScreen();
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
          <header className="App-header">{this.view()}</header>
        </div>
      </React.Fragment>
    );
  }
}
export default App;
