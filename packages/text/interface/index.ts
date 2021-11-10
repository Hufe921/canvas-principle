export interface IText {
  type: 'TEXT' | 'IMAGE';
  value: string;
  font?: string;
  size?: number;
  width?: number;
  height?: number;
  bold?: boolean;
  color?: string;
  italic?: boolean;
  underline?: boolean;
  strikeout?: boolean;
}

export interface ITextAttr {
  textList: IText[];
}

export interface IPosition {
  index: number;
  value: string,
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

export interface IDrawOptions {
  curIndex?: number;
  isSetCursor?: boolean
  isSubmitHistory?: boolean;
}