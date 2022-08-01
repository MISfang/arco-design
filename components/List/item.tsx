import React, { useContext } from 'react';
import Meta from './meta';
import { ConfigContext } from '../ConfigProvider';
import cs from '../_util/classNames';
import useMergeProps from '../_util/hooks/useMergeProps';
import { ListItemProps } from './interface';

const defaultProps: Partial<ListItemProps> = {
  actionLayout: 'horizontal',
};

function Item(baseProps: ListItemProps, ref) {
  const { getPrefixCls, componentConfig } = useContext(ConfigContext);
  const props = useMergeProps<ListItemProps>(
    baseProps,
    defaultProps,
    componentConfig && componentConfig['List.Item']
  );
  //   actionLayout	列表操作组的位置，默认horizontal，出现在右侧；vertical出现在下方。	'horizontal' | 'vertical'	horizontal
  // extra	列表最右侧内容，额外内容	ReactNode	-
  // actions	列表项下方内容（列表操作组）	ReactNode[]	-
  // className	节点类名	string | string[]	-
  // style	节点样式	CSSProperties	-
  const { children, className, actions, extra, actionLayout, ...rest } = props;

  const prefixCls = getPrefixCls('list');
  const baseClassName = `${prefixCls}-item`;
  // 这俩都是ReactElement数组，react默认你传入这样的，他会帮你把括号去掉
  const metaContent: React.ReactElement[] = [];
  const mainContent: React.ReactElement[] = [];

  React.Children.forEach(children, (element: React.ReactElement) => {
    // 这里分流一下，是content还是meta
    if (element && element.type && element.type === Meta) {
      metaContent.push(element);
    } else {
      mainContent.push(element);
    }
  });

  const content = mainContent.length ? (
    <div className={`${baseClassName}-content`}>{mainContent}</div>
  ) : null;

  const extraContent = extra ? (
    <div className={`${baseClassName}-extra-content`}>{extra}</div>
  ) : null;

  const actionsContent =
    actions && actions.length ? (
      <div className={`${baseClassName}-action`}>
        {actions.map((action, i) => (
          <li key={`${baseClassName}-action-${i}`}>{action}</li>
        ))}
      </div>
    ) : null;

  return (
    <div role="listitem" ref={ref} className={cs(baseClassName, className)} {...rest}>
      <div className={`${baseClassName}-main`}>
        {metaContent}
        {content}
        {/* 如果是这个vertical，就在这布局 */}
        {actionLayout === 'vertical' ? actionsContent : null}
      </div>
      {/* 如果是这个horizontal，就在这布局 */}
      {actionLayout === 'horizontal' ? actionsContent : null}
      {extraContent}
    </div>
  );
}

const ForwardRefItem = React.forwardRef<HTMLDivElement, ListItemProps>(Item);

const ItemComponent = ForwardRefItem as typeof ForwardRefItem & {
  Meta: typeof Meta;
};

ItemComponent.displayName = 'ListItem';

ItemComponent.Meta = Meta;

export default ItemComponent;
