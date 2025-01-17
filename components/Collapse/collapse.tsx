import React, { createContext, ReactNode, useContext, PropsWithChildren } from 'react';
import { isFunction } from '../_util/is';
import cs from '../_util/classNames';
import CollapseItem from './item';
import omit from '../_util/omit';
import { ConfigContext } from '../ConfigProvider';
import IconCaretRight from '../../icon/react-icon/IconCaretRight';
import useMergeValue from '../_util/hooks/useMergeValue';
import IconCaretLeft from '../../icon/react-icon/IconCaretLeft';
import { CollapseProps } from './interface';
import useMergeProps from '../_util/hooks/useMergeProps';

const getActiveKeys = (keys: CollapseProps['activeKey'], accordion: boolean): string[] => {
  const res = [].concat(keys);
  // 判断是否是手风琴模式，手风琴模式，同一时间只能有一个面板展开
  // 这里是手风琴模式的话，取传入的激活keys的第一个做为激活项
  if (accordion) {
    return res.slice(0, 1);
  }
  return res;
};

const defaultProps: CollapseProps = {
  bordered: true,
  lazyload: true,
  expandIconPosition: 'left',
};

export const CollapseContext = createContext<{
  expandIcon?: ReactNode;
  activeKeys: string[];
  expandIconPosition?: 'left' | 'right';
  lazyload?: boolean;
  destroyOnHide?: boolean;
  onToggle?: (_key: string, _e) => void;
}>({
  expandIconPosition: 'left',
  expandIcon: <IconCaretRight />,
  activeKeys: [],
  onToggle: () => {},
});

function Collapse(baseProps: PropsWithChildren<CollapseProps>, ref) {
  const { getPrefixCls, componentConfig, rtl } = useContext(ConfigContext);
  const props = useMergeProps<PropsWithChildren<CollapseProps>>(
    baseProps,
    defaultProps,
    componentConfig?.Collapse
  );

  const [activeKeys, setActiveKeys] = useMergeValue<string[]>([], {
    defaultValue:
      'defaultActiveKey' in props
        ? getActiveKeys(props.defaultActiveKey, props.accordion)
        : undefined,
    value: 'activeKey' in props ? getActiveKeys(props.activeKey, props.accordion) : undefined,
  });

  const {
    children,
    className,
    style,
    bordered,
    lazyload,
    expandIcon,
    expandIconPosition,
    destroyOnHide,
    accordion,
    onChange,
    ...rest
  } = props;

  const prefixCls = getPrefixCls('collapse');

  const onItemClick = (key: string, e): void => {
    let newActiveKeys = [...activeKeys];
    // 维护了一个激活的keys数组
    const index = activeKeys.indexOf(key);
    if (index > -1) {
      // index > -1表示该item本身已经激活，要取消激活
      newActiveKeys.splice(index, 1);
    } else if (accordion) {
      // accordion为true表示是手风琴模式，同时只有一个能激活
      newActiveKeys = [key];
    } else {
      // 上面两个都没走到意思是没有被激活，要被激活
      newActiveKeys.push(key);
    }
    // 如果传入了activekey这里就不会设置了
    if (!('activeKey' in props)) {
      setActiveKeys(newActiveKeys);
    }
    // 触发onChage回调
    isFunction(onChange) && onChange(key, newActiveKeys, e);
  };

  return (
    <CollapseContext.Provider
      value={{
        activeKeys,
        onToggle: onItemClick,
        lazyload,
        expandIcon:
          'expandIcon' in props ? (
            expandIcon
          ) : expandIconPosition === 'right' ? (
            <IconCaretLeft />
          ) : (
            <IconCaretRight />
          ),
        destroyOnHide,
        expandIconPosition,
      }}
    >
      <div
        ref={ref}
        {...omit(rest, ['activeKey', 'defaultActiveKey'])}
        className={cs(
          prefixCls,
          `${prefixCls}-${bordered ? 'border' : 'borderless'}`,
          { [`${prefixCls}-rtl`]: rtl },
          className
        )}
        style={style}
      >
        {children}
      </div>
    </CollapseContext.Provider>
  );
}

const ForwardRefCollapse = React.forwardRef<unknown, PropsWithChildren<CollapseProps>>(Collapse);

const CollapseComponent = ForwardRefCollapse as typeof ForwardRefCollapse & {
  Item: typeof CollapseItem;
};

CollapseComponent.displayName = 'Collapse';

CollapseComponent.Item = CollapseItem;

export default CollapseComponent;

export { CollapseProps };
