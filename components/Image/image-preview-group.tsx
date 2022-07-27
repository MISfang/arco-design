import React, {
  forwardRef,
  PropsWithChildren,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import useIsFirstRender from '../_util/hooks/useIsFirstRender';
import useMergeValue from '../_util/hooks/useMergeValue';
import ImagePreview, { ImagePreviewHandle } from './image-preview';
import { ImagePreviewGroupProps } from './interface';
import { PreviewGroupContext, PreviewUrlMap } from './previewGroupContext';

export { ImagePreviewGroupProps };

export interface ImagePreviewGroupHandle {
  reset: () => void;
}

function PreviewGroup(props: PropsWithChildren<ImagePreviewGroupProps>, ref) {
  const {
    children,
    srcList,
    infinite,
    current: propCurrentIndex,
    defaultCurrent,
    onChange,
    visible: propVisible,
    defaultVisible,
    onVisibleChange,
    ...restProps
  } = props;

  const [visible, setVisible] = useMergeValue(false, {
    value: propVisible,
    defaultValue: defaultVisible,
  });

  const propPreviewUrlMap: PreviewUrlMap | null = useMemo(
    () => (srcList ? new Map(srcList.map((url, index) => [index, { url, preview: true }])) : null),
    [srcList]
  );

  const isFirstRender = useIsFirstRender();
  const getPreviewUrlMap = () => (propPreviewUrlMap ? new Map(propPreviewUrlMap) : new Map());
  const [previewUrlMap, setPreviewUrlMap] = useState<PreviewUrlMap>(getPreviewUrlMap());

  useEffect(() => {
    if (isFirstRender) return;
    setPreviewUrlMap(getPreviewUrlMap());
  }, [propPreviewUrlMap]);

  // 过滤出来每个图片是否能预览的数组
  const canPreviewUrlMap = new Map(
    Array.from(previewUrlMap)
      .filter(([, { preview }]) => preview)
      .map(([id, { url }]) => [id, url])
  );

  // 当前在预览的图片ID
  const [currentIndex, setCurrentIndex] = useMergeValue(0, {
    value: propCurrentIndex,
    defaultValue: defaultCurrent,
  });

  function registerPreviewUrl(id: number, url: string, preview: boolean) {
    if (!propPreviewUrlMap) {
      // setState的时候，如果传入一个函数，那么这个回调函数里面会给你上一次的state值
      setPreviewUrlMap((pre) =>
        new Map(pre).set(id, {
          url,
          preview,
        })
      );
    }
    return function unRegisterPreviewUrl() {
      if (!propPreviewUrlMap) {
        setPreviewUrlMap((pre) => {
          const cloneMap = new Map(pre);
          const hasDelete = cloneMap.delete(id);
          return hasDelete ? cloneMap : pre;
        });
      }
    };
  }

  const refPreview = useRef<ImagePreviewHandle>();

  useImperativeHandle<any, ImagePreviewGroupHandle>(ref, () => ({
    reset: () => {
      refPreview.current && refPreview.current.reset();
    },
  }));

  const handleVisibleChange = (visible, preVisible) => {
    setVisible(visible);
    // 切换是否预览的会触发这个钩子，传入当前预览值以及上次预览的值
    onVisibleChange && onVisibleChange(visible, preVisible);
  };

  const handleSwitch = (index: number) => {
    // 左右点击切换预览图片时候触发onChage回调
    onChange && onChange(index);
    setCurrentIndex(index);
  };

  const loopImageIndex = (children) => {
    let index = 0;

    const loop = (children) => {
      // 有点像Array.map 第一个参数绑定this，第二个参数开始才是要传入的参数
      // 只有节点的displayName === 'Image'，也就是Image组件时，才会渲染，其他一律不渲染
      return React.Children.map(children, (child) => {
        if (child && child.props && child.type) {
          const displayName = child.type.displayName;
          if (displayName === 'Image') {
            return React.cloneElement(child, { _index: index++ });
          }
        }

        if (child && child.props && child.props.children) {
          return React.cloneElement(child, {
            children: loop(child.props.children),
          });
        }
        return child;
      });
    };

    return loop(children);
  };

  return (
    <PreviewGroupContext.Provider
      value={{
        previewGroup: true,
        previewUrlMap: canPreviewUrlMap, // 要预览的数组
        infinite, // 是否开启无限循环 boolean
        currentIndex, // 当前在预览的是哪一张图片
        setCurrentIndex: handleSwitch, // 切换在预览图片的handle
        setPreviewUrlMap,
        registerPreviewUrl,
        visible,
        setVisible,
      }}
    >
      {/* 这里渲染Image数组 */}
      {loopImageIndex(children)}
      {/* 下面才是ImagePreview的组件 */}
      <ImagePreview
        ref={refPreview}
        src=""
        visible={visible}
        onVisibleChange={handleVisibleChange}
        {...restProps}
      />
    </PreviewGroupContext.Provider>
  );
}

const PreviewGroupComponent = forwardRef<
  ImagePreviewGroupHandle,
  PropsWithChildren<ImagePreviewGroupProps>
>(PreviewGroup);

PreviewGroupComponent.displayName = 'ImagePreviewGroup';

export default PreviewGroupComponent;
