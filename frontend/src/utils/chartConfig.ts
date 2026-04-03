export interface ChartConfig {
  lineChartHeight: number;
  barChartHeight: number;
  barYAxisWidth: number;
  xAxisInterval: number;
  showLegend: boolean;
  yAxisTickFontSize: number;
  barChartMarginLeft: number;
  xAxisAngle: number;
  xAxisHeight: number;
  xAxisTextAnchor: 'start' | 'middle' | 'end' | 'inherit';
  dotRadius: number;
  activeDotRadius: number;
}

export function getChartConfig(isMobile: boolean): ChartConfig {
  if (isMobile) {
    return {
      lineChartHeight: 300,
      barChartHeight: 350,
      barYAxisWidth: 100,
      xAxisInterval: 1,
      showLegend: false,
      yAxisTickFontSize: 10,
      barChartMarginLeft: 0,
      xAxisAngle: -45,
      xAxisHeight: 60,
      xAxisTextAnchor: 'end',
      dotRadius: 2,
      activeDotRadius: 4,
    };
  }

  return {
    lineChartHeight: 500,
    barChartHeight: 400,
    barYAxisWidth: 200,
    xAxisInterval: 0,
    showLegend: true,
    yAxisTickFontSize: 12,
    barChartMarginLeft: 20,
    xAxisAngle: 0,
    xAxisHeight: 30,
    xAxisTextAnchor: 'middle',
    dotRadius: 4,
    activeDotRadius: 6,
  };
}

const monthMap: Record<string, string> = {
  Januari: 'Jan',
  Februari: 'Feb',
  Maret: 'Mar',
  April: 'Apr',
  Mei: 'Mei',
  Juni: 'Jun',
  Juli: 'Jul',
  Agustus: 'Agu',
  September: 'Sep',
  Oktober: 'Okt',
  November: 'Nov',
  Desember: 'Des',
};

export function abbreviateMonth(label: string): string {
  return monthMap[label] ?? label;
}
