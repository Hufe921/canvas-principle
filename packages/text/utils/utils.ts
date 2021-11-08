import { ZERO } from "./dataset"

export function debounce(func: Function, delay: number) {
  let timer: number
  return function (...args: any) {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      // @ts-ignore
      func.apply(this, args)
    }, delay)
  }
}

export function writeText(text: string) {
  if (!text) return
  window.navigator.clipboard.writeText(text.replaceAll(ZERO, `\n`))
}