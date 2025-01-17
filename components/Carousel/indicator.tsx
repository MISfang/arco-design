import React, { ReactNode, useContext } from 'react';
import cs from '../_util/classNames';
import { ConfigContext } from '../ConfigProvider';
import { CarouselIndicatorProps } from './interface';

function CarouselIndicator(props: CarouselIndicatorProps, ref) {
  const { getPrefixCls } = useContext(ConfigContext);
  const {
    className,
    type = 'line',
    count = 2,
    activeIndex = 0,
    position = 'bottom',
    trigger = 'click',
    onSelectIndex,
  } = props;

  const prefixCls = getPrefixCls('carousel-indicator');
  const indicatorContent: ReactNode[] = [];

  if (type === 'slider') {
    const step = 100 / count;
    indicatorContent.push(
      <span
        key={0}
        style={{ width: `${step}%`, left: `${activeIndex * step}%` }}
        className={cs(`${prefixCls}-item`, `${prefixCls}-item-active`)}
      />
    );
  } else {
    for (let i = 0; i < count; i++) {
      indicatorContent.push(
        <span
          key={i}
          data-index={i}
          className={cs(`${prefixCls}-item`, {
            [`${prefixCls}-item-active`]: i === activeIndex,
          })}
        />
      );
    }
  }

  const wrapperProps = {
    ref,
    className: cs(prefixCls, `${prefixCls}-${type}`, `${prefixCls}-${position}`, className),
    // 这个秒啊，用计算熟悉【】，根据传入的trigger判断是该绑定onClick还是onMouseEnter
    [trigger === 'click' ? 'onClick' : 'onMouseEnter']: (event) => {
      event.preventDefault();
      // 当指示器类型是slider的时候走上面这段
      if (type === 'slider') {
        const x = event.nativeEvent.offsetX;
        const width = event.currentTarget.clientWidth;
        // clear up effect from event bubbling
        if (event.target === event.currentTarget) {
          const index = ~~((x / width) * count);
          index !== activeIndex && onSelectIndex(index);
        }
      } else {
        const index = +event.target.getAttribute('data-index');
        !isNaN(index) && index !== activeIndex && onSelectIndex(index);
      }
    },
  };

  return <div {...wrapperProps}>{indicatorContent}</div>;
}

const CarouselIndicatorComponent = React.forwardRef<unknown, CarouselIndicatorProps>(
  CarouselIndicator
);

export default CarouselIndicatorComponent;
