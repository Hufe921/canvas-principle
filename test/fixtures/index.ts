import { Circle, EventNames, Rect, Stage } from "../../packages/event"
import Text from "../../packages/text"
import { ITextAttr } from "../../packages/text/interface/text"

function startEventDemo(canvas: HTMLCanvasElement) {
  if (!canvas) return

  const stage = new Stage(canvas as HTMLCanvasElement)
  const rect = new Rect({
    x: 50,
    y: 50,
    width: 250,
    height: 180,
    strokeWidth: 1,
    strokeColor: '#000000',
    fillColor: 'green',
  })
  stage.add(rect)

  const circle = new Circle({
    x: 300,
    y: 300,
    radius: 100,
    strokeWidth: 1,
    strokeColor: '#000000',
    fillColor: 'red',
  })
  stage.add(circle)

  let isStart = false
  let startX = 0
  let startY = 0
  rect.on(EventNames.mousedown, (evt) => {
    isStart = true
    startX = evt.offsetX
    startY = evt.offsetY
  })
  rect.on(EventNames.mouseup, () => {
    isStart = false
  })
  rect.on(EventNames.mouseleave, () => {
    isStart = false
  })
  rect.on(EventNames.mousemove, (evt: MouseEvent) => {
    if (isStart) {
      const { lastProps: { x, y } } = rect
      const diffX = evt.offsetX - startX
      const diffY = evt.offsetY - startY
      startX = evt.offsetX
      startY = evt.offsetY
      rect.attr({
        x: x + diffX,
        y: y + diffY
      })
    }
  })

  circle.on(EventNames.click, () => {
    console.log('circle click!!')
    circle.attr({
      x: 400,
      y: 400,
    })
  })
}

function startTextInputDemo(canvas: HTMLCanvasElement) {
  if (!canvas) return
  const text = `主诉：\n发热三天，咳嗽五天。\n现病史：\n发病前14天内有病历报告社区的旅行时或居住史；发病前14天内与新型冠状病毒感染的患者或无症状感染者有接触史；发病前14天内解除过来自病历报告社区的发热或有呼吸道症状的患者；聚集性发病，2周内在小范围如家庭、办公室、学校班级等场所，出现2例及以上发热或呼吸道症状的病例。\n既往史：\n有糖尿病10年，有高血压2年，有传染性疾病1年。\n体格检查：\nT：36.5℃，P：80bpm，R：20次/分，BP：120/80mmHg；\n辅助检查：\n2020年6月10日，普放：血细胞比容36.50%（偏低）40～50；单核细胞绝对值0.75*10^9/L（偏高）参考值：0.1～0.6；\n门诊诊断：\n1.高血压\n处置治疗：\n1.超声引导下甲状腺细针穿刺术；\n2.乙型肝炎表面抗体测定；\n3.膜式病变细胞采集术、后颈皮下肤层；\n4.氯化钠注射液 250ml/袋、1袋；\n5.七叶皂苷钠片（欧开）、30mg/片*24/盒、1片、口服、BID（每日两次）、1天`
  const boldText = ['主诉：', '现病史：', '既往史：', '体格检查：', '辅助检查：', '门诊诊断：', '处置治疗：']
  const boldIndex: number[] = boldText.map(b => {
    const i = text.indexOf(b)
    return ~i ? Array(b.length).fill(i).map((_, j) => i + j) : []
  }).flat()

  const colorText = ['传染性疾病']
  const colorIndex: number[] = colorText.map(b => {
    const i = text.indexOf(b)
    return ~i ? Array(b.length).fill(i).map((_, j) => i + j) : []
  }).flat()

  const textInstance = new Text(canvas)
  const textList: ITextAttr = {
    textList: text.split('').map((value, index) => {
      if (boldIndex.includes(index)) {
        return {
          value,
          size: 18,
          bold: true
        }
      }
      if (colorIndex.includes(index)) {
        return {
          value,
          color: 'red',
          size: 16
        }
      }
      return {
        value,
        size: 16
      }
    })
  }
  textInstance.attr(textList)
  textInstance.draw()
}

export { startEventDemo, startTextInputDemo }