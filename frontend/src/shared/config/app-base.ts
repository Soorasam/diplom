export const appBase = import.meta.env.BASE_URL

export const appBasePath = appBase.endsWith("/") ? appBase.slice(0, -1) : appBase

export const appPath = (segment: string) => {
  const clean = segment.replace(/^\//, "")
  const base = appBase.endsWith("/") ? appBase : `${appBase}/`
  return `${base}${clean}`
}
