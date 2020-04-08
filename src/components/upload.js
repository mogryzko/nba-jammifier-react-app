import React, { Component } from "react";

class Upload extends Component {
  state = {};

  uploadButton = () => {
    return (
      <button
        id="uploadButton"
        type="button"
        className="btn btn-success btn-block"
        onClick={() => {
          if (this.props.dunkVid !== null) {
            const elem = document.getElementById("uploadButton");
            elem.innerHTML = "Uploading...";
            this.props.onClickHandler();
          }
        }}
      >
        Upload
      </button>
    );
  };

  render() {
    return (
      <div className="container">
        <div className="col-md-6">
          <form method="post" action="#" id="#">
            <div className="form-group files">
              <label>Upload Your Dunk</label>
              <input
                type="file"
                name="file"
                className="form-control"
                onChange={this.props.onChangeHandler}
              />
            </div>
          </form>
          {this.uploadButton()}
        </div>
      </div>
    );
  }
}

export default Upload;
