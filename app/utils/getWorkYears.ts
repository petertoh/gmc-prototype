export default function (
  dates:
    | ProjectsNetworkQueryResult['projects'][number]['dates']
    | NonNullable<
        ProjectsNetworkQueryResult['projects'][number]['related']
      >[number]['dates']
    | NonNullable<
        ProjectsNetworkQueryResult['projects'][number]['works']
      >[number]['dates']
    | NonNullable<
        NonNullable<
          ProjectsNetworkQueryResult['projects'][number]['works']
        >[number]['related']
      >[number]['dates'],
): number[] {
  if (!dates) return []
  if (dates.dateFormat === 'year' && dates.startYear) {
    const startYear = parseInt(dates.startYear.split('-')[0] || '')
    if (startYear && dates.onGoing) {
      return [startYear]
    }
    if (dates.endYear) {
      const endYear = parseInt(dates.endYear.split('-')[0] || '')
      if (endYear && startYear && endYear - startYear > 1) {
        const yearsBetween = Array.from(
          { length: endYear - startYear - 1 },
          (_, i) => startYear + i + 1,
        )
        return [startYear, ...yearsBetween, endYear]
      }
      return [startYear, endYear]
    }
    return [startYear]
  }
  if (dates.dateFormat === 'dateTime' && dates.startTime) {
    const startTime = new Date(dates.startTime).getFullYear()
    if (dates.onGoing) {
      return [startTime]
    }
    if (dates.endTime) {
      const endYear = new Date(dates.endTime).getFullYear()
      if (endYear - startTime > 1) {
        const yearsBetween = Array.from(
          { length: endYear - startTime - 1 },
          (_, i) => startTime + i + 1,
        )
        return [startTime, ...yearsBetween, endYear]
      }
      return [startTime, endYear]
    }
    return [startTime]
  }
  return []
}
