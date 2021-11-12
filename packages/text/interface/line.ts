import { IText } from "./text";

export type ILineText = IText & {
  metrics: TextMetrics
}

export interface ILine {
  width: number;
  height: number;
  ascent: number;
  textList: ILineText[];
}
