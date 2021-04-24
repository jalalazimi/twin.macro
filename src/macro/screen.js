import { replaceWithLocation, astify } from './../macroHelpers'
import { getTheme, throwIf } from './../utils'
import { logBadGood } from './../logging'

// TODO: Move into common + dedupe
const getFunctionValue = path => {
  if (path.parent.type !== 'CallExpression') return

  const parent = path.findParent(x => x.isCallExpression())
  if (!parent) return

  const argument = parent.get('arguments')[0] || ''

  return {
    parent,
    input: argument.evaluate && argument.evaluate().value,
  }
}

// TODO: Move into common + dedupe
const getTaggedTemplateValue = path => {
  if (path.parent.type !== 'TaggedTemplateExpression') return

  const parent = path.findParent(x => x.isTaggedTemplateExpression())
  if (!parent) return
  if (parent.node.tag.type !== 'Identifier') return

  return { parent, input: parent.get('quasi').evaluate().value }
}

const handleScreenFunction = ({ references, t, state }) => {
  if (!references.screen) return

  const theme = getTheme(state.config.theme)

  references.screen.forEach(path => {
    const { input, parent } =
      getTaggedTemplateValue(path) || getFunctionValue(path) || ''

    const screen = theme('screens')[input]
    throwIf(!screen, () =>
      logBadGood(
        `The screen value “${input}” wasn’t found in the tailwind config`,
        `Try one of these values:\n\n${Object.entries(theme('screens'))
          .map(([k, v]) => `screen\`${k}\` (${v})`)
          .join('\n')}`
      )
    )

    const selector = `@media (min-width: ${screen})`

    return replaceWithLocation(parent, astify(selector, t))
  })
}

export { handleScreenFunction }
