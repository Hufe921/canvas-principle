export interface IText {
  type?: 'TEXT' | 'IMAGE';
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

export interface ITextOption {
  defaultType?: string;
  defaultFont?: string;
  defaultSize?: number;
}

export interface ITextAttr {
  textList: IText[];
}

export interface ITextPosition {
  index: number;
  value: string,
  lineNo: number;
  lineHeight: number;
  metrics: TextMetrics;
  isLastLetter: boolean,
  coordinate: {
    leftTop: number[];
    leftBottom: number[];
    rightTop: number[];
    rightBottom: number[];
  }
}