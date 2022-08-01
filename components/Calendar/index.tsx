import React, { useState, useContext, useMemo } from 'react';
import { Dayjs, UnitType } from 'dayjs';
import merge from 'lodash/merge';
import { ConfigContext } from '../ConfigProvider';
import { CalendarProps } from './interface';
import cs from '../_util/classNames';
import Month, { getAllDaysByTime } from './month';
import Year from './year';
import Header from './header/header';
import PanelHeader from './header/panel-header';
import useMergeProps from '../_util/hooks/useMergeProps';

import { getDayjsValue, getNow, methods } from '../_util/dayjs';

function getFormat(mode: 'day' | 'week' | 'month' | 'year', panel?: boolean) {
  return mode === 'month' || (mode === 'year' && !panel) ? 'YYYY-MM-DD' : 'YYYY-MM';
}

const defaultProps: CalendarProps = {
  dayStartOfWeek: 0,
  panelWidth: 265,
  defaultMode: 'month',
  headerType: 'button',
  modes: ['month', 'year'],
};

function Calendar(baseProps: CalendarProps) {
  const { getPrefixCls, locale: globalLocale, componentConfig, rtl } = useContext(ConfigContext);
  const props = useMergeProps<CalendarProps>(baseProps, defaultProps, componentConfig?.Calendar);
  const {
    style,
    className,
    dayStartOfWeek,
    panel, // 是否放在容器中展示
    locale, // 国际化配置
    panelWidth, // 卡片宽度
    panelTodayBtn, // 是否展示跳转到今天的按钮
    defaultPageShowDate,
    value: propsValue, // 初始值
    pageShowDate: propsPageShowDate,
    defaultValue,
    mode: propsMode, // 是月日历还是年日历
    defaultMode, // 是月日历还是年日历
    onChange,
    onPanelChange,
    headerRender, // 自定义头部渲染
    headerType, // 头部渲染模式只在全屏模式下生效
    modes,
    panelOperations,
  } = props;

  const CALENDAR_LOCALE = merge(globalLocale.Calendar, locale);

  const prefixCls = getPrefixCls('calendar');

  const [mode, setMode] = useState<'day' | 'week' | 'month' | 'year'>(propsMode || defaultMode);
  const innerMode = propsMode || mode;

  const format = getFormat(innerMode, panel);

  const [value, setValue] = useState<Dayjs>(
    getDayjsValue(propsValue || defaultValue, format) as Dayjs
  );

  const [pageShowDate, setPageShowDate] = useState<Dayjs>(
    (getDayjsValue(defaultPageShowDate, format) as Dayjs) || value || getNow()
  );

  const mergedPageShowDate = (getDayjsValue(propsPageShowDate, format) || pageShowDate) as Dayjs;
  const mergedValue = 'value' in props ? (getDayjsValue(propsValue, format) as Dayjs) : value;

  // page data list
  const pageData = useMemo(() => {
    return getAllDaysByTime(props, mergedPageShowDate);
  }, [mergedPageShowDate.toString(), innerMode, dayStartOfWeek]);

  // value / pageShowDate / pageData
  function move(time: Dayjs) {
    setValue(time);
    onChange && onChange(time);
    onChangePageDate(time);
  }

  function onChangePageDate(time: Dayjs) {
    setPageShowDate(time);
    onPanelChange && onPanelChange(time);
  }

  function selectHandler(time: Dayjs, disabled) {
    if (!disabled) {
      move(time);
    }
  }

  let headerValueFormat = '';
  if (innerMode === 'month') {
    headerValueFormat = CALENDAR_LOCALE.formatMonth;
  } else if (innerMode === 'year') {
    headerValueFormat = CALENDAR_LOCALE.formatYear;
  }

  function changePageShowDate(type: 'prev' | 'next', unit: UnitType) {
    let newPageShowDate;
    if (type === 'prev') {
      newPageShowDate = methods.subtract(mergedPageShowDate, 1, unit);
    }
    if (type === 'next') {
      newPageShowDate = methods.add(mergedPageShowDate, 1, unit);
    }

    setPageShowDate(newPageShowDate);
    onPanelChange && onPanelChange(newPageShowDate); // 面板日期改变触发onPanelChnage的回调
  }

  function onChangeYear(year) {
    const newValue = methods.set(mergedPageShowDate, 'year', year);
    setPageShowDate(newValue);
    onPanelChange && onPanelChange(newValue); // 面板日期改变触发onPanelChnage的回调
  }

  function onChangeMonth(month) {
    const newValue = methods.set(mergedPageShowDate, 'month', month - 1);
    setPageShowDate(newValue);
    onPanelChange && onPanelChange(newValue); // 面板日期改变触发onPanelChnage的回调
  }

  function changeMode(mode) {
    setMode(mode);
  }

  const classNames = cs(
    prefixCls,
    innerMode === 'month' ? `${prefixCls}-mode-month` : `${prefixCls}-mode-year`,
    {
      [`${prefixCls}-panel`]: panel && (innerMode === 'month' || innerMode === 'year'),
      [`${prefixCls}-rtl`]: rtl,
    },
    className
  );

  const baseStyle = panel ? { width: panelWidth } : {};

  const baseHeaderProps = {
    prefixCls,
    changePageShowDate,
    headerValueFormat,
    mergedPageShowDate,
    modes,
    innerMode,
    panelOperations,
  };

  return (
    <div className={classNames} style={{ ...style, ...baseStyle }}>
      {/* 判断是headerRender是不是function，是的话执行并传入参数，不是的话判断是不是panel类型，然后渲染对应组件 */}
      {typeof headerRender === 'function' ? (
        headerRender({
          value: mergedValue,
          pageShowDate: mergedPageShowDate,
          onChangeMode: changeMode,
          onChange: move,
          onChangePageDate,
        })
      ) : panel ? (
        <PanelHeader {...baseHeaderProps} />
      ) : (
        <Header
          {...baseHeaderProps}
          CALENDAR_LOCALE={CALENDAR_LOCALE}
          move={move}
          innerMode={innerMode}
          changeMode={changeMode}
          onChangeYear={onChangeYear}
          onChangeMonth={onChangeMonth}
          headerType={headerType}
        />
      )}
      {/* 内容主体部分 */}
      {/* 内容为月 */}
      {innerMode === 'month' && (
        <div className={`${prefixCls}-body`}>
          <Month
            {...props}
            prefixCls={prefixCls}
            pageData={pageData}
            mergedValue={mergedValue}
            innerMode={innerMode}
            selectHandler={selectHandler}
            mergedPageShowDate={mergedPageShowDate}
            CALENDAR_LOCALE={CALENDAR_LOCALE}
          />
        </div>
      )}
      {/* 内容为年的类型 */}
      {innerMode === 'year' && (
        <div className={`${prefixCls}-body`}>
          <Year
            {...props}
            prefixCls={prefixCls}
            pageData={pageData}
            mergedPageShowDate={mergedPageShowDate}
            innerMode={innerMode}
            mergedValue={mergedValue}
            selectHandler={selectHandler}
            CALENDAR_LOCALE={CALENDAR_LOCALE}
          />
        </div>
      )}
      {/* 卡片中最下面的今天按钮是否显示 */}
      {panelTodayBtn && panel && (
        <div className={`${prefixCls}-footer-btn-wrapper`}>{CALENDAR_LOCALE.today}</div>
      )}
    </div>
  );
}

Calendar.displayName = 'Calendar';

export default Calendar;

export { CalendarProps };
