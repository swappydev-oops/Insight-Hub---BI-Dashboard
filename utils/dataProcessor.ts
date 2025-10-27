

import { type DataRow, AggregationType } from '../types';

// TODO: Add support for more complex aggregations like Median or Mode.
// This would require a more robust way of handling numeric vs. string data.

export const aggregateData = (
  data: DataRow[],
  groupBy: string,
  valueColumn: string,
  aggregation: AggregationType
): DataRow[] => {
  if (!data || data.length === 0) {
    return [];
  }
  
  // A special case for counting occurrences of a category.
  // E.g., if we want to count how many times each 'Region' appears,
  // both groupBy and valueColumn would be 'Region', and aggregation is 'Count'.
  if (aggregation === AggregationType.Count && groupBy === valueColumn) {
    const counts: { [key: string]: number } = {};
    data.forEach(row => {
        const key = String(row[groupBy]);
        counts[key] = (counts[key] || 0) + 1;
    });

    return Object.keys(counts).map(key => ({
        [groupBy]: key,
        [valueColumn]: counts[key]
    }));
  }

  const grouped: { [key: string]: number[] } = {};
  data.forEach(row => {
    const key = String(row[groupBy]);
    if (!grouped[key]) {
      grouped[key] = [];
    }
    const value = Number(row[valueColumn]);
    if (!isNaN(value)) {
      grouped[key].push(value);
    }
  });

  const aggregatedData: DataRow[] = [];
  for (const key in grouped) {
    const values = grouped[key];
    let result: number;

    if (values.length === 0) continue; // Skip groups with no numeric data

    switch (aggregation) {
      case AggregationType.Sum:
        result = values.reduce((acc, val) => acc + val, 0);
        break;
      case AggregationType.Count:
        result = values.length;
        break;
      case AggregationType.Average:
        result = values.reduce((acc, val) => acc + val, 0) / values.length;
        break;
      default:
        result = 0;
    }

    aggregatedData.push({
      [groupBy]: key,
      [valueColumn]: result,
    });
  }
  
  // Sort for better visualization, especially for Bar charts.
  // Tries to sort alphabetically/numerically based on the group key.
  return aggregatedData.sort((a, b) => {
    if (typeof a[groupBy] === 'string' && typeof b[groupBy] === 'string') {
        return (a[groupBy] as string).localeCompare(b[groupBy] as string);
    }
    return (a[groupBy] as number) - (b[groupBy] as number);
  });
};