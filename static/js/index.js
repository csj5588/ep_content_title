const { debounce } = require('./utils');

const titleRef = {
  /**
   * 标题盒子的高度，用于计算ACE需要让出多少上内边距
   */
  height: 0,
  /**
   * 判断是否是输入法
   */
  isComposition: false,
  /**
   * 初始化的标题
   */
  initialzeTitle: ''
}

exports.documentReady = () => {
  console.log('clientVars.ep_set_title_on_pad', clientVars)
}

exports.postToolbarInit = (hook, context) => {
  const padOuter = $('iframe[name="ace_outer"]').contents().find('body');

  padOuter.prepend($('.ep-content-title-container'))
}

const sendTitle = (title) => {
  const myAuthorId = pad.getUserId();
  const padId = pad.getPadId();
  // Send chat message to send to the server
  const message = {
    type: 'title',
    action: 'sendTitleMessage',
    message: title,
    padId,
    myAuthorId,
  };

  pad.collabClient.sendMessage(message); // Send the chat position message to the server
};

exports.postAceInit = (hook, context) => {
  const padOuter = $('iframe[name="ace_outer"]').contents().find('body');
  const padInnerBody = padOuter.contents('iframe').contents().find('body');

  const container = $('iframe[name="ace_outer"]').contents().find('.ep-content-title-container');
  const titleAce = $('iframe[name="ace_outer"]').contents().find('.ep-content-title');

  const hasMobileLayout = $('body').hasClass('mobile-layout');

  /**
   * 初始化标题
   */
  titleAce[0].innerHTML = titleRef.initialzeTitle;

  /**
   * 布局检测, 并且持续监听window.resize做出布局调整
   */
  const checkWindowHasMobileLayoutDebounce = debounce(function() {
    const hasMobileLayout = $('body').hasClass('mobile-layout');

    if (hasMobileLayout) {
      titleAce.css({ 'padding': '0 0 0 13px' })
      container.css({ 'left': '0' })
      padInnerBody.css({ 'padding-top': $(container).height() + 22 + 'px' })
    } else {
      titleAce.css({ 'padding': '40px 54px 0 54px' })
      padInnerBody.css({ 'padding-top': $(container).height() - 22 + 'px' })
    }
  }, 100)

  const checkWindowHasMobileLayout = () => {
    checkWindowHasMobileLayoutDebounce();
    $(window).resize(checkWindowHasMobileLayoutDebounce);
  }

  checkWindowHasMobileLayout()

  /**
   * 编辑器初始化完毕后进行title展示
   * 1.初始化ACE的上内边距 ⬆️
   * 2.拿到初始化时候的titleAce的高度值，并备份
   */
  $(container).css('opacity', '1');

  titleRef.height = $(container).height();

  /**
   * 键盘拦截事件
   * 拦截Enter并且代理为pad focus
   */
  $(titleAce).keypress(function(event) {
    if (event.originalEvent.keyCode === 13) {
      context.ace.focus()
      event.preventDefault();
    }
  });

  /**
   * 内容变化监听
   * 高度变化监听
   * 输入法事件处理
   */
  const debounceSendTitle = debounce(sendTitle, 1000);

  $(titleAce).bind("input propertychange", function(e){
    const titleHeight = $(container).height();

    if (titleRef.height !== titleHeight) {
      /**
       * 备份并且调整ACE上内边距
       */
      if (hasMobileLayout) {
        padInnerBody.css({ 'padding-top': titleHeight + 22 + 'px' })
      } else {
        padInnerBody.css({ 'padding-top': titleHeight - 22 + 'px' })
      }
      titleRef.height = titleHeight;
    }

    if (titleRef.isComposition) return;
    /**
     * 协同title
     */
    debounceSendTitle(e.target.innerText)
  });

  /**
   * 输入法事件
   */
  titleAce[0].addEventListener('compositionstart', (event) => {
    titleRef.isComposition = true;
  });
  titleAce[0].addEventListener('compositionend', (event) => {
    titleRef.isComposition = false;
    sendTitle($(titleAce).text());
  });

  /**
   * 粘贴事件拦截
   * 目前处理为拦截，后续如果有需求可以放开，填写后续逻辑
   */
  $(titleAce).on('paste', function(e) {
    let pastedText = undefined;
    if(window.clipboardData && window.clipboardData.getData) {
      pastedText = window.clipboardData.getData('Text')       
    } else if((e.clipboardData || e.originalEvent.clipboardData) && (e.clipboardData || e.originalEvent.clipboardData).getData) {
      pastedText = (e.originalEvent || e).clipboardData.getData('text/plain')
    }
    e.preventDefault();
  });
}

exports.aceEditorCSS = () => ['ep_content_title/static/css/style.css'];

/**
 * 这里有个光标问题
 * 使用range解决
 */
exports.handleClientMessage_CUSTOM = (hook, context, cb) => {
  if (context.payload.action === 'recieveTitleMessage') {
    const message = context.payload.message;

    /**
     * 标题第一次回填，不必处理光标等问题。
     * 回填具体操作转到postAceInit中，因为我们的标题在OuterPad中
     */
    if (!titleRef.initialzeTitle) {
      titleRef.initialzeTitle = message;
      cb(null);
      return;
    }

    if (message) {
      const padOuter = $('iframe[name="ace_outer"]')
      const titleAce = $('iframe[name="ace_outer"]').contents().find('.ep-content-title');

      window.document.title = message;
      titleAce[0].innerHTML = message;
    
      const range = padOuter[0].contentWindow.getSelection();
      range.selectAllChildren(titleAce[0]);
      range.collapseToEnd();

      clientVars.ep_set_title_on_pad = {};
      clientVars.ep_set_title_on_pad.title = message;
    }
  }
  cb(null);
};