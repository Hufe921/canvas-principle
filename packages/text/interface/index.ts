export interface ITextAttr {
  text: string;
  font?: string;
  textBaseline?: CanvasTextBaseline;
}

export interface ITextProp {
  text: string;
  font: string;
  textBaseline: CanvasTextBaseline;
  arrText: string[]
}

export interface IPosition {
  i: number;
  lineNo: number;
  isLastLetter: boolean,
  coordinate: {
    leftTop: number[];
    leftBottom: number[];
    rightTop: number[];
    rightBottom: number[];
  }
}

export interface IRange {
  startIndex: number;
  endIndex: number
}