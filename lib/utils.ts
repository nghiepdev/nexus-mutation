export function omit<O extends object>(obj: O, not: (keyof O)[]) {
  const o = Object.assign({}, obj);
  for (let n of not) delete o[n];
  return o;
}

export function capitalizeFirstLetter(input: string) {
  return input[0].toUpperCase() + input.slice(1);
}

export function getFirstValueOfObject<T extends any>(
  object: Record<string, T>
) {
  return Object.values(object)[0];
}
