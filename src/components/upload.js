import React, { Component } from "react";

class Upload extends Component {
  state = {};

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
          <button
            type="button"
            className="btn btn-success btn-block"
            onClick={this.props.onClickHandler}
          >
            Upload
          </button>
        </div>
      </div>
    );
  }
}

export default Upload;
