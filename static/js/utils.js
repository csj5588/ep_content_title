function debounce(func, wait) {
  var timer;
  return function() {
    const context = this;
    const args = arguments;

    clearTimeout(timer);

    /// 第一次
    if (!timer) {
      func.apply(context, args);
    }
    timer = setTimeout(function() {
      console.log('???')
      func.apply(context, args);
    }, wait)
  }
}

exports.debounce = debounce;
