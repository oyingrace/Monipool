// HACKATHON: in-memory challenge store — replace with Redis post-demo
export const challenges = new Map<string, { challenge: string; expires: number }>()
