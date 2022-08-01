import React, {
  useState,
  useEffect,
  useContext,
  forwardRef,
  useRef,
  useImperativeHandle,
  useMemo,
} from 'react';
import BTween from 'b-tween';
import dayjs, { Dayjs } from 'dayjs';
import cs from '../_util/classNames';
import Countdown from './countdown';
import { isNumber, isFunction } from '../_util/is';
import { ConfigContext } from '../ConfigProvider';
import Skeleton from '../Skeleton';
import { StatisticProps } from './interface';
import useMergeProps from '../_util/hooks/useMergeProps';

type StatisticHandle = {
  countUp: () => void;
};

const defaultProps: StatisticProps = {
  countFrom: 0,
  countDuration: 2000,
};

function Statistic(baseProps: StatisticProps, ref) {
  const { getPrefixCls, componentConfig, rtl } = useContext(ConfigContext);
  const props = useMergeProps<StatisticProps>(baseProps, defaultProps, componentConfig?.Statistic);
  const {
    className,
    style,
    title,
    extra,
    groupSeparator,
    precision,
    prefix,
    suffix,
    format,
    renderFormat,
    styleValue,
    loading,
  } = props;

  const tween = useRef<BTween>();
  const [value, setValue] = useState<string | number | Dayjs>(
    'value' in props ? props.value : undefined
  );

  const prefixCls = getPrefixCls('statistic');

  // 这个函数两个参数，from确定了起始数字，to从props.value中取，确定了终止数字
  // 触发这个方法也就触发了动画
  const countUp = (from = props.countFrom, to = props.value) => {
    const { countDuration } = props;
    if (from !== to) {
      tween.current = new BTween({
        from: {
          value: from,
        },
        to: {
          value: to,
        },
        duration: countDuration,
        easing: 'quartOut',
        onUpdate: (keys) => {
          setValue(keys.value.toFixed(precision));
        },
        onFinish: () => {
          setValue(to);
        },
      });
      // 这里动画start了
      tween.current.start();
    }
  };

  useEffect(() => {
    // 如果countUp传入为true，就在该组件挂载的时候执行一下动态动画
    if (props.countUp) {
      if (tween.current) {
        tween.current.stop();
      }
      if (value !== props.value) {
        countUp(Number(value), props.value);
      } else {
        countUp();
      }
    } else {
      setValue(props.value);
    }

    return () => {
      // 在这个组件要卸载的时候销毁tween，防止出现内存泄露
      tween.current && tween.current.stop();
      tween.current = null;
    };
  }, [props.value]);

  // 自定义暴露给父组件的值，用ref的时候，就有点像vue中的expose那个api
  useImperativeHandle<any, StatisticHandle>(ref, () => ({
    countUp,
  }));

  const { int, decimal } = useMemo(() => {
    let _value = value;
    if (format) {
      _value = dayjs(value).format(format);
    }
    // 这个地方确保小数点后面的精度是 precision的数值
    if (isNumber(precision) && precision >= 0) {
      _value = Number(value).toFixed(precision);
    }
    // 以点分割，获取value的整数部分和小数部分
    let int = String(_value).split('.')[0];
    const decimal = String(_value).split('.')[1];
    // 这里控制是否 显示千位分割符
    if (groupSeparator && isNumber(Number(value))) {
      int = Number(int).toLocaleString('en-US');
    }
    return {
      int,
      decimal,
    };
  }, [format, groupSeparator, precision, value]);

  const valueFormatted = isFunction(renderFormat)
    ? renderFormat
    : (_, formattedValue) => formattedValue;
  return (
    <div className={cs(`${prefixCls}`, { [`${prefixCls}-rtl`]: rtl }, className)} style={style}>
      {title && <div className={`${prefixCls}-title`}>{title}</div>}
      <div className={`${prefixCls}-content`}>
        <Skeleton animation loading={!!loading} text={{ rows: 1, width: '100%' }}>
          <div className={`${prefixCls}-value`} style={styleValue}>
            {!isNumber(Number(value)) ? (
              valueFormatted(value, value)
            ) : (
              <span className={`${prefixCls}-value-int`}>
                <span className={`${prefixCls}-value-prefix`}>{prefix}</span>
                {valueFormatted(value, int)}
              </span>
            )}

            {decimal !== undefined || suffix ? (
              <span className={`${prefixCls}-value-decimal`}>
                {isNumber(Number(value)) && decimal !== undefined && `.${decimal}`}
                {suffix && <span className={`${prefixCls}-value-suffix`}>{suffix}</span>}
              </span>
            ) : null}
          </div>
        </Skeleton>
        {extra && <div className={`${prefixCls}-extra`}>{extra}</div>}
      </div>
    </div>
  );
}

const ForwardRefStatistic = forwardRef(Statistic);

const StatisticComponent = ForwardRefStatistic as typeof ForwardRefStatistic & {
  Countdown: typeof Countdown;
};

StatisticComponent.displayName = 'Statistic';

StatisticComponent.Countdown = Countdown;

export default StatisticComponent;

export { StatisticProps };
