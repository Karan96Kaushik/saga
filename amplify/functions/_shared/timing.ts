export function logTiming(route: string, ms: number) {
  console.log(JSON.stringify({ route, ms }));
}
