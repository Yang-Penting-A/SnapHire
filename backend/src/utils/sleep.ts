/**
 * Sleep utility - non-blocking delay
 * @param ms - milliseconds to wait
 * @returns Promise that resolves after the specified delay
 */
export async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/**
 * Sleep with progress logging
 * @param ms - milliseconds to wait
 * @param label - optional label for logging
 */
export async function sleepWithLog(ms: number, label: string = 'Waiting'): Promise<void> {
  await sleep(ms);
}
