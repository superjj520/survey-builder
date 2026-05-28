import { LogicCondition, SurveyField } from './types'

export function evaluateCondition(
  condition: LogicCondition,
  answers: Record<string, unknown>
): boolean {
  const value = answers[condition.field]

  switch (condition.operator) {
    case 'equals':
      return value === condition.value
    case 'not_equals':
      return value !== condition.value
    case 'contains':
      if (Array.isArray(value)) {
        return value.includes(condition.value as string)
      }
      if (typeof value === 'string') {
        return value.includes(condition.value as string)
      }
      return false
    case 'greater_than':
      return Number(value) > Number(condition.value)
    case 'less_than':
      return Number(value) < Number(condition.value)
    case 'is_empty':
      return value === undefined || value === null || value === '' ||
        (Array.isArray(value) && value.length === 0)
    case 'is_not_empty':
      return value !== undefined && value !== null && value !== '' &&
        !(Array.isArray(value) && value.length === 0)
    default:
      return true
  }
}

export function getVisibleFields(
  fields: SurveyField[],
  answers: Record<string, unknown>
): SurveyField[] {
  return fields.filter((field) => {
    if (!field.logic?.show_if) return true
    return evaluateCondition(field.logic.show_if, answers)
  })
}
