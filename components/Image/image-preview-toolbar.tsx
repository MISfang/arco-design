import React, { CSSProperties, forwardRef } from 'react';
import cs from '../_util/classNames';
import IconMore from '../../icon/react-icon/IconMore';
import Tooltip from '../Tooltip';
import { ImagePreviewActionProps } from './interface';
import { TriggerForToolbar } from './trigger-for-toolbar';

interface ImagePreviewToolbarProps {
  style?: CSSProperties;
  className?: string | string[];
  prefixCls: string;
  previewPrefixCls: string;
  simple: boolean;
  actions: ImagePreviewActionProps[];
  actionsLayout: string[];
  defaultActions: ImagePreviewActionProps[];
}

const ImagePreviewToolbar = (props: ImagePreviewToolbarProps, ref) => {
  const {
    prefixCls,
    previewPrefixCls,
    simple = false,
    actions = [],
    actionsLayout = [], // 传入一个actionsLayout然后会对defaultActions以及actions进行过滤，在actionsLayout内才展示
    defaultActions = [],
  } = props;

  // Filter based on layout
  const actionsLayoutSet = new Set(actionsLayout);
  const filterWithLayout = (item: ImagePreviewActionProps) => actionsLayoutSet.has(item.key);
  const filteredActions = [
    ...defaultActions.filter(filterWithLayout),
    ...actions.filter(filterWithLayout),
  ];
  const extraActions = actions.filter((item) => !actionsLayoutSet.has(item.key));
  // Sort by layout
  // 按照actionsLayout传入的顺序进行排序
  const resultActions = filteredActions.sort((pre, cur) => {
    const preIndex = actionsLayout.indexOf(pre.key);
    const curIndex = actionsLayout.indexOf(cur.key);
    return preIndex > curIndex ? 1 : -1;
  });
  if (actionsLayoutSet.has('extra')) {
    const extraIndex = actionsLayout.indexOf('extra');
    resultActions.splice(extraIndex, 0, ...extraActions);
  }

  const renderAction = (itemData: ImagePreviewActionProps, renderName = false) => {
    const { content, disabled, key, name, getContainer, onClick, ...rest } = itemData;
    const action = (
      <div
        className={cs(`${previewPrefixCls}-toolbar-action`, {
          [`${previewPrefixCls}-toolbar-action-disabled`]: disabled,
        })}
        key={key}
        onClick={(e) => {
          if (!disabled && onClick) {
            onClick(e);
          }
        }}
        onMouseDown={(e) => {
          // To solve the problem that tooltip is selected when button is quickly clicked
          e.preventDefault();
        }}
        {...rest}
      >
        {content && <span className={`${previewPrefixCls}-toolbar-action-content`}>{content}</span>}
        {renderName && name && (
          <span className={`${previewPrefixCls}-toolbar-action-name`}>{name}</span>
        )}
      </div>
    );
    if (getContainer) {
      return getContainer(action);
    }
    return action;
  };

  if (!resultActions.length) return null;

  const actionList = resultActions.map((item) => {
    const action = renderAction(item, simple);
    // 如果没有getContainer就渲染Tooltip，有的话Tooltip就失效
    if (!simple && item.name && !item.getContainer) {
      return (
        <Tooltip content={item.name} key={item.key}>
          {action}
        </Tooltip>
      );
    }
    return action;
  });

  return (
    <div
      ref={ref}
      className={cs(
        `${previewPrefixCls}-toolbar`,
        {
          [`${previewPrefixCls}-toolbar-simple`]: simple,
        },
        props.className
      )}
      style={props.style}
    >
      {/* 如果是简洁模式，就变成一个more图标悬浮展示actios列 */}
      {simple && (
        <TriggerForToolbar
          prefixCls={prefixCls}
          className={`${previewPrefixCls}-trigger`}
          popup={() => <div>{actionList}</div>}
        >
          {renderAction({
            key: 'trigger',
            content: (
              <span>
                <IconMore />
              </span>
            ),
          })}
        </TriggerForToolbar>
      )}
      {!simple && actionList}
    </div>
  );
};

export default forwardRef<unknown, ImagePreviewToolbarProps>(ImagePreviewToolbar);
