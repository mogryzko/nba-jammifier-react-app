import React from "react";
import "react-bootstrap-range-slider/dist/react-bootstrap-range-slider.css";
import RangeSlider from "react-bootstrap-range-slider";
import "../styles/styles.css";

class ImageSlider extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      message: "Click on the image where your jump starts",
      sliderVal: 0,
      minImg: 0,
      img: process.env.PUBLIC_URL + "/" + this.props.dunkPhotoSrc + "-0.png",
      imgBorderStyle: "5px solid transparent",
      dunkStart: 0,
      dunkStartClicked: false,
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

  imageOnClick = () => {
    if (!this.state.dunkStartClicked) {
      var nextSliderVal = this.state.sliderVal + 1;
      this.setState({
        minImg: nextSliderVal,
        dunkStart: this.state.sliderVal,
        dunkStartClicked: true,
        message: "Now click on the image where your jump ends",
        sliderVal: nextSliderVal,
        img:
          process.env.PUBLIC_URL +
          "/" +
          this.props.dunkPhotoSrc +
          "-" +
          nextSliderVal +
          ".png",
      });
    } else {
      this.props.dunkStartEndEntered(
        this.state.dunkStart,
        this.state.sliderVal
      );
    }
  };

  imageOnHover = (tf) => {
    if (tf) {
      this.setState({
        imgBorderStyle: "5px solid #007bff",
      });
    } else {
      this.setState({
        imgBorderStyle: "5px solid transparent",
      });
    }
  };

  render() {
    return (
      <div>
        <p>{this.state.message}</p>
        <RangeSlider
          value={this.state.sliderVal}
          onChange={(changeEvent) => {
            this.sliderValChange(changeEvent);
          }}
          min={this.state.minImg}
          max={this.props.imageCount}
        />
        <div
          style={{ border: this.state.imgBorderStyle, borderRadius: "7px" }}
          onMouseEnter={() => this.imageOnHover(true)}
          onMouseLeave={() => this.imageOnHover(false)}
          onClick={this.imageOnClick}
        >
          <img className="imageSliderImage" src={this.state.img} alt="" />
        </div>
      </div>
    );
  }
}

export default ImageSlider;
