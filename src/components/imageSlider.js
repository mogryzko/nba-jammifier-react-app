import React, { Component, useState } from "react";
import "react-bootstrap-range-slider/dist/react-bootstrap-range-slider.css";
import RangeSlider from "react-bootstrap-range-slider";

class ImageSlider extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      sliderVal: 0,
      img: process.env.PUBLIC_URL + "/" + this.props.dunkPhotoSrc + "-0.png",
    };
  }

  sliderValChange = (changeEvent) => {
    const newVal = changeEvent.target.value;
    this.setState({
      sliderVal: parseInt(newVal),
      img:
        process.env.PUBLIC_URL +
        "/" +
        this.props.dunkPhotoSrc +
        "-" +
        newVal +
        ".png",
    });
  };

  render() {
    return (
      <div>
        <p>You set slider to {this.state.sliderVal} times</p>
        <RangeSlider
          value={this.state.sliderVal}
          onChange={(changeEvent) => {
            this.sliderValChange(changeEvent);
          }}
          min={0}
          max={this.props.imageCount}
        />
        <img src={this.state.img} />
      </div>
    );
  }
}

export default ImageSlider;
