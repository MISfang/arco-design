import React, { useContext } from 'react';
import cs from '../_util/classNames';
import { ConfigContext } from '../ConfigProvider';
import { CardMetaProps } from './interface';

function Meta(props: CardMetaProps, ref) {
  const { className, title, avatar, description, actionList, ...others } = props;
  const { getPrefixCls } = useContext(ConfigContext);
  const prefixCls = getPrefixCls('card-meta');
  const classNames = cs(prefixCls, className);

  return (
    <div {...others} ref={ref} className={classNames}>
      {/* title 或者 description存在 */}
      {title || description ? (
        <div className={`${prefixCls}-content`}>
          {title && <div className={`${prefixCls}-title`}>{title}</div>}
          {description && <div className={`${prefixCls}-description`}>{description}</div>}
        </div>
      ) : null}
      {/* avatar或者actionList存在 */}
      {avatar || actionList ? (
        <div
          className={cs(`${prefixCls}-footer `, { [`${prefixCls}-footer-only-actions`]: !avatar })}
        >
          {avatar ? <div className={`${prefixCls}-avatar`}>{avatar}</div> : null}
          {actionList}
        </div>
      ) : null}
    </div>
  );
}

const MetaComponent = React.forwardRef<unknown, CardMetaProps>(Meta);

MetaComponent.displayName = 'CardMeta';

export default MetaComponent;

export { CardMetaProps };
