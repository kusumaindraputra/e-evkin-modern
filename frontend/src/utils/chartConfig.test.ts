import { describe, it, expect } from 'vitest';
import { getChartConfig, abbreviateMonth } from './chartConfig';

describe('getChartConfig', () => {
  it('returns compact dimensions on mobile', () => {
    const config = getChartConfig(true);
    expect(config.lineChartHeight).toBe(300);
    expect(config.barChartHeight).toBe(350);
    expect(config.barYAxisWidth).toBe(100);
    expect(config.xAxisInterval).toBe(1);
    expect(config.showLegend).toBe(false);
    expect(config.yAxisTickFontSize).toBe(10);
    expect(config.barChartMarginLeft).toBe(0);
    expect(config.xAxisAngle).toBe(-45);
    expect(config.xAxisHeight).toBe(60);
    expect(config.xAxisTextAnchor).toBe('end');
    expect(config.dotRadius).toBe(2);
    expect(config.activeDotRadius).toBe(4);
  });

  it('returns full dimensions on desktop', () => {
    const config = getChartConfig(false);
    expect(config.lineChartHeight).toBe(500);
    expect(config.barChartHeight).toBe(400);
    expect(config.barYAxisWidth).toBe(200);
    expect(config.xAxisInterval).toBe(0);
    expect(config.showLegend).toBe(true);
    expect(config.yAxisTickFontSize).toBe(12);
    expect(config.barChartMarginLeft).toBe(20);
    expect(config.xAxisAngle).toBe(0);
    expect(config.xAxisHeight).toBe(30);
    expect(config.xAxisTextAnchor).toBe('middle');
    expect(config.dotRadius).toBe(4);
    expect(config.activeDotRadius).toBe(6);
  });
});

describe('abbreviateMonth', () => {
  it('abbreviates Indonesian month names', () => {
    expect(abbreviateMonth('Januari')).toBe('Jan');
    expect(abbreviateMonth('Februari')).toBe('Feb');
    expect(abbreviateMonth('Maret')).toBe('Mar');
    expect(abbreviateMonth('April')).toBe('Apr');
    expect(abbreviateMonth('Mei')).toBe('Mei');
    expect(abbreviateMonth('Juni')).toBe('Jun');
    expect(abbreviateMonth('Juli')).toBe('Jul');
    expect(abbreviateMonth('Agustus')).toBe('Agu');
    expect(abbreviateMonth('September')).toBe('Sep');
    expect(abbreviateMonth('Oktober')).toBe('Okt');
    expect(abbreviateMonth('November')).toBe('Nov');
    expect(abbreviateMonth('Desember')).toBe('Des');
  });

  it('returns original string if not a known month', () => {
    expect(abbreviateMonth('Q1 2026')).toBe('Q1 2026');
  });
});
