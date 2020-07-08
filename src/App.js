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
      playerClickScreen: false,
      videoAndImagesSaved: false,
      dunkStartStopEntered: false,
      finalGifComplete: false,
      dunkFolderName: null,
      numImgs: 0,
      x: 0,
      y: 0,
    };
    this.imageCount = 0;
  }

  sendVideo = (formData) => {
    return axios
      .post("http://localhost:5000/upload_video", formData, {})
      .then((res) => {
        return res;
      });
  };

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
    this.sendVideo(video).then(
      (res) => {
        const folderName = res.data.folder_name;
        const numImgs = res.data.num_imgs;
        const fps = res.data.fps;
        this.setState({
          dunkFolderName: folderName,
          videoAndImagesSaved: true,
          numImgs: numImgs,
          fps: fps,
        });
      },
      (err) => {
        console.log("error loading video: ", err);
      }
    );
  };

  callExaggerate = () => {
    axios
      .get("/exaggerate", {
        params: {
          folderName: this.state.dunkFolderName,
          exag: 150,
          dunk_start: this.state.dunkStart,
          dunk_end: this.state.dunkEnd,
          x: this.state.x,
          y: this.state.y,
          fps: this.state.fps,
        },
      })
      .then((resp) => {
        this.setState({
          height: resp.data["height"],
          width: resp.data["width"],
          finalGifComplete: true,
        });
      });
  }
  
  playerClicked = (event) => {
    const currentTargetRect = event.currentTarget.getBoundingClientRect();
    this.setState({
      x: event.pageX - currentTargetRect.left,
      y: event.pageY - currentTargetRect.top,
      dunkStartStopEntered: true,
    }, () => {
      this.callExaggerate();
    });
  };

  dunkStartEndEntered = (start, end) => {
    this.setState({
      dunkStart: start,
      dunkEnd: end,
      playerClickScreen: true,
    });
  };

  downloadFinalVideo = () => {
    var newWindow = window.open();
    axios
      .get("/return_final_video", {
        params: {
          folderName: this.state.dunkFolderName,
        },
      })
      .then((resp) => {
        let blob = new Blob([resp.data], { type: "video/mp4" });
        let link = document.createElement("a");
        link.href = newWindow.URL.createObjectURL(blob);
        link.download = "original.mp4";
        link.click();
      });
  };
  
  showProcessingScreen = () => {    
    return <p>Loading...</p>;
  };


  showDownloadFinalGif = () => {
    return (
      <React.Fragment>
        <img
          src={
            "//" +
            window.location.hostname +
            ":5000/static/uploads/" +
            this.state.dunkFolderName +
            "/gifs/final.gif"
          }
        ></img>
        <button onClick={() => this.downloadFinalVideo()}>Download</button>
      </React.Fragment>
    );
  };

  /*<video
          src={
            "//" +
            window.location.hostname +
            ":5000/static/uploads/" +
            this.state.dunkFolderName +
            "/gifs/original.mp4"
          }
          controls="controls"
          autoPlay
          download
        ></video> */

  showPlayerSelectScreen = () => {
    return (
      <React.Fragment>
        <p>Now click on the player in the image</p>
        <img
          src={"static/uploads/" + this.state.dunkFolderName + "/" + this.state.dunkStart + ".jpg"}
          onClick={this.playerClicked}
        ></img>
      </React.Fragment>
    );
  };

  showImageSliderScreen = () => {
    return (
      <ImageSlider
        imageCount={this.imageCount}
        dunkFolderName={this.state.dunkFolderName}
        dunkStartEndEntered={this.dunkStartEndEntered}
        numImgs={this.state.numImgs}
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
    // Show final gif
    if (this.state.finalGifComplete) {
      return this.showDownloadFinalGif();
    }
    // Begin exaggeration
    if (this.state.dunkStartStopEntered) {
      return this.showProcessingScreen();
    }
    // Player selection screen
    if (this.state.playerClickScreen) {
      return this.showPlayerSelectScreen();
    }
    // Show images
    if (this.state.videoAndImagesSaved) {
      return this.showImageSliderScreen();
    }
    // Show upload element
    return this.showUploadScreen();
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
