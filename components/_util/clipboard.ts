// https://github.com/feross/clipboard-copy/blob/master/index.js

// TODO:copy函数，可以复制
export default async function clipboard(text) {
  // 如果用户自己重写了navigator的copy函数，就用用户写的
  if (navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      // 仅在执行成功时返回
      return;
    } catch (err) {
      console.error(err ?? new DOMException('The request is not allowed', 'NotAllowedError'));
    }
  }

  // 新建一个span标签并插入document中
  const span = document.createElement('span');
  span.textContent = text;

  span.style.whiteSpace = 'pre';

  document.body.appendChild(span);

  const selection = window.getSelection();
  const range = window.document.createRange();
  selection.removeAllRanges();
  range.selectNode(span);
  selection.addRange(range);

  let success = false;
  try {
    success = window.document.execCommand('copy');
  } catch (err) {
    // eslint-disable-next-line
    console.log('error', err);
  }

  selection.removeAllRanges();
  window.document.body.removeChild(span);

  return success
    ? Promise.resolve()
    : Promise.reject(new DOMException('The request is not allowed', 'NotAllowedError'));
}
