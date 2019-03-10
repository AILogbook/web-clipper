import { codeCallWithContext } from '../utils/plugin';

const getFullPage = (context: ClipperPluginContext) => {
  const { turndown, $ } = context;
  const $body = $('html').clone();
  $body.find('script').remove();
  $body.find('style').remove();
  $body.removeClass();
  return turndown.turndown($body.html());
};

const getReadability = (context: ClipperPluginContext) => {
  const { turndown, document, Readability } = context;
  let documentClone = document.cloneNode(true);
  let article = new Readability(documentClone).parse();
  return turndown.turndown(article.content);
};

const selectElement = async (context: ClipperPluginContext) => {
  const { turndown, Highlighter, toggleClipper } = context;
  toggleClipper();
  const data = await new Highlighter().start();
  toggleClipper();
  return turndown.turndown(data);
};

const bookmark = async (context: ClipperPluginContext) => {
  const { document } = context;
  return `## 链接 \n ${document.URL} \n ## 备注: \n`;
};

export const getFullPagePlugin: ClipperPlugin = {
  type: 'clipper',
  id: 'DiamondYuan/fullPage',
  version: '0.0.1',
  name: '整个页面',
  icon: 'copy',
  description: '保存整个页面',
  script: codeCallWithContext(getFullPage)
};

export const getSelectItemPlugin: ClipperPlugin = {
  type: 'clipper',
  id: 'DiamondYuan/selectItem',
  version: '0.0.1',
  name: '手动选取',
  icon: 'select',
  script: codeCallWithContext(selectElement)
};

export const getReadabilityPlugin: ClipperPlugin = {
  type: 'clipper',
  id: 'DiamondYuan/readability',
  version: '0.0.1',
  name: '智能提取',
  icon: 'copy',
  script: codeCallWithContext(getReadability),
  description: '智能分析出页面的主要部分'
};

export const bookmarkPlugin: ClipperPlugin = {
  type: 'clipper',
  id: 'DiamondYuan/bookmark',
  version: '0.0.1',
  name: '书签',
  icon: 'link',
  description: '保存网页链接和增加备注',
  script: codeCallWithContext(bookmark)
};

export const removeElement: ToolPlugin = {
  type: 'tool',
  id: 'DiamondYuan/removeElement',
  version: '0.0.1',
  name: 'removeElement',
  icon: 'delete',
  description: '删除页面元素',
  processingDocumentObjectModel: codeCallWithContext(
    async (context: ClipperPluginContext) => {
      const { $, Highlighter, toggleClipper } = context;
      toggleClipper();
      const data = await new Highlighter().start();
      $(data).remove();
      toggleClipper();
    }
  )
};

export const selectElementTool: ToolPlugin = {
  type: 'tool',
  id: 'DiamondYuan/selectElement',
  version: '0.0.1',
  name: 'selectElement',
  icon: 'select',
  description: '选择页面元素',
  processingDocuments: codeCallWithContext((context: PagePluginContext) => {
    const { currentData, previous } = context;
    return `${currentData}\n${previous}`;
  }),
  processingDocumentObjectModel: codeCallWithContext(
    async (context: ClipperPluginContext) => {
      const { turndown, Highlighter, toggleClipper } = context;
      toggleClipper();
      const data = await new Highlighter().start();
      toggleClipper();
      return turndown.turndown(data);
    }
  )
};

export const uploadImage: ToolPlugin = {
  type: 'tool',
  id: 'DiamondYuan/uploadImage',
  version: '0.0.1',
  name: 'uploadImage',
  icon: 'sync',
  description: '同步图片到语雀图床',
  processingDocuments: codeCallWithContext(
    async (context: PagePluginContext) => {
      const { currentData, imageService, message } = context;
      let foo = currentData;
      const result = currentData.match(/!\[.*?\]\(http(.*?)\)/g);
      if (result) {
        const images: string[] = result
          .map(o => {
            const temp = /!\[.*?\]\((http.*?)\)/.exec(o);
            if (temp) {
              return temp[1];
            }
            return '';
          })
          .filter(o => o && !o.startsWith('https://cdn-pri.nlark.com'));
        for (let image of images) {
          try {
            const url = await imageService.uploadImageUrl(image);
            foo = foo.replace(image, url);
          } catch (error) {}
        }
      }
      message.info('上传图片成功');
      return foo;
    }
  )
};
