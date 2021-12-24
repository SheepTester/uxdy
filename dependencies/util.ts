function stringifyLines (value: unknown): string | string[] {
  if (typeof value === 'object' && value !== null) {
    const output: string[] = []
    if (Array.isArray(value)) {
      const strings = value.map(stringifyLines)
      if (strings.some(Array.isArray)) {
        for (const [i, result] of strings.entries()) {
          if (Array.isArray(result)) {
            output.push(
              ...result.map(
                (line, j) => `${j === 0 ? (i === 0 ? '[' : ',') : ' '} ${line}`
              )
            )
          } else {
            output.push(`${i === 0 ? '[' : ','} ${result}`)
          }
        }
        output.push(']')
        return output
      } else {
        return `[${strings.join(', ')}]`
      }
    } else {
      for (const [i, [key, val]] of Object.entries(value).entries()) {
        const result = stringifyLines(val)
        if (Array.isArray(result)) {
          output.push(
            ...result.map(
              (line, j) =>
                `${j === 0 ? (i === 0 ? '{' : ',') : ' '} ${JSON.stringify(
                  key
                )}: ${line}`
            )
          )
        } else {
          output.push(
            `${i === 0 ? '{' : ','} ${JSON.stringify(key)}: ${result}`
          )
        }
      }
      output.push('}')
      return output
    }
  } else {
    return JSON.stringify(value)
  }
}

/**
 * Stringifies the value as JSON using Elm-style brackets.
 */
export function stringify (value: unknown): string {
  const result = stringifyLines(value)
  if (Array.isArray(result)) {
    return result.join('\n')
  } else {
    return result
  }
}
