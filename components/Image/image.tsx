import React, { useContext, useEffect, useMemo, LegacyRef, useRef } from 'react';
import cs from '../_util/classNames';
import { ConfigContext } from '../ConfigProvider';
import IconLoading from '../../icon/react-icon/IconLoading';
import IconImageClose from '../../icon/react-icon/IconImageClose';
import { ImageProps, ImagePreviewProps } from './interface';
import { ImageFooter } from './image-footer';
import ImagePreview from './image-preview';
import ImagePreviewGroup from './image-preview-group';
import useShowFooter from './utils/hooks/useShowFooter';
import useImageStatus from './utils/hooks/useImageStatus';
import useMergeValue from '../_util/hooks/useMergeValue';
import omit from '../_util/omit';
import { isNumber } from '../_util/is';
import { PreviewGroupContext } from './previewGroupContext';
import { isServerRendering } from '../_util/dom';
import useMergeProps from '../_util/hooks/useMergeProps';

type ImagePropsType = ImageProps & { _index?: number };

let uuid = 0;

const defaultProps: ImagePropsType = {
  footerPosition: 'inner',
  preview: true,
};

function Image(baseProps: ImagePropsType, ref: LegacyRef<HTMLDivElement>) {
  const { getPrefixCls, componentConfig, rtl } = useContext(ConfigContext);
  const props = useMergeProps<ImagePropsType>(baseProps, defaultProps, componentConfig?.Image);
  const {
    style,
    className,
    src,
    width,
    height,
    title,
    description,
    actions, // 额外操作 ReactNode[]
    footerPosition, // 底部显示的位置,是内联的还是单独在外的
    simple, // 是否开启简洁模式，简洁模式下，actions在一个more图标上，des也不在显示
    loader, // 加载过渡效果，为 true 显示默认加载效果 ReactNode
    loaderClassName, // loader 的样式，将覆盖默认过渡效果
    error, // error 状态下显示的内容	ReactNode
    preview, // 是否开启预览
    previewProps = {} as ImagePreviewProps, // 预览的配置项 （所有选项都是可选的）I
    alt,
    onClick,
    index,
    _index,
    ...restProps
  } = props;

  const {
    previewGroup,
    setVisible: setGroupPreviewVisible,
    registerPreviewUrl,
    setCurrentIndex,
  } = useContext(PreviewGroupContext);
  const previewSrc = previewProps.src || src;

  const id = useMemo(() => {
    if (isNumber(index) || isNumber(_index)) {
      // 以index为优先
      uuid = isNumber(index) ? index : _index;
      return uuid;
    }
    return uuid++;
  }, []);

  // 这个hooks，判断是不是展示底部footer
  const [showFooter] = useShowFooter({ title, description, actions });
  const { isLoading, isError, isLoaded, setStatus } = useImageStatus('beforeLoad');
  const [previewVisible, setPreviewVisible] = useMergeValue(false, {
    defaultValue: previewProps.defaultVisible,
    value: previewProps.visible,
  });

  // Props passed directly into Preivew component
  const availablePreviewProps = omit(previewProps, [
    'visible',
    'defaultVisible',
    'src',
    'onVisibleChange',
  ]);

  const prefixCls = getPrefixCls('image');
  const classNames = cs(
    prefixCls,
    {
      [`${prefixCls}-rtl`]: rtl,
      [`${prefixCls}-simple`]: simple,
      [`${prefixCls}-loading`]: isLoading,
      [`${prefixCls}-loading-error`]: isError,
      [`${prefixCls}-with-footer-inner`]: isLoaded && showFooter && footerPosition === 'inner',
      [`${prefixCls}-with-footer-outer`]: isLoaded && showFooter && footerPosition === 'outer',
    },
    className
  );

  // 拿到当前图片的ref
  const refImg = useRef<HTMLImageElement>();

  function onImgLoaded() {
    setStatus('loaded');
  }

  function onImgLoadError() {
    setStatus('error');
  }

  // 点击图片预览大图
  function onImgClick(e) {
    if (preview && previewGroup) {
      setCurrentIndex(id);
      setGroupPreviewVisible(true);
    } else if (preview) {
      togglePreviewVisible(true);
    }
    onClick && onClick(e);
  }

  function onPreviewVisibleChange(visible) {
    togglePreviewVisible(visible);
  }

  // 点击切换预览图片与否
  function togglePreviewVisible(newVisible) {
    previewProps.onVisibleChange && previewProps.onVisibleChange(newVisible, previewVisible);
    setPreviewVisible(newVisible);
  }

  // 监听src变化，改变image的src属性
  useEffect(() => {
    if (isServerRendering || !refImg.current) return;
    refImg.current.src = src;
    setStatus('loading');
  }, [src]);

  useEffect(() => {
    if (!previewGroup) return;
    const unRegister = registerPreviewUrl(id, previewSrc, preview);
    return () => {
      unRegister(id);
    };
  }, [previewGroup]);

  useEffect(() => {
    if (!previewGroup) return;
    registerPreviewUrl(id, previewSrc, preview);
  }, [previewSrc, preview, previewGroup]);

  const defaultError = (
    <div className={`${prefixCls}-error`}>
      <div className={`${prefixCls}-error-icon`}>
        <IconImageClose />
      </div>
      {alt && <div className={`${prefixCls}-error-alt`}>{alt}</div>}
    </div>
  );

  const defaultLoader = (
    <div className={`${prefixCls}-loader`}>
      <div className={`${prefixCls}-loader-spin`}>
        <IconLoading />
        <div className={`${prefixCls}-loader-spin-text`}>Loading</div>
      </div>
    </div>
  );

  // 如果传入loader的话，说明是渐进式加载
  const renderLoader = () => {
    if (loader === true) return defaultLoader;
    // loaderClassName会覆盖默认的加载loader
    if (loaderClassName) return <div className={cs(`${prefixCls}-loader`, loaderClassName)} />;
    return loader || null;
  };

  return (
    <div className={classNames} style={Object.assign({ width, height }, style)} ref={ref}>
      <img
        ref={refImg}
        className={`${prefixCls}-img`}
        {...restProps}
        title={title}
        width={width}
        height={height}
        onLoad={onImgLoaded}
        onError={onImgLoadError}
        onClick={onImgClick}
        alt={alt}
      />
      {/* 如果没有isLoaded，那看看是正在加载还是加载失败了 */}
      {!isLoaded && (
        <div className={`${prefixCls}-overlay`}>
          {isError && (error || defaultError)}
          {isLoading && renderLoader()}
        </div>
      )}
      {/* 如果加载完成并且展示底部，然后渲染ImageFooter组件 */}
      {isLoaded && showFooter && (
        <ImageFooter
          title={title}
          description={description}
          actions={actions}
          prefixCls={prefixCls}
          simple={simple}
        />
      )}
      {/* 如果加载完成并且传入preview是true，就渲染预览组件，但预览组件到底展示不展示，要看previewVisible */}
      {isLoaded && preview && (
        <ImagePreview
          visible={previewVisible}
          src={previewSrc}
          {...availablePreviewProps}
          onVisibleChange={onPreviewVisibleChange}
        />
      )}
    </div>
  );
}

const RefImageComponent = React.forwardRef<HTMLDivElement, ImagePropsType>(Image);

const ImageComponent = RefImageComponent as typeof RefImageComponent & {
  Preview: typeof ImagePreview;
  PreviewGroup: typeof ImagePreviewGroup;
};

ImageComponent.Preview = ImagePreview;

ImageComponent.PreviewGroup = ImagePreviewGroup;

ImageComponent.displayName = 'Image';

export default ImageComponent;
