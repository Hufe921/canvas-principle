const idPool: { [name: string]: string } = {}

export function createId(): string {
  let id = createOnceId()
  while (idPool[id]) {
    id = createOnceId()
  }
  return id
}

function createOnceId(): string {
  return Array(3)
    .fill(0)
    .map(() => Math.ceil(Math.random() * 255))
    .concat(255)
    .join('-')
}

export function idToRgba(id: string) {
  return id.split('-')
}

export function rgbaToId(rgba: [number, number, number, number]) {
  return rgba.join('-')
}