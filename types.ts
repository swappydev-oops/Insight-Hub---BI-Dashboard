export type DataRow = {
  [key: string]: string | number;
};

export enum ChartType {
  Bar = 'Bar',
  Line = 'Line',
  Area = 'Area',
  Pie = 'Pie',
  Donut = 'Donut',
  Scatter = 'Scatter',
}

export enum AggregationType {
  Sum = 'Sum',
  Count = 'Count',
  Average = 'Average',
}

export interface ChartConfig {
  id: string;
  title: string;
  type: ChartType;
  xAxis: string;
  yAxis: string;
  aggregation: AggregationType;
}

export interface ChartSuggestion {
  title: string;
  description: string;
  type: ChartType;
  xAxis: string;
  yAxis: string;
  aggregation: AggregationType;
}