export function capitalizeFirstLetter(input: string) {
  return input[0].toUpperCase() + input.slice(1);
}

export function getFirstValueOfObject<T extends any>(
  object: Record<string, T>
) {
  return Object.values(object)[0];
}
