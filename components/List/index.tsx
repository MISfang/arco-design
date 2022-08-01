import React, { useCallback, useContext, useImperativeHandle, useRef, useState } from 'react';
import throttle from 'lodash/throttle';
import Pagination, { PaginationProps } from '../Pagination';
import Spin from '../Spin';
import Item from './item';
import cs from '../_util/classNames';
import Row from '../Grid/row';
import Col from '../Grid/col';
import { ConfigContext } from '../ConfigProvider';
import omit from '../_util/omit';
import VirtualList, { VirtualListHandle } from '../_class/VirtualList';
import { ListProps } from './interface';
import scrollIntoView from '../_util/scrollIntoView';
import useMergeProps from '../_util/hooks/useMergeProps';

const DEFAULT_PAGE_SIZE = 10;
const DEFAULT_PAGE_CURRENT = 1;

const SizeList = ['small', 'default', 'large'];

const defaultProps: ListProps = {
  split: true,
  bordered: true,
  defaultCurrent: 1,
  offsetBottom: 0,
  throttleDelay: 500,
};

function List<T extends unknown = any>(baseProps: ListProps<T>, ref) {
  const {
    getPrefixCls,
    loadingElement,
    size: ctxSize,
    renderEmpty,
    componentConfig,
    rtl,
  } = useContext(ConfigContext);
  const props = useMergeProps<ListProps>(baseProps, defaultProps, componentConfig?.List);
  const {
    style,
    wrapperStyle,
    className,
    wrapperClassName,
    children = [],
    dataSource = [],
    size: propSize,
    footer,
    header,
    pagination,
    bordered,
    split,
    // 渲染子Item传入的render函数
    render,
    grid,
    loading,
    hoverable,
    scrollLoading,
    paginationInFooter,
    offsetBottom,
    throttleDelay,
    defaultCurrent,
    noDataElement,
    listRef,
    onReachBottom,
    onListScroll,
  } = props;

  // prop里面size为优先然后判断ctx里面的size在size列表里面有没有
  const size = propSize || (SizeList.indexOf(ctxSize) > -1 ? ctxSize : 'default');
  const prefixCls = getPrefixCls('list');

  const refDom = useRef(null);
  // 虚拟列表
  const refVirtualList = useRef<VirtualListHandle>(null);
  const refScrollElement = useRef<HTMLDivElement>(null);
  const refItemListWrapper = useRef<HTMLDivElement>(null);
  const refCanTriggerReachBottom = useRef(true);

  // 如果有分页的话，分页size
  const [pageSize, setPageSize] = useState(
    pagination && typeof pagination === 'object'
      ? pagination.pageSize || pagination.defaultPageSize || DEFAULT_PAGE_SIZE
      : DEFAULT_PAGE_SIZE
  );
  // 如果有分页的话，当前页码
  const [paginationCurrent, setPaginationCurrent] = useState(
    pagination && typeof pagination === 'object'
      ? pagination.current || pagination.defaultCurrent || DEFAULT_PAGE_CURRENT
      : DEFAULT_PAGE_CURRENT
  );
  const [pageCurrentForScroll, setPageCurrentForScroll] = useState(defaultCurrent);
  const childrenCount = React.Children.count(children);

  // 把list组件的引用绑定出去，手动控制父组件能拿到什么属性
  useImperativeHandle(listRef, () => {
    return {
      // 父元素拿到dom
      dom: refDom.current,
      scrollIntoView: (index, options?: ScrollIntoViewOptions) => {
        if (refVirtualList.current) {
          refVirtualList.current.scrollTo({ index, options });
        } else if (refItemListWrapper.current) {
          const node = refItemListWrapper.current.children[index];
          node &&
            scrollIntoView(node as HTMLElement, {
              boundary: refScrollElement.current,
              ...options,
            });
        }
      },
    };
  });

  // compatible with old API: height
  // 这个属性开启虚拟列表
  const virtualListProps = props.virtualListProps
    ? props.virtualListProps
    : props.height
    ? { height: props.height }
    : undefined;

  // pagination props
  const paginationProps: PaginationProps = {
    pageSize,
    current: paginationCurrent,
    // 分页总数，这里dataSource要比childrenCount优先级高
    total: dataSource.length > 0 ? dataSource.length : childrenCount,
    ...(typeof pagination === 'object' ? pagination : {}),
    // 传入pagination的配置，下面这俩会覆盖你传入的这俩函数
    onPageSizeChange: (size, current) => {
      setPageSize(size);
      改变size并且如果;
      // pagination && pagination.onPageSizeChange存在的话给调用，这样就让用户传入的onPageSizeChange能生效
      typeof pagination === 'object' &&
        pagination.onPageSizeChange &&
        pagination.onPageSizeChange(size, current);
    },
    onChange: (pageNumber: number, pageSize: number) => {
      setPaginationCurrent(pageNumber);
      // 与上面同理
      pagination &&
        typeof pagination === 'object' &&
        pagination.onChange &&
        pagination.onChange(pageNumber, pageSize);
    },
  };

  // 对当前页面进行处理，让current超出最大值不生效
  paginationProps.current = Math.min(
    paginationProps.current,
    Math.ceil(paginationProps.total / paginationProps.pageSize)
  );

  // !!是转化成布尔值类型，这里意思是 onListScroll onReachBottom 这俩函数只要传了一个就需要处理滚动
  const needHandleScroll = !!(onListScroll || onReachBottom);
  const throttledScrollHandler = useCallback(
    throttle(() => {
      // 如果onReachBottom无法满足需求，就可以用这个来自定义滚动处理函数
      if (onListScroll) {
        // 传进去的是个dom current
        onListScroll(refScrollElement.current);
        return;
      }

      const { scrollTop, scrollHeight, clientHeight } = refScrollElement.current;
      const scrollBottom = scrollHeight - (scrollTop + clientHeight);
      // 算出来的是，内容底部到浏览器可视区域的底部的距离

      // https://github.com/arco-design/arco-design/issues/850
      // offsetBottom + 1: scrollTop is a non-rounded number, while scrollHeight and clientHeight are both rounded
      // offsetBottom是用户传入，触发加载的阈值
      if (Math.abs(scrollBottom) < offsetBottom + 1) {
        // 给个flag叫refCanTriggerReachBottom 在 达到阈值时候置为false 没达到阈值的滚动再置为true
        if (refCanTriggerReachBottom.current) {
          setPageCurrentForScroll(pageCurrentForScroll + 1);
          // 这里触发用户传入的onReachBottom
          onReachBottom && onReachBottom(pageCurrentForScroll + 1);
          refCanTriggerReachBottom.current = false;
        }
      } else {
        refCanTriggerReachBottom.current = true;
      }
    }, throttleDelay),
    // 缓存这个函数，如果下面这些改变了才改变
    [throttleDelay, pageCurrentForScroll, onListScroll, onReachBottom]
  );

  // render content of list
  const renderListItems = () => {
    // get the data source to render current page
    const getCurrentPageItems = (items) => {
      const { current, pageSize } = paginationProps;
      // 计算初始值
      const startIndex = (current - 1) * pageSize;
      // 如果分页的话就返回对应页面那些数据，如果不是分页的话就返回全部
      return pagination && items.length > startIndex
        ? items.slice(startIndex, startIndex + pageSize)
        : items;
    };

    // The current page of the normal list children
    const getItems = (originItems: Array<any>, render?) => {
      const currentPageItems = getCurrentPageItems(originItems);
      // 如果有render函数就用render函数处理一下Item再返回出去，如果没有的话就直接返回，不做处理
      return render ? currentPageItems.map(render) : currentPageItems;
    };

    // The current page of the Grid list children
    // 生成grid布局的方法
    const getGrid = (originItems: Array<any>, render?) => {
      const currentPageItems = getCurrentPageItems(originItems);

      if (grid.column || grid.span) {
        const items: React.ReactNode[] = [];
        const { gutter, justify, align, column: gridRowSize, ...colProps } = grid;
        const rowSize = gridRowSize || Math.floor(24 / grid.span);
        const span = colProps.span || Math.floor(24 / rowSize);

        let startNum = 0;
        while (startNum < currentPageItems.length) {
          const nextStartNum = startNum + rowSize;
          const currentRow = ~~(startNum / rowSize);
          items.push(
            <Row
              key={currentRow}
              className={`${prefixCls}-row`}
              gutter={gutter}
              justify={justify}
              align={align}
            >
              {currentPageItems.slice(startNum, nextStartNum).map((item, index) => (
                <Col
                  key={`${currentRow}_${index}`}
                  className={`${prefixCls}-row-col`}
                  {...colProps}
                  span={span}
                >
                  {render ? render(item, startNum + index) : item}
                </Col>
              ))}
            </Row>
          );
          startNum = nextStartNum;
        }

        return items;
      }

      return (
        <Row className={`${prefixCls}-row`} gutter={grid.gutter}>
          {currentPageItems.map((item, index) => (
            <Col className={`${prefixCls}-row-col`} {...omit(grid, ['gutter'])} key={index}>
              {render ? render(item, index) : item}
            </Col>
          ))}
        </Row>
      );
    };

    // 传入dataSource优先级高于children
    if (dataSource.length > 0 && render) {
      return grid ? getGrid(dataSource, render) : getItems(dataSource, render);
    }
    if (childrenCount > 0) {
      return grid ? getGrid(children as []) : getItems(children as []);
    }
    // 如果上面两条都没有命中并且滚动loading为false时候就返回空状态
    // 空状态先看用户有没有传入noDataElement然后拿ctx里面的renderEmpty
    if (!scrollLoading) {
      return noDataElement || renderEmpty('List');
    }

    return null;
  };

  const renderList = () => {
    // 拿到 ListItems
    const listItems = renderListItems();
    // 传递虚拟列表属性，传入此参数以开启虚拟滚动
    const isVirtual = virtualListProps && Array.isArray(listItems);
    const paginationElement = pagination ? (
      <Pagination
        {...paginationProps}
        className={cs(`${prefixCls}-pagination`, paginationProps && paginationProps.className)}
      />
    ) : null;
    // 下一个大版本要移除掉
    const paginationElementInsideFooter = paginationInFooter ? paginationElement : null;
    const paginationElementOutsideFooter = paginationInFooter ? null : paginationElement;

    const scrollLoadingEle =
      scrollLoading !== undefined && scrollLoading !== null ? (
        <div className={`${prefixCls}-item ${prefixCls}-scroll-loading`}>{scrollLoading}</div>
      ) : null;

    return (
      <div
        ref={(_ref) => {
          ref = _ref;
          refDom.current = ref;
        }}
        style={wrapperStyle}
        className={cs(
          `${prefixCls}-wrapper`,
          { [`${prefixCls}-wrapper-rtl`]: rtl },
          wrapperClassName
        )}
      >
        <div
          style={style}
          className={cs(
            prefixCls,
            `${prefixCls}-${size}`,
            {
              [`${prefixCls}-no-border`]: !bordered,
              [`${prefixCls}-no-split`]: !split,
              [`${prefixCls}-hoverable`]: hoverable,
              [`${prefixCls}-rtl`]: rtl,
            },
            className
          )}
          ref={(ref) => {
            if (!isVirtual) {
              refScrollElement.current = ref;
            }
          }}
          // 判断不是虚拟列表并且需要处理滚动就给他throttledScrollHandler
          onScroll={!isVirtual && needHandleScroll ? throttledScrollHandler : undefined}
        >
          {/* 列表头部 */}
          {header ? <div className={`${prefixCls}-header`}>{header}</div> : null}

          {/* 判断是不是虚拟Dom */}
          {isVirtual ? (
            <>
              <VirtualList
                role="list"
                ref={(ref) => {
                  if (ref) {
                    refVirtualList.current = ref;
                    refScrollElement.current = ref.dom as HTMLDivElement;
                  }
                }}
                className={`${prefixCls}-content ${prefixCls}-virtual`}
                data={scrollLoadingEle ? listItems.concat(scrollLoadingEle) : listItems}
                isStaticItemHeight={false}
                onScroll={needHandleScroll ? throttledScrollHandler : undefined}
                {...virtualListProps}
              >
                {(child) => child}
              </VirtualList>
            </>
          ) : (
            <div role="list" className={`${prefixCls}-content`} ref={refItemListWrapper}>
              {listItems}
              {scrollLoadingEle}
            </div>
          )}

          {/* paginationElementInsideFooter已经废弃 */}
          {/* 渲染列表底部 */}
          {footer || paginationElementInsideFooter ? (
            <div className={`${prefixCls}-footer`}>
              {footer}
              {paginationElementInsideFooter}
            </div>
          ) : null}
        </div>

        {/* 这个已经废弃 */}
        {paginationElementOutsideFooter}
      </div>
    );
  };

  // 这里判断是不是在loading然后渲染
  return 'loading' in props ? (
    <Spin style={{ display: 'block' }} loading={loading} element={loadingElement || <Spin />}>
      {renderList()}
    </Spin>
  ) : (
    renderList()
  );
}

interface ForwardRefListType
  extends React.ForwardRefExoticComponent<
    React.PropsWithoutRef<ListProps> & React.RefAttributes<HTMLDivElement>
  > {
  <T = any>(
    props: React.PropsWithChildren<ListProps<T>> & {
      ref?: React.Ref<HTMLDivElement>;
    }
  ): React.ReactElement;
  Item: typeof Item;
}

const ListComponent = React.forwardRef<HTMLDivElement, ListProps>(List) as ForwardRefListType;

ListComponent.displayName = 'List';

ListComponent.Item = Item;

export default ListComponent;

export { ListProps };
