import React, { forwardRef, useState, useEffect, useContext, useRef } from 'react';
import dayjs, { Dayjs } from 'dayjs';
import { getDayjsValue, getNow } from '../_util/dayjs';
import cs from '../_util/classNames';
import { getDateString } from './util';
import { ConfigContext } from '../ConfigProvider';
import { CountdownProps } from './interface';
import { isFunction } from '../_util/is';

function Countdown(props: CountdownProps, ref) {
  const { getPrefixCls } = useContext(ConfigContext);
  const { className, style, title, styleValue, value, start, format, onFinish, renderFormat } =
    props;

  const dayjsValue = (getDayjsValue(value, format) as Dayjs) || dayjs();
  const now = getDayjsValue(props.now, format) as Dayjs;

  const prefixCls = getPrefixCls('statistic');

  const [valueDiff, setValueDiff] = useState(dayjsValue.diff(now, 'millisecond'));
  const [valueShow, setValueShow] = useState(getDateString(Math.max(valueDiff, 0), format));
  const timerRef = useRef(null);

  const stopTimer = () => {
    clearInterval(timerRef.current);
    timerRef.current = null;
  };

  const startTimer = () => {
    timerRef.current = setInterval(() => {
      const _valueDiff = dayjsValue.diff(getNow());
      const _value = dayjsValue.diff(getNow(), 'millisecond');
      if (_value <= 0) {
        stopTimer();
        // 倒计时完成触发回调函数
        onFinish && onFinish();
      }
      const valueShow = getDateString(Math.max(_value, 0), format as string);
      setValueShow(valueShow);
      setValueDiff(_valueDiff);
    }, 1000 / 30);
  };

  // 是否开始倒计时，父组件setStart来改变start的值，这里会调用startTimer()
  useEffect(() => {
    if (!timerRef.current && start) {
      if (dayjsValue.valueOf() >= Date.now()) {
        startTimer();
      }
    }
    return () => {
      stopTimer();
    };
  }, [props.start]);

  const valueShowNode = isFunction(renderFormat) ? renderFormat(valueDiff, valueShow) : valueShow;
  return (
    <div
      ref={ref}
      className={cs(`${prefixCls}`, `${prefixCls}-countdown`, className)}
      style={style}
    >
      {title && <div className={`${prefixCls}-title`}>{title}</div>}
      <div className={`${prefixCls}-content`}>
        <div className={`${prefixCls}-value`} style={styleValue}>
          {valueShowNode}
        </div>
      </div>
    </div>
  );
}

const CountdownComponent = forwardRef<unknown, CountdownProps>(Countdown);

CountdownComponent.displayName = 'StatisticCountdown';

CountdownComponent.defaultProps = {
  format: 'HH:mm:ss',
  start: true,
};

export default CountdownComponent;

export { CountdownProps };
